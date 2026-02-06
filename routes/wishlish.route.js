import express from "express";
import {
    getwishlish,
    addwishlistItem,
    updateWishlistItem,
    removeWishlistItem,
    mergeGuestWishlist
} from "../controllers/wishlist.controller.js";

const router = express.Router();

router.get("/", getwishlish);
router.post("/items", addwishlistItem);
router.patch("/items/:itemId", updateWishlistItem);
router.delete("/items/:itemId", removeWishlistItem);
router.post("/merge", mergeGuestWishlist);

export default router;
