import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  History,
  Calendar,
  Trophy,
  TrendingUp,
  FileText,
  Star,
  Users,
  Clock,
  Loader2,
} from 'lucide-react';
import api from '../api/client';
import { useStore } from '../store';

interface GameStats {
  games_created: number;
  games_joined: number;
  games_completed: number;
  reviews_given: number;
  avg_game_quality: number;
  reviews_received: number;
  avg_opponent_rating: number;
  total_games_completed: number;
  total_pgns_uploaded: number;
  total_private_games: number;
  total_recurring_games: number;
  total_reviews_given: number;
  total_reviews_received: number;
  average_opponent_rating: number;
}

interface Game {
  id: number;
  venue_name: string;
  game_date: string;
  game_time: string;
  status: string;
  user_role: string;
  participant_count: number;
  max_players: number;
  creator_name: string;
  has_pgn: boolean;
  user_reviewed: boolean;
  time_control?: string;
  player_level?: string;
}

const GameHistoryPage = () => {
  const navigate = useNavigate();
  const { user } = useStore();
  const [games, setGames] = useState<Game[]>([]);
  const [stats, setStats] = useState<GameStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'completed' | 'cancelled' | 'open'>('all');

  useEffect(() => {
    if (user) {
      fetchGameHistory();
      fetchStats();
    }
  }, [user, filter]);

  const fetchGameHistory = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get('/game-history', {
        params: {
          status: filter === 'all' ? undefined : filter,
          limit: 50,
        },
      });
      setGames(response.data.data.games || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load game history');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/game-history/stats');
      setStats(response.data.data);
    } catch (err: any) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; text: string }> = {
      open: { color: 'bg-green-500/20 text-green-400', text: 'Upcoming' },
      full: { color: 'bg-yellow-500/20 text-yellow-400', text: 'Full' },
      cancelled: { color: 'bg-red-500/20 text-red-400', text: 'Cancelled' },
      completed: { color: 'bg-blue-500/20 text-blue-400', text: 'Completed' },
    };

    const badge = badges[status] || badges.open;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-white/70">Please log in to view your game history</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <History className="w-10 h-10 text-blue-400" />
            <div>
              <h1 className="text-4xl font-bold text-white">Game History</h1>
              <p className="text-white/60">View your past and upcoming games</p>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
          >
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-3 mb-2">
                <Trophy className="w-5 h-5 text-green-400" />
                <span className="text-sm text-white/60">Games Completed</span>
              </div>
              <div className="text-3xl font-bold text-white">{stats.games_completed}</div>
            </div>

            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-5 h-5 text-blue-400" />
                <span className="text-sm text-white/60">Games Created</span>
              </div>
              <div className="text-3xl font-bold text-white">{stats.games_created}</div>
            </div>

            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-3 mb-2">
                <Star className="w-5 h-5 text-yellow-400" />
                <span className="text-sm text-white/60">Reviews Given</span>
              </div>
              <div className="text-3xl font-bold text-white">{stats.reviews_given}</div>
              {stats.avg_game_quality > 0 && (
                <div className="text-xs text-white/50 mt-1">
                  Avg: {stats.avg_game_quality.toFixed(1)}/5
                </div>
              )}
            </div>

            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-3 mb-2">
                <FileText className="w-5 h-5 text-purple-400" />
                <span className="text-sm text-white/60">PGNs Uploaded</span>
              </div>
              <div className="text-3xl font-bold text-white">{stats.total_pgns_uploaded || 0}</div>
            </div>
          </motion.div>
        )}

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <div className="flex gap-2 flex-wrap">
            {['all', 'completed', 'open', 'cancelled'].map((filterType) => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType as any)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === filterType
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Games List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/5 rounded-2xl border border-white/10"
        >
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
            </div>
          ) : error ? (
            <div className="p-6 text-red-400">{error}</div>
          ) : games.length === 0 ? (
            <div className="text-center py-12">
              <History className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/50">No games found</p>
              <button
                onClick={() => navigate('/games')}
                className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Find Games
              </button>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {games.map((game, index) => (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => navigate(`/games/${game.id}`)}
                  className="p-4 hover:bg-white/5 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">
                          {game.venue_name}
                        </h3>
                        {getStatusBadge(game.status)}
                        {game.user_role === 'creator' && (
                          <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full">
                            Creator
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-white/70">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(game.game_date)}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{formatTime(game.game_time)}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>
                            {game.participant_count}/{game.max_players} players
                          </span>
                        </div>

                        {game.time_control && (
                          <div className="flex items-center gap-2">
                            <Trophy className="w-4 h-4" />
                            <span>{game.time_control}</span>
                          </div>
                        )}

                        {game.player_level && (
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            <span>{game.player_level}</span>
                          </div>
                        )}
                      </div>

                      {game.status === 'completed' && (
                        <div className="flex gap-2 mt-3">
                          {game.has_pgn && (
                            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              PGN Available
                            </span>
                          )}
                          {game.user_reviewed && (
                            <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full flex items-center gap-1">
                              <Star className="w-3 h-3" />
                              Reviewed
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Upcoming Games Shortcut */}
        {filter !== 'open' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-6 text-center"
          >
            <button
              onClick={() => navigate('/game-history/upcoming')}
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              View Upcoming Games →
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default GameHistoryPage;
