import mongoose from "mongoose";

const variantSchema = new mongoose.Schema(
  {
    sku: {
      type: String,
      required: true,
      trim: true,
    },

    price: { type: Number, required: true, min: 0 },
    mrp: { type: Number, min: 0 },
    currency: { type: String, trim: true, default: "INR" },

    hasStock: {
      type: Boolean,
      default: false,
    },

    stockQuantity: { type: Number, required: true, min: 0 },
    stockStatus: {
      type: String,
      enum: ["in-stock", "low-stock", "out-of-stock"],
      default: "low-stock",
    },
    // dimensions & shipping metadata
    dimensions: {
      weight: { type: Number, min: 0 },
      length: { type: Number, min: 0 },
      width: { type: Number, min: 0 },
      height: { type: Number, min: 0 },
      unit: { type: String, default: "cm" },
    },
    attributes: {
      color: { type: String, trim: true },
      size: { type: String, trim: true },
      model: { type: String, trim: true },
    },
    images: [
      {
        url: { type: String, required: true },
        public_id: { type: String, required: true },
        alt: { type: String, trim: true },
      },
    ],
    specifications: [
      {
        key: { type: String },
        value: { type: mongoose.Schema.Types.Mixed },
      },
    ],
    isActive: { type: Boolean, default: true },
  },
  { _id: false },
);

/* ================= PRODUCT SCHEMA ================= */

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    productKey: { type: String, required: true, unique: true, trim: true },
    description: { type: String, required: true, trim: true },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    subcategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subcategory",
      default: null,
    },

    filterOptions: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "FilterOption",
    }],

    images: [
      {
        url: { type: String, required: true },
        public_id: { type: String, required: true },
        alt: { type: String, trim: true },
      },
    ],

    specifications: [
      {
        key: { type: String },
        value: { type: mongoose.Schema.Types.Mixed },
      },
    ],
    keyFeatures: [
      {
        key: { type: String },
        value: { type: mongoose.Schema.Types.Mixed },
      },
    ],

    brand: { type: String, trim: true },

    variants: { type: [variantSchema], default: [] },

    // electronics-specific fields (already present kept as required)
    warranty: { type: String, required: true, trim: true },
    returnPolicy: { type: String, required: true, trim: true },

    // visibility / marketing
    isRecommended: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    isDigital: { type: Boolean, default: false },
    status: { type: String, enum: ["active", "inactive"], default: "active" },

    // SEO & tags
    metaTitle: { type: String, trim: true },
    metaDescription: { type: String, trim: true },
    keywords: { type: [String], default: [] },

    // ratings & relations
    avgRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    relatedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],

    // soft delete & audit
    isArchived: { type: Boolean, default: false },
    deletedAt: Date,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
    metadata: { type: Object, default: {} },

    tags: { type: [String], default: [] },
  },
  { timestamps: true, versionKey: false },
);

productSchema.pre("save", function (next) {
  try {
    if (Array.isArray(this.variants) && this.variants.length > 0) {
      this.variants.forEach((variant) => {
        if (typeof variant.stockQuantity === "number") {
          if (variant.stockQuantity > 5) {
            variant.stockStatus = "in-stock";
          } else if (variant.stockQuantity > 0) {
            variant.stockStatus = "low-stock";
          } else {
            variant.stockStatus = "out-of-stock";
          }
        }
      });
    }

    next();
  } catch (err) {
    next(err);
  }
});

// enforce global uniqueness for variant SKUs (each array element is indexed)
productSchema.index({ "variants.sku": 1 }, { unique: true, sparse: true });
// Text search for product listing/search
productSchema.index({ name: "text", description: "text", tags: "text" });
// Useful compound indexes for listing/filtering
productSchema.index({ category: 1, status: 1, isRecommended: 1 });

export default mongoose.model("Product", productSchema);
