import express from "express";
import {
  getNotificationById,
  getNotifications,
  createNotification,
  updateNotification,
  deleteNotification,
  filterNotificationsByType,
  getNotificationsThisMonth,
  getNotificationsLastMonth,
  getNotificationsThisYear,
} from "../controllers/notification.controller.js";
import { verifyAdmin } from "../middlewares/verifyAdmin.js";

const router = express.Router();

router.get("/", getNotifications);
router.get("/:id", getNotificationById);
router.post("/", verifyAdmin, createNotification);
router.put("/:id", verifyAdmin, updateNotification);
router.delete("/:id", verifyAdmin, deleteNotification);
router.get("/filter/:type", filterNotificationsByType);
router.get("/this-month", getNotificationsThisMonth);
router.get("/last-month", getNotificationsLastMonth);
router.get("/this-year", getNotificationsThisYear);

export default router;
