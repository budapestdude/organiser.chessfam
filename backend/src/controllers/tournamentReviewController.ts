import { Request, Response } from 'express';
import pool from '../config/database';

// Submit or update a tournament review
export const submitTournamentReview = async (req: Request, res: Response) => {
  const reviewerId = (req as any).user?.userId;
  const { tournamentId, rating, reviewText } = req.body;

  if (!reviewerId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (!tournamentId || !rating) {
    return res.status(400).json({ message: 'Tournament ID and rating are required' });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Rating must be between 1 and 5' });
  }

  try {
    // Check if review already exists
    const existingReview = await pool.query(
      'SELECT id FROM tournament_reviews WHERE reviewer_id = $1 AND tournament_id = $2',
      [reviewerId, tournamentId]
    );

    let result;
    if (existingReview.rows.length > 0) {
      // Update existing review
      result = await pool.query(
        `UPDATE tournament_reviews
         SET rating = $1, review_text = $2, updated_at = CURRENT_TIMESTAMP
         WHERE reviewer_id = $3 AND tournament_id = $4
         RETURNING *`,
        [rating, reviewText || null, reviewerId, tournamentId]
      );
    } else {
      // Create new review
      result = await pool.query(
        `INSERT INTO tournament_reviews (reviewer_id, tournament_id, rating, review_text)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [reviewerId, tournamentId, rating, reviewText || null]
      );
    }

    res.status(200).json({
      message: 'Review submitted successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error submitting tournament review:', error);
    res.status(500).json({ message: 'Error submitting review' });
  }
};

// Get all reviews for a tournament
export const getTournamentReviews = async (req: Request, res: Response) => {
  const { tournamentId } = req.params;

  try {
    const result = await pool.query(
      `SELECT tr.*, u.name as reviewer_name, u.avatar as reviewer_avatar
       FROM tournament_reviews tr
       JOIN users u ON tr.reviewer_id = u.id
       WHERE tr.tournament_id = $1
       ORDER BY tr.created_at DESC`,
      [tournamentId]
    );

    // Calculate stats
    const reviews = result.rows;
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

    // Count ratings distribution
    const ratingCounts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
      ratingCounts[review.rating]++;
    });

    res.status(200).json({
      data: {
        reviews,
        stats: {
          totalReviews,
          averageRating: Math.round(averageRating * 10) / 10,
          ratingCounts
        }
      }
    });
  } catch (error) {
    console.error('Error fetching tournament reviews:', error);
    res.status(500).json({ message: 'Error fetching reviews' });
  }
};

// Get user's own review for a tournament
export const getUserTournamentReview = async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const { tournamentId } = req.params;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const result = await pool.query(
      'SELECT id, reviewer_id, tournament_id, rating, review_text, created_at, updated_at FROM tournament_reviews WHERE reviewer_id = $1 AND tournament_id = $2',
      [userId, tournamentId]
    );

    res.status(200).json({
      data: result.rows[0] || null
    });
  } catch (error) {
    console.error('Error fetching user review:', error);
    res.status(500).json({ message: 'Error fetching review' });
  }
};
