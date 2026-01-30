import express from 'express';
import {
  createBookingCheckout,
  createTournamentCheckout,
  createClubMembershipCheckout,
  getPaymentStatus,
  getUserPayments,
  adminGetPayments,
  adminRefund,
} from '../controllers/paymentsController';
import { authenticateToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/adminAuth';

const router = express.Router();

// User routes
router.post('/master-booking', authenticateToken, createBookingCheckout);
router.post('/tournament-entry', authenticateToken, createTournamentCheckout);
router.post('/club-membership', authenticateToken, createClubMembershipCheckout);
router.get('/status/:sessionId', authenticateToken, getPaymentStatus);
router.get('/history', authenticateToken, getUserPayments);

// Admin routes
router.get('/admin', authenticateToken, requireAdmin, adminGetPayments);
router.post('/admin/:id/refund', authenticateToken, requireAdmin, adminRefund);

export default router;
