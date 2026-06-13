import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Menu', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 }
});

const timelineEventSchema = new mongoose.Schema({
  status: { 
    type: String, 
    enum: ['placed', 'accepted', 'preparing', 'ready', 'picked', 'delivered', 'cancelled'],
    required: true 
  },
  timestamp: { type: Date, default: Date.now }
});

const orderSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
  deliveryPartnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  items: [orderItemSchema],
  subtotal: { type: Number, required: true },
  deliveryFee: { type: Number, default: 0 },
  taxes: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  deliveryAddress: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    label: { type: String, required: true } // e.g. "123 Flame Ave, City Center"
  },
  status: { 
    type: String, 
    enum: ['placed', 'accepted', 'preparing', 'ready', 'picked', 'delivered', 'cancelled'], 
    default: 'placed' 
  },
  paymentMethod: { type: String, enum: ['cod', 'razorpay'], default: 'razorpay' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded', 'failed'], default: 'pending' },
  paymentId: { type: String, default: '' },
  estimatedDelivery: { type: Date },
  actualDelivery: { type: Date },
  otp: { type: String, required: true }, // 4-digit delivery confirmation OTP
  timeline: [timelineEventSchema]
}, {
  timestamps: true
});

// Auto pre-populate timeline on first save
orderSchema.pre('save', function(next) {
  if (this.isNew && this.timeline.length === 0) {
    this.timeline.push({ status: 'placed', timestamp: new Date() });
  }
  next();
});

const Order = mongoose.model('Order', orderSchema);
export default Order;
