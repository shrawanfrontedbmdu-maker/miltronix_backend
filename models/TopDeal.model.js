import mongoose from "mongoose";

const topDealSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    // Primary / thumbnail image
    image: {
      url: { type: String },
      public_id: { type: String },
      alt: { type: String, trim: true },
    },

    // Additional images (gallery)
    images: [
      {
        url: { type: String },
        public_id: { type: String },
        alt: { type: String, trim: true },
      },
    ],

    // Products linked to this deal
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],

    isActive: {
      type: Boolean,
      default: true,
    },

    // Soft delete
    isArchived: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
  },
  { timestamps: true, versionKey: false }
);

// Active deals listing ke liye
topDealSchema.index({ isActive: 1, createdAt: -1 });

export default mongoose.model("TopDeal", topDealSchema);