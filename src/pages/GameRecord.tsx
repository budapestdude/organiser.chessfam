import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Trophy,
  Users,
  Lock,
  Unlock,
  FileText,
  Upload,
  CheckCircle,
  Loader2,
  ArrowLeft
} from 'lucide-react';
import { gameRecordsApi } from '../api/gameRecords';
import { useStore } from '../store';
import Avatar from '../components/Avatar';
import ChessBoard from '../components/ChessBoard';

interface GameRecord {
  game: {
    id: number;
    creator_id: number;
    creator_name: string;
    creator_avatar?: string;
    venue_name: string;
    game_date: string;
    game_time: string;
    result?: string;
    winner_id?: number;
    winner_name?: string;
    pgn_data?: string;
    notes?: string;
    is_record_public: boolean;
    completed_at?: string;
  };
  participants: Array<{
    id: number;
    name: string;
    avatar?: string;
    rating?: number;
    joined_at: string;
  }>;
  pgn_uploads: Array<{
    id: number;
    user_id: number;
    pgn_content: string;
    move_count: number;
    white_player?: string;
    black_player?: string;
    result?: string;
    date_played?: string;
    event_name?: string;
    created_at: string;
  }>;
}

const GameRecord = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, openAuthModal } = useStore();
  const [record, setRecord] = useState<GameRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [showResultForm, setShowResultForm] = useState(false);
  const [showPGNForm, setShowPGNForm] = useState(false);
  const [resultData, setResultData] = useState({
    result: 'white_win' as 'white_win' | 'black_win' | 'draw',
    winner_id: undefined as number | undefined,
    pgn_data: '',
    notes: ''
  });
  const [pgnData, setPgnData] = useState({
    pgn_content: '',
    white_player: '',
    black_player: '',
    result: '',
    date_played: '',
    event_name: ''
  });

  const gameId = parseInt(id || '0');
  const isCreator = user?.id === record?.game.creator_id;

  useEffect(() => {
    if (gameId) {
      fetchRecord();
    }
  }, [gameId]);

  const fetchRecord = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await gameRecordsApi.getGameRecord(gameId);
      setRecord(response.data);
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError('This game record is private');
      } else if (err.response?.status === 404) {
        setError('Game record not found');
      } else {
        setError(err.response?.data?.message || 'Failed to load game record');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal('login');
      return;
    }

    setSubmitting(true);
    try {
      await gameRecordsApi.submitGameResult(gameId, resultData);
      setShowResultForm(false);
      await fetchRecord();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit result');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadPGN = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal('login');
      return;
    }

    setSubmitting(true);
    try {
      await gameRecordsApi.uploadGamePGN(gameId, pgnData);
      setShowPGNForm(false);
      setPgnData({
        pgn_content: '',
        white_player: '',
        black_player: '',
        result: '',
        date_played: '',
        event_name: ''
      });
      await fetchRecord();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to upload PGN');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePrivacy = async () => {
    if (!user || !isCreator) return;

    setSubmitting(true);
    try {
      await gameRecordsApi.toggleGamePrivacy(gameId, !record?.game.is_record_public);
      await fetchRecord();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update privacy');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a1a] to-[#1a1a2e] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a1a] to-[#1a1a2e] flex items-center justify-center px-4">
        <div className="text-center">
          <Lock className="w-16 h-16 text-white/30 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">{error}</h1>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!record) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a1a] to-[#1a1a2e] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white/70" />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-1">Game Record</h1>
            <p className="text-white/60">
              {new Date(record.game.game_date).toLocaleDateString()} at {record.game.game_time}
            </p>
          </div>
          {isCreator && (
            <button
              onClick={handleTogglePrivacy}
              disabled={submitting}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {record.game.is_record_public ? (
                <>
                  <Unlock className="w-4 h-4" />
                  Public
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Private
                </>
              )}
            </button>
          )}
        </div>

        {/* Game Info Card */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm text-white/60 mb-2">Venue</h3>
              <p className="text-white font-medium">{record.game.venue_name}</p>
            </div>
            <div>
              <h3 className="text-sm text-white/60 mb-2">Organizer</h3>
              <div className="flex items-center gap-2">
                <Avatar
                  src={record.game.creator_avatar}
                  name={record.game.creator_name}
                  size="sm"
                />
                <span className="text-white font-medium">{record.game.creator_name}</span>
              </div>
            </div>
          </div>

          {record.game.result && (
            <div className="mt-6 pt-6 border-t border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <Trophy className="w-5 h-5 text-gold-400" />
                <h3 className="text-lg font-semibold text-white">Result</h3>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-white text-lg font-medium">
                  {record.game.result === 'white_win' && '1-0 White wins'}
                  {record.game.result === 'black_win' && '0-1 Black wins'}
                  {record.game.result === 'draw' && '½-½ Draw'}
                </p>
                {record.game.winner_name && (
                  <p className="text-white/70 mt-2">Winner: {record.game.winner_name}</p>
                )}
                {record.game.notes && (
                  <p className="text-white/60 mt-2 text-sm">{record.game.notes}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Participants */}
        {record.participants.length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-5 h-5 text-gold-400" />
              <h3 className="text-lg font-semibold text-white">Participants</h3>
            </div>
            <div className="space-y-3">
              {record.participants.map((participant) => (
                <div key={participant.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                  <Avatar
                    src={participant.avatar}
                    name={participant.name}
                    size="md"
                  />
                  <div className="flex-1">
                    <p className="text-white font-medium">{participant.name}</p>
                    {participant.rating && (
                      <p className="text-white/60 text-sm">Rating: {participant.rating}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Interactive Chess Board */}
        <div className="mb-6">
          <ChessBoard
            initialPgn={
              record.pgn_uploads.length > 0
                ? record.pgn_uploads[0].pgn_content
                : record.game.pgn_data || ''
            }
            onPgnChange={(pgn) => {
              if (isCreator) {
                setResultData({ ...resultData, pgn_data: pgn });
              }
            }}
            editable={isCreator}
          />
        </div>

        {/* PGN Uploads */}
        {record.pgn_uploads.length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-5 h-5 text-gold-400" />
              <h3 className="text-lg font-semibold text-white">PGN Records</h3>
            </div>
            <div className="space-y-4">
              {record.pgn_uploads.map((pgn) => (
                <div key={pgn.id} className="bg-white/5 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      {pgn.event_name && (
                        <p className="text-white font-medium">{pgn.event_name}</p>
                      )}
                      <p className="text-white/60 text-sm">
                        {pgn.white_player} vs {pgn.black_player}
                      </p>
                      {pgn.result && (
                        <p className="text-white/60 text-sm">Result: {pgn.result}</p>
                      )}
                    </div>
                    <span className="text-white/50 text-xs">
                      {pgn.move_count} moves
                    </span>
                  </div>
                  <pre className="mt-3 p-3 bg-black/30 rounded text-white/80 text-xs overflow-x-auto">
                    {pgn.pgn_content}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons (Creator Only) */}
        {isCreator && (
          <div className="flex flex-wrap gap-3">
            {!record.game.result && (
              <button
                onClick={() => setShowResultForm(!showResultForm)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-400 hover:to-orange-500 transition-all"
              >
                <CheckCircle className="w-4 h-4" />
                Submit Result
              </button>
            )}
            <button
              onClick={() => setShowPGNForm(!showPGNForm)}
              className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              <Upload className="w-4 h-4" />
              Upload PGN
            </button>
          </div>
        )}

        {/* Submit Result Form */}
        {showResultForm && isCreator && (
          <div className="mt-6 bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Submit Game Result</h3>
            <form onSubmit={handleSubmitResult} className="space-y-4">
              <div>
                <label className="block text-white/80 mb-2">Result</label>
                <select
                  value={resultData.result}
                  onChange={(e) => setResultData({ ...resultData, result: e.target.value as any })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  required
                >
                  <option value="white_win">White wins (1-0)</option>
                  <option value="black_win">Black wins (0-1)</option>
                  <option value="draw">Draw (½-½)</option>
                </select>
              </div>
              <div>
                <label className="block text-white/80 mb-2">Notes (optional)</label>
                <textarea
                  value={resultData.notes}
                  onChange={(e) => setResultData({ ...resultData, notes: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  rows={3}
                  placeholder="Add any notes about the game..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-400 hover:to-orange-500 transition-all disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowResultForm(false)}
                  className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Upload PGN Form */}
        {showPGNForm && isCreator && (
          <div className="mt-6 bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Upload PGN</h3>
            <form onSubmit={handleUploadPGN} className="space-y-4">
              <div>
                <label className="block text-white/80 mb-2">PGN Content *</label>
                <textarea
                  value={pgnData.pgn_content}
                  onChange={(e) => setPgnData({ ...pgnData, pgn_content: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white font-mono text-sm"
                  rows={10}
                  placeholder="Paste your PGN notation here..."
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/80 mb-2">White Player</label>
                  <input
                    type="text"
                    value={pgnData.white_player}
                    onChange={(e) => setPgnData({ ...pgnData, white_player: e.target.value })}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-white/80 mb-2">Black Player</label>
                  <input
                    type="text"
                    value={pgnData.black_player}
                    onChange={(e) => setPgnData({ ...pgnData, black_player: e.target.value })}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/80 mb-2">Event Name</label>
                  <input
                    type="text"
                    value={pgnData.event_name}
                    onChange={(e) => setPgnData({ ...pgnData, event_name: e.target.value })}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-white/80 mb-2">Date Played</label>
                  <input
                    type="date"
                    value={pgnData.date_played}
                    onChange={(e) => setPgnData({ ...pgnData, date_played: e.target.value })}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-400 hover:to-orange-500 transition-all disabled:opacity-50"
                >
                  {submitting ? 'Uploading...' : 'Upload'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPGNForm(false)}
                  className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameRecord;
