import express from 'express';
import {
  checkinToVenue,
  getVenueCheckins,
  checkoutFromVenue,
  getUserCheckinStatus
} from '../controllers/checkinController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.post('/checkin', authenticateToken, checkinToVenue);
router.post('/checkout', authenticateToken, checkoutFromVenue);
router.get('/status', authenticateToken, getUserCheckinStatus);
router.get('/venue/:venueId', getVenueCheckins); // Public - anyone can see who's checked in

export default router;
