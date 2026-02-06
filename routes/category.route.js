import express from "express";
import {
  createCategory,
  deleteCategory,
  editCategory,
  getCategories,
  getParentCategories,
} from "../controllers/category.controller.js";
import upload from "../middlewares/multer.js";
const router = express.Router();

router.post("/", upload.single("icon"), createCategory);
router.put("/:id", upload.single("icon"), editCategory);
router.get("/", getCategories);
router.get("/parent", getParentCategories);
router.delete("/:id", deleteCategory);

export default router;
