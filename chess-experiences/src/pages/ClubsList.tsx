import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, Star, Filter, X, MapPin, Users, Clock, Map as MapIcon, List, Plus } from 'lucide-react';
import { clubs } from '../data';
import Map from '../components/Map';

const ClubsList = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'distance' | 'rating' | 'members'>('distance');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

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
  }, [searchQuery, selectedTags, sortBy]);

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
          {filteredClubs.length} club{filteredClubs.length !== 1 ? 's' : ''} found
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'list'
                ? 'bg-green-500 text-white'
                : 'bg-white/5 text-white/50 hover:bg-white/10'
            }`}
          >
            <List className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'map'
                ? 'bg-green-500 text-white'
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
            onMarkerClick={(id) => navigate(`/club/${id}`)}
            markerColor="#22c55e"
            height="400px"
          />
        </motion.div>
      )}

      {/* Clubs Grid */}
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${viewMode === 'map' ? 'hidden md:grid' : ''}`}>
        {filteredClubs.map((club, index) => (
          <motion.div
            key={club.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => navigate(`/club/${club.id}`)}
            className="bg-white/5 rounded-xl overflow-hidden cursor-pointer hover:bg-white/10
                     transition-all group border border-transparent hover:border-green-500/30"
          >
            <div className="flex">
              <img
                src={club.image}
                alt={club.name}
                className="w-32 h-full object-cover"
              />
              <div className="flex-1 p-4">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-white group-hover:text-green-400 transition-colors">
                    {club.name}
                  </h3>
                  {club.featured && (
                    <span className="px-2 py-0.5 bg-gold-500 text-chess-darker text-xs font-medium rounded">
                      Featured
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-white/60 mb-2">
                  <MapPin className="w-4 h-4" />
                  {club.location}
                  <span className="text-green-400">• {club.distance}</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-white/50">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-gold-400 fill-gold-400" />
                    {club.rating}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {club.members}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Open
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {club.tags.slice(0, 2).map((tag) => (
                    <span key={tag} className="px-2 py-0.5 bg-white/5 rounded text-xs text-white/50">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredClubs.length === 0 && (
        <div className="text-center py-12">
          <p className="text-white/50">No clubs found matching your criteria</p>
        </div>
      )}
    </div>
  );
};

export default ClubsList;
