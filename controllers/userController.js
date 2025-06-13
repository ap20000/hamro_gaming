// controllers/productController.js
import GamingProduct from '../models/productModel.js';
import asyncHandler from '../middlewares/asyncHandler.js';

export const getAllGamingProducts = asyncHandler(async (req, res) => {
  const products = await GamingProduct.find({ status: 'active' }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: products.length,
    products,
  });
});


export const getGamingProductById = asyncHandler(async (req, res) => {
    const product = await GamingProduct.findById(req.params.id);
  
    if (!product || product.status !== 'active') {
      res.status(404);
      throw new Error('Product not found or inactive');
    }
  
    res.status(200).json({
      success: true,
      product,
    });
  });