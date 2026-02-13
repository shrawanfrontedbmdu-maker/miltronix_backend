
import express from "express";
import {upload} from "../middlewares/multer.js";
import {
  createRecommendation,
  getRecommendations,
  getRecommendation,
  updateRecommendation,
  deleteRecommendation,
} from "../controllers/recommendations.controller.js";

const router = express.Router();

// Multer setup for file upload
const storage = multer.diskStorage({});
const upload = multer({ storage });

// CRUD Routes
router.post("/", upload.single("image"), createRecommendation);      
router.get("/", getRecommendations);                                 
router.get("/:id", getRecommendation);                                
router.put("/:id", upload.single("image"), updateRecommendation);     
router.delete("/:id", deleteRecommendation);                          

export default router;
