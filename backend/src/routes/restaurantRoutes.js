import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { uploadMultiple } from '../middleware/uploadMiddleware.js';
import {
  listRestaurants,
  getRestaurant,
  getRestaurantMenu,
  getRestaurantTables,
  getRestaurantReviews,
  createRestaurant,
  updateRestaurant,
  uploadImages,
} from '../controllers/restaurantController.js';

const router = express.Router();

// ── Public Routes ─────────────────────────────────────────────────────────────
router.get('/', listRestaurants);
router.get('/:id', getRestaurant);
router.get('/:id/menu', getRestaurantMenu);
router.get('/:id/tables', getRestaurantTables);
router.get('/:id/reviews', getRestaurantReviews);

// ── Owner Protected Routes ────────────────────────────────────────────────────
router.post('/', protect, authorize('owner'), createRestaurant);
router.put('/:id', protect, authorize('owner'), updateRestaurant);
router.post(
  '/:id/images',
  protect,
  authorize('owner'),
  uploadMultiple('images', 5),
  uploadImages
);

export default router;
