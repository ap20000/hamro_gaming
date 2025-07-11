import mongoose from 'mongoose';

/**
 * Each CartItem is one product with one selected top-up option.
 * We store only the selected option (label, amount, price),
 * not the entire topupOptions array from the product.
 */
const CartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GamingProduct',
      required: true,
    },
    selectedOption: {
      type: {
        label: { type: String, required: true },
        amount: { type: Number },
        price: { type: Number },
      },
      required: true,
      _id: false
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },
  },
  {
    _id: false,     // No individual _id for each CartItem in products[]
    strict: true    // Disallow saving undeclared fields
  }
);

/**
 * The Cart links to a single user and contains an array of CartItems.
 */
const CartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // One cart per user
    },
    products: [CartItemSchema],
  },
  {
    timestamps: true,
    strict: true
  }
);

// Optional: Mongoose middleware for logging saves
// Remove or comment out in production if too noisy
/*
CartSchema.pre('save', function (next) {
  console.log('🗂️ [Cart] About to save cart for user:', this.user);
  console.log('✅ Cart contents:', JSON.stringify(this.products, null, 2));
  next();
});
*/

const Cart = mongoose.model('Cart', CartSchema);

export default Cart;
