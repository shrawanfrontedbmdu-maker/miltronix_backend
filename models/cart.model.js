// models/Cart.js
import mongoose from "mongoose";

const CartItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  variant: {
    sku: String,
    color: String,
    size: String
  },
  quantity: { type: Number, required: true, min: 1 },
  priceSnapshot: { type: Number, required: true },
  addedAt: { type: Date, default: Date.now }
}, { _id: true });

const CartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true, unique: true },
  items: [CartItemSchema],
  subtotal: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model("Cart", CartSchema);
