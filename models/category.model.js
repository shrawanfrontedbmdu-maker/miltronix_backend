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

    // ✅ FEATURES FIELD
    features: [
      {
        title: {
          type: String,
          required: true,
        },
        description: {
          type: String,
        },
        image: {
          type: String,
          default: "/images/placeholder.png",
        },
      },
    ],

    // ✅ STATUS FIELD
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Category", categorySchema);