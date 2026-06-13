import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String },
  zip: { type: String },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  label: { type: String, default: 'Home' } // Home, Work, Other
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  phone: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['customer', 'owner', 'delivery'], 
    default: 'customer' 
  },
  avatar: { type: String },
  address: [addressSchema],
  fcmToken: { type: String },
  isVerified: { type: Boolean, default: false },
  refreshToken: { type: String }
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);
export default User;
