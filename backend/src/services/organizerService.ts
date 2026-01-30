import pool from '../config/database';

export async function getDashboard(userId: number) {
  // Get tournaments overview
  const tournamentsQuery = await pool.query(
    `SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'upcoming') as upcoming,
      COUNT(*) FILTER (WHERE status = 'ongoing') as ongoing,
      COUNT(*) FILTER (WHERE status = 'completed') as completed,
      COALESCE(SUM(current_participants), 0) as total_participants
    FROM tournaments
    WHERE organizer_id = $1`,
    [userId]
  );

  // Get tournament revenue
  const tournamentRevenueQuery = await pool.query(
    `SELECT COALESCE(SUM(p.amount), 0) as total_revenue
    FROM payments p
    INNER JOIN tournament_registrations tr ON tr.payment_id = p.id
    INNER JOIN tournaments t ON t.id = tr.tournament_id
    WHERE t.organizer_id = $1 AND p.status = 'succeeded'`,
    [userId]
  );

  // Get clubs overview
  const clubsQuery = await pool.query(
    `SELECT
      COUNT(*) as total,
      COALESCE(SUM(member_count), 0) as total_members
    FROM clubs
    WHERE owner_id = $1 AND is_active = true`,
    [userId]
  );

  // Get club revenue
  const clubRevenueQuery = await pool.query(
    `SELECT COALESCE(SUM(p.amount), 0) as total_revenue
    FROM payments p
    INNER JOIN club_memberships cm ON cm.payment_id = p.id
    INNER JOIN clubs c ON c.id = cm.club_id
    WHERE c.owner_id = $1 AND p.status = 'succeeded'`,
    [userId]
  );

  // Get active club events count
  const clubEventsQuery = await pool.query(
    `SELECT COUNT(*) as active_events
    FROM club_events ce
    INNER JOIN clubs c ON c.id = ce.club_id
    WHERE c.owner_id = $1 AND ce.start_time > NOW()`,
    [userId]
  );

  // Get recent activity (last 10 items)
  const recentActivityQuery = await pool.query(
    `(
      SELECT
        'tournament_registration' as type,
        t.name || ' - New registration' as title,
        tr.registration_date as timestamp,
        NULL as amount
      FROM tournament_registrations tr
      INNER JOIN tournaments t ON t.id = tr.tournament_id
      WHERE t.organizer_id = $1
      ORDER BY tr.registration_date DESC
      LIMIT 5
    )
    UNION ALL
    (
      SELECT
        'club_join' as type,
        c.name || ' - New member' as title,
        cm.joined_at as timestamp,
        NULL as amount
      FROM club_memberships cm
      INNER JOIN clubs c ON c.id = cm.club_id
      WHERE c.owner_id = $1
      ORDER BY cm.joined_at DESC
      LIMIT 5
    )
    UNION ALL
    (
      SELECT
        'payment' as type,
        t.name || ' - Payment received' as title,
        p.created_at as timestamp,
        p.amount
      FROM payments p
      INNER JOIN tournament_registrations tr ON tr.payment_id = p.id
      INNER JOIN tournaments t ON t.id = tr.tournament_id
      WHERE t.organizer_id = $1 AND p.status = 'succeeded'
      ORDER BY p.created_at DESC
      LIMIT 5
    )
    ORDER BY timestamp DESC
    LIMIT 10`,
    [userId]
  );

  // Get upcoming events (next 7 days)
  const upcomingEventsQuery = await pool.query(
    `(
      SELECT
        t.id,
        'tournament' as type,
        t.name,
        t.start_date as date,
        t.current_participants as participants
      FROM tournaments t
      WHERE t.organizer_id = $1
        AND t.start_date BETWEEN NOW() AND NOW() + INTERVAL '7 days'
        AND t.status = 'upcoming'
      ORDER BY t.start_date
      LIMIT 5
    )
    UNION ALL
    (
      SELECT
        ce.id,
        'club_event' as type,
        ce.title as name,
        ce.start_time as date,
        0 as participants
      FROM club_events ce
      INNER JOIN clubs c ON c.id = ce.club_id
      WHERE c.owner_id = $1
        AND ce.start_time BETWEEN NOW() AND NOW() + INTERVAL '7 days'
      ORDER BY ce.start_time
      LIMIT 5
    )
    ORDER BY date
    LIMIT 10`,
    [userId]
  );

  return {
    tournaments: {
      total: parseInt(tournamentsQuery.rows[0]?.total || '0'),
      upcoming: parseInt(tournamentsQuery.rows[0]?.upcoming || '0'),
      ongoing: parseInt(tournamentsQuery.rows[0]?.ongoing || '0'),
      completed: parseInt(tournamentsQuery.rows[0]?.completed || '0'),
      total_revenue: parseFloat(tournamentRevenueQuery.rows[0]?.total_revenue || '0') / 100, // Convert cents to euros
      total_participants: parseInt(tournamentsQuery.rows[0]?.total_participants || '0'),
    },
    clubs: {
      total: parseInt(clubsQuery.rows[0]?.total || '0'),
      total_members: parseInt(clubsQuery.rows[0]?.total_members || '0'),
      total_revenue: parseFloat(clubRevenueQuery.rows[0]?.total_revenue || '0') / 100,
      active_events: parseInt(clubEventsQuery.rows[0]?.active_events || '0'),
    },
    recent_activity: recentActivityQuery.rows.map(row => ({
      type: row.type,
      title: row.title,
      timestamp: row.timestamp,
      amount: row.amount ? parseFloat(row.amount) / 100 : undefined,
    })),
    upcoming_events: upcomingEventsQuery.rows.map(row => ({
      id: row.id,
      type: row.type,
      name: row.name,
      date: row.date,
      participants: parseInt(row.participants || '0'),
    })),
  };
}

export async function getFinancials(userId: number, fromDate: string, toDate: string) {
  // Get summary
  const summaryQuery = await pool.query(
    `WITH tournament_payments AS (
      SELECT p.amount, p.status
      FROM payments p
      INNER JOIN tournament_registrations tr ON tr.payment_id = p.id
      INNER JOIN tournaments t ON t.id = tr.tournament_id
      WHERE t.organizer_id = $1
        AND p.created_at BETWEEN $2 AND $3
    ),
    club_payments AS (
      SELECT p.amount, p.status
      FROM payments p
      INNER JOIN club_memberships cm ON cm.payment_id = p.id
      INNER JOIN clubs c ON c.id = cm.club_id
      WHERE c.owner_id = $1
        AND p.created_at BETWEEN $2 AND $3
    ),
    all_payments AS (
      SELECT * FROM tournament_payments
      UNION ALL
      SELECT * FROM club_payments
    )
    SELECT
      COALESCE(SUM(amount) FILTER (WHERE status = 'succeeded'), 0) as total_revenue,
      COALESCE(SUM(amount) FILTER (WHERE status IN ('refunded', 'partially_refunded')), 0) as total_refunds
    FROM all_payments`,
    [userId, fromDate, toDate]
  );

  const totalRevenue = parseFloat(summaryQuery.rows[0]?.total_revenue || '0') / 100;
  const totalRefunds = parseFloat(summaryQuery.rows[0]?.total_refunds || '0') / 100;

  // Get monthly breakdown
  const monthlyQuery = await pool.query(
    `WITH tournament_payments AS (
      SELECT
        DATE_TRUNC('month', p.created_at) as month,
        p.amount,
        p.status
      FROM payments p
      INNER JOIN tournament_registrations tr ON tr.payment_id = p.id
      INNER JOIN tournaments t ON t.id = tr.tournament_id
      WHERE t.organizer_id = $1
        AND p.created_at BETWEEN $2 AND $3
    ),
    club_payments AS (
      SELECT
        DATE_TRUNC('month', p.created_at) as month,
        p.amount,
        p.status
      FROM payments p
      INNER JOIN club_memberships cm ON cm.payment_id = p.id
      INNER JOIN clubs c ON c.id = cm.club_id
      WHERE c.owner_id = $1
        AND p.created_at BETWEEN $2 AND $3
    ),
    all_payments AS (
      SELECT * FROM tournament_payments
      UNION ALL
      SELECT * FROM club_payments
    )
    SELECT
      month,
      COALESCE(SUM(amount) FILTER (WHERE status = 'succeeded'), 0) as revenue,
      COALESCE(SUM(amount) FILTER (WHERE status IN ('refunded', 'partially_refunded')), 0) as refunds
    FROM all_payments
    GROUP BY month
    ORDER BY month`,
    [userId, fromDate, toDate]
  );

  // Get by-event breakdown
  const byEventQuery = await pool.query(
    `(
      SELECT
        t.id as event_id,
        t.name as event_name,
        'tournament' as type,
        COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'succeeded'), 0) as revenue,
        COALESCE(SUM(p.amount) FILTER (WHERE p.status IN ('refunded', 'partially_refunded')), 0) as refunds,
        COUNT(DISTINCT tr.user_id) as participants
      FROM tournaments t
      LEFT JOIN tournament_registrations tr ON tr.tournament_id = t.id
      LEFT JOIN payments p ON p.id = tr.payment_id AND p.created_at BETWEEN $2 AND $3
      WHERE t.organizer_id = $1
      GROUP BY t.id, t.name
    )
    UNION ALL
    (
      SELECT
        c.id as event_id,
        c.name as event_name,
        'club' as type,
        COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'succeeded'), 0) as revenue,
        COALESCE(SUM(p.amount) FILTER (WHERE p.status IN ('refunded', 'partially_refunded')), 0) as refunds,
        COUNT(DISTINCT cm.user_id) as participants
      FROM clubs c
      LEFT JOIN club_memberships cm ON cm.club_id = c.id
      LEFT JOIN payments p ON p.id = cm.payment_id AND p.created_at BETWEEN $2 AND $3
      WHERE c.owner_id = $1
      GROUP BY c.id, c.name
    )
    ORDER BY revenue DESC`,
    [userId, fromDate, toDate]
  );

  // Get transaction history
  const transactionsQuery = await pool.query(
    `(
      SELECT
        p.id,
        p.created_at as date,
        CASE
          WHEN p.status IN ('refunded', 'partially_refunded') THEN 'refund'
          ELSE 'payment'
        END as type,
        p.amount,
        t.name as event_name,
        u.name as participant_name,
        p.status
      FROM payments p
      INNER JOIN tournament_registrations tr ON tr.payment_id = p.id
      INNER JOIN tournaments t ON t.id = tr.tournament_id
      INNER JOIN users u ON u.id = tr.user_id
      WHERE t.organizer_id = $1
        AND p.created_at BETWEEN $2 AND $3
    )
    UNION ALL
    (
      SELECT
        p.id,
        p.created_at as date,
        CASE
          WHEN p.status IN ('refunded', 'partially_refunded') THEN 'refund'
          ELSE 'payment'
        END as type,
        p.amount,
        c.name as event_name,
        u.name as participant_name,
        p.status
      FROM payments p
      INNER JOIN club_memberships cm ON cm.payment_id = p.id
      INNER JOIN clubs c ON c.id = cm.club_id
      INNER JOIN users u ON u.id = cm.user_id
      WHERE c.owner_id = $1
        AND p.created_at BETWEEN $2 AND $3
    )
    ORDER BY date DESC
    LIMIT 100`,
    [userId, fromDate, toDate]
  );

  return {
    summary: {
      total_revenue: totalRevenue,
      total_refunds: totalRefunds,
      net_revenue: totalRevenue - totalRefunds,
    },
    by_month: monthlyQuery.rows.map(row => ({
      month: row.month,
      revenue: parseFloat(row.revenue) / 100,
      refunds: parseFloat(row.refunds) / 100,
      net: (parseFloat(row.revenue) - parseFloat(row.refunds)) / 100,
    })),
    by_event: byEventQuery.rows.map(row => ({
      event_id: row.event_id,
      event_name: row.event_name,
      type: row.type,
      revenue: parseFloat(row.revenue) / 100,
      refunds: parseFloat(row.refunds) / 100,
      participants: parseInt(row.participants || '0'),
    })),
    transactions: transactionsQuery.rows.map(row => ({
      id: row.id,
      date: row.date,
      type: row.type,
      amount: parseFloat(row.amount) / 100,
      event_name: row.event_name,
      participant_name: row.participant_name,
      status: row.status,
    })),
  };
}
