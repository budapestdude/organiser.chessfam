import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, Filter, X, MapPin, Users, Clock, Map as MapIcon, Coffee, Book, Trees, Building, Wine, Star } from 'lucide-react';
import { venuesApi } from '../api/venues';
import Map from '../components/Map';
import { Helmet } from 'react-helmet-async';

const LocationsList = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'distance' | 'rating' | 'active'>('distance');
  const [showMap, setShowMap] = useState(false);
  const [approvedVenues, setApprovedVenues] = useState<any[]>([]);

  const types = ['Park', 'Cafe', 'Library', 'Plaza', 'Bar', 'Club', 'Community Center', 'Other'];

  useEffect(() => {
    const fetchApprovedVenues = async () => {
      try {
        const response = await venuesApi.getApprovedVenues();
        console.log('[LocationsList] Raw API response:', response);
        console.log('[LocationsList] response.data:', response.data);
        console.log('[LocationsList] response.data.data:', response.data?.data);

        // Handle nested data structure from API
        const venues = response.data?.data || response.data || [];
        console.log('[LocationsList] Extracted venues:', venues);
        setApprovedVenues(venues);
      } catch (error) {
        console.error('[LocationsList] Error fetching approved venues:', error);
      }
    };
    fetchApprovedVenues();
  }, []);

  // Convert approved venues to location format
  const allLocations = useMemo(() => {
    console.log('[LocationsList] Converting venues, count:', approvedVenues.length);
    if (approvedVenues.length > 0) {
      console.log('[LocationsList] Sample venue data:', approvedVenues[0]);
    }
    const convertedVenues = approvedVenues.map(venue => {
      // Default coordinates to NYC (latitude/longitude may not be in older records)
      let coords = { lat: 40.7128, lng: -74.0060 };

      // venue_submissions has image_url field (single image)
      let imageUrl = venue.image_url || 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800';

      // Parse amenities if stored as array
      let amenitiesList: string[] = [];
      if (venue.amenities) {
        amenitiesList = typeof venue.amenities === 'string' ? JSON.parse(venue.amenities) : venue.amenities;
      }

      const rating = parseFloat(venue.average_rating) || 0;
      const reviewCount = parseInt(venue.review_count) || 0;

      console.log(`[LocationsList] Venue ${venue.venue_name}: average_rating=${venue.average_rating}, parsed rating=${rating}, reviewCount=${reviewCount}`);

      return {
        id: 1000 + venue.id,
        name: venue.venue_name,
        type: venue.venue_type === 'community_center' ? 'Community Center' :
              (venue.venue_type || 'Other').charAt(0).toUpperCase() + (venue.venue_type || 'other').slice(1),
        location: venue.city ? `${venue.city}${venue.country ? ', ' + venue.country : ''}` : 'Location not set',
        address: venue.address || '',
        image: imageUrl,
        rating,
        reviewCount,
        distance: '-- mi', // Would need user geolocation to calculate
        activeGames: 0, // Not tracked in submissions
        description: venue.description || '',
        amenities: amenitiesList,
        hours: venue.opening_hours || 'Hours not specified',
        busyHours: [],
        coordinates: coords
      };
    });

    console.log('[LocationsList] Returning converted venues:', convertedVenues);
    return convertedVenues;
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
    <>
      <Helmet>
        <title>Chess Venues & Locations Near You | Find Places to Play | ChessFam</title>
        <meta
          name="description"
          content={`Discover ${filteredLocations.length}+ chess venues, parks, cafes, and clubs where you can play chess. Find the perfect location for casual games, tournaments, or chess meetups.`}
        />
        <meta property="og:title" content="Chess Venues & Locations Near You | Find Places to Play | ChessFam" />
        <meta
          property="og:description"
          content={`Discover ${filteredLocations.length}+ chess venues and locations. Find places to play chess near you.`}
        />
        <meta property="og:url" content="https://chessfam.com/locations" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Chess Venues & Locations Near You | Find Places to Play | ChessFam" />
        <meta
          name="twitter:description"
          content={`Discover ${filteredLocations.length}+ chess venues and locations near you.`}
        />
        <link rel="canonical" href="https://chessfam.com/locations" />

        {/* ItemList Schema for SEO */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": "Chess Venues and Locations",
            "description": "Browse chess playing venues including parks, cafes, clubs, and community centers",
            "numberOfItems": filteredLocations.length,
            "itemListElement": filteredLocations.slice(0, 10).map((location: any, index: number) => ({
              "@type": "ListItem",
              "position": index + 1,
              "item": {
                "@type": "Place",
                "@id": `https://chessfam.com/location/${location.id}`,
                "name": location.name,
                "description": location.type
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

      {/* Results Count & Map Toggle */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-white/50 text-sm">
          {filteredLocations.length} location{filteredLocations.length !== 1 ? 's' : ''} found
        </p>
        <button
          onClick={() => setShowMap(!showMap)}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-colors ${
            showMap
              ? 'bg-orange-500 text-white'
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
            onMarkerClick={(id) => navigate(`/location/${id}`)}
            markerColor="#f97316"
            height="400px"
          />
        </motion.div>
      )}

      {/* Locations Grid (matching MastersList) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
              <div className="relative mb-3">
                <img
                  src={location.image}
                  alt={location.name}
                  className="w-full aspect-square rounded-xl object-cover"
                />
                {location.activeGames > 0 && (
                  <div className="absolute top-2 right-2 px-2 py-1 bg-green-500 text-white text-xs font-bold rounded flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {location.activeGames} active
                  </div>
                )}
              </div>
              {location.rating > 0 ? (
                <div className="flex items-center gap-1 mb-1">
                  <Star className="w-4 h-4 text-gold-400 fill-gold-400" />
                  <span className="text-sm font-medium text-white">{location.rating.toFixed(1)}</span>
                  {location.reviewCount > 0 && (
                    <span className="text-xs text-white/50">({location.reviewCount})</span>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1 mb-1">
                  <Star className="w-4 h-4 text-white/20" />
                  <span className="text-xs text-white/50">No reviews</span>
                </div>
              )}
              <h3 className="font-semibold text-white group-hover:text-orange-400 transition-colors truncate">
                {location.name}
              </h3>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium mt-1 ${typeColors[location.type]}`}>
                <Icon className="w-3 h-3" />
                {location.type}
              </span>
              <div className="flex items-center gap-1 mt-2 text-xs text-white/50">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{location.location}</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="text-xs text-orange-400">
                  {location.distance}
                </div>
                <div className="flex items-center gap-1 text-xs text-white/50">
                  <Clock className="w-3 h-3" />
                  <span className="truncate max-w-[60px]">{(location as any).hours || location.busyHours}</span>
                </div>
              </div>
              {location.amenities && location.amenities.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {location.amenities.slice(0, 2).map((amenity: string) => (
                    <span key={amenity} className="px-2 py-0.5 bg-white/5 rounded text-xs text-white/50">
                      {amenity}
                    </span>
                  ))}
                </div>
              )}
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
    </>
  );
};

export default LocationsList;
