import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  createReview,
  replyToReview,
  deleteReview,
} from '../controllers/reviewController.js';

const router = express.Router();

router.use(protect);

router.post('/', authorize('customer'), createReview);
router.put('/:id/reply', authorize('owner'), replyToReview);
router.delete('/:id', authorize('customer'), deleteReview);

export default router;
