import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { uploadSingle } from '../middleware/uploadMiddleware.js';
import {
  createMenuItem,
  updateMenuItem,
  toggleAvailability,
  deleteMenuItem,
} from '../controllers/menuController.js';

const router = express.Router();

// All menu management routes are owner-only
router.use(protect, authorize('owner'));

router.post('/', uploadSingle('image'), createMenuItem);
router.put('/:id', uploadSingle('image'), updateMenuItem);
router.patch('/:id/toggle', toggleAvailability);
router.delete('/:id', deleteMenuItem);

export default router;
