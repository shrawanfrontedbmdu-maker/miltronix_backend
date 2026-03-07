import express from "express";
import {
  createServiceRequest,
  getServiceRequestById,
  getServiceRequests,
  updateServiceRequest,
  deleteServiceRequest,
  filterServiceRequests,
  getServiceRequestsByUser,
} from "../controllers/serviceRequest.controller.js";
import authMiddleware from "../middlewares/auth.js";

const router = express.Router();

// ─── Static routes FIRST ──────────────────────────────────────────────────────

// Only logged-in user's requests
router.get("/user/my-requests", authMiddleware, getServiceRequestsByUser);

// Filter by status / type / priority
router.get("/filter", filterServiceRequests);

// ─── Collection routes ────────────────────────────────────────────────────────

router.get("/", getServiceRequests);
router.post("/", authMiddleware, createServiceRequest);  // auth required to create

// ─── Dynamic :id routes LAST ─────────────────────────────────────────────────

router.get("/:id", getServiceRequestById);
router.put("/:id", authMiddleware, updateServiceRequest);
router.delete("/:id", authMiddleware, deleteServiceRequest);

export default router;