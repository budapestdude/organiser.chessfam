import express from 'express';
import * as clubsController from '../controllers/clubsController';
import * as clubMemberController from '../controllers/clubMemberController';
import { authenticateToken, optionalAuth, verifyClubOwnership } from '../middleware/auth';

const router = express.Router();

// User-specific routes (must come before /:id routes)
router.get('/user/memberships', authenticateToken, clubsController.getUserClubs);

// Public routes
router.get('/', optionalAuth, clubsController.getClubs);

// Authenticated creation route
router.post('/', authenticateToken, clubsController.createClub);

// Owner-only member management routes (must come before generic routes)
router.get('/:id/members', authenticateToken, verifyClubOwnership, clubMemberController.getMembers);
router.post('/:id/members/bulk-action', authenticateToken, verifyClubOwnership, clubMemberController.bulkMemberAction);
router.get('/:id/members/export', authenticateToken, verifyClubOwnership, clubMemberController.exportMembers);

// Routes with :id parameter (must come after static routes)
router.get('/:id', optionalAuth, clubsController.getClubById);
router.put('/:id', authenticateToken, clubsController.updateClub);
router.post('/:id/join', authenticateToken, clubsController.joinClub);
router.delete('/:id/leave', authenticateToken, clubsController.leaveClub);
router.get('/:id/membership', authenticateToken, clubsController.checkMembership);
router.put('/:id/members/:userId/role', authenticateToken, clubsController.updateMemberRole);

// Ownership transfer
router.post('/:id/transfer-ownership', authenticateToken, clubsController.transferClubOwnership);

// Club deletion
router.delete('/:id', authenticateToken, clubsController.deleteClubController);

// Member management
router.post('/:id/members/:userId/ban', authenticateToken, clubsController.banClubMember);
router.post('/:id/members/:userId/unban', authenticateToken, clubsController.unbanClubMember);

// Multi-venue support
router.get('/:id/venues', clubsController.getClubVenues);
router.post('/:id/venues', authenticateToken, clubsController.addClubVenue);
router.delete('/:id/venues/:venueId', authenticateToken, clubsController.removeClubVenue);
router.put('/:id/venues/:venueId/primary', authenticateToken, clubsController.setPrimaryClubVenue);

export default router;
