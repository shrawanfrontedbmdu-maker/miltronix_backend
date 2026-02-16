import express from "express";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getFeaturedProducts,
} from "../controllers/product.controller.js";
import upload from "../middlewares/multer.js";

const router = express.Router();

/* ================= CREATE PRODUCT ================= */
router.post(
  "/",
  upload.array("images", 6),
  createProduct
);

/* ================= GET ALL PRODUCTS ================= */
router.get("/", getProducts);

/* ================= GET FEATURED PRODUCTS ================= */
router.get("/featured", getFeaturedProducts);

/* ================= GET PRODUCT BY ID ================= */
router.get("/:id", getProductById);

/* ================= UPDATE PRODUCT ================= */
router.put(
  "/:id",
  upload.array("images", 6),
  updateProduct
);

/* ================= DELETE PRODUCT ================= */
router.delete("/:id", deleteProduct);

export default router;