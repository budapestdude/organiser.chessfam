import express from 'express';
import {
  getMatchSuggestions,
  updateMatchPreferences,
  getUserMatchPreferences,
  getMatchingPlayers
} from '../controllers/matchingController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// All matching routes require authentication
router.use(authenticateToken);

// Get match suggestions (games)
router.get('/suggestions', getMatchSuggestions);

// Get matching players
router.get('/players', getMatchingPlayers);

// Get user's match preferences
router.get('/preferences', getUserMatchPreferences);

// Update user's match preferences
router.put('/preferences', updateMatchPreferences);

export default router;
