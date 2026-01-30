import express from 'express';
import {
  submitVenue,
  getUserVenueSubmissions,
  getVenueSubmissionById,
  getAllVenueSubmissions,
  updateVenueStatus,
  updateVenueHandler,
  getVenueByIdHandler,
  getApprovedVenues
} from '../controllers/venueController';
import { authenticateToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/adminAuth';

const router = express.Router();

// Public routes
router.get('/approved', getApprovedVenues); // Get approved venues from venues table

// User routes
router.post('/submit', authenticateToken, submitVenue);
router.get('/user', authenticateToken, getUserVenueSubmissions);
router.get('/:id', authenticateToken, getVenueSubmissionById);
router.get('/:id/details', getVenueByIdHandler); // Get venue details for editing
router.put('/:id', authenticateToken, updateVenueHandler); // Update venue (owner only)

// Admin routes
router.get('/admin/all', authenticateToken, requireAdmin, getAllVenueSubmissions);
router.patch('/admin/:id/status', authenticateToken, requireAdmin, updateVenueStatus);

export default router;
