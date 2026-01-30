import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStore } from '../store';
import { gamesApi } from '../api/games';
import { bookingsApi } from '../api/bookings';
import { tournamentsApi } from '../api/tournaments';
import { clubsApi } from '../api/clubs';
import { venuesApi } from '../api/venues';
import type { GameWithDetails } from '../types/game';
import { Calendar, Clock, MapPin, Users, X, ChevronDown, ChevronUp, ArrowLeft, Sparkles, Trophy, CheckCircle, Building2 } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const user = useStore((state) => state.user);
  const openAuthModal = useStore((state) => state.openAuthModal);
  const [activeTab, setActiveTab] = useState<'created' | 'joined' | 'bookings' | 'tournaments' | 'clubs' | 'venues'>('created');
  const [myGames, setMyGames] = useState<GameWithDetails[]>([]);
  const [joinedGames, setJoinedGames] = useState<GameWithDetails[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [clubs, setClubs] = useState<any[]>([]);
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedGameId, setExpandedGameId] = useState<number | null>(null);

  const fetchGames = async () => {
    try {
      setLoading(true);
      const [myGamesResponse, joinedGamesResponse, bookingsResponse, tournamentsResponse, clubsResponse, venuesResponse] = await Promise.all([
        gamesApi.getMyGames(),
        gamesApi.getJoinedGames(),
        bookingsApi.getUserBookings(),
        tournamentsApi.getMyRegistrations(),
        clubsApi.getMyMemberships(),
        venuesApi.getUserVenueSubmissions()
      ]);

      // Fetch full details including participants for all games
      const myGamesWithDetails = await Promise.all(
        myGamesResponse.data.map(async (game: any) => {
          try {
            const detailsResponse = await gamesApi.getGameById(game.id);
            return detailsResponse.data;
          } catch (error) {
            return game;
          }
        })
      );

      const joinedGamesWithDetails = await Promise.all(
        joinedGamesResponse.data.map(async (game: any) => {
          try {
            const detailsResponse = await gamesApi.getGameById(game.id);
            return detailsResponse.data;
          } catch (error) {
            return game;
          }
        })
      );

      setMyGames(myGamesWithDetails);
      setJoinedGames(joinedGamesWithDetails);
      setBookings(bookingsResponse.data || []);
      setTournaments(tournamentsResponse.data || []);
      setClubs(clubsResponse.data || []);
      setVenues(venuesResponse.data || []);
    } catch (error) {
      console.error('Error fetching games:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
    // Refresh every 30 seconds for new participants
    const interval = setInterval(fetchGames, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleCancelGame = async (gameId: number) => {
    if (!confirm('Are you sure you want to cancel this game?')) return;

    try {
      await gamesApi.cancelGame(gameId);
      await fetchGames();
    } catch (error) {
      console.error('Error cancelling game:', error);
    }
  };

  const handleLeaveGame = async (gameId: number) => {
    if (!confirm('Are you sure you want to leave this game?')) return;

    try {
      await gamesApi.leaveGame(gameId);
      await fetchGames();
    } catch (error) {
      console.error('Error leaving game:', error);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const renderBookingCard = (booking: any) => {
    return (
      <motion.div
        key={booking.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 rounded-2xl border border-white/10 p-6 hover:bg-white/10 transition-all"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-gold-400 to-gold-600 rounded-full flex items-center justify-center text-lg font-bold text-black">
                {booking.master_name?.charAt(0) || 'M'}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {booking.master_name}
                </h3>
                <p className="text-sm text-gold-400">{booking.master_title}</p>
              </div>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            {booking.status}
          </span>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-center text-sm text-white/70">
            <Trophy className="w-4 h-4 mr-2 text-gold-400" />
            <span className="capitalize">{booking.session_type}</span>
          </div>
          <div className="flex items-center text-sm text-white/70">
            <Calendar className="w-4 h-4 mr-2 text-gold-400" />
            {formatDate(booking.booking_date)}
          </div>
          <div className="flex items-center text-sm text-white/70">
            <Clock className="w-4 h-4 mr-2 text-gold-400" />
            {formatTime(booking.booking_time)}
          </div>
          <div className="flex items-center text-sm text-white/70">
            <MapPin className="w-4 h-4 mr-2 text-gold-400" />
            <span className="capitalize">{booking.location_type}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm pt-3 border-t border-white/10">
          <div className="text-white/60">
            {booking.number_of_games} game{booking.number_of_games > 1 ? 's' : ''} • {booking.time_control}
          </div>
          <div className="font-semibold text-gold-400">
            ${booking.total_price}
          </div>
        </div>
      </motion.div>
    );
  };

  const renderTournamentCard = (tournament: any) => {
    return (
      <motion.div
        key={tournament.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 rounded-2xl border border-white/10 p-6 hover:bg-white/10 transition-all"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Tournament Registration
                </h3>
                <p className="text-sm text-purple-400">Player: {tournament.player_name}</p>
              </div>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            {tournament.status}
          </span>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-center text-sm text-white/70">
            <Users className="w-4 h-4 mr-2 text-purple-400" />
            <span>Rating: {tournament.player_rating || 'Unrated'}</span>
          </div>
          <div className="flex items-center text-sm text-white/70">
            <Calendar className="w-4 h-4 mr-2 text-purple-400" />
            Registered {new Date(tournament.created_at).toLocaleDateString()}
          </div>
        </div>

        <div className="flex items-center justify-between text-sm pt-3 border-t border-white/10">
          <div className="text-white/60">
            Entry Fee Paid
          </div>
          <div className="font-semibold text-gold-400">
            ${tournament.entry_fee}
          </div>
        </div>
      </motion.div>
    );
  };

  const renderClubCard = (club: any) => {
    return (
      <motion.div
        key={club.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 rounded-2xl border border-white/10 p-6 hover:bg-white/10 transition-all"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Club Membership
                </h3>
                <p className="text-sm text-blue-400">Member: {club.member_name}</p>
              </div>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            {club.status}
          </span>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-center text-sm text-white/70">
            <MapPin className="w-4 h-4 mr-2 text-blue-400" />
            <span>Club ID: {club.club_id}</span>
          </div>
          <div className="flex items-center text-sm text-white/70">
            <Users className="w-4 h-4 mr-2 text-blue-400" />
            <span>Rating: {club.member_rating || 'Unrated'}</span>
          </div>
          <div className="flex items-center text-sm text-white/70">
            <Calendar className="w-4 h-4 mr-2 text-blue-400" />
            <span className="capitalize">{club.membership_type} Membership</span>
          </div>
          <div className="flex items-center text-sm text-white/70">
            <Calendar className="w-4 h-4 mr-2 text-blue-400" />
            Joined {new Date(club.created_at).toLocaleDateString()}
          </div>
        </div>

        <div className="flex items-center justify-between text-sm pt-3 border-t border-white/10">
          <div className="text-white/60">
            Membership Fee Paid
          </div>
          <div className="font-semibold text-gold-400">
            ${club.membership_fee}
          </div>
        </div>
      </motion.div>
    );
  };

  const renderVenueCard = (venue: any) => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'approved':
          return 'bg-green-500/20 text-green-400';
        case 'rejected':
          return 'bg-red-500/20 text-red-400';
        default:
          return 'bg-yellow-500/20 text-yellow-400';
      }
    };

    return (
      <motion.div
        key={venue.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 rounded-2xl border border-white/10 p-6 hover:bg-white/10 transition-all"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-gold-400 to-gold-600 rounded-full flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {venue.venue_name}
                </h3>
                <p className="text-sm text-gold-400 capitalize">{venue.venue_type.replace('_', ' ')}</p>
              </div>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(venue.status)}`}>
            <CheckCircle className="w-3 h-3" />
            {venue.status}
          </span>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-center text-sm text-white/70">
            <MapPin className="w-4 h-4 mr-2 text-gold-400" />
            <span>{venue.city}, {venue.country}</span>
          </div>
          <div className="flex items-center text-sm text-white/70">
            <Calendar className="w-4 h-4 mr-2 text-gold-400" />
            Submitted {new Date(venue.created_at).toLocaleDateString()}
          </div>
          {venue.description && (
            <p className="text-sm text-white/60 line-clamp-2">{venue.description}</p>
          )}
        </div>

        {venue.status === 'pending' && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-xs text-yellow-400">
            Your venue is being reviewed. We'll notify you once it's approved.
          </div>
        )}
        {venue.status === 'approved' && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-xs text-green-400">
            Your venue is live and visible to all users!
          </div>
        )}
        {venue.status === 'rejected' && venue.admin_notes && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-xs text-red-400">
            Rejected: {venue.admin_notes}
          </div>
        )}
      </motion.div>
    );
  };

  const renderGameCard = (game: GameWithDetails, isCreator: boolean) => {
    const hasNewParticipants = isCreator && game.participant_count > 0;
    const isExpanded = expandedGameId === game.id;

    return (
      <motion.div
        key={game.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-white/5 rounded-2xl border p-6 hover:bg-white/10 transition-all ${
          hasNewParticipants ? 'border-gold-500 shadow-lg shadow-gold-500/20' : 'border-white/10'
        }`}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-1">
              {game.venue_name}
            </h3>
            {game.venue_address && (
              <div className="flex items-center text-sm text-white/50 mb-2">
                <MapPin className="w-4 h-4 mr-1" />
                {game.venue_address}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                game.status === 'open'
                  ? 'bg-green-500/20 text-green-400'
                  : game.status === 'full'
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-white/10 text-white/50'
              }`}
            >
              {game.status}
            </span>
            {hasNewParticipants && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-gold-500/20 text-gold-400 animate-pulse flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                New Players!
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center text-sm text-white/70">
            <Calendar className="w-4 h-4 mr-2 text-gold-400" />
            {formatDate(game.game_date)}
          </div>
          <div className="flex items-center text-sm text-white/70">
            <Clock className="w-4 h-4 mr-2 text-gold-400" />
            {formatTime(game.game_time)}
          </div>
        </div>

        {game.description && (
          <p className="text-sm text-white/60 mb-4 line-clamp-2">{game.description}</p>
        )}

        <div className="flex items-center justify-between text-sm mb-4">
          <div className="flex items-center text-white/70">
            <Users className="w-4 h-4 mr-2 text-gold-400" />
            <span>
              {game.participant_count} / {game.max_players} players
            </span>
          </div>
          {game.time_control && (
            <span className="text-white/60 bg-white/5 px-2 py-1 rounded">{game.time_control}</span>
          )}
          {game.player_level && (
            <span className="text-white/60 bg-white/5 px-2 py-1 rounded">{game.player_level}</span>
          )}
        </div>

        {isCreator && game.participant_count > 0 && (
          <div className="border-t border-white/10 pt-4 mt-4">
            <button
              onClick={() => setExpandedGameId(isExpanded ? null : game.id)}
              className="flex items-center justify-between w-full text-left font-medium text-gold-400 hover:text-gold-300 transition-colors mb-2"
            >
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Players who joined ({game.participant_count})
              </span>
              {isExpanded ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>

            {isExpanded && game.participants && game.participants.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-2 mt-3"
              >
                {game.participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10"
                  >
                    <div className="flex items-center gap-3">
                      {participant.avatar ? (
                        <img
                          src={participant.avatar}
                          alt={participant.name}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center text-chess-darker font-semibold">
                          {participant.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-white">
                          {participant.name}
                        </div>
                        <div className="text-sm text-white/50">
                          Rating: {participant.rating || 'Unrated'}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-white/40">
                      {new Date(participant.joined_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </div>
        )}

        {!isCreator && (
          <div className="border-t border-white/10 pt-4 mt-4">
            <div className="flex items-center gap-3">
              <div className="text-sm text-white/50">Game Creator:</div>
              <div className="flex items-center gap-2">
                {game.creator_avatar ? (
                  <img
                    src={game.creator_avatar}
                    alt={game.creator_name}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center text-chess-darker font-semibold text-sm">
                    {game.creator_name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="font-medium text-white text-sm">{game.creator_name}</div>
                  <div className="text-xs text-white/40">
                    Rating: {game.creator_rating || 'Unrated'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 mt-4 pt-4 border-t border-white/10">
          {isCreator ? (
            <>
              <Link
                to={`/location/${game.id}`}
                className="flex-1 px-4 py-2 bg-gold-500 text-chess-darker font-medium rounded-xl hover:bg-gold-400 transition-colors text-center"
              >
                View Venue
              </Link>
              {game.status !== 'cancelled' && (
                <button
                  onClick={() => handleCancelGame(game.id)}
                  className="px-4 py-2 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors border border-red-500/30"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </>
          ) : (
            <>
              <Link
                to={`/location/${game.id}`}
                className="flex-1 px-4 py-2 bg-gold-500 text-chess-darker font-medium rounded-xl hover:bg-gold-400 transition-colors text-center"
              >
                View Venue
              </Link>
              <button
                onClick={() => handleLeaveGame(game.id)}
                className="px-4 py-2 bg-red-500/20 text-red-400 font-medium rounded-xl hover:bg-red-500/30 transition-colors border border-red-500/30"
              >
                Leave
              </button>
            </>
          )}
        </div>
      </motion.div>
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center mx-auto mb-6">
            <Users className="w-10 h-10 text-chess-darker" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Sign in to view your dashboard
          </h2>
          <p className="text-white/50 mb-6">
            Manage your chess games and see who's joined
          </p>
          <button
            onClick={() => openAuthModal('login')}
            className="px-6 py-3 bg-gold-500 text-chess-darker font-semibold rounded-xl hover:bg-gold-400 transition-colors"
          >
            Sign In
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 md:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <div className="text-center">
          <h1 className="text-3xl font-display font-bold text-white mb-1">My Dashboard</h1>
          <p className="text-white/50 text-sm">Manage your chess games and connections</p>
        </div>
        <div className="w-20" />
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-white/10">
        <button
          onClick={() => setActiveTab('created')}
          className={`px-6 py-3 font-medium transition-colors relative ${
            activeTab === 'created'
              ? 'text-gold-400'
              : 'text-white/50 hover:text-white/70'
          }`}
        >
          Games I Created
          {myGames.length > 0 && (
            <span className="ml-2 px-2 py-1 bg-gold-500/20 text-gold-400 rounded-full text-xs">
              {myGames.length}
            </span>
          )}
          {activeTab === 'created' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold-400" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('joined')}
          className={`px-6 py-3 font-medium transition-colors relative ${
            activeTab === 'joined'
              ? 'text-gold-400'
              : 'text-white/50 hover:text-white/70'
          }`}
        >
          Games I Joined
          {joinedGames.length > 0 && (
            <span className="ml-2 px-2 py-1 bg-gold-500/20 text-gold-400 rounded-full text-xs">
              {joinedGames.length}
            </span>
          )}
          {activeTab === 'joined' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold-400" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('bookings')}
          className={`px-6 py-3 font-medium transition-colors relative ${
            activeTab === 'bookings'
              ? 'text-gold-400'
              : 'text-white/50 hover:text-white/70'
          }`}
        >
          My Bookings
          {bookings.length > 0 && (
            <span className="ml-2 px-2 py-1 bg-gold-500/20 text-gold-400 rounded-full text-xs">
              {bookings.length}
            </span>
          )}
          {activeTab === 'bookings' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold-400" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('tournaments')}
          className={`px-6 py-3 font-medium transition-colors relative ${
            activeTab === 'tournaments'
              ? 'text-gold-400'
              : 'text-white/50 hover:text-white/70'
          }`}
        >
          My Tournaments
          {tournaments.length > 0 && (
            <span className="ml-2 px-2 py-1 bg-gold-500/20 text-gold-400 rounded-full text-xs">
              {tournaments.length}
            </span>
          )}
          {activeTab === 'tournaments' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold-400" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('clubs')}
          className={`px-6 py-3 font-medium transition-colors relative ${
            activeTab === 'clubs'
              ? 'text-gold-400'
              : 'text-white/50 hover:text-white/70'
          }`}
        >
          My Clubs
          {clubs.length > 0 && (
            <span className="ml-2 px-2 py-1 bg-gold-500/20 text-gold-400 rounded-full text-xs">
              {clubs.length}
            </span>
          )}
          {activeTab === 'clubs' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold-400" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('venues')}
          className={`px-6 py-3 font-medium transition-colors relative ${
            activeTab === 'venues'
              ? 'text-gold-400'
              : 'text-white/50 hover:text-white/70'
          }`}
        >
          My Venues
          {venues.length > 0 && (
            <span className="ml-2 px-2 py-1 bg-gold-500/20 text-gold-400 rounded-full text-xs">
              {venues.length}
            </span>
          )}
          {activeTab === 'venues' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold-400" />
          )}
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-white/50">Loading your games...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeTab === 'created' ? (
            myGames.length > 0 ? (
              myGames.map((game) => renderGameCard(game, true))
            ) : (
              <div className="col-span-full text-center py-12">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="max-w-md mx-auto"
                >
                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/10">
                    <Users className="w-8 h-8 text-white/30" />
                  </div>
                  <div className="text-white/50 mb-4">
                    You haven't created any games yet
                  </div>
                  <Link
                    to="/locations"
                    className="inline-block px-6 py-3 bg-gold-500 text-chess-darker font-semibold rounded-xl hover:bg-gold-400 transition-colors"
                  >
                    Find a venue to create your first game
                  </Link>
                </motion.div>
              </div>
            )
          ) : activeTab === 'joined' ? (
            joinedGames.length > 0 ? (
              joinedGames.map((game) => renderGameCard(game, false))
            ) : (
              <div className="col-span-full text-center py-12">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="max-w-md mx-auto"
                >
                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/10">
                    <Users className="w-8 h-8 text-white/30" />
                  </div>
                  <div className="text-white/50 mb-4">
                    You haven't joined any games yet
                  </div>
                  <Link
                    to="/locations"
                    className="inline-block px-6 py-3 bg-gold-500 text-chess-darker font-semibold rounded-xl hover:bg-gold-400 transition-colors"
                  >
                    Browse venues to find a game
                  </Link>
                </motion.div>
              </div>
            )
          ) : activeTab === 'bookings' ? (
            bookings.length > 0 ? (
              bookings.map((booking) => renderBookingCard(booking))
            ) : (
              <div className="col-span-full text-center py-12">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="max-w-md mx-auto"
                >
                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/10">
                    <Trophy className="w-8 h-8 text-white/30" />
                  </div>
                  <div className="text-white/50 mb-4">
                    You haven't booked any sessions yet
                  </div>
                  <Link
                    to="/masters"
                    className="inline-block px-6 py-3 bg-gold-500 text-chess-darker font-semibold rounded-xl hover:bg-gold-400 transition-colors"
                  >
                    Browse masters to book a session
                  </Link>
                </motion.div>
              </div>
            )
          ) : activeTab === 'tournaments' ? (
            tournaments.length > 0 ? (
              tournaments.map((tournament) => renderTournamentCard(tournament))
            ) : (
              <div className="col-span-full text-center py-12">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="max-w-md mx-auto"
                >
                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/10">
                    <Trophy className="w-8 h-8 text-white/30" />
                  </div>
                  <div className="text-white/50 mb-4">
                    You haven't registered for any tournaments yet
                  </div>
                  <Link
                    to="/tournaments"
                    className="inline-block px-6 py-3 bg-gold-500 text-chess-darker font-semibold rounded-xl hover:bg-gold-400 transition-colors"
                  >
                    Browse tournaments
                  </Link>
                </motion.div>
              </div>
            )
          ) : activeTab === 'clubs' ? (
            clubs.length > 0 ? (
              clubs.map((club) => renderClubCard(club))
            ) : (
              <div className="col-span-full text-center py-12">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="max-w-md mx-auto"
                >
                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/10">
                    <Users className="w-8 h-8 text-white/30" />
                  </div>
                  <div className="text-white/50 mb-4">
                    You haven't joined any clubs yet
                  </div>
                  <Link
                    to="/clubs"
                    className="inline-block px-6 py-3 bg-gold-500 text-chess-darker font-semibold rounded-xl hover:bg-gold-400 transition-colors"
                  >
                    Browse clubs
                  </Link>
                </motion.div>
              </div>
            )
          ) : venues.length > 0 ? (
            venues.map((venue) => renderVenueCard(venue))
          ) : (
            <div className="col-span-full text-center py-12">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md mx-auto"
              >
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/10">
                  <Building2 className="w-8 h-8 text-white/30" />
                </div>
                <div className="text-white/50 mb-4">
                  You haven't submitted any venues yet
                </div>
                <Link
                  to="/register-venue"
                  className="inline-block px-6 py-3 bg-gold-500 text-chess-darker font-semibold rounded-xl hover:bg-gold-400 transition-colors"
                >
                  Register a Venue
                </Link>
              </motion.div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
