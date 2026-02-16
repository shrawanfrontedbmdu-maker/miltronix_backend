import mongoose from "mongoose";

const filterOptionSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
    },

    value: {
      type: String,
      required: true,
      trim: true,
    },

    filterGroup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FilterGroup",
      required: true,
    },

    color: {
      type: String,
      default: null,
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

filterOptionSchema.index({ filterGroup: 1, status: 1 });

export default mongoose.model("FilterOption", filterOptionSchema);
