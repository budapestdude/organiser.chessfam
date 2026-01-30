import express from 'express';
import {
  getStatus,
  createCheckout,
  cancel,
  reactivate,
  getBillingPortal,
} from '../controllers/subscriptionController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// All subscription routes require authentication
router.get('/status', authenticateToken, getStatus);
router.post('/checkout', authenticateToken, createCheckout);
router.post('/cancel', authenticateToken, cancel);
router.post('/reactivate', authenticateToken, reactivate);
router.get('/billing-portal', authenticateToken, getBillingPortal);

export default router;
