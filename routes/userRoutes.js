// routes/productRoutes.js
import express from 'express';
import { getAllGamingProducts, getGamingProductById } from '../controllers/productController.js';

const router = express.Router();

router.get('/products', getAllGamingProducts); // GET /api/products
router.get('/products/:id', getGamingProductById); 

export default router;
