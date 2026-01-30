import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, Trophy, Filter, X, Calendar, MapPin, Users, Map as MapIcon, List, Plus } from 'lucide-react';
import { tournaments } from '../data';
import Map from '../components/Map';

const TournamentsList = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [locationFilter, setLocationFilter] = useState<'all' | 'online' | 'inperson'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  const types = ['Classical', 'Rapid', 'Blitz', 'Bullet'];

  const filteredTournaments = useMemo(() => {
    return tournaments.filter((tournament) => {
      const matchesSearch = tournament.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedTypes.length === 0 || selectedTypes.includes(tournament.type);
      const matchesLocation =
        locationFilter === 'all' ||
        (locationFilter === 'online' && tournament.location === 'Online') ||
        (locationFilter === 'inperson' && tournament.location !== 'Online');
      return matchesSearch && matchesType && matchesLocation;
    });
  }, [searchQuery, selectedTypes, locationFilter]);

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

      {/* Results Count & View Toggle */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-white/50 text-sm">
          {filteredTournaments.length} tournament{filteredTournaments.length !== 1 ? 's' : ''} found
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'list'
                ? 'bg-primary-500 text-white'
                : 'bg-white/5 text-white/50 hover:bg-white/10'
            }`}
          >
            <List className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'map'
                ? 'bg-primary-500 text-white'
                : 'bg-white/5 text-white/50 hover:bg-white/10'
            }`}
          >
            <MapIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Map View */}
      {viewMode === 'map' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Map
            markers={mapMarkers}
            onMarkerClick={(id) => navigate(`/tournament/${id}`)}
            markerColor="#6366f1"
            height="400px"
          />
          <p className="text-xs text-white/40 mt-2 text-center">
            Only showing in-person tournaments
          </p>
        </motion.div>
      )}

      {/* Tournaments List */}
      <div className={`space-y-4 ${viewMode === 'map' ? 'hidden md:block' : ''}`}>
        {filteredTournaments.map((tournament, index) => (
          <motion.div
            key={tournament.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => navigate(`/tournament/${tournament.id}`)}
            className="bg-white/5 rounded-xl p-4 cursor-pointer hover:bg-white/10
                     transition-all group border border-transparent hover:border-primary-500/30"
          >
            <div className="flex flex-col md:flex-row gap-4">
              <img
                src={tournament.image}
                alt={tournament.name}
                className="w-full md:w-32 h-32 rounded-xl object-cover"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeColors[tournament.type]}`}>
                    {tournament.type}
                  </span>
                  {tournament.featured && (
                    <span className="px-2 py-0.5 bg-gold-500/20 text-gold-400 rounded text-xs font-medium">
                      Featured
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-white group-hover:text-primary-400 transition-colors">
                  {tournament.name}
                </h3>
                <div className="flex flex-wrap gap-4 mt-2 text-sm text-white/60">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {tournament.date}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {tournament.location}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {tournament.players.current}/{tournament.players.max}
                  </div>
                </div>
              </div>
              <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-2">
                <div className="flex items-center gap-1">
                  <Trophy className="w-5 h-5 text-gold-400" />
                  <span className="text-xl font-bold text-white">{tournament.prize}</span>
                </div>
                <span className="text-sm text-white/50">Entry: ${tournament.entryFee}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredTournaments.length === 0 && (
        <div className="text-center py-12">
          <p className="text-white/50">No tournaments found matching your criteria</p>
        </div>
      )}
    </div>
  );
};

export default TournamentsList;
