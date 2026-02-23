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

    // ✅ Feature Section Description
    featureDescription: {
      type: String,
    },

    // ✅ FEATURES ARRAY (Icon = Uploaded Image URL)
    features: [
      {
        title: {
          type: String,
          required: true,
        },
        icon: {
          type: String, // Cloudinary image URL
          required: true,
        },
      },
    ],

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Category", categorySchema);