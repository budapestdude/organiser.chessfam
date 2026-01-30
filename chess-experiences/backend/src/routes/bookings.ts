import express from 'express';
import {
  createBooking,
  getUserBookings,
  getBookingById
} from '../controllers/bookingController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.post('/', authenticateToken, createBooking);
router.get('/user', authenticateToken, getUserBookings);
router.get('/:id', authenticateToken, getBookingById);

export default router;
