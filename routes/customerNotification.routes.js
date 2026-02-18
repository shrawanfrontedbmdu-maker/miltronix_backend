import express from "express";
import { getAvailableNotifications } from "../controllers/customerNotification.controller.js";
import authMiddleware from "../middlewares/auth.js";

const router = express.Router();

router.get("/", authMiddleware, getAvailableNotifications);

export default router;
