import express from "express";
import { upload } from "../middlewares/uploadcategory.js";
import { createCategory, getCategories, getCategoryById, updateCategory, deleteCategory } from "../controllers/category.controller.js";

const router = express.Router();

router.post("/", upload.any(), createCategory);
router.get("/", getCategories);
router.get("/:id", getCategoryById);
router.put("/:id", upload.any(), updateCategory);  // ✅ .any() zaroori
router.delete("/:id", deleteCategory);

export default router;