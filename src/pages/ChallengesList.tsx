import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, Swords, Filter, X, Clock, MapPin, User, Loader2, Zap, Timer, Trophy } from 'lucide-react';
import { challengesApi } from '../api/challenges';
import type { Challenge } from '../api/challenges';
import { gamesApi } from '../api/games';
import type { GameWithDetails } from '../types/game';
import { openChallenges as fallbackChallenges, type OpenChallenge } from '../data';

// Display challenge type
interface DisplayChallenge {
  id: number;
  type: 'challenge' | 'game'; // Distinguish between challenges and open games
  challengerId: number;
  challengerName: string;
  challengerRating: number;
  challengerAvatar?: string;
  timeControl: string;
  timeControlType: 'Bullet' | 'Blitz' | 'Rapid' | 'Classical';
  message?: string;
  venueName?: string;
  venueCity?: string;
  expiresAt: Date;
  createdAt: Date;
  timeAgo: string;
  expiresIn: string;
  // Game-specific fields
  gameDate?: Date;
  spotsAvailable?: number;
  maxPlayers?: number;
}

// Helper to determine time control type
const getTimeControlType = (timeControl: string): 'Bullet' | 'Blitz' | 'Rapid' | 'Classical' => {
  const parts = timeControl.split('+');
  const baseTime = parseInt(parts[0]);
  if (baseTime <= 2) return 'Bullet';
  if (baseTime <= 10) return 'Blitz';
  if (baseTime <= 30) return 'Rapid';
  return 'Classical';
};

// Helper to format time ago
const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
};

// Helper to format expires in
const formatExpiresIn = (date: Date): string => {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  if (diffMs <= 0) return 'expired';
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m left`;
  const diffHours = Math.floor(diffMins / 60);
  return `${diffHours}h left`;
};

// Transform API challenge to display format
const transformChallenge = (challenge: Challenge | OpenChallenge): DisplayChallenge => {
  const createdAt = new Date(challenge.created_at);
  const expiresAt = new Date(challenge.expires_at);
  const timeControl = challenge.time_control;

  return {
    id: challenge.id,
    type: 'challenge',
    challengerId: challenge.challenger_id,
    challengerName: challenge.challenger_name || 'Unknown',
    challengerRating: challenge.challenger_rating || 0,
    challengerAvatar: challenge.challenger_avatar,
    timeControl,
    timeControlType: getTimeControlType(timeControl),
    message: challenge.message || undefined,
    venueName: challenge.venue_name || undefined,
    venueCity: challenge.venue_city || undefined,
    expiresAt,
    createdAt,
    timeAgo: formatTimeAgo(createdAt),
    expiresIn: formatExpiresIn(expiresAt),
  };
};

// Transform API game to display format
const transformGame = (game: GameWithDetails): DisplayChallenge => {
  const createdAt = new Date(game.created_at);
  const gameDate = new Date(game.game_date);
  const timeControl = game.time_control || '10+0';
  const spotsAvailable = game.max_players - game.participant_count;

  return {
    id: game.id,
    type: 'game',
    challengerId: game.creator_id,
    challengerName: game.creator_name,
    challengerRating: game.creator_rating || 0,
    challengerAvatar: game.creator_avatar,
    timeControl,
    timeControlType: getTimeControlType(timeControl),
    message: game.description || undefined,
    venueName: game.venue_name || undefined,
    venueCity: undefined, // Games don't have venue city in the response
    expiresAt: gameDate, // Game date acts as expiry
    createdAt,
    timeAgo: formatTimeAgo(createdAt),
    expiresIn: formatExpiresIn(gameDate),
    gameDate,
    spotsAvailable,
    maxPlayers: game.max_players,
  };
};

// Transform fallback data
const transformFallbackChallenges = (): DisplayChallenge[] => {
  return fallbackChallenges.map(transformChallenge);
};

const timeControlTypeColors: Record<string, string> = {
  'Bullet': 'bg-red-500',
  'Blitz': 'bg-yellow-500',
  'Rapid': 'bg-blue-500',
  'Classical': 'bg-purple-500',
};

const timeControlTypeIcons: Record<string, React.ReactNode> = {
  'Bullet': <Zap className="w-3 h-3" />,
  'Blitz': <Timer className="w-3 h-3" />,
  'Rapid': <Clock className="w-3 h-3" />,
  'Classical': <Trophy className="w-3 h-3" />,
};

const ChallengesList = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [cityFilter, setCityFilter] = useState<string>('');
  // Initialize with fallback data
  const [challenges, setChallenges] = useState<DisplayChallenge[]>(transformFallbackChallenges());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch challenges and open games from API
  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        setLoading(true);

        // Fetch both challenges and open games in parallel
        const [challengesResponse, gamesResponse] = await Promise.all([
          challengesApi.getOpenChallenges({ limit: 100 }),
          gamesApi.getGames({ status: 'open' })
        ]);

        const apiChallenges = challengesResponse?.data?.challenges || [];
        const apiGames: GameWithDetails[] = gamesResponse?.data || [];

        // Filter games to only show those with available spots
        const openGames = apiGames.filter((game: GameWithDetails) =>
          game.participant_count < game.max_players &&
          new Date(game.game_date) > new Date() // Only future games
        );

        // Combine and transform both types
        const combined = [
          ...apiChallenges.map(transformChallenge),
          ...openGames.map(transformGame)
        ];

        if (combined.length > 0) {
          // Sort by creation date (newest first)
          combined.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
          setChallenges(combined);
          setError(null);
        }
        // If API returns empty, keep the fallback data
      } catch (err) {
        console.error('Failed to fetch challenges:', err);
        setError('Using cached data');
      } finally {
        setLoading(false);
      }
    };

    fetchChallenges();
    // Poll every 90 seconds to show new challenges
    const interval = setInterval(fetchChallenges, 90000);
    return () => clearInterval(interval);
  }, []);

  const types = ['Bullet', 'Blitz', 'Rapid', 'Classical'];
  const cities = useMemo(() => {
    const citySet = new Set(challenges.map(c => c.venueCity).filter(Boolean));
    return Array.from(citySet) as string[];
  }, [challenges]);

  const filteredChallenges = useMemo(() => {
    return challenges.filter((challenge) => {
      const matchesSearch =
        challenge.challengerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        challenge.venueName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        challenge.message?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedTypes.length === 0 || selectedTypes.includes(challenge.timeControlType);
      const matchesCity = !cityFilter || challenge.venueCity === cityFilter;
      const notExpired = challenge.expiresIn !== 'expired';
      return matchesSearch && matchesType && matchesCity && notExpired;
    });
  }, [searchQuery, selectedTypes, cityFilter, challenges]);

  const toggleType = (type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const clearFilters = () => {
    setSelectedTypes([]);
    setCityFilter('');
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-chess-darker">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-chess-darker/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-white">Find a Game</h1>
                <p className="text-sm text-white/50">Browse open challenges and scheduled games</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
            <input
              type="text"
              placeholder="Search by player, venue, or message..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-primary-500/50"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-colors ${
              showFilters || selectedTypes.length > 0 || cityFilter
                ? 'bg-primary-500/20 border-primary-500/50 text-primary-400'
                : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
            }`}
          >
            <Filter className="w-5 h-5" />
            <span>Filters</span>
            {(selectedTypes.length > 0 || cityFilter) && (
              <span className="bg-primary-500 text-white text-xs px-2 py-0.5 rounded-full">
                {selectedTypes.length + (cityFilter ? 1 : 0)}
              </span>
            )}
          </button>
        </div>

        {/* Expandable Filters */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white/5 rounded-xl p-4 mb-6 border border-white/10"
          >
            <div className="flex flex-wrap gap-4">
              {/* Time Control Types */}
              <div>
                <p className="text-sm text-white/50 mb-2">Time Control</p>
                <div className="flex flex-wrap gap-2">
                  {types.map(type => (
                    <button
                      key={type}
                      onClick={() => toggleType(type)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        selectedTypes.includes(type)
                          ? `${timeControlTypeColors[type]} text-white`
                          : 'bg-white/5 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      {timeControlTypeIcons[type]}
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* City Filter */}
              <div>
                <p className="text-sm text-white/50 mb-2">City</p>
                <select
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-primary-500/50"
                >
                  <option value="">All Cities</option>
                  {cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              {/* Clear Filters */}
              {(selectedTypes.length > 0 || cityFilter) && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-sm text-white/50 hover:text-white self-end"
                >
                  <X className="w-4 h-4" />
                  Clear all
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* Results count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-white/50 text-sm">
            {filteredChallenges.length} result{filteredChallenges.length !== 1 ? 's' : ''}
            {filteredChallenges.length > 0 && (
              <span className="ml-2">
                ({filteredChallenges.filter(c => c.type === 'challenge').length} challenges, {' '}
                {filteredChallenges.filter(c => c.type === 'game').length} games)
              </span>
            )}
          </p>
          {error && (
            <p className="text-yellow-500/70 text-sm">{error}</p>
          )}
        </div>

        {/* Loading State */}
        {loading && challenges.length === 0 && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          </div>
        )}

        {/* Challenges Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredChallenges.map((challenge, index) => (
            <motion.div
              key={`${challenge.type}-${challenge.id}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => challenge.type === 'challenge'
                ? navigate(`/player/${challenge.challengerId}`)
                : navigate(`/games/${challenge.id}`)
              }
              className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary-500/30 rounded-xl p-4 cursor-pointer transition-all group"
            >
              {/* Type badge */}
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  challenge.type === 'game'
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                }`}>
                  {challenge.type === 'game' ? 'Scheduled Game' : 'Open Challenge'}
                </span>
                <span className={`${timeControlTypeColors[challenge.timeControlType]} text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1`}>
                  {timeControlTypeIcons[challenge.timeControlType]}
                  {challenge.timeControl}
                </span>
              </div>

              {/* Header with challenger info */}
              <div className="flex items-start gap-3 mb-3">
                <div className="flex items-center gap-3">
                  {challenge.challengerAvatar ? (
                    <img
                      src={challenge.challengerAvatar}
                      alt={challenge.challengerName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary-500/20 flex items-center justify-center">
                      <User className="w-6 h-6 text-primary-400" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-white group-hover:text-primary-400 transition-colors">
                      {challenge.challengerName}
                    </h3>
                    <p className="text-sm text-white/50">
                      {challenge.challengerRating > 0 ? `${challenge.challengerRating} rated` : 'Organizer'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Game date for scheduled games */}
              {challenge.type === 'game' && challenge.gameDate && (
                <div className="flex items-center gap-2 text-sm text-blue-400 mb-3 bg-blue-500/10 rounded-lg p-2">
                  <Clock className="w-4 h-4" />
                  <span>{new Date(challenge.gameDate).toLocaleDateString()} at {new Date(challenge.gameDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              )}

              {/* Spots available for games */}
              {challenge.type === 'game' && challenge.spotsAvailable !== undefined && (
                <div className="text-sm text-white/70 mb-3">
                  <span className="font-semibold text-green-400">{challenge.spotsAvailable}</span> / {challenge.maxPlayers} spots available
                </div>
              )}

              {/* Message */}
              {challenge.message && (
                <p className="text-sm text-white/70 mb-3 line-clamp-2">
                  "{challenge.message}"
                </p>
              )}

              {/* Venue */}
              {challenge.venueName && (
                <div className="flex items-center gap-2 text-sm text-white/50 mb-3">
                  <MapPin className="w-4 h-4" />
                  <span>{challenge.venueName}</span>
                  {challenge.venueCity && (
                    <span className="text-white/30">• {challenge.venueCity}</span>
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <span className="text-xs text-white/40">{challenge.timeAgo}</span>
                <span className="text-xs text-yellow-500">
                  {challenge.type === 'game' ? `Starts ${challenge.expiresIn}` : challenge.expiresIn}
                </span>
              </div>

              {/* Accept/Join button overlay on hover */}
              <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="w-full py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
                  <Swords className="w-4 h-4" />
                  {challenge.type === 'game' ? 'Join Game' : 'Accept Challenge'}
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {!loading && filteredChallenges.length === 0 && (
          <div className="text-center py-12">
            <Swords className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No games found</h3>
            <p className="text-white/50">
              {searchQuery || selectedTypes.length > 0 || cityFilter
                ? 'Try adjusting your filters'
                : 'Be the first to post a challenge or schedule a game!'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChallengesList;
