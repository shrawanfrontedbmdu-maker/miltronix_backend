import express from "express";
import {
  createFilterGroup,
  getFilterGroupsByCategory,
  getFilterGroupById,
  updateFilterGroup,
  deleteFilterGroup,
} from "../controllers/filterGroup.controller.js";

const router = express.Router();

/* ================= CREATE FILTER GROUP ================= */
router.post("/", createFilterGroup);

/* ================= GET FILTER GROUPS BY CATEGORY ================= */
router.get("/category/:categoryId", getFilterGroupsByCategory);

/* ================= GET FILTER GROUP BY ID ================= */
router.get("/:id", getFilterGroupById);

/* ================= UPDATE FILTER GROUP ================= */
router.put("/:id", updateFilterGroup);

/* ================= DELETE FILTER GROUP ================= */
router.delete("/:id", deleteFilterGroup);

export default router;
