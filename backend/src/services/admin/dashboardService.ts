import { query } from '../../config/database';

export interface DashboardStats {
  totalUsers: number;
  newUsersToday: number;
  totalVenues: number;
  pendingVenues: number;
  totalMasters: number;
  pendingMasterApplications: number;
  pendingOwnershipClaims: number;
  totalTournaments: number;
  totalClubs: number;
  totalPayments: number;
  totalRevenue: number;
}

export interface RecentActivity {
  id: number;
  type: string;
  description: string;
  userId: number;
  userName: string;
  createdAt: Date;
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    const queries = await Promise.all([
      // Total users
      query('SELECT COUNT(*) FROM users'),
      // New users today
      query(`SELECT COUNT(*) FROM users WHERE DATE(created_at) = CURRENT_DATE`),
      // Total venues
      query('SELECT COUNT(*) FROM venue_submissions').catch(() => ({ rows: [{ count: 0 }] })),
      // Pending venues
      query(`SELECT COUNT(*) FROM venue_submissions WHERE status = 'pending'`).catch(() => ({ rows: [{ count: 0 }] })),
      // Total masters (users who are masters)
      query(`SELECT COUNT(*) FROM users WHERE id IN (SELECT DISTINCT master_id FROM bookings) OR id IN (SELECT user_id FROM master_applications WHERE status = 'approved')`).catch(() => ({ rows: [{ count: 0 }] })),
      // Pending master applications
      query(`SELECT COUNT(*) FROM master_applications WHERE status = 'pending'`).catch(() => ({ rows: [{ count: 0 }] })),
      // Pending ownership claims
      query(`SELECT COUNT(*) FROM ownership_claims WHERE status = 'pending'`).catch(() => ({ rows: [{ count: 0 }] })),
      // Total tournaments
      query('SELECT COUNT(*) FROM tournaments').catch(() => ({ rows: [{ count: 0 }] })),
      // Total clubs
      query('SELECT COUNT(*) FROM clubs').catch(() => ({ rows: [{ count: 0 }] })),
      // Total payments
      query('SELECT COUNT(*) FROM payments WHERE status = $1', ['succeeded']).catch(() => ({ rows: [{ count: 0 }] })),
      // Total revenue (sum of succeeded payments)
      query(`SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'succeeded'`).catch(() => ({ rows: [{ total: 0 }] })),
    ]);

    return {
      totalUsers: parseInt(queries[0].rows[0].count, 10),
      newUsersToday: parseInt(queries[1].rows[0].count, 10),
      totalVenues: parseInt(queries[2].rows[0].count, 10),
      pendingVenues: parseInt(queries[3].rows[0].count, 10),
      totalMasters: parseInt(queries[4].rows[0].count, 10),
      pendingMasterApplications: parseInt(queries[5].rows[0].count, 10),
      pendingOwnershipClaims: parseInt(queries[6].rows[0].count, 10),
      totalTournaments: parseInt(queries[7].rows[0].count, 10),
      totalClubs: parseInt(queries[8].rows[0].count, 10),
      totalPayments: parseInt(queries[9].rows[0].count, 10),
      totalRevenue: parseInt(queries[10].rows[0].total, 10),
    };
  } catch (error) {
    console.error('[Dashboard] Error fetching stats:', error);
    // Return default values if queries fail
    return {
      totalUsers: 0,
      newUsersToday: 0,
      totalVenues: 0,
      pendingVenues: 0,
      totalMasters: 0,
      pendingMasterApplications: 0,
      pendingOwnershipClaims: 0,
      totalTournaments: 0,
      totalClubs: 0,
      totalPayments: 0,
      totalRevenue: 0,
    };
  }
};

export const getRecentActivity = async (limit: number = 20): Promise<RecentActivity[]> => {
  try {
    // Combine recent activities from different sources
    const result = await query(
      `SELECT * FROM (
        -- New users
        SELECT
          id,
          'new_user' as type,
          'New user registered: ' || name as description,
          id as user_id,
          name as user_name,
          created_at
        FROM users
        ORDER BY created_at DESC
        LIMIT 10
      ) users_activity

      ORDER BY created_at DESC
      LIMIT $1`,
      [limit]
    );

    return result.rows.map(row => ({
      id: row.id,
      type: row.type,
      description: row.description,
      userId: row.user_id,
      userName: row.user_name,
      createdAt: row.created_at,
    }));
  } catch (error) {
    console.error('[Dashboard] Error fetching recent activity:', error);
    // Return empty array if query fails
    return [];
  }
};
