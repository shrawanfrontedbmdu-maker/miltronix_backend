import mongoose from "mongoose";

const storeInventorySchema = new mongoose.Schema(
  {
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
      index: true,
    },

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },

    variantSku: {
      type: String,
      trim: true,
      index: true,
    },

    stockQty: {
      type: Number,
      default: 0,
      min: 0,
    },

    reservedQty: {
      type: Number,
      default: 0,
      min: 0,
    },

    stockStatus: {
      type: String,
      enum: ["in-stock", "low-stock", "out-of-stock", "preorder"],
      default: "out-of-stock",
    },

    leadTimeDays: {
      type: Number,
      default: 2,
    },

    fulfillmentOptions: {
      type: [String],
      default: ["shipping"], // shipping | pickup
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    metadata: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

/* ================= AUTO STOCK STATUS ================= */

storeInventorySchema.pre("save", function (next) {
  const availableQty = this.stockQty - this.reservedQty;

  if (availableQty > 5) {
    this.stockStatus = "in-stock";
  } else if (availableQty > 0) {
    this.stockStatus = "low-stock";
  } else {
    this.stockStatus = "out-of-stock";
  }

  next();
});

/* ================= INDEXES ================= */

// Only one inventory record per store + product + variant
storeInventorySchema.index(
  { store: 1, product: 1, variantSku: 1 },
  { unique: true }
);

// Fast seller selection during checkout
storeInventorySchema.index({
  variantSku: 1,
  stockStatus: 1,
  isActive: 1,
});

export default mongoose.model("StoreInventory", storeInventorySchema);
