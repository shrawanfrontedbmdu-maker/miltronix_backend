import mongoose from "mongoose";

/* ================= SUPPLIER ================= */
const supplierSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    contact: {
      type: String,
      required: true,
      match: /^[6-9]\d{9}$/,
    },

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
    charges: {
      type: Number,
      required: true,
      min: 0,
    },

    deliveryTime: {
      type: String,
      required: true,
      trim: true,
    },

    restrictions: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

/* ================= PRODUCT ================= */
const productSchema = new mongoose.Schema(
  {
    /* ---------- BASIC INFO ---------- */
    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },

    productKey: {
      type: String,
      unique: true,
      required: true, // used for recommendationKeys
      lowercase: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    /* ---------- CATEGORY LINK ---------- */
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },

    categoryKey: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },

    /* ---------- IMAGES ---------- */
    images: [
      {
        url: { type: String, required: true },
        public_id: { type: String, required: true },
        alt: { type: String, trim: true },
      },
    ],

    /* ---------- PRICING ---------- */
    mrp: {
      type: Number,
      required: true,
    },

    sellingPrice: {
      type: Number,
      required: true,
    },

    discountPercent: {
      type: Number,
      min: 0,
      max: 100,
    },

    /* ---------- FILTER-MAPPED ATTRIBUTES ---------- */
    resolution: {
      type: String, // hd | full-hd | 4k | 8k
      lowercase: true,
      index: true,
    },

    screenSize: {
      type: Number, // 32, 43, 55
      index: true,
    },

    stockStatus: {
      type: String,
      enum: ["in-stock", "out-of-stock"],
      default: "in-stock",
      index: true,
    },

    /* ---------- INVENTORY ---------- */
    sku: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },

    stockQuantity: {
      type: Number,
      default: 0,
    },

    /* ---------- BRAND & VARIANTS ---------- */
    brand: {
      type: String,
      trim: true,
      index: true,
    },

    colour: {
      type: String,
      trim: true,
    },

    variants: [
      {
        type: String,
        trim: true,
      },
    ],

    /* ---------- TECH DETAILS ---------- */
    specification: {
      type: String,
      trim: true,
    },

    weight: {
      type: String,
      trim: true,
    },

    dimensions: {
      type: String,
      trim: true,
    },

    /* ---------- LEGAL & LOGISTICS ---------- */
    warranty: {
      type: String,
      required: true,
      trim: true,
    },

    returnPolicy: {
      type: String,
      required: true,
      trim: true,
    },

    hsnCode: {
      type: String,
      required: true,
      match: /^[0-9]{4,8}$/,
      trim: true,
    },

    barcode: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },

    /* ---------- SUPPLIER & SHIPPING ---------- */
    supplier: {
      type: [supplierSchema],
      default: [],
    },

    shipping: {
      type: [shippingSchema],
      default: [],
    },

    /* ---------- UI FLAGS ---------- */
    isRecommended: {
      type: Boolean,
      default: false,
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },

    /* ---------- SEO ---------- */
    tags: {
      type: [String],
      default: [],
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export default mongoose.model("Product", productSchema);
