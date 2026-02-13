import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  priority: {
    type: String,
    enum: ["low", "normal", "high"],
    default: "normal",
  },
  read: {
    type: Boolean,
    default: false,
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  type: {
    type: String,
    enum: ["order", "system", "promotion", "other"],
    default: "other",
  },
});

export default mongoose.model("Notification", notificationSchema);
