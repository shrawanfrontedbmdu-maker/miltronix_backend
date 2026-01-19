import express from "express";
import {apihealthf} from "../controllers/apihealth.controller.js"
const router = express.Router();

router.get("/", apihealthf);
export default router;