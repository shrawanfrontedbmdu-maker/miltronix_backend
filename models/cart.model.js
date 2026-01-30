import mongoose from "mongoose";

const CartItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: false }, 
  title: String,          
  images: [{ url: String, public_id: String }],
  category: String,
  variant: {
    sku: String,
    color: String,
    size: String,
  },
  quantity: { type: Number, required: true, min: 1 },
  priceSnapshot: { type: Number, required: true },
  addedAt: { type: Date, default: Date.now }
}, { _id: true });

const CartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true, unique: false, required: false },
  items: [CartItemSchema],
  subtotal: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model("Cart", CartSchema);
