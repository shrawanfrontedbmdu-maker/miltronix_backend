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
  addProductToDeal,
  removeProductFromDeal,
} from "../controllers/product.controller.js";
import upload from "../middlewares/multer.js";

const router = express.Router();

/* ================= CREATE PRODUCT ================= */
router.post("/", upload.any(), createProduct);

/* ================= GET ALL PRODUCTS ================= */
router.get("/", getProducts);

/* ================= SEARCH ================= */
router.get("/search-suggestions", searchSuggestions);
router.get("/search", searchProducts);

/* ================= FEATURED / RECOMMENDED ================= */
router.get("/featured", getFeaturedProducts);
router.get("/recommended", getRecommendedProducts);

/* ================= TOP DEAL — Active deal fetch (frontend) ================= */
router.get("/top-deals", getTopDealProducts);

/* ================= TOP DEAL — Add / Remove product ================= */
router.patch("/top-deals/:id/add-product", addProductToDeal);
router.patch("/top-deals/:id/remove-product", removeProductFromDeal);

/* ================= GET PRODUCT BY ID ================= */
router.get("/:id", getProductById);

/* ================= UPDATE PRODUCT ================= */
router.put("/:id", upload.any(), updateProduct);

/* ================= DELETE PRODUCT ================= */
router.delete("/:id", deleteProduct);

export default router;