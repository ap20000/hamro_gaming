import express from 'express';
import {
    addGamingProduct,
    listGamingProducts,
    updateGamingProduct,
    deleteGamingProduct,
    listUsers, 
    updateUser,
     deleteUser,
     getTotalUserCount,
     getTotalGameCount,
     getOrderSummaryByProductType,
     getTotalSalesAmount
  } from '../controllers/adminController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { adminOnly } from '../middlewares/adminMiddleware.js';

import upload from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.get('/total-users', protect, adminOnly, getTotalUserCount);

router.get('/users', protect, adminOnly, listUsers);
router.put('/user/:id', protect, adminOnly, updateUser);
router.delete('/user/:id', protect, adminOnly, deleteUser);

router.get('/total-games', protect, adminOnly, getTotalGameCount);
router.post('/addgame', protect, adminOnly, upload.single('image'), addGamingProduct);
router.get('/games', protect, adminOnly, listGamingProducts);
router.put('/game/:id', protect, adminOnly, upload.single('image'), updateGamingProduct);
router.delete('/game/:id', protect, adminOnly, deleteGamingProduct);

router.get('/order-summary', protect, adminOnly, getOrderSummaryByProductType);
router.get('/total-sales', protect, adminOnly, getTotalSalesAmount);




export default router;
