import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: true,
  },
  products: [
    {
      productId: {
        type: mongoose.Schema.Types.Mixed,
        ref: "Product",
      },
      name: {
        type: String,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        min: 1,
      },
      price: {
        type: Number,
        required: true,
      },
    },
  ],
  shippingAddress: {
    address: String,
    city: String,
    email: String,
    phone: String,
    company: String,
  },
  paymentMethod: {
    type: String,
    enum: ["COD", "Credit Card", "Debit Card", "PayPal", "Cash", "Bank Transfer"],
    default: "COD",
  },
  paymentStatus: {
    type: String,
    enum: ["Pending", "Paid", "Failed", "Refunded"],
    default: "Pending",
  },
  orderStatus: {
    type: String,
    enum: ["Draft", "Pending", "Processing", "Packaging", "Shipped", "Delivered", "Cancelled", "Completed"],
    default: "Processing",
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  orderDate: {
    type: Date,
    default: Date.now,
  },
  deliveryDate: {
    type: Date,
  },
  priority: {
    type: String,
    enum: ["Low", "Normal", "High", "Urgent"],
    default: "Normal",
  },
  notes: {
    type: String,
  },
  taxRate: {
    type: Number,
    default: 0,
  },
  shippingCost: {
    type: Number,
    default: 0,
  },
  discountAmount: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

export default mongoose.model("Order", orderSchema);
