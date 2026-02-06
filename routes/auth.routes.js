import express from "express";
import {
  adminLogin,
  userLogin,
  userSignup,
  resetPassword,
  testRoute,
  updateAdminProfile,
  createAdmin,
  adminLogout,
  adminForgotPassword,
  getAllusers
} from "../controllers/auth.controller.js";
import { adminAuth } from "../middlewares/adminauth.js";

const router = express.Router();

router.post("/admin/login", adminLogin);
router.post("/login", userLogin);
router.post("/signup", userSignup);
router.post("/reset-password", resetPassword);
router.post("/test", testRoute)
router.put("/update-profile", adminAuth, updateAdminProfile);
router.post("/create", createAdmin)
router.post("/admin/logout", adminLogout)
router.post("/admin/forgot-password", adminForgotPassword);
router.get("/users", getAllusers);


export default router;
