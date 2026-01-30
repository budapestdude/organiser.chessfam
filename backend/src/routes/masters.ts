import express from 'express';
import * as mastersController from '../controllers/mastersController';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { requireAdmin } from '../middleware/adminAuth';

const router = express.Router();

// Application routes (must come before /:id routes)
router.post('/apply', authenticateToken, mastersController.applyToBeMaster);
router.get('/application/me', authenticateToken, mastersController.getMyApplication);
router.put('/application/me', authenticateToken, mastersController.updateMyApplication);

// Master profile management (for approved masters)
router.get('/profile/me', authenticateToken, mastersController.getMyMasterProfile);
router.put('/profile/me', authenticateToken, mastersController.updateMyMasterProfile);

// Event availability routes
router.put('/event-availability', authenticateToken, mastersController.updateEventAvailability);
router.get('/available-for-events', mastersController.getMastersAvailableForEvents);

// Admin routes
router.get('/admin/applications', authenticateToken, requireAdmin, mastersController.getPendingApplications);
router.post('/admin/applications/:id/approve', authenticateToken, requireAdmin, mastersController.approveApplication);
router.post('/admin/applications/:id/reject', authenticateToken, requireAdmin, mastersController.rejectApplication);

// Public routes
router.get('/', optionalAuth, mastersController.getMasters);

// Routes with :id parameter (must come after static routes)
router.get('/:id', optionalAuth, mastersController.getMasterById);

export default router;
