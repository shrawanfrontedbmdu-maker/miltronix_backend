import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
  fullAddress: { type: String, trim: true },
  city: { type: String, trim: true },
  state: { type: String, trim: true },
  pincode: { type: String, trim: true },
  landmark: { type: String, trim: true },
}, { _id: false });

const locationSchema = new mongoose.Schema({
  type: { type: String, enum: ["Point"], default: "Point" },
  coordinates: { type: [Number], default: [0,0] },
}, { _id: false });

const storeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // link to store owner account
  storeName: { type: String, required: true, trim: true },
  slug: { type: String, lowercase: true, trim: true, index: true },
  phone: { type: String, trim: true },
  alternatePhone: { type: String, trim: true },
  address: { type: addressSchema },
  location: { type: locationSchema },
  isActive: { type: Boolean, default: true },
  metadata: { type: Object, default: {} },
}, { timestamps: true });

storeSchema.index({ storeName: 1 });

export default mongoose.model("Store", storeSchema);