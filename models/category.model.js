import mongoose from "mongoose";

// Card Schema
const cardSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    image: {
      type: String, // card image path
      default: "/images/placeholder.png",
    },
    alt: String,
  },
  { _id: false }
);

// Info Section Schema
const infoSectionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: function () {
      // Only required if the parent object exists (infoSection provided)
      return !!this;
    },
  },
  subtitle: String,
  description: String,
  image: {
    type: String,
    default: "/images/placeholder.png",
  },
  cards: [cardSchema],
});

// Category Schema
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
    pageSubtitle: String,
    description: String,
    image: {
      type: String, // main category image path
      default: "/images/placeholder.png",
    },
    infoSection: {
      type: infoSectionSchema,
      required: false, // optional, so categories without infoSection work
    },
  },
  { timestamps: true }
);

export default mongoose.model("Category", categorySchema);
