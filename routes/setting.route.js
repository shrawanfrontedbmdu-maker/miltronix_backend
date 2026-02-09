import express from "express"
import { createSettings, getSettings, updateSettings } from "../controllers/setting.controller.js";

const router = express.Router();


router.get("/",getSettings);
router.post("/",createSettings);
router.put("/update",updateSettings);


export default router;