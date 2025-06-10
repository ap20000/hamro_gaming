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
    image = `/uploads/${req.file.filename}`; // Serve image from /uploads route
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
