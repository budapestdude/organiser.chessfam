import { Request, Response } from 'express';
import pool from '../config/database';
import { updateUserStats } from './achievementController';

// Check in to a venue
export const checkinToVenue = async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const { venueId } = req.body;

  if (!venueId) {
    return res.status(400).json({ message: 'Venue ID is required' });
  }

  try {
    // First check if table exists by trying to query it
    let tableExists = true;
    try {
      await pool.query(`SELECT 1 FROM venue_checkins LIMIT 1`);
    } catch (tableError: any) {
      if (tableError.code === '42P01') { // Table does not exist
        tableExists = false;
      }
    }

    if (!tableExists) {
      return res.status(503).json({
        message: 'Check-in feature is being set up. Please try again in a few moments.',
        setup_required: true
      });
    }

    // Check if already checked in today
    const existing = await pool.query(
      `SELECT id, user_id, venue_id, checkin_date, checkin_time, checkout_time, status FROM venue_checkins
       WHERE user_id = $1 AND venue_id = $2 AND checkin_date = CURRENT_DATE`,
      [userId, venueId]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'You are already checked in at this venue today' });
    }

    // Check if user has already checked in to 3 venues today (limit)
    const todayCheckinsCount = await pool.query(
      `SELECT COUNT(DISTINCT venue_id) as venue_count
       FROM venue_checkins
       WHERE user_id = $1 AND checkin_date = CURRENT_DATE AND status = 'active'`,
      [userId]
    );

    const venuesCheckedInToday = parseInt(todayCheckinsCount.rows[0].venue_count);

    if (venuesCheckedInToday >= 3) {
      return res.status(400).json({
        message: 'You have reached the maximum of 3 venue check-ins per day',
        limit_reached: true,
        venues_checked_in: venuesCheckedInToday,
        max_venues: 3
      });
    }

    // Create check-in
    const result = await pool.query(
      `INSERT INTO venue_checkins (user_id, venue_id)
       VALUES ($1, $2)
       RETURNING *`,
      [userId, venueId]
    );

    // Update user stats (if table exists)
    try {
      const statsResult = await pool.query(
        `SELECT total_checkins, last_checkin_date, consecutive_checkin_days
         FROM user_stats WHERE user_id = $1`,
        [userId]
      );

      const currentStats = statsResult.rows[0] || { total_checkins: 0, consecutive_checkin_days: 0 };
      const totalCheckins = (currentStats.total_checkins || 0) + 1;

      // Calculate streak
      let consecutiveDays = currentStats.consecutive_checkin_days || 0;
      const lastCheckinDate = currentStats.last_checkin_date;

      if (lastCheckinDate) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const lastDate = new Date(lastCheckinDate);

        if (lastDate.toDateString() === yesterday.toDateString()) {
          consecutiveDays += 1;
        } else if (lastDate.toDateString() !== new Date().toDateString()) {
          consecutiveDays = 1;
        }
      } else {
        consecutiveDays = 1;
      }

      // Get unique venues count
      const uniqueVenuesResult = await pool.query(
        `SELECT COUNT(DISTINCT venue_id) as count FROM venue_checkins WHERE user_id = $1`,
        [userId]
      );
      const uniqueVenues = parseInt(uniqueVenuesResult.rows[0].count);

      await updateUserStats(userId, {
        total_checkins: totalCheckins,
        unique_venues_visited: uniqueVenues,
        consecutive_checkin_days: consecutiveDays,
        last_checkin_date: new Date().toISOString().split('T')[0]
      });
    } catch (statsError) {
      // Stats tracking failed (likely table doesn't exist yet), but check-in still succeeded
      console.log('Stats tracking not available yet:', statsError);
    }

    res.status(201).json({
      message: 'Checked in successfully',
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error checking in:', error);
    res.status(500).json({
      message: 'Error checking in',
      error: error.message,
      detail: error.detail || error.toString()
    });
  }
};

// Get active check-ins for a venue (today only)
export const getVenueCheckins = async (req: Request, res: Response) => {
  const { venueId } = req.params;

  try {
    const result = await pool.query(
      `SELECT vc.*, u.id as user_id, u.name as user_name, u.rating as user_rating
       FROM venue_checkins vc
       JOIN users u ON vc.user_id = u.id
       WHERE vc.venue_id = $1 AND vc.checkin_date = CURRENT_DATE AND vc.status = 'active'
       ORDER BY vc.checkin_time DESC`,
      [venueId]
    );

    res.status(200).json({
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching check-ins:', error);
    res.status(500).json({ message: 'Error fetching check-ins' });
  }
};

// Check out from venue (automatically happens at end of day via cron, but user can manually check out)
export const checkoutFromVenue = async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const { venueId } = req.body;

  try {
    const result = await pool.query(
      `UPDATE venue_checkins
       SET checkout_time = CURRENT_TIMESTAMP, status = 'completed'
       WHERE user_id = $1 AND venue_id = $2 AND checkin_date = CURRENT_DATE AND status = 'active'
       RETURNING *`,
      [userId, venueId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No active check-in found' });
    }

    res.status(200).json({
      message: 'Checked out successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error checking out:', error);
    res.status(500).json({ message: 'Error checking out' });
  }
};

// Get user's current check-in status
export const getUserCheckinStatus = async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;

  try {
    const result = await pool.query(
      `SELECT vc.*, vs.venue_name
       FROM venue_checkins vc
       JOIN venue_submissions vs ON vc.venue_id = vs.id
       WHERE vc.user_id = $1 AND vc.checkin_date = CURRENT_DATE AND vc.status = 'active'`,
      [userId]
    );

    // Also get count of venues checked in today
    const countResult = await pool.query(
      `SELECT COUNT(DISTINCT venue_id) as venue_count
       FROM venue_checkins
       WHERE user_id = $1 AND checkin_date = CURRENT_DATE AND status = 'active'`,
      [userId]
    );

    const venuesCheckedInToday = parseInt(countResult.rows[0].venue_count);

    res.status(200).json({
      data: result.rows[0] || null,
      venues_checked_in_today: venuesCheckedInToday,
      max_venues_per_day: 3,
      remaining_checkins: Math.max(0, 3 - venuesCheckedInToday)
    });
  } catch (error) {
    console.error('Error fetching check-in status:', error);
    res.status(500).json({ message: 'Error fetching check-in status' });
  }
};

// Get venue leaderboard (top players by activity at this venue)
export const getVenueLeaderboard = async (req: Request, res: Response) => {
  const { venueId } = req.params;
  const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

  try {
    // Get the venue name first
    const venueResult = await pool.query(
      `SELECT venue_name FROM venue_submissions WHERE id = $1`,
      [venueId]
    );

    if (venueResult.rows.length === 0) {
      return res.status(404).json({ message: 'Venue not found' });
    }

    const venueName = venueResult.rows[0].venue_name;

    // Get leaderboard: count games created + games participated at this venue
    const result = await pool.query(
      `WITH game_activity AS (
        -- Games created at this venue
        SELECT
          creator_id as user_id,
          COUNT(*) as games_created
        FROM games
        WHERE venue_name = $1
        GROUP BY creator_id
      ),
      participation_activity AS (
        -- Games participated in at this venue
        SELECT
          gp.user_id,
          COUNT(*) as games_joined
        FROM game_participants gp
        JOIN games g ON gp.game_id = g.id
        WHERE g.venue_name = $1
        GROUP BY gp.user_id
      ),
      checkin_activity AS (
        -- Total checkins at this venue
        SELECT
          user_id,
          COUNT(*) as total_checkins
        FROM venue_checkins
        WHERE venue_id = $2
        GROUP BY user_id
      )
      SELECT
        u.id as user_id,
        u.name as user_name,
        u.avatar as user_avatar,
        COALESCE(ga.games_created, 0) as games_created,
        COALESCE(pa.games_joined, 0) as games_joined,
        COALESCE(ga.games_created, 0) + COALESCE(pa.games_joined, 0) as games_played,
        COALESCE(ca.total_checkins, 0) as total_checkins
      FROM users u
      LEFT JOIN game_activity ga ON u.id = ga.user_id
      LEFT JOIN participation_activity pa ON u.id = pa.user_id
      LEFT JOIN checkin_activity ca ON u.id = ca.user_id
      WHERE COALESCE(ga.games_created, 0) + COALESCE(pa.games_joined, 0) + COALESCE(ca.total_checkins, 0) > 0
      ORDER BY games_played DESC, total_checkins DESC
      LIMIT $3`,
      [venueName, venueId, limit]
    );

    res.status(200).json({
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching venue leaderboard:', error);
    res.status(500).json({ message: 'Error fetching leaderboard' });
  }
};
