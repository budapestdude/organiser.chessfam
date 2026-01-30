// Load environment variables FIRST (before Sentry)
import dotenv from 'dotenv';
dotenv.config();

// Initialize Sentry BEFORE any other imports
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

let sentryEnabled = false;

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    integrations: [
      nodeProfilingIntegration(),
    ],
    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    // Profiling
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    // Only enable in production
    enabled: process.env.NODE_ENV === 'production',
  });
  sentryEnabled = true;
  console.log('[Sentry] Initialized for error tracking');
}

import express, { Application } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import path from 'path';
import { initVoiceSignaling } from './services/voiceSignaling';
import { initGameNotifications } from './services/gameNotificationService';
import { initScheduler } from './services/schedulerService';

// Database migrations run automatically via setup-db.js on server start
// Migrations 031-045 added for approval_status, tournament categories, etc.

// Import routes
import authRoutes from './routes/auth';
import gamesRoutes from './routes/games';
import bookingsRoutes from './routes/bookings';
import tournamentsRoutes from './routes/tournaments';
import clubsRoutes from './routes/clubs';
import venuesRoutes from './routes/venues';
import setupRoutes from './routes/setup';
import playerReviewsRoutes from './routes/playerReviews';
import venueReviewsRoutes from './routes/venueReviews';
import checkinsRoutes from './routes/checkins';
import achievementsRoutes from './routes/achievements';
import mastersRoutes from './routes/masters';
import professionalsRoutes from './routes/professionals';
import profileRoutes from './routes/profile';
import communitiesRoutes from './routes/communities';
import uploadsRoutes from './routes/uploads';
import challengesRoutes from './routes/challenges';
import favoritesRoutes from './routes/favorites';
import clubReviewsRoutes from './routes/clubReviews';
import tournamentReviewsRoutes from './routes/tournamentReviews';
import ownershipRoutes from './routes/ownership';
import paymentsRoutes from './routes/payments';
import adminRoutes from './routes/admin';
import matchingRoutes from './routes/matching';
import gameChatRoutes from './routes/gameChat';
import waitlistRoutes from './routes/waitlist';
import gameCompletionRoutes from './routes/gameCompletion';
import gameReviewsRoutes from './routes/gameReviews';
import leaderboardsRoutes from './routes/leaderboards';
import gameHistoryRoutes from './routes/gameHistory';
import verificationRoutes from './routes/verification';
import subscriptionRoutes from './routes/subscription';
import gameRecordsRoutes from './routes/gameRecords';
import messagesRoutes from './routes/messages';
import notificationsRoutes from './routes/notifications';
import sitemapRoutes from './routes/sitemap';
import postsRoutes from './routes/posts';
import feedAlgorithmRoutes from './routes/feedAlgorithm';
import analyticsRoutes from './routes/analytics';
import faqRoutes from './routes/faq';
import emailTemplatesRoutes from './routes/emailTemplates';
import blogsRoutes from './routes/blogs';
import authorSubscriptionsRoutes from './routes/authorSubscriptions';
import chessTitleVerificationRoutes from './routes/chessTitleVerification';
import linkPreviewRoutes from './routes/linkPreview';
import organizerRoutes from './routes/organizer';

// Import middleware
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimit';
import { stripeWebhookHandler } from './middleware/stripeWebhook';

// Import database
import pool from './config/database';

const app: Application = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// Trust proxy for Railway
app.set('trust proxy', 1);

// Manual CORS configuration - more reliable than cors() package
const allowedOrigins = CORS_ORIGIN.split(',').map(o => o.trim());
console.log('[CORS] Allowed origins:', allowedOrigins);

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Length, X-Request-Id');
    res.setHeader('Access-Control-Max-Age', '86400');
    console.log(`[CORS] ✅ Set headers for origin: ${origin}`);
  } else if (origin) {
    console.log(`[CORS] ❌ Rejected origin: ${origin}`);
  }

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log(`[CORS] Handling OPTIONS preflight for ${req.path}`);
    return res.status(204).end();
  }

  next();
});

console.log('[CORS] Manual CORS middleware configured');

// Security middleware - MUST be after CORS
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
}));

console.log('[Server] Security middleware configured');

// Initialize voice signaling (Socket.IO)
initVoiceSignaling(httpServer, CORS_ORIGIN);

// Initialize game notifications (Socket.IO)
initGameNotifications(httpServer, CORS_ORIGIN);

// Initialize scheduler (cron jobs for reminders, recurring games)
initScheduler();

// Stripe webhook needs raw body, must be before express.json()
app.post('/api/v1/payments/webhook',
  express.raw({ type: 'application/json' }),
  stripeWebhookHandler
);

// Compression middleware (gzip)
app.use(compression({
  // Only compress responses larger than 1KB
  threshold: 1024,
  // Compress all responses except images (already compressed)
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
}));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing middleware - increased limit for base64 image uploads (chess title verification certificates)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Apply general rate limiting to all routes
app.use('/api', apiLimiter);

// Sitemap (before rate limiting for SEO bots)
app.use('/', sitemapRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/games', gamesRoutes);
app.use('/api/v1/bookings', bookingsRoutes);
app.use('/api/v1/tournaments', tournamentsRoutes);
app.use('/api/v1/clubs', clubsRoutes);
app.use('/api/v1/venues', venuesRoutes);
app.use('/api/v1/player-reviews', playerReviewsRoutes);
app.use('/api/v1/venue-reviews', venueReviewsRoutes);
app.use('/api/v1/checkins', checkinsRoutes);
app.use('/api/v1/achievements', achievementsRoutes);
app.use('/api/v1/masters', mastersRoutes);
app.use('/api/v1/professionals', professionalsRoutes);
app.use('/api/v1/profile', profileRoutes);
app.use('/api/v1/communities', communitiesRoutes);
app.use('/api/v1/uploads', uploadsRoutes);
app.use('/api/v1/challenges', challengesRoutes);
app.use('/api/v1/favorites', favoritesRoutes);
app.use('/api/v1/club-reviews', clubReviewsRoutes);
app.use('/api/v1/tournament-reviews', tournamentReviewsRoutes);
app.use('/api/v1/ownership', ownershipRoutes);
app.use('/api/v1/payments', paymentsRoutes);
app.use('/api/v1/verification', verificationRoutes);
app.use('/api/v1/subscription', subscriptionRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/setup', setupRoutes); // REMOVE AFTER MAKING ADMIN

// New game enhancement routes
app.use('/api/v1/matching', matchingRoutes);
app.use('/api/v1/game-chat', gameChatRoutes);
app.use('/api/v1/waitlist', waitlistRoutes);
app.use('/api/v1/games', gameCompletionRoutes); // Completion and PGN routes
app.use('/api/v1/game-reviews', gameReviewsRoutes);
app.use('/api/v1/leaderboards', leaderboardsRoutes);
app.use('/api/v1/game-history', gameHistoryRoutes);
app.use('/api/v1/records', gameRecordsRoutes);
app.use('/api/v1/messages', messagesRoutes);
app.use('/api/v1/notifications', notificationsRoutes);
app.use('/api/v1/posts', postsRoutes);
app.use('/api/v1/feed-algorithm', feedAlgorithmRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/faq', faqRoutes);
app.use('/api/v1/email-templates', emailTemplatesRoutes);
app.use('/api/v1/blogs', blogsRoutes);
app.use('/api/v1/author-subscriptions', authorSubscriptionsRoutes);
app.use('/api/v1/chess-title-verification', chessTitleVerificationRoutes);
app.use('/api/v1/link-preview', linkPreviewRoutes);
app.use('/api/v1/organizer', organizerRoutes);

// 404 handler
app.use(notFoundHandler);

// Sentry error handler - must be after routes but before custom error handler
if (sentryEnabled) {
  Sentry.setupExpressErrorHandler(app);
}

// Error handling middleware (must be last)
app.use(errorHandler);

// Auto-run gallery migration if needed
const ensureGalleryMigration = async () => {
  try {
    // Check if images column exists in tournaments table
    const checkResult = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'tournaments' AND column_name = 'images'
    `);

    if (checkResult.rows.length === 0) {
      console.log('📸 Running gallery migration (038_add_image_galleries)...');

      // Run the migration
      await pool.query(`
        ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;
        ALTER TABLE venues ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;
        ALTER TABLE clubs ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;
        CREATE INDEX IF NOT EXISTS idx_tournaments_images_gin ON tournaments USING GIN (images);
        CREATE INDEX IF NOT EXISTS idx_venues_images_gin ON venues USING GIN (images);
        CREATE INDEX IF NOT EXISTS idx_clubs_images_gin ON clubs USING GIN (images);
      `);

      console.log('✅ Gallery migration completed successfully');
    } else {
      console.log('✅ Gallery migration already applied');
    }
  } catch (error) {
    console.error('⚠️ Gallery migration check failed:', error);
    // Don't crash the server, just log the warning
  }
};

// Auto-run open challenges migration if needed
const ensureOpenChallengesMigration = async () => {
  try {
    // Check if challenged_id column allows NULL
    const checkResult = await pool.query(`
      SELECT is_nullable
      FROM information_schema.columns
      WHERE table_name = 'challenges' AND column_name = 'challenged_id'
    `);

    if (checkResult.rows.length > 0 && checkResult.rows[0].is_nullable === 'NO') {
      console.log('🎯 Running open challenges migration (039_allow_open_challenges)...');

      // Run the migration
      await pool.query(`
        -- Drop the old constraint that requires different users
        ALTER TABLE challenges DROP CONSTRAINT IF EXISTS different_users;

        -- Make challenged_id nullable to support open challenges
        ALTER TABLE challenges ALTER COLUMN challenged_id DROP NOT NULL;

        -- Add new constraint that only checks when challenged_id is not null
        ALTER TABLE challenges ADD CONSTRAINT different_users
          CHECK (challenged_id IS NULL OR challenger_id != challenged_id);

        -- Update foreign key to allow NULL
        ALTER TABLE challenges DROP CONSTRAINT IF EXISTS challenges_challenged_id_fkey;
        ALTER TABLE challenges ADD CONSTRAINT challenges_challenged_id_fkey
          FOREIGN KEY (challenged_id) REFERENCES users(id) ON DELETE CASCADE;

        -- Add index for open challenges
        CREATE INDEX IF NOT EXISTS idx_challenges_open ON challenges(status, expires_at)
          WHERE challenged_id IS NULL AND status = 'pending';
      `);

      console.log('✅ Open challenges migration completed successfully');
    } else {
      console.log('✅ Open challenges migration already applied');
    }
  } catch (error) {
    console.error('⚠️ Open challenges migration check failed:', error);
    // Don't crash the server, just log the warning
  }
};

// Test database connection and start server
const startServer = async () => {
  try {
    // Test database connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connected successfully');

    // Auto-run gallery migration if needed
    await ensureGalleryMigration();

    // Auto-run open challenges migration if needed
    await ensureOpenChallengesMigration();

    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 CORS origin: ${CORS_ORIGIN}`);
      console.log(`🎙️ Voice signaling available at /voice`);
      console.log(`🎮 Game notifications available at /game-notifications`);
      console.log(`⏰ Scheduler initialized (reminders, recurring games)`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
