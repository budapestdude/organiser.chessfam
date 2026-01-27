import { useEffect, useState } from 'react';
import { tournamentsAPI } from '../../api/tournaments';
import type { TournamentAnalytics as TournamentAnalyticsType } from '../../types';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Euro, Users, RefreshCw } from 'lucide-react';

interface Props {
  tournamentId: number;
}

export default function TournamentAnalytics({ tournamentId }: Props) {
  const [analytics, setAnalytics] = useState<TournamentAnalyticsType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await tournamentsAPI.getTournamentAnalytics(tournamentId);
        setAnalytics(data);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [tournamentId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

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
        <p className="text-white/60">Analytics will appear once registrations start coming in.</p>
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
            <p className="text-white/60 text-sm">Total Registrations</p>
          </div>
          <p className="text-3xl font-bold text-white">{analytics.total_registrations}</p>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-2">
            <Euro className="w-5 h-5 text-green-400" />
            <p className="text-white/60 text-sm">Total Revenue</p>
          </div>
          <p className="text-3xl font-bold text-white">{formatCurrency(analytics.revenue.total)}</p>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-gold-400" />
            <p className="text-white/60 text-sm">Revenue Paid</p>
          </div>
          <p className="text-3xl font-bold text-white">{formatCurrency(analytics.revenue.paid)}</p>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-2">
            <RefreshCw className="w-5 h-5 text-red-400" />
            <p className="text-white/60 text-sm">Refunded</p>
          </div>
          <p className="text-3xl font-bold text-white">{formatCurrency(analytics.revenue.refunded)}</p>
        </div>
      </div>

      {/* Registration Trend */}
      {analytics.registrations_by_day.length > 0 && (
        <div className="glass-card p-6">
          <h2 className="text-xl font-bold text-white mb-6">Registration Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.registrations_by_day}>
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
                stroke="#f59e0b"
                strokeWidth={2}
                name="Registrations"
                dot={{ fill: '#f59e0b' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Rating Distribution */}
      {analytics.rating_distribution.length > 0 && (
        <div className="glass-card p-6">
          <h2 className="text-xl font-bold text-white mb-6">Rating Distribution</h2>
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
                name="Participants"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Geographic Distribution */}
      {analytics.geographic_distribution.length > 0 && (
        <div className="glass-card p-6">
          <h2 className="text-xl font-bold text-white mb-6">Geographic Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.geographic_distribution} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis type="number" stroke="rgba(255,255,255,0.6)" style={{ fontSize: '12px' }} />
              <YAxis dataKey="country" type="category" stroke="rgba(255,255,255,0.6)" style={{ fontSize: '12px' }} width={100} />
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
                fill="#3b82f6"
                name="Participants"
                radius={[0, 8, 8, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Refund Statistics */}
      {analytics.refund_requests.total > 0 && (
        <div className="glass-card p-6">
          <h2 className="text-xl font-bold text-white mb-6">Refund Statistics</h2>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-white/60 text-sm mb-1">Total Requests</p>
              <p className="text-2xl font-bold text-white">{analytics.refund_requests.total}</p>
            </div>
            <div>
              <p className="text-white/60 text-sm mb-1">Approved</p>
              <p className="text-2xl font-bold text-green-400">{analytics.refund_requests.approved}</p>
            </div>
            <div>
              <p className="text-white/60 text-sm mb-1">Amount Refunded</p>
              <p className="text-2xl font-bold text-red-400">{formatCurrency(analytics.refund_requests.amount_refunded)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Revenue Breakdown */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-bold text-white mb-6">Revenue Breakdown</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
            <span className="text-white/80">Paid</span>
            <span className="text-lg font-semibold text-green-400">{formatCurrency(analytics.revenue.paid)}</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
            <span className="text-white/80">Pending</span>
            <span className="text-lg font-semibold text-yellow-400">{formatCurrency(analytics.revenue.pending)}</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
            <span className="text-white/80">Refunded</span>
            <span className="text-lg font-semibold text-red-400">{formatCurrency(analytics.revenue.refunded)}</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-gold-500/10 border border-gold-500/20 rounded-lg">
            <span className="text-white font-medium">Net Revenue</span>
            <span className="text-xl font-bold text-gold-400">
              {formatCurrency(analytics.revenue.paid - analytics.revenue.refunded)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
