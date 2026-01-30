import pool from '../config/database';

export async function getTournamentAnalytics(tournamentId: number) {
  // Get total registrations
  const registrationsQuery = await pool.query(
    'SELECT COUNT(*) as total FROM tournament_registrations WHERE tournament_id = $1',
    [tournamentId]
  );

  const totalRegistrations = parseInt(registrationsQuery.rows[0]?.total || '0');

  // Get revenue breakdown
  const revenueQuery = await pool.query(
    `SELECT
      COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'succeeded'), 0) as total,
      COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'succeeded'), 0) as paid,
      COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'pending'), 0) as pending,
      COALESCE(SUM(p.amount) FILTER (WHERE p.status IN ('refunded', 'partially_refunded')), 0) as refunded
    FROM tournament_registrations tr
    LEFT JOIN payments p ON p.id = tr.payment_id
    WHERE tr.tournament_id = $1`,
    [tournamentId]
  );

  // Get registrations by day
  const registrationsByDayQuery = await pool.query(
    `SELECT
      DATE(registration_date) as date,
      COUNT(*) as count
    FROM tournament_registrations
    WHERE tournament_id = $1
    GROUP BY DATE(registration_date)
    ORDER BY DATE(registration_date)`,
    [tournamentId]
  );

  // Get rating distribution
  const ratingDistributionQuery = await pool.query(
    `SELECT
      CASE
        WHEN u.rating < 1400 THEN 'Beginner (<1400)'
        WHEN u.rating >= 1400 AND u.rating < 1800 THEN 'Intermediate (1400-1800)'
        WHEN u.rating >= 1800 AND u.rating < 2200 THEN 'Advanced (1800-2200)'
        ELSE 'Expert (2200+)'
      END as range,
      COUNT(*) as count
    FROM tournament_registrations tr
    INNER JOIN users u ON u.id = tr.user_id
    WHERE tr.tournament_id = $1 AND u.rating IS NOT NULL
    GROUP BY range
    ORDER BY MIN(u.rating)`,
    [tournamentId]
  );

  // Get geographic distribution
  const geographicQuery = await pool.query(
    `SELECT
      COALESCE(u.country, 'Unknown') as country,
      COUNT(*) as count
    FROM tournament_registrations tr
    INNER JOIN users u ON u.id = tr.user_id
    WHERE tr.tournament_id = $1
    GROUP BY u.country
    ORDER BY count DESC
    LIMIT 10`,
    [tournamentId]
  );

  // Get discount usage (this would need discount fields in the registrations table)
  // For now, returning placeholder zeros
  const discountUsage = {
    early_bird: 0,
    junior: 0,
    senior: 0,
    women: 0,
    titled: 0,
  };

  // Get refund requests
  const refundsQuery = await pool.query(
    `SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'completed') as approved,
      COUNT(*) FILTER (WHERE status = 'pending') as pending,
      COALESCE(SUM(refund_amount), 0) as amount_refunded
    FROM tournament_refunds
    WHERE tournament_id = $1`,
    [tournamentId]
  );

  return {
    total_registrations: totalRegistrations,
    revenue: {
      total: parseFloat(revenueQuery.rows[0]?.total || '0') / 100,
      paid: parseFloat(revenueQuery.rows[0]?.paid || '0') / 100,
      pending: parseFloat(revenueQuery.rows[0]?.pending || '0') / 100,
      refunded: parseFloat(revenueQuery.rows[0]?.refunded || '0') / 100,
    },
    registrations_by_day: registrationsByDayQuery.rows.map(row => ({
      date: row.date,
      count: parseInt(row.count),
    })),
    rating_distribution: ratingDistributionQuery.rows.map(row => ({
      range: row.range,
      count: parseInt(row.count),
    })),
    geographic_distribution: geographicQuery.rows.map(row => ({
      country: row.country,
      count: parseInt(row.count),
    })),
    discount_usage: discountUsage,
    refund_requests: {
      total: parseInt(refundsQuery.rows[0]?.total || '0'),
      approved: parseInt(refundsQuery.rows[0]?.approved || '0'),
      pending: parseInt(refundsQuery.rows[0]?.pending || '0'),
      amount_refunded: parseFloat(refundsQuery.rows[0]?.amount_refunded || '0') / 100,
    },
  };
}
