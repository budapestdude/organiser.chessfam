import express from 'express';
import * as communitiesController from '../controllers/communitiesController';
import { authenticateToken, optionalAuth } from '../middleware/auth';

const router = express.Router();

// ============ COMMUNITIES ============

// User-specific routes (must come before /:id routes)
router.get('/user/memberships', authenticateToken, communitiesController.getUserCommunities);
router.get('/user/owned', authenticateToken, communitiesController.getUserOwnedCommunities);

// City stats (for bubble counts)
router.get('/stats/cities', communitiesController.getCityStats);

// Get communities by city
router.get('/city/:city', communitiesController.getCommunitiesByCity);

// Get community by slug
router.get('/slug/:slug', optionalAuth, communitiesController.getCommunityBySlug);

// Public routes
router.get('/', optionalAuth, communitiesController.getCommunities);

// Authenticated creation route
router.post('/', authenticateToken, communitiesController.createCommunity);

// Routes with :id parameter (must come after static routes)
router.get('/:id', optionalAuth, communitiesController.getCommunityById);
router.put('/:id', authenticateToken, communitiesController.updateCommunity);

// ============ MEMBERS ============

router.get('/:id/members', communitiesController.getCommunityMembers);
router.post('/:id/join', authenticateToken, communitiesController.joinCommunity);
router.delete('/:id/leave', authenticateToken, communitiesController.leaveCommunity);

// ============ MESSAGES ============

router.get('/:id/messages', optionalAuth, communitiesController.getCommunityMessages);
router.post('/:id/messages', authenticateToken, communitiesController.createMessage);
router.delete('/messages/:messageId', authenticateToken, communitiesController.deleteMessage);

// ============ PRESENCE ============

router.post('/presence', authenticateToken, communitiesController.updatePresence);
router.post('/:id/checkin', authenticateToken, communitiesController.checkIn);
router.post('/:id/checkout', authenticateToken, communitiesController.checkOut);
router.get('/:id/online', communitiesController.getOnlineUsers);

// ============ THEATER CONTENT ============

router.get('/:id/theater', communitiesController.getTheaterContent);
router.get('/:id/theater/all', authenticateToken, communitiesController.getAllTheaterContent);
router.post('/:id/theater', authenticateToken, communitiesController.upsertTheaterContent);
router.delete('/:id/theater/:contentId', authenticateToken, communitiesController.deleteTheaterContent);

export default router;
