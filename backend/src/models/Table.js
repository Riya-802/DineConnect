import mongoose from 'mongoose';

const tableSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
  tableNumber: { type: String, required: true },
  capacity: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['available', 'occupied', 'reserved', 'maintenance'], 
    default: 'available' 
  },
  currentBookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
  position: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    width: { type: Number, default: 60 },
    height: { type: Number, default: 60 },
    shape: { type: String, enum: ['circle', 'rectangle'], default: 'rectangle' }
  }
}, {
  timestamps: true
});

// Compound index to ensure table numbers are unique per restaurant
tableSchema.index({ restaurantId: 1, tableNumber: 1 }, { unique: true });

const Table = mongoose.model('Table', tableSchema);
export default Table;
