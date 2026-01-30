import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Award, TrendingUp, Loader2, Crown } from 'lucide-react';
import api from '../api/client';
import Avatar from './Avatar';
import { useStore } from '../store';

interface LeaderboardEntry {
  id: number;
  name: string;
  avatar?: string;
  score: number;
  level?: number;
  xp?: number;
  rank: number;
}

interface LeaderboardProps {
  type?: 'xp' | 'level' | 'games_played' | 'streak' | 'reviews' | 'rating';
  limit?: number;
  showUserRank?: boolean;
}

const Leaderboard = ({ type = 'xp', limit = 100, showUserRank = true }: LeaderboardProps) => {
  const { user } = useStore();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboard();
    if (user && showUserRank) {
      fetchUserRank();
    }
  }, [type, limit, user]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get('/leaderboards', {
        params: { type, limit, period: 'all_time' },
      });
      setEntries(response.data.data.leaderboard || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRank = async () => {
    try {
      const response = await api.get('/leaderboards/rank', {
        params: { type },
      });
      setUserRank(response.data.data.rank);
    } catch (err: any) {
      console.error('Failed to fetch user rank:', err);
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case 'xp':
        return 'Experience Points';
      case 'level':
        return 'Level';
      case 'games_played':
        return 'Games Played';
      case 'streak':
        return 'Check-in Streak';
      case 'reviews':
        return 'Reviews Given';
      case 'rating':
        return 'Chess Rating';
      default:
        return 'Leaderboard';
    }
  };

  const getScoreLabel = (score: number) => {
    switch (type) {
      case 'xp':
        return `${score.toLocaleString()} XP`;
      case 'level':
        return `Level ${score}`;
      case 'games_played':
        return `${score} games`;
      case 'streak':
        return `${score} days`;
      case 'reviews':
        return `${score} reviews`;
      case 'rating':
        return score.toString();
      default:
        return score.toString();
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-400" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />;
      default:
        return null;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400/20 to-amber-500/20 border-yellow-400/30';
      case 2:
        return 'bg-gradient-to-r from-gray-300/20 to-gray-400/20 border-gray-400/30';
      case 3:
        return 'bg-gradient-to-r from-amber-500/20 to-amber-700/20 border-amber-600/30';
      default:
        return 'bg-white/5 border-white/10';
    }
  };

  if (loading) {
    return (
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Trophy className="w-6 h-6 text-yellow-400" />
          <div>
            <h3 className="text-xl font-semibold text-white">{getTypeLabel()}</h3>
            {user && userRank && (
              <p className="text-sm text-white/50">
                Your rank: <span className="text-blue-400 font-medium">#{userRank}</span>
              </p>
            )}
          </div>
        </div>

        <Award className="w-8 h-8 text-white/20" />
      </div>

      {/* Leaderboard */}
      <div className="space-y-2">
        {entries.map((entry, index) => {
          const isUser = user?.id === entry.id;

          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${
                isUser
                  ? 'bg-blue-500/20 border-blue-500/30 ring-2 ring-blue-500/50'
                  : getRankColor(entry.rank)
              }`}
            >
              {/* Rank */}
              <div className="flex items-center justify-center w-12 text-center">
                {getRankIcon(entry.rank) || (
                  <span className="text-lg font-bold text-white/70">#{entry.rank}</span>
                )}
              </div>

              {/* Avatar */}
              <Avatar src={entry.avatar} size="md" />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-white truncate">{entry.name}</p>
                  {isUser && (
                    <span className="px-2 py-0.5 bg-blue-500/30 text-blue-300 text-xs rounded-full">
                      You
                    </span>
                  )}
                </div>
                {entry.level !== undefined && type === 'xp' && (
                  <p className="text-sm text-white/50">Level {entry.level}</p>
                )}
              </div>

              {/* Score */}
              <div className="text-right">
                <div className="text-lg font-bold text-white">{getScoreLabel(entry.score)}</div>
                {type === 'level' && entry.xp !== undefined && (
                  <p className="text-xs text-white/50">{entry.xp.toLocaleString()} XP</p>
                )}
              </div>

              {/* Trend indicator for top 10 */}
              {entry.rank <= 10 && (
                <div className="ml-2">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {entries.length === 0 && (
        <div className="text-center py-12">
          <Trophy className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/50">No entries yet</p>
          <p className="text-sm text-white/40">Be the first to climb the ranks!</p>
        </div>
      )}

      {/* Footer */}
      {entries.length > 0 && (
        <div className="mt-6 pt-4 border-t border-white/10">
          <p className="text-center text-sm text-white/50">
            Showing top {entries.length} players
          </p>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
