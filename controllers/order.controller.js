import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";
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

export const createOrder = async (req, res) => {
  try {
    // accept legacy `products` or preferred `items`
    const incoming = Array.isArray(req.body.products) && req.body.products.length
      ? req.body.products
      : Array.isArray(req.body.items) && req.body.items.length
      ? req.body.items
      : [];

    const { user: userId, customer: customerBody, customerName, couponCode } = req.body;

    console.log("Incoming order body:", req.body);

    if (!incoming || incoming.length === 0) {
      return res.status(400).json({ message: "Products array is required and cannot be empty." });
    }

    // validate & build order items from DB (don't trust client prices)
    const orderItems = [];

    for (const p of incoming) {
      const productId = p.productId || p._id;
      const quantity = Number(p.quantity || p.qty || 0);

      if (!productId || quantity <= 0) {
        return res.status(400).json({ message: "Each product must include productId and a positive quantity." });
      }

      const product = await Product.findById(productId).lean();
      if (!product) return res.status(400).json({ message: `Product not found: ${productId}` });

      // choose variant by sku (if provided) or fallback to first variant
      let variant = null;
      if (p.sku && Array.isArray(product.variants)) {
        variant = product.variants.find((v) => v.sku === p.sku);
      }
      if (!variant && Array.isArray(product.variants) && product.variants.length) {
        variant = product.variants[0];
      }

      const unitPrice = (variant && typeof variant.price === "number") ? variant.price : Number(p.unitPrice || 0);

      orderItems.push({
        productId: product._id,
        sku: variant ? variant.sku : undefined,
        name: product.name,
        quantity,
        unitPrice,
        taxAmount: 0,
        discountAmount: 0,
      });
    }

    // compute totals server-side
    const subtotal = orderItems.reduce((s, it) => s + (it.unitPrice || 0) * (it.quantity || 0), 0);
    const taxRate = Number(req.body.taxRate || 0);
    const taxAmount = taxRate ? +(subtotal * (taxRate / 100)) : 0;
    const shippingCost = Number(req.body.shippingCost || 0);
    let discountAmount = Number(req.body.discountAmount || 0);

    // coupon best-effort validation
    let coupon = null;
    if (couponCode) {
      coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
      if (coupon) {
        const now = new Date();
        if (coupon.status !== "active" || coupon.startDate > now || coupon.expiryDate < now) {
          coupon = null;
        } else {
          if (coupon.discountType === "percentage") {
            discountAmount = Math.min((subtotal * (coupon.discountValue / 100)), coupon.maxDiscount || Infinity);
          } else {
            discountAmount = coupon.discountValue;
          }
        }
      }
    }

    const totalAmount = +(subtotal + taxAmount + shippingCost - discountAmount);

    // customer snapshot (prefer user if provided)
    let customer = {};
    if (userId) {
      const user = await User.findById(userId).lean();
      if (user) customer = { name: user.fullName, email: user.email, phone: user.mobile };
    } else if (customerBody && customerBody.name) {
      customer = { name: customerBody.name, email: customerBody.email, phone: customerBody.phone };
    } else if (customerName) {
      customer = { name: customerName };
    } else {
      return res.status(400).json({ message: "Customer name or user id is required." });
    }

    const orderDoc = {
      user: userId || undefined,
      customer,
      items: orderItems,
      shippingAddress: req.body.shippingAddress || {},
      billingAddress: req.body.billingAddress || req.body.billingAddress || req.body.shippingAddress || {},
      coupon: coupon ? coupon._id : undefined,
      couponCode: coupon ? coupon.code : (req.body.couponCode ? req.body.couponCode.toUpperCase() : undefined),
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

    // increment coupon usage (best-effort)
    if (coupon) {
      await Coupon.findByIdAndUpdate(coupon._id, { $inc: { usedCount: 1 } }).catch(() => {});
    }

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
