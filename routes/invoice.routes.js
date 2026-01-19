import express from "express";
import {
  getInvoices,
  createInvoice,
  getInvoiceById,
  updateInvoiceById,
  deleteInvoiceById,
  getInvoicesByMonth,
  getInvoicesLastMonth,
  getInvoicesThisYear,
} from "../controllers/invoice.controller.js";

const router = express.Router();

router.get("/", getInvoices);
router.post("/", createInvoice);
router.get("/this-month", getInvoicesByMonth);
router.get("/last-month", getInvoicesLastMonth);
router.get("/this-year", getInvoicesThisYear);
router.get("/:id", getInvoiceById);
router.put("/:id", updateInvoiceById);
router.delete("/:id", deleteInvoiceById);

export default router;
