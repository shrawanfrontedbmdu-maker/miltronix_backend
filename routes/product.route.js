import express from "express";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getFeaturedProducts,
  getRecommendedProducts,
  getTopDealProducts, 
  searchProducts,
  searchSuggestions,
} from "../controllers/product.controller.js";
import upload from "../middlewares/multer.js";

const router = express.Router();

/* ================= CREATE PRODUCT ================= */
router.post("/", upload.any(), createProduct);

/* ================= GET ALL PRODUCTS ================= */
router.get("/", getProducts);

router.get("/search-suggestions", searchSuggestions);
router.get("/search", searchProducts);

/* ================= GET FEATURED PRODUCTS ================= */
router.get("/featured", getFeaturedProducts);

router.get("/recommended", getRecommendedProducts);

/* ================= GET TOP DEAL PRODUCTS ================= */ 
router.get("/top-deals", getTopDealProducts);

/* ================= GET PRODUCT BY ID ================= */
router.get("/:id", getProductById); 

/* ================= UPDATE PRODUCT ================= */
router.put("/:id", upload.any(), updateProduct);

/* ================= DELETE PRODUCT ================= */
router.delete("/:id", deleteProduct);

export default router;