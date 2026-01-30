import express from 'express';
import { completeGame, uploadPGN, getPGN, deletePGN } from '../controllers/gameCompletionController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Complete a game (requires authentication, creator only)
router.post('/:id/complete', authenticateToken, completeGame);

// Upload PGN for a game (requires authentication, participant only)
router.post('/:gameId/pgn', authenticateToken, uploadPGN);

// Get PGN for a game (public)
router.get('/:gameId/pgn', getPGN);

// Delete PGN (requires authentication, uploader only)
router.delete('/:gameId/pgn', authenticateToken, deletePGN);

export default router;
