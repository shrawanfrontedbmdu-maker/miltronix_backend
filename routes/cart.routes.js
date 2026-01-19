import express from "express";
import {
  getCart,
  addItem,
  updateItem,
  removeItem,
  mergeGuestCart
} from "../controllers/cart.controller.js";

const router = express.Router();

router.get("/", getCart);
router.post("/items", addItem);
router.patch("/items/:itemId", updateItem);
router.delete("/items/:itemId", removeItem);
router.post("/merge", mergeGuestCart);

export default router;
