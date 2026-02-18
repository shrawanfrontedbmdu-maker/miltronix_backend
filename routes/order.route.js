import express from "express";
import {
  getOrders,
  createOrder,
  getOrdersByMonth,
  editOrderById,
  deleteOrderById,
  getOrdersLastMonth,
  getOrdersThisYear,
  getOrdersThisMonth,
  getUserOrders,
  getOrderById,
  cancelOrder,
} from "../controllers/order.controller.js";
import authMiddleware from "../middlewares/auth.js";

const router = express.Router();

// ─── Admin / General ───────────────────────────────────────────────
router.get("/", authMiddleware, getOrders);               // all orders (add admin check if needed)
router.get("/by-month", getOrdersByMonth);
router.get("/this-month", getOrdersThisMonth);
router.get("/last-month", getOrdersLastMonth);
router.get("/this-year", getOrdersThisYear);

// ─── User (authenticated) ──────────────────────────────────────────
router.post("/", authMiddleware, createOrder);            // create order from cart
router.get("/my-orders", authMiddleware, getUserOrders);  // user's own orders list ✅ FIXED

// ─── Single order ──────────────────────────────────────────────────
// NOTE: named routes above must come before /:id to avoid route conflicts
router.get("/:id", authMiddleware, getOrderById);         // order detail ✅ FIXED
router.put("/:id", authMiddleware, editOrderById);        // edit order (added auth) ✅ FIXED
router.delete("/:id", authMiddleware, deleteOrderById);   // delete order ✅ FIXED
router.patch("/cancel/:id", authMiddleware, cancelOrder); // cancel order ✅ FIXED

export default router;