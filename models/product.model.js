import mongoose from "mongoose";

/* ================= SUB SCHEMAS ================= */

const supplierSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  contact: { type: String, trim: true },
  email: { type: String, trim: true, lowercase: true },
}, { _id: false });

const shippingSchema = new mongoose.Schema({
  charges: { type: Number, min: 0 },
  deliveryTime: { type: String, trim: true },
  restrictions: { type: String, trim: true },
}, { _id: false });

const variantSchema = new mongoose.Schema({
  sku: { type: String, trim: true }, // removed required
  price: { type: Number, min: 0 },
  stockQuantity: { type: Number, min: 0 },
  attributes: {
    color: { type: String, trim: true },
    size: { type: String, trim: true },
    model: { type: String, trim: true },
  },
  isActive: { type: Boolean, default: true },
}, { _id: false });

/* ================= PRODUCT SCHEMA ================= */

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, trim: true, lowercase: true },
  productKey: { type: String, trim: true },
  description: { type: String, trim: true },

  category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },

  images: [
    {
      url: { type: String },
      public_id: { type: String },
      alt: { type: String, trim: true },
    },
  ],

  mrp: { type: Number, min: 0 },
  sellingPrice: { type: Number, min: 0 },
  brand: { type: String, trim: true },

  sku: { type: String, trim: true }, // optional, no unique constraint
  stockQuantity: { type: Number, default: 0, min: 0 },

  variants: { type: [variantSchema], default: [] },

  warranty: { type: String, trim: true },
  returnPolicy: { type: String, trim: true },
  hsnCode: { type: String, trim: true },

  barcode: { type: String, trim: true }, // optional, no unique

  supplier: { type: [supplierSchema], default: [] },
  shipping: { type: [shippingSchema], default: [] },

  isRecommended: { type: Boolean, default: false },
  status: { type: String, enum: ["active", "inactive"], default: "active" },
  tags: { type: [String], default: [] },

}, { timestamps: true, versionKey: false });

export default mongoose.model("Product", productSchema);
