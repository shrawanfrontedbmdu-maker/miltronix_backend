import mongoose from "mongoose";
import OrderCounter from "./ordercounterSchema.js";

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    sku: String,
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    mrp: { type: Number, required: true, min: 0 },
    unitPrice: { type: Number, required: true, min: 0 },
    taxAmount: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    lineTotal: { type: Number, default: 0 },
  },
  { _id: false },
);

const addressSnapshotSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    houseFlatNo: { type: String, required: true, trim: true },
    buildingApartment: { type: String, trim: true },
    streetLocality: { type: String, required: true, trim: true },
    landmark: { type: String, trim: true },
    pinCode: { type: String, required: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const shipmentSchema = new mongoose.Schema(
  {
    carrier: String,
    trackingNumber: String,
    status: { type: String, default: "pending" },
    shippedAt: Date,
    deliveredAt: Date,
  },
  { _id: false },
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
    },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true }, // optional (guest)
    customer: {
      name: { type: String, required: true },
      email: String,
      phone: String,
      company: String,
    },
    items: { type: [orderItemSchema], default: [] },
    shippingAddress: { type: addressSnapshotSchema, required: true },
    billingAddress: { type: addressSnapshotSchema, required: true },
    coupon: { type: mongoose.Schema.Types.ObjectId, ref: "Coupon" },
    couponCode: String,
    subtotal: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    shippingCost: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    currency: { type: String, default: "INR" },
    payment: {
      method: { type: String, default: "COD" },
      status: {
        type: String,
        enum: ["Pending", "Paid", "Failed", "Refunded"],
        default: "Pending",
      },
      transactionId: String,
      provider: String,
      paidAt: Date,
      meta: mongoose.Schema.Types.Mixed,
    },
    fulfillment: {
      shipments: [shipmentSchema],
      orderStatus: {
        type: String,
        enum: [
          "Pending",
          "Confirmed",
          "Shipped",
          "Delivered",
          "Cancelled",
          "Completed",
        ],
        default: "Pending",
      },
      statusHistory: [statusHistorySchema],
    },
    priority: {
      type: String,
      enum: ["Low", "Normal", "High", "Urgent"],
      default: "Normal",
    },
    notes: String,
    isActive: { type: Boolean, default: true },
    isArchived: { type: Boolean, default: false },
    trackingnumber: { type: String, unique: true, sparse: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

// compute totals & generate orderNumber
orderSchema.pre("save", async function (next) {
  // compute line totals & subtotal
  this.subtotal = 0;
  if (Array.isArray(this.items)) {
    this.items.forEach((it) => {
      it.lineTotal =
        (it.mrp || 0) * (it.quantity || 0) -
        (it.discountAmount || 0) +
        (it.taxAmount || 0);
      this.subtotal += it.lineTotal;
    });
  }
  // totals
  this.totalAmount =
    this.subtotal +
    (this.shippingCost || 0) +
    (this.taxAmount || 0) -
    (this.discountAmount || 0);

  // orderNumber generation using OrderCounter (year-based)
  if (this.isNew && !this.orderNumber) {
    const year = new Date().getFullYear();
    const counter = await OrderCounter.findOneAndUpdate(
      { year },
      { $inc: { seq: 1 } },
      { new: true, upsert: true },
    );
    const seq = String(counter.seq).padStart(6, "0");
    this.orderNumber = `ORD-${year}-${seq}`;
  }

  next();
});

// useful indexes
orderSchema.index({ user: 1, "fulfillment.orderStatus": 1 });
orderSchema.index({ createdAt: -1 });

export default mongoose.model("Order", orderSchema);
