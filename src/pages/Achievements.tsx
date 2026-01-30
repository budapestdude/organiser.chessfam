import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, MapPin, Building, Gamepad2, Users, GraduationCap, Flame, Star, Lock,
  Trophy, Award, Crown, Loader2, CheckCircle
} from 'lucide-react';
import { useStore } from '../store';
import { achievementsApi } from '../api/achievements';

interface Achievement {
  id: number;
  achievement_key: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  requirement_value: number;
  progress: number | null;
  unlocked_at: string | null;
  unlocked: boolean;
}

interface UserStats {
  total_checkins: number;
  unique_venues_visited: number;
  total_games_created: number;
  total_games_joined: number;
  total_bookings_made: number;
  unique_players_met: number;
  consecutive_checkin_days: number;
  unlocked_achievements: number;
}

const TIER_COLORS = {
  bronze: 'from-amber-700/30 to-amber-600/30 border-amber-600/50',
  silver: 'from-gray-400/30 to-gray-300/30 border-gray-400/50',
  gold: 'from-yellow-500/30 to-yellow-400/30 border-yellow-500/50',
  platinum: 'from-cyan-400/30 to-purple-400/30 border-cyan-400/50',
};

const TIER_TEXT_COLORS = {
  bronze: 'text-amber-600',
  silver: 'text-gray-400',
  gold: 'text-yellow-400',
  platinum: 'text-cyan-400',
};

const TIER_GLOW = {
  bronze: '',
  silver: '',
  gold: 'shadow-yellow-500/20',
  platinum: 'shadow-cyan-400/20',
};

const ICON_MAP: Record<string, typeof Trophy> = {
  MapPin,
  Building,
  Gamepad2,
  Users,
  GraduationCap,
  Flame,
  Trophy,
  Award,
  Crown,
  Star,
};

const CATEGORY_LABELS: Record<string, string> = {
  checkin: 'Check-ins',
  exploration: 'Exploration',
  games: 'Games',
  social: 'Social',
  learning: 'Learning',
  streak: 'Streaks',
};

const Achievements = () => {
  const navigate = useNavigate();
  const { user, openAuthModal } = useStore();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [achievementsRes, statsRes] = await Promise.all([
          achievementsApi.getUserAchievements(),
          achievementsApi.getUserStats()
        ]);
        setAchievements(achievementsRes.data || []);
        setStats(statsRes.data || null);
      } catch (err) {
        console.error('Failed to fetch achievements:', err);
        setError('Failed to load achievements');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const categories = useMemo(() => {
    const cats = new Set(achievements.map(a => a.category));
    return ['all', ...Array.from(cats)];
  }, [achievements]);

  const filteredAchievements = useMemo(() => {
    if (selectedCategory === 'all') return achievements;
    return achievements.filter(a => a.category === selectedCategory);
  }, [achievements, selectedCategory]);

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;
  const progressPercent = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;

  if (!user) {
    return (
      <div className="min-h-screen py-8 px-4 md:px-8 max-w-4xl mx-auto flex flex-col items-center justify-center">
        <Trophy className="w-16 h-16 text-white/20 mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Sign in to view achievements</h2>
        <p className="text-white/50 mb-6">Track your chess journey and unlock achievements</p>
        <button
          onClick={() => openAuthModal('login')}
          className="px-6 py-3 bg-gold-500 text-chess-darker font-semibold rounded-xl hover:bg-gold-400 transition-colors"
        >
          Sign In
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen py-8 px-4 md:px-8 max-w-4xl mx-auto flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-gold-500 animate-spin mb-4" />
        <p className="text-white/50">Loading achievements...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 md:px-8 lg:px-16 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Profile
        </button>
        <h1 className="text-2xl font-display font-bold text-white">Achievements</h1>
        <div className="w-16" />
      </motion.div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400">
          {error}
        </div>
      )}

      {/* Stats Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-gradient-to-br from-gold-500/20 to-orange-500/20 border border-gold-500/30 rounded-2xl p-6 mb-8"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gold-500 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-chess-darker" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{unlockedCount} / {totalCount}</h2>
              <p className="text-white/60 text-sm">Achievements Unlocked</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gold-400">{progressPercent.toFixed(0)}%</p>
            <p className="text-white/60 text-sm">Complete</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-3 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="h-full bg-gradient-to-r from-gold-500 to-orange-400 rounded-full"
          />
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{stats.total_checkins}</p>
              <p className="text-xs text-white/50">Total Check-ins</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{stats.unique_venues_visited}</p>
              <p className="text-xs text-white/50">Venues Visited</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{stats.total_games_created + stats.total_games_joined}</p>
              <p className="text-xs text-white/50">Games Played</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{stats.consecutive_checkin_days}</p>
              <p className="text-xs text-white/50">Day Streak</p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Category Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap gap-2 mb-6"
      >
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === category
                ? 'bg-gold-500 text-chess-darker'
                : 'bg-white/5 text-white/70 hover:bg-white/10'
            }`}
          >
            {category === 'all' ? 'All' : CATEGORY_LABELS[category] || category}
          </button>
        ))}
      </motion.div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAchievements.map((achievement, index) => {
          const IconComponent = ICON_MAP[achievement.icon] || Trophy;
          const tierColor = TIER_COLORS[achievement.tier];
          const tierTextColor = TIER_TEXT_COLORS[achievement.tier];
          const tierGlow = TIER_GLOW[achievement.tier];
          const progressPercent = achievement.requirement_value > 0
            ? ((achievement.progress || 0) / achievement.requirement_value) * 100
            : 0;

          return (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className={`relative bg-gradient-to-br ${tierColor} border rounded-xl p-4 transition-all ${
                achievement.unlocked
                  ? `shadow-lg ${tierGlow}`
                  : 'opacity-60'
              }`}
            >
              {/* Tier Badge */}
              <div className={`absolute top-3 right-3 px-2 py-0.5 rounded text-xs font-bold uppercase ${tierTextColor}`}>
                {achievement.tier}
              </div>

              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  achievement.unlocked
                    ? 'bg-white/20'
                    : 'bg-white/5'
                }`}>
                  {achievement.unlocked ? (
                    <IconComponent className={`w-6 h-6 ${tierTextColor}`} />
                  ) : (
                    <Lock className="w-6 h-6 text-white/30" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className={`font-semibold ${achievement.unlocked ? 'text-white' : 'text-white/50'}`}>
                    {achievement.name}
                  </h3>
                  <p className="text-sm text-white/50 mb-2">
                    {achievement.description}
                  </p>

                  {/* Progress */}
                  {!achievement.unlocked && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-white/40 mb-1">
                        <span>Progress</span>
                        <span>{achievement.progress || 0} / {achievement.requirement_value}</span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r from-${achievement.tier === 'gold' ? 'yellow' : achievement.tier === 'platinum' ? 'cyan' : 'amber'}-500 to-white/50 rounded-full transition-all`}
                          style={{ width: `${Math.min(progressPercent, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Unlocked indicator */}
                  {achievement.unlocked && (
                    <div className="flex items-center gap-1 mt-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-xs text-green-400">
                        Unlocked {new Date(achievement.unlocked_at!).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filteredAchievements.length === 0 && (
        <div className="text-center py-12">
          <Trophy className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/50">No achievements in this category</p>
        </div>
      )}
    </div>
  );
};

export default Achievements;
