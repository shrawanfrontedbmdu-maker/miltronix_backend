import express from "express";
import {
  getWishlistByUser,
  addWishlistItem,
  removeWishlistItem,
  clearWishlist,
  // mergeGuestWishlist // optional, implement if needed
} from "../controllers/wishlist.controller.js";

const router = express.Router();

/* ================= GET WISHLIST BY USER ================= *
router.get("/user/:userId", getWishlistByUser);

/* ================= ADD ITEM TO WISHLIST ================= */
// Body: { userId, productId, variant, title, images, category, priceSnapshot }
router.post("/items", addWishlistItem);

/* ================= REMOVE SINGLE ITEM =================*/
router.delete("/items/:userId/:itemId", removeWishlistItem);

/* ================= CLEAR WISHLIST ================*/
router.delete("/clear/:userId", clearWishlist);

/* ================= OPTIONAL: MERGE GUEST WISHLIST ================= */
// router.post("/merge", mergeGuestWishlist);

export default router;
