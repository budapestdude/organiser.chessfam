import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Star, Trophy, MapPin, Users, X } from 'lucide-react';
import { masters, tournaments, clubs, players } from '../data';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

const GlobalSearch = ({ isOpen, onClose }: GlobalSearchProps) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const results = useMemo(() => {
    if (!query.trim()) return { masters: [], tournaments: [], clubs: [], players: [] };

    const q = query.toLowerCase();
    return {
      masters: masters.filter(
        (m) => m.name.toLowerCase().includes(q) || m.specialty.toLowerCase().includes(q)
      ).slice(0, 3),
      tournaments: tournaments.filter(
        (t) => t.name.toLowerCase().includes(q) || t.location.toLowerCase().includes(q)
      ).slice(0, 3),
      clubs: clubs.filter(
        (c) => c.name.toLowerCase().includes(q) || c.location.toLowerCase().includes(q)
      ).slice(0, 3),
      players: players.filter(
        (p) => p.name.toLowerCase().includes(q) || p.location.toLowerCase().includes(q)
      ).slice(0, 3),
    };
  }, [query]);

  const hasResults = results.masters.length > 0 || results.tournaments.length > 0 ||
    results.clubs.length > 0 || results.players.length > 0;

  const handleSelect = (type: string, id: number) => {
    navigate(`/${type}/${id}`);
    onClose();
    setQuery('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Search Modal */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative w-full max-w-2xl bg-chess-dark border border-white/10 rounded-2xl overflow-hidden"
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 p-4 border-b border-white/10">
              <Search className="w-5 h-5 text-white/40" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search masters, tournaments, clubs, players..."
                className="flex-1 bg-transparent text-white placeholder-white/40 outline-none text-lg"
              />
              <button
                onClick={onClose}
                className="p-1 text-white/40 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Results */}
            <div className="max-h-[60vh] overflow-y-auto">
              {query && !hasResults && (
                <div className="p-8 text-center">
                  <p className="text-white/50">No results found for "{query}"</p>
                </div>
              )}

              {results.masters.length > 0 && (
                <div className="p-4">
                  <div className="flex items-center gap-2 text-sm text-white/50 mb-2">
                    <Star className="w-4 h-4" />
                    Masters
                  </div>
                  {results.masters.map((master) => (
                    <button
                      key={master.id}
                      onClick={() => handleSelect('master', master.id)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-left"
                    >
                      <img src={master.image} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      <div className="flex-1">
                        <p className="text-white font-medium">{master.name}</p>
                        <p className="text-sm text-white/50">{master.title} • ${master.price}/session</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {results.tournaments.length > 0 && (
                <div className="p-4 border-t border-white/5">
                  <div className="flex items-center gap-2 text-sm text-white/50 mb-2">
                    <Trophy className="w-4 h-4" />
                    Tournaments
                  </div>
                  {results.tournaments.map((tournament) => (
                    <button
                      key={tournament.id}
                      onClick={() => handleSelect('tournament', tournament.id)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-left"
                    >
                      <img src={tournament.image} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      <div className="flex-1">
                        <p className="text-white font-medium">{tournament.name}</p>
                        <p className="text-sm text-white/50">{tournament.date} • {tournament.prize}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {results.clubs.length > 0 && (
                <div className="p-4 border-t border-white/5">
                  <div className="flex items-center gap-2 text-sm text-white/50 mb-2">
                    <MapPin className="w-4 h-4" />
                    Clubs
                  </div>
                  {results.clubs.map((club) => (
                    <button
                      key={club.id}
                      onClick={() => handleSelect('club', club.id)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-left"
                    >
                      <img src={club.image} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      <div className="flex-1">
                        <p className="text-white font-medium">{club.name}</p>
                        <p className="text-sm text-white/50">{club.location} • {club.distance}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {results.players.length > 0 && (
                <div className="p-4 border-t border-white/5">
                  <div className="flex items-center gap-2 text-sm text-white/50 mb-2">
                    <Users className="w-4 h-4" />
                    Players
                  </div>
                  {results.players.map((player) => (
                    <button
                      key={player.id}
                      onClick={() => handleSelect('player', player.id)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-left"
                    >
                      <img src={player.image} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      <div className="flex-1">
                        <p className="text-white font-medium">{player.name}</p>
                        <p className="text-sm text-white/50">{player.rating} ELO • {player.online ? 'Online' : 'Offline'}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Keyboard hint */}
            <div className="p-3 border-t border-white/10 text-center">
              <span className="text-xs text-white/30">Press ESC to close</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GlobalSearch;
