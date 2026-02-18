import dayjs from "dayjs";
import NotificationCampaign from "../models/notificationCampaign.model.js";
import NotificationDelivery from "../models/NotificationDelivery.model.js";

/** ✅ Controller: Get Notifications For Customer **/
export const getAvailableNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = dayjs();

    const campaigns = await NotificationCampaign.find({
      status: { $in: ["Pending", "Queued", "Active"] },
    });

    const deliveries = await NotificationDelivery.find({ userId });
    const deliveredIds = deliveries.map((d) =>
      d.campaignId.toString()
    );

    const visibleNotifications = [];
    const newDeliveries = [];

    for (const campaign of campaigns) {
      let shouldShow = false;

      if (campaign.scheduleType === "Send Now") {
        shouldShow = true;
      }

      if (campaign.scheduleType === "Scheduled") {
        shouldShow = campaign.scheduledDates?.some((date) =>
          dayjs(date).isBefore(now)
        );
      }

      if (!shouldShow) continue;

      visibleNotifications.push(campaign);

      // Create delivery record only if not exists
      if (!deliveredIds.includes(campaign._id.toString())) {
        newDeliveries.push({
          updateOne: {
            filter: { userId, campaignId: campaign._id },
            update: {
              userId,
              campaignId: campaign._id,
              deliveredAt: new Date(),
            },
            upsert: true,
          },
        });
      }
    }

    // Bulk insert new deliveries
    if (newDeliveries.length > 0) {
      await NotificationDelivery.bulkWrite(newDeliveries);
    }

    res.json({
      success: true,
      count: visibleNotifications.length,
      notifications: visibleNotifications,
    });
  } catch (error) {
    console.error("❌ Error fetching notifications:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};



