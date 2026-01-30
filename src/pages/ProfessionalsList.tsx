import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  UserPlus,
  Award,
  Camera,
  Mic,
  Users,
  Code,
  Pen,
  Video,
  BarChart3,
  Laptop,
  PenTool,
  Film
} from 'lucide-react';
import { professionalsApi } from '../api/professionals';

interface Professional {
  id: number;
  name: string;
  professional_type: string;
  profile_image?: string;
  bio?: string;
  average_rating: number;
  total_reviews: number;
  city?: string;
  country?: string;
  remote_available: boolean;
  experience_years?: number;
  specialties?: string[];
}

const PROFESSIONAL_TYPES = [
  { value: 'all', label: 'All Professionals', icon: Users },
  { value: 'coach', label: 'Coaches', icon: Award },
  { value: 'arbiter', label: 'Arbiters', icon: Award },
  { value: 'photographer', label: 'Photographers', icon: Camera },
  { value: 'videographer', label: 'Videographers', icon: Video },
  { value: 'analyst', label: 'Analysts', icon: BarChart3 },
  { value: 'commentator', label: 'Commentators', icon: Mic },
  { value: 'influencer', label: 'Influencers', icon: Users },
  { value: 'writer', label: 'Writers', icon: Pen },
  { value: 'dgt_operator', label: 'DGT Operators', icon: Laptop },
  { value: 'programmer', label: 'Programmers', icon: Code },
  { value: 'editor', label: 'Editors', icon: PenTool },
  { value: 'designer', label: 'Designers', icon: PenTool },
  { value: 'producer', label: 'Producers', icon: Film }
];

export default function ProfessionalsList() {
  const navigate = useNavigate();
  const { type } = useParams();

  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>(type || 'all');
  const [sortBy, setSortBy] = useState<'rating' | 'experience' | 'reviews'>('rating');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const limit = 20;

  useEffect(() => {
    fetchProfessionals();
  }, [selectedType, sortBy, page, searchQuery]);

  const fetchProfessionals = async () => {
    try {
      setLoading(true);

      let result;
      if (searchQuery) {
        result = await professionalsApi.searchProfessionals(searchQuery, {
          professional_type: selectedType !== 'all' ? selectedType : undefined,
          page,
          limit
        });
      } else {
        result = await professionalsApi.getProfessionals({
          professional_type: selectedType !== 'all' ? selectedType : undefined,
          verified: true,
          available: true,
          sort_by: sortBy,
          sort_order: 'desc',
          page,
          limit
        });
      }

      setProfessionals(result.data.data || result.data.professionals || []);
      setTotal(result.data.total || 0);
    } catch (error) {
      console.error('Failed to fetch professionals:', error);
      setProfessionals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    setPage(1);
    if (type !== 'all') {
      navigate(`/professionals/${type}`);
    } else {
      navigate('/professionals');
    }
  };

  const getProfessionalTypeLabel = (type: string): string => {
    const typeObj = PROFESSIONAL_TYPES.find(t => t.value === type);
    return typeObj?.label || type;
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-2">
                Hire a Pro
              </h1>
              <p className="text-white/60 text-lg">
                Find and book top chess professionals for your needs
              </p>
            </div>

            <button
              onClick={() => navigate('/professionals/apply')}
              className="px-6 py-3 bg-gold-500 hover:bg-gold-600 text-chess-darker font-bold rounded-xl transition-colors flex items-center gap-2"
            >
              <UserPlus className="w-5 h-5" />
              <span className="hidden md:inline">Become a Professional</span>
              <span className="md:hidden">Apply</span>
            </button>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 text-sm text-white/60">
            <span>{total} professionals available</span>
            <span>•</span>
            <span>{PROFESSIONAL_TYPES.length - 1} categories</span>
          </div>
        </motion.div>

        {/* Type Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 overflow-x-auto"
        >
          <div className="flex gap-2 pb-2 min-w-max">
            {PROFESSIONAL_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.value}
                  onClick={() => handleTypeChange(type.value)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                    selectedType === type.value
                      ? 'bg-gold-500 text-chess-darker'
                      : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {type.label}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                placeholder="Search professionals..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
              />
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-gold-500/50"
            >
              <option value="rating">Highest Rated</option>
              <option value="experience">Most Experienced</option>
              <option value="reviews">Most Reviewed</option>
            </select>

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-colors flex items-center gap-2"
            >
              <Filter className="w-5 h-5" />
              Filters
            </button>
          </div>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="bg-white/5 rounded-xl p-6 animate-pulse"
              >
                <div className="w-20 h-20 bg-white/10 rounded-full mx-auto mb-4" />
                <div className="h-6 bg-white/10 rounded mb-2" />
                <div className="h-4 bg-white/10 rounded w-2/3 mx-auto" />
              </div>
            ))}
          </div>
        )}

        {/* Professionals Grid */}
        {!loading && professionals.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {professionals.map((professional, index) => (
              <motion.div
                key={professional.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => navigate(`/professional/${professional.id}`)}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 cursor-pointer hover:bg-white/10 hover:border-gold-500/30 transition-all group"
              >
                {/* Profile Image */}
                <div className="w-20 h-20 bg-white/10 rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden">
                  {professional.profile_image ? (
                    <img
                      src={professional.profile_image}
                      alt={professional.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl text-white/40">
                      {professional.name.charAt(0)}
                    </span>
                  )}
                </div>

                {/* Name */}
                <h3 className="text-lg font-bold text-white text-center mb-1 group-hover:text-gold-400 transition-colors">
                  {professional.name}
                </h3>

                {/* Type Badge */}
                <div className="flex justify-center mb-3">
                  <span className="px-3 py-1 bg-gold-500/20 text-gold-400 text-xs font-medium rounded-full">
                    {getProfessionalTypeLabel(professional.professional_type)}
                  </span>
                </div>

                {/* Rating */}
                {professional.total_reviews > 0 && (
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-400">★</span>
                      <span className="text-white font-medium">
                        {professional.average_rating.toFixed(1)}
                      </span>
                    </div>
                    <span className="text-white/40 text-sm">
                      ({professional.total_reviews} reviews)
                    </span>
                  </div>
                )}

                {/* Location */}
                {(professional.city || professional.remote_available) && (
                  <div className="text-center text-sm text-white/60 mb-3">
                    {professional.city && professional.country && (
                      <span>{professional.city}, {professional.country}</span>
                    )}
                    {professional.remote_available && (
                      <span className="text-green-400 ml-2">
                        • Remote Available
                      </span>
                    )}
                  </div>
                )}

                {/* Specialties */}
                {professional.specialties && professional.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-1 justify-center">
                    {professional.specialties.slice(0, 3).map((specialty, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-white/5 text-white/60 text-xs rounded"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && professionals.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 bg-white/5 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Users className="w-10 h-10 text-white/40" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">
              No professionals found
            </h3>
            <p className="text-white/60 mb-6">
              {searchQuery
                ? 'Try adjusting your search query'
                : 'No professionals available in this category yet'}
            </p>
            {selectedType !== 'all' && (
              <button
                onClick={() => handleTypeChange('all')}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
              >
                View All Professionals
              </button>
            )}
          </motion.div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 flex justify-center gap-2"
          >
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
            >
              Previous
            </button>

            <div className="flex items-center gap-2">
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const pageNum = page <= 3 ? i + 1 : page - 2 + i;
                if (pageNum > totalPages) return null;

                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      page === pageNum
                        ? 'bg-gold-500 text-chess-darker font-bold'
                        : 'bg-white/5 text-white hover:bg-white/10'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
            >
              Next
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
