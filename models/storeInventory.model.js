import mongoose from "mongoose";

const storeInventorySchema = new mongoose.Schema({
  store: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true, index: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, index: true },
  storeSku: { type: String, trim: true },
  price: { type: Number, min: 0, required: true },
  stockQty: { type: Number, default: 0, min: 0 },
  reservedQty: { type: Number, default: 0, min: 0 },
  leadTimeDays: { type: Number, default: 2 },
  fulfillmentOptions: { type: [String], default: ["shipping"] },
  isActive: { type: Boolean, default: true },
  metadata: { type: Object, default: {} },
}, { timestamps: true });

storeInventorySchema.index({ store: 1, product: 1 }, { unique: true });

export default mongoose.model("StoreInventory", storeInventorySchema);
