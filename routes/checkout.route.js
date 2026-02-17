import express from "express";
import authMiddleware from "../middlewares/auth.js";
import { getCheckoutDetails } from "../controllers/checkout.controller.js";

const router = express.Router();

router.post("/checkout-details", authMiddleware , getCheckoutDetails);
export default router;