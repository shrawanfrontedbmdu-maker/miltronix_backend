import mongoose from "mongoose";
const orderCounterSchema = new mongoose.Schema({
  year: {
    type: Number,
    required: true,
    unique: true
  },
  seq: {
    type: Number,
    default: 0
  }
});
 const OrderCounter = mongoose.model("OrderCounter", orderCounterSchema);
 export default OrderCounter;
