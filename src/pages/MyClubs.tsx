import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, MapPin, Calendar, Crown, Shield, Award, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { clubsApi } from '../api/clubs';

interface Membership {
  id: number;
  club_id: number;
  club_name: string;
  club_image?: string;
  club_city?: string;
  club_country?: string;
  member_count: number;
  role: string;
  status: string;
  joined_at: string;
  membership_type?: string;
}

const MyClubs = () => {
  const navigate = useNavigate();
  const { user, openAuthModal } = useStore();
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      openAuthModal('login');
      return;
    }

    fetchMemberships();
  }, [user]);

  const fetchMemberships = async () => {
    try {
      setLoading(true);
      const response = await clubsApi.getMyMemberships();
      setMemberships(response.data || []);
    } catch (error) {
      console.error('Failed to fetch memberships:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-4 h-4 text-gold-400" />;
      case 'admin':
        return <Shield className="w-4 h-4 text-blue-400" />;
      case 'officer':
        return <Award className="w-4 h-4 text-purple-400" />;
      default:
        return <Users className="w-4 h-4 text-white/40" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-gold-500/20 text-gold-400 border-gold-500/30';
      case 'admin':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'officer':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default:
        return 'bg-white/5 text-white/60 border-white/10';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'banned':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-white/5 text-white/60 border-white/10';
    }
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="inline-block w-12 h-12 border-4 border-gold-400/30 border-t-gold-400 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 md:px-8 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-display font-bold text-white mb-2">My Clubs</h1>
        <p className="text-white/60">Manage your club memberships and activities</p>
      </motion.div>

      {memberships.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <Users className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Club Memberships</h3>
          <p className="text-white/50 mb-6">You haven't joined any clubs yet</p>
          <button
            onClick={() => navigate('/clubs')}
            className="px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-chess-darker font-semibold rounded-xl hover:from-gold-400 hover:to-gold-500 transition-all"
          >
            Browse Clubs
          </button>
        </motion.div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {memberships.map((membership, index) => (
            <motion.div
              key={membership.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:bg-white/10 transition-all group cursor-pointer"
              onClick={() => navigate(`/clubs/${membership.club_id}`)}
            >
              {/* Club Image */}
              <div className="relative h-40 overflow-hidden">
                <img
                  src={membership.club_image || '/default-club-image.jpg'}
                  alt={membership.club_name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-chess-darker via-transparent to-transparent" />

                {/* Status Badge */}
                <div className="absolute top-3 right-3">
                  <span className={`px-2 py-1 rounded-full text-xs border ${getStatusBadgeColor(membership.status)}`}>
                    {membership.status}
                  </span>
                </div>

                {/* Role Badge */}
                <div className="absolute bottom-3 left-3">
                  <span className={`px-2 py-1 rounded-full text-xs border flex items-center gap-1 ${getRoleBadgeColor(membership.role)}`}>
                    {getRoleIcon(membership.role)}
                    {membership.role}
                  </span>
                </div>
              </div>

              {/* Club Info */}
              <div className="p-5">
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-gold-400 transition-colors">
                  {membership.club_name}
                </h3>

                <div className="space-y-2 mb-4">
                  {(membership.club_city || membership.club_country) && (
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <MapPin className="w-4 h-4" />
                      <span>
                        {membership.club_city}
                        {membership.club_country && `, ${membership.club_country}`}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <Users className="w-4 h-4" />
                    <span>{membership.member_count || 0} members</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {new Date(membership.joined_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <button
                  className="w-full py-2 bg-white/5 border border-white/10 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2 group-hover:border-gold-500/50"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/clubs/${membership.club_id}`);
                  }}
                >
                  View Club
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {memberships.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 grid md:grid-cols-4 gap-4"
        >
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-2xl font-bold text-white mb-1">
              {memberships.length}
            </div>
            <div className="text-sm text-white/60">Total Clubs</div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-2xl font-bold text-white mb-1">
              {memberships.filter(m => m.status === 'active').length}
            </div>
            <div className="text-sm text-white/60">Active Memberships</div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-2xl font-bold text-gold-400 mb-1">
              {memberships.filter(m => m.role === 'owner').length}
            </div>
            <div className="text-sm text-white/60">Owned Clubs</div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-2xl font-bold text-blue-400 mb-1">
              {memberships.filter(m => m.role === 'admin' || m.role === 'owner').length}
            </div>
            <div className="text-sm text-white/60">Admin Roles</div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default MyClubs;
