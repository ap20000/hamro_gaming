import GamingProduct from '../models/productModel.js';
import asyncHandler from '../middlewares/asyncHandler.js';

export const addGamingProduct = asyncHandler(async (req, res) => {
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

  if (!name || !description || !price || !deliveryTime || !platform || !region || !gameType) {
    res.status(400);
    throw new Error('Please provide all required fields');
  }

  let image = '';
  if (req.file) {
    image = `/games/${req.file.filename}`; // Serve image from /uploads route
  }

  const product = await GamingProduct.create({
    name,
    description,
    price,
    image,
    deliveryTime,
    platform,
    region,
    gameType,
    status,
    createdBy: req.user._id,
  });

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
    product.image = `/uploads/${req.file.filename}`;
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

  await product.remove();
  res.status(200).json({ success: true, message: 'Product deleted successfully' });
});



export const listUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('-password'); // exclude passwords
  res.status(200).json({ success: true, users });
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

  await user.remove();
  res.status(200).json({ success: true, message: 'User deleted successfully' });
});
