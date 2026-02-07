import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    categoryKey: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    pageTitle: {
      type: String,
      required: true,
    },

    pageSubtitle: {
      type: String,
    },

    description: {
      type: String,
    },

    image: {
      type: String,
      default: "/images/placeholder.png",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Category", categorySchema);
