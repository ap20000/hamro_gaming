import asyncHandler from '../middlewares/asyncHandler.js';
import Cart from '../models/cartModel.js';

export const addToCart = asyncHandler(async (req, res) => {
  console.log('🛒 [addToCart] Request received');
  console.log('👉 Cookies:', req.cookies);
  console.log('👉 req.user:', req.user);
  console.log('👉 Body:', req.body);

  if (!req.user || !req.user._id) {
    console.error('❌ [addToCart] Missing req.user. Not authenticated?');
    res.status(401);
    throw new Error('Not authenticated. Please login again.');
  }

  const { productId } = req.body;
  const userId = req.user._id;

  let cart = await Cart.findOne({ user: userId });

  if (!cart) {
    console.log('🆕 Creating new cart for user:', userId);
    cart = await Cart.create({ user: userId, products: [productId] });
  } else {
    if (!cart.products.includes(productId)) {
      console.log('✅ Adding new product to existing cart:', productId);
      cart.products.push(productId);
      await cart.save();
    } else {
      console.log('ℹ️ Product already in cart:', productId);
    }
  }

  res.status(200).json({ success: true, cart });
});


export const getCart = asyncHandler(async (req, res) => {
  console.log('🛒 [getCart] Cookies:', req.cookies);
  console.log('👉 req.user:', req.user);

  if (!req.user || !req.user._id) {
    console.error('❌ [getCart] Missing req.user. Not authenticated?');
    res.status(401);
    throw new Error('Not authenticated. Please login again.');
  }

  const cart = await Cart.findOne({ user: req.user._id }).populate('products');
  res.status(200).json({ success: true, cart });
});


export const removeFromCart = asyncHandler(async (req, res) => {
  console.log('🗑️ [removeFromCart] Cookies:', req.cookies);
  console.log('👉 req.user:', req.user);
  console.log('👉 Params:', req.params);

  if (!req.user || !req.user._id) {
    console.error('❌ [removeFromCart] Missing req.user. Not authenticated?');
    res.status(401);
    throw new Error('Not authenticated. Please login again.');
  }

  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    console.error('❌ Cart not found for user:', req.user._id);
    res.status(404);
    throw new Error('Cart not found');
  }

  cart.products = cart.products.filter(p => p.toString() !== req.params.productId);
  await cart.save();

  res.status(200).json({ success: true, cart });
});
