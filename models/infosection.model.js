import mongoose from "mongoose";

// ===== Card Schema =====
const cardSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: "" },
  icon: { type: String, default: "" }, // card image URL
});

// ===== Info Section Schema =====
const infoSectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subtitle: { type: String, default: "" },
  description: { type: String, default: "" },
  image: { type: String, default: "/images/placeholder.png" }, // main image
  cards: [cardSchema],
}, { timestamps: true });

const InfoSection = mongoose.model("InfoSection", infoSectionSchema);

export default InfoSection;
