import express from "express";
import {
  createSubcategory,
  getSubcategories,
  getSubcategoryById,
  updateSubcategory,
  deleteSubcategory,
} from "../controllers/subcategory.controller.js";
import upload from "../middlewares/multer.js";

const router = express.Router();

/* ================= CREATE SUBCATEGORY ================= */
router.post("/",
  upload.fields([{ name: "image", maxCount: 1 }]), 
  createSubcategory);

/* ================= GET ALL SUBCATEGORIES (with optional category filter) ================= */
router.get("/", getSubcategories);

/* ================= GET SUBCATEGORY BY ID ================= */
router.get("/:id", getSubcategoryById);

/* ================= UPDATE SUBCATEGORY ================= */
router.put("/:id", 
  upload.fields([{ name: "image", maxCount: 1 }]), 
  updateSubcategory);

/* ================= DELETE SUBCATEGORY ================= */
router.delete("/:id", deleteSubcategory);

export default router;
