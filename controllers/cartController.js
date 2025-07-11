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
    res.status(401);
    throw new Error('Not authenticated. Please login again.');
  }

  const { productId, selectedOption, quantity } = req.body;

  if (!productId) {
    res.status(400);
    throw new Error('Product ID is required');
  }

  if (!selectedOption || !selectedOption.label || selectedOption.price == null) {
    res.status(400);
    throw new Error('Selected option with label and price is required');
  }

  // ✅ Clean the incoming option
  const cleanOption = (opt) => ({
    label: opt.label,
    amount: opt.amount !== undefined ? Number(opt.amount) : undefined,
    price: Number(opt.price),
  });

  const cleanedSelectedOption = cleanOption(selectedOption);

  console.log('✅ Cleaned selectedOption:', cleanedSelectedOption);

  console.log('ℹ️ [addToCart] Looking for existing cart...');
  let cart = await Cart.findOne({ user: userId });

  if (!cart) {
    console.log('🆕 [addToCart] No cart found. Creating new cart...');
    cart = await Cart.create({
      user: userId,
      products: [{
        product: productId,
        selectedOption: cleanedSelectedOption,
        quantity: quantity || 1,
      }],
    });
    console.log('✅ [addToCart] New cart created:', cart._id);
  } else {
    console.log('✅ [addToCart] Existing cart found:', cart._id);

    const existingIndex = cart.products.findIndex(p =>
      p.product.toString() === productId &&
      p.selectedOption.label === cleanedSelectedOption.label
    );

    console.log('ℹ️ [addToCart] Existing item index:', existingIndex);

    if (existingIndex === -1) {
      console.log('✅ [addToCart] Adding new item...');
      cart.products.push({
        product: productId,
        selectedOption: cleanedSelectedOption,
        quantity: quantity || 1,
      });
    } else {
      console.log('ℹ️ [addToCart] Item exists. Increasing quantity...');
      cart.products[existingIndex].quantity += quantity || 1;
    }

    // ✅ 🧹 Clean **ALL** items before save
    cart.products = cart.products.map(item => ({
      product: item.product,
      selectedOption: cleanOption(item.selectedOption),
      quantity: item.quantity || 1,
    }));

    await cart.save();
    console.log('✅ [addToCart] Cart updated:', cart._id);
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
