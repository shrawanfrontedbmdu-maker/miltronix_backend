import mongoose from "mongoose";

/* ================= SUPPLIER ================= */
const supplierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    contact: { type: String, required: true, match: /^[6-9]\d{9}$/ },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: /^\S+@\S+\.\S+$/,
    },
  },
  { _id: false }
);

/* ================= SHIPPING ================= */
const shippingSchema = new mongoose.Schema(
  {
    charges: { type: Number, required: true, min: 0 },
    deliveryTime: { type: String, required: true, trim: true },
    restrictions: { type: String, trim: true },
  },
  { _id: false }
);

/* ================= VARIANT ================= */
const variantSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true, trim: true },

    price: { type: Number, required: true },

    stock: { type: Number, default: 0 },

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

/* ================= PRODUCT ================= */
const productSchema = new mongoose.Schema(
  {
    /* ---------- BASIC INFO ---------- */
    name: { type: String, required: true, trim: true },

    slug: { type: String, required: true, unique: true, lowercase: true },

    productKey: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true,
    },

    description: { type: String, required: true, trim: true },

    /* ---------- CATEGORY ---------- */
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },

    categoryKey: { type: String, required: true, lowercase: true, index: true },

    /* ---------- IMAGES ---------- */
    images: [
      {
        url: { type: String, required: true },
        public_id: { type: String, required: true },
        alt: { type: String, trim: true },
      },
    ],

    /* ---------- BASE PRICE (if no variants) ---------- */
    mrp: { type: Number },
    sellingPrice: { type: Number },

    /* ---------- FILTER ATTRIBUTES ---------- */
    brand: { type: String, trim: true, index: true },

    /* ---------- INVENTORY (NO VARIANT CASE) ---------- */
    sku: { type: String, trim: true },
    stockQuantity: { type: Number, default: 0 },

    stockStatus: {
      type: String,
      enum: ["in-stock", "out-of-stock"],
      default: "in-stock",
      index: true,
    },

    /* ---------- VARIANTS ---------- */
    variants: { type: [variantSchema], default: [] },

    /* ---------- TECH DETAILS ---------- */
    specification: { type: String, trim: true },
    weight: { type: String, trim: true },
    dimensions: { type: String, trim: true },

    /* ---------- LEGAL ---------- */
    warranty: { type: String, required: true, trim: true },
    returnPolicy: { type: String, required: true, trim: true },

    hsnCode: {
      type: String,
      required: true,
      match: /^[0-9]{4,8}$/,
      trim: true,
    },

    barcode: { type: String, unique: true, sparse: true, trim: true },

    /* ---------- SUPPLIER & SHIPPING ---------- */
    supplier: { type: [supplierSchema], default: [] },
    shipping: { type: [shippingSchema], default: [] },

    /* ---------- FLAGS ---------- */
    isRecommended: { type: Boolean, default: false, index: true },
    isActive: { type: Boolean, default: true },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },

    /* ---------- SEO ---------- */
    tags: { type: [String], default: [], index: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export default mongoose.model("Product", productSchema);
