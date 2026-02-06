import express from "express";
import {
  addWishlistItem,
  getWishlistByUser,
  removeWishlistItem,
  clearWishlist
} from "../controllers/wishlist.controller.js";

const router = express.Router();

router.post("/add", addWishlistItem);
router.get("/:userId", getWishlistByUser);
router.delete("/:userId/:itemId", removeWishlistItem);
router.delete("/clear/:userId", clearWishlist);

export default router;
