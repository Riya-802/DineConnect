import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { uploadSingle } from '../middleware/uploadMiddleware.js';
import {
  getMe,
  updateMe,
  addAddress,
  removeAddress,
} from '../controllers/userController.js';

const router = express.Router();

// All user routes require authentication
router.use(protect);

router.get('/me', getMe);
router.put('/me', uploadSingle('avatar'), updateMe);
router.post('/me/address', addAddress);
router.delete('/me/address/:id', removeAddress);

export default router;
