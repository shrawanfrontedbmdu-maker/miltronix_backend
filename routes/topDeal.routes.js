import express from "express";
import upload from "../middlewares/multer.js";
import {
  createTopDeal,
  getAllTopDeals,
  getTopDealById,
  updateTopDeal,
  deleteTopDeal,
  toggleTopDealStatus,
} from "../controllers/topDeal.controller.js";

const router = express.Router();

/* ================= GET ALL TOP DEALS ================= */
router.get("/", getAllTopDeals);

/* ================= GET SINGLE TOP DEAL ================= */
router.get("/:id", getTopDealById);

/* ================= CREATE TOP DEAL ================= */
router.post("/", upload.any(), createTopDeal);  // fields() → any()

/* ================= UPDATE TOP DEAL ================= */
router.put("/:id", upload.any(), updateTopDeal);  // fields() → any()

/* ================= TOGGLE ACTIVE STATUS ================= */
router.patch("/:id/toggle-status", toggleTopDealStatus);

/* ================= DELETE TOP DEAL ================= */
router.delete("/:id", deleteTopDeal);

export default router;