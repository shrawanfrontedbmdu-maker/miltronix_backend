import express from "express";
import {
  signup,
  verifyOtp,
  login,
  resendOtp
} from "../controllers/auth.controller.js";

const router = express.Router();

// Routes
router.post("/signup", signup);
router.post("/verify-otp", verifyOtp);
router.post("/login", login);
router.post("/resend-otp", resendOtp);

export default router;
