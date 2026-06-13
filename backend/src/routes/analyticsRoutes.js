import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  getRevenueAnalytics,
  getOrderVolume,
  getPopularItems,
  getBookingAnalytics,
} from '../controllers/analyticsController.js';

const router = express.Router();

// All analytics routes are owner-only
router.use(protect, authorize('owner'));

router.get('/revenue', getRevenueAnalytics);
router.get('/orders', getOrderVolume);
router.get('/popular-items', getPopularItems);
router.get('/bookings', getBookingAnalytics);

export default router;
