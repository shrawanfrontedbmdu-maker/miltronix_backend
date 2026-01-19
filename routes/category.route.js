import express from "express";
import {
  createCategory,
  deleteCategory,
  editCategory,
  getCategories,
  getParentCategories,
} from "../controllers/category.controller.js";

const router = express.Router();

router.post("/", createCategory);
router.get("/", getCategories);
router.get("/parent", getParentCategories);
router.put("/:id", editCategory);
router.delete("/:id", deleteCategory);

export default router;
