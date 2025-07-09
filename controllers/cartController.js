import asyncHandler from '../middlewares/asyncHandler.js';
import Cart from '../models/cartModel.js';

// ✅ Add to Cart (only selected top-up option)
export const addToCart = asyncHandler(async (req, res) => {
  console.log('============================');
  console.log('🛒 [addToCart] Called');
  console.log('✅ req.user:', req.user);
  console.log('✅ req.body:', req.body);

  const userId = req.user?._id;
  if (!userId) {
    console.error('❌ [addToCart] User not authenticated');
    res.status(401);
    throw new Error('Not authenticated. Please login again.');
  }

  const { productId, selectedOption, quantity } = req.body;

  if (!productId) {
    console.error('❌ [addToCart] Missing productId');
    res.status(400);
    throw new Error('Product ID is required');
  }

  if (!selectedOption || !selectedOption.label) {
    console.error('❌ [addToCart] Missing selectedOption.label:', selectedOption);
    res.status(400);
    throw new Error('Selected top-up option with label is required');
  }

  console.log('ℹ️ [addToCart] Checking for existing cart for user:', userId);
  let cart = await Cart.findOne({ user: userId });

  if (!cart) {
    console.log('🆕 [addToCart] No cart found. Creating new cart...');
    cart = await Cart.create({
      user: userId,
      products: [{
        product: productId,
        selectedOption: {
          label: selectedOption.label,
          amount: selectedOption.amount,
          price: selectedOption.price,
        },
        quantity: quantity || 1,
      }],
    });
    console.log('✅ [addToCart] New cart created:', JSON.stringify(cart, null, 2));
  } else {
    console.log('✅ [addToCart] Existing cart found:', cart._id);
    console.log('ℹ️ [addToCart] Existing cart products:', cart.products.length);

    const existingIndex = cart.products.findIndex(p =>
      p.product.toString() === productId &&
      p.selectedOption?.label === selectedOption.label
    );

    console.log('ℹ️ [addToCart] Existing item index:', existingIndex);

    if (existingIndex === -1) {
      console.log('✅ [addToCart] Adding new item to cart...');
      cart.products.push({
        product: productId,
        selectedOption: {
          label: selectedOption.label,
          amount: selectedOption.amount,
          price: selectedOption.price,
        },
        quantity: quantity || 1,
      });
    } else {
      console.log('ℹ️ [addToCart] Item exists. Increasing quantity...');
      cart.products[existingIndex].quantity += quantity || 1;
    }

    await cart.save();
    console.log('✅ [addToCart] Cart updated:', JSON.stringify(cart, null, 2));
  }

  res.status(200).json({ success: true, cart });
  console.log('🛒 [addToCart] Finished');
  console.log('============================');
});

// ✅ Get Cart (populate product details)
export const getCart = asyncHandler(async (req, res) => {
  console.log('============================');
  console.log('🛒 [getCart] Called');
  console.log('✅ req.user:', req.user);

  const userId = req.user?._id;
  if (!userId) {
    console.error('❌ [getCart] User not authenticated');
    res.status(401);
    throw new Error('Not authenticated. Please login again.');
  }

  console.log('ℹ️ [getCart] Looking for cart for user:', userId);
  const cart = await Cart.findOne({ user: userId }).populate('products.product');

  if (!cart) {
    console.log('ℹ️ [getCart] No cart found. Returning empty.');
    return res.status(200).json({ success: true, cart: { products: [] } });
  }

  console.log('✅ [getCart] Cart found:', cart._id);
  console.log('ℹ️ [getCart] Product count:', cart.products.length);

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

  console.log('🛒 [getCart] Finished');
  console.log('============================');
});

// ✅ Remove from Cart (by productId and option label)
export const removeFromCart = asyncHandler(async (req, res) => {
  console.log('============================');
  console.log('🗑️ [removeFromCart] Called');
  console.log('✅ req.user:', req.user);
  console.log('✅ req.params:', req.params);

  const userId = req.user?._id;
  if (!userId) {
    console.error('❌ [removeFromCart] User not authenticated');
    res.status(401);
    throw new Error('Not authenticated. Please login again.');
  }

  const { productId, label } = req.params;

  if (!productId || !label) {
    console.error('❌ [removeFromCart] Missing productId or label');
    res.status(400);
    throw new Error('Product ID and option label are required to remove item');
  }

  console.log('ℹ️ [removeFromCart] Finding cart for user:', userId);
  const cart = await Cart.findOne({ user: userId });

  if (!cart) {
    console.error('❌ [removeFromCart] Cart not found');
    res.status(404);
    throw new Error('Cart not found');
  }

  console.log('✅ [removeFromCart] Cart found:', cart._id);
  console.log('ℹ️ [removeFromCart] Products before:', cart.products.length);

  cart.products = cart.products.filter(
    p => !(p.product.toString() === productId && p.selectedOption?.label === label)
  );

  console.log('✅ [removeFromCart] Products after filter:', cart.products.length);

  await cart.save();

  console.log('✅ [removeFromCart] Cart updated');
  res.status(200).json({ success: true, cart });
  console.log('🗑️ [removeFromCart] Finished');
  console.log('============================');
});
