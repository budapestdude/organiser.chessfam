/**
 * Analytics Service
 *
 * Handles tracking of user events, conversions, and user flows.
 * Privacy-first approach - no PII stored unless user is authenticated.
 */

import { query } from '../config/database';

export interface AnalyticsEvent {
  event_name: string;
  event_category: 'page_view' | 'conversion' | 'user_action' | 'error';
  user_id?: number;
  session_id?: string;
  anonymous_id?: string;
  properties?: Record<string, any>;
  page_url?: string;
  page_referrer?: string;
  user_agent?: string;
  ip_address?: string;
}

export interface ConversionFunnelStats {
  funnel_name: string;
  steps: {
    step_name: string;
    step_index: number;
    total_users: number;
    conversion_rate: number;
    drop_off_rate: number;
  }[];
  total_started: number;
  total_completed: number;
  overall_conversion_rate: number;
}

/**
 * Track an analytics event
 */
export const trackEvent = async (event: AnalyticsEvent): Promise<void> => {
  try {
    await query(
      `INSERT INTO analytics_events (
        event_name, event_category, user_id, session_id, anonymous_id,
        properties, page_url, page_referrer, user_agent, ip_address, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
      [
        event.event_name,
        event.event_category,
        event.user_id || null,
        event.session_id || null,
        event.anonymous_id || null,
        JSON.stringify(event.properties || {}),
        event.page_url || null,
        event.page_referrer || null,
        event.user_agent || null,
        event.ip_address || null
      ]
    );

    // Update session activity
    if (event.session_id) {
      await updateSessionActivity(event.session_id);
    }
  } catch (error) {
    console.error('[Analytics] Failed to track event:', error);
    // Don't throw - analytics should never break the app
  }
};

/**
 * Create or update user session
 */
export const createOrUpdateSession = async (
  sessionId: string,
  data: {
    user_id?: number;
    anonymous_id?: string;
    entry_url?: string;
    entry_referrer?: string;
    device_type?: string;
    browser?: string;
    os?: string;
  }
): Promise<void> => {
  try {
    await query(
      `INSERT INTO user_sessions (
        session_id, user_id, anonymous_id, entry_url, entry_referrer,
        device_type, browser, os, started_at, last_activity_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      ON CONFLICT (session_id) DO UPDATE SET
        user_id = COALESCE(EXCLUDED.user_id, user_sessions.user_id),
        last_activity_at = NOW()`,
      [
        sessionId,
        data.user_id || null,
        data.anonymous_id || null,
        data.entry_url || null,
        data.entry_referrer || null,
        data.device_type || null,
        data.browser || null,
        data.os || null
      ]
    );
  } catch (error) {
    console.error('[Analytics] Failed to create/update session:', error);
  }
};

/**
 * Update session activity timestamp
 */
const updateSessionActivity = async (sessionId: string): Promise<void> => {
  try {
    await query(
      `UPDATE user_sessions
       SET last_activity_at = NOW(),
           page_views = page_views + 1,
           events_count = events_count + 1
       WHERE session_id = $1`,
      [sessionId]
    );
  } catch (error) {
    console.error('[Analytics] Failed to update session activity:', error);
  }
};

/**
 * End a user session
 */
export const endSession = async (sessionId: string, exitUrl?: string): Promise<void> => {
  try {
    await query(
      `UPDATE user_sessions
       SET ended_at = NOW(),
           exit_url = $2,
           duration_seconds = EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER
       WHERE session_id = $1 AND ended_at IS NULL`,
      [sessionId, exitUrl || null]
    );
  } catch (error) {
    console.error('[Analytics] Failed to end session:', error);
  }
};

/**
 * Get conversion funnel statistics
 */
export const getConversionFunnelStats = async (
  funnelName: string,
  startDate?: Date,
  endDate?: Date
): Promise<ConversionFunnelStats | null> => {
  try {
    // Get funnel definition
    const funnelResult = await query(
      `SELECT funnel_steps FROM conversion_funnels WHERE funnel_name = $1 AND is_active = true`,
      [funnelName]
    );

    if (funnelResult.rows.length === 0) {
      return null;
    }

    const steps: string[] = funnelResult.rows[0].funnel_steps;

    // Build date filter
    let dateFilter = '';
    const queryParams: any[] = [funnelName];
    if (startDate) {
      dateFilter += ` AND created_at >= $${queryParams.length + 1}`;
      queryParams.push(startDate);
    }
    if (endDate) {
      dateFilter += ` AND created_at <= $${queryParams.length + 1}`;
      queryParams.push(endDate);
    }

    // Get user counts for each step
    const stepStats = await Promise.all(
      steps.map(async (stepName, index) => {
        const result = await query(
          `SELECT COUNT(DISTINCT COALESCE(user_id::TEXT, anonymous_id)) as user_count
           FROM analytics_events
           WHERE event_name = $1 ${dateFilter}`,
          [stepName, ...queryParams.slice(1)]
        );

        return {
          step_name: stepName,
          step_index: index,
          total_users: parseInt(result.rows[0]?.user_count || '0')
        };
      })
    );

    // Calculate conversion rates
    const totalStarted = stepStats[0]?.total_users || 0;
    const totalCompleted = stepStats[stepStats.length - 1]?.total_users || 0;

    const enrichedSteps = stepStats.map((step, index) => {
      const previousStepUsers = index === 0 ? totalStarted : stepStats[index - 1].total_users;
      const conversionRate = previousStepUsers > 0
        ? (step.total_users / previousStepUsers) * 100
        : 0;
      const dropOffRate = 100 - conversionRate;

      return {
        ...step,
        conversion_rate: Math.round(conversionRate * 100) / 100,
        drop_off_rate: Math.round(dropOffRate * 100) / 100
      };
    });

    return {
      funnel_name: funnelName,
      steps: enrichedSteps,
      total_started: totalStarted,
      total_completed: totalCompleted,
      overall_conversion_rate: totalStarted > 0
        ? Math.round((totalCompleted / totalStarted) * 10000) / 100
        : 0
    };
  } catch (error) {
    console.error('[Analytics] Failed to get funnel stats:', error);
    return null;
  }
};

/**
 * Get top events by category
 */
export const getTopEvents = async (
  category?: string,
  startDate?: Date,
  endDate?: Date,
  limit: number = 10
): Promise<Array<{ event_name: string; count: number }>> => {
  try {
    let categoryFilter = '';
    const queryParams: any[] = [];

    if (category) {
      categoryFilter = `WHERE event_category = $1`;
      queryParams.push(category);
    }

    let dateFilter = '';
    if (startDate) {
      dateFilter += categoryFilter ? ' AND' : ' WHERE';
      dateFilter += ` created_at >= $${queryParams.length + 1}`;
      queryParams.push(startDate);
    }
    if (endDate) {
      dateFilter += (categoryFilter || dateFilter) ? ' AND' : ' WHERE';
      dateFilter += ` created_at <= $${queryParams.length + 1}`;
      queryParams.push(endDate);
    }

    queryParams.push(limit);

    const result = await query(
      `SELECT event_name, COUNT(*) as count
       FROM analytics_events
       ${categoryFilter}${dateFilter}
       GROUP BY event_name
       ORDER BY count DESC
       LIMIT $${queryParams.length}`,
      queryParams
    );

    return result.rows.map(row => ({
      event_name: row.event_name,
      count: parseInt(row.count)
    }));
  } catch (error) {
    console.error('[Analytics] Failed to get top events:', error);
    return [];
  }
};

/**
 * Get overall analytics summary
 */
export const getAnalyticsSummary = async (
  startDate?: Date,
  endDate?: Date
): Promise<{
  total_events: number;
  total_users: number;
  total_sessions: number;
  avg_session_duration: number;
  page_views: number;
  conversions: number;
}> => {
  try {
    let dateFilter = '';
    const queryParams: any[] = [];

    if (startDate) {
      dateFilter += ` WHERE created_at >= $${queryParams.length + 1}`;
      queryParams.push(startDate);
    }
    if (endDate) {
      dateFilter += dateFilter ? ' AND' : ' WHERE';
      dateFilter += ` created_at <= $${queryParams.length + 1}`;
      queryParams.push(endDate);
    }

    const [eventsResult, sessionsResult] = await Promise.all([
      query(
        `SELECT
          COUNT(*) as total_events,
          COUNT(DISTINCT user_id) as total_users,
          COUNT(*) FILTER (WHERE event_category = 'page_view') as page_views,
          COUNT(*) FILTER (WHERE event_category = 'conversion') as conversions
         FROM analytics_events
         ${dateFilter}`,
        queryParams
      ),
      query(
        `SELECT
          COUNT(*) as total_sessions,
          AVG(duration_seconds) as avg_duration
         FROM user_sessions
         ${dateFilter.replace('created_at', 'started_at')}`,
        queryParams
      )
    ]);

    return {
      total_events: parseInt(eventsResult.rows[0]?.total_events || '0'),
      total_users: parseInt(eventsResult.rows[0]?.total_users || '0'),
      total_sessions: parseInt(sessionsResult.rows[0]?.total_sessions || '0'),
      avg_session_duration: Math.round(parseFloat(sessionsResult.rows[0]?.avg_duration || '0')),
      page_views: parseInt(eventsResult.rows[0]?.page_views || '0'),
      conversions: parseInt(eventsResult.rows[0]?.conversions || '0')
    };
  } catch (error) {
    console.error('[Analytics] Failed to get summary:', error);
    return {
      total_events: 0,
      total_users: 0,
      total_sessions: 0,
      avg_session_duration: 0,
      page_views: 0,
      conversions: 0
    };
  }
};

/**
 * Get user journey for a specific session
 */
export const getUserJourney = async (sessionId: string): Promise<{
  session: any;
  events: any[];
}> => {
  try {
    const [sessionResult, eventsResult] = await Promise.all([
      query(
        `SELECT * FROM user_sessions WHERE session_id = $1`,
        [sessionId]
      ),
      query(
        `SELECT event_name, event_category, properties, page_url, created_at
         FROM analytics_events
         WHERE session_id = $1
         ORDER BY created_at ASC`,
        [sessionId]
      )
    ]);

    return {
      session: sessionResult.rows[0] || null,
      events: eventsResult.rows
    };
  } catch (error) {
    console.error('[Analytics] Failed to get user journey:', error);
    return { session: null, events: [] };
  }
};
