import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, Filter, X, MapPin, Users, Clock, Map as MapIcon, List, Coffee, Book, Trees, Building, Wine } from 'lucide-react';
import { gameLocations } from '../data';
import { venuesApi } from '../api/venues';
import Map from '../components/Map';

const LocationsList = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'distance' | 'rating' | 'active'>('distance');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [approvedVenues, setApprovedVenues] = useState<any[]>([]);

  const types = ['Park', 'Cafe', 'Library', 'Plaza', 'Bar', 'Club', 'Community Center', 'Other'];

  useEffect(() => {
    const fetchApprovedVenues = async () => {
      try {
        const response = await venuesApi.getApprovedVenues();
        setApprovedVenues(response.data || []);
      } catch (error) {
        console.error('Error fetching approved venues:', error);
      }
    };
    fetchApprovedVenues();
  }, []);

  // Convert approved venues to location format and merge with hardcoded locations
  const allLocations = useMemo(() => {
    const convertedVenues = approvedVenues.map(venue => ({
      id: 1000 + venue.id,
      name: venue.venue_name,
      type: venue.venue_type === 'community_center' ? 'Community Center' :
            venue.venue_type.charAt(0).toUpperCase() + venue.venue_type.slice(1),
      location: `${venue.city}, ${venue.country}`,
      address: venue.address,
      image: venue.image_url || 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800',
      rating: 4.5,
      distance: '0.5 mi',
      activeGames: 0,
      description: venue.description || '',
      amenities: venue.amenities || [],
      hours: venue.opening_hours || 'Hours not specified',
      busyHours: [],
      coordinates: { lat: 40.7, lng: -74.0 }
    }));

    return [...gameLocations, ...convertedVenues];
  }, [approvedVenues]);

  const filteredLocations = useMemo(() => {
    return allLocations
      .filter((location) => {
        const matchesSearch =
          location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          location.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
          location.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = selectedTypes.length === 0 || selectedTypes.includes(location.type);
        return matchesSearch && matchesType;
      })
      .sort((a, b) => {
        if (sortBy === 'distance') return parseFloat(a.distance) - parseFloat(b.distance);
        if (sortBy === 'rating') return b.rating - a.rating;
        return b.activeGames - a.activeGames;
      });
  }, [searchQuery, selectedTypes, sortBy, allLocations]);

  const toggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const typeColors: Record<string, string> = {
    Park: 'bg-green-500/20 text-green-400 border-green-500/30',
    Cafe: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    Library: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    Plaza: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    Bar: 'bg-red-500/20 text-red-400 border-red-500/30',
    Club: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    'Community Center': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    Other: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };

  const typeIcons: Record<string, typeof Trees> = {
    Park: Trees,
    Cafe: Coffee,
    Library: Book,
    Plaza: Building,
    Bar: Wine,
    Club: Users,
    'Community Center': Building,
    Other: MapPin,
  };

  const mapMarkers = useMemo(() => {
    return filteredLocations.map((location) => ({
      id: location.id,
      name: location.name,
      position: [location.coordinates.lat, location.coordinates.lng] as [number, number],
      info: `${location.activeGames} active games • ${location.rating}★`,
      image: location.image,
    }));
  }, [filteredLocations]);

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
        <h1 className="text-2xl font-display font-bold text-white">Find a Game</h1>
        <div className="w-16" />
      </motion.div>

      {/* Quick Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-gradient-to-r from-orange-500/20 to-orange-600/20 border border-orange-500/30
                 rounded-xl p-4 mb-6"
      >
        <div className="flex items-center gap-3">
          <MapPin className="w-5 h-5 text-orange-400" />
          <div>
            <h3 className="font-semibold text-white">Casual Chess Spots</h3>
            <p className="text-sm text-white/60">Drop in anytime - no membership required!</p>
          </div>
        </div>
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
              placeholder="Search locations..."
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

        {/* Filters Panel */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-white/5 rounded-xl p-4 space-y-4"
          >
            {/* Type Filter */}
            <div>
              <h3 className="text-sm font-medium text-white/70 mb-2">Venue Type</h3>
              <div className="flex flex-wrap gap-2">
                {types.map((type) => {
                  const Icon = typeIcons[type];
                  return (
                    <button
                      key={type}
                      onClick={() => toggleType(type)}
                      className={`px-3 py-1.5 rounded-lg text-sm border transition-colors flex items-center gap-1.5
                                ${selectedTypes.includes(type)
                                  ? typeColors[type]
                                  : 'bg-white/5 text-white/70 border-transparent hover:bg-white/10'
                                }`}
                    >
                      <Icon className="w-4 h-4" />
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sort */}
            <div>
              <h3 className="text-sm font-medium text-white/70 mb-2">Sort By</h3>
              <div className="flex gap-2">
                {[
                  { value: 'distance', label: 'Distance' },
                  { value: 'rating', label: 'Rating' },
                  { value: 'active', label: 'Active Games' },
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
                setSelectedTypes([]);
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
          {filteredLocations.length} location{filteredLocations.length !== 1 ? 's' : ''} found
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
      {viewMode === 'map' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Map
            markers={mapMarkers}
            onMarkerClick={(id) => navigate(`/location/${id}`)}
            markerColor="#f97316"
            height="400px"
          />
        </motion.div>
      )}

      {/* Locations List */}
      <div className={`space-y-4 ${viewMode === 'map' ? 'hidden md:block' : ''}`}>
        {filteredLocations.map((location, index) => {
          const Icon = typeIcons[location.type];
          return (
            <motion.div
              key={location.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => navigate(`/location/${location.id}`)}
              className="bg-white/5 rounded-xl p-4 cursor-pointer hover:bg-white/10
                       transition-all group border border-transparent hover:border-orange-500/30"
            >
              <div className="flex flex-col md:flex-row gap-4">
                <img
                  src={location.image}
                  alt={location.name}
                  className="w-full md:w-32 h-32 rounded-xl object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium border flex items-center gap-1 ${typeColors[location.type]}`}>
                      <Icon className="w-3 h-3" />
                      {location.type}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-white group-hover:text-orange-400 transition-colors">
                    {location.name}
                  </h3>
                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-white/60">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {location.location} • {location.distance}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {location.activeGames} active games
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {location.busyHours}
                    </div>
                  </div>
                  <p className="text-sm text-white/50 mt-2 line-clamp-2">{location.description}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {location.amenities.slice(0, 3).map((amenity: string) => (
                      <span key={amenity} className="px-2 py-0.5 bg-white/5 rounded text-xs text-white/50">
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className="text-2xl font-bold text-white">{location.rating}</span>
                    <span className="text-white/50">★</span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filteredLocations.length === 0 && (
        <div className="text-center py-12">
          <p className="text-white/50">No locations found matching your criteria</p>
        </div>
      )}
    </div>
  );
};

export default LocationsList;
