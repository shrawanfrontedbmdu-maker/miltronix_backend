import mongoose from 'mongoose';

const cardSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String, default: "/images/placeholder.png" },
    alt: String,
  },
  { _id: false }
);

const infoSectionSchema = new mongoose.Schema({
  title: { type: String, required: function () { return !!this; } },
  subtitle: String,
  description: String,
  image: { type: String, default: "/images/placeholder.png" },
  cards: [cardSchema],
});

const categorySchema = new mongoose.Schema(
  {
    categoryKey: { type: String, required: true, unique: true, lowercase: true, trim: true },
    pageTitle: { type: String, required: true },
    pageSubtitle: String,
    description: String,
    image: { type: String, default: "/images/placeholder.png" },
    infoSection: { type: infoSectionSchema, required: false },
  },
  { timestamps: true }
);

export default mongoose.model("Category", categorySchema);
