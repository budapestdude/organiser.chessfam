import express from 'express';
import {
  submitGameResult,
  uploadGamePGN,
  toggleGamePrivacy,
  getGameRecord,
  submitTournamentResults,
  toggleTournamentPrivacy,
  getTournamentRecord
} from '../controllers/gameRecordsController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Game record routes
router.post('/games/:id/result', authenticateToken, submitGameResult);
router.post('/games/:id/pgn', authenticateToken, uploadGamePGN);
router.patch('/games/:id/privacy', authenticateToken, toggleGamePrivacy);
router.get('/games/:id/record', getGameRecord); // Optional auth for public records

// Tournament record routes
router.post('/tournaments/:id/results', authenticateToken, submitTournamentResults);
router.patch('/tournaments/:id/privacy', authenticateToken, toggleTournamentPrivacy);
router.get('/tournaments/:id/record', getTournamentRecord); // Optional auth for public records

export default router;
