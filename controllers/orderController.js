import asyncHandler from "../middlewares/asyncHandler.js";
import Order from "../models/orderModel.js";

import sendEmail from "../services/emailService.js";

import GamingProduct from "../models/productModel.js";

export const placeOrder = asyncHandler(async (req, res) => {
  const {
    products,
    totalAmount,
    gameUID,
    gameId,
    gamePassword,
    transactionCode,
    selectedTopup,
  } = req.body;

  const orderedProducts = await GamingProduct.find({
    _id: { $in: products },
  });

  const productTypes = orderedProducts.map((p) => p.productType);
  const isGiftcardOrCDKey = productTypes.some((type) =>
    ["giftcard", "cdkey"].includes(type)
  );
  const isTopup = productTypes.some((type) => type === "topup");

  const isAccount = productTypes.includes("account");

  // 2. Determine order status
  const needsVerification = isGiftcardOrCDKey || isAccount;

  const order = await Order.create({
    user: req.user._id,
    products,
    totalAmount,
    gameUID,
    gameId,
    gamePassword,
    transactionCode,
    selectedTopup,
    status: isGiftcardOrCDKey ? "awaiting_verification" : "pending",
  });

  // Send admin email
  if (isGiftcardOrCDKey || isAccount) {
    await sendEmail({
      to: process.env.ADMIN_EMAIL,
      subject: isAccount
        ? "👤 Account Order Verification Required"
        : "🔐 Giftcard/CDKey Order Verification Required",
      text: `
        A new ${
          isAccount ? "ACCOUNT" : "GIFT CARD / CDKEY"
        } order has been placed.

        Order ID: ${order._id}
        User ID: ${req.user._id}
        Amount: ${totalAmount}
        Transaction Code: ${transactionCode}

        Please verify this order in the Admin Panel.
      `,
    });
  }

  if (isTopup) {
    await sendEmail({
      to: process.env.ADMIN_EMAIL,
      subject: "⚡ Topup Order Notification",
      text: `
        A new TOPUP order has been placed.

        Order ID: ${order._id}
        User ID: ${req.user._id}
        Game UID: ${gameUID || gameId}
        Product: ${selectedTopup?.label || "N/A"}
        Amount: ${selectedTopup?.price || totalAmount}
        Transaction Code: ${transactionCode}

        You can process this manually or automatically.
      `,
    });
  }

  // Send confirmation to user
  await sendEmail({
    to: req.user.email,
    subject: "✅ Order Received",
    text: `
      Thank you for your order.

      Order ID: ${order._id}
      Status: ${order.status}
      
      We'll notify you after verification (if required).
    `,
  });

  res.status(201).json({
    success: true,
    message: isGiftcardOrCDKey
      ? "Order placed. Awaiting admin verification."
      : "Order placed successfully.",
    order,
  });
});

export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .populate(
    "products",
    "name productType price image"
  );

  res.status(200).json({ success: true, orders });
});
export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate(
    "products",
    "name productType price image"
  );

  if (!order || order.user.toString() !== req.user._id.toString()) {
    res.status(404);
    throw new Error("Order not found");
  }

  // ✅ Always show deliveredKeys if completed
  const showKeys = order.status === "completed";

  res.status(200).json({
    success: true,
    order: {
      ...order.toObject(),
      deliveredKeys: showKeys ? order.deliveredKeys : [],
    },
  });
});


export const claimGiftcardKey = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order || order.user.toString() !== req.user._id.toString()) {
    res.status(404);
    throw new Error("Order not found");
  }

  if (order.status !== "completed") {
    res.status(400);
    throw new Error("Order not verified yet.");
  }

  if (order.isClaimed) {
    return res.status(200).json({
      success: true,
      message: "Key already claimed",
    });
  }

  order.isClaimed = true;
  await order.save();

  res.status(200).json({
    success: true,
    message: "Key claimed successfully",
    deliveredKeys: order.deliveredKeys,
  });
});
