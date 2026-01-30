import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Trophy,
  FileText,
  Loader2,
  ArrowLeft,
  Gamepad2
} from 'lucide-react';
import { gamesApi } from '../api/games';
import { tournamentsApi, type Tournament } from '../api/tournaments';
import type { Game, GameWithDetails } from '../types/game';

const MyGames = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'games' | 'tournaments'>('games');
  const [gamesTab, setGamesTab] = useState<'created' | 'joined'>('created');
  const [tournamentsTab, setTournamentsTab] = useState<'organized' | 'registered'>('organized');

  // Games state
  const [createdGames, setCreatedGames] = useState<Game[]>([]);
  const [joinedGames, setJoinedGames] = useState<GameWithDetails[]>([]);
  const [loadingGames, setLoadingGames] = useState(true);

  // Tournaments state
  const [organizedTournaments, setOrganizedTournaments] = useState<Tournament[]>([]);
  const [registeredTournaments, setRegisteredTournaments] = useState<Tournament[]>([]);
  const [loadingTournaments, setLoadingTournaments] = useState(true);

  useEffect(() => {
    fetchGames();
  }, []);

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchGames = async () => {
    setLoadingGames(true);
    try {
      const [created, joined] = await Promise.all([
        gamesApi.getMyGames(),
        gamesApi.getJoinedGames()
      ]);
      setCreatedGames(created.data || []);
      setJoinedGames(joined.data || []);
    } catch (error) {
      console.error('Error fetching games:', error);
    } finally {
      setLoadingGames(false);
    }
  };

  const fetchTournaments = async () => {
    setLoadingTournaments(true);
    try {
      const [organized, registered] = await Promise.all([
        tournamentsApi.getMyTournaments(),
        tournamentsApi.getMyRegistrations()
      ]);
      setOrganizedTournaments(organized.data || []);
      setRegisteredTournaments(registered.data || []);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
    } finally {
      setLoadingTournaments(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; text: string }> = {
      open: { color: 'bg-green-500/20 text-green-400 border-green-500/30', text: 'Open' },
      completed: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', text: 'Completed' },
      cancelled: { color: 'bg-red-500/20 text-red-400 border-red-500/30', text: 'Cancelled' },
      upcoming: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', text: 'Upcoming' },
      ongoing: { color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', text: 'Ongoing' }
    };

    const badge = badges[status] || badges.open;
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const renderGameCard = (game: Game | GameWithDetails) => (
    <motion.div
      key={game.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all cursor-pointer"
      onClick={() => navigate(`/games/${game.id}`)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-white mb-2">{game.venue_name}</h3>
          {game.venue_address && (
            <p className="text-white/60 text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {game.venue_address}
            </p>
          )}
        </div>
        {getStatusBadge(game.status)}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center gap-2 text-white/70">
          <Calendar className="w-4 h-4" />
          <span className="text-sm">{formatDate(game.game_date)}</span>
        </div>
        <div className="flex items-center gap-2 text-white/70">
          <Clock className="w-4 h-4" />
          <span className="text-sm">{formatTime(game.game_time)}</span>
        </div>
        <div className="flex items-center gap-2 text-white/70">
          <Users className="w-4 h-4" />
          <span className="text-sm">
            {'participant_count' in game ? `${game.participant_count}/` : ''}{game.max_players} players
          </span>
        </div>
        {game.time_control && (
          <div className="flex items-center gap-2 text-white/70">
            <Trophy className="w-4 h-4" />
            <span className="text-sm">{game.time_control}</span>
          </div>
        )}
      </div>

      {game.status === 'completed' && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/games/${game.id}/record`);
          }}
          className="w-full mt-2 px-4 py-2 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-white rounded-lg transition-all flex items-center justify-center gap-2"
        >
          <FileText className="w-4 h-4" />
          View Game Record
        </button>
      )}
    </motion.div>
  );

  const renderTournamentCard = (tournament: Tournament) => (
    <motion.div
      key={tournament.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all cursor-pointer"
      onClick={() => navigate(`/tournament/${tournament.id}`)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-white mb-2">{tournament.name}</h3>
          {tournament.venue_name && (
            <p className="text-white/60 text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {tournament.venue_name}
            </p>
          )}
        </div>
        {getStatusBadge(tournament.status)}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center gap-2 text-white/70">
          <Calendar className="w-4 h-4" />
          <span className="text-sm">{formatDate(tournament.start_date)}</span>
        </div>
        <div className="flex items-center gap-2 text-white/70">
          <Users className="w-4 h-4" />
          <span className="text-sm">
            {tournament.current_participants}
            {tournament.max_participants && `/${tournament.max_participants}`} participants
          </span>
        </div>
        {tournament.tournament_type && (
          <div className="flex items-center gap-2 text-white/70">
            <Trophy className="w-4 h-4" />
            <span className="text-sm">{tournament.tournament_type}</span>
          </div>
        )}
        {tournament.entry_fee > 0 && (
          <div className="flex items-center gap-2 text-white/70">
            <span className="text-sm">${tournament.entry_fee.toFixed(2)} entry</span>
          </div>
        )}
      </div>

      {tournament.status === 'completed' && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/tournaments/${tournament.id}/record`);
          }}
          className="w-full mt-2 px-4 py-2 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-white rounded-lg transition-all flex items-center justify-center gap-2"
        >
          <FileText className="w-4 h-4" />
          View Tournament Record
        </button>
      )}
    </motion.div>
  );

  const currentGames = gamesTab === 'created' ? createdGames : joinedGames;
  const currentTournaments = tournamentsTab === 'organized' ? organizedTournaments : registeredTournaments;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a1a] to-[#1a1a2e] py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white/70" />
          </button>
          <h1 className="text-3xl font-bold text-white">My Games & Tournaments</h1>
        </div>

        {/* Main Tabs */}
        <div className="flex gap-4 mb-6 border-b border-white/10">
          <button
            onClick={() => setActiveTab('games')}
            className={`px-6 py-3 font-medium transition-colors relative ${
              activeTab === 'games'
                ? 'text-gold-400'
                : 'text-white/60 hover:text-white/80'
            }`}
          >
            <div className="flex items-center gap-2">
              <Gamepad2 className="w-5 h-5" />
              Games
            </div>
            {activeTab === 'games' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold-400" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('tournaments')}
            className={`px-6 py-3 font-medium transition-colors relative ${
              activeTab === 'tournaments'
                ? 'text-gold-400'
                : 'text-white/60 hover:text-white/80'
            }`}
          >
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Tournaments
            </div>
            {activeTab === 'tournaments' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold-400" />
            )}
          </button>
        </div>

        {/* Games Section */}
        {activeTab === 'games' && (
          <>
            {/* Games Sub-tabs */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={() => setGamesTab('created')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  gamesTab === 'created'
                    ? 'bg-gold-500 text-chess-darker'
                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                Created ({createdGames.length})
              </button>
              <button
                onClick={() => setGamesTab('joined')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  gamesTab === 'joined'
                    ? 'bg-gold-500 text-chess-darker'
                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                Joined ({joinedGames.length})
              </button>
            </div>

            {loadingGames ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-gold-400 animate-spin" />
              </div>
            ) : currentGames.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
                <Gamepad2 className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No games found</h3>
                <p className="text-white/60 mb-6">
                  {gamesTab === 'created'
                    ? "You haven't created any games yet"
                    : "You haven't joined any games yet"}
                </p>
                <button
                  onClick={() => navigate('/games')}
                  className="px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-white rounded-lg transition-all"
                >
                  Browse Games
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentGames.map(renderGameCard)}
              </div>
            )}
          </>
        )}

        {/* Tournaments Section */}
        {activeTab === 'tournaments' && (
          <>
            {/* Tournaments Sub-tabs */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={() => setTournamentsTab('organized')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  tournamentsTab === 'organized'
                    ? 'bg-gold-500 text-chess-darker'
                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                Organized ({organizedTournaments.length})
              </button>
              <button
                onClick={() => setTournamentsTab('registered')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  tournamentsTab === 'registered'
                    ? 'bg-gold-500 text-chess-darker'
                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                Registered ({registeredTournaments.length})
              </button>
            </div>

            {loadingTournaments ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-gold-400 animate-spin" />
              </div>
            ) : currentTournaments.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
                <Trophy className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No tournaments found</h3>
                <p className="text-white/60 mb-6">
                  {tournamentsTab === 'organized'
                    ? "You haven't organized any tournaments yet"
                    : "You haven't registered for any tournaments yet"}
                </p>
                <button
                  onClick={() => navigate('/tournaments')}
                  className="px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-white rounded-lg transition-all"
                >
                  Browse Tournaments
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentTournaments.map(renderTournamentCard)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MyGames;
