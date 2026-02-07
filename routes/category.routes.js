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

// ================= CREATE CATEGORY =================
// - category image only
router.post(
  "/",
  upload.single("image"),
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
  upload.single("image"),
  updateCategory
);

// ================= DELETE =================
router.delete("/:id", deleteCategory);

export default router;
