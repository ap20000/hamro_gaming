import express from 'express';
import {
    addGamingProduct,
    listGamingProducts,
    updateGamingProduct,
    deleteGamingProduct,
    listUsers, 
    updateUser,
     deleteUser
  } from '../controllers/adminController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { adminOnly } from '../middlewares/adminMiddleware.js';

import upload from '../middlewares/uploadMiddleware.js';

const router = express.Router();


router.get('/users', protect, adminOnly, listUsers);
router.put('/user/:id', protect, adminOnly, updateUser);
router.delete('/user/:id', protect, adminOnly, deleteUser);

router.post('/addgame', protect, adminOnly, upload.single('image'), addGamingProduct);
router.get('/games', protect, adminOnly, listGamingProducts);
router.put('/game/:id', protect, adminOnly, upload.single('image'), updateGamingProduct);
router.delete('/game/:id', protect, adminOnly, deleteGamingProduct);

export default router;
