import mongoose from "mongoose";

const NotificationCampaignSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    link: { type: String, default: "" },
    imageUrl: { type: String, default: null },
    scheduleType: {
      type: String,
      enum: ["Send Now", "Scheduled"],
      required: true,
    },
    scheduledDates: [{ type: Date }],
    status: {
      type: String,
      enum: ["Pending", "Queued", "Active", "Sent", "Paused", "Finished"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model(
  "NotificationCampaign",
  NotificationCampaignSchema
);
