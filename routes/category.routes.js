import express from "express";
import {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller.js";

import  {upload} from "../middlewares/uploadcategory.js";

const router = express.Router();

// ================= CREATE CATEGORY =================
// supports:
// - category image
// - product images
// - info section image
// - info card images
router.post(
  "/",
  upload.any(), // 🔥 multiple images support
  createCategory
);

// ================= GET ALL =================
router.get("/", getCategories);

// ================= GET BY ID =================
router.get("/:id", getCategoryById);

// ================= UPDATE CATEGORY =================
// supports image replace
router.put(
  "/:id",
  upload.any(), // 🔥 image edit support
  updateCategory
);

// ================= DELETE =================
router.delete("/:id", deleteCategory);

export default router;
