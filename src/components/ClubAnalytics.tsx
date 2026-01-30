import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Calendar, MessageCircle, Award, UserPlus, Activity, DollarSign } from 'lucide-react';
import { clubAnalyticsApi, type ClubAnalytics, type MemberDetail } from '../api/clubAnalytics';

interface ClubAnalyticsProps {
  clubId: number;
  canViewAnalytics: boolean; // owners and admins
}

const ClubAnalyticsDashboard = ({ clubId, canViewAnalytics }: ClubAnalyticsProps) => {
  const [analytics, setAnalytics] = useState<ClubAnalytics | null>(null);
  const [memberDetails, setMemberDetails] = useState<MemberDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'new'>('all');

  useEffect(() => {
    if (canViewAnalytics) {
      fetchAnalytics();
      fetchMemberDetails();
    }
  }, [clubId, canViewAnalytics]);

  const fetchAnalytics = async () => {
    try {
      const response = await clubAnalyticsApi.getAnalytics(clubId);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  };

  const fetchMemberDetails = async () => {
    try {
      setLoading(true);
      const response = await clubAnalyticsApi.getMemberDetails(clubId, { page: 1, limit: 100 });
      setMemberDetails(response.data.members || response.data || []);
    } catch (error) {
      console.error('Failed to fetch member details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!canViewAnalytics) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
        <Award className="w-12 h-12 text-white/20 mx-auto mb-3" />
        <p className="text-white/50">Only club owners and admins can view analytics</p>
      </div>
    );
  }

  if (loading || !analytics) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="inline-block w-8 h-8 border-4 border-gold-400/30 border-t-gold-400 rounded-full animate-spin"></div>
      </div>
    );
  }

  const filteredMembers = memberDetails.filter((member) => {
    if (selectedFilter === 'active') {
      return member.last_active && new Date(member.last_active) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }
    if (selectedFilter === 'new') {
      return new Date(member.joined_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-gold-400" />
          Club Analytics
        </h3>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Members */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-xl p-5"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">{analytics.total_members}</div>
              <div className="text-xs text-blue-400">Total Members</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-white/60">{analytics.active_members} active</span>
            <span className="text-white/30">•</span>
            <span className={`flex items-center gap-1 ${analytics.member_growth_rate >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              <TrendingUp className="w-3 h-3" />
              {analytics.member_growth_rate.toFixed(1)}%
            </span>
          </div>
        </motion.div>

        {/* New Members This Month */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-xl p-5"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <UserPlus className="w-6 h-6 text-green-400" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">{analytics.new_members_this_month}</div>
              <div className="text-xs text-green-400">New This Month</div>
            </div>
          </div>
          <div className="text-sm text-white/60">
            Growing membership base
          </div>
        </motion.div>

        {/* Events */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-xl p-5"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <Calendar className="w-6 h-6 text-purple-400" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">{analytics.upcoming_events}</div>
              <div className="text-xs text-purple-400">Upcoming Events</div>
            </div>
          </div>
          <div className="text-sm text-white/60">
            {analytics.total_events} total events
          </div>
        </motion.div>

        {/* Messages */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-gold-500/10 to-gold-600/5 border border-gold-500/20 rounded-xl p-5"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="p-3 bg-gold-500/20 rounded-lg">
              <MessageCircle className="w-6 h-6 text-gold-400" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">{analytics.messages_this_month}</div>
              <div className="text-xs text-gold-400">Messages This Month</div>
            </div>
          </div>
          <div className="text-sm text-white/60">
            {analytics.total_messages} total messages
          </div>
        </motion.div>
      </div>

      {/* Role Distribution & Membership Types */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Role Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/5 border border-white/10 rounded-xl p-6"
        >
          <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-gold-400" />
            Role Distribution
          </h4>
          <div className="space-y-3">
            <RoleBar label="Owner" count={analytics.role_distribution.owner} color="gold" />
            <RoleBar label="Admin" count={analytics.role_distribution.admin} color="blue" />
            <RoleBar label="Officer" count={analytics.role_distribution.officer} color="purple" />
            <RoleBar label="Member" count={analytics.role_distribution.member} color="gray" />
          </div>
        </motion.div>

        {/* Membership Types */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/5 border border-white/10 rounded-xl p-6"
        >
          <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-400" />
            Membership Types
          </h4>
          <div className="space-y-3">
            <MembershipBar label="Monthly" count={analytics.membership_by_type.monthly} color="green" />
            <MembershipBar label="Yearly" count={analytics.membership_by_type.yearly} color="blue" />
            <MembershipBar label="Lifetime" count={analytics.membership_by_type.lifetime} color="gold" />
          </div>
        </motion.div>
      </div>

      {/* Member Details Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white/5 border border-white/10 rounded-xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" />
            Member Activity
          </h4>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                selectedFilter === 'all'
                  ? 'bg-white/20 text-white'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedFilter('active')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                selectedFilter === 'active'
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setSelectedFilter('new')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                selectedFilter === 'new'
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              New
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-sm font-medium text-white/60">Member</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-white/60">Role</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-white/60">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-white/60">Joined</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-white/60">Last Active</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.slice(0, 10).map((member) => (
                <tr key={member.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={member.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${member.name}`}
                        alt={member.name}
                        className="w-8 h-8 rounded-full"
                      />
                      <div>
                        <div className="text-white font-medium">{member.name}</div>
                        {member.rating && <div className="text-xs text-white/50">Rating: {member.rating}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 rounded-full text-xs bg-white/10 text-white/70 capitalize">
                      {member.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      member.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-white/70">
                    {new Date(member.joined_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-sm text-white/70">
                    {member.last_active ? new Date(member.last_active).toLocaleDateString() : 'Never'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredMembers.length > 10 && (
          <div className="mt-4 text-center text-sm text-white/50">
            Showing 10 of {filteredMembers.length} members
          </div>
        )}
      </motion.div>
    </div>
  );
};

// Role Bar Component
const RoleBar = ({ label, count, color }: { label: string; count: number; color: string }) => {
  const colors = {
    gold: 'bg-gold-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    gray: 'bg-white/20',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-white/70">{label}</span>
        <span className="text-sm font-medium text-white">{count}</span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full ${colors[color as keyof typeof colors]} transition-all`}
          style={{ width: `${Math.min((count / 100) * 100, 100)}%` }}
        />
      </div>
    </div>
  );
};

// Membership Bar Component
const MembershipBar = ({ label, count, color }: { label: string; count: number; color: string }) => {
  const colors = {
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    gold: 'bg-gold-500',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-white/70">{label}</span>
        <span className="text-sm font-medium text-white">{count}</span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full ${colors[color as keyof typeof colors]} transition-all`}
          style={{ width: `${Math.min((count / 100) * 100, 100)}%` }}
        />
      </div>
    </div>
  );
};

export default ClubAnalyticsDashboard;
