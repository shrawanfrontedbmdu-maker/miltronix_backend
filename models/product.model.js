import mongoose from "mongoose";

const variantSchema = new mongoose.Schema(
  {
    sku: {
      type: String,
      required: true,
      trim: true,
    }, // per-variant SKU (global uniqueness enforced by index on 'variants.sku')
    price: { type: Number, required: true, min: 0 },
    stockQuantity: { type: Number, required: true, min: 0 },
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

    mrp: { type: Number, min: 0 },
    sellingPrice: { type: Number, min: 0 },
    costPrice: { type: Number, min: 0 },
    currency: { type: String, trim: true, default: "INR" },

    brand: { type: String, trim: true },
    modelNumber: { type: String, trim: true },

    // Root SKU required only if there are no variants
    sku: {
      type: String,
      unique: true,
      sparse: true, // important to avoid E11000 null
      trim: true,
      required: function () {
        return !this.variants || this.variants.length === 0;
      },
    },

    // derived / cached global stock (optional - keep in sync with StoreInventory)
    stockQuantity: { type: Number, default: 0, min: 0 },
    reservedQuantity: { type: Number, default: 0, min: 0 },
    stockStatus: {
      type: String,
      enum: ["in-stock", "out-of-stock", "preorder"],
      default: "in-stock",
    },
    lowStockThreshold: { type: Number, default: 5, min: 0 },
    allowBackorder: { type: Boolean, default: false },

    variants: { type: [variantSchema], default: [] },

    // electronics-specific fields (already present kept as required)
    warranty: { type: String, required: true, trim: true },
    returnPolicy: { type: String, required: true, trim: true },
    // dimensions & shipping metadata
    dimensions: {
      weight: { type: Number, min: 0 },
      length: { type: Number, min: 0 },
      width: { type: Number, min: 0 },
      height: { type: Number, min: 0 },
      unit: { type: String, default: "cm" },
    },

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

/* ================= VALIDATORS & HOOKS ================= */
// Validate duplicate SKUs inside variants and global SKU conflicts
productSchema.pre("save", async function (next) {
  try {
    // `this` is the document being saved
    const doc = this;

    // Auto-set stockStatus from stockQuantity (product-level cache)
    if (typeof doc.stockQuantity === "number") {
      if (doc.stockQuantity > 5) doc.stockStatus = "in-stock";
      else if (doc.stockQuantity > 0 && doc.stockQuantity <= 5)
        doc.stockStatus = "low-stock";
      else doc.stockStatus = "out-of-stock";
    }

    // 1) Ensure no duplicate SKUs inside variants array
    if (Array.isArray(doc.variants) && doc.variants.length > 0) {
      const skus = doc.variants
        .map((v) => v.sku && v.sku.trim())
        .filter(Boolean);
      const uniqueSkus = new Set(skus);
      if (uniqueSkus.size !== skus.length) {
        return next(new Error("Duplicate SKU found inside variants"));
      }

      // Ensure none of variant SKUs equals root product SKU
      if (doc.sku && skus.includes(doc.sku.trim())) {
        return next(new Error("Product SKU must not match any variant SKU"));
      }

      // 2) Ensure variant SKUs are globally unique across Products (excluding self)
      const Product = doc.constructor;
      const conflict = await Product.findOne({
        _id: { $ne: doc._id },
        $or: [{ sku: { $in: skus } }, { "variants.sku": { $in: skus } }],
      })
        .lean()
        .exec();
      if (conflict)
        return next(
          new Error(
            "One or more variant SKUs already exist in another product",
          ),
        );
    }

    // 3) Ensure root SKU is not used by other products or variants
    if (doc.sku) {
      const Product = doc.constructor;
      const existing = await Product.findOne({
        _id: { $ne: doc._id },
        $or: [{ sku: doc.sku }, { "variants.sku": doc.sku }],
      })
        .lean()
        .exec();
      if (existing) return next(new Error("Product SKU already in use"));
    }

    return next();
  } catch (err) {
    return next(err);
  }
});

/* ================= INDEXES ================= */
// Preserve existing unique sparse indexes
productSchema.index({ sku: 1 }, { unique: true, sparse: true });
// enforce global uniqueness for variant SKUs (each array element is indexed)
productSchema.index({ "variants.sku": 1 }, { unique: true, sparse: true });
// Text search for product listing/search
productSchema.index({ name: "text", description: "text", tags: "text" });
// Useful compound indexes for listing/filtering
productSchema.index({ category: 1, status: 1, isRecommended: 1 });

export default mongoose.model("Product", productSchema);
