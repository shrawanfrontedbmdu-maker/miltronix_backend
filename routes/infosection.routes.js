import express from "express";
import { upload } from "../middlewares/uploadinfosection.js";
import {
  createInfoSection,
  getAllInfoSections,
  getInfoSectionById,
  updateInfoSection,
  deleteInfoSection
} from "../controllers/infosection.controller.js";

const router = express.Router();

// Create InfoSection (main + card images)
router.post("/", upload.any(), createInfoSection);

// Get all InfoSections
router.get("/", getAllInfoSections);

// Get single InfoSection by ID
router.get("/:id", getInfoSectionById);

// Update InfoSection (supports main + card images)
router.put("/:id", upload.any(), updateInfoSection);

// Delete InfoSection
router.delete("/:id", deleteInfoSection);

export default router;
