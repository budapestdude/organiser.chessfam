import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Trophy, Building2, MapPin, Users, BookOpen, ChevronRight } from 'lucide-react';

const guides = [
  {
    id: 'create-tournament',
    title: 'How to Create a Tournament',
    description: 'Step-by-step guide to organizing and hosting your own chess tournament',
    icon: Trophy,
    color: 'from-gold-500 to-yellow-600',
    path: '/guides/create-tournament'
  },
  {
    id: 'create-club',
    title: 'How to Create a Chess Club',
    description: 'Learn how to start and manage a chess club on ChessFam',
    icon: Building2,
    color: 'from-blue-500 to-blue-600',
    path: '/guides/create-club'
  },
  {
    id: 'register-venue',
    title: 'How to Register Your Venue',
    description: 'List your venue on ChessFam to host chess events and attract players',
    icon: MapPin,
    color: 'from-purple-500 to-purple-600',
    path: '/guides/register-venue'
  },
  {
    id: 'find-games',
    title: 'How to Find Games and Players',
    description: 'Discover how to connect with players and organize casual games',
    icon: Users,
    color: 'from-green-500 to-green-600',
    path: '/guides/find-games'
  }
];

const Guides = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen py-8 px-4 md:px-8 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <BookOpen className="w-10 h-10 text-gold-400" />
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white">
            How-To Guides
          </h1>
        </div>
        <p className="text-lg text-white/70 max-w-2xl mx-auto">
          Learn everything you need to know to make the most of ChessFam
        </p>
      </motion.div>

      {/* Guides Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {guides.map((guide, index) => (
          <motion.div
            key={guide.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => navigate(guide.path)}
            className="group cursor-pointer"
          >
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all hover:border-white/20">
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${guide.color} flex items-center justify-center flex-shrink-0`}>
                  <guide.icon className="w-6 h-6 text-white" />
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-gold-400 transition-colors">
                    {guide.title}
                  </h3>
                  <p className="text-white/60 text-sm mb-4">
                    {guide.description}
                  </p>
                  <div className="flex items-center gap-2 text-gold-400 text-sm font-medium">
                    Read Guide
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Help Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-12 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-transparent border border-blue-500/20 rounded-2xl p-8 text-center"
      >
        <h2 className="text-2xl font-bold text-white mb-3">Need More Help?</h2>
        <p className="text-white/70 mb-6">
          Check out our FAQ or contact support for personalized assistance
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => navigate('/faq')}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-colors"
          >
            Browse FAQ
          </button>
          <button
            onClick={() => navigate('/help')}
            className="px-6 py-3 bg-gold-500 hover:bg-gold-400 text-chess-darker font-semibold rounded-xl transition-colors"
          >
            Contact Support
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Guides;
