import express from 'express';
import {
  createGame,
  getGames,
  getGameById,
  joinGame,
  leaveGame,
  getMyGames,
  getJoinedGames,
  cancelGame,
  joinPrivateGame,
  regenerateInviteLink,
  updateGame
} from '../controllers/gameController';
import { authenticateToken } from '../middleware/auth';
import { validateGame } from '../middleware/validators';

const router = express.Router();

// Public routes (view games)
router.get('/', getGames);

// Protected routes (require authentication)
router.post('/', authenticateToken, validateGame, createGame);
router.get('/user/created', authenticateToken, getMyGames);
router.get('/user/joined', authenticateToken, getJoinedGames);

// Private game routes
router.post('/join-private/:token', authenticateToken, joinPrivateGame);

// Game-specific routes (must come after /user/* and /join-private/* routes)
router.get('/:id', getGameById);
router.put('/:id', authenticateToken, updateGame);
router.post('/:id/join', authenticateToken, joinGame);
router.post('/:id/leave', authenticateToken, leaveGame);
router.post('/:id/cancel', authenticateToken, cancelGame);
router.post('/:id/regenerate-invite', authenticateToken, regenerateInviteLink);

export default router;
