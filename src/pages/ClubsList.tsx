import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, Star, Filter, X, MapPin, Users, Map as MapIcon, Plus, Loader2 } from 'lucide-react';
import { clubsApi } from '../api/clubs';
import type { Club } from '../api/clubs';
import { clubs as fallbackClubs } from '../data';
import Map from '../components/Map';
import { Helmet } from 'react-helmet-async';

// Transform API club to display format
interface DisplayClub {
  id: number;
  name: string;
  image: string;
  rating: number;
  members: number;
  location: string;
  distance: string;
  tags: string[];
  featured: boolean;
  coordinates: { lat: number; lng: number };
}

const transformClub = (club: Club): DisplayClub => ({
  id: club.id,
  name: club.name,
  image: club.image || '/images/default-club.jpg',
  rating: 4.5, // Default rating since API doesn't have ratings yet
  members: club.member_count,
  location: club.city ? `${club.city}${club.country ? ', ' + club.country : ''}` : 'Location not set',
  distance: '-- mi', // Would need geolocation to calculate
  tags: [], // API doesn't have tags yet
  featured: false,
  coordinates: { lat: 40.7128, lng: -74.0060 } // Default coordinates
});

const ClubsList = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'distance' | 'rating' | 'members'>('members');
  const [showMap, setShowMap] = useState(false);
  const [clubs, setClubs] = useState<DisplayClub[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch clubs from API
  useEffect(() => {
    const fetchClubs = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await clubsApi.getClubs({ limit: 100 });
        const apiClubs = response.data?.clubs || [];

        if (apiClubs.length > 0) {
          setClubs(apiClubs.map(transformClub));
        } else {
          // Use fallback data if no clubs in database
          setClubs(fallbackClubs);
        }
      } catch (err) {
        console.error('Failed to fetch clubs:', err);
        // Use fallback data on error
        setClubs(fallbackClubs);
        setError('Using cached data - could not connect to server');
      } finally {
        setLoading(false);
      }
    };

    fetchClubs();
  }, []);

  const allTags = Array.from(new Set(clubs.flatMap((club) => club.tags)));

  const filteredClubs = useMemo(() => {
    return clubs
      .filter((club) => {
        const matchesSearch =
          club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          club.location.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTags =
          selectedTags.length === 0 || selectedTags.some((tag) => club.tags.includes(tag));
        return matchesSearch && matchesTags;
      })
      .sort((a, b) => {
        if (sortBy === 'distance') return parseFloat(a.distance) - parseFloat(b.distance);
        if (sortBy === 'rating') return b.rating - a.rating;
        return b.members - a.members;
      });
  }, [clubs, searchQuery, selectedTags, sortBy]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const mapMarkers = useMemo(() => {
    return filteredClubs.map((club) => ({
      id: club.id,
      name: club.name,
      position: [club.coordinates.lat, club.coordinates.lng] as [number, number],
      info: `${club.members} members • ${club.rating}★`,
      image: club.image,
    }));
  }, [filteredClubs]);

  return (
    <>
      <Helmet>
        <title>Chess Clubs Near You | Join Local Chess Communities | ChessFam</title>
        <meta
          name="description"
          content={`Find and join ${filteredClubs.length}+ chess clubs in your area. Connect with local chess communities, play casual games, attend tournaments, and improve your skills.`}
        />
        <meta property="og:title" content="Chess Clubs Near You | Join Local Chess Communities | ChessFam" />
        <meta
          property="og:description"
          content={`Find and join ${filteredClubs.length}+ chess clubs. Connect with local chess communities and improve your skills.`}
        />
        <meta property="og:url" content="https://chessfam.com/clubs" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Chess Clubs Near You | Join Local Chess Communities | ChessFam" />
        <meta
          name="twitter:description"
          content={`Find and join ${filteredClubs.length}+ chess clubs in your area.`}
        />
        <link rel="canonical" href="https://chessfam.com/clubs" />

        {/* ItemList Schema for SEO */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": "Chess Clubs",
            "description": "Browse chess clubs and connect with local chess communities",
            "numberOfItems": filteredClubs.length,
            "itemListElement": filteredClubs.slice(0, 10).map((club: any, index: number) => ({
              "@type": "ListItem",
              "position": index + 1,
              "item": {
                "@type": "SportsOrganization",
                "@id": `https://chessfam.com/club/${club.id}`,
                "name": club.name,
                "location": {
                  "@type": "Place",
                  "name": club.location
                },
                "memberOf": {
                  "@type": "Organization",
                  "name": "ChessFam"
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
        <h1 className="text-2xl font-display font-bold text-white">Find a Club</h1>
        <button
          onClick={() => navigate('/clubs/create')}
          className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-chess-darker font-semibold rounded-xl hover:bg-gold-400 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Register
        </button>
      </motion.div>

      {/* Error Banner */}
      {error && (
        <div className="mb-4 px-4 py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-yellow-400 text-sm">
          {error}
        </div>
      )}

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
              placeholder="Search clubs or locations..."
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl
                       text-white placeholder-white/30 focus:border-green-500 focus:outline-none"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-3 rounded-xl flex items-center gap-2 transition-colors
                      ${showFilters ? 'bg-green-500 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}
          >
            <Filter className="w-5 h-5" />
            Filters
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-white/5 rounded-xl p-4 space-y-4"
          >
            {/* Tags Filter */}
            {allTags.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-white/70 mb-2">Features</h3>
                <div className="flex flex-wrap gap-2">
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors
                                ${selectedTags.includes(tag)
                                  ? 'bg-green-500 text-white'
                                  : 'bg-white/5 text-white/70 hover:bg-white/10'
                                }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sort */}
            <div>
              <h3 className="text-sm font-medium text-white/70 mb-2">Sort By</h3>
              <div className="flex gap-2">
                {[
                  { value: 'distance', label: 'Distance' },
                  { value: 'rating', label: 'Rating' },
                  { value: 'members', label: 'Members' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSortBy(option.value as typeof sortBy)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors
                              ${sortBy === option.value
                                ? 'bg-green-500 text-white'
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
                setSelectedTags([]);
                setSortBy('members');
              }}
              className="text-sm text-white/50 hover:text-white flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Clear all filters
            </button>
          </motion.div>
        )}
      </motion.div>

      {/* Results Count & Map Toggle */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-white/50 text-sm">
          {loading ? 'Loading...' : `${filteredClubs.length} club${filteredClubs.length !== 1 ? 's' : ''} found`}
        </p>
        <button
          onClick={() => setShowMap(!showMap)}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-colors ${
            showMap
              ? 'bg-green-500 text-white'
              : 'bg-white/5 text-white/50 hover:bg-white/10'
          }`}
        >
          <MapIcon className="w-5 h-5" />
          {showMap ? 'Hide Map' : 'Show Map'}
        </button>
      </div>

      {/* Map View (Toggle) */}
      {showMap && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Map
            markers={mapMarkers}
            onMarkerClick={(id) => navigate(`/club/${id}`)}
            markerColor="#22c55e"
            height="400px"
          />
        </motion.div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
        </div>
      )}

      {/* Clubs Grid (matching MastersList) */}
      {!loading && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredClubs.map((club, index) => (
            <motion.div
              key={club.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => navigate(`/club/${club.id}`)}
              className="bg-white/5 rounded-xl p-4 cursor-pointer hover:bg-white/10
                       transition-all group border border-transparent hover:border-green-500/30"
            >
              <div className="relative mb-3">
                <img
                  src={club.image}
                  alt={club.name}
                  className="w-full aspect-square rounded-xl object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/default-club.jpg';
                  }}
                />
                {club.featured && (
                  <div className="absolute top-2 right-2 px-2 py-1 bg-gold-500 text-chess-darker text-xs font-bold rounded">
                    Featured
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 mb-1">
                <Star className="w-4 h-4 text-gold-400 fill-gold-400" />
                <span className="text-sm font-medium text-white">{club.rating}</span>
                <span className="text-xs text-white/40">({club.members})</span>
              </div>
              <h3 className="font-semibold text-white group-hover:text-green-400 transition-colors truncate">
                {club.name}
              </h3>
              <div className="flex items-center gap-1 mt-1 text-xs text-white/50">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{club.location}</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1 text-xs text-green-400">
                  {club.distance}
                </div>
                <div className="flex items-center gap-1 text-xs text-white/50">
                  <Users className="w-3 h-3" />
                  {club.members} members
                </div>
              </div>
              {club.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {club.tags.slice(0, 2).map((tag) => (
                    <span key={tag} className="px-2 py-0.5 bg-white/5 rounded text-xs text-white/50">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {!loading && filteredClubs.length === 0 && (
        <div className="text-center py-12">
          <p className="text-white/50">No clubs found matching your criteria</p>
        </div>
      )}
    </div>
    </>
  );
};

export default ClubsList;
