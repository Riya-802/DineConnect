import express from 'express';
import { chatWithAssistant, generateReviewInsights, suggestCombo } from '../controllers/aiController.js';

const router = express.Router();

router.post('/chat', chatWithAssistant);
router.get('/insights/:restaurantId', generateReviewInsights);
router.post('/suggest-combo', suggestCombo);

export default router;
