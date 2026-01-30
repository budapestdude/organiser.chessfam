import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  Users,
  Eye,
  MousePointerClick,
  Target,
  Clock,
  AlertCircle,
  Calendar
} from 'lucide-react';
import apiClient from '../../api/client';

interface AnalyticsSummary {
  total_events: number;
  total_users: number;
  total_sessions: number;
  avg_session_duration: number;
  page_views: number;
  conversions: number;
}

interface TopEvent {
  event_name: string;
  count: number;
}

interface FunnelStats {
  funnel_name: string;
  steps: Array<{
    step_name: string;
    step_index: number;
    total_users: number;
    conversion_rate: number;
    drop_off_rate: number;
  }>;
  total_started: number;
  total_completed: number;
  overall_conversion_rate: number;
}

const AVAILABLE_FUNNELS = [
  { value: 'user_signup', label: 'User Signup' },
  { value: 'tournament_booking', label: 'Tournament Booking' },
  { value: 'club_membership', label: 'Club Membership' },
  { value: 'master_booking', label: 'Master Booking' },
  { value: 'venue_submission', label: 'Venue Submission' },
  { value: 'game_creation', label: 'Game Creation' },
];

export default function AdminAnalytics() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [topEvents, setTopEvents] = useState<TopEvent[]>([]);
  const [selectedFunnel, setSelectedFunnel] = useState('user_signup');
  const [funnelStats, setFunnelStats] = useState<FunnelStats | null>(null);
  const [dateRange, setDateRange] = useState('7d'); // 7d, 30d, 90d, all
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange]);

  useEffect(() => {
    if (selectedFunnel) {
      fetchFunnelStats();
    }
  }, [selectedFunnel, dateRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError('');

      const dateParams = getDateParams();

      const [summaryRes, topEventsRes] = await Promise.all([
        apiClient.get(`/analytics/summary`, { params: dateParams }),
        apiClient.get(`/analytics/top-events`, { params: { ...dateParams, limit: 10 } })
      ]);

      setSummary(summaryRes.data.data);
      setTopEvents(topEventsRes.data.data);
    } catch (err: any) {
      console.error('Failed to fetch analytics:', err);
      setError(err.response?.data?.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const fetchFunnelStats = async () => {
    try {
      const dateParams = getDateParams();

      const res = await apiClient.get(`/analytics/funnel/${selectedFunnel}`, {
        params: dateParams
      });

      setFunnelStats(res.data.data);
    } catch (err: any) {
      console.error('Failed to fetch funnel stats:', err);
      setFunnelStats(null);
    }
  };

  const getDateParams = () => {
    if (dateRange === 'all') return {};

    const now = new Date();
    const daysAgo = parseInt(dateRange);
    const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    return {
      start_date: startDate.toISOString(),
      end_date: now.toISOString()
    };
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (loading && !summary) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="text-white/50">Loading analytics...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Analytics</h1>
              <p className="text-white/60">User behavior and conversion tracking</p>
            </div>
          </div>

          {/* Date Range Selector */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>
        </motion.div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-2 text-red-400">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
            >
              <div className="flex items-center gap-3 mb-3">
                <Eye className="w-5 h-5 text-blue-400" />
                <span className="text-white/60 text-sm font-medium">Page Views</span>
              </div>
              <div className="text-3xl font-bold text-white">{summary.page_views.toLocaleString()}</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
            >
              <div className="flex items-center gap-3 mb-3">
                <Users className="w-5 h-5 text-green-400" />
                <span className="text-white/60 text-sm font-medium">Total Users</span>
              </div>
              <div className="text-3xl font-bold text-white">{summary.total_users.toLocaleString()}</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
            >
              <div className="flex items-center gap-3 mb-3">
                <Target className="w-5 h-5 text-purple-400" />
                <span className="text-white/60 text-sm font-medium">Conversions</span>
              </div>
              <div className="text-3xl font-bold text-white">{summary.conversions.toLocaleString()}</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
            >
              <div className="flex items-center gap-3 mb-3">
                <MousePointerClick className="w-5 h-5 text-yellow-400" />
                <span className="text-white/60 text-sm font-medium">Total Events</span>
              </div>
              <div className="text-3xl font-bold text-white">{summary.total_events.toLocaleString()}</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
            >
              <div className="flex items-center gap-3 mb-3">
                <Calendar className="w-5 h-5 text-orange-400" />
                <span className="text-white/60 text-sm font-medium">Sessions</span>
              </div>
              <div className="text-3xl font-bold text-white">{summary.total_sessions.toLocaleString()}</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
            >
              <div className="flex items-center gap-3 mb-3">
                <Clock className="w-5 h-5 text-pink-400" />
                <span className="text-white/60 text-sm font-medium">Avg Session Duration</span>
              </div>
              <div className="text-3xl font-bold text-white">
                {formatDuration(summary.avg_session_duration)}
              </div>
            </motion.div>
          </div>
        )}

        {/* Top Events */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
        >
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-gold-400" />
            Top Events
          </h2>

          <div className="space-y-3">
            {topEvents.length === 0 ? (
              <p className="text-white/50 text-center py-8">No events tracked yet</p>
            ) : (
              topEvents.map((event) => {
                const maxCount = topEvents[0]?.count || 1;
                const percentage = (event.count / maxCount) * 100;

                return (
                  <div key={event.event_name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium">{event.event_name}</span>
                      <span className="text-white/60">{event.count.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>

        {/* Conversion Funnels */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-400" />
              Conversion Funnels
            </h2>

            <select
              value={selectedFunnel}
              onChange={(e) => setSelectedFunnel(e.target.value)}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
            >
              {AVAILABLE_FUNNELS.map(funnel => (
                <option key={funnel.value} value={funnel.value}>
                  {funnel.label}
                </option>
              ))}
            </select>
          </div>

          {funnelStats ? (
            <div className="space-y-6">
              {/* Overall Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-white/60 text-sm mb-1">Started</div>
                  <div className="text-2xl font-bold text-white">
                    {funnelStats.total_started.toLocaleString()}
                  </div>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-white/60 text-sm mb-1">Completed</div>
                  <div className="text-2xl font-bold text-white">
                    {funnelStats.total_completed.toLocaleString()}
                  </div>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-white/60 text-sm mb-1">Conversion Rate</div>
                  <div className="text-2xl font-bold text-green-400">
                    {funnelStats.overall_conversion_rate.toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Funnel Steps */}
              <div className="space-y-4">
                {funnelStats.steps.map((step, index) => {
                  const isLastStep = index === funnelStats.steps.length - 1;

                  return (
                    <div key={step.step_name}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-sm">
                            {index + 1}
                          </div>
                          <span className="text-white font-medium">
                            {step.step_name.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="flex items-center gap-6">
                          <span className="text-white/60">
                            {step.total_users.toLocaleString()} users
                          </span>
                          {index > 0 && (
                            <span className={`font-bold ${
                              step.conversion_rate >= 50 ? 'text-green-400' :
                              step.conversion_rate >= 25 ? 'text-yellow-400' :
                              'text-red-400'
                            }`}>
                              {step.conversion_rate.toFixed(1)}%
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      {index > 0 && (
                        <div className="ml-11 w-full bg-white/5 rounded-full h-3 mb-2">
                          <div
                            className={`h-3 rounded-full transition-all duration-500 ${
                              step.conversion_rate >= 50 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                              step.conversion_rate >= 25 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                              'bg-gradient-to-r from-red-500 to-pink-500'
                            }`}
                            style={{ width: `${step.conversion_rate}%` }}
                          />
                        </div>
                      )}

                      {/* Drop-off indicator */}
                      {index > 0 && step.drop_off_rate > 0 && (
                        <div className="ml-11 text-sm text-red-400">
                          {step.drop_off_rate.toFixed(1)}% drop-off
                        </div>
                      )}

                      {!isLastStep && (
                        <div className="ml-11 h-6 w-0.5 bg-white/10 my-2" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-white/50 text-center py-8">No funnel data available</p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
