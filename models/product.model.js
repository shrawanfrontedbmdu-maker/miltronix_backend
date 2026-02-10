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
  sku: { type: String, required: true, trim: true }, // must be unique at app level
  price: { type: Number, required: true, min: 0 },
  stockQuantity: { type: Number, required: true, min: 0 },
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
  slug: { type: String, required: true, unique: true, lowercase: true },
  productKey: { type: String, required: true, unique: true, trim: true },
  description: { type: String, required: true, trim: true },

  category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
  categoryKey: { type: String, required: true, lowercase: true },

  images: [
    {
      url: { type: String, required: true },
      public_id: { type: String, required: true },
      alt: { type: String, trim: true },
    },
  ],

  mrp: { type: Number, min: 0 },
  sellingPrice: { type: Number, min: 0 },

  brand: { type: String, trim: true },

  // Root SKU required only if there are no variants
  sku: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    required: function () {
      return !this.variants || this.variants.length === 0;
    },
  },

  stockQuantity: { type: Number, default: 0, min: 0 },
  stockStatus: { type: String, enum: ["in-stock", "out-of-stock"], default: "in-stock" },

  variants: { type: [variantSchema], default: [] },

  warranty: { type: String, required: true, trim: true },
  returnPolicy: { type: String, required: true, trim: true },
  hsnCode: { type: String, required: true, trim: true, match: /^[0-9]{2,6}$/ },

  barcode: { type: String, unique: true, sparse: true, trim: true },

  supplier: { type: [supplierSchema], default: [] },
  shipping: { type: [shippingSchema], default: [] },

  isRecommended: { type: Boolean, default: false },
  status: { type: String, enum: ["active", "inactive"], default: "active" },

  tags: { type: [String], default: [] },

}, { timestamps: true, versionKey: false });

export default mongoose.model("Product", productSchema);
