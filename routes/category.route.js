import express from "express";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  getCategories,
  getCategoryById,
} from "../controllers/category.controller.js";
import upload from "../middlewares/multer.js";

const router = express.Router();

router.post("/", upload.any(), createCategory);
router.put("/:id", upload.any(), updateCategory);
router.get("/", getCategories);
router.get("/:id", getCategoryById);
router.delete("/:id", deleteCategory);

export default router;
