import { Request, Response } from 'express';
import pool from '../config/database';

// Submit or update a player review
export const submitPlayerReview = async (req: Request, res: Response) => {
  const reviewerId = (req as any).user?.userId;
  const { playerId, rating, badges } = req.body;

  if (!reviewerId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (!playerId || !rating) {
    return res.status(400).json({ message: 'Player ID and rating are required' });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Rating must be between 1 and 5' });
  }

  if (playerId === reviewerId) {
    return res.status(400).json({ message: 'You cannot review yourself' });
  }

  try {
    // Check if review already exists
    const existingReview = await pool.query(
      'SELECT id FROM player_reviews WHERE reviewer_id = $1 AND player_id = $2',
      [reviewerId, playerId]
    );

    let result;
    if (existingReview.rows.length > 0) {
      // Update existing review
      result = await pool.query(
        `UPDATE player_reviews
         SET rating = $1, badges = $2, updated_at = CURRENT_TIMESTAMP
         WHERE reviewer_id = $3 AND player_id = $4
         RETURNING *`,
        [rating, badges || [], reviewerId, playerId]
      );
    } else {
      // Create new review
      result = await pool.query(
        `INSERT INTO player_reviews (reviewer_id, player_id, rating, badges)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [reviewerId, playerId, rating, badges || []]
      );
    }

    res.status(200).json({
      message: 'Review submitted successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error submitting player review:', error);
    res.status(500).json({ message: 'Error submitting review' });
  }
};

// Get all reviews for a player
export const getPlayerReviews = async (req: Request, res: Response) => {
  const { playerId } = req.params;

  try {
    const result = await pool.query(
      `SELECT pr.*, u.name as reviewer_name, u.avatar as reviewer_avatar, u.rating as reviewer_rating
       FROM player_reviews pr
       JOIN users u ON pr.reviewer_id = u.id
       WHERE pr.player_id = $1
       ORDER BY pr.created_at DESC`,
      [playerId]
    );

    // Calculate stats
    const reviews = result.rows;
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

    // Count badge occurrences
    const badgeCounts: Record<string, number> = {};
    reviews.forEach(review => {
      if (review.badges && Array.isArray(review.badges)) {
        review.badges.forEach((badge: string) => {
          badgeCounts[badge] = (badgeCounts[badge] || 0) + 1;
        });
      }
    });

    res.status(200).json({
      data: {
        reviews,
        stats: {
          totalReviews,
          averageRating: Math.round(averageRating * 10) / 10,
          badgeCounts
        }
      }
    });
  } catch (error) {
    console.error('Error fetching player reviews:', error);
    res.status(500).json({ message: 'Error fetching reviews' });
  }
};

// Get user's own review for a player
export const getUserPlayerReview = async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const { playerId } = req.params;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM player_reviews WHERE reviewer_id = $1 AND player_id = $2',
      [userId, playerId]
    );

    res.status(200).json({
      data: result.rows[0] || null
    });
  } catch (error) {
    console.error('Error fetching user review:', error);
    res.status(500).json({ message: 'Error fetching review' });
  }
};
