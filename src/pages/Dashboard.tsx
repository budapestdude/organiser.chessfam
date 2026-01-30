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
import { Calendar, Clock, MapPin, Users, X, ChevronDown, ChevronUp, ArrowLeft, Sparkles, Trophy, CheckCircle, Building2, Edit, DollarSign, TrendingUp, UsersIcon } from 'lucide-react';
import { authorSubscriptionsApi } from '../api/authorSubscriptions';

export default function Dashboard() {
  const navigate = useNavigate();
  const user = useStore((state) => state.user);
  const openAuthModal = useStore((state) => state.openAuthModal);
  const [activeTab, setActiveTab] = useState<'games' | 'bookings' | 'tournaments' | 'clubs' | 'venues' | 'author-dashboard'>('games');
  const [myGames, setMyGames] = useState<GameWithDetails[]>([]);
  const [joinedGames, setJoinedGames] = useState<GameWithDetails[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [organizedTournaments, setOrganizedTournaments] = useState<any[]>([]);
  const [clubs, setClubs] = useState<any[]>([]);
  const [venues, setVenues] = useState<any[]>([]);
  const [authorStats, setAuthorStats] = useState<any>(null);
  const [authorSubscribers, setAuthorSubscribers] = useState<any[]>([]);
  const [authorPricing, setAuthorPricing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authorLoading, setAuthorLoading] = useState(false);
  const [expandedGameId, setExpandedGameId] = useState<number | null>(null);

  const fetchGames = async () => {
    try {
      setLoading(true);
      const [myGamesResponse, joinedGamesResponse, bookingsResponse, tournamentsResponse, organizedTournamentsResponse, clubsResponse, venuesResponse] = await Promise.all([
        gamesApi.getMyGames(),
        gamesApi.getJoinedGames(),
        bookingsApi.getUserBookings(),
        tournamentsApi.getMyRegistrations(),
        tournamentsApi.getMyTournaments(),
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
      setOrganizedTournaments(organizedTournamentsResponse.data || []);
      setClubs(clubsResponse.data || []);
      setVenues(venuesResponse.data || []);
    } catch (error) {
      console.error('Error fetching games:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch if user is authenticated
    if (!user) return;

    fetchGames();
    // Poll every 2 minutes to show new participants/updates
    const interval = setInterval(fetchGames, 120000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    // Fetch author subscription data when switching to author-dashboard tab
    if (activeTab === 'author-dashboard' && user) {
      fetchAuthorData();
    }
  }, [activeTab, user]);

  const fetchAuthorData = async () => {
    if (!user) return;

    try {
      setAuthorLoading(true);
      const [statsResponse, subscribersResponse, pricingResponse] = await Promise.all([
        authorSubscriptionsApi.getStats(),
        authorSubscriptionsApi.getSubscribers({ limit: 100 }),
        authorSubscriptionsApi.getPricing(user.id)
      ]);

      setAuthorStats(statsResponse.data);
      setAuthorSubscribers(subscribersResponse.data || []);
      setAuthorPricing(pricingResponse.data);
    } catch (error) {
      console.error('Error fetching author data:', error);
    } finally {
      setAuthorLoading(false);
    }
  };

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

  // Combined games - merge created and joined, mark which is which, exclude cancelled
  const allGames = [
    ...myGames.filter(g => g.status !== 'cancelled').map(g => ({ ...g, isCreator: true })),
    ...joinedGames.filter(g => g.status !== 'cancelled').map(g => ({ ...g, isCreator: false }))
  ].sort((a, b) => new Date(b.game_date).getTime() - new Date(a.game_date).getTime());

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

  const renderOrganizedTournamentCard = (tournament: any) => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'upcoming':
          return 'bg-blue-500/20 text-blue-400';
        case 'ongoing':
          return 'bg-green-500/20 text-green-400';
        case 'completed':
          return 'bg-purple-500/20 text-purple-400';
        case 'cancelled':
          return 'bg-red-500/20 text-red-400';
        default:
          return 'bg-white/10 text-white/50';
      }
    };

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
              <div className="w-12 h-12 bg-gradient-to-br from-gold-400 to-gold-600 rounded-full flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {tournament.name}
                </h3>
                <p className="text-sm text-gold-400">Organizer</p>
              </div>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(tournament.status)}`}>
            <CheckCircle className="w-3 h-3" />
            {tournament.status}
          </span>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-center text-sm text-white/70">
            <Calendar className="w-4 h-4 mr-2 text-gold-400" />
            {new Date(tournament.start_date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </div>
          <div className="flex items-center text-sm text-white/70">
            <Users className="w-4 h-4 mr-2 text-gold-400" />
            {tournament.current_participants || 0} / {tournament.max_participants || '∞'} participants
          </div>
          {tournament.venue_name && (
            <div className="flex items-center text-sm text-white/70">
              <MapPin className="w-4 h-4 mr-2 text-gold-400" />
              {tournament.venue_name}
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-3 border-t border-white/10">
          <Link
            to={`/tournament/${tournament.id}`}
            className="flex-1 px-4 py-2 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition-colors text-center"
          >
            View
          </Link>
          {tournament.status === 'upcoming' && (
            <Link
              to={`/tournaments/edit/${tournament.id}`}
              className="px-4 py-2 bg-gold-500/20 text-gold-400 font-medium rounded-xl hover:bg-gold-500/30 transition-colors border border-gold-500/30 flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit
            </Link>
          )}
          <Link
            to={`/tournaments/${tournament.id}/participants`}
            className="px-4 py-2 bg-primary-500/20 text-primary-400 font-medium rounded-xl hover:bg-primary-500/30 transition-colors border border-primary-500/30"
          >
            Participants
          </Link>
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

  const renderGameCard = (game: GameWithDetails & { isCreator: boolean }) => {
    const hasNewParticipants = game.isCreator && game.participant_count > 0;
    const isExpanded = expandedGameId === game.id;

    return (
      <motion.div
        key={`${game.id}-${game.isCreator ? 'created' : 'joined'}`}
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
          <div className="flex gap-2 flex-wrap justify-end">
            {/* Role badge */}
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              game.isCreator
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
            }`}>
              {game.isCreator ? 'Creator' : 'Joined'}
            </span>
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

        {game.isCreator && game.participant_count > 0 && (
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

        {!game.isCreator && (
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
          {game.isCreator ? (
            <>
              <Link
                to={`/games/${game.id}`}
                className="flex-1 px-4 py-2 bg-gold-500 text-chess-darker font-medium rounded-xl hover:bg-gold-400 transition-colors text-center"
              >
                View Game
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
                to={`/games/${game.id}`}
                className="flex-1 px-4 py-2 bg-gold-500 text-chess-darker font-medium rounded-xl hover:bg-gold-400 transition-colors text-center"
              >
                View Game
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
      <div className="flex gap-4 mb-6 border-b border-white/10 overflow-x-auto">
        <button
          onClick={() => setActiveTab('games')}
          className={`px-6 py-3 font-medium transition-colors relative whitespace-nowrap ${
            activeTab === 'games'
              ? 'text-gold-400'
              : 'text-white/50 hover:text-white/70'
          }`}
        >
          My Games
          {allGames.length > 0 && (
            <span className="ml-2 px-2 py-1 bg-gold-500/20 text-gold-400 rounded-full text-xs">
              {allGames.length}
            </span>
          )}
          {activeTab === 'games' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold-400" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('bookings')}
          className={`px-6 py-3 font-medium transition-colors relative whitespace-nowrap ${
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
          className={`px-6 py-3 font-medium transition-colors relative whitespace-nowrap ${
            activeTab === 'tournaments'
              ? 'text-gold-400'
              : 'text-white/50 hover:text-white/70'
          }`}
        >
          My Tournaments
          {(tournaments.length + organizedTournaments.length) > 0 && (
            <span className="ml-2 px-2 py-1 bg-gold-500/20 text-gold-400 rounded-full text-xs">
              {tournaments.length + organizedTournaments.length}
            </span>
          )}
          {activeTab === 'tournaments' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold-400" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('clubs')}
          className={`px-6 py-3 font-medium transition-colors relative whitespace-nowrap ${
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
          className={`px-6 py-3 font-medium transition-colors relative whitespace-nowrap ${
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
        <button
          onClick={() => setActiveTab('author-dashboard')}
          className={`px-6 py-3 font-medium transition-colors relative whitespace-nowrap ${
            activeTab === 'author-dashboard'
              ? 'text-gold-400'
              : 'text-white/50 hover:text-white/70'
          }`}
        >
          Author Dashboard
          {authorStats?.totalActiveSubscribers > 0 && (
            <span className="ml-2 px-2 py-1 bg-gold-500/20 text-gold-400 rounded-full text-xs">
              {authorStats.totalActiveSubscribers}
            </span>
          )}
          {activeTab === 'author-dashboard' && (
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
          {activeTab === 'games' ? (
            allGames.length > 0 ? (
              allGames.map((game) => renderGameCard(game))
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
                    You don't have any games yet
                  </div>
                  <Link
                    to="/locations"
                    className="inline-block px-6 py-3 bg-gold-500 text-chess-darker font-semibold rounded-xl hover:bg-gold-400 transition-colors"
                  >
                    Find a venue to create or join a game
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
            <>
              {/* Organized Tournaments */}
              {organizedTournaments.length > 0 && (
                <>
                  <div className="col-span-full mb-4">
                    <h2 className="text-xl font-bold text-white mb-2">Tournaments You Organize</h2>
                    <p className="text-white/50 text-sm">Manage your tournaments and track participants</p>
                  </div>
                  {organizedTournaments.map((tournament) => renderOrganizedTournamentCard(tournament))}
                </>
              )}

              {/* Registered Tournaments */}
              {tournaments.length > 0 && (
                <>
                  <div className="col-span-full mb-4 mt-8">
                    <h2 className="text-xl font-bold text-white mb-2">Tournaments You're Registered For</h2>
                    <p className="text-white/50 text-sm">Your tournament registrations</p>
                  </div>
                  {tournaments.map((tournament) => renderTournamentCard(tournament))}
                </>
              )}

              {/* Empty State */}
              {organizedTournaments.length === 0 && tournaments.length === 0 && (
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
                      You haven't created or joined any tournaments yet
                    </div>
                    <div className="flex gap-3 justify-center">
                      <Link
                        to="/tournaments/create"
                        className="px-6 py-3 bg-gold-500 text-chess-darker font-semibold rounded-xl hover:bg-gold-400 transition-colors"
                      >
                        Create Tournament
                      </Link>
                      <Link
                        to="/tournaments"
                        className="px-6 py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors"
                      >
                        Browse Tournaments
                      </Link>
                    </div>
                  </motion.div>
                </div>
              )}
            </>
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
          ) : activeTab === 'venues' ? (
            venues.length > 0 ? (
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
            )
          ) : activeTab === 'author-dashboard' ? (
            authorLoading ? (
              <div className="col-span-full flex items-center justify-center py-12">
                <div className="text-white/50">Loading author dashboard...</div>
              </div>
            ) : !authorPricing?.enabled ? (
              <div className="col-span-full text-center py-12">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="max-w-md mx-auto"
                >
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center mx-auto mb-4">
                    <DollarSign className="w-8 h-8 text-black" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Start Earning from Your Content</h3>
                  <div className="text-white/60 mb-6">
                    Set up your Substack-style subscription pricing and start monetizing your chess articles
                  </div>
                  <Link
                    to="/author-pricing-setup"
                    className="inline-block px-6 py-3 bg-gold-500 text-chess-darker font-semibold rounded-xl hover:bg-gold-400 transition-colors"
                  >
                    Setup Author Subscriptions
                  </Link>
                </motion.div>
              </div>
            ) : (
              <>
                {/* Stats Cards */}
                <div className="col-span-full grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-gold-500/10 to-gold-600/5 border border-gold-500/20 rounded-2xl p-6"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/60 text-sm">Active Subscribers</span>
                      <UsersIcon className="w-5 h-5 text-gold-400" />
                    </div>
                    <div className="text-3xl font-bold text-white">
                      {authorStats?.totalActiveSubscribers || 0}
                    </div>
                    {authorStats?.newSubscribersThisMonth > 0 && (
                      <div className="text-green-400 text-sm mt-1">
                        +{authorStats.newSubscribersThisMonth} this month
                      </div>
                    )}
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-2xl p-6"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/60 text-sm">MRR</span>
                      <TrendingUp className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="text-3xl font-bold text-white">
                      €{((authorStats?.mrr || 0) / 100).toFixed(2)}
                    </div>
                    <div className="text-white/50 text-sm mt-1">
                      Monthly Recurring Revenue
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-2xl p-6"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/60 text-sm">Lifetime Revenue</span>
                      <DollarSign className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="text-3xl font-bold text-white">
                      €{((authorStats?.lifetimeRevenue || 0) / 100).toFixed(2)}
                    </div>
                    <div className="text-white/50 text-sm mt-1">
                      Total earnings
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-2xl p-6"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/60 text-sm">Avg per Subscriber</span>
                      <DollarSign className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="text-3xl font-bold text-white">
                      €{authorStats?.totalActiveSubscribers > 0
                        ? ((authorStats.mrr / authorStats.totalActiveSubscribers) / 100).toFixed(2)
                        : '0.00'}
                    </div>
                    <div className="text-white/50 text-sm mt-1">
                      Per month
                    </div>
                  </motion.div>
                </div>

                {/* Pricing Info & Actions */}
                <div className="col-span-full mb-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/5 border border-white/10 rounded-2xl p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-white">Your Subscription Pricing</h3>
                      <Link
                        to="/author-pricing-setup"
                        className="px-4 py-2 bg-gold-500/20 text-gold-400 rounded-lg hover:bg-gold-500/30 transition-all flex items-center gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        Edit Pricing
                      </Link>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white/5 rounded-xl p-4">
                        <div className="text-white/60 text-sm mb-2">Monthly Subscription</div>
                        <div className="text-2xl font-bold text-white">
                          €{((authorPricing?.monthlyPriceCents || 0) / 100).toFixed(2)}/month
                        </div>
                        {authorPricing?.monthlyPremiumDiscountPercent > 0 && (
                          <div className="text-green-400 text-sm mt-1">
                            {authorPricing.monthlyPremiumDiscountPercent}% discount for premium members
                          </div>
                        )}
                      </div>
                      <div className="bg-white/5 rounded-xl p-4">
                        <div className="text-white/60 text-sm mb-2">Annual Subscription</div>
                        <div className="text-2xl font-bold text-white">
                          €{((authorPricing?.annualPriceCents || 0) / 100).toFixed(2)}/year
                        </div>
                        {authorPricing?.annualPremiumDiscountPercent > 0 && (
                          <div className="text-green-400 text-sm mt-1">
                            {authorPricing.annualPremiumDiscountPercent}% discount for premium members
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Subscribers List */}
                <div className="col-span-full">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white">Recent Subscribers</h2>
                    {authorSubscribers.length > 5 && (
                      <Link
                        to="/author-subscriptions"
                        className="text-gold-400 hover:text-gold-300 text-sm"
                      >
                        View all
                      </Link>
                    )}
                  </div>
                  {authorSubscribers.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                      {authorSubscribers.slice(0, 5).map((subscriber: any) => (
                        <motion.div
                          key={subscriber.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-gold-400 to-gold-600 rounded-full flex items-center justify-center text-sm font-bold text-black">
                                {subscriber.subscriber_name?.charAt(0) || 'S'}
                              </div>
                              <div>
                                <div className="text-white font-semibold">{subscriber.subscriber_name}</div>
                                <div className="text-white/50 text-sm">{subscriber.subscriber_email}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-white font-semibold">
                                €{((subscriber.amount || 0) / 100).toFixed(2)}/{subscriber.tier}
                              </div>
                              <div className="text-white/50 text-sm capitalize">{subscriber.status}</div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
                      <UsersIcon className="w-12 h-12 text-white/20 mx-auto mb-3" />
                      <div className="text-white/60">No subscribers yet</div>
                      <div className="text-white/40 text-sm mt-2">
                        Start creating paid content to get your first subscribers
                      </div>
                    </div>
                  )}
                </div>
              </>
            )
          ) : null}
        </div>
      )}
    </div>
  );
}
