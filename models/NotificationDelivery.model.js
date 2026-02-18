import mongoose from "mongoose";

const NotificationDeliverySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "NotificationCampaign",
      required: true,
    },
    deliveredAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

NotificationDeliverySchema.index(
  { userId: 1, campaignId: 1 },
  { unique: true }
);

export default mongoose.model(
  "NotificationDelivery",
  NotificationDeliverySchema
);
