import mongoose from "mongoose";

const featureSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  icon: {
    type: String, // Cloudinary image URL
    required: true,
  },
});

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

    // 🔥 FEATURE SECTION (Image jaisa structure)
    featuresSection: {
      title: {
        type: String, // Example: "QLED Features"
      },
      description: {
        type: String, // Paragraph text
      },
    },

    // 🔥 FEATURE ICONS ARRAY
    features: [featureSchema],

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