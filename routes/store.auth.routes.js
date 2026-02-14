import express from "express";
import { adminCreateStore, storeLogin } from "../controllers/store.auth.controller.js";
import { verifyAdmin } from "../middlewares/verifyAdmin.js";

const router = express.Router();

// Store owner login
router.post("/login", storeLogin);

// router.get('/me', storeProfile);

export default router;
