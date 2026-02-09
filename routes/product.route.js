import express from "express";
import {
  createProduct,
  getProducts,
  updateProduct,
  deleteProduct,
  getProductById,
} from "../controllers/product.controller.js";
import upload from "../middlewares/multer.js";

const router = express.Router();

router.post("/", upload.array("images", 6), createProduct);
router.put("/:id", upload.array("images", 6), updateProduct);
router.get("/", getProducts);
router.get("/:id", getProductById);
router.delete("/:id", deleteProduct);

export default router;
