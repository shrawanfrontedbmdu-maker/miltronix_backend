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

// CREATE
router.post("/", upload.any(), createCategory);

// GET ALL
router.get("/", getCategories);

// GET BY ID
router.get("/:id", getCategoryById);

// UPDATE
router.put("/:id", upload.any(), updateCategory);

// DELETE
router.delete("/:id", deleteCategory);

export default router;
