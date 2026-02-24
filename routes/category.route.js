import express from "express";
import { upload } from "../middlewares/uploadcategory.js";
import { createCategory, getCategories, getCategoryById, updateCategory, deleteCategory } from "../controllers/category.controller.js";

const router = express.Router();

// DEBUG — add karo temporarily
router.use((req, res, next) => {
  console.log("Category route hit:", req.method, req.url);
  next();
});

router.post("/", upload.any(), createCategory);
router.get("/", getCategories);
router.get("/:id", getCategoryById);
router.put("/:id", upload.any(), updateCategory);
router.delete("/:id", deleteCategory);

export default router;