import express from "express";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from "../controllers/product.controller.js";
import upload from "../middlewares/multer.js";

const router = express.Router();

/* ================= CREATE PRODUCT ================= */
// Upload up to 6 images per product
router.post("/", upload.array("images", 6), createProduct);

/* ================= UPDATE PRODUCT ================= */

router.put("/:id", upload.array("images", 6), updateProduct);

/* ================= GET ALL PRODUCTS ================= */
router.get("/", getProducts);

/* ================= GET PRODUCT BY ID ================= */
router.get("/:id", getProductById);

/* ================= DELETE PRODUCT ================= */
router.delete("/:id", deleteProduct);

export default router;
