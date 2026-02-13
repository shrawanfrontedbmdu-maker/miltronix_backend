import express from "express";
import {
  signup,
  verifyOtp,
  login,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  googleLogin, // <-- import Google login
} from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/verify-otp", verifyOtp);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-otp", verifyResetOtp);
router.post("/reset-password", resetPassword);
router.post("/google-login", googleLogin); // <-- Google login route

export default router;
