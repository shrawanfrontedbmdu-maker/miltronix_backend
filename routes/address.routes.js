import express from "express";
import {
  addAddress,
  getAddresses,
  updateAddress,
  deleteAddress,
} from "../controllers/address.controller.js";

import authMiddleware from "../middlewares/auth.js";

const router = express.Router();

// All routes protected (login required)
router.post("/", authMiddleware, addAddress);
router.get("/", authMiddleware, getAddresses);
router.put("/:id", authMiddleware, updateAddress);
router.delete("/:id", authMiddleware, deleteAddress);

export default router;
