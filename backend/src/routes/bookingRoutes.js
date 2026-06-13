import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  createBooking,
  getUserBookings,
  getRestaurantBookings,
  updatePreOrder,
  confirmBooking,
  seatCustomer,
  completeBooking,
  cancelBooking,
} from '../controllers/bookingController.js';

const router = express.Router();

router.use(protect);

// Customer
router.post('/', authorize('customer'), createBooking);
router.get('/user', authorize('customer'), getUserBookings);
router.put('/:id/preorder', authorize('customer'), updatePreOrder);
router.patch('/:id/cancel', cancelBooking); // both customer & owner can cancel

// Owner
router.get('/restaurant/:id', authorize('owner'), getRestaurantBookings);
router.patch('/:id/confirm', authorize('owner'), confirmBooking);
router.patch('/:id/seat', authorize('owner'), seatCustomer);
router.patch('/:id/complete', authorize('owner'), completeBooking);

export default router;
