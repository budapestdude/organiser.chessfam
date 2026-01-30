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
      `SELECT * FROM venue_checkins
       WHERE user_id = $1 AND venue_id = $2 AND checkin_date = CURRENT_DATE`,
      [userId, venueId]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'You are already checked in at this venue today' });
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

    res.status(200).json({
      data: result.rows[0] || null
    });
  } catch (error) {
    console.error('Error fetching check-in status:', error);
    res.status(500).json({ message: 'Error fetching check-in status' });
  }
};
