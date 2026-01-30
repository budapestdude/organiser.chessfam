import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, Trophy, Filter, X, Calendar, MapPin, Users, Map as MapIcon, Plus, Loader2 } from 'lucide-react';
import { tournamentsApi } from '../api/tournaments';
import type { Tournament } from '../api/tournaments';
import Map from '../components/Map';
import { buildTournamentUrl } from '../utils/slugify';
import { Helmet } from 'react-helmet-async';

// Transform API tournament to display format
interface DisplayTournament {
  id: number;
  name: string;
  type: string;
  date: string;
  location: string;
  prize: string;
  players: { current: number; max: number };
  entryFee: number;
  timeControl: string;
  featured: boolean;
  image: string;
  status: 'upcoming' | 'completed' | 'ongoing' | 'cancelled';
  coordinates?: { lat: number; lng: number };
}

const transformTournament = (tournament: Tournament): DisplayTournament => {
  // Map time_control to type
  const typeMap: Record<string, string> = {
    'classical': 'Classical',
    'rapid': 'Rapid',
    'blitz': 'Blitz',
    'bullet': 'Bullet'
  };
  const type = typeMap[tournament.time_control?.toLowerCase() || ''] || tournament.tournament_type || 'Classical';

  // Format date
  const startDate = new Date(tournament.start_date);
  const endDate = tournament.end_date ? new Date(tournament.end_date) : null;
  let dateStr = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  if (endDate && endDate.getTime() !== startDate.getTime()) {
    dateStr = `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}-${endDate.toLocaleDateString('en-US', { day: 'numeric', year: 'numeric' })}`;
  }

  // Parse entry_fee and prize_pool (might be strings from backend)
  const entryFee = typeof tournament.entry_fee === 'string' ? parseFloat(tournament.entry_fee) : tournament.entry_fee || 0;
  const prizePool = typeof tournament.prize_pool === 'string' ? parseFloat(tournament.prize_pool) : tournament.prize_pool;

  // Determine status based on dates
  const now = new Date();
  let status: 'upcoming' | 'completed' | 'ongoing' | 'cancelled' = tournament.status as any || 'upcoming';

  // Auto-mark as completed if end date has passed
  if (endDate && endDate < now && status !== 'cancelled') {
    status = 'completed';
  } else if (!endDate && startDate < now && status !== 'cancelled') {
    // If no end date but start date passed, mark as completed
    status = 'completed';
  }

  return {
    id: tournament.id,
    name: tournament.name,
    type,
    date: dateStr,
    location: tournament.venue_city || tournament.venue_name || 'Online',
    prize: prizePool ? `$${prizePool.toLocaleString()}` : 'TBD',
    players: {
      current: tournament.current_participants,
      max: tournament.max_participants || 128
    },
    entryFee,
    timeControl: tournament.time_control || 'TBD',
    featured: tournament.status === 'featured',
    image: tournament.image || 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=600&h=400&fit=crop',
    status,
    coordinates: undefined // API doesn't have coordinates yet
  };
};

const TournamentsList = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [locationFilter, setLocationFilter] = useState<'all' | 'online' | 'inperson'>('all');
  const [showMap, setShowMap] = useState(false);
  // Initialize with empty array, will be populated from API
  const [tournaments, setTournaments] = useState<DisplayTournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Try to fetch tournaments from API, keep fallback on failure
  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        setLoading(true);
        const response = await tournamentsApi.getTournaments({ limit: 100 });
        console.log('API Response:', response);
        console.log('Response data:', response?.data);

        // Backend returns { success: true, data: [...tournaments...], meta: {...} }
        // Axios returns response.data = { success: true, data: [...], meta: {...} }
        // So we need response.data.data to get the actual tournaments array
        const apiTournaments = Array.isArray(response?.data?.data)
          ? response.data.data
          : (Array.isArray(response?.data) ? response.data : []);
        console.log('API Tournaments:', apiTournaments);

        if (apiTournaments.length > 0) {
          const transformed = apiTournaments.map(transformTournament);
          console.log('Transformed tournaments:', transformed);
          setTournaments(transformed);
          setError(null);
        } else {
          // If API returns empty array, show empty state
          console.log('No tournaments found');
          setTournaments([]);
        }
      } catch (err) {
        console.error('Failed to fetch tournaments:', err);
        setError('Failed to load tournaments');
      } finally {
        setLoading(false);
      }
    };

    fetchTournaments();
  }, []);

  const types = ['Classical', 'Rapid', 'Blitz', 'Bullet'];

  const filteredTournaments = useMemo(() => {
    const filtered = tournaments.filter((tournament) => {
      const matchesSearch = tournament.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedTypes.length === 0 || selectedTypes.includes(tournament.type);
      const matchesLocation =
        locationFilter === 'all' ||
        (locationFilter === 'online' && tournament.location === 'Online') ||
        (locationFilter === 'inperson' && tournament.location !== 'Online');
      return matchesSearch && matchesType && matchesLocation;
    });

    // Sort: upcoming tournaments first (by date), then completed tournaments (by date desc)
    return filtered.sort((a, b) => {
      // Status priority: upcoming/ongoing > completed/cancelled
      const statusPriority: Record<string, number> = {
        upcoming: 1,
        ongoing: 1,
        completed: 2,
        cancelled: 3
      };

      const priorityA = statusPriority[a.status] || 2;
      const priorityB = statusPriority[b.status] || 2;

      // If different priorities, sort by priority
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      // Within same priority, sort by date
      // For upcoming: earliest first (ascending)
      // For completed: latest first (descending)
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();

      if (priorityA === 1) {
        // Upcoming/ongoing: earliest first
        return dateA - dateB;
      } else {
        // Completed/cancelled: latest first
        return dateB - dateA;
      }
    });
  }, [tournaments, searchQuery, selectedTypes, locationFilter]);

  const toggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const typeColors: Record<string, string> = {
    Classical: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    Rapid: 'bg-green-500/20 text-green-400 border-green-500/30',
    Blitz: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    Bullet: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  const mapMarkers = useMemo(() => {
    return filteredTournaments
      .filter((tournament) => tournament.coordinates && tournament.location !== 'Online')
      .map((tournament) => ({
        id: tournament.id,
        name: tournament.name,
        position: [tournament.coordinates!.lat, tournament.coordinates!.lng] as [number, number],
        info: `${tournament.prize} • ${tournament.players.current}/${tournament.players.max} players`,
        image: tournament.image,
      }));
  }, [filteredTournaments]);

  return (
    <>
      <Helmet>
        <title>Chess Tournaments | Find & Join Chess Competitions | ChessFam</title>
        <meta
          name="description"
          content={`Browse ${filteredTournaments.length}+ chess tournaments. Find classical, rapid, blitz, and bullet chess competitions near you or online. Register for USCF rated tournaments on ChessFam.`}
        />
        <meta property="og:title" content="Chess Tournaments | Find & Join Chess Competitions | ChessFam" />
        <meta
          property="og:description"
          content={`Browse ${filteredTournaments.length}+ chess tournaments. Find classical, rapid, blitz, and bullet chess competitions near you or online.`}
        />
        <meta property="og:url" content="https://chessfam.com/tournaments" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Chess Tournaments | Find & Join Chess Competitions | ChessFam" />
        <meta
          name="twitter:description"
          content={`Browse ${filteredTournaments.length}+ chess tournaments. Find chess competitions near you or online.`}
        />
        <link rel="canonical" href="https://chessfam.com/tournaments" />

        {/* ItemList Schema for SEO */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": "Chess Tournaments",
            "description": "Browse chess tournaments including classical, rapid, blitz, and bullet competitions",
            "numberOfItems": filteredTournaments.length,
            "itemListElement": filteredTournaments.slice(0, 10).map((tournament, index) => ({
              "@type": "ListItem",
              "position": index + 1,
              "item": {
                "@type": "SportsEvent",
                "@id": `https://chessfam.com/tournament/${tournament.id}`,
                "name": tournament.name,
                "startDate": tournament.date,
                "location": {
                  "@type": "Place",
                  "name": tournament.location
                },
                "offers": {
                  "@type": "Offer",
                  "price": tournament.entryFee,
                  "priceCurrency": "USD"
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
        <h1 className="text-2xl font-display font-bold text-white">Tournaments</h1>
        <button
          onClick={() => navigate('/tournaments/create')}
          className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-chess-darker font-semibold rounded-xl hover:bg-gold-400 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create
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
              placeholder="Search tournaments..."
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl
                       text-white placeholder-white/30 focus:border-primary-500 focus:outline-none"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-3 rounded-xl flex items-center gap-2 transition-colors
                      ${showFilters ? 'bg-primary-500 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}
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
            {/* Type Filter */}
            <div>
              <h3 className="text-sm font-medium text-white/70 mb-2">Time Control</h3>
              <div className="flex flex-wrap gap-2">
                {types.map((type) => (
                  <button
                    key={type}
                    onClick={() => toggleType(type)}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-colors
                              ${selectedTypes.includes(type)
                                ? typeColors[type]
                                : 'bg-white/5 text-white/70 border-transparent hover:bg-white/10'
                              }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Location Filter */}
            <div>
              <h3 className="text-sm font-medium text-white/70 mb-2">Location</h3>
              <div className="flex gap-2">
                {[
                  { value: 'all', label: 'All' },
                  { value: 'online', label: 'Online' },
                  { value: 'inperson', label: 'In-Person' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setLocationFilter(option.value as typeof locationFilter)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors
                              ${locationFilter === option.value
                                ? 'bg-primary-500 text-white'
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
                setSelectedTypes([]);
                setLocationFilter('all');
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
          {loading ? 'Loading...' : `${filteredTournaments.length} tournament${filteredTournaments.length !== 1 ? 's' : ''} found`}
        </p>
        <button
          onClick={() => setShowMap(!showMap)}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-colors ${
            showMap
              ? 'bg-primary-500 text-white'
              : 'bg-white/5 text-white/50 hover:bg-white/10'
          }`}
        >
          <MapIcon className="w-5 h-5" />
          {showMap ? 'Hide Map' : 'Show Map'}
        </button>
      </div>

      {/* Map View (Toggle) */}
      {showMap && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Map
            markers={mapMarkers}
            onMarkerClick={(id) => {
              // Find tournament by id to get name for slug
              const tournament = filteredTournaments.find(t => t.id === id);
              if (tournament) {
                navigate(buildTournamentUrl(id, tournament.name));
              } else {
                navigate(`/tournament/${id}`);
              }
            }}
            markerColor="#6366f1"
            height="400px"
          />
          <p className="text-xs text-white/40 mt-2 text-center">
            Only showing in-person tournaments
          </p>
        </motion.div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      )}

      {/* Tournaments Grid (matching MastersList) */}
      {!loading && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredTournaments.map((tournament, index) => (
            <motion.div
              key={tournament.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => navigate(buildTournamentUrl(tournament.id, tournament.name))}
              className="bg-white/5 rounded-xl p-4 cursor-pointer hover:bg-white/10
                       transition-all group border border-transparent hover:border-primary-500/30"
            >
              <div className="relative mb-3">
                <img
                  src={tournament.image}
                  alt={tournament.name}
                  className="w-full aspect-square rounded-xl object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=600&h=400&fit=crop';
                  }}
                />
                <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-2">
                  {tournament.status === 'completed' && (
                    <div className="px-2 py-1 bg-gray-500/80 backdrop-blur-sm text-white text-xs font-bold rounded">
                      Completed
                    </div>
                  )}
                  {tournament.status === 'upcoming' && (
                    <div className="px-2 py-1 bg-green-500/80 backdrop-blur-sm text-white text-xs font-bold rounded">
                      Upcoming
                    </div>
                  )}
                  {tournament.status === 'ongoing' && (
                    <div className="px-2 py-1 bg-blue-500/80 backdrop-blur-sm text-white text-xs font-bold rounded">
                      Ongoing
                    </div>
                  )}
                  {tournament.featured && (
                    <div className="ml-auto px-2 py-1 bg-gold-500 text-chess-darker text-xs font-bold rounded">
                      Featured
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 mb-1">
                <Trophy className="w-4 h-4 text-gold-400" />
                <span className="text-sm font-medium text-white">{tournament.prize}</span>
              </div>
              <h3 className="font-semibold text-white group-hover:text-primary-400 transition-colors truncate">
                {tournament.name}
              </h3>
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium mt-1 ${typeColors[tournament.type] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                {tournament.type}
              </span>
              <div className="flex items-center gap-2 mt-2 text-xs text-white/50">
                <Calendar className="w-3 h-3" />
                {tournament.date}
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1 text-xs text-white/50">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate max-w-[80px]">{tournament.location}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-white/50">
                  <Users className="w-3 h-3" />
                  {tournament.players.current}/{tournament.players.max}
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between">
                <span className="text-xs text-white/40">Entry</span>
                <span className="text-sm font-bold text-white">${tournament.entryFee}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {!loading && filteredTournaments.length === 0 && (
        <div className="text-center py-12">
          <p className="text-white/50">No tournaments found matching your criteria</p>
        </div>
      )}
    </div>
    </>
  );
};

export default TournamentsList;
