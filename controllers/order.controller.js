import Order from "../models/order.model.js";

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

export const createOrder = async (req, res) => {
  try {
    const { products, customerName, totalAmount } = req.body;

    console.log("Incoming order body:", req.body);

    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        message: "Products array is required and cannot be empty.",
      });
    }

    if (!customerName || typeof customerName !== "string") {
      return res.status(400).json({
        message: "Customer name is required and must be a string.",
      });
    }

    if (!totalAmount || typeof totalAmount !== "number" || totalAmount <= 0) {
      return res.status(400).json({
        message: "Total amount is required and must be a positive number.",
      });
    }

    const newOrder = await Order.create({
      customerName,
      products,
      shippingAddress: req.body.shippingAddress || {},
      paymentMethod: req.body.paymentMethod || "COD",
      paymentStatus: req.body.paymentStatus || "Pending",
      orderStatus: req.body.orderStatus || "Processing",
      totalAmount,
      orderDate: req.body.orderDate ? new Date(req.body.orderDate) : new Date(),
      deliveryDate: req.body.deliveryDate ? new Date(req.body.deliveryDate) : null,
      priority: req.body.priority || "Normal",
      notes: req.body.notes || "",
      taxRate: req.body.taxRate || 0,
      shippingCost: req.body.shippingCost || 0,
      discountAmount: req.body.discountAmount || 0,
      isActive: true,
    });

    res.status(201).json({
      message: "Order created successfully",
      data: newOrder,
    });
  } catch (error) {
    console.error("Order creation failed:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation Error",
        errors: error.errors,
      });
    }

    res.status(500).json({
      message: "Couldn't create order",
      error: error.message,
    });
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

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      {
        products,
        shippingAddress,
        paymentMethod,
        paymentStatus,
        orderStatus,
        totalAmount,
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
