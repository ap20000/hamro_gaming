import asyncHandler from '../middlewares/asyncHandler.js';
import Order from '../models/orderModel.js';

export const placeOrder = asyncHandler(async (req, res) => {
  const { products, totalAmount } = req.body;

  const order = await Order.create({
    user: req.user._id,
    products,
    totalAmount,
    status: 'pending',
  });

  res.status(201).json({ success: true, order });
});

export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).populate('products');
  res.status(200).json({ success: true, orders });
});