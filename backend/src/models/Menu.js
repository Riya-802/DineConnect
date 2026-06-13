import mongoose from 'mongoose';

const menuSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  category: { type: String, required: true, index: true },
  images: [{ type: String }],
  isVeg: { type: Boolean, default: false },
  isAvailable: { type: Boolean, default: true },
  preparationTime: { type: Number, default: 20 }, // in minutes
  tags: [{ type: String }] // e.g. "spicy", "serves-3+", "family-size", "signature"
}, {
  timestamps: true
});

const Menu = mongoose.model('Menu', menuSchema);
export default Menu;
