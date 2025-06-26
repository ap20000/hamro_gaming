import GamingProduct from '../models/productModel.js';
import asyncHandler from '../middlewares/asyncHandler.js';

import User from '../models/userModel.js';
import Order from '../models/orderModel.js';
// import your User model


export const getTotalUserCount = asyncHandler(async (req, res) => {
  const userCount = await User.countDocuments();
  res.status(200).json({ success: true, totalUsers: userCount });
});

// Total Games count
export const getTotalGameCount = asyncHandler(async (req, res) => {
  const gameCount = await GamingProduct.countDocuments();
  res.status(200).json({ success: true, totalGames: gameCount });
});

export const addGamingProduct = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    price,
    deliveryTime,
    platform,
    region,
    gameType,
    productType,
    status,
    itemType,
    topupOptions,
    keys,
    expirationDate,
  } = req.body;

  // ✅ Validate required fields
  if (!name || !description || !price || !deliveryTime || !platform || !region || !gameType || !productType) {
    res.status(400);
    throw new Error('Please provide all required fields');
  }

  // ✅ Handle image upload
  let image = '';
  if (req.file) {
    image = `/uploads/games/${req.file.filename}`;
  }

  // ✅ Create base product data
  const productData = {
    name,
    description,
    price,
    image,
    deliveryTime,
    platform,
    region,
    gameType,
    productType,
    status,
    createdBy: req.user._id,
  };

  // 🔁 TOP-UP product logic (e.g., PUBG UC, Free Fire Diamonds)
  if (productType === 'topup') {
    if (itemType) productData.itemType = itemType;

    if (topupOptions && Array.isArray(topupOptions)) {
      productData.topupOptions = topupOptions.map((option) => ({
        label: option.label,
        amount: option.amount,
        price: option.price,
      }));
    }
  }

  // 💳 Giftcard or CD Key logic
  if (productType === 'giftcard' || productType === 'cdkey') {
    productData.keys = keys
      ? typeof keys === 'string'
        ? keys.split(',').map((k) => k.trim())
        : keys
      : [];
    if (expirationDate) productData.expirationDate = expirationDate;
  }

  // ✅ Create the product
  const product = await GamingProduct.create(productData);

  res.status(201).json({
    success: true,
    product,
  });
});


export const listGamingProducts = asyncHandler(async (req, res) => {
  const products = await GamingProduct.find().populate('createdBy', 'name email');
  res.status(200).json({ success: true, products });
});


export const updateGamingProduct = asyncHandler(async (req, res) => {
  const product = await GamingProduct.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const {
    name,
    description,
    price,
    deliveryTime,
    platform,
    region,
    gameType,
    status,
  } = req.body;

  product.name = name || product.name;
  product.description = description || product.description;
  product.price = price || product.price;
  product.deliveryTime = deliveryTime || product.deliveryTime;
  product.platform = platform || product.platform;
  product.region = region || product.region;
  product.gameType = gameType || product.gameType;
  product.status = status || product.status;

  if (req.file) {
    product.image = `/uploads/games/${req.file.filename}`;
  }

  const updatedProduct = await product.save();
  res.status(200).json({ success: true, product: updatedProduct });
});


export const deleteGamingProduct = asyncHandler(async (req, res) => {
  const product = await GamingProduct.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

 
  await GamingProduct.findByIdAndDelete(req.params.id);
  res.status(200).json({ success: true, message: 'Product deleted successfully' });
});



export const listUsers = asyncHandler(async (req, res) => {
  try {
    console.log('🔍 Attempting to fetch users from database...');
    
    const users = await User.find().select('-password'); // exclude passwords
    
    console.log(`✅ Successfully fetched ${users.length} users`);
    res.status(200).json({ success: true, users });
  } catch (error) {
    console.error('❌ Error fetching users:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch users', error: error.message });
  }
});



export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const { name, email, role, password } = req.body;

  user.name = name || user.name;
  user.email = email || user.email;
  user.role = role || user.role;

  if (password) {
    user.password = password; // will be hashed due to pre-save hook
  }

  const updatedUser = await user.save();
  res.status(200).json({
    success: true,
    user: {
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
    },
  });
});


export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  await User.findByIdAndDelete(req.params.id);

  res.status(200).json({ success: true, message: 'User deleted successfully' });
});

export const getOrderSummaryByProductType = asyncHandler(async (req, res) => {
  const summary = await Order.aggregate([
    {
      $unwind: '$products'
    },
    {
      $lookup: {
        from: 'gamingproducts',
        localField: 'products',
        foreignField: '_id',
        as: 'productDetails'
      }
    },
    { $unwind: '$productDetails' },
    {
      $group: {
        _id: '$productDetails.productType',
        totalOrders: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' }
      }
    },
    {
      $project: {
        productType: '$_id',
        totalOrders: 1,
        totalAmount: 1,
        _id: 0
      }
    }
  ]);

  res.status(200).json({
    success: true,
    summary,
  });
});

export const getTotalSalesAmount = asyncHandler(async (req, res) => {
  const result = await Order.aggregate([
    {
      $group: {
        _id: null,
        totalSales: { $sum: "$totalAmount" }
      }
    }
  ]);

  const totalSales = result[0]?.totalSales || 0;

  res.status(200).json({
    success: true,
    totalSales,
  });
});


// PUT /api/admin/verify-order/:id
export const verifyOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('products')
    .populate('user', 'email');

  if (!order) throw new Error('Order not found');

  // Ensure productType is giftcard or cdkey
  const productTypes = order.products.map(p => p.productType);
  const hasNonVerifiableProduct = productTypes.some(
    type => type !== 'giftcard' && type !== 'cdkey'
  );
  if (hasNonVerifiableProduct) {
    res.status(400);
    throw new Error('Only giftcard and cdkey orders can be verified by admin.');
  }

  // Pull keys from each product
  const deliveredKeys = [];
  for (const product of order.products) {
    const dbProduct = await GamingProduct.findById(product._id);

    if (!dbProduct || !dbProduct.keys || dbProduct.keys.length === 0) {
      throw new Error(`Product "${product.name}" is out of stock.`);
    }

    // Remove 1 key from product and assign to order
    const assignedKey = dbProduct.keys.shift(); // remove first key
    deliveredKeys.push(assignedKey);

    await dbProduct.save();
  }

  order.deliveredKeys = deliveredKeys;
  order.status = 'completed';
  await order.save();

  // Send confirmation email
  await sendEmail({
    to: order.user.email,
    subject: '🎁 Giftcard/CD Key Delivered',
    text: `Your order ${order._id} has been verified and your code(s) are ready in your dashboard.`,
  });

  res.status(200).json({ success: true, message: 'Giftcard/CDKey order verified and keys delivered' });
});


export const getAllOrdersWithProducts = asyncHandler(async (req, res) => {
  const orders = await Order.find()
    .populate('user', 'name email')
    .populate('products'); // Includes GamingProduct details

  const formatted = orders.map(order => ({
    _id: order._id,
    user: order.user,
    totalAmount: order.totalAmount,
    status: order.status,
    transactionCode: order.transactionCode,
    selectedTopup: order.selectedTopup,
    gameUID: order.gameUID,
    gameId: order.gameId,
    gamePassword: order.gamePassword,
    products: order.products.map(p => ({
      name: p.name,
      productType: p.productType,
      price: p.price,
      image: p.image,
    })),
    createdAt: order.createdAt,
  }));

  res.status(200).json({
    success: true,
    count: formatted.length,
    orders: formatted,
  });
});
