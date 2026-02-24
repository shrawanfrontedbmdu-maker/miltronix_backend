import express from "express";
import upload from "../middlewares/multer.js";

import {
  createTopDeal,
  updateTopDeal,
  deleteTopDeal,
} from "../controllers/topDeal.controller.js";

const router = express.Router();

/* ================= CREATE TOP DEAL ================= */
router.post(
  "/",
  upload.fields([{ name: "image", maxCount: 1 }]),
  createTopDeal
);

/* ================= UPDATE TOP DEAL ================= */
router.put(
  "/:id",
  upload.fields([{ name: "image", maxCount: 1 }]),
  updateTopDeal
);

/* ================= DELETE TOP DEAL ================= */
router.delete("/:id", deleteTopDeal);

export default router;