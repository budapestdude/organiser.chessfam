import pool from '../config/database';

export interface CreateReviewInput {
  professional_id: number;
  booking_id?: number;
  rating: number;
  comment?: string;
}

export interface Review {
  id: number;
  user_id: number;
  professional_id: number;
  booking_id?: number;
  rating: number;
  comment?: string;
  is_verified: boolean;
  created_at: string;
}

export interface ReviewWithUser extends Review {
  user_name?: string;
  user_email?: string;
  user_avatar?: string;
}

/**
 * Create a review for a professional
 */
export async function createReview(
  userId: number,
  data: CreateReviewInput
): Promise<Review> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Validate rating
    if (data.rating < 1 || data.rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    // If booking_id is provided, verify it exists and belongs to the user
    let isVerified = false;
    if (data.booking_id) {
      const bookingResult = await client.query(
        `SELECT id, user_id, professional_id, status
         FROM professional_bookings
         WHERE id = $1`,
        [data.booking_id]
      );

      if (bookingResult.rows.length === 0) {
        throw new Error('Booking not found');
      }

      const booking = bookingResult.rows[0];

      if (booking.user_id !== userId) {
        throw new Error('Booking does not belong to you');
      }

      if (booking.professional_id !== data.professional_id) {
        throw new Error('Booking is not for this professional');
      }

      if (booking.status !== 'completed') {
        throw new Error('Can only review completed bookings');
      }

      // Check if review already exists for this booking
      const existingReview = await client.query(
        `SELECT id FROM professional_reviews WHERE booking_id = $1`,
        [data.booking_id]
      );

      if (existingReview.rows.length > 0) {
        throw new Error('You have already reviewed this booking');
      }

      isVerified = true;
    }

    // Check if professional exists
    const professionalResult = await client.query(
      `SELECT id FROM professionals WHERE id = $1`,
      [data.professional_id]
    );

    if (professionalResult.rows.length === 0) {
      throw new Error('Professional not found');
    }

    // Create review
    const result = await client.query(
      `INSERT INTO professional_reviews (
        user_id, professional_id, booking_id, rating, comment, is_verified
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        userId,
        data.professional_id,
        data.booking_id || null,
        data.rating,
        data.comment || null,
        isVerified
      ]
    );

    // Update professional's rating statistics
    await updateProfessionalRating(client, data.professional_id);

    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get reviews for a professional
 */
export async function getReviewsByProfessional(
  professionalId: number,
  filters: {
    page?: number;
    limit?: number;
    min_rating?: number;
  } = {}
): Promise<{ reviews: ReviewWithUser[]; total: number }> {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const offset = (page - 1) * limit;

  const conditions = ['r.professional_id = $1'];
  const params: any[] = [professionalId];
  let paramCount = 1;

  if (filters.min_rating) {
    paramCount++;
    conditions.push(`r.rating >= $${paramCount}`);
    params.push(filters.min_rating);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const query = `
    SELECT
      r.*,
      u.name as user_name,
      u.email as user_email,
      u.avatar as user_avatar
    FROM professional_reviews r
    JOIN users u ON r.user_id = u.id
    ${whereClause}
    ORDER BY r.created_at DESC
    LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
  `;

  const countQuery = `
    SELECT COUNT(*)
    FROM professional_reviews r
    ${whereClause}
  `;

  const [result, countResult] = await Promise.all([
    pool.query(query, [...params, limit, offset]),
    pool.query(countQuery, params)
  ]);

  return {
    reviews: result.rows,
    total: parseInt(countResult.rows[0].count)
  };
}

/**
 * Get review by ID
 */
export async function getReviewById(reviewId: number): Promise<ReviewWithUser | null> {
  const result = await pool.query(
    `SELECT
      r.*,
      u.name as user_name,
      u.email as user_email,
      u.avatar as user_avatar
    FROM professional_reviews r
    JOIN users u ON r.user_id = u.id
    WHERE r.id = $1`,
    [reviewId]
  );

  return result.rows[0] || null;
}

/**
 * Check if user can review a professional
 * (has completed booking with them and hasn't reviewed yet)
 */
export async function canUserReview(
  userId: number,
  professionalId: number
): Promise<{ canReview: boolean; bookingId?: number }> {
  const result = await pool.query(
    `SELECT b.id
     FROM professional_bookings b
     LEFT JOIN professional_reviews r ON r.booking_id = b.id
     WHERE b.user_id = $1
       AND b.professional_id = $2
       AND b.status = 'completed'
       AND r.id IS NULL
     ORDER BY b.updated_at DESC
     LIMIT 1`,
    [userId, professionalId]
  );

  if (result.rows.length > 0) {
    return {
      canReview: true,
      bookingId: result.rows[0].id
    };
  }

  return { canReview: false };
}

/**
 * Update professional's rating statistics
 * Called internally after creating a review
 */
async function updateProfessionalRating(client: any, professionalId: number): Promise<void> {
  const result = await client.query(
    `SELECT
      COUNT(*) as total_reviews,
      AVG(rating) as average_rating
    FROM professional_reviews
    WHERE professional_id = $1`,
    [professionalId]
  );

  const stats = result.rows[0];

  await client.query(
    `UPDATE professionals
     SET total_reviews = $1,
         average_rating = $2
     WHERE id = $3`,
    [
      parseInt(stats.total_reviews),
      parseFloat(stats.average_rating).toFixed(2),
      professionalId
    ]
  );
}

/**
 * Get rating breakdown for a professional
 */
export async function getRatingBreakdown(professionalId: number): Promise<{
  total_reviews: number;
  average_rating: number;
  rating_counts: { [key: number]: number };
}> {
  const result = await pool.query(
    `SELECT
      COUNT(*) as total_reviews,
      AVG(rating) as average_rating,
      COUNT(*) FILTER (WHERE rating = 5) as five_star,
      COUNT(*) FILTER (WHERE rating = 4) as four_star,
      COUNT(*) FILTER (WHERE rating = 3) as three_star,
      COUNT(*) FILTER (WHERE rating = 2) as two_star,
      COUNT(*) FILTER (WHERE rating = 1) as one_star
    FROM professional_reviews
    WHERE professional_id = $1`,
    [professionalId]
  );

  const stats = result.rows[0];

  return {
    total_reviews: parseInt(stats.total_reviews),
    average_rating: parseFloat(stats.average_rating || 0),
    rating_counts: {
      5: parseInt(stats.five_star),
      4: parseInt(stats.four_star),
      3: parseInt(stats.three_star),
      2: parseInt(stats.two_star),
      1: parseInt(stats.one_star)
    }
  };
}

/**
 * Delete a review (admin only)
 */
export async function deleteReview(reviewId: number): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get the professional_id before deleting
    const reviewResult = await client.query(
      `SELECT professional_id FROM professional_reviews WHERE id = $1`,
      [reviewId]
    );

    if (reviewResult.rows.length === 0) {
      throw new Error('Review not found');
    }

    const professionalId = reviewResult.rows[0].professional_id;

    // Delete the review
    await client.query(
      `DELETE FROM professional_reviews WHERE id = $1`,
      [reviewId]
    );

    // Update professional's rating statistics
    await updateProfessionalRating(client, professionalId);

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
