import express from "express";
import {
  getOrders,
  createOrder,
  getOrdersByMonth,
  editOrderById,
  getOrdersLastMonth,
  getOrdersThisYear,
  getOrdersThisMonth,
  getUserOrders,
} from "../controllers/order.controller.js";
import authMiddleware from "../middlewares/auth.js";

const router = express.Router();

router.get("/", getOrders);
router.post("/", authMiddleware, createOrder);
router.get("/by-month", getOrdersByMonth);
router.put("/:id", editOrderById);
router.get("/this-month", getOrdersThisMonth);
router.get("/last-month", getOrdersLastMonth);
router.get("/this-year", getOrdersThisYear);

export default router;
