import express from "express";
import { addItemToCart, getCart, removeFromCart } from "../controllers/cart.controller.js";
import  protect  from "../middlewares/auth.js";

const router = express.Router();

// Add to cart (login required)
router.post("/add", protect, addItemToCart);

// Get cart (login required)
router.get("/", protect, getCart);

router.post("/remove", protect, removeFromCart);

export default router;  