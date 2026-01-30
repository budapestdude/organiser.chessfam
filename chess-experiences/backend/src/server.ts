import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

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

// Import middleware
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimit';

// Import database
import pool from './config/database';

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for Railway
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply general rate limiting to all routes
app.use('/api', apiLimiter);

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
app.use('/api/v1/setup', setupRoutes); // REMOVE AFTER MAKING ADMIN

// 404 handler
app.use(notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

// Test database connection and start server
const startServer = async () => {
  try {
    // Test database connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connected successfully');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 CORS origin: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
