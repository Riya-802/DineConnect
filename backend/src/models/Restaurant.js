import mongoose from 'mongoose';

const openingHourSchema = new mongoose.Schema({
  day: { 
    type: String, 
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], 
    required: true 
  },
  open: { type: String, required: true }, // e.g. "09:00" (HH:MM format)
  close: { type: String, required: true } // e.g. "22:00"
});

const restaurantSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true },
  description: { type: String },
  cuisineTypes: [{ type: String }],
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  images: [{ type: String }],
  coverImage: { type: String },
  openingHours: [openingHourSchema],
  isActive: { type: Boolean, default: true },
  avgRating: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 },
  deliveryRadius: { type: Number, default: 5 }, // in km
  minOrderAmount: { type: Number, default: 0 }, // in currency units
  estimatedDeliveryTime: { type: Number, default: 40 } // in minutes
}, {
  timestamps: true
});

const Restaurant = mongoose.model('Restaurant', restaurantSchema);
export default Restaurant;
