import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/adminAuth';

// Dashboard
import { getStats, getActivity } from '../controllers/admin/dashboardController';

// Users
import {
  listUsers,
  getUser,
  updateUserHandler,
  banUserHandler,
  unbanUserHandler,
  deleteUserHandler,
} from '../controllers/admin/usersController';

// Moderation
import {
  listReviews,
  deleteReviewHandler,
  listPendingVenues,
  approveVenueHandler,
  rejectVenueHandler,
  listPendingMasters,
  approveMasterHandler,
  rejectMasterHandler,
  listPendingClaims,
  approveClaimHandler,
  rejectClaimHandler,
  listPendingTournaments,
  approveTournamentHandler,
  rejectTournamentHandler,
  listPendingClubs,
  approveClubHandler,
  rejectClubHandler,
  listPendingVerifications,
  getVerificationDetails,
  approveVerificationHandler,
  rejectVerificationHandler,
  listPendingChessTitleVerifications,
  getChessTitleVerificationDetails,
  approveChessTitleVerificationHandler,
  rejectChessTitleVerificationHandler,
} from '../controllers/admin/moderationController';

// Direct verification (without application)
import {
  adminDirectlyVerifyUser,
  adminRevokeVerification,
} from '../controllers/verificationController';

// Direct chess title verification (without application)
import {
  adminDirectlyVerifyUserTitle,
  adminRevokeTitleVerification,
} from '../controllers/chessTitleVerificationController';

// Entities Management
import {
  getAllVenues,
  updateVenue,
  deleteVenue,
  getAllClubs,
  updateClub,
  deleteClub,
  getAllTournaments,
  updateTournament,
  deleteTournament,
  getAllMasters,
  updateMaster,
  deleteMaster,
} from '../controllers/admin/entitiesController';

// Blogs
import {
  getAllBlogs,
  updateBlog,
  deleteBlog,
  publishBlog,
  unpublishBlog,
  archiveBlog,
  approveAuthorApplication,
  rejectAuthorApplication,
} from '../controllers/admin/blogsController';

// Platform Settings
import {
  getAllPlatformSettings,
  getPremiumDiscountSettingsHandler,
  updatePremiumDiscountSettingsHandler,
} from '../controllers/admin/platformSettingsController';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

// Dashboard
router.get('/dashboard/stats', getStats);
router.get('/dashboard/activity', getActivity);

// User management
router.get('/users', listUsers);
router.get('/users/:id', getUser);
router.put('/users/:id', updateUserHandler);
router.post('/users/:id/ban', banUserHandler);
router.post('/users/:id/unban', unbanUserHandler);
router.delete('/users/:id', deleteUserHandler);

// Reviews moderation
router.get('/reviews', listReviews);
router.delete('/reviews/:type/:id', deleteReviewHandler);

// Venue approval
router.get('/venues/pending', listPendingVenues);
router.post('/venues/:id/approve', approveVenueHandler);
router.post('/venues/:id/reject', rejectVenueHandler);

// Master applications
router.get('/masters/pending', listPendingMasters);
router.post('/masters/:id/approve', approveMasterHandler);
router.post('/masters/:id/reject', rejectMasterHandler);

// Ownership claims
router.get('/claims/pending', listPendingClaims);
router.post('/claims/:id/approve', approveClaimHandler);
router.post('/claims/:id/reject', rejectClaimHandler);

// Tournament approval
router.get('/tournaments/pending', listPendingTournaments);
router.post('/tournaments/:id/approve', approveTournamentHandler);
router.post('/tournaments/:id/reject', rejectTournamentHandler);

// Club approval
router.get('/clubs/pending', listPendingClubs);
router.post('/clubs/:id/approve', approveClubHandler);
router.post('/clubs/:id/reject', rejectClubHandler);

// Identity verification
router.get('/verifications/pending', listPendingVerifications);
router.get('/verifications/:id', getVerificationDetails);
router.post('/verifications/:id/approve', approveVerificationHandler);
router.post('/verifications/:id/reject', rejectVerificationHandler);

// Direct user verification (without application)
router.post('/users/:userId/verify', adminDirectlyVerifyUser);
router.post('/users/:userId/revoke-verification', adminRevokeVerification);

// Chess title verification
router.get('/chess-title-verifications/pending', listPendingChessTitleVerifications);
router.get('/chess-title-verifications/:id', getChessTitleVerificationDetails);
router.post('/chess-title-verifications/:id/approve', approveChessTitleVerificationHandler);
router.post('/chess-title-verifications/:id/reject', rejectChessTitleVerificationHandler);

// Direct chess title verification (without application)
router.post('/users/:userId/verify-chess-title', adminDirectlyVerifyUserTitle);
router.post('/users/:userId/revoke-chess-title', adminRevokeTitleVerification);

// Venues management
router.get('/venues/all', getAllVenues);
router.put('/venues/:id', updateVenue);
router.delete('/venues/:id', deleteVenue);

// Clubs management
router.get('/clubs', getAllClubs);
router.put('/clubs/:id', updateClub);
router.delete('/clubs/:id', deleteClub);

// Tournaments management
router.get('/tournaments', getAllTournaments);
router.put('/tournaments/:id', updateTournament);
router.delete('/tournaments/:id', deleteTournament);

// Masters management
router.get('/masters/all', getAllMasters);
router.put('/masters/:id', updateMaster);
router.delete('/masters/:id', deleteMaster);

// Database migrations (one-time setup)
router.post('/run-migrations', async (req, res) => {
  try {
    const { execSync } = require('child_process');
    const path = require('path');
    const setupPath = path.join(__dirname, '../../setup-db.js');
    console.log('[Admin] Running migrations from:', setupPath);

    // Run setup-db.js synchronously
    const output = execSync(`node "${setupPath}"`, {
      cwd: path.join(__dirname, '../..'),
      encoding: 'utf8',
      timeout: 60000, // 60 second timeout
    });

    console.log('[Admin] Migration output:', output);
    res.json({ success: true, message: 'Migrations completed', output });
  } catch (error: any) {
    console.error('[Admin] Migration error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stdout: error.stdout,
      stderr: error.stderr
    });
  }
});

// Test email endpoint
router.post('/test-email', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email address is required' });
    }

    // Import email service
    const { sendEmail } = require('../services/emailService');

    // Send a simple test email
    const subject = 'ChessFam Email Test';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; background-color: #1a1a2e; color: #ffffff; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #252540; border-radius: 16px; padding: 32px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #8b5cf6; margin: 0;">ChessFam</h1>
          </div>
          <h2 style="color: #ffffff; margin: 0 0 16px 0;">✅ Email System Working!</h2>
          <p style="color: #cccccc; line-height: 1.6;">This is a test email from your ChessFam application.</p>
          <p style="color: #cccccc; line-height: 1.6;">If you're reading this, your email configuration is set up correctly! 🎉</p>
          <div style="background: #1a1a2e; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <p style="color: #888; margin: 8px 0;">Sent at: <span style="color: #ccc;">${new Date().toISOString()}</span></p>
            <p style="color: #888; margin: 8px 0;">Environment: <span style="color: #ccc;">${process.env.NODE_ENV || 'development'}</span></p>
          </div>
          <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #3a3a5c; text-align: center; color: #888;">
            <p style="margin: 0; font-size: 12px;">This is a test email from ChessFam admin panel.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    const text = `ChessFam Email Test\n\n✅ Email System Working!\n\nThis is a test email from your ChessFam application.\nIf you're reading this, your email configuration is set up correctly!\n\nSent at: ${new Date().toISOString()}\nEnvironment: ${process.env.NODE_ENV || 'development'}`;

    const result = await sendEmail(email, subject, html, text);

    if (result.success) {
      console.log('[Admin] Test email sent successfully to:', email);
      res.json({
        success: true,
        message: `Test email sent to ${email}. Check your inbox (and spam folder).`,
        messageId: result.messageId
      });
    } else {
      console.error('[Admin] Test email failed:', result.error);
      res.status(500).json({
        error: result.error || 'Failed to send test email. Check server logs and environment variables.'
      });
    }
  } catch (error: any) {
    console.error('[Admin] Test email error:', error);
    res.status(500).json({
      error: error.message || 'Failed to send test email. Check server logs and environment variables.'
    });
  }
});

// Blog Management
router.get('/blogs', getAllBlogs);
router.put('/blogs/:id', updateBlog);
router.delete('/blogs/:id', deleteBlog);
router.post('/blogs/:id/publish', publishBlog);
router.post('/blogs/:id/unpublish', unpublishBlog);
router.post('/blogs/:id/archive', archiveBlog);
router.post('/blogs/:id/approve-author', approveAuthorApplication);
router.post('/blogs/:id/reject-author', rejectAuthorApplication);

// Platform Settings Management
router.get('/settings', getAllPlatformSettings);
router.get('/settings/premium-discount', getPremiumDiscountSettingsHandler);
router.put('/settings/premium-discount', updatePremiumDiscountSettingsHandler);

export default router;
