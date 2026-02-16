import mongoose from "mongoose";

const filterGroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    displayName: {
      type: String,
      required: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    filterType: {
      type: String,
      enum: ["checkbox", "range", "dropdown", "color", "size"],
      default: "checkbox",
    },

    description: {
      type: String,
    },

    displayOrder: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

filterGroupSchema.index({ category: 1, status: 1 });

export default mongoose.model("FilterGroup", filterGroupSchema);
