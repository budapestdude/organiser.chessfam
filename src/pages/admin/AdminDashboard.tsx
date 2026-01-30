import { useEffect, useState } from 'react';
import { Users, MapPin, Award, CreditCard, DollarSign, Calendar, ShieldCheck, Trophy } from 'lucide-react';
import StatsCard from '../../components/admin/StatsCard';
import * as adminApi from '../../api/admin';

interface DashboardStats {
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

interface Activity {
  id: number;
  type: string;
  description: string;
  userId: number;
  userName: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, activityRes] = await Promise.all([
          adminApi.getDashboardStats(),
          adminApi.getRecentActivity(10),
        ]);
        setStats(statsRes.data);
        setActivity(activityRes.data.activity || []);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const formatCurrency = (cents: number) => `$${(cents / 100).toLocaleString()}`;

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'new_user':
        return <Users className="w-4 h-4 text-blue-400" />;
      case 'venue_submission':
        return <MapPin className="w-4 h-4 text-green-400" />;
      case 'master_application':
        return <Award className="w-4 h-4 text-yellow-400" />;
      case 'payment':
        return <CreditCard className="w-4 h-4 text-purple-400" />;
      default:
        return <Calendar className="w-4 h-4 text-white/40" />;
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-8">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          icon={Users}
          color="blue"
        />
        <StatsCard
          title="New Today"
          value={stats?.newUsersToday || 0}
          icon={Calendar}
          color="green"
        />
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(stats?.totalRevenue || 0)}
          icon={DollarSign}
          color="purple"
        />
        <StatsCard
          title="Payments"
          value={stats?.totalPayments || 0}
          icon={CreditCard}
          color="yellow"
        />
      </div>

      {/* Pending Items & Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <h3 className="text-white font-medium mb-4">Pending Approvals</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-green-400" />
                <span className="text-white/80">Venues</span>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm ${
                (stats?.pendingVenues || 0) > 0 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/10 text-white/40'
              }`}>
                {stats?.pendingVenues || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Award className="w-5 h-5 text-yellow-400" />
                <span className="text-white/80">Master Applications</span>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm ${
                (stats?.pendingMasterApplications || 0) > 0 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/10 text-white/40'
              }`}>
                {stats?.pendingMasterApplications || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-purple-400" />
                <span className="text-white/80">Ownership Claims</span>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm ${
                (stats?.pendingOwnershipClaims || 0) > 0 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/10 text-white/40'
              }`}>
                {stats?.pendingOwnershipClaims || 0}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <h3 className="text-white font-medium mb-4">Content Stats</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-green-400" />
                <span className="text-white/80">Total Venues</span>
              </div>
              <span className="text-white font-medium">{stats?.totalVenues || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <span className="text-white/80">Tournaments</span>
              </div>
              <span className="text-white font-medium">{stats?.totalTournaments || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-blue-400" />
                <span className="text-white/80">Clubs</span>
              </div>
              <span className="text-white font-medium">{stats?.totalClubs || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <h3 className="text-white font-medium mb-4">Masters</h3>
          <div className="flex flex-col items-center justify-center h-[120px]">
            <div className="text-4xl font-bold text-white">{stats?.totalMasters || 0}</div>
            <p className="text-white/60 text-sm mt-2">Active Masters</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10">
          <h3 className="text-white font-medium">Recent Activity</h3>
        </div>
        <div className="divide-y divide-white/5">
          {activity.length === 0 ? (
            <div className="px-6 py-8 text-center text-white/40">No recent activity</div>
          ) : (
            activity.map((item) => (
              <div key={`${item.type}-${item.id}`} className="px-6 py-4 flex items-center gap-4">
                <div className="p-2 rounded-lg bg-white/5">
                  {getActivityIcon(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white/80 text-sm truncate">{item.description}</p>
                  <p className="text-white/40 text-xs">
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
