import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  title: {
    type: String,
  },
  description: {
    type: String,
  },
  createdBy: {
    type: String,
    enum: ["Admin", "Seller", "Other"],
  },
  stock: {
    type: Number,
  },
  tagID: {
    type: Number,
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    default: null,
  },
  isSubCategory: {
    type: Boolean,
    default: false,
  },
});

export default mongoose.model("Category", categorySchema);
