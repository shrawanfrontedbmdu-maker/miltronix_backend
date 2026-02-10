import mongoose from "mongoose";

/* ================= SUB SCHEMAS ================= */

const supplierSchema = new mongoose.Schema({
  name: String,
  contact: String,
  email: String,
}, { _id: false });

const shippingSchema = new mongoose.Schema({
  charges: { type: Number, min: 0 },
  deliveryTime: String,
  restrictions: String,
}, { _id: false });

const variantSchema = new mongoose.Schema({
  sku: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  stockQuantity: { type: Number, default: 0 },
  attributes: {
    color: String,
    size: String,
    model: String,
  },
  isActive: { type: Boolean, default: true },
}, { _id: false });

/* ================= PRODUCT SCHEMA ================= */

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  productKey: { type: String, required: true, unique: true },
  description: { type: String, required: true },

  category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
  categoryKey: { type: String, required: true },

  images: [{
    url: { type: String, required: true },
    public_id: { type: String, required: true },
    alt: String
  }],

  mrp: Number,
  sellingPrice: Number,

  brand: String,

  // 👇 FIXED SKU
  sku: {
    type: String,
    unique: true,
    sparse: true
  },

  stockQuantity: { type: Number, default: 0 },
  stockStatus: { type: String, enum: ["in-stock", "out-of-stock"], default: "in-stock" },

  variants: { type: [variantSchema], default: [] },

  warranty: { type: String, required: true },
  returnPolicy: { type: String, required: true },
  hsnCode: { type: String, required: true },

  barcode: { type: String, unique: true, sparse: true },

  supplier: { type: [supplierSchema], default: [] },
  shipping: { type: [shippingSchema], default: [] },

  isRecommended: { type: Boolean, default: false },
  status: { type: String, enum: ["active", "inactive"], default: "active" },

  tags: { type: [String], default: [] }

}, { timestamps: true });

export default mongoose.model("Product", productSchema);
