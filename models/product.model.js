import mongoose from "mongoose";

const supplierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  contact: {
    type: String,
    required: true,
    match: /^[6-9]\d{9}$/
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    match: /^\S+@\S+\.\S+$/
  }
});

const shippingSchema = new mongoose.Schema({
  charges: {
    type: String,
    required: true,
    trim: true
  },
  deliveryTime: {
    type: String,
    required: true
  },
  restrictions: {
    type: String,
    trim: true
  }
});

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String },

    description: { type: String, required: true },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category"
    },

    images: [
      {
        url: { type: String, required: true },
        public_id: { type: String, required: true }
      }
    ],

    price: { type: Number }, // sellingprice ke saath coexist
    sellingprice: { type: Number, required: true },

    mrp: { type: Number },
    discountPrice: { type: String },

    sku: { type: String }, // productcode ❌ → sku ✅
    productcode: { type: String },

    colour: { type: String },
    size: { type: String },
    variants: [{ type: String }],
    brand: { type: String },

    specification: { type: String },

    stockStatus: {
      type: String,
      enum: ["InStock", "OutOfStock"],
      default: "InStock"
    },
    stockQuantity: { type: Number },

    weight: { type: String, trim: true },
    dimensions: { type: String, trim: true },

    tags: [{
      type: String,
      require: true
    }],

    warranty: { type: String, required: true },
    returnPolicy: { type: String, required: true, trim: true },

    barcode: {
      type: String,
      unique: true,
      sparse: true,
      trim: true
    },

    hsnCode: {
      type: String,
      required: true,
      match: /^[0-9]{4,8}$/,
      trim: true
    },

    supplier: [supplierSchema],
    shipping: [shippingSchema],

    isActive: { type: Boolean, default: true },
    status: { type: String, default: "Active" }
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);
