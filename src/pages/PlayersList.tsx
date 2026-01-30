import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, Filter, X, MapPin, Zap, Map as MapIcon, List, Loader2 } from 'lucide-react';
import { profileApi } from '../api/profile';
import type { PlayerSearchResult } from '../api/profile';
import { players as fallbackPlayers } from '../data';
import Map from '../components/Map';
import { Helmet } from 'react-helmet-async';

// Transform API player to display format
interface DisplayPlayer {
  id: number;
  name: string;
  rating: number;
  location: string;
  distance: string;
  preferences: string[];
  availability: string;
  online: boolean;
  image: string;
  gamesPlayed: number;
  winRate: number;
  bio: string;
  coordinates: { lat: number; lng: number };
}

const transformPlayer = (player: PlayerSearchResult): DisplayPlayer => ({
  id: player.id,
  name: player.name,
  rating: player.rating || 1500,
  location: player.location || player.country || 'Unknown',
  distance: '-- mi', // Would need geolocation to calculate
  preferences: player.preferred_time_control ? [player.preferred_time_control] : ['Classical'],
  availability: player.looking_for_games ? 'Available' : 'Not Available',
  online: player.online || false,
  image: player.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop',
  gamesPlayed: 0, // API doesn't have this yet
  winRate: 50, // API doesn't have this yet
  bio: player.bio || '',
  coordinates: { lat: 40.7128, lng: -74.0060 } // Default coordinates
});

const PlayersList = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingRange, setRatingRange] = useState<[number, number]>([0, 3000]);
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'distance' | 'rating' | 'winrate'>('distance');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [players, setPlayers] = useState<DisplayPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch players from API
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await profileApi.searchPlayers({
          looking_for_games: true,
          limit: 100
        });
        const apiPlayers = response.data?.players || response.players || [];

        if (apiPlayers.length > 0) {
          setPlayers(apiPlayers.map(transformPlayer));
        } else {
          // Use fallback data if no players in database
          setPlayers(fallbackPlayers);
        }
      } catch (err) {
        console.error('Failed to fetch players:', err);
        // Use fallback data on error
        setPlayers(fallbackPlayers);
        setError('Using cached data - could not connect to server');
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, []);

  const preferences = ['Classical', 'Rapid', 'Blitz', 'Bullet'];

  const filteredPlayers = useMemo(() => {
    return players
      .filter((player) => {
        const matchesSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRating = player.rating >= ratingRange[0] && player.rating <= ratingRange[1];
        const matchesPreferences =
          selectedPreferences.length === 0 ||
          selectedPreferences.some((pref) => player.preferences.includes(pref));
        const matchesOnline = !onlineOnly || player.online;
        return matchesSearch && matchesRating && matchesPreferences && matchesOnline;
      })
      .sort((a, b) => {
        if (sortBy === 'distance') return parseFloat(a.distance) - parseFloat(b.distance);
        if (sortBy === 'rating') return b.rating - a.rating;
        return b.winRate - a.winRate;
      });
  }, [searchQuery, ratingRange, selectedPreferences, onlineOnly, sortBy]);

  const togglePreference = (pref: string) => {
    setSelectedPreferences((prev) =>
      prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref]
    );
  };

  const mapMarkers = useMemo(() => {
    return filteredPlayers.map((player) => ({
      id: player.id,
      name: player.name,
      position: [player.coordinates.lat, player.coordinates.lng] as [number, number],
      rating: player.rating,
      info: `${player.winRate}% win rate`,
      isOnline: player.online,
      image: player.image,
    }));
  }, [filteredPlayers]);

  return (
    <>
      <Helmet>
        <title>Find Chess Players Near You | Connect & Play | ChessFam</title>
        <meta
          name="description"
          content={`Connect with ${filteredPlayers.length}+ chess players in your area. Find opponents for casual games, practice matches, and friendly competitions. All skill levels welcome.`}
        />
        <meta property="og:title" content="Find Chess Players Near You | Connect & Play | ChessFam" />
        <meta
          property="og:description"
          content={`Connect with ${filteredPlayers.length}+ chess players. Find opponents for casual games and competitions.`}
        />
        <meta property="og:url" content="https://chessfam.com/players" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Find Chess Players Near You | Connect & Play | ChessFam" />
        <meta
          name="twitter:description"
          content={`Connect with ${filteredPlayers.length}+ chess players in your area.`}
        />
        <link rel="canonical" href="https://chessfam.com/players" />

        {/* ItemList Schema for SEO */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": "Chess Players",
            "description": "Browse chess players looking for games and practice partners",
            "numberOfItems": filteredPlayers.length,
            "itemListElement": filteredPlayers.slice(0, 10).map((player: any, index: number) => ({
              "@type": "ListItem",
              "position": index + 1,
              "item": {
                "@type": "Person",
                "@id": `https://chessfam.com/player/${player.id}`,
                "name": player.name,
                "address": {
                  "@type": "PostalAddress",
                  "addressLocality": player.location
                }
              }
            }))
          })}
        </script>
      </Helmet>
      <div className="min-h-screen py-8 px-4 md:px-8 lg:px-16 max-w-7xl mx-auto">
        {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <h1 className="text-2xl font-display font-bold text-white">Find a Game</h1>
        <div className="w-16" />
      </motion.div>

      {/* Error Banner */}
      {error && (
        <div className="mb-4 px-4 py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-yellow-400 text-sm">
          {error}
        </div>
      )}

      {/* Quick Match Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-gradient-to-r from-orange-500/20 to-orange-600/20 border border-orange-500/30
                 rounded-xl p-4 mb-6 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Quick Match</h3>
            <p className="text-sm text-white/60">Get matched instantly with a nearby player</p>
          </div>
        </div>
        <button className="px-4 py-2 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-400 transition-colors">
          Find Match
        </button>
      </motion.div>

      {/* Search & Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6 space-y-4"
      >
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search players..."
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl
                       text-white placeholder-white/30 focus:border-orange-500 focus:outline-none"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-3 rounded-xl flex items-center gap-2 transition-colors
                      ${showFilters ? 'bg-orange-500 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}
          >
            <Filter className="w-5 h-5" />
            Filters
          </button>
        </div>

        {/* Online Only Toggle */}
        <button
          onClick={() => setOnlineOnly(!onlineOnly)}
          className={`px-4 py-2 rounded-lg text-sm transition-colors
                    ${onlineOnly
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-white/5 text-white/70 hover:bg-white/10'
                    }`}
        >
          {onlineOnly ? '✓ Online Only' : 'Show Online Only'}
        </button>

        {/* Filters Panel */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-white/5 rounded-xl p-4 space-y-4"
          >
            {/* Preferences Filter */}
            <div>
              <h3 className="text-sm font-medium text-white/70 mb-2">Time Control Preference</h3>
              <div className="flex flex-wrap gap-2">
                {preferences.map((pref) => (
                  <button
                    key={pref}
                    onClick={() => togglePreference(pref)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors
                              ${selectedPreferences.includes(pref)
                                ? 'bg-orange-500 text-white'
                                : 'bg-white/5 text-white/70 hover:bg-white/10'
                              }`}
                  >
                    {pref}
                  </button>
                ))}
              </div>
            </div>

            {/* Rating Range */}
            <div>
              <h3 className="text-sm font-medium text-white/70 mb-2">
                Rating Range: {ratingRange[0]} - {ratingRange[1]}
              </h3>
              <div className="flex gap-4">
                <input
                  type="range"
                  min="0"
                  max="3000"
                  step="100"
                  value={ratingRange[0]}
                  onChange={(e) => setRatingRange([Number(e.target.value), ratingRange[1]])}
                  className="flex-1 accent-orange-500"
                />
                <input
                  type="range"
                  min="0"
                  max="3000"
                  step="100"
                  value={ratingRange[1]}
                  onChange={(e) => setRatingRange([ratingRange[0], Number(e.target.value)])}
                  className="flex-1 accent-orange-500"
                />
              </div>
            </div>

            {/* Sort */}
            <div>
              <h3 className="text-sm font-medium text-white/70 mb-2">Sort By</h3>
              <div className="flex gap-2">
                {[
                  { value: 'distance', label: 'Distance' },
                  { value: 'rating', label: 'Rating' },
                  { value: 'winrate', label: 'Win Rate' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSortBy(option.value as typeof sortBy)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors
                              ${sortBy === option.value
                                ? 'bg-orange-500 text-white'
                                : 'bg-white/5 text-white/70 hover:bg-white/10'
                              }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Clear Filters */}
            <button
              onClick={() => {
                setSearchQuery('');
                setRatingRange([0, 3000]);
                setSelectedPreferences([]);
                setOnlineOnly(false);
                setSortBy('distance');
              }}
              className="text-sm text-white/50 hover:text-white flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Clear all filters
            </button>
          </motion.div>
        )}
      </motion.div>

      {/* Results Count & View Toggle */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-white/50 text-sm">
          {loading ? 'Loading...' : `${filteredPlayers.length} player${filteredPlayers.length !== 1 ? 's' : ''} found`}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'list'
                ? 'bg-orange-500 text-white'
                : 'bg-white/5 text-white/50 hover:bg-white/10'
            }`}
          >
            <List className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'map'
                ? 'bg-orange-500 text-white'
                : 'bg-white/5 text-white/50 hover:bg-white/10'
            }`}
          >
            <MapIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Map View */}
      {viewMode === 'map' && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Map
            markers={mapMarkers}
            onMarkerClick={(id) => navigate(`/player/${id}`)}
            markerColor="#f97316"
            height="400px"
          />
          <p className="text-xs text-white/40 mt-2 text-center">
            Green dots indicate online players
          </p>
        </motion.div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        </div>
      )}

      {/* Players Grid */}
      {!loading && (
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${viewMode === 'map' ? 'hidden md:grid' : ''}`}>
          {filteredPlayers.map((player, index) => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => navigate(`/player/${player.id}`)}
              className="bg-white/5 rounded-xl p-4 cursor-pointer hover:bg-white/10
                       transition-all group border border-transparent hover:border-orange-500/30"
            >
              <div className="flex items-start gap-4">
                <div className="relative">
                  <img
                    src={player.image}
                    alt={player.name}
                    className="w-16 h-16 rounded-xl object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop';
                    }}
                  />
                  {player.online && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full
                                  border-2 border-chess-darker" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white group-hover:text-orange-400 transition-colors">
                    {player.name}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <MapPin className="w-3 h-3" />
                    {player.location}
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-lg font-bold text-white">{player.rating}</span>
                    <span className="text-sm text-green-400">{player.winRate}% win</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {player.preferences.map((pref) => (
                      <span key={pref} className="px-2 py-0.5 bg-white/5 rounded text-xs text-white/50">
                        {pref}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {!loading && filteredPlayers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-white/50">No players found matching your criteria</p>
        </div>
      )}
    </div>
    </>
  );
};

export default PlayersList;
