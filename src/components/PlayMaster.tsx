import { motion } from 'framer-motion';
import { Star, Clock, Video, MessageSquare, ChevronRight } from 'lucide-react';

const masters = [
  {
    id: 1,
    name: 'GM Alexandra Kosteniuk',
    title: 'Grandmaster',
    rating: 2495,
    country: 'Switzerland',
    specialty: 'Aggressive Tactical Play',
    price: 150,
    available: true,
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
    reviews: 128,
    avgRating: 4.9,
  },
  {
    id: 2,
    name: 'GM Hikaru Nakamura',
    title: 'Grandmaster',
    rating: 2736,
    country: 'USA',
    specialty: 'Blitz & Bullet Expert',
    price: 300,
    available: true,
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    reviews: 342,
    avgRating: 5.0,
  },
  {
    id: 3,
    name: 'IM Jennifer Yu',
    title: 'International Master',
    rating: 2310,
    country: 'USA',
    specialty: 'Endgame Specialist',
    price: 80,
    available: false,
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
    reviews: 89,
    avgRating: 4.8,
  },
  {
    id: 4,
    name: 'GM Anish Giri',
    title: 'Grandmaster',
    rating: 2764,
    country: 'Netherlands',
    specialty: 'Positional Mastery',
    price: 250,
    available: true,
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
    reviews: 256,
    avgRating: 4.9,
  },
];

const PlayMaster = () => {
  return (
    <section id="play-master" className="pt-12 pb-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-bl from-gold-500/5 to-transparent" />
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-tr from-primary-500/5 to-transparent" />
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
          <span className="inline-block px-4 py-1.5 rounded-full bg-gold-500/10 border border-gold-500/20
                        text-gold-400 text-sm font-medium mb-4">
            Play a Master
          </span>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
            Learn from the <span className="gradient-text">Best</span>
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Book private sessions with titled players. Get personalized coaching,
            game analysis, or simply enjoy a challenging match.
          </p>
        </motion.div>

        {/* Session Types */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16"
        >
          {[
            { icon: Video, title: 'Video Lesson', desc: '1-on-1 live coaching session' },
            { icon: MessageSquare, title: 'Game Analysis', desc: 'Review your games with a master' },
            { icon: Clock, title: 'Rapid Match', desc: 'Play competitive games online' },
          ].map((type, index) => (
            <div
              key={index}
              className="glass-card p-6 flex items-center gap-4 hover:bg-white/10
                       transition-all duration-300 cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold-500/20 to-gold-600/20
                           flex items-center justify-center group-hover:from-gold-500/30 group-hover:to-gold-600/30
                           transition-colors">
                <type.icon className="w-6 h-6 text-gold-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">{type.title}</h3>
                <p className="text-sm text-white/50">{type.desc}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Masters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {masters.map((master, index) => (
            <motion.div
              key={master.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="glass-card overflow-hidden group hover:border-gold-500/30 transition-all duration-500"
            >
              {/* Image */}
              <div className="relative h-64 overflow-hidden">
                <img
                  src={master.image}
                  alt={master.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-chess-darker via-transparent to-transparent" />

                {/* Availability Badge */}
                <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-medium
                              ${master.available
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                : 'bg-white/10 text-white/50 border border-white/20'
                              }`}>
                  {master.available ? 'Available' : 'Busy'}
                </div>

                {/* Rating Badge */}
                <div className="absolute bottom-4 left-4 flex items-center gap-1 px-2 py-1 rounded-lg
                              bg-black/50 backdrop-blur-sm">
                  <Star className="w-4 h-4 text-gold-400 fill-gold-400" />
                  <span className="text-sm font-semibold text-white">{master.avgRating}</span>
                  <span className="text-xs text-white/50">({master.reviews})</span>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-gold-400">{master.title}</span>
                  <span className="text-xs text-white/40">• {master.rating} ELO</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">{master.name}</h3>
                <p className="text-sm text-white/50 mb-4">{master.specialty}</p>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold text-white">${master.price}</span>
                    <span className="text-sm text-white/40">/session</span>
                  </div>
                  <button className="px-4 py-2 bg-white/5 hover:bg-gold-500 text-white hover:text-chess-darker
                                   rounded-lg font-medium text-sm transition-all duration-300 flex items-center gap-1">
                    Book
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
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
            View All Masters
            <ChevronRight className="w-5 h-5" />
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default PlayMaster;
