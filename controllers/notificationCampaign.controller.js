import NotificationCampaign from "../models/notificationCampaign.model.js";
import { uploadImage, deleteImage } from "../utils/cloudinary.js";
import { getPublicIdFromUrl } from "../utils/getPublicId.js";

// Create Notification Campaign
export const createNotificationCampaign = async (req, res) => {
  try {
    const {
      title,
      body,
      link,
      scheduleType,
      scheduledDates,
    } = req.body;

    let imageUrl = null;

    // If image uploaded through form-data
    if (req.file) {
      const upload = await uploadImage(
        req.file.buffer,
        "notification-campaigns"
      );
      imageUrl = upload.url;
    }

    const campaign = new NotificationCampaign({
      title,
      body,
      link,
      scheduleType,
      scheduledDates:
        scheduleType === "Scheduled" && scheduledDates
          ? JSON.parse(scheduledDates)
          : [],
      imageUrl,
    });

    await campaign.save();

    res.status(201).json({
      success: true,
      message: "Notification campaign created successfully",
      campaign,
    });
  } catch (error) {
    console.error("❌ Error creating campaign:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating campaign",
      error: error.message,
    });
  }
};

// Get All Notification Campaigns
export const getAllNotificationCampaigns = async (req, res) => {
  try {
    const { scheduleType } = req.query;
    const filter = {};

    if (scheduleType) filter.scheduleType = scheduleType;

    const campaigns = await NotificationCampaign.find(filter).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: campaigns.length,
      campaigns,
    });
  } catch (error) {
    console.error("❌ Error fetching campaigns:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching campaigns",
      error: error.message,
    });
  }
};

// Update Notification Campaign (with Cloudinary support)
export const updateNotificationCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      body,
      link,
      scheduleType,
      scheduledDates,
    } = req.body;

    const campaign = await NotificationCampaign.findById(id);
    if (!campaign)
      return res.status(404).json({ message: "Notification not found" });

    // Replace image if uploaded
    if (req.file) {
      // Delete old image
      if (campaign.imageUrl) {
        const publicId = getPublicIdFromUrl(campaign.imageUrl);
        await deleteImage(publicId);
      }
      // Upload new one
      const upload = await uploadImage(
        req.file.buffer,
        "notification-campaigns"
      );
      campaign.imageUrl = upload.url;
    }

    // Update other fields if provided
    if (title !== undefined) campaign.title = title;
    if (body !== undefined) campaign.body = body;
    if (link !== undefined) campaign.link = link;
    if (scheduleType !== undefined) campaign.scheduleType = scheduleType;

    if (scheduleType === "Scheduled" && scheduledDates)
      campaign.scheduledDates = JSON.parse(scheduledDates);

    await campaign.save();

    res.json({
      success: true,
      message: "Notification campaign updated successfully",
      campaign,
    });
  } catch (error) {
    console.error("❌ Error updating campaign:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating campaign",
      error: error.message,
    });
  }
};

// Delete Notification Campaign (and image from Cloudinary)
export const deleteNotificationCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const campaign = await NotificationCampaign.findById(id);
    if (!campaign)
      return res.status(404).json({ message: "Notification not found" });

    if (campaign.imageUrl) {
      const publicId = getPublicIdFromUrl(campaign.imageUrl);
      await deleteImage(publicId);
    }

    await campaign.deleteOne();

    res.json({
      success: true,
      message: "Notification campaign deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting campaign:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting campaign",
      error: error.message,
    });
  }
};
