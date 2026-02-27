import express from "express";
import {
  createCustomer,
  loginCustomer,
  updateCustomer,
  toggleCustomerStatus,
  getAllCustomers,
  getCustomerById,
  addRewardPoints,
  deductRewardPoints,
  deleteCustomer,
} from "../controllers/customer.controller.js";

import upload from "../middlewares/multer.js";

const router = express.Router();

// Auth
router.post("/register", upload.single("image"), createCustomer);
router.post("/login", loginCustomer);

// List
router.get("/", getAllCustomers);

// Single customer
router.get("/:id", getCustomerById);
router.put("/:id", upload.single("image"), updateCustomer);
router.delete("/:id", deleteCustomer);

// Actions
router.patch("/:id/toggle-status", toggleCustomerStatus);
router.patch("/:id/reward/add", addRewardPoints);
router.patch("/:id/reward/deduct", deductRewardPoints);

export default router;