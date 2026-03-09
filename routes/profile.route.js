import express from "express";
import authMiddleware from "../middlewares/auth.js";
import upload from "../middlewares/multer.js";
import {
  getMyProfile,
  createProfile,
  updateProfile,
  uploadAvatarHandler,
  deleteAvatarHandler,
  deleteProfile,
} from "../controllers/profile.controller.js";

const router = express.Router();

// ── Profile CRUD ─────────────────────────────────────────
router.get   ("/me",        authMiddleware, getMyProfile);
router.post  ("/create",    authMiddleware, createProfile);
router.put   ("/me",        authMiddleware, updateProfile);
router.delete("/me",        authMiddleware, deleteProfile);

// ── Avatar ───────────────────────────────────────────────
router.post  ("/me/avatar", authMiddleware, upload.single("avatar"), uploadAvatarHandler);
router.delete("/me/avatar", authMiddleware, deleteAvatarHandler);

export default router;