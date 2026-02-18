import express from "express";
import {
  signup,
  verifyOtp,
  login,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  googleLogin,
  getUserProfile,
  updateUserProfile,
  getMyWishlist, // <-- import Google login
} from "../controllers/auth.controller.js";
import authMiddleware from "../middlewares/auth.js";
import { getOrderById, getUserOrders } from "../controllers/order.controller.js";
import { getAddresses, updateAddress } from "../controllers/address.controller.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/verify-otp", verifyOtp);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-otp", verifyResetOtp);
router.post("/reset-password", resetPassword);
router.post("/google-login", googleLogin); // <-- Google login route
router.get("/profile", authMiddleware, getUserProfile);
router.patch("/profile", authMiddleware, updateUserProfile);
router.get("/orders", authMiddleware, getUserOrders);
router.get("/order/:id", authMiddleware, getOrderById); 
router.get("/address", authMiddleware, getAddresses); 
router.put("/address/:id", authMiddleware, updateAddress);
router.get("/wishlist", authMiddleware, getMyWishlist); 

export default router;
