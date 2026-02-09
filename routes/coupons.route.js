import express from "express"
import { createCoupon, getAllCoupons, getCouponById, updateCoupon, deleteCoupon, toggleCouponStatus, getOrdersByCoupons } from "../controllers/coupons.controller.js"
const router = express.Router()

router.post("/", createCoupon);
router.get("/", getAllCoupons);
router.patch("/:id/toggle-status", toggleCouponStatus);
router.get("/:code/orders",getOrdersByCoupons)
router.get("/:id", getCouponById);
router.put("/:id", updateCoupon);
router.delete("/:id", deleteCoupon);

export default router;