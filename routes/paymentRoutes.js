// routes/paymentRoutes.js
import express from 'express';
import { getQRImageUrl } from '../services/paymentService.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/qr', protect, getQRImageUrl);

export default router;
