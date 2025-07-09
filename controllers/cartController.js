import asyncHandler from '../middlewares/asyncHandler.js';
import Cart from '../models/cartModel.js';

// ✅ Add to Cart
export const addToCart = asyncHandler(async (req, res) => {
  console.log('🛒 [addToCart] Request received');
  console.log('👉 Body:', req.body);

  if (!req.user || !req.user._id) {
    res.status(401);
    throw new Error('Not authenticated. Please login again.');
  }

  const { productId, selectedOption, quantity } = req.body;
  const userId = req.user._id;

  if (!productId) {
    res.status(400);
    throw new Error('Product ID is required');
  }

  let cart = await Cart.findOne({ user: userId });

  if (!cart) {
    console.log('🆕 No cart found, creating new...');
    cart = await Cart.create({
      user: userId,
      products: [{
        product: productId,
        selectedOption,
        quantity: quantity || 1,
      }],
    });
  } else {
    console.log('🔎 Cart exists, checking for existing item...');

    const existingIndex = cart.products.findIndex(
      p =>
        p.product.toString() === productId &&
        (
          (!p.selectedOption?.label && !selectedOption?.label) ||
          (p.selectedOption?.label === selectedOption?.label)
        )
    );

    if (existingIndex === -1) {
      console.log('✅ Adding new item to cart');
      cart.products.push({
        product: productId,
        selectedOption,
        quantity: quantity || 1,
      });
    } else {
      console.log('ℹ️ Item already in cart with same option, increasing quantity');
      cart.products[existingIndex].quantity += quantity || 1;
    }

    await cart.save();
  }

  res.status(200).json({ success: true, cart });
});


// ✅ Get Cart
export const getCart = asyncHandler(async (req, res) => {
  if (!req.user || !req.user._id) {
    res.status(401);
    throw new Error('Not authenticated. Please login again.');
  }

  const cart = await Cart.findOne({ user: req.user._id }).populate('products.product');

  if (!cart) {
    return res.status(200).json({ success: true, cart: { products: [] } });
  }

  res.status(200).json({
    success: true,
    cart: {
      _id: cart._id,
      user: cart.user,
      products: cart.products.map(item => ({
        product: item.product,
        selectedOption: item.selectedOption,
        quantity: item.quantity,
      })),
    },
  });
});

// ✅ Remove from Cart
export const removeFromCart = asyncHandler(async (req, res) => {
  if (!req.user || !req.user._id) {
    res.status(401);
    throw new Error('Not authenticated. Please login again.');
  }

  const { productId, label } = req.params;

  if (!productId) {
    res.status(400);
    throw new Error('Product ID is required');
  }

  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    res.status(404);
    throw new Error('Cart not found');
  }

  cart.products = cart.products.filter(
    p =>
      p.product.toString() !== productId ||
      (label && p.selectedOption?.label !== label)
  );

  await cart.save();

  res.status(200).json({ success: true, cart });
});
