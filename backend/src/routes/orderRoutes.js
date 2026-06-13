import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  placeOrder,
  getUserOrders,
  getRestaurantOrders,
  getDeliveryOrders,
  getOrderDetail,
  trackOrder,
  acceptOrder,
  updateOrderStatus,
  assignDeliveryPartner,
  verifyDeliveryOTP,
} from '../controllers/orderController.js';

const router = express.Router();

router.use(protect);

// Customer
router.post('/', authorize('customer'), placeOrder);
router.get('/user', authorize('customer'), getUserOrders);

// Owner
router.get('/restaurant/:id', authorize('owner'), getRestaurantOrders);
router.patch('/:id/accept', authorize('owner'), acceptOrder);
router.patch('/:id/assign', authorize('owner'), assignDeliveryPartner);

// Delivery partner
router.get('/delivery', authorize('delivery'), getDeliveryOrders);
router.post('/:id/verify-otp', authorize('delivery'), verifyDeliveryOTP);

// Shared (customer + owner + delivery)
router.patch('/:id/status', updateOrderStatus);
router.get('/:id/track', trackOrder);
router.get('/:id', getOrderDetail);

export default router;
