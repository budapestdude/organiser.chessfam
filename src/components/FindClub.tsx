import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Users, Star, Clock, ChevronRight, Search, Filter } from 'lucide-react';
import { clubsApi } from '../api/clubs';

const FindClub = () => {
  const [clubs, setClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClubs = async () => {
      try {
        setLoading(true);
        const response = await clubsApi.getClubs({ limit: 8, is_active: true });
        // Response structure: { success: true, data: { clubs, total }, meta }
        setClubs(response.data.data?.clubs || []);
      } catch (err) {
        console.error('Failed to fetch clubs:', err);
        setError('Failed to load clubs');
      } finally {
        setLoading(false);
      }
    };

    fetchClubs();
  }, []);
  return (
    <section id="find-club" className="py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px]
                      bg-gradient-radial from-gold-500/5 via-transparent to-transparent rounded-full" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-green-500/10 border border-green-500/20
                        text-green-400 text-sm font-medium mb-4">
            Find a Club
          </span>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
            Join Your Local <span className="gradient-text">Chess Community</span>
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Discover chess clubs in your area. From casual meetups to competitive venues,
            find the perfect place to play and grow.
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="max-w-3xl mx-auto mb-12"
        >
          <div className="glass-card p-2 flex flex-col sm:flex-row gap-2">
            <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-white/5 rounded-xl">
              <Search className="w-5 h-5 text-white/40" />
              <input
                type="text"
                placeholder="Enter your city or zip code..."
                className="flex-1 bg-transparent text-white placeholder-white/40 outline-none"
              />
            </div>
            <button className="flex items-center justify-center gap-2 px-6 py-3 bg-white/5 rounded-xl
                             text-white/70 hover:bg-white/10 transition-colors">
              <Filter className="w-5 h-5" />
              Filters
            </button>
            <button className="px-8 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-chess-darker
                             font-semibold rounded-xl hover:from-gold-400 hover:to-gold-500 transition-all">
              Search
            </button>
          </div>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block w-12 h-12 border-4 border-gold-400/30 border-t-gold-400 rounded-full animate-spin"></div>
            <p className="text-white/60 mt-4">Loading clubs...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-12">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && clubs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-white/60">No clubs found</p>
          </div>
        )}

        {/* Clubs Grid */}
        {!loading && !error && clubs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {clubs.map((club, index) => (
            <motion.div
              key={club.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="glass-card overflow-hidden group hover:border-gold-500/30 transition-all duration-500"
            >
              <div className="flex flex-col sm:flex-row">
                {/* Image */}
                <div className="relative sm:w-48 h-48 sm:h-auto flex-shrink-0 overflow-hidden">
                  <img
                    src={club.image}
                    alt={club.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  {club.featured && (
                    <div className="absolute top-3 left-3 px-2 py-1 bg-gold-500 text-chess-darker text-xs font-semibold rounded">
                      Featured
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-white group-hover:text-gold-400 transition-colors">
                        {club.name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-white/50 mt-1">
                        <MapPin className="w-4 h-4" />
                        {club.city}, {club.country || club.state}
                      </div>
                    </div>
                    {club.rating && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded-lg">
                        <Star className="w-4 h-4 text-gold-400 fill-gold-400" />
                        <span className="text-sm font-semibold text-white">{club.rating}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-white/50 mb-3">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {club.member_count || 0} members
                    </div>
                    {club.meeting_schedule && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {club.meeting_schedule}
                      </div>
                    )}
                  </div>

                  {club.description && (
                    <p className="text-sm text-white/60 mb-4 line-clamp-2">
                      {club.description}
                    </p>
                  )}

                  <button className="w-full px-4 py-2.5 bg-white/5 hover:bg-gold-500 text-white hover:text-chess-darker
                                   rounded-lg font-medium text-sm transition-all duration-300 flex items-center justify-center gap-1">
                    View Club
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
          </div>
        )}

        {/* Map Placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 glass-card p-8 text-center"
        >
          <MapPin className="w-12 h-12 text-gold-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Interactive Map Coming Soon</h3>
          <p className="text-white/50 mb-4">
            We're building an interactive map to help you discover clubs visually.
          </p>
          <button className="btn-secondary inline-flex items-center gap-2">
            Get Notified
            <ChevronRight className="w-5 h-5" />
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default FindClub;
