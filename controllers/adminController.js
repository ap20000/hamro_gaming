import GamingProduct from '../models/productModel.js';
import asyncHandler from '../middlewares/asyncHandler.js';
import sendEmail from '../services/emailService.js';

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
  console.log("Body:", req.body);
  console.log("File:", req.file);

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
    accounts,
    giftcardAmountOptions 
  } = req.body;

  // ✅ Validate required fields
  if (
    !name ||
    !description ||
    !deliveryTime ||
    !platform ||
    !region ||
    !gameType ||
    !productType
  ) {
    res.status(400);
    throw new Error("Please provide all required fields");
  }

  let image = "";
  if (req.file) {
    // Note: URL should match the static route
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
  let topupOptionsParsed = topupOptions;

  if (typeof topupOptions === 'string') {
    try {
      topupOptionsParsed = JSON.parse(topupOptions);
    } catch (error) {
      topupOptionsParsed = [];
    }
  }
  
  if (productType === "topup") {
    if (itemType) productData.itemType = itemType;
  
    if (topupOptionsParsed && Array.isArray(topupOptionsParsed)) {
      productData.topupOptions = topupOptionsParsed.map((option) => ({
        label: option.label,
        amount: Number(option.amount), // parse to number
        price: Number(option.price),   // parse to number
      }));
    }
  }


  // 💳 Giftcard or CD Key logic
  // 💳 Giftcard or CD Key logic
if (productType === "giftcard" || productType === "cdkey") {
  let giftcardAmountOptionsParsed = giftcardAmountOptions;

  if (typeof giftcardAmountOptions === 'string') {
    try {
      giftcardAmountOptionsParsed = JSON.parse(giftcardAmountOptions);
    } catch (error) {
      giftcardAmountOptionsParsed = [];
    }
  }

  if (giftcardAmountOptionsParsed && Array.isArray(giftcardAmountOptionsParsed)) {
    for (const opt of giftcardAmountOptionsParsed) {
      if (!opt.label || !opt.amount || !opt.price) {
        res.status(400);
        throw new Error("Each giftcardAmountOption must include label, amount, and price");
      }
    }

      productData.giftcardAmountOptions = giftcardAmountOptionsParsed.map(opt => ({
          label: opt.label,
          amount: Number(opt.amount),
          price: Number(opt.price),
          quantity: Number(opt.quantity) || 0
        }));
      }
    
      productData.keys = keys
        ? typeof keys === "string"
          ? keys.split(",").map((k) => k.trim())
          : keys
        : [];
    
      if (expirationDate) productData.expirationDate = expirationDate;
    }


  if (productType === "account") {
    productData.accountType = req.body.accountType;
  
    if (req.body.accountType === "private") {
      if (!accounts || !Array.isArray(accounts) || accounts.length === 0) {
        res.status(400);
        throw new Error("Private accounts must be provided as a non-empty array");
      }
  
      // Validate each
      for (const acc of accounts) {
        if (!acc.label || acc.price === undefined) {
          res.status(400);
          throw new Error("Each private account must include label and price");
        }
      }
  
      productData.accounts = accounts.map((acc) => ({
        label: acc.label,
        price: Number(acc.price),
        details: {
          email: acc.email,
          password: acc.password,
          code: acc.code || null,
        },
        used: false,
      }));
      delete productData.sharedAccount;
    } 
    
    else if (req.body.accountType === "shared") {
      if (!req.body.sharedAccount) {
        res.status(400);
        throw new Error("Shared account details must be provided");
      }
  
      const shared = req.body.sharedAccount;
      if (!shared.label || shared.price === undefined) {
        res.status(400);
        throw new Error("Shared account must include label and price");
      }
  
      productData.sharedAccount = {
        label: shared.label,
        price: Number(shared.price),
        details: {
          email: shared.email,
          password: shared.password,
          code: shared.code || null,
        },
        quantity: Number(shared.quantity) || 0,
        soldCount: 0
      };
       delete productData.accounts;
    } 
    
    else {
      res.status(400);
      throw new Error("accountType must be 'private' or 'shared'");
    }
  }



  // ✅ Create the product
  const product = await GamingProduct.create(productData);

  res.status(201).json({
    success: true,
    product,
  });
});

export const listGamingProducts = asyncHandler(async (req, res) => {
  const products = await GamingProduct.find().populate(
    "createdBy",
    "name email"
  );
  res.status(200).json({ success: true, products });
});

export const updateGamingProduct = asyncHandler(async (req, res) => {
  const product = await GamingProduct.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
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
    itemType,
    topupOptions,
    giftcardAmountOptions,
    keys,
    expirationDate,
    accountType,
    accounts,
    sharedAccount
  } = req.body;

  // ✅ Basic fields
  product.name = name ?? product.name;
  product.description = description ?? product.description;
  product.price = price ?? product.price;
  product.deliveryTime = deliveryTime ?? product.deliveryTime;
  product.platform = platform ?? product.platform;
  product.region = region ?? product.region;
  product.gameType = gameType ?? product.gameType;
  product.status = status ?? product.status;
  if (req.file) {
    product.image = `/uploads/games/${req.file.filename}`;
  }

  // ✅ itemType for topup
  if (itemType !== undefined) {
    product.itemType = itemType;
  }

  // ✅ Parse and update topupOptions
  let topupOptionsParsed = topupOptions;
  if (typeof topupOptions === 'string') {
    try {
      topupOptionsParsed = JSON.parse(topupOptions);
    } catch (err) {
      topupOptionsParsed = [];
    }
  }

  if (topupOptionsParsed && Array.isArray(topupOptionsParsed)) {
    product.topupOptions = topupOptionsParsed.map(opt => ({
      label: opt.label,
      amount: Number(opt.amount),
      price: Number(opt.price),
    }));
  }

  // ✅ Parse and update giftcardAmountOptions
  let giftcardAmountOptionsParsed = giftcardAmountOptions;
  if (typeof giftcardAmountOptions === 'string') {
    try {
      giftcardAmountOptionsParsed = JSON.parse(giftcardAmountOptions);
    } catch (err) {
      giftcardAmountOptionsParsed = [];
    }
  }

  if (giftcardAmountOptionsParsed && Array.isArray(giftcardAmountOptionsParsed)) {
    product.giftcardAmountOptions = giftcardAmountOptionsParsed.map(opt => ({
      label: opt.label,
      amount: Number(opt.amount),
      price: Number(opt.price),
      quantity: Number(opt.quantity) || 0
    }));
  }

  // ✅ Keys for CDKeys or Giftcards
  if (keys !== undefined) {
    if (typeof keys === 'string') {
      product.keys = keys.split(',').map(k => k.trim());
    } else if (Array.isArray(keys)) {
      product.keys = keys;
    }
  }

  if (expirationDate) {
    product.expirationDate = expirationDate;
  }

  // ✅ Account data
  if (accountType) {
    product.accountType = accountType;

    if (accountType === 'private' && accounts) {
      let accountsParsed = accounts;
      if (typeof accounts === 'string') {
        try {
          accountsParsed = JSON.parse(accounts);
        } catch (err) {
          accountsParsed = [];
        }
      }
      if (Array.isArray(accountsParsed)) {
        product.accounts = accountsParsed.map(acc => ({
          email: acc.email,
          password: acc.password,
          code: acc.code || null,
          used: acc.used ?? false
        }));
      }
    }

    if (accountType === 'shared' && sharedAccount) {
      let sharedAccountParsed = sharedAccount;
      if (typeof sharedAccount === 'string') {
        try {
          sharedAccountParsed = JSON.parse(sharedAccount);
        } catch (err) {
          sharedAccountParsed = null;
        }
      }
      if (sharedAccountParsed) {
        product.sharedAccount = {
          email: sharedAccountParsed.email,
          password: sharedAccountParsed.password,
          code: sharedAccountParsed.code || null,
          quantity: Number(sharedAccountParsed.quantity) || 0,
          soldCount: sharedAccountParsed.soldCount ?? 0
        };
      }
    }
  }

  const updatedProduct = await product.save();
  res.status(200).json({ success: true, product: updatedProduct });
});

export const deleteGamingProduct = asyncHandler(async (req, res) => {
  const product = await GamingProduct.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  await GamingProduct.findByIdAndDelete(req.params.id);
  res
    .status(200)
    .json({ success: true, message: "Product deleted successfully" });
});

export const listUsers = asyncHandler(async (req, res) => {
  try {
    console.log("🔍 Attempting to fetch users from database...");

    const users = await User.find().select("-password"); // exclude passwords

    console.log(`✅ Successfully fetched ${users.length} users`);
    res.status(200).json({ success: true, users });
  } catch (error) {
    console.error("❌ Error fetching users:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message,
    });
  }
});

export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
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
    throw new Error("User not found");
  }

  await User.findByIdAndDelete(req.params.id);

  res.status(200).json({ success: true, message: "User deleted successfully" });
});

export const getOrderSummaryByProductType = asyncHandler(async (req, res) => {
  const summary = await Order.aggregate([
    {
      $unwind: "$products",
    },
    {
      $lookup: {
        from: "gamingproducts",
        localField: "products",
        foreignField: "_id",
        as: "productDetails",
      },
    },
    { $unwind: "$productDetails" },
    {
      $group: {
        _id: "$productDetails.productType",
        totalOrders: { $sum: 1 },
        totalAmount: { $sum: "$totalAmount" },
      },
    },
    {
      $project: {
        productType: "$_id",
        totalOrders: 1,
        totalAmount: 1,
        _id: 0,
      },
    },
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
        totalSales: { $sum: "$totalAmount" },
      },
    },
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
    .populate("products")
    .populate("user", "email");

  if (!order) throw new Error("Order not found");

  const deliveredData = [];

  for (const product of order.products) {
    const dbProduct = await GamingProduct.findById(product._id);

    if (!dbProduct) {
      throw new Error(`Product "${product.name}" not found.`);
    }

    // 🎁 Giftcard/CDKey logic
    if (product.productType === "giftcard" || product.productType === "cdkey") {
      if (!dbProduct.keys || dbProduct.keys.length === 0) {
        throw new Error(`Product "${product.name}" is out of stock.`);
      }

      const assignedKey = dbProduct.keys.shift(); // Remove first key

      deliveredData.push({
        name: product.name,
        type: product.productType,
        value: assignedKey,
      });

      await dbProduct.save();
    }

    // 👤 Account logic
    else if (product.productType === "account") {
      if (dbProduct.accountType === "private") {
        const availableAccount = dbProduct.accounts.find((acc) => !acc.used);

        if (!availableAccount) {
          throw new Error(`No available private accounts for "${product.name}".`);
        }

        availableAccount.used = true;

        deliveredData.push({
          name: product.name,
          type: "account",
          value: {
            email: availableAccount.details.email,
            password: availableAccount.details.password,
            code: availableAccount.details.code || null,
            loginInstructions: dbProduct.loginInstructions || "Login with the provided credentials."
          },
        });
        await dbProduct.save();

      } else if (dbProduct.accountType === "shared") {
        if (!dbProduct.sharedAccount) {
          throw new Error(`No shared account configured for "${product.name}".`);
        }

        if (dbProduct.sharedAccount.soldCount >= dbProduct.sharedAccount.quantity) {
          throw new Error(`Shared account for "${product.name}" is sold out.`);
        }

        dbProduct.sharedAccount.soldCount += 1;

        deliveredData.push({
          name: product.name,
          type: "account",
          value: {
            email: dbProduct.sharedAccount.details.email,
            password: dbProduct.sharedAccount.details.password,
            code: dbProduct.sharedAccount.details.code || null,
            loginInstructions: dbProduct.loginInstructions || "Login with the provided credentials."
          },
        });
      }

      await dbProduct.save();
    }
  }

  order.deliveredKeys = deliveredData;
  order.status = "completed";
  await order.save();

  // Send confirmation email to user
  await sendEmail({
    to: order.user.email,
    subject: "✅ Your Order is Completed",
    text: `Your order #${order._id} has been verified. Please check your dashboard for access details.`,
  });

  res.status(200).json({
    success: true,
    message: "Order verified and content delivered",
    delivered: deliveredData,
  });
});

export const getAllOrdersWithProducts = asyncHandler(async (req, res) => {
 const orders = await Order.find()
    .sort({ createdAt: -1 })
    .populate("user", "name email")
    .populate("products"); // Includes GamingProduct details

  const formatted = orders.map((order) => ({
    _id: order._id,
    user: order.user,
    totalAmount: order.totalAmount,
    status: order.status,
    transactionCode: order.transactionCode,
    selectedTopup: order.selectedTopup,
    gameUID: order.gameUID,
    gameId: order.gameId,
    gamePassword: order.gamePassword,
    products: order.products.map((p) => ({
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
