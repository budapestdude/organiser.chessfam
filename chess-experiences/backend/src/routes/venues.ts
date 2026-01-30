import express from 'express';
import {
  submitVenue,
  getUserVenueSubmissions,
  getVenueSubmissionById,
  getAllVenueSubmissions,
  updateVenueStatus
} from '../controllers/venueController';
import { authenticateToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/adminAuth';

const router = express.Router();

// Public routes
router.get('/approved', getAllVenueSubmissions); // Filter by approved status

// User routes
router.post('/submit', authenticateToken, submitVenue);
router.get('/user', authenticateToken, getUserVenueSubmissions);
router.get('/:id', authenticateToken, getVenueSubmissionById);

// Admin routes
router.get('/admin/all', authenticateToken, requireAdmin, getAllVenueSubmissions);
router.patch('/admin/:id/status', authenticateToken, requireAdmin, updateVenueStatus);

export default router;
