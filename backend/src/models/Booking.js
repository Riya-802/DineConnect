import mongoose from 'mongoose';

const preOrderItemSchema = new mongoose.Schema({
  menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Menu', required: true },
  quantity: { type: Number, required: true, min: 1 },
  specialNote: { type: String, default: '' }
});

const bookingSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
  tableId: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', required: true, index: true },
  date: { type: Date, required: true, index: true }, // Store as YYYY-MM-DD
  timeSlot: {
    start: { type: String, required: true }, // e.g. "18:00"
    end: { type: String, required: true }   // e.g. "19:30"
  },
  partySize: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'seated', 'completed', 'cancelled'], 
    default: 'pending' 
  },
  preOrderItems: [preOrderItemSchema],
  preOrderTotal: { type: Number, default: 0 },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'paid', 'refunded', 'failed', 'none'], 
    default: 'none' 
  },
  paymentId: { type: String, default: '' },
  specialRequests: { type: String, default: '' }
}, {
  timestamps: true
});

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
