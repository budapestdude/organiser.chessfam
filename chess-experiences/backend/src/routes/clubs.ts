import express from 'express';
import {
  joinClub,
  getUserClubMemberships,
  getClubMembershipById
} from '../controllers/clubController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.post('/join', authenticateToken, joinClub);
router.get('/user', authenticateToken, getUserClubMemberships);
router.get('/:id', authenticateToken, getClubMembershipById);

export default router;
