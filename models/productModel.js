import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, required: true },
    deliveryTime: { type: String, required: true },
    platform: { type: String, required: true },     // e.g., PC, Xbox, PS5
    region: { type: String, required: true },        // e.g., Global, EU, US
    gameType: { type: String, required: true },      // e.g., Shooter, RPG
    status: { type: String, default: 'active' },     // active / inactive
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

const GamingProduct = mongoose.model('GamingProduct', ProductSchema);
export default GamingProduct;

