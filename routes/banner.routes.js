import express from 'express'
import {
    createBanner,
    getBannerByPlacement,
    getBannerByStatus,
    duplicateBanner,
    deactivateBanner,
    deleteBanner,
    getBanner,
    getBannerById,
    editBanner,
    toggleBannerStatus
} from '../controllers/banner.controller.js'
import upload from '../middlewares/multer.js'

const router = express.Router();

router.get('/', getBanner)
router.post('/', upload.array('image'), createBanner)
router.put('/:id', upload.single('image'), editBanner)
router.get('/:id', getBannerById)
router.delete('/:id', deleteBanner)
router.post('/duplicate/:id', duplicateBanner)
router.get('/:id/status', getBannerByStatus)
router.put('/:id/status', toggleBannerStatus);
router.patch('/deactivate/:id', deactivateBanner)
router.get('/placement/:placement', getBannerByPlacement)

export default router