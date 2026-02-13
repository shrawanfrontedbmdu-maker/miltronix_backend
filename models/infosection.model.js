import mongoose from "mongoose";

const infoSectionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    subtitle: { type: String },
    description: { type: String },
    image: { type: String },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" }, // <-- new
    cards: [
      {
        title: { type: String },
        description: { type: String },
        icon: { type: String },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("InfoSection", infoSectionSchema);
