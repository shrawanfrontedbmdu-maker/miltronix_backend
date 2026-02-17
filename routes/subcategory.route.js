import express from "express";
import {
  createSubcategory,
  getSubcategories,
  getSubcategoryById,
  updateSubcategory,
  deleteSubcategory,
} from "../controllers/subcategory.controller.js";

const router = express.Router();

/* ================= CREATE SUBCATEGORY ================= */
router.post("/", createSubcategory);

/* ================= GET ALL SUBCATEGORIES (with optional category filter) ================= */
router.get("/", getSubcategories);

/* ================= GET SUBCATEGORY BY ID ================= */
router.get("/:id", getSubcategoryById);

/* ================= UPDATE SUBCATEGORY ================= */
router.put("/:id", updateSubcategory);

/* ================= DELETE SUBCATEGORY ================= */
router.delete("/:id", deleteSubcategory);

export default router;
