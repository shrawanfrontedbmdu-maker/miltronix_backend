import mongoose from "mongoose";

const invoiceItemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    total: { type: Number, default: 0 },
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    // 🔗 One-to-One with Order
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      unique: true, // 🔥 no duplicate invoice per order
    },

    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },

    customer: {
      name: { type: String, required: true },
      email: String,
      phone: String,
      company: String,
      address: String,
      city: String,
    },
    invoicedate: {
      type: Date
    },

    items: [invoiceItemSchema],

    subtotal: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 }, // ₹
    taxPercent: { type: Number, default: 0 }, // %
    total: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    dueDate: { type: Date, default: Date.now() },
    paidamount: { type: Number, default: 0 },
    dueamount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["draft", "sent", "paid", "overdue"],
      default: "draft",
    },

    notes: String,
    termsAndConditions: String,
  },
  { timestamps: true }
);

invoiceSchema.pre(["save", "findOneAndUpdate"], function (next) {
  const doc = this._update ? this._update : this;

  if (!doc.items) return next();

  doc.items.forEach((item) => {
    item.total = item.quantity * item.unitPrice;
  });

  doc.subtotal = doc.items.reduce((sum, i) => sum + i.total, 0);

  doc.taxAmount = doc.taxPercent
    ? (doc.subtotal * doc.taxPercent) / 100
    : doc.taxAmount || 0;

  doc.total = doc.subtotal + doc.taxAmount;

  next();
});

export default mongoose.model("Invoice", invoiceSchema);
