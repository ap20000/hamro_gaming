// models/cartModel.js
import mongoose from 'mongoose';

const SelectedOptionSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    amount: { type: Number },
    price: { type: Number, required: true },
  },
  { _id: false }
);

const CartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GamingProduct',
      required: true,
    },
    selectedOption: {
      type: SelectedOptionSchema,
      required: true,
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1,
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
