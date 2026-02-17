import mongoose from "mongoose";

const subcategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    description: {
      type: String,
    },

    image: {
      type: String,
      default: "/images/placeholder.png",
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },

    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Index for faster queries
subcategorySchema.index({ category: 1, status: 1 });
subcategorySchema.index({ slug: 1, category: 1 });

export default mongoose.model("Subcategory", subcategorySchema);
