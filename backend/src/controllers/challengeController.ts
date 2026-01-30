import { Request, Response } from 'express';
import pool from '../config/database';
import { requireVerification } from '../services/verificationService';

// Send a challenge to another player or create an open challenge
export const sendChallenge = async (req: Request, res: Response) => {
  const challengerId = (req as any).user.userId;
  const { challengedId, venueId, timeControl, message } = req.body;

  if (!timeControl) {
    return res.status(400).json({ message: 'Time control is required' });
  }

  // For open challenges, challenged_id can be null
  const isOpenChallenge = !challengedId;

  if (!isOpenChallenge && challengerId === challengedId) {
    return res.status(400).json({ message: 'You cannot challenge yourself' });
  }

  try {
    // Require identity verification for creating challenges
    try {
      await requireVerification(challengerId);
    } catch (verificationError: any) {
      return res.status(403).json({
        message: 'Identity verification required',
        error: verificationError.message,
        verification_required: true,
      });
    }
    let challengedName = null;

    // If challenging a specific user, validate they exist
    if (!isOpenChallenge) {
      const userCheck = await pool.query('SELECT id, name FROM users WHERE id = $1', [challengedId]);
      if (userCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Challenged user not found' });
      }
      challengedName = userCheck.rows[0].name;

      // Check for existing pending challenge between these users
      const existingChallenge = await pool.query(
        `SELECT id FROM challenges
         WHERE challenger_id = $1 AND challenged_id = $2 AND status = 'pending'`,
        [challengerId, challengedId]
      );

      if (existingChallenge.rows.length > 0) {
        return res.status(400).json({ message: 'You already have a pending challenge with this user' });
      }
    }

    // Create the challenge (challenged_id can be null for open challenges)
    const result = await pool.query(
      `INSERT INTO challenges (challenger_id, challenged_id, venue_id, time_control, message)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [challengerId, challengedId || null, venueId || null, timeControl, message || null]
    );

    // Get challenger info for response
    const challengerInfo = await pool.query('SELECT name FROM users WHERE id = $1', [challengerId]);

    res.status(201).json({
      success: true,
      message: isOpenChallenge
        ? 'Open challenge created! Waiting for someone to accept.'
        : `Challenge sent to ${challengedName}`,
      data: {
        ...result.rows[0],
        challenger_name: challengerInfo.rows[0]?.name,
        challenged_name: challengedName
      }
    });
  } catch (error: any) {
    console.error('Error sending challenge:', error);
    res.status(500).json({ message: 'Error sending challenge', error: error.message });
  }
};

// Get challenges received by the current user
export const getReceivedChallenges = async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;

  try {
    // First expire old challenges
    await pool.query(
      `UPDATE challenges SET status = 'expired', updated_at = CURRENT_TIMESTAMP
       WHERE status = 'pending' AND expires_at < CURRENT_TIMESTAMP`
    );

    const result = await pool.query(
      `SELECT c.*,
              challenger.name as challenger_name,
              challenger.rating as challenger_rating,
              challenger.avatar as challenger_avatar,
              vs.venue_name
       FROM challenges c
       JOIN users challenger ON c.challenger_id = challenger.id
       LEFT JOIN venue_submissions vs ON c.venue_id = vs.id
       WHERE c.challenged_id = $1
       ORDER BY
         CASE c.status WHEN 'pending' THEN 0 ELSE 1 END,
         c.created_at DESC
       LIMIT 50`,
      [userId]
    );

    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching received challenges:', error);
    res.status(500).json({ message: 'Error fetching challenges' });
  }
};

// Get challenges sent by the current user
export const getSentChallenges = async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;

  try {
    const result = await pool.query(
      `SELECT c.*,
              challenged.name as challenged_name,
              challenged.rating as challenged_rating,
              challenged.avatar as challenged_avatar,
              vs.venue_name
       FROM challenges c
       JOIN users challenged ON c.challenged_id = challenged.id
       LEFT JOIN venue_submissions vs ON c.venue_id = vs.id
       WHERE c.challenger_id = $1
       ORDER BY c.created_at DESC
       LIMIT 50`,
      [userId]
    );

    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching sent challenges:', error);
    res.status(500).json({ message: 'Error fetching challenges' });
  }
};

// Get pending challenge count for notifications
export const getPendingCount = async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;

  try {
    const result = await pool.query(
      `SELECT COUNT(*) as count FROM challenges
       WHERE challenged_id = $1 AND status = 'pending' AND expires_at > CURRENT_TIMESTAMP`,
      [userId]
    );

    res.status(200).json({
      success: true,
      data: { count: parseInt(result.rows[0].count) }
    });
  } catch (error) {
    console.error('Error fetching pending count:', error);
    res.status(500).json({ message: 'Error fetching pending count' });
  }
};

// Respond to a challenge (accept or decline)
export const respondToChallenge = async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const { challengeId } = req.params;
  const { response, responseMessage } = req.body;

  if (!['accepted', 'declined'].includes(response)) {
    return res.status(400).json({ message: 'Response must be "accepted" or "declined"' });
  }

  try {
    // Get the challenge and verify ownership
    const challenge = await pool.query(
      `SELECT c.*, u.name as challenger_name
       FROM challenges c
       JOIN users u ON c.challenger_id = u.id
       WHERE c.id = $1`,
      [challengeId]
    );

    if (challenge.rows.length === 0) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    const challengeData = challenge.rows[0];

    if (challengeData.challenged_id !== userId) {
      return res.status(403).json({ message: 'You can only respond to challenges sent to you' });
    }

    if (challengeData.status !== 'pending') {
      return res.status(400).json({ message: `Challenge has already been ${challengeData.status}` });
    }

    if (new Date(challengeData.expires_at) < new Date()) {
      await pool.query(
        `UPDATE challenges SET status = 'expired', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [challengeId]
      );
      return res.status(400).json({ message: 'Challenge has expired' });
    }

    // Update the challenge
    const result = await pool.query(
      `UPDATE challenges
       SET status = $1, response_message = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [response, responseMessage || null, challengeId]
    );

    res.status(200).json({
      success: true,
      message: response === 'accepted'
        ? `Challenge accepted! Get ready to play ${challengeData.challenger_name}!`
        : 'Challenge declined',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error responding to challenge:', error);
    res.status(500).json({ message: 'Error responding to challenge' });
  }
};

// Cancel a sent challenge
export const cancelChallenge = async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const { challengeId } = req.params;

  try {
    const result = await pool.query(
      `UPDATE challenges
       SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND challenger_id = $2 AND status = 'pending'
       RETURNING *`,
      [challengeId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Challenge not found or already responded to' });
    }

    res.status(200).json({
      success: true,
      message: 'Challenge cancelled',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error cancelling challenge:', error);
    res.status(500).json({ message: 'Error cancelling challenge' });
  }
};

// Get all open challenges (public - for the challenges board)
export const getOpenChallenges = async (req: Request, res: Response) => {
  const { city, venueId, timeControl, limit = '50' } = req.query;

  try {
    // First expire old challenges
    await pool.query(
      `UPDATE challenges SET status = 'expired', updated_at = CURRENT_TIMESTAMP
       WHERE status = 'pending' AND expires_at < CURRENT_TIMESTAMP`
    );

    // Only show truly open challenges (no specific opponent)
    let whereClause = `WHERE c.status = 'pending' AND c.expires_at > CURRENT_TIMESTAMP AND c.challenged_id IS NULL`;
    const params: any[] = [];
    let paramIndex = 1;

    if (venueId) {
      whereClause += ` AND c.venue_id = $${paramIndex++}`;
      params.push(venueId);
    }

    if (city) {
      whereClause += ` AND LOWER(vs.city) LIKE LOWER($${paramIndex++})`;
      params.push(`%${city}%`);
    }

    if (timeControl) {
      whereClause += ` AND c.time_control = $${paramIndex++}`;
      params.push(timeControl);
    }

    const result = await pool.query(
      `SELECT c.*,
              challenger.name as challenger_name,
              challenger.rating as challenger_rating,
              challenger.avatar as challenger_avatar,
              vs.venue_name,
              vs.city as venue_city
       FROM challenges c
       JOIN users challenger ON c.challenger_id = challenger.id
       LEFT JOIN venue_submissions vs ON c.venue_id = vs.id
       ${whereClause}
       ORDER BY c.created_at DESC
       LIMIT $${paramIndex}`,
      [...params, parseInt(limit as string)]
    );

    res.status(200).json({
      success: true,
      data: {
        challenges: result.rows,
        total: result.rows.length
      }
    });
  } catch (error) {
    console.error('Error fetching open challenges:', error);
    res.status(500).json({ message: 'Error fetching open challenges' });
  }
};
