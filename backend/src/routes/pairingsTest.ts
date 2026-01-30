import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  createTestTournament,
  runAutomatedTournament,
  runSingleTestRound,
  deleteTestTournament,
  withdrawPlayer,
  requestVoluntaryBye,
  getTournamentParticipants,
  simulateRandomWithdrawals
} from '../controllers/pairingsTestController';

const router = express.Router();

// Skip authentication in development for easier testing
const authMiddleware = process.env.NODE_ENV === 'production' ? authenticateToken : (req: any, res: any, next: any) => {
  // Mock user for development testing
  req.user = { id: 1 };
  next();
};

router.use(authMiddleware);

// Create test tournament with mock participants
router.post('/create', createTestTournament);

// Run entire tournament automatically (all rounds with random results)
router.post('/:tournamentId/run-all', runAutomatedTournament);

// Run single round with random results
router.post('/:tournamentId/run-round', runSingleTestRound);

// Get tournament participants with status
router.get('/:tournamentId/participants', getTournamentParticipants);

// Withdraw a player
router.post('/:tournamentId/players/:playerId/withdraw', withdrawPlayer);

// Request voluntary bye for a specific round
router.post('/:tournamentId/players/:playerId/bye', requestVoluntaryBye);

// Simulate random withdrawals
router.post('/:tournamentId/simulate-withdrawals', simulateRandomWithdrawals);

// Delete test tournament
router.delete('/:tournamentId', deleteTestTournament);

export default router;
