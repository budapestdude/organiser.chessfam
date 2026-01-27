import { useEffect, useState } from 'react';
import { clubsAPI } from '../../api/clubs';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { Users, Star, Euro, Calendar, MessageSquare } from 'lucide-react';

interface Props {
  clubId: number;
}

export default function ClubAnalytics({ clubId }: Props) {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await clubsAPI.getClubAnalytics(clubId);
        setAnalytics(data);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [clubId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="w-12 h-12 border-4 border-gold-400/30 border-t-gold-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="glass-card p-12 text-center">
        <h3 className="text-xl font-semibold text-white mb-2">No analytics data available</h3>
        <p className="text-white/60">Analytics will appear once your club has members and activity.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-blue-400" />
            <p className="text-white/60 text-sm">Total Members</p>
          </div>
          <p className="text-3xl font-bold text-white">{analytics.member_count || 0}</p>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-2">
            <Star className="w-5 h-5 text-yellow-400" />
            <p className="text-white/60 text-sm">Average Rating</p>
          </div>
          <p className="text-3xl font-bold text-white">
            {analytics.review_stats?.average_rating?.toFixed(1) || 'N/A'}
          </p>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-2">
            <Euro className="w-5 h-5 text-green-400" />
            <p className="text-white/60 text-sm">Total Revenue</p>
          </div>
          <p className="text-3xl font-bold text-white">
            {analytics.revenue_stats?.total_revenue
              ? formatCurrency(analytics.revenue_stats.total_revenue)
              : '€0'}
          </p>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-5 h-5 text-purple-400" />
            <p className="text-white/60 text-sm">Total Events</p>
          </div>
          <p className="text-3xl font-bold text-white">
            {analytics.event_stats?.total_events || 0}
          </p>
        </div>
      </div>

      {/* Member Growth */}
      {analytics.member_growth && analytics.member_growth.length > 0 && (
        <div className="glass-card p-6">
          <h2 className="text-xl font-bold text-white mb-6">Member Growth (Last 30 Days)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.member_growth}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis
                dataKey="date"
                stroke="rgba(255,255,255,0.6)"
                style={{ fontSize: '12px' }}
              />
              <YAxis stroke="rgba(255,255,255,0.6)" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a2e',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Members"
                dot={{ fill: '#3b82f6' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Rating Distribution */}
      {analytics.rating_distribution && analytics.rating_distribution.length > 0 && (
        <div className="glass-card p-6">
          <h2 className="text-xl font-bold text-white mb-6">Member Rating Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.rating_distribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis
                dataKey="range"
                stroke="rgba(255,255,255,0.6)"
                style={{ fontSize: '12px' }}
              />
              <YAxis stroke="rgba(255,255,255,0.6)" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a2e',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Legend />
              <Bar
                dataKey="count"
                fill="#8b5cf6"
                name="Members"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Role Distribution */}
      {analytics.role_distribution && analytics.role_distribution.length > 0 && (
        <div className="glass-card p-6">
          <h2 className="text-xl font-bold text-white mb-6">Role Distribution</h2>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.role_distribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.role}: ${entry.count}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {analytics.role_distribution.map((_entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a2e',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Monthly Revenue */}
      {analytics.revenue_stats?.monthly_breakdown && analytics.revenue_stats.monthly_breakdown.length > 0 && (
        <div className="glass-card p-6">
          <h2 className="text-xl font-bold text-white mb-6">Monthly Revenue</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.revenue_stats.monthly_breakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis
                dataKey="month"
                stroke="rgba(255,255,255,0.6)"
                style={{ fontSize: '12px' }}
              />
              <YAxis stroke="rgba(255,255,255,0.6)" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a2e',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Legend />
              <Bar
                dataKey="revenue"
                fill="#10b981"
                name="Revenue"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Messaging Activity */}
      {analytics.messaging_activity?.total_messages > 0 && (
        <div className="glass-card p-6">
          <h2 className="text-xl font-bold text-white mb-6">Messaging Activity</h2>
          <div className="flex items-center gap-3 mb-4">
            <MessageSquare className="w-5 h-5 text-blue-400" />
            <div>
              <p className="text-2xl font-bold text-white">{analytics.messaging_activity.total_messages}</p>
              <p className="text-sm text-white/60">Total Messages</p>
            </div>
          </div>
          {analytics.messaging_activity.daily_messages && analytics.messaging_activity.daily_messages.length > 0 && (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={analytics.messaging_activity.daily_messages}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis
                  dataKey="date"
                  stroke="rgba(255,255,255,0.6)"
                  style={{ fontSize: '12px' }}
                />
                <YAxis stroke="rgba(255,255,255,0.6)" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a2e',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* Event Stats */}
      {analytics.event_stats && (
        <div className="glass-card p-6">
          <h2 className="text-xl font-bold text-white mb-6">Event Statistics</h2>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-white/60 text-sm mb-1">Total Events</p>
              <p className="text-2xl font-bold text-white">{analytics.event_stats.total_events || 0}</p>
            </div>
            <div>
              <p className="text-white/60 text-sm mb-1">Upcoming</p>
              <p className="text-2xl font-bold text-blue-400">{analytics.event_stats.upcoming_events || 0}</p>
            </div>
            <div>
              <p className="text-white/60 text-sm mb-1">Past Events</p>
              <p className="text-2xl font-bold text-gray-400">{analytics.event_stats.past_events || 0}</p>
            </div>
          </div>
        </div>
      )}

      {/* Review Stats */}
      {analytics.review_stats && analytics.review_stats.total_reviews > 0 && (
        <div className="glass-card p-6">
          <h2 className="text-xl font-bold text-white mb-6">Review Statistics</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
              <span className="text-white/80">Average Rating</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-yellow-400">
                  {analytics.review_stats.average_rating.toFixed(1)}
                </span>
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
              <span className="text-white/80">Total Reviews</span>
              <span className="text-xl font-semibold text-white">{analytics.review_stats.total_reviews}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
