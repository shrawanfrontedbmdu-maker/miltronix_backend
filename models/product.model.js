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
  sku: { type: String, required: true, trim: true },
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

/* ================= MIDDLEWARE FOR VARIANT SKU UNIQUENESS ================= */

// Pre-save hook to enforce variant SKU uniqueness
productSchema.pre('save', async function(next) {
  try {
    if (this.variants && this.variants.length > 0) {
      const variantSkus = this.variants.map(v => v.sku);
      
      // 1. Check for duplicate SKUs within THIS product
      const uniqueSkus = new Set(variantSkus);
      if (variantSkus.length !== uniqueSkus.size) {
        throw new Error('Duplicate variant SKUs found within the same product');
      }

      // 2. Check for duplicate SKUs across OTHER products
      const Product = mongoose.model('Product');
      const duplicates = await Product.findOne({
        'variants.sku': { $in: variantSkus },
        _id: { $ne: this._id }
      });
      
      if (duplicates) {
        throw new Error('One or more variant SKUs already exist in another product');
      }

      // 3. Check that variant SKUs don't conflict with root SKUs
      const rootSkuConflict = await Product.findOne({
        sku: { $in: variantSkus },
        _id: { $ne: this._id }
      });
      
      if (rootSkuConflict) {
        throw new Error('Variant SKU conflicts with an existing root SKU');
      }
    }

    // 4. If this product has a root SKU, check it doesn't conflict with variant SKUs
    if (this.sku) {
      const Product = mongoose.model('Product');
      const variantSkuConflict = await Product.findOne({
        'variants.sku': this.sku,
        _id: { $ne: this._id }
      });
      
      if (variantSkuConflict) {
        throw new Error('Root SKU conflicts with an existing variant SKU');
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Pre-update hook for findOneAndUpdate
productSchema.pre('findOneAndUpdate', async function(next) {
  try {
    const update = this.getUpdate();
    
    // Check if variants are being updated
    if (update.variants || update.$set?.variants) {
      const variants = update.variants || update.$set?.variants;
      
      if (variants && variants.length > 0) {
        const variantSkus = variants.map(v => v.sku);
        
        // Check for duplicates within the variants array
        const uniqueSkus = new Set(variantSkus);
        if (variantSkus.length !== uniqueSkus.size) {
          throw new Error('Duplicate variant SKUs found within the same product');
        }

        // Get the document ID being updated
        const docId = this.getQuery()._id;
        
        // Check for duplicates across other products
        const Product = mongoose.model('Product');
        const duplicates = await Product.findOne({
          'variants.sku': { $in: variantSkus },
          _id: { $ne: docId }
        });
        
        if (duplicates) {
          throw new Error('One or more variant SKUs already exist in another product');
        }

        // Check root SKU conflicts
        const rootSkuConflict = await Product.findOne({
          sku: { $in: variantSkus },
          _id: { $ne: docId }
        });
        
        if (rootSkuConflict) {
          throw new Error('Variant SKU conflicts with an existing root SKU');
        }
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});

/* ================= INDEXES ================= */

// Index for faster variant SKU lookups
productSchema.index({ 'variants.sku': 1 });

// Index for category queries
productSchema.index({ category: 1, status: 1 });

// Index for slug-based lookups
productSchema.index({ slug: 1 });

// Index for product key
productSchema.index({ productKey: 1 });

// Index for recommended products
productSchema.index({ isRecommended: 1, status: 1 });

export default mongoose.model("Product", productSchema);