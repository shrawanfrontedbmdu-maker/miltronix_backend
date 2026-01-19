import express from 'express';
import {
    createBlog,
    getBlogs,
    getBlogById,
    editBlog,
    deleteBlog
} from '../controllers/blog.controller.js'
import upload from '../middlewares/multer.js';

const router = express.Router();

router.post('/', upload.array('images'), createBlog);
router.get('/', getBlogs);
router.get('/:id', getBlogById);
router.put('/:id', upload.array('images'), editBlog);
router.delete('/:id', deleteBlog);

export default router