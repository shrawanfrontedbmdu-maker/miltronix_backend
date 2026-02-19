import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  reviewText: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "deleted"],
    default: "pending",
  },
  flaggedKeywords: {
    type: [String],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  images: [
    {
      url: {
        type: String,
      },
      altText: {
        type: String,
      },
      public_id: {
        type: String,
      },
    },
  ],
  videos: [
    {
      url: {
        type: String,
      },
      title: {
        type: String,
      },
      public_id: {
        type: String,
      },
    },
  ],
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  }
});

export default mongoose.model("Review", ReviewSchema);
