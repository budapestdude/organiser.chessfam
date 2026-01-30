import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  Clock,
  Users,
  Edit,
  CheckCircle,
  XCircle,
  Loader2,
  Trophy,
  FileText,
} from 'lucide-react';
import api from '../api/client';
import { useStore } from '../store';
import { useGameNotifications } from '../hooks/useGameNotifications';
import GameChat from '../components/GameChat';
import WaitlistButton from '../components/WaitlistButton';
import PrivateGameInvite from '../components/PrivateGameInvite';
import PGNUploader from '../components/PGNUploader';
import GameReviewModal from '../components/GameReviewModal';
import Avatar from '../components/Avatar';

interface Game {
  id: number;
  creator_id: number;
  creator_name: string;
  creator_rating?: number;
  creator_avatar?: string;
  venue_name: string;
  venue_address?: string;
  venue_lat?: number;
  venue_lng?: number;
  game_date: string;
  game_time: string;
  duration_minutes: number;
  time_control?: string;
  player_level?: string;
  max_players: number;
  description?: string;
  status: string;
  is_private: boolean;
  invitation_token?: string;
  invitation_link?: string;
  is_recurring: boolean;
  recurrence_pattern?: string;
  min_rating?: number;
  max_rating?: number;
  completed_at?: string;
  white_player_id?: number;
  black_player_id?: number;
  result?: string;
  participant_count: number;
  participants: any[];
  created_at: string;
  updated_at: string;
}

const GameDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, openAuthModal } = useStore();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewOpponentId, setReviewOpponentId] = useState<number | null>(null);
  const [reviewOpponentName, setReviewOpponentName] = useState<string>('');

  const gameId = parseInt(id || '0');
  const { notifications } = useGameNotifications({ gameId, enabled: !!gameId });

  const isCreator = user?.id === game?.creator_id;
  const isParticipant =
    isCreator || game?.participants.some((p) => p.id === user?.id) || false;
  const canJoin =
    !isParticipant &&
    game?.status === 'open' &&
    (game?.participant_count || 0) < (game?.max_players || 0);

  useEffect(() => {
    if (gameId) {
      fetchGame();
    }
  }, [gameId]);

  // Refresh game when real-time notifications arrive
  useEffect(() => {
    if (notifications.length > 0) {
      const latestNotif = notifications[notifications.length - 1];
      if (
        ['game:player-joined', 'game:player-left', 'game:status-change', 'game:update'].includes(
          latestNotif.event
        )
      ) {
        fetchGame();
      }
    }
  }, [notifications]);

  const fetchGame = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get(`/games/${gameId}`);
      setGame(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load game');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGame = async () => {
    if (!user) {
      openAuthModal('login');
      return;
    }

    setActionLoading(true);
    try {
      await api.post(`/games/${gameId}/join`);
      await fetchGame();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to join game');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveGame = async () => {
    if (!confirm('Are you sure you want to leave this game?')) return;

    setActionLoading(true);
    try {
      await api.post(`/games/${gameId}/leave`);
      await fetchGame();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to leave game');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelGame = async () => {
    if (!confirm('Are you sure you want to cancel this game?')) return;

    setActionLoading(true);
    try {
      await api.post(`/games/${gameId}/cancel`);
      await fetchGame();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel game');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteGame = async () => {
    // Simple completion - in production you'd want a modal to select players and result
    setActionLoading(true);
    try {
      await api.post(`/games/${gameId}/complete`, {
        white_player_id: game?.creator_id,
        black_player_id: game?.participants[0]?.id,
        result: 'draw',
      });
      await fetchGame();
      alert('Game marked as completed! You earned 50 XP.');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to complete game');
    } finally {
      setActionLoading(false);
    }
  };

  const openReviewModal = (opponentId: number, opponentName: string) => {
    setReviewOpponentId(opponentId);
    setReviewOpponentName(opponentName);
    setShowReviewModal(true);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getStatusBadge = () => {
    const badges: Record<string, { color: string; text: string }> = {
      open: { color: 'bg-green-500/20 text-green-400 border-green-500/30', text: 'Open' },
      full: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', text: 'Full' },
      cancelled: { color: 'bg-red-500/20 text-red-400 border-red-500/30', text: 'Cancelled' },
      completed: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', text: 'Completed' },
    };

    const badge = badges[game?.status || 'open'];
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black pt-20 pb-12">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-red-400">
            {error || 'Game not found'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/games')}
            className="text-white/70 hover:text-white mb-4 transition-colors"
          >
            ← Back to Games
          </button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">{game.venue_name}</h1>
              {game.venue_address && (
                <p className="text-white/60 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {game.venue_address}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              {getStatusBadge()}
              {game.is_private && (
                <span className="px-3 py-1 rounded-full text-sm font-medium border bg-purple-500/20 text-purple-400 border-purple-500/30">
                  Private
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Game Info Card */}
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h2 className="text-2xl font-semibold text-white mb-4">Game Details</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-sm text-white/50">Date</p>
                    <p className="text-white font-medium">{formatDate(game.game_date)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-sm text-white/50">Time</p>
                    <p className="text-white font-medium">
                      {formatTime(game.game_time)} ({game.duration_minutes} min)
                    </p>
                  </div>
                </div>

                {game.time_control && (
                  <div className="flex items-center gap-3">
                    <Trophy className="w-5 h-5 text-blue-400" />
                    <div>
                      <p className="text-sm text-white/50">Time Control</p>
                      <p className="text-white font-medium">{game.time_control}</p>
                    </div>
                  </div>
                )}

                {game.player_level && (
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-blue-400" />
                    <div>
                      <p className="text-sm text-white/50">Player Level</p>
                      <p className="text-white font-medium">{game.player_level}</p>
                    </div>
                  </div>
                )}
              </div>

              {game.description && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
                  <p className="text-white/70">{game.description}</p>
                </div>
              )}

              {/* Creator Info */}
              <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                <Avatar src={game.creator_avatar} size="md" />
                <div>
                  <p className="text-sm text-white/50">Organized by</p>
                  <p className="text-white font-semibold">{game.creator_name}</p>
                  {game.creator_rating && (
                    <p className="text-sm text-white/60">Rating: {game.creator_rating}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Participants */}
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h2 className="text-xl font-semibold text-white mb-4">
                Participants ({game.participant_count}/{game.max_players})
              </h2>

              <div className="space-y-3">
                {game.participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar src={participant.avatar} size="sm" />
                      <div>
                        <p className="text-white font-medium">{participant.name}</p>
                        {participant.rating && (
                          <p className="text-sm text-white/50">Rating: {participant.rating}</p>
                        )}
                      </div>
                    </div>

                    {game.status === 'completed' && user && participant.id !== user.id && (
                      <button
                        onClick={() => openReviewModal(participant.id, participant.name)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                      >
                        Review
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Game Chat */}
            {isParticipant && <GameChat gameId={gameId} isParticipant={isParticipant} />}

            {/* PGN Upload (for completed games) */}
            {game.status === 'completed' && isParticipant && (
              <PGNUploader gameId={gameId} onSuccess={fetchGame} />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">Actions</h3>

              <div className="space-y-3">
                {game.status === 'completed' && (
                  <button
                    onClick={() => navigate(`/games/${gameId}/record`)}
                    className="w-full py-3 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-white rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    <FileText className="w-5 h-5" />
                    <span>View Game Record</span>
                  </button>
                )}

                {canJoin && (
                  <button
                    onClick={handleJoinGame}
                    disabled={actionLoading}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {actionLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        <span>Join Game</span>
                      </>
                    )}
                  </button>
                )}

                {isParticipant && !isCreator && game.status === 'open' && (
                  <button
                    onClick={handleLeaveGame}
                    disabled={actionLoading}
                    className="w-full py-3 bg-red-600/20 hover:bg-red-600/30 disabled:bg-red-600/10 text-red-400 border border-red-500/30 rounded-lg transition-colors"
                  >
                    Leave Game
                  </button>
                )}

                {isCreator && game.status === 'open' && (
                  <>
                    <button
                      onClick={() => navigate(`/games/${gameId}/edit`)}
                      className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Edit className="w-5 h-5" />
                      <span>Edit Game</span>
                    </button>

                    <button
                      onClick={handleCompleteGame}
                      disabled={actionLoading}
                      className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white rounded-lg transition-colors"
                    >
                      Mark as Completed
                    </button>

                    <button
                      onClick={handleCancelGame}
                      disabled={actionLoading}
                      className="w-full py-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-5 h-5" />
                      <span>Cancel Game</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Waitlist */}
            <WaitlistButton gameId={gameId} gameStatus={game.status} onWaitlistUpdate={fetchGame} />

            {/* Private Game Invite */}
            {isCreator && game.is_private && game.invitation_link && (
              <PrivateGameInvite
                gameId={gameId}
                invitationLink={game.invitation_link}
                onRegenerate={(newLink) => setGame({ ...game, invitation_link: newLink })}
              />
            )}
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && reviewOpponentId && (
        <GameReviewModal
          gameId={gameId}
          opponentId={reviewOpponentId}
          opponentName={reviewOpponentName}
          isOpen={showReviewModal}
          onClose={() => {
            setShowReviewModal(false);
            setReviewOpponentId(null);
            setReviewOpponentName('');
          }}
          onSuccess={fetchGame}
        />
      )}
    </div>
  );
};

export default GameDetail;
