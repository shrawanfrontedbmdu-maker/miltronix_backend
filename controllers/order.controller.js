import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";
import Address from "../models/address.model.js";
import Cart from "../models/cart.model.js";
import Coupon from "../models/coupons.model.js";

export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find();
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({
      message: "Couldn't get orders",
    });
  }
};

const generateDeliveryNumber = () => {
  return 'DLV-' + Date.now().toString().slice(-6);
};

/**
 * Helper: Resolve address from ID, object, or user's default address
 * @param {string} addressId - ObjectId of saved Address
 * @param {object} addressObj - Inline address object
 * @param {string} userId - User ID (to fetch default address)
 * @returns {Promise<object>} Resolved address object
 */
const resolveAddress = async (addressId, addressObj, userId) => {
  // Case 1: Address ID provided -> fetch from Address collection
  if (addressId) {
    const address = await Address.findById(addressId);
    if (!address) throw new Error("Address not found");
    return address.toObject();
  }

  // Case 2: Address object provided inline -> use it
  if (addressObj && typeof addressObj === "object" && Object.keys(addressObj).length > 0) {
    return addressObj;
  }

  // Case 3: No address provided -> try user's default address
  if (userId) {
    const address = await Address.findOne({ userId, isDefault: true });
    if (address) return address.toObject();
  }

  throw new Error("Shipping address is required (provide addressId, address object, or set a default address)");
};


export const createOrder = async (req, res) => {
  try {
    const { user: userId, customer: customerBody, customerName, couponCode, shippingAddressId, shippingAddress, billingAddressId, billingAddress,paymentMethod} = req.body;

    console.log("Incoming order body:", req.body);

    // Validate required fields (either address object or id must be provided)
    if (!shippingAddress && !shippingAddressId) {
      return res.status(400).json({
        success: false,
        message: "Shipping address or shippingAddressId is required",
      });
    }

    // Validate user exists
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Fetch cart items
    const cartItems = await Cart.findOne({ user: userId }).populate({
      path: "items.product",
      select: "name variants images category",
    });

    if (!cartItems || cartItems.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    // Build order items from cart, validate & get prices from DB
    const orderItems = [];
    for (const cartItem of cartItems.items) {
      const product = cartItem.product;

      if (!product) {
        return res.status(400).json({
          message: `Product not found for cart item`,
        });
      }

      const productId = product._id;
      const quantity = cartItem.quantity || 1;
      const sku = cartItem.variant?.sku;

      // Find variant by sku or use first variant
      let variant = null;
      if (sku && Array.isArray(product.variants)) {
        variant = product.variants.find((v) => v.sku === sku);
      }
      if (!variant && Array.isArray(product.variants) && product.variants.length) {
        variant = product.variants[0];
      }

      if (!variant) {
        return res.status(400).json({
          message: `Variant not found for product: ${product.name}`,
        });
      }

      const unitPrice = variant.price || 0;

      orderItems.push({
        productId,
        sku: variant.sku,
        name: product.name,
        quantity,
        unitPrice,
        taxAmount: 0,
        discountAmount: 0,
      });
    }

    // Compute totals server-side
    const subtotal = orderItems.reduce((s, it) => s + (it.unitPrice || 0) * (it.quantity || 0), 0);
    const taxRate = Number(req.body.taxRate || 0);
    const taxAmount = taxRate ? +(subtotal * (taxRate / 100)) : 0;
    const shippingCost = Number(req.body.shippingCost || 0);
    let discountAmount = Number(req.body.discountAmount || 0);

    // Calculate coupon discount
    let couponDiscount = 0;
    let couponError = null;
    let couponId = null;

    if (couponCode) {
      try {
        const coupon = await Coupon.findOne({ code: couponCode });
        // convert to couponId for downstream checks
        couponId = coupon?._id;

        if (!coupon) {
          couponError = "Coupon not found";
        } else if (coupon.status !== "active") {
          couponError = "Coupon is not active";
        } else if (new Date() > new Date(coupon.expiryDate)) {
          couponError = "Coupon has expired";
        } else if (new Date() < new Date(coupon.startDate)) {
          couponError = "Coupon is not yet valid";
        } else if (subtotal < coupon.minOrderValue) {
          couponError = `Minimum order value of ₹${coupon.minOrderValue} required`;
        } else if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
          couponError = "Coupon usage limit reached";
        } else {
          // Check usage per customer
          if (coupon.usageLimitPerCustomer) {
            const userOrdersWithCoupon = await Order.countDocuments({
              userId,
              couponId,
            });

            if (userOrdersWithCoupon >= coupon.usageLimitPerCustomer) {
              couponError = "You have already used this coupon maximum times";
            }
          }

          // Check first purchase only
          if (coupon.firstPurchaseOnly) {
            const previousOrders = await Order.countDocuments({ userId });
            if (previousOrders > 0) {
              couponError = "This coupon is only valid for first purchase";
            }
          }

          // Calculate discount if no errors
          if (!couponError) {
            if (coupon.discountType === "PERCENTAGE") {
              couponDiscount = (subtotal * coupon.discountValue) / 100;
              if (coupon.maxDiscount && couponDiscount > coupon.maxDiscount) {
                couponDiscount = coupon.maxDiscount;
              }
            } else if (coupon.discountType === "FLAT") {
              couponDiscount = coupon.discountValue;
            }

            couponDetails = {
              couponId: coupon._id,
              code: coupon.code,
              title: coupon.title,
              discountType: coupon.discountType,
              discountValue: coupon.discountValue,
              appliedDiscount: couponDiscount,
            };
          }
        }
      } catch (error) {
        couponError = "Error validating coupon";
      }
    }

    const totalAmount = +(subtotal + taxAmount + shippingCost - couponDiscount).toFixed(2);

    // Customer snapshot (prefer user data)
    const customer = {
      name: user.fullName || customerName || customerBody?.name || "Customer",
      email: user.email || customerBody?.email,
      phone: user.mobile || customerBody?.phone,
      company: customerBody?.company,
    };

    // Resolve shipping & billing addresses (ID -> object, fallback to default)
    let finalShippingAddress, finalBillingAddress;
    try {
      finalShippingAddress = await resolveAddress(shippingAddressId, shippingAddress, userId);
      finalBillingAddress = await resolveAddress(billingAddressId, billingAddress || shippingAddress, userId);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }

    const orderDoc = {
      user: userId,
      customer,
      items: orderItems,
      shippingAddress: finalShippingAddress,
      billingAddress: finalBillingAddress,
      coupon: couponId || undefined,
      couponCode: couponCode || undefined,
      subtotal,
      taxAmount,
      shippingCost,
      discountAmount,
      totalAmount,
      currency: req.body.currency || "INR",
      payment: {
        method: req.body.paymentMethod || "COD",
        status: req.body.paymentStatus || "Pending",
        transactionId: req.body.transactionId || undefined,
      },
      fulfillment: { orderStatus: req.body.orderStatus || "Processing" },
      priority: req.body.priority || "Normal",
      notes: req.body.notes || "",
      isActive: true,
      trackingnumber: generateDeliveryNumber(),
    };

    const newOrder = await Order.create(orderDoc);

    // Increment coupon usage
    if (couponId) {
      await Coupon.findByIdAndUpdate(couponId, { $inc: { usedCount: 1 } }).catch(() => {});
    }

    // Clear cart after order creation
    await Cart.findOneAndDelete({ user: userId });

    res.status(201).json({ message: "Order created successfully", data: newOrder });
  } catch (error) {
    console.error("Order creation failed:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: "Validation Error", errors: error.errors });
    }
    res.status(500).json({ message: "Couldn't create order", error: error.message });
  }
};

export const getOrdersByMonth = async (req, res) => {
  try {
    const { year, month } = req.query;

    if (!year || !month) {
      return res.status(400).json({
        message: "Please provide both year and month as query parameters.",
      });
    }

    const yearNum = parseInt(year);
    const monthNum = parseInt(month);

    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({
        message: "Invalid year or month. Month must be between 1 and 12.",
      });
    }

    const startDate = new Date(yearNum, monthNum - 1, 1);
    const endDate = new Date(yearNum, monthNum, 1);

    const orders = await Order.find({
      orderDate: {
        $gte: startDate,
        $lt: endDate,
      },
    }).sort({ orderDate: "asc" });

    if (orders.length === 0) {
      return res.status(200).json({
        message: `No orders found for ${startDate.toLocaleString("default", {
          month: "long",
        })} ${yearNum}.`,
        data: [],
      });
    }

    res.status(200).json({
      message: `Successfully retrieved ${orders.length} orders.`,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    console.error("Error fetching orders by month:", error);
    res.status(500).json({
      message: "Server error while fetching orders.",
      error: error.message,
    });
  }
};

export const getOrdersThisMonth = async (req, res) => {
  try {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const orders = await Order.find({
      orderDate: { $gte: startDate, $lt: endDate },
    }).sort({ orderDate: "asc" });

    res.status(200).json({
      message: `Orders for ${startDate.toLocaleString("default", {
        month: "long",
      })} ${startDate.getFullYear()}`,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error while fetching orders for this month.",
      error: error.message,
    });
  }
};

export const getOrdersLastMonth = async (req, res) => {
  try {
    const now = new Date();
    const year =
      now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    const month = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 1);

    const orders = await Order.find({
      orderDate: { $gte: startDate, $lt: endDate },
    }).sort({ orderDate: "asc" });

    res.status(200).json({
      message: `Orders for ${startDate.toLocaleString("default", {
        month: "long",
      })} ${year}`,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error while fetching orders for last month.",
      error: error.message,
    });
  }
};

export const getOrdersThisYear = async (req, res) => {
  try {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), 0, 1);
    const endDate = new Date(now.getFullYear() + 1, 0, 1);

    const orders = await Order.find({
      orderDate: { $gte: startDate, $lt: endDate },
    }).sort({ orderDate: "asc" });

    res.status(200).json({
      message: `Orders for the year ${now.getFullYear()}`,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error while fetching orders for this year.",
      error: error.message,
    });
  }
};
export const editOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      products,
      shippingAddress,
      paymentMethod,
      paymentStatus,
      orderStatus,
      totalAmount,
    } = req.body;

    if (!id) {
      return res.status(400).json({
        message: "Order ID is required.",
      });
    }

    const findTrackingid = await Order.findById(id);
    const trackingnumber = findTrackingid.trackingnumber ? findTrackingid.trackingnumber : "";
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      {
        products,
        shippingAddress,
        paymentMethod,
        paymentStatus,
        orderStatus,
        totalAmount,
        trackingnumber,
      },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({
        message: "Order not found.",
      });
    }

    res.status(200).json({
      message: "Order updated successfully.",
      data: updatedOrder,
    });
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({
      message: "Couldn't update order",
      error: error.message,
    });
  }
};
export const deleteOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        message: "Order ID is required.",
      });
    }

    const deletedOrder = await Order.findByIdAndDelete(id);

    if (!deletedOrder) {
      return res.status(404).json({
        message: "Order not found.",
      });
    }

    res.status(200).json({
      message: "Order deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({
      message: "Couldn't delete order",
      error: error.message,
    });
  }
};
