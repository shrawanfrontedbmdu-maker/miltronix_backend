import express from "express";
import {
  createCustomer,
  loginCustomer,
  updateCustomer,
  toggleCustomerStatus,
  getAllCustomers,
  getCustomerById,
} from "../controllers/customer.controller.js";

import upload from "../middlewares/multer.js";

const router = express.Router();

router.post("/register", upload.single("image"), createCustomer);
router.post("/login", loginCustomer);

router.get("/", getAllCustomers); 
router.patch("/toggle-status/:id", toggleCustomerStatus); 

router.get("/:id", getCustomerById); 
router.put("/:id", upload.single("image"), updateCustomer); 

export default router;
