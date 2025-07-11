import mongoose from 'mongoose';

/**
 * Each CartItem is *one product with one selected top-up option*.
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
      label: { type: String, required: true },   // The selected top-up option's label
      amount: { type: Number  },                  // Optional amount (e.g., 100 UC)
      price: { type: Number  },                   // Price user will pay
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },
  },
  { _id: false, strict: true,  } // Don't give CartItems their own _id
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
      unique: true, // one cart per user
    },
    products: [CartItemSchema],
  },
  { timestamps: true }
);

// Optional: Mongoose middleware for logging saves
// Comment this out if you don't want logs in production
/*
CartSchema.pre('save', function (next) {
  console.log('🗂️ [Cart] About to save cart for user:', this.user);
  console.log('✅ Cart contents:', JSON.stringify(this.products, null, 2));
  next();
});
*/

const Cart = mongoose.model('Cart', CartSchema);
export default Cart;
