import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, Star, Filter, X, Map as MapIcon, List, Loader2, Crown } from 'lucide-react';
import { mastersApi } from '../api/masters';
import type { Master } from '../api/masters';
import Map from '../components/Map';
import Pagination from '../components/Pagination';
import { Helmet } from 'react-helmet-async';

// Transform API master to display format
interface DisplayMaster {
  id: number;
  name: string;
  image: string;
  rating: number;
  avgRating: number;
  reviews: number;
  price: number;
  title: string;
  specialty: string;
  available: boolean;
  coordinates?: { lat: number; lng: number };
}

const transformMaster = (master: Master): DisplayMaster => ({
  id: master.id,
  name: master.name || master.user_name || 'Unknown',
  image: master.profile_image || master.user_avatar || '/images/default-avatar.jpg',
  rating: master.rating,
  avgRating: 4.8, // Default since API doesn't have reviews yet
  reviews: 0,
  price: master.price_blitz || master.price_rapid || master.price_bullet || master.price_classical || 50,
  title: master.title,
  specialty: master.specialties?.[0] || 'General',
  available: master.available,
  coordinates: undefined // API doesn't have coordinates yet
});

const MastersList = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [selectedTitles, setSelectedTitles] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'price' | 'rating' | 'reviews'>('rating');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  // Initialize empty - will populate from API only
  const [masters, setMasters] = useState<DisplayMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  // Fetch masters from API
  useEffect(() => {
    const fetchMasters = async () => {
      try {
        setLoading(true);
        const response = await mastersApi.getMasters({ limit: 100 });
        const apiMasters = response?.data?.masters || [];

        if (apiMasters.length > 0) {
          setMasters(apiMasters.map(transformMaster));
          setError(null);
        } else {
          setMasters([]);
        }
      } catch (err) {
        console.error('Failed to fetch masters:', err);
        setError('Failed to load masters');
      } finally {
        setLoading(false);
      }
    };

    fetchMasters();
  }, []);

  const titles = ['Grandmaster', 'International Master', 'Woman Grandmaster'];

  const filteredMasters = useMemo(() => {
    return masters
      .filter((master) => {
        const matchesSearch = master.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          master.specialty.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPrice = master.price >= priceRange[0] && master.price <= priceRange[1];
        const matchesTitle = selectedTitles.length === 0 || selectedTitles.includes(master.title);
        return matchesSearch && matchesPrice && matchesTitle;
      })
      .sort((a, b) => {
        if (sortBy === 'price') return a.price - b.price;
        if (sortBy === 'rating') return b.avgRating - a.avgRating;
        return b.reviews - a.reviews;
      });
  }, [searchQuery, priceRange, selectedTitles, sortBy, masters]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, priceRange, selectedTitles, sortBy]);

  // Paginated masters
  const totalPages = Math.ceil(filteredMasters.length / ITEMS_PER_PAGE);
  const paginatedMasters = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredMasters.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredMasters, currentPage]);

  const toggleTitle = (title: string) => {
    setSelectedTitles((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  const mapMarkers = useMemo(() => {
    return filteredMasters
      .filter((master) => master.coordinates)
      .map((master) => ({
        id: master.id,
        name: master.name,
        position: [master.coordinates!.lat, master.coordinates!.lng] as [number, number],
        rating: master.rating,
        info: `${master.avgRating}★ • $${master.price}`,
        image: master.image,
      }));
  }, [filteredMasters]);

  return (
    <>
      <Helmet>
        <title>Book Chess Lessons with Grandmasters & Coaches | ChessFam</title>
        <meta
          name="description"
          content={`Connect with ${filteredMasters.length}+ chess masters, grandmasters, and coaches. Book private lessons, game analysis, and opening preparation with FIDE-rated instructors.`}
        />
        <meta property="og:title" content="Book Chess Lessons with Grandmasters & Coaches | ChessFam" />
        <meta
          property="og:description"
          content={`Connect with ${filteredMasters.length}+ chess masters and coaches. Book private lessons and improve your game.`}
        />
        <meta property="og:url" content="https://chessfam.com/masters" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Book Chess Lessons with Grandmasters & Coaches | ChessFam" />
        <meta
          name="twitter:description"
          content={`Connect with ${filteredMasters.length}+ chess masters and coaches.`}
        />
        <link rel="canonical" href="https://chessfam.com/masters" />

        {/* ItemList Schema for SEO */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": "Chess Masters and Coaches",
            "description": "Browse grandmasters, international masters, and FIDE-rated chess coaches available for private lessons",
            "numberOfItems": filteredMasters.length,
            "itemListElement": filteredMasters.slice(0, 10).map((master, index) => ({
              "@type": "ListItem",
              "position": index + 1,
              "item": {
                "@type": "Person",
                "@id": `https://chessfam.com/master/${master.id}`,
                "name": master.name,
                "jobTitle": master.title,
                "offers": {
                  "@type": "Offer",
                  "price": master.price,
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
        <h1 className="text-2xl font-display font-bold text-white">Play a Master</h1>
        <button
          onClick={() => navigate('/masters/apply')}
          className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-chess-darker font-semibold rounded-xl hover:bg-gold-400 transition-colors"
        >
          <Crown className="w-4 h-4" />
          Become a Master
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
              placeholder="Search masters..."
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl
                       text-white placeholder-white/30 focus:border-gold-500 focus:outline-none"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-3 rounded-xl flex items-center gap-2 transition-colors
                      ${showFilters ? 'bg-gold-500 text-chess-darker' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}
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
            exit={{ opacity: 0, height: 0 }}
            className="bg-white/5 rounded-xl p-4 space-y-4"
          >
            {/* Title Filter */}
            <div>
              <h3 className="text-sm font-medium text-white/70 mb-2">Title</h3>
              <div className="flex flex-wrap gap-2">
                {titles.map((title) => (
                  <button
                    key={title}
                    onClick={() => toggleTitle(title)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors
                              ${selectedTitles.includes(title)
                                ? 'bg-gold-500 text-chess-darker'
                                : 'bg-white/5 text-white/70 hover:bg-white/10'
                              }`}
                  >
                    {title}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <h3 className="text-sm font-medium text-white/70 mb-2">
                Price Range: ${priceRange[0]} - ${priceRange[1]}
              </h3>
              <input
                type="range"
                min="0"
                max="500"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                className="w-full accent-gold-500"
              />
            </div>

            {/* Sort */}
            <div>
              <h3 className="text-sm font-medium text-white/70 mb-2">Sort By</h3>
              <div className="flex gap-2">
                {[
                  { value: 'rating', label: 'Rating' },
                  { value: 'price', label: 'Price' },
                  { value: 'reviews', label: 'Reviews' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSortBy(option.value as typeof sortBy)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors
                              ${sortBy === option.value
                                ? 'bg-gold-500 text-chess-darker'
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
                setPriceRange([0, 500]);
                setSelectedTitles([]);
                setSortBy('rating');
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
          {loading ? 'Loading...' : `${filteredMasters.length} master${filteredMasters.length !== 1 ? 's' : ''} found`}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'list'
                ? 'bg-gold-500 text-chess-darker'
                : 'bg-white/5 text-white/50 hover:bg-white/10'
            }`}
          >
            <List className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'map'
                ? 'bg-gold-500 text-chess-darker'
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
            onMarkerClick={(id) => navigate(`/master/${id}`)}
            markerColor="#f59e0b"
            height="400px"
          />
        </motion.div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
        </div>
      )}

      {/* Masters Grid */}
      {!loading && (
        <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 ${viewMode === 'map' ? 'hidden md:grid' : ''}`}>
          {paginatedMasters.map((master, index) => (
            <motion.div
              key={master.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => navigate(`/master/${master.id}`)}
              className="bg-white/5 rounded-xl p-4 cursor-pointer hover:bg-white/10
                       transition-all group border border-transparent hover:border-gold-500/30"
            >
              <div className="relative mb-3">
                <img
                  src={master.image}
                  alt={master.name}
                  className="w-full aspect-square rounded-xl object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/default-avatar.jpg';
                  }}
                />
                {master.available ? (
                  <div className="absolute top-2 right-2 w-3 h-3 bg-green-500 rounded-full" />
                ) : (
                  <div className="absolute top-2 right-2 w-3 h-3 bg-white/30 rounded-full" />
                )}
              </div>
              <div className="flex items-center gap-1 mb-1">
                <Star className="w-4 h-4 text-gold-400 fill-gold-400" />
                <span className="text-sm font-medium text-white">{master.avgRating}</span>
                <span className="text-xs text-white/40">({master.reviews})</span>
              </div>
              <h3 className="font-semibold text-white group-hover:text-gold-400 transition-colors truncate">
                {master.name}
              </h3>
              <p className="text-xs text-white/50 mb-2">{master.title}</p>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-white">${master.price}</span>
                <span className="text-xs text-white/40">{master.rating} ELO</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {!loading && filteredMasters.length === 0 && (
        <div className="text-center py-12">
          <p className="text-white/50">No masters found matching your criteria</p>
        </div>
      )}

      {/* Pagination */}
      {!loading && filteredMasters.length > 0 && viewMode === 'list' && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          itemsPerPage={ITEMS_PER_PAGE}
          totalItems={filteredMasters.length}
        />
      )}
    </div>
    </>
  );
};

export default MastersList;
