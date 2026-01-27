import { useEffect, useState } from 'react';
import { useStore } from '../../store';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { Trophy, Building2, Users, Euro, TrendingUp, Calendar, Filter } from 'lucide-react';

export default function AnalyticsDashboard() {
  const { dashboardData, tournaments, clubs, fetchDashboard, fetchTournaments, fetchClubs } = useStore();
  const [loading, setLoading] = useState(true);
  const [eventTypeFilter, setEventTypeFilter] = useState<'all' | 'tournaments' | 'clubs'>('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([fetchDashboard(), fetchTournaments(), fetchClubs()]);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [fetchDashboard, fetchTournaments, fetchClubs]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  // Calculate event distribution
  const eventDistribution = [
    { name: 'Tournaments', value: tournaments.length, color: '#fbbf24' },
    { name: 'Clubs', value: clubs.length, color: '#3b82f6' },
  ];

  // Calculate revenue distribution
  const revenueDistribution = [
    {
      name: 'Tournament Revenue',
      value: dashboardData?.tournaments.total_revenue || 0,
      color: '#fbbf24',
    },
    {
      name: 'Club Revenue',
      value: dashboardData?.clubs.total_revenue || 0,
      color: '#3b82f6',
    },
  ];

  // Calculate participant distribution
  const participantDistribution = [
    {
      name: 'Tournament Participants',
      value: dashboardData?.tournaments.total_participants || 0,
      color: '#fbbf24',
    },
    {
      name: 'Club Members',
      value: dashboardData?.clubs.total_members || 0,
      color: '#3b82f6',
    },
  ];

  // Tournament status breakdown
  const tournamentStatusData = [
    { status: 'Upcoming', count: dashboardData?.tournaments.upcoming || 0, color: '#3b82f6' },
    { status: 'Ongoing', count: dashboardData?.tournaments.ongoing || 0, color: '#10b981' },
    { status: 'Completed', count: dashboardData?.tournaments.completed || 0, color: '#6b7280' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="w-12 h-12 border-4 border-gold-400/30 border-t-gold-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h1>
          <p className="text-white/60">Cross-event insights and performance metrics</p>
        </div>
      </div>

      {/* Filter */}
      <div className="glass-card p-6 mb-6">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gold-400" />
          <span className="text-white font-medium">Event Type:</span>
          <select
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value as 'all' | 'tournaments' | 'clubs')}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-gold-400 focus:outline-none transition-colors"
          >
            <option value="all">All Events</option>
            <option value="tournaments">Tournaments Only</option>
            <option value="clubs">Clubs Only</option>
          </select>
        </div>
      </div>

      {!dashboardData ? (
        <div className="glass-card p-12 text-center">
          <h3 className="text-xl font-semibold text-white mb-2">No analytics data available</h3>
          <p className="text-white/60">Analytics will appear once you have events and activity.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gold-500/20 rounded-lg">
                  <Trophy className="w-5 h-5 text-gold-400" />
                </div>
                <p className="text-white/60 text-sm">Total Events</p>
              </div>
              <p className="text-3xl font-bold text-white">
                {(dashboardData.tournaments.total || 0) + (dashboardData.clubs.total || 0)}
              </p>
              <p className="text-sm text-white/40 mt-1">
                {dashboardData.tournaments.total} tournaments, {dashboardData.clubs.total} clubs
              </p>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Euro className="w-5 h-5 text-green-400" />
                </div>
                <p className="text-white/60 text-sm">Total Revenue</p>
              </div>
              <p className="text-3xl font-bold text-white">
                {formatCurrency((dashboardData.tournaments.total_revenue || 0) + (dashboardData.clubs.total_revenue || 0))}
              </p>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <p className="text-white/60 text-sm">Total Participants</p>
              </div>
              <p className="text-3xl font-bold text-white">
                {(dashboardData.tournaments.total_participants || 0) + (dashboardData.clubs.total_members || 0)}
              </p>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                </div>
                <p className="text-white/60 text-sm">Active Events</p>
              </div>
              <p className="text-3xl font-bold text-white">
                {(dashboardData.tournaments.upcoming || 0) + (dashboardData.tournaments.ongoing || 0)}
              </p>
            </div>
          </div>

          {/* Event Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-6">
              <h2 className="text-xl font-bold text-white mb-6">Event Distribution</h2>
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={eventDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {eventDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
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

            <div className="glass-card p-6">
              <h2 className="text-xl font-bold text-white mb-6">Revenue Distribution</h2>
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={revenueDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${formatCurrency(entry.value)}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {revenueDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1a1a2e',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        color: '#fff',
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Tournament Status Breakdown */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-white mb-6">Tournament Status Breakdown</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={tournamentStatusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis
                  dataKey="status"
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
                  name="Tournaments"
                  radius={[8, 8, 0, 0]}
                >
                  {tournamentStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Participant Distribution */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-white mb-6">Participant Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={participantDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis
                  dataKey="name"
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
                <Bar dataKey="value" name="Count" radius={[8, 8, 0, 0]}>
                  {participantDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Recent Activity */}
          {dashboardData.recent_activity && dashboardData.recent_activity.length > 0 && (
            <div className="glass-card p-6">
              <h2 className="text-xl font-bold text-white mb-6">Recent Activity</h2>
              <div className="space-y-4">
                {dashboardData.recent_activity.slice(0, 10).map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        activity.type === 'tournament_registration' ? 'bg-gold-500/20' :
                        activity.type === 'club_join' ? 'bg-blue-500/20' :
                        activity.type === 'payment' ? 'bg-green-500/20' :
                        'bg-red-500/20'
                      }`}>
                        {activity.type === 'tournament_registration' && <Trophy className="w-4 h-4 text-gold-400" />}
                        {activity.type === 'club_join' && <Building2 className="w-4 h-4 text-blue-400" />}
                        {activity.type === 'payment' && <Euro className="w-4 h-4 text-green-400" />}
                        {activity.type === 'refund' && <Euro className="w-4 h-4 text-red-400" />}
                      </div>
                      <div>
                        <p className="text-white font-medium">{activity.title}</p>
                        <p className="text-sm text-white/60">
                          {new Date(activity.timestamp).toLocaleDateString('en-IE', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    {activity.amount && (
                      <span className={`font-semibold ${
                        activity.type === 'refund' ? 'text-red-400' : 'text-green-400'
                      }`}>
                        {activity.type === 'refund' ? '-' : '+'}{formatCurrency(activity.amount)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Events */}
          {dashboardData.upcoming_events && dashboardData.upcoming_events.length > 0 && (
            <div className="glass-card p-6">
              <h2 className="text-xl font-bold text-white mb-6">Upcoming Events</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dashboardData.upcoming_events.map((event) => (
                  <div
                    key={`${event.type}-${event.id}`}
                    className="p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {event.type === 'tournament' ? (
                          <Trophy className="w-5 h-5 text-gold-400" />
                        ) : (
                          <Building2 className="w-5 h-5 text-blue-400" />
                        )}
                        <h3 className="text-white font-semibold">{event.name}</h3>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        event.type === 'tournament'
                          ? 'bg-gold-500/20 text-gold-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {event.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-white/60">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(event.date).toLocaleDateString('en-IE', { month: 'short', day: 'numeric' })}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{event.participants} participants</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
