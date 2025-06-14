import asyncHandler from '../middlewares/asyncHandler.js';
import Cart from '../models/cartModel.js';

export const addToCart = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  const userId = req.user._id;

  let cart = await Cart.findOne({ user: userId });

  if (!cart) {
    cart = await Cart.create({ user: userId, products: [productId] });
  } else {
    if (!cart.products.includes(productId)) {
      cart.products.push(productId);
      await cart.save();
    }
  }

  res.status(200).json({ success: true, cart });
});

export const getCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate('products');
  res.status(200).json({ success: true, cart });
});

export const removeFromCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart) throw new Error('Cart not found');

  cart.products = cart.products.filter(p => p.toString() !== req.params.productId);
  await cart.save();

  res.status(200).json({ success: true, cart });
});
