import mongoose from "mongoose";

const invoiceItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  total: {type: Number,required: true,default: 0,
  },
});

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    customer: {
      name: { type: String, required: true },
      email: { type: String },
      address: { type: String },
      company:{type:String},
      phone:{type:Number},
      address:{type:String},
      city:{type:String}
    },
    items: [invoiceItemSchema],
    subtotal: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    dueDate: { type: Date },
    status: {
      type: String,
      enum: ["draft", "sent", "paid", "overdue"],
      default: "draft",
    },
    notes: { type: String },
    termsAndConditions: { type: String },
  },
  { timestamps: true }
);

invoiceSchema.pre("save", function (next) {
  this.items.forEach((item) => {
    item.total = item.quantity * item.unitPrice;
  });

  this.subtotal = this.items.reduce((acc, item) => acc + item.total, 0);
  this.total = this.subtotal + this.tax;
  next();
});

export default mongoose.model("Invoice", invoiceSchema);
