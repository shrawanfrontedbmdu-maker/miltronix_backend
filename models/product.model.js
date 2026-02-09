import mongoose from "mongoose";

/* ================= SUB SCHEMAS ================= */

const supplierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    contact: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
  },
  { _id: false }
);

const shippingSchema = new mongoose.Schema(
  {
    charges: { type: Number, required: true, min: 0 },
    deliveryTime: { type: String, required: true, trim: true },
    restrictions: { type: String, trim: true },
  },
  { _id: false }
);

const variantSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, default: 0, min: 0 },

    attributes: {
      color: { type: String, trim: true },
      resolution: { type: String, trim: true },
      storage: { type: String, trim: true },
      size: { type: String, trim: true },
      model: { type: String, trim: true },
    },

    isActive: { type: Boolean, default: true },
  },
  { _id: false }
);

/* ================= PRODUCT SCHEMA ================= */

const productSchema = new mongoose.Schema(
  {
    /* ===== BASIC INFO ===== */
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    productKey: { type: String, required: true, unique: true, trim: true },

    description: { type: String, required: true, trim: true },

    /* ===== CATEGORY ===== */
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    categoryKey: { type: String, required: true, lowercase: true },

    /* ===== IMAGES ===== */
    images: [
      {
        url: { type: String, required: true },
        public_id: { type: String, required: true },
        alt: { type: String, trim: true },
      },
    ],

    /* ===== PRICE (NO VARIANT CASE) ===== */
    mrp: { type: Number, min: 0 },
    sellingPrice: { type: Number, min: 0 },

    /* ===== BRAND ===== */
    brand: { type: String, trim: true },

    /* ===== INVENTORY (NO VARIANT CASE) ===== */
    sku: { type: String, trim: true },
    stockQuantity: { type: Number, default: 0, min: 0 },

    stockStatus: {
      type: String,
      enum: ["in-stock", "out-of-stock"],
      default: "in-stock",
    },

    /* ===== VARIANTS ===== */
    variants: { type: [variantSchema], default: [] },

    /* ===== TECH DETAILS ===== */
    specification: { type: String, trim: true },
    weight: { type: String, trim: true },
    dimensions: { type: String, trim: true },

    /* ===== LEGAL ===== */
    warranty: { type: String, required: true, trim: true },
    returnPolicy: { type: String, required: true, trim: true },

    hsnCode: {
      type: String,
      required: true,
      trim: true,
      match: /^[0-9]{4,8}$/,
    },

    barcode: { type: String, unique: true, sparse: true, trim: true },

    /* ===== SUPPLIER & SHIPPING ===== */
    supplier: { type: [supplierSchema], default: [] },
    shipping: { type: [shippingSchema], default: [] },

    /* ===== FLAGS ===== */
    isRecommended: { type: Boolean, default: false },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },

    /* ===== SEO ===== */
    tags: { type: [String], default: [] },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export default mongoose.model("Product", productSchema);
