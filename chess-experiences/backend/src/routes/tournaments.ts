import express from 'express';
import {
  registerForTournament,
  getUserTournamentRegistrations,
  getTournamentRegistrationById
} from '../controllers/tournamentController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.post('/register', authenticateToken, registerForTournament);
router.get('/user', authenticateToken, getUserTournamentRegistrations);
router.get('/:id', authenticateToken, getTournamentRegistrationById);

export default router;
