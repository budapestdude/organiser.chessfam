import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, Swords, MapPin, Users, Clock, Zap, Timer, Trophy, Star, Loader2 } from 'lucide-react';
import { challengesApi } from '../api/challenges';
import type { Challenge } from '../api/challenges';
import { gamesApi } from '../api/games';
import type { GameWithDetails } from '../types/game';
import { venuesApi } from '../api/venues';
import { type OpenChallenge } from '../data';

// ========== CHALLENGES SECTION ==========

interface DisplayChallenge {
  id: number;
  type: 'challenge' | 'game';
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
  gameDate?: Date;
  spotsAvailable?: number;
  maxPlayers?: number;
}

const getTimeControlType = (timeControl: string): 'Bullet' | 'Blitz' | 'Rapid' | 'Classical' => {
  const parts = timeControl.split('+');
  const baseTime = parseInt(parts[0]);
  if (baseTime <= 2) return 'Bullet';
  if (baseTime <= 10) return 'Blitz';
  if (baseTime <= 30) return 'Rapid';
  return 'Classical';
};

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

const formatExpiresIn = (date: Date): string => {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  if (diffMs <= 0) return 'expired';
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m left`;
  const diffHours = Math.floor(diffMins / 60);
  return `${diffHours}h left`;
};

const transformChallenge = (challenge: Challenge | OpenChallenge): DisplayChallenge => {
  const createdAt = new Date(challenge.created_at);
  const expiresAt = new Date(challenge.expires_at);
  return {
    id: challenge.id,
    type: 'challenge',
    challengerId: challenge.challenger_id,
    challengerName: challenge.challenger_name || 'Unknown',
    challengerRating: challenge.challenger_rating || 0,
    challengerAvatar: challenge.challenger_avatar,
    timeControl: challenge.time_control,
    timeControlType: getTimeControlType(challenge.time_control),
    message: challenge.message || undefined,
    venueName: challenge.venue_name || undefined,
    venueCity: challenge.venue_city || undefined,
    expiresAt,
    createdAt,
    timeAgo: formatTimeAgo(createdAt),
    expiresIn: formatExpiresIn(expiresAt),
  };
};

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
    venueCity: undefined,
    expiresAt: gameDate,
    createdAt,
    timeAgo: formatTimeAgo(createdAt),
    expiresIn: formatExpiresIn(gameDate),
    gameDate,
    spotsAvailable,
    maxPlayers: game.max_players,
  };
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

// ========== MAIN COMPONENT ==========

export default function LocationsAndChallenges() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  // Challenges state
  const [challenges, setChallenges] = useState<DisplayChallenge[]>([]);
  const [loadingChallenges, setLoadingChallenges] = useState(true);

  // Venues state
  const [approvedVenues, setApprovedVenues] = useState<any[]>([]);
  const [loadingVenues, setLoadingVenues] = useState(true);

  // Fetch challenges
  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        setLoadingChallenges(true);
        const [challengesResponse, gamesResponse] = await Promise.all([
          challengesApi.getOpenChallenges({ limit: 100 }),
          gamesApi.getGames({ status: 'open' })
        ]);

        const apiChallenges = challengesResponse?.data?.challenges || [];
        const apiGames: GameWithDetails[] = gamesResponse?.data || [];

        const openGames = apiGames.filter((game: GameWithDetails) =>
          game.participant_count < game.max_players &&
          new Date(game.game_date) > new Date()
        );

        const combined = [
          ...apiChallenges.map(transformChallenge),
          ...openGames.map(transformGame)
        ];

        if (combined.length > 0) {
          combined.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
          setChallenges(combined);
        }
      } catch (err) {
        console.error('Failed to fetch challenges:', err);
      } finally {
        setLoadingChallenges(false);
      }
    };

    fetchChallenges();
    // Poll every 90 seconds to show new challenges
    const interval = setInterval(fetchChallenges, 90000);
    return () => clearInterval(interval);
  }, []);

  // Fetch venues
  useEffect(() => {
    const fetchVenues = async () => {
      try {
        setLoadingVenues(true);
        const response = await venuesApi.getApprovedVenues();
        setApprovedVenues(response.data || []);
      } catch (error) {
        console.error('Error fetching venues:', error);
      } finally {
        setLoadingVenues(false);
      }
    };
    fetchVenues();
  }, []);

  // Convert venues to location format
  const allLocations = useMemo(() => {
    const convertedVenues = approvedVenues.map(venue => {
      let coords = { lat: 40.7128, lng: -74.0060 };
      if (venue.coordinates) {
        if (typeof venue.coordinates === 'string') {
          try {
            coords = JSON.parse(venue.coordinates);
          } catch {}
        } else if (venue.coordinates.lat && venue.coordinates.lng) {
          coords = venue.coordinates;
        }
      }

      return {
        id: 1000 + venue.id,
        name: venue.venue_name || venue.name,
        type: venue.venue_type === 'community_center' ? 'Community Center' :
              (venue.venue_type || 'Other').charAt(0).toUpperCase() + (venue.venue_type || 'other').slice(1),
        location: venue.city ? `${venue.city}${venue.country ? ', ' + venue.country : ''}` : 'Location not set',
        address: venue.address || '',
        image: venue.image_url || venue.images?.[0] || 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800',
        rating: parseFloat(venue.average_rating) || 0,
        reviewCount: parseInt(venue.review_count) || 0,
        distance: '-- mi',
        activeGames: venue.active_games || 0,
        description: venue.description || '',
        amenities: venue.amenities || [],
        hours: venue.opening_hours || venue.hours || 'Hours not specified',
        coordinates: coords
      };
    });

    return convertedVenues;
  }, [approvedVenues]);

  // Filter both challenges and venues by search
  const filteredChallenges = useMemo(() => {
    return challenges.filter((challenge) => {
      const matchesSearch =
        challenge.challengerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        challenge.venueName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        challenge.message?.toLowerCase().includes(searchQuery.toLowerCase());
      const notExpired = challenge.expiresIn !== 'expired';
      return matchesSearch && notExpired;
    });
  }, [searchQuery, challenges]);

  const filteredLocations = useMemo(() => {
    return allLocations.filter((location) => {
      return location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
             location.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
             location.description.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [searchQuery, allLocations]);

  return (
    <div className="min-h-screen bg-chess-darker pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-chess-darker/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Find Games & Locations</h1>
              <p className="text-sm text-white/50">Browse open challenges and chess venues</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="Search challenges, players, or venues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg
                       text-white placeholder:text-white/40 focus:outline-none focus:border-gold-500/50"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        {/* Challenges Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Swords className="w-5 h-5 text-gold-500" />
            <h2 className="text-2xl font-bold text-white">Open Challenges</h2>
            {loadingChallenges && <Loader2 className="w-4 h-4 text-white/50 animate-spin ml-2" />}
          </div>

          {filteredChallenges.length === 0 ? (
            <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
              <Swords className="w-12 h-12 text-white/30 mx-auto mb-3" />
              <p className="text-white/50">No open challenges found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredChallenges.map((challenge) => (
                <motion.div
                  key={`${challenge.type}-${challenge.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/5 rounded-xl border border-white/10 p-4 hover:bg-white/10
                           transition-all cursor-pointer"
                  onClick={() => challenge.type === 'challenge'
                    ? navigate(`/challenges/${challenge.id}`)
                    : navigate(`/games/${challenge.id}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-gold-500/20 flex items-center justify-center">
                        {challenge.challengerAvatar ? (
                          <img src={challenge.challengerAvatar} alt="" className="w-10 h-10 rounded-full" />
                        ) : (
                          <span className="text-gold-500 font-semibold">
                            {challenge.challengerName.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{challenge.challengerName}</p>
                        <p className="text-xs text-white/50">{challenge.challengerRating}</p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold
                                   ${timeControlTypeColors[challenge.timeControlType]}`}>
                      {timeControlTypeIcons[challenge.timeControlType]}
                      <span>{challenge.timeControl}</span>
                    </div>
                  </div>

                  {challenge.message && (
                    <p className="text-sm text-white/70 mb-3 line-clamp-2">{challenge.message}</p>
                  )}

                  <div className="flex items-center justify-between text-xs text-white/50">
                    <div className="flex items-center gap-4">
                      {challenge.venueName && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span>{challenge.venueName}</span>
                        </div>
                      )}
                      {challenge.type === 'game' && challenge.spotsAvailable && (
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>{challenge.spotsAvailable} spots left</span>
                        </div>
                      )}
                    </div>
                    <span className="text-gold-500">{challenge.expiresIn}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* Venues Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-gold-500" />
            <h2 className="text-2xl font-bold text-white">Chess Venues</h2>
            {loadingVenues && <Loader2 className="w-4 h-4 text-white/50 animate-spin ml-2" />}
          </div>

          {filteredLocations.length === 0 ? (
            <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
              <MapPin className="w-12 h-12 text-white/30 mx-auto mb-3" />
              <p className="text-white/50">No venues found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLocations.map((location) => (
                <motion.div
                  key={location.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/5 rounded-xl border border-white/10 overflow-hidden hover:bg-white/10
                           transition-all cursor-pointer group"
                  onClick={() => navigate(`/location/${location.id}`)}
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={location.image}
                      alt={location.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    {location.rating > 0 ? (
                      <div className="absolute top-3 right-3 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg
                                    flex items-center gap-1 text-xs">
                        <Star className="w-3 h-3 text-gold-500 fill-gold-500" />
                        <span className="text-white font-semibold">{location.rating.toFixed(1)}</span>
                        {location.reviewCount > 0 && (
                          <span className="text-white/70">({location.reviewCount})</span>
                        )}
                      </div>
                    ) : (
                      <div className="absolute top-3 right-3 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg
                                    flex items-center gap-1 text-xs">
                        <Star className="w-3 h-3 text-white/30" />
                        <span className="text-white/50 text-xs">No reviews</span>
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold text-white mb-1">{location.name}</h3>
                    <p className="text-sm text-white/50 mb-2">{location.location}</p>
                    <p className="text-xs text-white/70 line-clamp-2 mb-3">{location.description}</p>

                    <div className="flex items-center justify-between text-xs">
                      <span className="px-2 py-1 bg-white/10 rounded text-white/70">{location.type}</span>
                      {location.activeGames > 0 && (
                        <div className="flex items-center gap-1 text-green-400">
                          <Users className="w-3 h-3" />
                          <span>{location.activeGames} active</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
