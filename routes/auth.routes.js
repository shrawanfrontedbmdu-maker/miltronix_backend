import express from "express";
import {
  adminLogin,
  userLogin,
  userSignup,
  resetPassword,
  testRoute,
  verifyOtpAndRegister
} from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/admin/login", adminLogin);
router.post("/login", userLogin);
router.post("/signup", userSignup);
router.post("/verify-otp", verifyOtpAndRegister);
router.post("/reset-password", resetPassword);
router.post("/test", testRoute)

export default router;
