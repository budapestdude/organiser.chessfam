import { query } from '../config/database';
import { NotFoundError, ValidationError, ForbiddenError } from '../utils/errors';

// Verify user has permission to moderate reviews (owner/admin)
const verifyModerationPermission = async (clubId: number, userId: number): Promise<void> => {
  const result = await query(
    `SELECT role FROM club_memberships WHERE club_id = $1 AND user_id = $2 AND status = 'active'`,
    [clubId, userId]
  );

  if (result.rows.length === 0 || !['owner', 'admin'].includes(result.rows[0].role)) {
    throw new ForbiddenError('Only club owners and admins can moderate reviews');
  }
};

// Flag a review as inappropriate
export const flagReview = async (
  reviewId: number,
  userId: number,
  reason: string
): Promise<void> => {
  if (!reason || reason.trim().length === 0) {
    throw new ValidationError('Flag reason is required');
  }

  // Check if review exists
  const reviewResult = await query(
    `SELECT id, club_id FROM club_reviews WHERE id = $1`,
    [reviewId]
  );

  if (reviewResult.rows.length === 0) {
    throw new NotFoundError('Review not found');
  }

  // Update review with flag
  await query(
    `UPDATE club_reviews
     SET is_flagged = true,
         flagged_reason = $1,
         flagged_by = $2,
         flagged_at = NOW()
     WHERE id = $3`,
    [reason, userId, reviewId]
  );
};

// Hide a review (owner/admin only)
export const hideReview = async (
  reviewId: number,
  userId: number
): Promise<void> => {
  // Get review details
  const reviewResult = await query(
    `SELECT club_id FROM club_reviews WHERE id = $1`,
    [reviewId]
  );

  if (reviewResult.rows.length === 0) {
    throw new NotFoundError('Review not found');
  }

  const clubId = reviewResult.rows[0].club_id;
  await verifyModerationPermission(clubId, userId);

  // Hide the review
  await query(
    `UPDATE club_reviews
     SET is_hidden = true,
         hidden_by = $1,
         hidden_at = NOW()
     WHERE id = $2`,
    [userId, reviewId]
  );
};

// Unhide a review (owner/admin only)
export const unhideReview = async (
  reviewId: number,
  userId: number
): Promise<void> => {
  // Get review details
  const reviewResult = await query(
    `SELECT club_id FROM club_reviews WHERE id = $1`,
    [reviewId]
  );

  if (reviewResult.rows.length === 0) {
    throw new NotFoundError('Review not found');
  }

  const clubId = reviewResult.rows[0].club_id;
  await verifyModerationPermission(clubId, userId);

  // Unhide the review
  await query(
    `UPDATE club_reviews
     SET is_hidden = false,
         hidden_by = NULL,
         hidden_at = NULL
     WHERE id = $1`,
    [reviewId]
  );
};

// Clear flag from a review (owner/admin only)
export const clearFlag = async (
  reviewId: number,
  userId: number
): Promise<void> => {
  // Get review details
  const reviewResult = await query(
    `SELECT club_id FROM club_reviews WHERE id = $1`,
    [reviewId]
  );

  if (reviewResult.rows.length === 0) {
    throw new NotFoundError('Review not found');
  }

  const clubId = reviewResult.rows[0].club_id;
  await verifyModerationPermission(clubId, userId);

  // Clear the flag
  await query(
    `UPDATE club_reviews
     SET is_flagged = false,
         flagged_reason = NULL,
         flagged_by = NULL,
         flagged_at = NULL
     WHERE id = $1`,
    [reviewId]
  );
};

// Get flagged reviews for a club (owner/admin only)
export const getFlaggedReviews = async (
  clubId: number,
  userId: number
): Promise<any[]> => {
  await verifyModerationPermission(clubId, userId);

  const result = await query(
    `SELECT
       cr.*,
       u.name as reviewer_name,
       u.avatar as reviewer_avatar,
       fb.name as flagged_by_name
     FROM club_reviews cr
     JOIN users u ON cr.reviewer_id = u.id
     LEFT JOIN users fb ON cr.flagged_by = fb.id
     WHERE cr.club_id = $1 AND cr.is_flagged = true
     ORDER BY cr.flagged_at DESC`,
    [clubId]
  );

  return result.rows;
};

// Get all reviews for moderation (owner/admin only)
export const getReviewsForModeration = async (
  clubId: number,
  userId: number,
  page: number = 1,
  limit: number = 20
): Promise<{ reviews: any[]; total: number }> => {
  await verifyModerationPermission(clubId, userId);

  const offset = (page - 1) * limit;

  // Get total count
  const countResult = await query(
    `SELECT COUNT(*) FROM club_reviews WHERE club_id = $1`,
    [clubId]
  );
  const total = parseInt(countResult.rows[0].count);

  // Get reviews with moderation info
  const result = await query(
    `SELECT
       cr.*,
       u.name as reviewer_name,
       u.avatar as reviewer_avatar,
       fb.name as flagged_by_name,
       hb.name as hidden_by_name
     FROM club_reviews cr
     JOIN users u ON cr.reviewer_id = u.id
     LEFT JOIN users fb ON cr.flagged_by = fb.id
     LEFT JOIN users hb ON cr.hidden_by = hb.id
     WHERE cr.club_id = $1
     ORDER BY cr.created_at DESC
     LIMIT $2 OFFSET $3`,
    [clubId, limit, offset]
  );

  return {
    reviews: result.rows,
    total,
  };
};
