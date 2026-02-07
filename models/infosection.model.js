import mongoose from "mongoose";

// ======== Card Schema ========
const cardSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: "" },
  icon: { type: String, default: "" }, // or image: String
});

// ======== Info Section Schema ========
const infoSectionSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: function () { return !!this.title; } // makes sure title exists if provided
  },
  subtitle: { type: String, default: "" },
  description: { type: String, default: "" },
  image: { type: String, default: "/images/placeholder.png" },
  cards: [cardSchema], // array of cardSchema
}, { timestamps: true }); // adds createdAt and updatedAt automatically

// ======== Info Section Model ========
const InfoSection = mongoose.model("InfoSection", infoSectionSchema);

export default InfoSection;
