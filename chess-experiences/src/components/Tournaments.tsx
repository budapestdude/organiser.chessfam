import { motion } from 'framer-motion';
import { Trophy, Users, Calendar, Clock, MapPin, ChevronRight, Zap } from 'lucide-react';

const tournaments = [
  {
    id: 1,
    name: 'Spring Championship 2024',
    type: 'Classical',
    date: 'Mar 15-17, 2024',
    location: 'New York, NY',
    prize: '$10,000',
    players: { current: 98, max: 128 },
    entryFee: 75,
    timeControl: '90+30',
    featured: true,
  },
  {
    id: 2,
    name: 'Rapid Fire Weekly',
    type: 'Rapid',
    date: 'Every Saturday',
    location: 'Online',
    prize: '$500',
    players: { current: 45, max: 64 },
    entryFee: 15,
    timeControl: '10+5',
    featured: false,
  },
  {
    id: 3,
    name: 'Blitz Masters Open',
    type: 'Blitz',
    date: 'Apr 5, 2024',
    location: 'Chicago, IL',
    prize: '$5,000',
    players: { current: 112, max: 256 },
    entryFee: 35,
    timeControl: '3+2',
    featured: false,
  },
  {
    id: 4,
    name: 'Junior National Championship',
    type: 'Classical',
    date: 'May 10-12, 2024',
    location: 'Los Angeles, CA',
    prize: '$15,000',
    players: { current: 156, max: 200 },
    entryFee: 50,
    timeControl: '90+30',
    featured: true,
  },
];

const Tournaments = () => {
  return (
    <section id="tournaments" className="py-32 relative overflow-hidden bg-chess-dark/50">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
          backgroundSize: '40px 40px'
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
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20
                        text-primary-400 text-sm font-medium mb-4">
            Book a Tournament
          </span>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
            Compete at the <span className="gradient-text">Highest Level</span>
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            From local club events to prestigious national championships.
            Find and enter tournaments that match your skill level.
          </p>
        </motion.div>

        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex flex-wrap justify-center gap-3 mb-12"
        >
          {['All', 'Classical', 'Rapid', 'Blitz', 'Online', 'In-Person'].map((filter, index) => (
            <button
              key={filter}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300
                        ${index === 0
                          ? 'bg-gold-500 text-chess-darker'
                          : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                        }`}
            >
              {filter}
            </button>
          ))}
        </motion.div>

        {/* Tournaments List */}
        <div className="space-y-4">
          {tournaments.map((tournament, index) => (
            <motion.div
              key={tournament.id}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`glass-card p-6 hover:border-gold-500/30 transition-all duration-500 group
                        ${tournament.featured ? 'ring-1 ring-gold-500/20' : ''}`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                {/* Tournament Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {tournament.featured && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-gold-500/20 text-gold-400 text-xs font-medium">
                        <Zap className="w-3 h-3" />
                        Featured
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded text-xs font-medium
                                  ${tournament.type === 'Classical' ? 'bg-blue-500/20 text-blue-400' :
                                    tournament.type === 'Rapid' ? 'bg-green-500/20 text-green-400' :
                                    'bg-orange-500/20 text-orange-400'}`}>
                      {tournament.type}
                    </span>
                  </div>

                  <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-gold-400 transition-colors">
                    {tournament.name}
                  </h3>

                  <div className="flex flex-wrap gap-4 text-sm text-white/60">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      {tournament.date}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" />
                      {tournament.location}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      {tournament.timeControl}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      {tournament.players.current}/{tournament.players.max} players
                    </div>
                  </div>
                </div>

                {/* Prize & Entry */}
                <div className="flex flex-row lg:flex-col items-center lg:items-end gap-4 lg:gap-2">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-gold-400" />
                    <span className="text-2xl font-bold text-white">{tournament.prize}</span>
                  </div>
                  <span className="text-sm text-white/50">Entry: ${tournament.entryFee}</span>
                </div>

                {/* Progress Bar */}
                <div className="lg:w-32">
                  <div className="flex justify-between text-xs text-white/50 mb-1">
                    <span>Spots</span>
                    <span>{tournament.players.max - tournament.players.current} left</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-gold-500 to-gold-400 rounded-full transition-all duration-500"
                      style={{ width: `${(tournament.players.current / tournament.players.max) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Register Button */}
                <button className="px-6 py-3 bg-white/5 hover:bg-gold-500 text-white hover:text-chess-darker
                                 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2
                                 whitespace-nowrap">
                  Register Now
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* View All Button */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-12"
        >
          <button className="btn-secondary inline-flex items-center gap-2">
            Browse All Tournaments
            <ChevronRight className="w-5 h-5" />
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default Tournaments;
