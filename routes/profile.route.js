import express from "express";
import upload from "../middlewares/multer.js";
import { getAdminProfile, upsertAdminProfile } from "../controllers/profile.controller.js";
const route = express.Router();

route.get("/", getAdminProfile);
route.get("/", getAdminProfile);
route.put("/update", upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 }
]), upsertAdminProfile);


export default route;