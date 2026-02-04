import express from "express";
import {
  signup,
  verifyOtp,
  login,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
} from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/verify-otp", verifyOtp);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-otp", verifyResetOtp);
router.post("/reset-password", resetPassword);

export default router;
