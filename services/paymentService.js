import asyncHandler from '../middlewares/asyncHandler.js';
export const getQRImageUrl = asyncHandler(async (req, res) => {
    const qrUrl = `${req.protocol}://${req.get('host')}/uploads/payment/hamrogaming_qr.png`;
  
    res.status(200).json({
      success: true,
      qrImage: qrUrl,
    });
  });
  