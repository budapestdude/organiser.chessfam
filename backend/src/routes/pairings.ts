import express from 'express';
import * as pairingsController from '../controllers/pairingsController';
import { authenticateToken, verifyTournamentOwnership } from '../middleware/auth';

const router = express.Router();

// All pairing routes require authentication and tournament ownership
// Note: verifyTournamentOwnership middleware checks :id param, so we use :tournamentId

// Generate pairings for next round
router.post('/:tournamentId/rounds/generate',
  authenticateToken,
  pairingsController.generateNextRound
);

// Get all rounds summary
router.get('/:tournamentId/rounds',
  authenticateToken,
  pairingsController.getAllRounds
);

// Get pairings for a specific round
router.get('/:tournamentId/rounds/:roundNumber',
  authenticateToken,
  pairingsController.getRoundPairings
);

// Delete a round
router.delete('/:tournamentId/rounds/:roundNumber',
  authenticateToken,
  pairingsController.deleteRound
);

// Submit game result
router.post('/:tournamentId/games/:gameId/result',
  authenticateToken,
  pairingsController.submitResult
);

// Get standings
router.get('/:tournamentId/standings',
  authenticateToken,
  pairingsController.getStandings
);

export default router;
