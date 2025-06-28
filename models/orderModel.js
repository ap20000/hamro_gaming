import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'GamingProduct' }],
  totalAmount: { type: Number, required: true },
deliveredKeys: [{ type: mongoose.Schema.Types.Mixed }],

  isClaimed: { type: Boolean, default: false },
  gameUID: { type: String },
  gameId: { type: String },
  gamePassword: { type: String },
  transactionCode: { type: String }, 
  selectedTopup: {
    label: String,
    amount: Number,
    price: Number,
  },
  status: {
    type: String,
    enum: ['pending', 'awaiting_verification', 'completed', 'cancelled'],
    default: 'pending',
  },
}, { timestamps: true });


export default mongoose.model('Order', orderSchema);