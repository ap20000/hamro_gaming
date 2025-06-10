import express from 'express';
import { addGamingProduct } from '../controllers/productController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { adminOnly } from '../middlewares/adminMiddleware.js';

import upload from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.post('/addgame', protect, adminOnly, upload.single('image'), addGamingProduct);

export default router;
