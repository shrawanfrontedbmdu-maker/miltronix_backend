import express from "express";
import { addItemToCart, getCart } from "../controllers/cart.controller.js";

const router = express.Router();

// Add to cart
router.post("/add", addItemToCart);

// Get cart
router.get("/", getCart);

export default router;
