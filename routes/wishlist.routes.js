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

// ⚠️ clear route must come BEFORE :userId/:itemId
router.delete("/clear/:userId", clearWishlist);

router.delete("/:userId/:itemId", removeWishlistItem);

export default router;
