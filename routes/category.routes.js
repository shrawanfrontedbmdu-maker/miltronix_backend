import express from "express";
import {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller.js";

import { upload } from "../middlewares/uploadcategory.js";

const router = express.Router();

// ===== CREATE CATEGORY =====
router.post(
  "/",
  upload.fields([{ name: "image", maxCount: 1 }]), 
  createCategory
);

// ===== GET ALL =====
router.get("/", getCategories);

// ===== GET BY ID =====
router.get("/:id", getCategoryById);

// ===== UPDATE CATEGORY =====
router.put(
  "/:id",
  upload.fields([{ name: "image", maxCount: 1 }]), 
  updateCategory
);

// ===== DELETE CATEGORY =====
router.delete("/:id", deleteCategory);

export default router;
