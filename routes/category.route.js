import express from "express";
import {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller.js";

import upload from "../middlewares/multer.js";

const router = express.Router();

// ================= CREATE CATEGORY =================
// Multiple files: main image + infoSection + cards
router.post(
  "/",
  upload.fields([
    { name: "image", maxCount: 1 },             // main category image
    { name: "infoSectionImage", maxCount: 1 }, // infoSection image
    { name: "cards[0][image]", maxCount: 1 },  // card 0
    { name: "cards[1][image]", maxCount: 1 },  // card 1
    { name: "cards[2][image]", maxCount: 1 },  // card 2 (optional, add more if needed)
  ]),
  createCategory
);

// ================= GET ALL CATEGORIES =================
router.get("/", getCategories);

// ================= GET CATEGORY BY ID =================
router.get("/:id", getCategoryById);

// ================= UPDATE CATEGORY =================
router.put(
  "/:id",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "infoSectionImage", maxCount: 1 },
    { name: "cards[0][image]", maxCount: 1 },
    { name: "cards[1][image]", maxCount: 1 },
    { name: "cards[2][image]", maxCount: 1 },
  ]),
  updateCategory
);

// ================= DELETE CATEGORY =================
router.delete("/:id", deleteCategory);

export default router;
