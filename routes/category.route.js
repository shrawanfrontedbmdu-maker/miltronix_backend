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

const uploadFields = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "infoSectionImage", maxCount: 1 },
  { name: "cards[0][image]" },
  { name: "cards[1][image]" },
  { name: "cards[2][image]" },
  { name: "cards[3][image]" },
  { name: "cards[4][image]" },
]);

router.post("/", uploadFields, createCategory);
router.put("/:id", uploadFields, updateCategory);
router.get("/", getCategories);
router.get("/:id", getCategoryById);
router.delete("/:id", deleteCategory);

export default router;
