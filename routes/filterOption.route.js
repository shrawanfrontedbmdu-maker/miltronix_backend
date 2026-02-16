import express from "express";
import {
  createFilterOption,
  getFilterOptionsByGroup,
  updateFilterOption,
  deleteFilterOption,
} from "../controllers/filterOption.controller.js";

const router = express.Router();

/* ================= CREATE FILTER OPTION ================= */
router.post("/", createFilterOption);

/* ================= GET FILTER OPTIONS BY GROUP ================= */
router.get("/group/:groupId", getFilterOptionsByGroup);

/* ================= UPDATE FILTER OPTION ================= */
router.put("/:id", updateFilterOption);

/* ================= DELETE FILTER OPTION ================= */
router.delete("/:id", deleteFilterOption);

export default router;
