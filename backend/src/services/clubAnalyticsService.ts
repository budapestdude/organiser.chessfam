import { query } from '../config/database';
import { NotFoundError, ForbiddenError } from '../utils/errors';

// Verify user has permission to view analytics (owner/admin)
const verifyAnalyticsPermission = async (clubId: number, userId: number): Promise<void> => {
  const result = await query(
    `SELECT role FROM club_memberships WHERE club_id = $1 AND user_id = $2 AND status = 'active'`,
    [clubId, userId]
  );

  if (result.rows.length === 0 || !['owner', 'admin'].includes(result.rows[0].role)) {
    throw new ForbiddenError('Only club owners and admins can view analytics');
  }
};

// Get comprehensive club analytics
export const getClubAnalytics = async (clubId: number, userId: number) => {
  await verifyAnalyticsPermission(clubId, userId);

  // Get member growth over time (last 30 days)
  const memberGrowth = await query(
    `SELECT
       DATE(joined_at) as date,
       COUNT(*) as new_members,
       SUM(COUNT(*)) OVER (ORDER BY DATE(joined_at)) as total_members
     FROM club_memberships
     WHERE club_id = $1 AND status = 'active' AND joined_at >= NOW() - INTERVAL '30 days'
     GROUP BY DATE(joined_at)
     ORDER BY date ASC`,
    [clubId]
  );

  // Get member demographics (rating distribution)
  const ratingDistribution = await query(
    `SELECT
       CASE
         WHEN u.rating < 1200 THEN 'Beginner (0-1199)'
         WHEN u.rating < 1600 THEN 'Intermediate (1200-1599)'
         WHEN u.rating < 2000 THEN 'Advanced (1600-1999)'
         ELSE 'Expert (2000+)'
       END as rating_category,
       COUNT(*) as count
     FROM club_memberships cm
     JOIN users u ON cm.user_id = u.id
     WHERE cm.club_id = $1 AND cm.status = 'active'
     GROUP BY rating_category
     ORDER BY MIN(u.rating)`,
    [clubId]
  );

  // Get role distribution
  const roleDistribution = await query(
    `SELECT
       role,
       COUNT(*) as count
     FROM club_memberships
     WHERE club_id = $1 AND status = 'active'
     GROUP BY role
     ORDER BY
       CASE role
         WHEN 'owner' THEN 1
         WHEN 'admin' THEN 2
         WHEN 'officer' THEN 3
         WHEN 'member' THEN 4
       END`,
    [clubId]
  );

  // Get review statistics
  const reviewStats = await query(
    `SELECT
       AVG(rating)::DECIMAL(3,2) as average_rating,
       COUNT(*) as total_reviews,
       COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
       COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
       COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
       COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
       COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star
     FROM club_reviews
     WHERE club_id = $1`,
    [clubId]
  );

  // Get revenue statistics (if club charges fees)
  const revenueStats = await query(
    `SELECT
       DATE_TRUNC('month', completed_at) as month,
       COUNT(*) as payment_count,
       SUM(amount) as total_revenue
     FROM payments
     WHERE club_id = $1 AND status = 'succeeded' AND completed_at >= NOW() - INTERVAL '12 months'
     GROUP BY DATE_TRUNC('month', completed_at)
     ORDER BY month DESC
     LIMIT 12`,
    [clubId]
  );

  // Get event statistics
  const eventStats = await query(
    `SELECT
       COUNT(*) as total_events,
       COUNT(CASE WHEN start_time > NOW() THEN 1 END) as upcoming_events,
       COUNT(CASE WHEN start_time <= NOW() AND end_time >= NOW() THEN 1 END) as ongoing_events,
       COUNT(CASE WHEN end_time < NOW() THEN 1 END) as past_events
     FROM club_events
     WHERE club_id = $1`,
    [clubId]
  );

  // Get messaging activity (last 30 days)
  const messagingActivity = await query(
    `SELECT
       DATE(created_at) as date,
       COUNT(*) as message_count,
       COUNT(DISTINCT sender_id) as unique_senders
     FROM club_messages
     WHERE club_id = $1 AND created_at >= NOW() - INTERVAL '30 days'
     GROUP BY DATE(created_at)
     ORDER BY date DESC`,
    [clubId]
  );

  // Get top contributors (most messages)
  const topContributors = await query(
    `SELECT
       u.id,
       u.name,
       u.avatar,
       COUNT(cm.id) as message_count
     FROM users u
     JOIN club_messages cm ON u.id = cm.sender_id
     WHERE cm.club_id = $1 AND cm.created_at >= NOW() - INTERVAL '30 days'
     GROUP BY u.id, u.name, u.avatar
     ORDER BY message_count DESC
     LIMIT 10`,
    [clubId]
  );

  // Get membership retention (members who joined and stayed)
  const retentionStats = await query(
    `SELECT
       DATE_TRUNC('month', joined_at) as cohort_month,
       COUNT(*) as cohort_size,
       COUNT(CASE WHEN status = 'active' THEN 1 END) as still_active,
       ROUND(COUNT(CASE WHEN status = 'active' THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL * 100, 2) as retention_rate
     FROM club_memberships
     WHERE club_id = $1
     GROUP BY DATE_TRUNC('month', joined_at)
     ORDER BY cohort_month DESC
     LIMIT 12`,
    [clubId]
  );

  return {
    memberGrowth: memberGrowth.rows,
    ratingDistribution: ratingDistribution.rows,
    roleDistribution: roleDistribution.rows,
    reviewStats: reviewStats.rows[0] || {},
    revenueStats: revenueStats.rows,
    eventStats: eventStats.rows[0] || {},
    messagingActivity: messagingActivity.rows,
    topContributors: topContributors.rows,
    retentionStats: retentionStats.rows,
  };
};

// Get member list with details (for export/management)
export const getMemberDetails = async (
  clubId: number,
  userId: number,
  page: number = 1,
  limit: number = 50
): Promise<{ members: any[]; total: number }> => {
  await verifyAnalyticsPermission(clubId, userId);

  const offset = (page - 1) * limit;

  const countResult = await query(
    `SELECT COUNT(*) FROM club_memberships WHERE club_id = $1 AND status = 'active'`,
    [clubId]
  );
  const total = parseInt(countResult.rows[0].count);

  const result = await query(
    `SELECT
       cm.id,
       cm.role,
       cm.joined_at,
       cm.membership_type,
       cm.payment_status,
       u.id as user_id,
       u.name,
       u.email,
       u.rating,
       u.avatar
     FROM club_memberships cm
     JOIN users u ON cm.user_id = u.id
     WHERE cm.club_id = $1 AND cm.status = 'active'
     ORDER BY cm.joined_at DESC
     LIMIT $2 OFFSET $3`,
    [clubId, limit, offset]
  );

  return {
    members: result.rows,
    total,
  };
};
