// routes/productRoutes.js
import express from "express";
import {
  getAllGamingProducts,
  getGamingProductById,
} from "../controllers/userController.js";
import {
  addToCart,
  getCart,
  removeFromCart,
} from "../controllers/cartController.js";
import {
  placeOrder,
  getMyOrders,
  getOrderById,
  claimGiftcardKey,
} from "../controllers/orderController.js";

import { protect } from "../middlewares/authMiddleware.js";



const router = express.Router();

router.get("/products", getAllGamingProducts); // GET /api/products
router.get("/products/:id", getGamingProductById);

// Cart Routes

router.post("/cart", protect, addToCart);
router.get("/cart", protect, getCart);
router.delete("/cart/:productId/:label", protect, removeFromCart);

// Order Routes
router.post("/orders", protect, placeOrder);
router.get("/orders/my", protect, getMyOrders);
router.get("/orders/my/:id", protect, getOrderById);
router.post("/orders/:id/claim", protect, claimGiftcardKey);

export default router;
