import express from "express";
import { createBrand, deleteBrand, editBrand, getBrand, getBrandByid } from "../controllers/brand.controller.js"
const router = express.Router();


router.get('/', getBrand);
router.get('/:id', getBrandByid);
router.post('/', createBrand);
router.put('/edit/:id', editBrand);
router.delete('/delete/:id', deleteBrand)

export default router