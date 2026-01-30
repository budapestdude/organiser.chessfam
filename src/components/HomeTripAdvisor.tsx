import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Star, Trophy, MapPin, Calendar, Users, ChevronRight, Building2, Swords, Clock, User, Briefcase
} from 'lucide-react';
import { masters } from '../data';
import { tournamentsApi } from '../api/tournaments';
import { venuesApi } from '../api/venues';
import { challengesApi } from '../api/challenges';
import { clubsApi } from '../api/clubs';
import { gamesApi } from '../api/games';
import { professionalsApi } from '../api/professionals';
import type { GameWithDetails } from '../types/game';
import GlobalSearch from './GlobalSearch';

const HomeTripAdvisor = () => {
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [venues, setVenues] = useState<any[]>([]);
  const [clubs, setClubs] = useState<any[]>([]);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [professionals, setProfessionals] = useState<any[]>([]);

  useEffect(() => {
    const handleOpenSearch = () => setIsSearchOpen(true);
    window.addEventListener('openSearch', handleOpenSearch);
    return () => window.removeEventListener('openSearch', handleOpenSearch);
  }, []);

  // Fetch tournaments, venues, clubs, challenges, professionals, and open games from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tournamentsData, venuesData, clubsData, challengesData, professionalsData, gamesData] = await Promise.all([
          tournamentsApi.getTournaments({ limit: 50 }),
          venuesApi.getApprovedVenues(),
          clubsApi.getClubs({ limit: 20 }),
          challengesApi.getOpenChallenges({ limit: 20 }),
          professionalsApi.getProfessionals({ limit: 20, verified: true }).catch(() => ({ data: [] })),
          gamesApi.getGames({ status: 'open' })
        ]);
        console.log('[HomeTripAdvisor] Tournament API response:', tournamentsData);
        console.log('[HomeTripAdvisor] Venues API response:', venuesData);
        console.log('[HomeTripAdvisor] Clubs API response:', clubsData);

        const tournamentList = Array.isArray(tournamentsData?.data) ? tournamentsData.data :
                               Array.isArray(tournamentsData) ? tournamentsData : [];
        const venuesList = Array.isArray(venuesData?.data) ? venuesData.data :
                          Array.isArray(venuesData) ? venuesData : [];
        const clubsList = Array.isArray(clubsData?.data?.clubs) ? clubsData.data.clubs :
                         Array.isArray(clubsData?.data) ? clubsData.data :
                         Array.isArray(clubsData) ? clubsData : [];

        console.log('[HomeTripAdvisor] Extracted tournaments:', tournamentList.length, 'items');
        console.log('[HomeTripAdvisor] Extracted venues:', venuesList.length, 'items');
        console.log('[HomeTripAdvisor] Extracted clubs:', clubsList.length, 'items');

        // Combine challenges and open games
        const apiChallenges = challengesData?.data?.challenges || challengesData?.data || [];
        const apiGames: GameWithDetails[] = gamesData?.data || gamesData || [];

        // Filter games to only show those with available spots
        const openGames = apiGames.filter((game: GameWithDetails) =>
          game.participant_count < game.max_players &&
          new Date(game.game_date) > new Date()
        );

        // Transform games to challenge format for display
        const gamesAsChallenges = openGames.map((game: GameWithDetails) => ({
          id: game.id,
          type: 'game',
          challenger_id: game.creator_id,
          challenger_name: game.creator_name,
          challenger_rating: game.creator_rating || 0,
          challenger_avatar: game.creator_avatar,
          time_control: game.time_control || '10+0',
          message: game.description,
          venue_name: game.venue_name,
          expires_at: game.game_date,
          created_at: game.created_at,
          game_date: game.game_date,
          spots_available: game.max_players - game.participant_count,
          max_players: game.max_players
        }));

        // Combine and sort by creation date
        const combined = [...apiChallenges, ...gamesAsChallenges]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        const professionalsList = Array.isArray(professionalsData?.data?.data) ? professionalsData.data.data :
                                 Array.isArray(professionalsData?.data) ? professionalsData.data :
                                 Array.isArray(professionalsData) ? professionalsData : [];

        console.log('[HomeTripAdvisor] Professionals API response:', professionalsData);
        console.log('[HomeTripAdvisor] Extracted professionals:', professionalsList.length, 'items');

        setTournaments(tournamentList);
        setVenues(venuesList);
        setClubs(clubsList);
        setChallenges(combined);
        setProfessionals(professionalsList);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };
    fetchData();
  }, []);

  const topMasters = masters.slice(0, 3);

  // Filter and sort tournaments to show nearest upcoming
  const upcomingTournaments = tournaments
    .filter(t => {
      const startDate = new Date(t.start_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return startDate >= today && t.status === 'upcoming';
    })
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

  const topTournaments = upcomingTournaments.slice(0, 3);
  const topClubs = clubs.slice(0, 3);
  const topLocations = venues.slice(0, 3);
  const topChallenges = challenges.slice(0, 3);
  const topProfessionals = professionals.slice(0, 3);

  return (
    <div className="min-h-screen bg-chess-darker">
      <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-900/20 to-gold-900/20 py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
              Real people, real chess
            </h2>
            <p className="text-lg md:text-xl text-white/70">
              Discover tournaments, find opponents, book masters and join clubs for an in-person game
            </p>
          </motion.div>
        </div>
      </section>

      {/* Popular Categories */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => navigate('/tournaments')}
            className="bg-gradient-to-br from-primary-500/20 to-primary-600/20 border border-primary-500/30
                     rounded-xl p-6 cursor-pointer hover:scale-105 transition-transform"
          >
            <Trophy className="w-10 h-10 text-primary-400 mb-3" />
            <h3 className="text-lg font-semibold text-white mb-1">Tournaments</h3>
            <p className="text-sm text-white/60">{tournaments.length} upcoming</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            onClick={() => navigate('/locations')}
            className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 border border-orange-500/30
                     rounded-xl p-6 cursor-pointer hover:scale-105 transition-transform"
          >
            <MapPin className="w-10 h-10 text-orange-400 mb-3" />
            <h3 className="text-lg font-semibold text-white mb-1">Find a Game</h3>
            <p className="text-sm text-white/60">{venues.length} locations</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => navigate('/masters')}
            className="bg-gradient-to-br from-gold-500/20 to-gold-600/20 border border-gold-500/30
                     rounded-xl p-6 cursor-pointer hover:scale-105 transition-transform"
          >
            <Star className="w-10 h-10 text-gold-400 mb-3" />
            <h3 className="text-lg font-semibold text-white mb-1">Play a Master</h3>
            <p className="text-sm text-white/60">{masters.length} available</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            onClick={() => navigate('/clubs')}
            className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30
                     rounded-xl p-6 cursor-pointer hover:scale-105 transition-transform"
          >
            <Users className="w-10 h-10 text-green-400 mb-3" />
            <h3 className="text-lg font-semibold text-white mb-1">Join a Club</h3>
            <p className="text-sm text-white/60">{clubs.length} clubs</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={() => navigate('/challenges')}
            className="bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-500/30
                     rounded-xl p-6 cursor-pointer hover:scale-105 transition-transform"
          >
            <Swords className="w-10 h-10 text-red-400 mb-3" />
            <h3 className="text-lg font-semibold text-white mb-1">Open Challenges</h3>
            <p className="text-sm text-white/60">{challenges.length} looking to play</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            onClick={() => navigate('/professionals')}
            className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30
                     rounded-xl p-6 cursor-pointer hover:scale-105 transition-transform"
          >
            <Briefcase className="w-10 h-10 text-purple-400 mb-3" />
            <h3 className="text-lg font-semibold text-white mb-1">Hire a Pro</h3>
            <p className="text-sm text-white/60">{professionals.length} professionals</p>
          </motion.div>
        </div>
      </section>

      {/* Upcoming Tournaments */}
      {topTournaments.length > 0 && (
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-display font-bold text-white mb-1">Upcoming Tournaments</h2>
            <p className="text-white/60 text-sm">Compete and win prizes</p>
          </div>
          <button
            onClick={() => navigate('/tournaments')}
            className="text-gold-400 hover:text-gold-300 flex items-center gap-1 text-sm font-medium"
          >
            See all <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {topTournaments.map((tournament, index) => {
            const imageSrc = tournament.image || 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=800&auto=format&fit=crop';
            console.log(`Tournament ${tournament.name} image src:`, imageSrc);
            return (
              <motion.div
                key={tournament.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => navigate(`/tournament/${tournament.id}`)}
                className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary-500/30
                         rounded-xl overflow-hidden cursor-pointer transition-all group"
              >
                <div className="relative h-48">
                  <img
                    src={imageSrc}
                    alt={tournament.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.log('Tournament image failed to load. Original src:', tournament.image, 'Current src:', e.currentTarget.src);
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=800&auto=format&fit=crop';
                    }}
                  />
                {tournament.prize_pool && (
                  <div className="absolute top-3 right-3 px-2 py-1 bg-primary-500 rounded-lg text-white font-semibold text-sm">
                    ${tournament.prize_pool}
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-white text-lg mb-1 group-hover:text-primary-400 transition-colors">
                  {tournament.name}
                </h3>
                <div className="flex items-center gap-2 text-sm text-white/60 mb-2">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(tournament.start_date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-white/60 mb-2">
                  <MapPin className="w-4 h-4" />
                  <span>{tournament.venue_name || 'TBA'}</span>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-sm text-white/60">
                    {tournament.current_participants}/{tournament.max_participants} players
                  </span>
                  <span className="px-2 py-1 bg-primary-500/20 text-primary-400 rounded text-xs font-medium">
                    {tournament.tournament_type || tournament.format}
                  </span>
                </div>
              </div>
            </motion.div>
            );
          })}
        </div>
      </section>
      )}

      {/* Open Challenges */}
      {topChallenges.length > 0 && (
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-display font-bold text-white mb-1">Find a Game</h2>
            <p className="text-white/60 text-sm">Open challenges and scheduled games near you</p>
          </div>
          <button
            onClick={() => navigate('/challenges')}
            className="text-gold-400 hover:text-gold-300 flex items-center gap-1 text-sm font-medium"
          >
            See all <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {topChallenges.map((challenge, index) => (
            <motion.div
              key={`${challenge.type || 'challenge'}-${challenge.id}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => navigate('/challenges')}
              className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-red-500/30
                       rounded-xl p-4 cursor-pointer transition-all group"
            >
              {/* Type badge */}
              {challenge.type === 'game' && (
                <div className="mb-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                    Scheduled Game
                  </span>
                </div>
              )}

              <div className="flex items-start gap-3 mb-3">
                {challenge.challenger_avatar ? (
                  <img
                    src={challenge.challenger_avatar}
                    alt={challenge.challenger_name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                    <User className="w-6 h-6 text-red-400" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-white group-hover:text-red-400 transition-colors">
                    {challenge.challenger_name}
                  </h3>
                  <p className="text-sm text-white/50">
                    {challenge.challenger_rating > 0 ? `${challenge.challenger_rating} rated` : (challenge.type === 'game' ? 'Organizer' : 'Unrated')}
                  </p>
                </div>
                <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-medium">
                  {challenge.time_control}
                </span>
              </div>

              {/* Game date for scheduled games */}
              {challenge.type === 'game' && challenge.game_date && (
                <div className="flex items-center gap-2 text-sm text-blue-400 mb-2 bg-blue-500/10 rounded-lg p-2">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(challenge.game_date).toLocaleDateString()} at {new Date(challenge.game_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              )}

              {/* Spots available for games */}
              {challenge.type === 'game' && challenge.spots_available !== undefined && (
                <p className="text-sm text-white/70 mb-2">
                  <span className="font-semibold text-green-400">{challenge.spots_available}</span> / {challenge.max_players} spots available
                </p>
              )}

              {challenge.message && (
                <p className="text-sm text-white/70 mb-3 line-clamp-2">"{challenge.message}"</p>
              )}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-white/50">
                  <MapPin className="w-4 h-4" />
                  <span>{challenge.venue_name || 'Any venue'}</span>
                </div>
                <div className="flex items-center gap-1 text-yellow-500">
                  <Clock className="w-3 h-3" />
                  <span className="text-xs">
                    {challenge.type === 'game'
                      ? `Starts ${Math.floor((new Date(challenge.expires_at).getTime() - Date.now()) / 3600000)}h`
                      : `${Math.floor((new Date(challenge.expires_at).getTime() - Date.now()) / 3600000)}h left`
                    }
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
      )}

      {/* Casual Game Locations */}
      {topLocations.length > 0 && (
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-display font-bold text-white mb-1">Popular Game Spots</h2>
            <p className="text-white/60 text-sm">Find casual chess near you</p>
          </div>
          <button
            onClick={() => navigate('/locations')}
            className="text-gold-400 hover:text-gold-300 flex items-center gap-1 text-sm font-medium"
          >
            See all <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {topLocations.map((location, index) => (
            <motion.div
              key={location.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => navigate(`/location/${location.id}`)}
              className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-orange-500/30
                       rounded-xl overflow-hidden cursor-pointer transition-all group"
            >
              <div className="relative h-48">
                <img
                  src={location.image_url || 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=800'}
                  alt={location.venue_name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=800';
                  }}
                />
                {location.average_rating > 0 && (
                  <div className="absolute top-3 right-3 px-2 py-1 bg-orange-500 rounded-lg text-white font-semibold text-sm">
                    {parseFloat(location.average_rating).toFixed(1)} ★
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-white text-lg mb-1 group-hover:text-orange-400 transition-colors">
                  {location.venue_name}
                </h3>
                <div className="flex items-center gap-2 text-sm text-white/60 mb-2">
                  <span className="text-orange-400">
                    {location.average_rating > 0 ? `${parseFloat(location.average_rating).toFixed(1)} ★` : 'New'}
                  </span>
                  <span>•</span>
                  <span>{location.review_count || 0} reviews</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-white/60 mb-2">
                  <MapPin className="w-4 h-4" />
                  <span>{location.city || location.address}</span>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-sm text-white/60">{location.venue_type || 'Venue'}</span>
                  <span className="text-xs text-white/50">
                    {location.status === 'approved' ? 'Verified' : 'Pending'}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
      )}

      {/* Top Rated Masters */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-display font-bold text-white mb-1">Top Rated Masters</h2>
            <p className="text-white/60 text-sm">Learn from the best chess professionals</p>
          </div>
          <button
            onClick={() => navigate('/masters')}
            className="text-gold-400 hover:text-gold-300 flex items-center gap-1 text-sm font-medium"
          >
            See all <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {topMasters.map((master, index) => (
            <motion.div
              key={master.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => navigate(`/master/${master.id}`)}
              className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-gold-500/30
                       rounded-xl overflow-hidden cursor-pointer transition-all group"
            >
              <div className="relative h-48">
                <img src={master.image} alt={master.name} className="w-full h-full object-cover" />
                <div className="absolute top-3 right-3 px-2 py-1 bg-gold-500 rounded-lg text-chess-darker font-semibold text-sm">
                  ${master.price}/game
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-white text-lg mb-1 group-hover:text-gold-400 transition-colors">
                  {master.name}
                </h3>
                <div className="flex items-center gap-2 text-sm text-white/60 mb-2">
                  <span className="text-gold-400">{master.avgRating} ★</span>
                  <span>•</span>
                  <span>{master.rating}</span>
                </div>
                <p className="text-sm text-white/50 line-clamp-2">{master.bio}</p>
                <div className="flex gap-2 mt-3">
                  <span className="px-2 py-1 bg-white/5 rounded text-xs text-white/60">
                    {master.specialty}
                  </span>
                  {master.languages && master.languages.length > 0 && (
                    <span className="px-2 py-1 bg-white/5 rounded text-xs text-white/60">
                      {master.languages[0]}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured Professionals */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-display font-bold text-white mb-1">Featured Professionals</h2>
            <p className="text-white/60 text-sm">Coaches, arbiters, photographers, and more</p>
          </div>
          <button
            onClick={() => navigate('/professionals')}
            className="text-gold-400 hover:text-gold-300 flex items-center gap-1 text-sm font-medium"
          >
            See all <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {topProfessionals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {topProfessionals.map((professional: any, index: number) => (
            <motion.div
              key={professional.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => navigate(`/professional/${professional.id}`)}
              className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/30
                       rounded-xl overflow-hidden cursor-pointer transition-all group"
            >
              <div className="relative h-48">
                <img
                  src={professional.profile_image || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=800'}
                  alt={professional.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=800';
                  }}
                />
                <div className="absolute top-3 right-3 px-2 py-1 bg-purple-500 rounded-lg text-white font-semibold text-sm capitalize">
                  {professional.professional_type?.replace('_', ' ')}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-white text-lg mb-1 group-hover:text-purple-400 transition-colors">
                  {professional.name}
                </h3>
                <div className="flex items-center gap-2 text-sm text-white/60 mb-2">
                  <span className="text-purple-400">
                    {professional.average_rating > 0 ? `${professional.average_rating.toFixed(1)} ★` : 'New'}
                  </span>
                  <span>•</span>
                  <span>{professional.total_reviews || 0} reviews</span>
                </div>
                {professional.city && professional.country && (
                  <div className="flex items-center gap-2 text-sm text-white/60 mb-2">
                    <MapPin className="w-4 h-4" />
                    <span>{professional.city}, {professional.country}</span>
                  </div>
                )}
                <p className="text-sm text-white/50 line-clamp-2">{professional.bio || 'Professional chess services'}</p>
                <div className="flex gap-2 mt-3 flex-wrap">
                  {professional.specialties?.slice(0, 2).map((specialty: string) => (
                    <span key={specialty} className="px-2 py-1 bg-white/5 rounded text-xs text-white/60">
                      {specialty}
                    </span>
                  ))}
                  {professional.remote_available && (
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-medium">
                      Remote
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
            <Briefcase className="w-12 h-12 text-purple-400/50 mx-auto mb-3" />
            <p className="text-white/60 mb-2">No professionals available yet</p>
            <p className="text-white/40 text-sm">
              Be the first to join our professional marketplace!
            </p>
            <button
              onClick={() => navigate('/professionals/apply')}
              className="mt-4 px-6 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-all border border-purple-500/30"
            >
              Apply to be a Professional
            </button>
          </div>
        )}
      </section>

      {/* Chess Clubs */}
      {topClubs.length > 0 && (
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-8 pb-20">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-display font-bold text-white mb-1">Featured Chess Clubs</h2>
            <p className="text-white/60 text-sm">Join a community of players</p>
          </div>
          <button
            onClick={() => navigate('/clubs')}
            className="text-gold-400 hover:text-gold-300 flex items-center gap-1 text-sm font-medium"
          >
            See all <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {topClubs.map((club, index) => (
            <motion.div
              key={club.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => navigate(`/club/${club.id}`)}
              className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-green-500/30
                       rounded-xl overflow-hidden cursor-pointer transition-all group"
            >
              <div className="relative h-48">
                <img src={club.image} alt={club.name} className="w-full h-full object-cover" />
                <div className="absolute top-3 right-3 px-2 py-1 bg-green-500 rounded-lg text-white font-semibold text-sm">
                  {club.distance}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-white text-lg mb-1 group-hover:text-green-400 transition-colors">
                  {club.name}
                </h3>
                <div className="flex items-center gap-2 text-sm text-white/60 mb-2">
                  <span className="text-green-400">{club.rating} ★</span>
                  <span>•</span>
                  <span>{club.members} members</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-white/60 mb-2">
                  <MapPin className="w-4 h-4" />
                  <span>{club.location}</span>
                </div>
                <div className="flex gap-2 mt-3">
                  {club.tags?.slice(0, 2).map((tag: string) => (
                    <span key={tag} className="px-2 py-1 bg-white/5 rounded text-xs text-white/60">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
      )}

      {/* Register Venue CTA */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-12 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-gold-500/10 to-gold-600/10 border border-gold-500/20 rounded-2xl p-8 text-center"
        >
          <h2 className="text-3xl font-display font-bold text-white mb-3">
            Own a Chess-Friendly Venue?
          </h2>
          <p className="text-white/70 mb-6 max-w-2xl mx-auto">
            Register your park, café, club, or community center and connect with chess players in your area.
            It's free and takes just a few minutes!
          </p>
          <button
            onClick={() => navigate('/register-venue')}
            className="px-8 py-4 bg-gradient-to-r from-gold-500 to-gold-600 text-chess-darker font-semibold rounded-xl hover:from-gold-400 hover:to-gold-500 transition-all inline-flex items-center gap-2"
          >
            <Building2 className="w-5 h-5" />
            Register Your Venue
          </button>
        </motion.div>
      </section>
    </div>
  );
};

export default HomeTripAdvisor;
