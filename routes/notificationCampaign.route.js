import express from "express";
import upload from "../middlewares/multer.js";
import {
  createNotificationCampaign,
  getAllNotificationCampaigns,
  updateNotificationCampaign,
  deleteNotificationCampaign,
} from "../controllers/notificationCampaign.controller.js";

const router = express.Router();

// Create notification campaign (with image)
router.post("/", upload.single("imageFile"), createNotificationCampaign);

// Get all campaigns
router.get("/", getAllNotificationCampaigns);

// Update existing campaign (replace image if uploaded)
router.put("/:id", upload.single("imageFile"), updateNotificationCampaign);

// Delete campaign
router.delete("/:id", deleteNotificationCampaign);

export default router;
