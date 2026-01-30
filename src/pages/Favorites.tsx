import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, Star, Trophy, MapPin, Users, X } from 'lucide-react';
import { useStore } from '../store';

const Favorites = () => {
  const navigate = useNavigate();
  const { user, favorites, removeFavorite, openAuthModal } = useStore();

  if (!user) {
    return (
      <div className="min-h-screen py-8 px-4 md:px-8 max-w-4xl mx-auto flex flex-col items-center justify-center">
        <Heart className="w-16 h-16 text-white/20 mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Sign in to view favorites</h2>
        <p className="text-white/50 mb-6">Save your favorite masters, tournaments, and more</p>
        <button
          onClick={() => openAuthModal('login')}
          className="px-6 py-3 bg-gold-500 text-chess-darker font-semibold rounded-xl
                   hover:bg-gold-400 transition-colors"
        >
          Sign In
        </button>
      </div>
    );
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'master': return Star;
      case 'tournament': return Trophy;
      case 'club': return MapPin;
      case 'player': return Users;
      default: return Star;
    }
  };

  const getRoute = (type: string, id: number) => {
    switch (type) {
      case 'master': return `/master/${id}`;
      case 'tournament': return `/tournament/${id}`;
      case 'club': return `/club/${id}`;
      case 'player': return `/player/${id}`;
      default: return '/';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'master': return 'text-gold-400 bg-gold-500/20';
      case 'tournament': return 'text-primary-400 bg-primary-500/20';
      case 'club': return 'text-green-400 bg-green-500/20';
      case 'player': return 'text-orange-400 bg-orange-500/20';
      default: return 'text-white/50 bg-white/10';
    }
  };

  const groupedFavorites = {
    master: favorites.filter((f) => f.type === 'master'),
    tournament: favorites.filter((f) => f.type === 'tournament'),
    club: favorites.filter((f) => f.type === 'club'),
    player: favorites.filter((f) => f.type === 'player'),
  };

  return (
    <div className="min-h-screen py-8 px-4 md:px-8 lg:px-16 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <h1 className="text-2xl font-display font-bold text-white">Favorites</h1>
        <div className="w-16" />
      </motion.div>

      {favorites.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <Heart className="w-20 h-20 text-white/10 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">No favorites yet</h2>
          <p className="text-white/50 mb-6">
            Save masters, tournaments, clubs and players to find them easily later
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-gold-500 text-chess-darker font-semibold rounded-xl
                     hover:bg-gold-400 transition-colors"
          >
            Browse Experiences
          </button>
        </motion.div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedFavorites).map(([type, items]) => {
            if (items.length === 0) return null;
            const Icon = getIcon(type);
            return (
              <motion.section
                key={type}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Icon className={`w-5 h-5 ${getTypeColor(type).split(' ')[0]}`} />
                  <h2 className="text-lg font-semibold text-white capitalize">{type}s</h2>
                  <span className="text-white/40 text-sm">({items.length})</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {items.map((item) => {
                    const TypeIcon = getIcon(item.type);
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white/5 rounded-xl overflow-hidden border border-white/10
                                 hover:border-white/20 transition-all group"
                      >
                        <div
                          onClick={() => navigate(getRoute(item.type, item.itemId))}
                          className="cursor-pointer"
                        >
                          <div className="relative">
                            <img
                              src={item.itemImage}
                              alt={item.itemName}
                              className="w-full h-40 object-cover"
                            />
                            <div className={`absolute top-2 left-2 px-2 py-1 rounded-lg text-xs font-medium ${getTypeColor(item.type)}`}>
                              <TypeIcon className="w-3 h-3 inline mr-1" />
                              {item.type}
                            </div>
                          </div>
                          <div className="p-4">
                            <h3 className="font-semibold text-white group-hover:text-gold-400 transition-colors">
                              {item.itemName}
                            </h3>
                            <p className="text-xs text-white/40 mt-1">
                              Added {new Date(item.addedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="px-4 pb-4">
                          <button
                            onClick={() => removeFavorite(item.itemId, item.type)}
                            className="w-full py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10
                                     rounded-lg transition-colors flex items-center justify-center gap-2"
                          >
                            <X className="w-4 h-4" />
                            Remove
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.section>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Favorites;
