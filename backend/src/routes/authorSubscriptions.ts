import express from 'express';
import {
  setupPricing,
  getPricing,
  createCheckout,
  getMySubscriptions,
  cancel,
  reactivate,
  getSubscribers,
  getRevenue,
  getStats,
} from '../controllers/authorSubscriptionController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Pricing management (author only)
router.post('/pricing/setup', authenticateToken, setupPricing);

// Get author pricing (public - no auth required)
router.get('/pricing', getPricing);

// Subscription checkout (requires authentication)
router.post('/checkout', authenticateToken, createCheckout);

// My subscriptions (subscriber)
router.get('/my-subscriptions', authenticateToken, getMySubscriptions);

// Cancel/reactivate subscription (subscriber)
router.post('/:id/cancel', authenticateToken, cancel);
router.post('/:id/reactivate', authenticateToken, reactivate);

// Author dashboard (author only)
router.get('/subscribers', authenticateToken, getSubscribers);
router.get('/revenue', authenticateToken, getRevenue);
router.get('/stats', authenticateToken, getStats);

export default router;
