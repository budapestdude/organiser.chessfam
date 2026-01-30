import { motion } from 'framer-motion';
import { MapPin, Clock, Zap, Target, MessageCircle, ChevronRight, Wifi } from 'lucide-react';

const players = [
  {
    id: 1,
    name: 'Alex Chen',
    rating: 1850,
    location: 'Brooklyn, NY',
    distance: '0.5 mi',
    preferences: ['Classical', 'Rapid'],
    availability: 'Available Now',
    online: true,
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop',
    gamesPlayed: 142,
    winRate: 58,
  },
  {
    id: 2,
    name: 'Sarah Miller',
    rating: 2100,
    location: 'Manhattan, NY',
    distance: '1.2 mi',
    preferences: ['Blitz', 'Bullet'],
    availability: 'This Evening',
    online: true,
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop',
    gamesPlayed: 312,
    winRate: 64,
  },
  {
    id: 3,
    name: 'Marcus Johnson',
    rating: 1650,
    location: 'Queens, NY',
    distance: '2.8 mi',
    preferences: ['Classical'],
    availability: 'Weekends',
    online: false,
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
    gamesPlayed: 89,
    winRate: 52,
  },
  {
    id: 4,
    name: 'Emma Davis',
    rating: 1920,
    location: 'Hoboken, NJ',
    distance: '3.5 mi',
    preferences: ['Rapid', 'Blitz'],
    availability: 'Available Now',
    online: true,
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
    gamesPlayed: 256,
    winRate: 61,
  },
  {
    id: 5,
    name: 'David Kim',
    rating: 2250,
    location: 'Jersey City, NJ',
    distance: '4.1 mi',
    preferences: ['Classical', 'Rapid', 'Blitz'],
    availability: 'Tomorrow',
    online: false,
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop',
    gamesPlayed: 478,
    winRate: 71,
  },
  {
    id: 6,
    name: 'Lisa Wang',
    rating: 1780,
    location: 'Brooklyn, NY',
    distance: '1.8 mi',
    preferences: ['Blitz'],
    availability: 'Available Now',
    online: true,
    image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200&h=200&fit=crop',
    gamesPlayed: 198,
    winRate: 55,
  },
];

const FindGame = () => {
  return (
    <section id="find-game" className="py-32 relative overflow-hidden bg-chess-dark/50">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)`,
          backgroundSize: '30px 30px'
        }} />
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
          <span className="inline-block px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20
                        text-orange-400 text-sm font-medium mb-4">
            Find a Game
          </span>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
            Find Your Next <span className="gradient-text">Opponent</span>
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Connect with chess enthusiasts near you. Whether you prefer over-the-board
            or online play, find players that match your style and skill level.
          </p>
        </motion.div>

        {/* Quick Match Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="glass-card p-6 mb-12 border-gold-500/20"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-500 to-gold-600
                           flex items-center justify-center">
                <Zap className="w-7 h-7 text-chess-darker" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Quick Match</h3>
                <p className="text-white/50">Get matched instantly with a player near your rating</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex -space-x-3">
                {players.slice(0, 4).map((player, index) => (
                  <img
                    key={player.id}
                    src={player.image}
                    alt=""
                    className="w-10 h-10 rounded-full border-2 border-chess-darker"
                    style={{ zIndex: 4 - index }}
                  />
                ))}
              </div>
              <span className="text-sm text-white/50">23 players online</span>
              <button className="btn-primary text-sm py-3">
                Find Match
              </button>
            </div>
          </div>
        </motion.div>

        {/* Filter Options */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-wrap gap-4 mb-8"
        >
          <div className="glass-card px-4 py-2 flex items-center gap-2">
            <Target className="w-4 h-4 text-white/50" />
            <select className="bg-transparent text-white text-sm outline-none cursor-pointer">
              <option value="">Any Rating</option>
              <option value="1000-1400">1000-1400</option>
              <option value="1400-1800">1400-1800</option>
              <option value="1800-2200">1800-2200</option>
              <option value="2200+">2200+</option>
            </select>
          </div>
          <div className="glass-card px-4 py-2 flex items-center gap-2">
            <Clock className="w-4 h-4 text-white/50" />
            <select className="bg-transparent text-white text-sm outline-none cursor-pointer">
              <option value="">Any Time Control</option>
              <option value="bullet">Bullet</option>
              <option value="blitz">Blitz</option>
              <option value="rapid">Rapid</option>
              <option value="classical">Classical</option>
            </select>
          </div>
          <div className="glass-card px-4 py-2 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-white/50" />
            <select className="bg-transparent text-white text-sm outline-none cursor-pointer">
              <option value="">Any Distance</option>
              <option value="1">Within 1 mile</option>
              <option value="5">Within 5 miles</option>
              <option value="10">Within 10 miles</option>
              <option value="25">Within 25 miles</option>
            </select>
          </div>
          <div className="glass-card px-4 py-2 flex items-center gap-2">
            <Wifi className="w-4 h-4 text-white/50" />
            <select className="bg-transparent text-white text-sm outline-none cursor-pointer">
              <option value="">All Players</option>
              <option value="online">Online Now</option>
              <option value="available">Available Today</option>
            </select>
          </div>
        </motion.div>

        {/* Players Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {players.map((player, index) => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="glass-card p-5 hover:border-gold-500/30 transition-all duration-500 group"
            >
              {/* Player Header */}
              <div className="flex items-start gap-4 mb-4">
                <div className="relative">
                  <img
                    src={player.image}
                    alt={player.name}
                    className="w-16 h-16 rounded-xl object-cover"
                  />
                  {player.online && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full
                                  border-2 border-chess-darker" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white group-hover:text-gold-400 transition-colors">
                    {player.name}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-white/50">
                    <MapPin className="w-3.5 h-3.5" />
                    {player.location}
                    <span className="text-gold-400">• {player.distance}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-white">{player.rating}</div>
                  <div className="text-xs text-white/40">ELO</div>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 text-sm text-white/50 mb-4">
                <div>
                  <span className="text-white font-medium">{player.gamesPlayed}</span> games
                </div>
                <div>
                  <span className="text-green-400 font-medium">{player.winRate}%</span> win rate
                </div>
              </div>

              {/* Preferences */}
              <div className="flex flex-wrap gap-2 mb-4">
                {player.preferences.map((pref, prefIndex) => (
                  <span
                    key={prefIndex}
                    className="px-2 py-1 bg-white/5 rounded text-xs text-white/60"
                  >
                    {pref}
                  </span>
                ))}
              </div>

              {/* Availability */}
              <div className={`flex items-center gap-2 text-sm mb-4
                            ${player.availability === 'Available Now' ? 'text-green-400' : 'text-white/50'}`}>
                <Clock className="w-4 h-4" />
                {player.availability}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-gold-500 text-white hover:text-chess-darker
                                 rounded-lg font-medium text-sm transition-all duration-300 flex items-center justify-center gap-1">
                  Challenge
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white
                                 rounded-lg transition-all duration-300">
                  <MessageCircle className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Load More */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-12"
        >
          <button className="btn-secondary inline-flex items-center gap-2">
            Load More Players
            <ChevronRight className="w-5 h-5" />
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default FindGame;
