import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Users, Calendar, Clock, MapPin, LayoutGrid, Building2, Target, Heart } from 'lucide-react';
import { tournaments } from '../data';
import { useStore } from '../store';
import { useState } from 'react';
import { tournamentsApi } from '../api/tournaments';

const TournamentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const tournament = tournaments.find((t) => t.id === Number(id));
  const { user, openAuthModal, addFavorite, removeFavorite, isFavorite } = useStore();
  const [playerName, setPlayerName] = useState('');
  const [playerEmail, setPlayerEmail] = useState('');
  const [playerRating, setPlayerRating] = useState('');
  const [playerPhone, setPlayerPhone] = useState('');

  if (!tournament) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white/50">Tournament not found</p>
      </div>
    );
  }

  const spotsLeft = tournament.players.max - tournament.players.current;
  const isFull = spotsLeft === 0;

  const handleRegister = async () => {
    if (!user) {
      openAuthModal('login');
      return;
    }

    if (!playerName || !playerEmail) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const response = await tournamentsApi.registerForTournament(tournament.id);

      // Redirect to payment page with registration data
      navigate('/tournament-payment', {
        state: {
          registration: {
            id: response.data?.id || tournament.id,
            tournament_name: tournament.name,
            tournament_date: tournament.date,
            tournament_location: tournament.location,
            player_name: playerName || user.name,
            player_email: playerEmail || user.email,
            player_rating: playerRating ? parseInt(playerRating) : undefined,
            entry_fee: tournament.entryFee
          }
        }
      });
    } catch (error: any) {
      console.error('Registration failed:', error);
      alert(error.response?.data?.error || 'Registration failed. Please try again.');
    }
  };

  const typeColors: Record<string, string> = {
    Classical: 'bg-blue-500/20 text-blue-400',
    Rapid: 'bg-green-500/20 text-green-400',
    Blitz: 'bg-orange-500/20 text-orange-400',
    Bullet: 'bg-red-500/20 text-red-400',
  };

  return (
    <div className="min-h-screen py-8 px-4 md:px-8 max-w-4xl mx-auto">
      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-white/60 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back
      </motion.button>

      {/* Hero Image */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl overflow-hidden mb-8"
      >
        <img
          src={tournament.image}
          alt={tournament.name}
          className="w-full h-64 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-chess-darker via-transparent to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${typeColors[tournament.type]}`}>
              {tournament.type}
            </span>
            {tournament.featured && (
              <span className="px-3 py-1 bg-gold-500/20 text-gold-400 rounded-full text-sm font-medium">
                Featured
              </span>
            )}
          </div>
          <h1 className="text-3xl font-display font-bold text-white">{tournament.name}</h1>
        </div>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Main Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="md:col-span-2 space-y-6"
        >
          <p className="text-white/70 leading-relaxed">{tournament.description}</p>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-xl p-4">
              <div className="flex items-center gap-2 text-white/50 mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Date</span>
              </div>
              <p className="text-white font-medium">{tournament.date}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <div className="flex items-center gap-2 text-white/50 mb-1">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">Location</span>
              </div>
              <p className="text-white font-medium">{tournament.location}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <div className="flex items-center gap-2 text-white/50 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Time Control</span>
              </div>
              <p className="text-white font-medium">{tournament.timeControl}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <div className="flex items-center gap-2 text-white/50 mb-1">
                <Users className="w-4 h-4" />
                <span className="text-sm">Rounds</span>
              </div>
              <p className="text-white font-medium">{tournament.rounds > 0 ? `${tournament.rounds} rounds` : 'Arena'}</p>
            </div>
            {tournament.format && (
              <div className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center gap-2 text-white/50 mb-1">
                  <LayoutGrid className="w-4 h-4" />
                  <span className="text-sm">Format</span>
                </div>
                <p className="text-white font-medium">{tournament.format}</p>
              </div>
            )}
            {tournament.organizer && (
              <div className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center gap-2 text-white/50 mb-1">
                  <Building2 className="w-4 h-4" />
                  <span className="text-sm">Organizer</span>
                </div>
                <p className="text-white font-medium">{tournament.organizer}</p>
              </div>
            )}
          </div>

          {/* Rating Restrictions */}
          {(tournament.ratingMin || tournament.ratingMax) && (
            <div className="bg-white/5 rounded-xl p-4">
              <div className="flex items-center gap-2 text-white/50 mb-2">
                <Target className="w-4 h-4" />
                <span className="text-sm">Rating Eligibility</span>
              </div>
              <p className="text-white font-medium">
                {tournament.ratingMin && tournament.ratingMax
                  ? `${tournament.ratingMin} - ${tournament.ratingMax} ELO`
                  : tournament.ratingMin
                  ? `${tournament.ratingMin}+ ELO`
                  : `Under ${tournament.ratingMax} ELO`}
              </p>
            </div>
          )}

          {/* Players Progress */}
          <div className="bg-white/5 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/70">Players Registered</span>
              <span className="text-white font-medium">
                {tournament.players.current}/{tournament.players.max}
              </span>
            </div>
            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-gold-500 to-gold-400 rounded-full transition-all"
                style={{ width: `${(tournament.players.current / tournament.players.max) * 100}%` }}
              />
            </div>
            <p className="text-sm text-white/50 mt-2">
              {spotsLeft > 0 ? `${spotsLeft} spots remaining` : 'Tournament is full'}
            </p>
          </div>
        </motion.div>

        {/* Sidebar - Registration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-6 h-6 text-gold-400" />
              <span className="text-2xl font-bold text-white">{tournament.prize}</span>
            </div>
            <p className="text-white/50 text-sm mb-6">Prize Pool</p>

            <div className="border-t border-white/10 pt-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-white/70">Entry Fee</span>
                <span className="text-2xl font-bold text-white">${tournament.entryFee}</span>
              </div>
            </div>

            {/* Registration Form */}
            {user && !isFull && (
              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Player Name *</label>
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Full name"
                    className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-gold-500 focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Email *</label>
                  <input
                    type="email"
                    value={playerEmail}
                    onChange={(e) => setPlayerEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-gold-500 focus:outline-none transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1">Rating</label>
                    <input
                      type="number"
                      value={playerRating}
                      onChange={(e) => setPlayerRating(e.target.value)}
                      placeholder="1200"
                      className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-gold-500 focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={playerPhone}
                      onChange={(e) => setPlayerPhone(e.target.value)}
                      placeholder="Optional"
                      className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-gold-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleRegister}
              disabled={isFull}
              className="w-full py-4 bg-gradient-to-r from-gold-500 to-gold-600 text-chess-darker
                       font-semibold rounded-xl hover:from-gold-400 hover:to-gold-500
                       transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {!user ? 'Sign in to Register' : isFull ? 'Tournament Full' : 'Register Now'}
            </button>

            <button
              onClick={() => {
                if (!user) {
                  openAuthModal('login');
                  return;
                }
                if (isFavorite(tournament.id, 'tournament')) {
                  removeFavorite(tournament.id, 'tournament');
                } else {
                  addFavorite({
                    type: 'tournament',
                    itemId: tournament.id,
                    itemName: tournament.name,
                    itemImage: tournament.image,
                  });
                }
              }}
              className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all
                        ${isFavorite(tournament.id, 'tournament')
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-white/5 text-white/70 hover:bg-white/10'
                        }`}
            >
              <Heart className={`w-5 h-5 ${isFavorite(tournament.id, 'tournament') ? 'fill-current' : ''}`} />
              {isFavorite(tournament.id, 'tournament') ? 'Saved' : 'Save to Favorites'}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TournamentDetail;
