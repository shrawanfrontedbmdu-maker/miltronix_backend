import express from "express";
import {
  createReview,
  getAllReviews,
  getReviewById,
  updateReviewStatus,
  deleteReview,
  getReviewsByProductId
} from "../controllers/review.controller.js";
import { uploadReviewMedia } from "../config/cloudinary.js";
import authMiddleware from "../middlewares/auth.js";

const router = express.Router();

router.post(
  "/",
  uploadReviewMedia.fields([
    { name: "images", maxCount: 5 },
    { name: "videos", maxCount: 2 },
  ]),
  authMiddleware,
  createReview
);

router.get("/", getAllReviews);
router.get("/product/:productId", getReviewsByProductId);  // ✅ /product/ prefix add kiya
router.get("/:id", getReviewById);
router.patch("/:id/status", authMiddleware, updateReviewStatus);  // ✅ auth add kiya
router.delete("/:id", authMiddleware, deleteReview);

export default router;