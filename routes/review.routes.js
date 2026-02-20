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
router.get("/:productId", getReviewsByProductId);
router.get("/:id", getReviewById);
router.patch("/:id/status", updateReviewStatus);
router.delete("/:id", deleteReview);

export default router;
