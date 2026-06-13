import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  addTable,
  updateTable,
  updateTableStatus,
  deleteTable,
} from '../controllers/tableController.js';

const router = express.Router();

// All table management routes are owner-only
router.use(protect, authorize('owner'));

router.post('/', addTable);
router.put('/:id', updateTable);
router.put('/:id/status', updateTableStatus);
router.delete('/:id', deleteTable);

export default router;
