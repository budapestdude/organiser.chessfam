import express from 'express';
import * as professionalsController from '../controllers/professionalsController';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { requireAdmin } from '../middleware/adminAuth';

const router = express.Router();

// ===== APPLICATION ROUTES (must come before /:id routes) =====
router.post('/apply', authenticateToken, professionalsController.applyAsProfessional);
router.get('/application/me', authenticateToken, professionalsController.getMyApplication);
router.put('/application/me', authenticateToken, professionalsController.updateMyApplication);

// ===== PROFESSIONAL PROFILE MANAGEMENT (for approved professionals) =====
router.get('/profile/me', authenticateToken, professionalsController.getMyProfessionalProfile);
router.put('/profile/me', authenticateToken, professionalsController.updateMyProfessionalProfile);
router.put('/services/me', authenticateToken, professionalsController.updateMyServices);
router.get('/stats/me', authenticateToken, professionalsController.getMyProfessionalStats);

// ===== BOOKING ROUTES =====
router.post('/bookings', authenticateToken, professionalsController.createBooking);
router.get('/bookings/me', authenticateToken, professionalsController.getMyBookings);
router.get('/bookings/:id', authenticateToken, professionalsController.getBookingById);
router.put('/bookings/:id/status', authenticateToken, professionalsController.updateBookingStatus);
router.post('/bookings/:id/complete', authenticateToken, professionalsController.completeBooking);
router.post('/bookings/:id/cancel', authenticateToken, professionalsController.cancelBooking);

// ===== REVIEW ROUTES =====
router.post('/reviews', authenticateToken, professionalsController.createReview);
router.delete('/reviews/:id', authenticateToken, requireAdmin, professionalsController.deleteReview);

// ===== ADMIN ROUTES =====
router.get('/admin/applications', authenticateToken, requireAdmin, professionalsController.getPendingApplications);
router.get('/admin/applications/:id', authenticateToken, requireAdmin, professionalsController.getApplicationById);
router.post('/admin/applications/:id/approve', authenticateToken, requireAdmin, professionalsController.approveApplication);
router.post('/admin/applications/:id/reject', authenticateToken, requireAdmin, professionalsController.rejectApplication);

// ===== PUBLIC ROUTES (specific routes before :id routes) =====
router.get('/types', professionalsController.getProfessionalTypes);
router.get('/featured', professionalsController.getFeaturedProfessionals);
router.get('/search', professionalsController.searchProfessionals);

// ===== PUBLIC ROUTES (with :id parameter) =====
router.get('/', optionalAuth, professionalsController.getProfessionals);
router.get('/:id', optionalAuth, professionalsController.getProfessionalById);
router.get('/:id/services', professionalsController.getProfessionalServices);
router.get('/:id/reviews', professionalsController.getProfessionalReviews);
router.get('/:id/reviews/breakdown', professionalsController.getRatingBreakdown);
router.get('/:id/can-review', authenticateToken, professionalsController.canUserReviewProfessional);
router.get('/:id/bookings', authenticateToken, professionalsController.getProfessionalBookings);

export default router;
