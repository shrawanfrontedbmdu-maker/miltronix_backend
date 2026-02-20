import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";
import Address from "../models/address.model.js";
import Cart from "../models/cart.model.js";
import Coupon from "../models/coupons.model.js";
import orderModel from "../models/order.model.js";


export const getOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();
    const total = await Order.countDocuments();
    res.status(200).json({ success: true, orders, total, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: "Couldn't get orders", error: error.message });
  }
};

// ─── Helpers ────────────────────────────────────────────────────────
const generateDeliveryNumber = () => "DLV-" + Date.now().toString().slice(-8);

const resolveAddress = async (addressId, addressObj, userId) => {
  if (addressId) {
    const address = await Address.findById(addressId);
    if (!address) throw new Error("Address not found");
    return address.toObject();
  }
  if (addressObj && typeof addressObj === "object" && Object.keys(addressObj).length > 0) {
    return addressObj;
  }
  if (userId) {
    const address = await Address.findOne({ userId, isDefault: true });
    if (address) return address.toObject();
  }
  throw new Error(
    "Shipping address is required (provide addressId, address object, or set a default address)"
  );
};

// ─── Create Order ───────────────────────────────────────────────────
export const createOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      customer: customerBody,
      customerName,
      couponCode,
      shippingAddressId,
      shippingAddress,
      billingAddressId,
      billingAddress,
    } = req.body;

    if (!shippingAddress && !shippingAddressId) {
      return res.status(400).json({
        success: false,
        message: "Shipping address or shippingAddressId is required",
      });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(400).json({ message: "User not found" });

    const cart = await Cart.findOne({ user: userId }).populate({
      path: "items.product",
      select: "name variants category images",
    });

    if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    const orderItems = [];
    for (const cartItem of cart.items) {
      const product = cartItem.product;
      if (!product) continue;

      const quantity = cartItem.quantity || 1;
      const pricePerUnit = Number(cartItem.priceSnapshot || 0);

      const sku = cartItem.variant?.sku;
      if (!sku) {
        return res.status(400).json({ success: false, message: "Product variant missing in cart" });
      }

      const variant = product.variants?.find((v) => v.sku === sku);
      if (!variant) {
        return res.status(400).json({
          success: false,
          message: `${product.name} variant is no longer available`,
        });
      }

      if (variant.stockQuantity < quantity) {
        return res.status(400).json({
          success: false,
          message: `${product.name} is out of stock`,
        });
      }

      const cutPricePerUnit = variant.mrp || variant.price || pricePerUnit;
      const discountPerUnit = Math.max(0, cutPricePerUnit - pricePerUnit);

      orderItems.push({
        productId: product._id,
        sku,
        name: product.name,
        quantity,
        mrp: cutPricePerUnit,
        unitPrice: pricePerUnit,
        taxAmount: 0,
        discountAmount: discountPerUnit * quantity,
        lineTotal: pricePerUnit * quantity,
      });
    }

    const subtotal = orderItems.reduce((s, it) => s + (it.unitPrice || 0) * (it.quantity || 0), 0);
    const taxRate = Number(req.body.taxRate || 0);
    const taxAmount = taxRate ? +(subtotal * (taxRate / 100)).toFixed(2) : 0;
    const shippingCost = Number(req.body.shippingCost || 0);

    // ─ Coupon ─
    let couponDiscount = 0;
    let couponId = null;
    let couponCodeApplied = null;

    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode });
      if (!coupon) return res.status(400).json({ success: false, message: "Invalid coupon code" });

      couponId = coupon._id;

      if (coupon.status !== "active")
        return res.status(400).json({ success: false, message: "Coupon is not active" });

      const now = new Date();
      if (now > new Date(coupon.expiryDate))
        return res.status(400).json({ success: false, message: "Coupon has expired" });

      if (now < new Date(coupon.startDate))
        return res.status(400).json({ success: false, message: "Coupon is not yet valid" });

      if (subtotal < coupon.minOrderValue)
        return res.status(400).json({
          success: false,
          message: `Minimum order value of ₹${coupon.minOrderValue} required`,
        });

      if (coupon.totalUsage && coupon.usedCount >= coupon.totalUsage)
        return res.status(400).json({ success: false, message: "Coupon usage limit reached" });

      if (coupon.perCustomerLimit) {
        const userOrdersWithCoupon = await Order.countDocuments({ user: userId, coupon: couponId }); 
        if (userOrdersWithCoupon >= coupon.perCustomerLimit)
          return res.status(400).json({
            success: false,
            message: "You have already used this coupon maximum times",
          });
      }

      if (coupon.firstPurchaseOnly) {
        const previousOrders = await Order.countDocuments({ user: userId }); 
        if (previousOrders > 0)
          return res.status(400).json({
            success: false,
            message: "This coupon is only valid for first purchase",
          });
      }

      if (coupon.discountType === "PERCENTAGE") {
        couponDiscount = (subtotal * coupon.discountValue) / 100;
        if (coupon.maxDiscount && couponDiscount > coupon.maxDiscount) {
          couponDiscount = coupon.maxDiscount;
        }
      } else if (coupon.discountType === "FLAT") {
        couponDiscount = coupon.discountValue;
      }

      couponCodeApplied = coupon.code;
    }

    const totalAmount = +(subtotal + taxAmount + shippingCost - couponDiscount).toFixed(2);

    const customer = {
      name: user.fullName || customerName || customerBody?.name || "Customer",
      email: user.email || customerBody?.email,
      phone: user.mobile || customerBody?.phone,
      company: customerBody?.company,
    };

    let finalShippingAddress, finalBillingAddress;
    try {
      finalShippingAddress = await resolveAddress(shippingAddressId, shippingAddress, userId);
      finalBillingAddress = await resolveAddress(
        billingAddressId,
        billingAddress || shippingAddress,
        userId
      );
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
      couponCode: couponCodeApplied || undefined,
      subtotal,
      taxAmount,
      shippingCost,
      discountAmount: couponDiscount,
      totalAmount,
      currency: req.body.currency || "INR",
      payment: {
        method: req.body.paymentMethod || "COD",
        status: req.body.paymentStatus || "Pending",
        transactionId: req.body.transactionId || undefined,
      },
      fulfillment: {
        orderStatus: req.body.orderStatus || "Pending",
        statusHistory: [{ status: "Pending", timestamp: new Date(), note: "Order placed" }],
      },
      priority: req.body.priority || "Normal",
      notes: req.body.notes || "",
      isActive: true,
      trackingnumber: generateDeliveryNumber(),
    };

    const newOrder = await Order.create(orderDoc);

    if (couponId) {
      await Coupon.findByIdAndUpdate(couponId, { $inc: { usedCount: 1 } }).catch(() => {});
    }

    // Clear cart after order creation ✅ UNCOMMENTED
    await Cart.findOneAndDelete({ user: userId }).catch(() => {});

    res.status(201).json({ message: "Order created successfully", data: newOrder });
  } catch (error) {
    console.error("Order creation failed:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: "Validation Error", errors: error.errors });
    }
    res.status(500).json({ message: "Couldn't create order", error: error.message });
  }
};

// ─── Get orders by month (query param) ─────────────────────────────
export const getOrdersByMonth = async (req, res) => {
  try {
    const { year, month } = req.query;
    if (!year || !month)
      return res.status(400).json({ message: "Please provide both year and month." });

    const yearNum = parseInt(year);
    const monthNum = parseInt(month);
    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12)
      return res.status(400).json({ message: "Invalid year or month." });

    const startDate = new Date(yearNum, monthNum - 1, 1);
    const endDate = new Date(yearNum, monthNum, 1);

    // ✅ FIXED: orderDate → createdAt
    const orders = await Order.find({ createdAt: { $gte: startDate, $lt: endDate } }).sort({
      createdAt: "asc",
    });

    res.status(200).json({
      message: `Orders for ${startDate.toLocaleString("default", { month: "long" })} ${yearNum}`,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── Get orders this month ──────────────────────────────────────────
export const getOrdersThisMonth = async (req, res) => {
  try {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // ✅ FIXED: orderDate → createdAt
    const orders = await Order.find({ createdAt: { $gte: startDate, $lt: endDate } }).sort({
      createdAt: "asc",
    });

    res.status(200).json({
      message: `Orders for ${startDate.toLocaleString("default", { month: "long" })} ${startDate.getFullYear()}`,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── Get orders last month ──────────────────────────────────────────
export const getOrdersLastMonth = async (req, res) => {
  try {
    const now = new Date();
    const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    const month = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 1);

    // ✅ FIXED: orderDate → createdAt
    const orders = await Order.find({ createdAt: { $gte: startDate, $lt: endDate } }).sort({
      createdAt: "asc",
    });

    res.status(200).json({
      message: `Orders for ${startDate.toLocaleString("default", { month: "long" })} ${year}`,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── Get orders this year ───────────────────────────────────────────
export const getOrdersThisYear = async (req, res) => {
  try {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), 0, 1);
    const endDate = new Date(now.getFullYear() + 1, 0, 1);

    // ✅ FIXED: orderDate → createdAt
    const orders = await Order.find({ createdAt: { $gte: startDate, $lt: endDate } }).sort({
      createdAt: "asc",
    });

    res.status(200).json({
      message: `Orders for the year ${now.getFullYear()}`,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── Edit order by ID ───────────────────────────────────────────────
export const editOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "Order ID is required." });

    const { shippingAddress, paymentMethod, paymentStatus, orderStatus, totalAmount, notes, priority } =
      req.body;

    // ✅ FIXED: single DB call, only update provided fields, trackingnumber preserved automatically
    const updateFields = {};
    if (shippingAddress)                    updateFields.shippingAddress = shippingAddress;
    if (paymentMethod)                      updateFields["payment.method"] = paymentMethod;
    if (paymentStatus)                      updateFields["payment.status"] = paymentStatus;
    if (orderStatus)                        updateFields["fulfillment.orderStatus"] = orderStatus; // ✅ FIXED: correct path
    if (totalAmount !== undefined)          updateFields.totalAmount = totalAmount;
    if (notes !== undefined)                updateFields.notes = notes;
    if (priority)                           updateFields.priority = priority;

    // Push to status history if orderStatus changed
    if (orderStatus) {
      updateFields.$push = {
        "fulfillment.statusHistory": {
          status: orderStatus,
          timestamp: new Date(),
          note: req.body.statusNote || "",
        },
      };
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      orderStatus ? { $set: updateFields, $push: updateFields.$push } : { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!updatedOrder) return res.status(404).json({ message: "Order not found." });

    res.status(200).json({ message: "Order updated successfully.", data: updatedOrder });
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({ message: "Couldn't update order", error: error.message });
  }
};

// ─── Delete order by ID ─────────────────────────────────────────────
export const deleteOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "Order ID is required." });

    const deletedOrder = await Order.findByIdAndDelete(id);
    if (!deletedOrder) return res.status(404).json({ message: "Order not found." });

    res.status(200).json({ message: "Order deleted successfully." });
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({ message: "Couldn't delete order", error: error.message });
  }
};

// ─── Get all orders for logged-in user ─────────────────────────────
export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10, status } = req.query;

    const query = { user: userId };
    if (status) {
      query["fulfillment.orderStatus"] = status; // ✅ FIXED: correct nested field
    }

    const orders = await orderModel
      .find(query)
      .populate({
        path: "items.productId",
        select: "images variants", // ✅ FIXED: added variants so image lookup works
      })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await orderModel.countDocuments(query);

    const updatedOrders = orders.map((order) => {
      order.items = order.items.map((item) => {
        const product = item.productId;
        let image = null;

        if (product) {
          const variant = product.variants?.find((v) => v.sku === item.sku);
          if (variant?.imageUrl) {
            image = variant.imageUrl;
          } else if (product.images?.length > 0) {
            image = product.images[0];
          }
        }

        return { ...item, image };
      });

      return order;
    });

    return res.status(200).json({
      success: true,
      orders: updatedOrders,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      totalOrders: total,
    });
  } catch (error) {
    console.error("Get user orders error:", error);
    return res.status(500).json({ success: false, message: "Error fetching orders", error: error.message });
  }
};

// ─── Get single order detail ────────────────────────────────────────
export const getOrderById = async (req, res) => {
  try {
    const orderId = req.params.id; // ✅ FIXED: was `const { orderId } = req.params.id` (broken destructuring)
    const userId = req.user._id;

    const order = await orderModel
      .findOne({ _id: orderId, user: userId }) // ✅ FIXED: query by _id not orderId
      .populate("items.productId")
      .populate("coupon")
      .lean();

    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    return res.status(200).json({ success: true, order });
  } catch (error) {
    console.error("Get order by ID error:", error);
    return res.status(500).json({ success: false, message: "Error fetching order", error: error.message });
  }
};

// ─── Cancel order ───────────────────────────────────────────────────
// ✅ NEW: was missing entirely
export const cancelOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const userId = req.user._id;
    const { reason } = req.body;

    const order = await Order.findOne({ _id: orderId, user: userId });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    const cancellableStatuses = ["Pending", "Confirmed"];
    if (!cancellableStatuses.includes(order.fulfillment.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled. Current status: ${order.fulfillment.orderStatus}`,
      });
    }

    order.fulfillment.orderStatus = "Cancelled";
    order.fulfillment.statusHistory.push({
      status: "Cancelled",
      timestamp: new Date(),
      note: reason || "Cancelled by customer",
    });

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      data: order,
    });
  } catch (error) {
    console.error("Cancel order error:", error);
    return res.status(500).json({ success: false, message: "Error cancelling order", error: error.message });
  }
};