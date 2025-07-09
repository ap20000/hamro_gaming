import mongoose from 'mongoose';

const CartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GamingProduct',
      required: true,
    },
    selectedOption: {
      label: String,
      amount: Number,
      price: Number,
    },
    quantity: {
      type: Number,
      default: 1,
    },
  },
  { _id: false }
);

const CartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    products: [CartItemSchema],
  },
  { timestamps: true }
);

const Cart = mongoose.model('Cart', CartSchema);
export default Cart;
