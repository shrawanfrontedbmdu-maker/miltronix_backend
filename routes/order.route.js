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
import { verifyAdmin } from "../middlewares/verifyAdmin.js";

const router = express.Router();

// ─── Admin / General ───────────────────────────────────────────────
router.get("/", getOrders);               // all orders (add admin check if needed)
router.get("/by-month", getOrdersByMonth);
router.get("/this-month", getOrdersThisMonth);
router.get("/last-month", getOrdersLastMonth);
router.get("/this-year", getOrdersThisYear);
router.post("/", authMiddleware, createOrder);            
router.get("/my-orders", authMiddleware, getUserOrders); 
router.get("/:id", authMiddleware, getOrderById);         
router.put("/:id", authMiddleware, editOrderById);        
router.delete("/:id", authMiddleware, deleteOrderById);   
router.patch("/cancel/:id", authMiddleware, cancelOrder); 

export default router;