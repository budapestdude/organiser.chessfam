import { useEffect } from 'react';
import { useStore } from '../store';
import { Trophy, Euro, Users, Calendar, Clock, TrendingUp, Building2 } from 'lucide-react';
import StatsCard from '../components/common/StatsCard';
import { format } from 'date-fns';

export default function Dashboard() {
  const { user, fetchDashboard, dashboardData, dashboardLoading } = useStore();

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (dashboardLoading && !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-gold-400/30 border-t-gold-400 rounded-full animate-spin" />
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Welcome back, {user?.name || 'Organizer'}!
        </h1>
        <p className="text-white/60">
          Manage your tournaments and clubs from your organizer dashboard
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Tournaments"
          value={dashboardData?.tournaments.total || 0}
          icon={Trophy}
          color="purple"
        />
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(
            (dashboardData?.tournaments.total_revenue || 0) +
            (dashboardData?.clubs.total_revenue || 0)
          )}
          icon={Euro}
          color="gold"
        />
        <StatsCard
          title="Total Participants"
          value={
            (dashboardData?.tournaments.total_participants || 0) +
            (dashboardData?.clubs.total_members || 0)
          }
          icon={Users}
          color="blue"
        />
        <StatsCard
          title="Active Events"
          value={
            (dashboardData?.tournaments.upcoming || 0) +
            (dashboardData?.tournaments.ongoing || 0) +
            (dashboardData?.clubs.active_events || 0)
          }
          icon={Calendar}
          color="green"
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-gold-400" />
            Recent Activity
          </h2>
          <div className="space-y-3">
            {dashboardData?.recent_activity && dashboardData.recent_activity.length > 0 ? (
              dashboardData.recent_activity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-white/5 rounded-lg border border-white/10"
                >
                  <div className={`w-2 h-2 mt-2 rounded-full ${
                    activity.type === 'payment' ? 'bg-green-400' :
                    activity.type === 'tournament_registration' ? 'bg-blue-400' :
                    activity.type === 'club_join' ? 'bg-purple-400' :
                    'bg-red-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{activity.title}</p>
                    <p className="text-xs text-white/50 mt-1">
                      {format(new Date(activity.timestamp), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                  {activity.amount && (
                    <span className="text-sm font-medium text-green-400">
                      {formatCurrency(activity.amount)}
                    </span>
                  )}
                </div>
              ))
            ) : (
              <p className="text-white/40 text-sm text-center py-8">
                No recent activity
              </p>
            )}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-gold-400" />
            Upcoming Events
          </h2>
          <div className="space-y-3">
            {dashboardData?.upcoming_events && dashboardData.upcoming_events.length > 0 ? (
              dashboardData.upcoming_events.map((event) => (
                <div
                  key={`${event.type}-${event.id}`}
                  className="flex items-start gap-3 p-3 bg-white/5 rounded-lg border border-white/10"
                >
                  <div className={`p-2 rounded-lg ${
                    event.type === 'tournament' ? 'bg-purple-500/20' : 'bg-blue-500/20'
                  }`}>
                    {event.type === 'tournament' ? (
                      <Trophy className="w-4 h-4 text-purple-400" />
                    ) : (
                      <Building2 className="w-4 h-4 text-blue-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{event.name}</p>
                    <p className="text-xs text-white/50 mt-1">
                      {format(new Date(event.date), 'EEEE, MMM d, yyyy')}
                    </p>
                    {event.participants > 0 && (
                      <p className="text-xs text-white/40 mt-1">
                        {event.participants} participant{event.participants !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-white/40 text-sm text-center py-8">
                No upcoming events in the next 7 days
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Tournament & Club Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Tournaments Breakdown */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-bold text-white mb-4">Tournaments</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-white/60">Upcoming</span>
              <span className="text-lg font-semibold text-white">
                {dashboardData?.tournaments.upcoming || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60">Ongoing</span>
              <span className="text-lg font-semibold text-white">
                {dashboardData?.tournaments.ongoing || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60">Completed</span>
              <span className="text-lg font-semibold text-white">
                {dashboardData?.tournaments.completed || 0}
              </span>
            </div>
            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-white/80 font-medium">Total Revenue</span>
              <span className="text-lg font-bold text-gold-400">
                {formatCurrency(dashboardData?.tournaments.total_revenue || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Clubs Breakdown */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-bold text-white mb-4">Clubs</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-white/60">Total Clubs</span>
              <span className="text-lg font-semibold text-white">
                {dashboardData?.clubs.total || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60">Total Members</span>
              <span className="text-lg font-semibold text-white">
                {dashboardData?.clubs.total_members || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60">Active Events</span>
              <span className="text-lg font-semibold text-white">
                {dashboardData?.clubs.active_events || 0}
              </span>
            </div>
            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-white/80 font-medium">Total Revenue</span>
              <span className="text-lg font-bold text-gold-400">
                {formatCurrency(dashboardData?.clubs.total_revenue || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
