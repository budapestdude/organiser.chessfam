import express from 'express';
import * as tournamentsController from '../controllers/tournamentsController';
import * as tournamentAnalyticsController from '../controllers/tournamentAnalyticsController';
import * as participantController from '../controllers/participantController';
import { authenticateToken, optionalAuth, verifyTournamentOwnership } from '../middleware/auth';

const router = express.Router();

// User-specific routes (must come before /:id routes)
router.get('/user/registrations', authenticateToken, tournamentsController.getUserTournaments);
router.get('/user/my-tournaments', authenticateToken, tournamentsController.getMyTournaments);
router.get('/user/refunds', authenticateToken, tournamentsController.getUserRefunds);

// Refund routes (must come before /:id routes)
router.get('/registrations/:registrationId/refund-eligibility', authenticateToken, tournamentsController.checkRefundEligibility);
router.post('/registrations/:registrationId/refund', authenticateToken, tournamentsController.requestRefund);

// Public routes (optional auth for personalized data)
router.get('/', optionalAuth, tournamentsController.getTournaments);

// Authenticated creation route
router.post('/', authenticateToken, tournamentsController.createTournament);

// Series management routes
console.log('[ROUTES] Registering tournament series routes');
router.get('/series/all', tournamentsController.getAllTournamentSeries);
router.post('/series/create', authenticateToken, tournamentsController.createTournamentSeriesController);

// Series routes (must come before generic /:id routes)
router.get('/:id/series', tournamentsController.getTournamentSeries);
router.get('/:id/series/images', tournamentsController.getTournamentSeriesImages);
router.get('/:id/series/reviews', tournamentsController.getTournamentSeriesReviews);
router.put('/:id/series', authenticateToken, tournamentsController.updateTournamentSeries);

// Festival management routes (must come before generic /:id routes)
router.post('/:id/convert-to-festival', authenticateToken, tournamentsController.convertToFestivalController);
router.post('/:festivalId/events', authenticateToken, tournamentsController.createFestivalEventController);
router.get('/:festivalId/events', tournamentsController.getFestivalEventsController);
router.delete('/events/:eventId', authenticateToken, tournamentsController.removeFestivalEventController);
router.delete('/festivals/:festivalId', authenticateToken, tournamentsController.deleteFestivalController);

// Organizer-only routes (must come before generic :id routes)
router.get('/:id/analytics', authenticateToken, verifyTournamentOwnership, tournamentAnalyticsController.getTournamentAnalytics);
router.get('/:id/participants', authenticateToken, verifyTournamentOwnership, participantController.getParticipants);
router.post('/:id/participants/bulk-action', authenticateToken, verifyTournamentOwnership, participantController.bulkParticipantAction);
router.get('/:id/participants/export', authenticateToken, verifyTournamentOwnership, participantController.exportParticipants);

// Routes with :id parameter (must come after static routes)
router.get('/:id', optionalAuth, tournamentsController.getTournamentById);
router.get('/:id/refunds', authenticateToken, tournamentsController.getTournamentRefunds);
router.put('/:id', authenticateToken, tournamentsController.updateTournament);
router.delete('/:id', authenticateToken, tournamentsController.deleteTournament);
router.post('/:id/register', authenticateToken, tournamentsController.registerForTournament);
router.delete('/:id/register', authenticateToken, tournamentsController.withdrawFromTournament);
router.get('/:id/registration', authenticateToken, tournamentsController.checkRegistration);

export default router;
