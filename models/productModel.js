import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, required: true },
    deliveryTime: { type: String, required: true },
    platform: { type: String, required: true },
    region: { type: String, required: true },
    gameType: { type: String, required: true }, // e.g., PUBG, Free Fire
    status: { type: String, default: 'active' },
    productType: { type: String, required: true }, // topup, giftcard, cdkey

    // Topup Specific
    itemType: { type: String }, // e.g., UC, Diamond
    
    topupOptions: [
      {
        label: { type: String }, // e.g., '300 UC'
        amount: { type: Number }, // e.g., 300
        price: { type: Number },  // price for this amount
      },
    ],

    accountType: {
      type: String,
      enum: ['private', 'shared'],
    },
    
    accounts: [
      {
        email: String,
        password: String,
        code: String,
        used: { type: Boolean, default: false },
      }
    ],
    
    sharedAccount: {
      email: String,
      password: String,
      code: String,
      quantity: { type: Number, default: 0 },
      soldCount: { type: Number, default: 0 }
    },


      loginInstructions: { type: String },

    // Giftcard / CDKey
    keys: [{ type: String }],
    expirationDate: { type: Date },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

ProductSchema.virtual('stockStatus').get(function () {
  if (this.productType === 'giftcard' || this.productType === 'cdkey') {
    return this.keys && this.keys.length > 0 ? 'In Stock' : 'Out of Stock';
  }
  if (this.productType === 'topup') {
    return this.topupOptions && this.topupOptions.length > 0 ? 'Available' : 'Unavailable';
  }
  return 'Unknown';
});

const GamingProduct = mongoose.model('GamingProduct', ProductSchema);
export default GamingProduct;
