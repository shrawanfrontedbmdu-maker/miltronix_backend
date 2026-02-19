import express from "express";
import {
  createBanner,
  getBanner,
  getBannerById,
  editBanner,
  deleteBanner,
  toggleBannerStatus,
  getBannerByStatus,
} from "../controllers/banner.controller.js";

import upload from "../middlewares/multer.js";

const router = express.Router();


router.post("/", upload.single("image"), createBanner);


router.get("/", getBanner);


router.get("/status", getBannerByStatus);



router.get("/:id", getBannerById);

router.put("/:id", upload.single("image"), editBanner);

router.patch("/:id/status", toggleBannerStatus);
router.delete("/:id", deleteBanner);

export default router;