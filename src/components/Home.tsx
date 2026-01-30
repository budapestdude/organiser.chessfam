import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Crown, Star, Trophy, MapPin, ChevronRight, LogOut, Search, User, MessageSquare, Heart, Briefcase } from 'lucide-react';
import { useStore } from '../store';
import GlobalSearch from './GlobalSearch';
import { tournamentsApi } from '../api/tournaments';
import { clubsApi } from '../api/clubs';
import { communitiesApi } from '../api/communities';
import { mastersApi } from '../api/masters';
import { professionalsApi } from '../api/professionals';

const Home = () => {
  const navigate = useNavigate();
  const user = useStore((state) => state.user);
  const openAuthModal = useStore((state) => state.openAuthModal);
  const logout = useStore((state) => state.logout);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Real data from API
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [clubs, setClubs] = useState<any[]>([]);
  const [venues, setVenues] = useState<any[]>([]);
  const [masters, setMasters] = useState<any[]>([]);
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real data from APIs
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tournamentsRes, clubsRes, communitiesRes, mastersRes, professionalsRes] = await Promise.all([
          tournamentsApi.getTournaments({ limit: 6, upcoming: true }).catch(() => ({ tournaments: [] })),
          clubsApi.getClubs({ limit: 6 }).catch(() => ({ clubs: [] })),
          communitiesApi.getAll({ type: 'venue', limit: 6 }).catch(() => ({ communities: [] })),
          mastersApi.getMasters({ limit: 6 }).catch(() => ({ masters: [] })),
          professionalsApi.getProfessionals({ limit: 6 }).catch(() => ({ data: [] })),
        ]);

        setTournaments(tournamentsRes.tournaments || []);
        setClubs(clubsRes.clubs || []);
        setVenues(communitiesRes.communities || []);
        setMasters(mastersRes.masters || []);
        setProfessionals(professionalsRes.data?.data || professionalsRes.data || []);
      } catch (error) {
        console.error('Error fetching homepage data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Listen for global keyboard shortcut
  useEffect(() => {
    const handleOpenSearch = () => setIsSearchOpen(true);
    window.addEventListener('openSearch', handleOpenSearch);
    return () => window.removeEventListener('openSearch', handleOpenSearch);
  }, []);

  // Limit items to fit in one row (6 items for wider layout)
  const displayMasters = masters.slice(0, 6);
  const displayProfessionals = professionals.slice(0, 6);
  const displayTournaments = tournaments.slice(0, 6);
  const displayClubs = clubs.slice(0, 6);
  const displayVenues = venues.slice(0, 6);

  return (
    <div className="min-h-screen py-6 px-4 md:px-8 lg:px-16 max-w-7xl mx-auto">
      <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-4"
      >
        <div className="flex items-center justify-center gap-2 mb-1">
          <Crown className="w-7 h-7 text-gold-400" />
          <h1 className="text-2xl font-display font-bold text-white">
            Chess<span className="text-gold-400">Fam</span>
          </h1>
        </div>
        <p className="text-white/50 text-xs mb-3">Real people, real chess</p>

        {/* Search Bar */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="w-full max-w-sm mx-auto mb-3 px-3 py-2 bg-white/5 border border-white/10 rounded-lg
                   flex items-center gap-2 text-white/40 hover:bg-white/10 hover:border-white/20 transition-all text-sm"
        >
          <Search className="w-4 h-4" />
          <span>Search...</span>
          <span className="ml-auto text-xs bg-white/10 px-1.5 py-0.5 rounded">⌘K</span>
        </button>

        {/* User Info */}
        {user ? (
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center gap-1 text-white/70 hover:text-white text-xs transition-colors"
            >
              <User className="w-3 h-3" />
              {user.name}
            </button>
            <button
              onClick={() => navigate('/messages')}
              className="flex items-center gap-1 text-white/70 hover:text-white text-xs transition-colors"
            >
              <MessageSquare className="w-3 h-3" />
              Messages
            </button>
            <button
              onClick={() => navigate('/favorites')}
              className="flex items-center gap-1 text-white/70 hover:text-white text-xs transition-colors"
            >
              <Heart className="w-3 h-3" />
              Favorites
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-1 text-white/50 hover:text-white text-xs transition-colors"
            >
              <LogOut className="w-3 h-3" />
              Sign out
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => openAuthModal('login')}
              className="text-white/70 hover:text-white text-xs transition-colors"
            >
              Sign in
            </button>
            <button
              onClick={() => openAuthModal('signup')}
              className="px-3 py-1 bg-gold-500 text-chess-darker text-xs font-medium rounded-lg
                       hover:bg-gold-400 transition-colors"
            >
              Sign up
            </button>
          </div>
        )}
      </motion.div>

      {/* Book a Tournament */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-5"
      >
        <div className="flex items-center justify-center gap-4 mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary-400" />
            <h2 className="text-base font-semibold text-white">Tournaments</h2>
          </div>
          <button
            onClick={() => navigate('/tournaments')}
            className="text-sm text-gold-400 hover:text-gold-300 flex items-center gap-0.5"
          >
            View all <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        {displayTournaments.length === 0 && !loading ? (
          <p className="text-center text-white/50 text-sm py-4">No upcoming tournaments. Create one!</p>
        ) : (
          <div className="flex justify-center gap-8 overflow-x-auto scrollbar-hide pb-2">
            {displayTournaments.map((tournament) => (
              <motion.div
                key={tournament.id}
                whileHover={{ scale: 1.05 }}
                onClick={() => navigate(`/tournament/${tournament.id}`)}
                className="cursor-pointer group flex-shrink-0"
              >
                <div className="relative mb-3">
                  <img
                    src={tournament.image || 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=200&h=200&fit=crop'}
                    alt={tournament.name}
                    className="w-28 h-28 rounded-full object-cover border-3 border-transparent
                             group-hover:border-primary-400 transition-all shadow-lg"
                  />
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1
                                bg-primary-500 rounded-full text-sm font-semibold text-white whitespace-nowrap shadow-md">
                    {tournament.prize_pool ? `$${tournament.prize_pool}` : tournament.tournament_type || 'Open'}
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-base font-medium text-white truncate w-28">{tournament.name}</p>
                  <p className="text-sm text-white/50">{tournament.current_participants || 0}/{tournament.max_participants || '∞'}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.section>

      {/* Find a Game */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-5"
      >
        <div className="flex items-center justify-center gap-4 mb-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-orange-400" />
            <h2 className="text-base font-semibold text-white">Find a Game</h2>
          </div>
          <button
            onClick={() => navigate('/live')}
            className="text-sm text-gold-400 hover:text-gold-300 flex items-center gap-0.5"
          >
            View all <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        {displayVenues.length === 0 && !loading ? (
          <p className="text-center text-white/50 text-sm py-4">No venues yet. Be the first to add one!</p>
        ) : (
          <div className="flex justify-center gap-8 overflow-x-auto scrollbar-hide pb-2">
            {displayVenues.map((venue) => (
              <motion.div
                key={venue.id}
                whileHover={{ scale: 1.05 }}
                onClick={() => navigate(`/community/${venue.slug || venue.id}`)}
                className="cursor-pointer group flex-shrink-0"
              >
                <div className="relative mb-3">
                  <img
                    src={venue.image || 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=200&h=200&fit=crop'}
                    alt={venue.name}
                    className="w-28 h-28 rounded-full object-cover border-3 border-transparent
                             group-hover:border-orange-400 transition-all shadow-lg"
                  />
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1
                                bg-orange-500 rounded-full text-sm font-semibold text-white shadow-md whitespace-nowrap">
                    {venue.city || 'Venue'}
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-base font-medium text-white truncate w-28">{venue.name}</p>
                  <p className="text-sm text-white/50">{venue.member_count || 0} members</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.section>

      {/* Play a Master */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-5"
      >
        <div className="flex items-center justify-center gap-4 mb-3">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-gold-400" />
            <h2 className="text-base font-semibold text-white">Play a Master</h2>
          </div>
          <button
            onClick={() => navigate('/masters')}
            className="text-sm text-gold-400 hover:text-gold-300 flex items-center gap-0.5"
          >
            View all <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        {displayMasters.length === 0 && !loading ? (
          <p className="text-center text-white/50 text-sm py-4">No masters available yet.</p>
        ) : (
          <div className="flex justify-center gap-8 overflow-x-auto scrollbar-hide pb-2">
            {displayMasters.map((master) => (
              <motion.div
                key={master.id}
                whileHover={{ scale: 1.05 }}
                onClick={() => navigate(`/master/${master.id}`)}
                className="cursor-pointer group flex-shrink-0"
              >
                <div className="relative mb-3">
                  <img
                    src={master.image || master.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop'}
                    alt={master.name}
                    className="w-28 h-28 rounded-full object-cover border-3 border-transparent
                             group-hover:border-gold-400 transition-all shadow-lg"
                  />
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1
                                bg-gold-500 rounded-full text-sm font-semibold text-chess-darker shadow-md">
                    ${master.hourly_rate || master.price || 50}
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-base font-medium text-white truncate w-28">{master.name?.split(' ')[1] || master.name?.split(' ')[0] || 'Master'}</p>
                  <p className="text-sm text-white/50">{master.title || master.rating || 'FM'}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.section>

      {/* Hire a Pro */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.225 }}
        className="mb-5"
      >
        <div className="flex items-center justify-center gap-4 mb-3">
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-purple-400" />
            <h2 className="text-base font-semibold text-white">Hire a Pro</h2>
          </div>
          <button
            onClick={() => navigate('/professionals')}
            className="text-sm text-gold-400 hover:text-gold-300 flex items-center gap-0.5"
          >
            View all <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        {displayProfessionals.length === 0 && !loading ? (
          <p className="text-center text-white/50 text-sm py-4">No professionals yet. Apply to be one!</p>
        ) : (
          <div className="flex justify-center gap-8 overflow-x-auto scrollbar-hide pb-2">
            {displayProfessionals.map((professional) => (
              <motion.div
                key={professional.id}
                whileHover={{ scale: 1.05 }}
                onClick={() => navigate(`/professional/${professional.id}`)}
                className="cursor-pointer group flex-shrink-0"
              >
                <div className="relative mb-3">
                  <img
                    src={professional.profile_image || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop'}
                    alt={professional.name}
                    className="w-28 h-28 rounded-full object-cover border-3 border-transparent
                             group-hover:border-purple-400 transition-all shadow-lg"
                  />
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1
                                bg-purple-500 rounded-full text-sm font-semibold text-white shadow-md whitespace-nowrap">
                    {professional.professional_type?.replace('_', ' ') || 'Pro'}
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-base font-medium text-white truncate w-28">{professional.name}</p>
                  <p className="text-sm text-white/50">⭐ {professional.average_rating?.toFixed(1) || 'New'}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.section>

      {/* Find a Club */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="mb-5"
      >
        <div className="flex items-center justify-center gap-4 mb-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-green-400" />
            <h2 className="text-base font-semibold text-white">Find a Club</h2>
          </div>
          <button
            onClick={() => navigate('/clubs')}
            className="text-sm text-gold-400 hover:text-gold-300 flex items-center gap-0.5"
          >
            View all <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        {displayClubs.length === 0 && !loading ? (
          <p className="text-center text-white/50 text-sm py-4">No clubs yet. Start one!</p>
        ) : (
          <div className="flex justify-center gap-8 overflow-x-auto scrollbar-hide pb-2">
            {displayClubs.map((club) => (
              <motion.div
                key={club.id}
                whileHover={{ scale: 1.05 }}
                onClick={() => navigate(`/club/${club.id}`)}
                className="cursor-pointer group flex-shrink-0"
              >
                <div className="relative mb-3">
                  <img
                    src={club.image || 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=200&h=200&fit=crop'}
                    alt={club.name}
                    className="w-28 h-28 rounded-full object-cover border-3 border-transparent
                             group-hover:border-green-400 transition-all shadow-lg"
                  />
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1
                                bg-green-500 rounded-full text-sm font-semibold text-white shadow-md">
                    {club.city || 'Club'}
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-base font-medium text-white truncate w-28">{club.name}</p>
                  <p className="text-sm text-white/50">{club.member_count || 0} members</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.section>
    </div>
  );
};

export default Home;
