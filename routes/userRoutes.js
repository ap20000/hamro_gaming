// routes/productRoutes.js
import express from 'express';
import { getAllGamingProducts, getGamingProductById } from '../controllers/productController.js';
import { addToCart, getCart, removeFromCart } from '../controllers/cartController.js';
import { placeOrder, getMyOrders } from '../controllers/orderController.js';

const router = express.Router();

router.get('/products', getAllGamingProducts); // GET /api/products
router.get('/products/:id', getGamingProductById); 

// Cart Routes
router.post('/cart', protect, addToCart);
router.get('/cart', protect, getCart);
router.delete('/cart/:productId', protect, removeFromCart);

// Order Routes
router.post('/orders', protect, placeOrder);
router.get('/orders/my', protect, getMyOrders);

export default router;
