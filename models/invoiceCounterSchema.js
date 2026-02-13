import mongoose from "mongoose";
const counterSchema = new mongoose.Schema({
    year: { type: Number, required: true, unique: true },
    seq: { type: Number, default: 0 }
});

const InvoiceCounterModel = mongoose.model("Counter", counterSchema);
export default InvoiceCounterModel;