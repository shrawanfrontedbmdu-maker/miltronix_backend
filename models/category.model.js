import mongoose from "mongoose";

// ---------------- INFO CARD ----------------
const infoCardSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    image: {
      type: String,
      default: "/images/placeholder.png",
    },
    alt: String,
  },
  { _id: false }
);

// ---------------- FILTER ITEM ----------------
const filterItemSchema = new mongoose.Schema(
  {
    value: String, // e.g. "4k", "55"
    label: String, // e.g. "4K", "55 Inch"
  },
  { _id: false }
);

// ---------------- FILTER OPTIONS ----------------
const filterOptionsSchema = new mongoose.Schema(
  {
    price: {
      min: Number,
      max: Number,
      step: Number,
    },

    availability: {
      title: String,
      items: [filterItemSchema],
    },

    resolution: {
      title: String,
      items: [filterItemSchema],
    },

    screenSize: {
      title: String,
      items: [filterItemSchema],
    },
  },
  { _id: false }
);

// ---------------- CATEGORY ----------------
const categorySchema = new mongoose.Schema(
  {
    categoryKey: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    image: {
      type: String,
      default: "/images/placeholder.png",
    },

    pageTitle: String,
    pageSubtitle: String,
    description: String,

    breadcrumb: [String],

    // 🔥 FILTERS PER CATEGORY
    filterOptions: filterOptionsSchema,

    // 🔥 INFO / MARKETING SECTION
    infoSection: {
      title: String,
      subtitle: String,
      description: String,
      image: {
        type: String,
        default: "/images/placeholder.png",
      },
      cards: [infoCardSchema],
    },

    // 🔥 PRODUCT KEYS FOR RECOMMENDATION
    recommendationKeys: [
      {
        type: String, // productKey
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Category", categorySchema);
