import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  createPaymentOrder,
  verifyPayment,
  getPaymentHistory,
} from '../controllers/paymentController.js';

const router = express.Router();

router.use(protect);

router.post('/create-order', createPaymentOrder);
router.post('/verify', verifyPayment);
router.get('/history', getPaymentHistory);

export default router;
