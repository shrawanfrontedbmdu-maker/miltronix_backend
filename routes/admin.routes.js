import express from 'express';
import { adminLogin, adminRegister, getStores } from '../controllers/admin.controller.js';
import { verifyAdmin } from '../middlewares/verifyAdmin.js';
import { adminCreateStore } from '../controllers/store.auth.controller.js';

const router = express.Router();

router.post('/signup',adminRegister);

router.post('/login',adminLogin);

// router.get('/me', verifyAdmin, getProfile);

router.post('/stores', verifyAdmin, adminCreateStore);

router.get('/stores', verifyAdmin, getStores);

export default router;
