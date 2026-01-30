import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Star, Trophy, MapPin, Calendar, Users, ChevronRight, Building2
} from 'lucide-react';
import { masters, tournaments, clubs, gameLocations } from '../data';
import GlobalSearch from './GlobalSearch';

const HomeTripAdvisor = () => {
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleOpenSearch = () => setIsSearchOpen(true);
    window.addEventListener('openSearch', handleOpenSearch);
    return () => window.removeEventListener('openSearch', handleOpenSearch);
  }, []);

  const topMasters = masters.slice(0, 3);
  const topTournaments = tournaments.slice(0, 3);
  const topClubs = clubs.slice(0, 3);
  const topLocations = gameLocations.slice(0, 3);

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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
            <p className="text-sm text-white/60">{gameLocations.length} locations</p>
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
        </div>
      </section>

      {/* Upcoming Tournaments */}
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
          {topTournaments.map((tournament, index) => (
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
                <img src={tournament.image} alt={tournament.name} className="w-full h-full object-cover" />
                <div className="absolute top-3 right-3 px-2 py-1 bg-primary-500 rounded-lg text-white font-semibold text-sm">
                  {tournament.prize}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-white text-lg mb-1 group-hover:text-primary-400 transition-colors">
                  {tournament.name}
                </h3>
                <div className="flex items-center gap-2 text-sm text-white/60 mb-2">
                  <Calendar className="w-4 h-4" />
                  <span>{tournament.date}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-white/60 mb-2">
                  <MapPin className="w-4 h-4" />
                  <span>{tournament.location}</span>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-sm text-white/60">
                    {tournament.players.current}/{tournament.players.max} players
                  </span>
                  <span className="px-2 py-1 bg-primary-500/20 text-primary-400 rounded text-xs font-medium">
                    {tournament.type}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Casual Game Locations */}
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
                <img src={location.image} alt={location.name} className="w-full h-full object-cover" />
                <div className="absolute top-3 right-3 px-2 py-1 bg-orange-500 rounded-lg text-white font-semibold text-sm">
                  {location.distance}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-white text-lg mb-1 group-hover:text-orange-400 transition-colors">
                  {location.name}
                </h3>
                <div className="flex items-center gap-2 text-sm text-white/60 mb-2">
                  <span className="text-orange-400">{location.rating} ★</span>
                  <span>•</span>
                  <span>{location.type}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-white/60 mb-2">
                  <MapPin className="w-4 h-4" />
                  <span>{location.location}</span>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-sm text-white/60">
                    {location.activeGames} active games
                  </span>
                  <span className="text-xs text-white/50">
                    {location.busyHours}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

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

      {/* Chess Clubs */}
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
                  {club.tags.slice(0, 2).map((tag) => (
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
