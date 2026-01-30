import { Request, Response } from 'express';
import pool from '../config/database';

// Submit or update a venue review
export const submitVenueReview = async (req: Request, res: Response) => {
  const reviewerId = (req as any).user?.userId;
  const { venueId, rating, reviewText } = req.body;

  if (!reviewerId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (!venueId || !rating) {
    return res.status(400).json({ message: 'Venue ID and rating are required' });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Rating must be between 1 and 5' });
  }

  try {
    // Check if review already exists
    const existingReview = await pool.query(
      'SELECT id FROM venue_reviews WHERE reviewer_id = $1 AND venue_id = $2',
      [reviewerId, venueId]
    );

    let result;
    if (existingReview.rows.length > 0) {
      // Update existing review
      result = await pool.query(
        `UPDATE venue_reviews
         SET rating = $1, review_text = $2, updated_at = CURRENT_TIMESTAMP
         WHERE reviewer_id = $3 AND venue_id = $4
         RETURNING *`,
        [rating, reviewText || null, reviewerId, venueId]
      );
    } else {
      // Create new review
      result = await pool.query(
        `INSERT INTO venue_reviews (reviewer_id, venue_id, rating, review_text)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [reviewerId, venueId, rating, reviewText || null]
      );
    }

    res.status(200).json({
      message: 'Review submitted successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error submitting venue review:', error);
    res.status(500).json({ message: 'Error submitting review' });
  }
};

// Get all reviews for a venue
export const getVenueReviews = async (req: Request, res: Response) => {
  const { venueId } = req.params;

  try {
    const result = await pool.query(
      `SELECT vr.*, u.name as reviewer_name, u.avatar as reviewer_avatar
       FROM venue_reviews vr
       JOIN users u ON vr.reviewer_id = u.id
       WHERE vr.venue_id = $1
       ORDER BY vr.created_at DESC`,
      [venueId]
    );

    // Calculate stats
    const reviews = result.rows;
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

    // Count ratings distribution
    const ratingCounts = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0
    };
    reviews.forEach(review => {
      ratingCounts[review.rating as keyof typeof ratingCounts]++;
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
    console.error('Error fetching venue reviews:', error);
    res.status(500).json({ message: 'Error fetching reviews' });
  }
};

// Get user's own review for a venue
export const getUserVenueReview = async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const { venueId } = req.params;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const result = await pool.query(
      'SELECT id, reviewer_id, venue_id, rating, review_text, created_at, updated_at FROM venue_reviews WHERE reviewer_id = $1 AND venue_id = $2',
      [userId, venueId]
    );

    res.status(200).json({
      data: result.rows[0] || null
    });
  } catch (error) {
    console.error('Error fetching user review:', error);
    res.status(500).json({ message: 'Error fetching review' });
  }
};
