import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Trophy,
  Lock,
  Unlock,
  Upload,
  Loader2,
  ArrowLeft,
  Medal,
  Users
} from 'lucide-react';
import { gameRecordsApi } from '../api/gameRecords';
import { useStore } from '../store';
import Avatar from '../components/Avatar';
import ChessBoard from '../components/ChessBoard';

interface TournamentRecord {
  tournament: {
    id: number;
    organizer_id: number;
    organizer_name: string;
    organizer_avatar?: string;
    name: string;
    tournament_date: string;
    venue_name?: string;
    results_data?: any;
    is_record_public: boolean;
    completed_at?: string;
    final_standings?: string;
  };
  standings: Array<{
    id: number;
    user_id?: number;
    player_name: string;
    rank: number;
    score: number;
    wins: number;
    losses: number;
    draws: number;
    games_played: number;
    prize_won?: number;
    name?: string;
    avatar?: string;
  }>;
  games: Array<{
    id: number;
    round_number: number;
    white_player_id?: number;
    black_player_id?: number;
    white_player_name: string;
    black_player_name: string;
    result: string;
    pgn_data?: string;
    moves_count?: number;
    played_at: string;
  }>;
}

const TournamentRecord = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, openAuthModal } = useStore();
  const [record, setRecord] = useState<TournamentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showResultsForm, setShowResultsForm] = useState(false);
  const [selectedGame, setSelectedGame] = useState<TournamentRecord['games'][0] | null>(null);

  // Form state for tournament results
  const [standingsInput, setStandingsInput] = useState('');
  const [finalStandingsText, setFinalStandingsText] = useState('');

  const tournamentId = parseInt(id || '0');
  const isOrganizer = user?.id === record?.tournament.organizer_id;

  useEffect(() => {
    if (tournamentId) {
      fetchRecord();
    }
  }, [tournamentId]);

  const fetchRecord = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await gameRecordsApi.getTournamentRecord(tournamentId);
      setRecord(response.data);
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError('This tournament record is private');
      } else if (err.response?.status === 404) {
        setError('Tournament record not found');
      } else {
        setError(err.response?.data?.message || 'Failed to load tournament record');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitResults = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isOrganizer) {
      openAuthModal('login');
      return;
    }

    try {
      // Parse standings from CSV or JSON
      const standings = parseStandingsInput(standingsInput);

      setSubmitting(true);
      await gameRecordsApi.submitTournamentResults(tournamentId, {
        standings,
        final_standings_text: finalStandingsText
      });
      setShowResultsForm(false);
      await fetchRecord();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to submit results');
    } finally {
      setSubmitting(false);
    }
  };

  const parseStandingsInput = (input: string) => {
    const lines = input.trim().split('\n');
    return lines.map((line, index) => {
      const parts = line.split(',').map(p => p.trim());
      return {
        player_name: parts[0] || `Player ${index + 1}`,
        rank: parseInt(parts[1]) || index + 1,
        score: parseFloat(parts[2]) || 0,
        wins: parseInt(parts[3]) || 0,
        losses: parseInt(parts[4]) || 0,
        draws: parseInt(parts[5]) || 0,
        games_played: parseInt(parts[6]) || 0,
        prize_won: parseFloat(parts[7]) || 0
      };
    });
  };

  const handleTogglePrivacy = async () => {
    if (!user || !isOrganizer) return;

    setSubmitting(true);
    try {
      await gameRecordsApi.toggleTournamentPrivacy(tournamentId, !record?.tournament.is_record_public);
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

  // Group games by round
  const gamesByRound: Record<number, typeof record.games> = {};
  record.games.forEach(game => {
    if (!gamesByRound[game.round_number]) {
      gamesByRound[game.round_number] = [];
    }
    gamesByRound[game.round_number].push(game);
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a1a] to-[#1a1a2e] py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white/70" />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-1">{record.tournament.name}</h1>
            <p className="text-white/60">
              {new Date(record.tournament.tournament_date).toLocaleDateString()}
              {record.tournament.venue_name && ` • ${record.tournament.venue_name}`}
            </p>
          </div>
          {isOrganizer && (
            <button
              onClick={handleTogglePrivacy}
              disabled={submitting}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {record.tournament.is_record_public ? (
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

        {/* Organizer Info */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
          <h3 className="text-sm text-white/60 mb-2">Organizer</h3>
          <div className="flex items-center gap-2">
            <Avatar
              src={record.tournament.organizer_avatar}
              name={record.tournament.organizer_name}
              size="sm"
            />
            <span className="text-white font-medium">{record.tournament.organizer_name}</span>
          </div>
        </div>

        {/* Final Standings */}
        {record.standings.length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Trophy className="w-5 h-5 text-gold-400" />
              <h3 className="text-lg font-semibold text-white">Final Standings</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-white/60 text-sm font-medium pb-3 pr-4">Rank</th>
                    <th className="text-left text-white/60 text-sm font-medium pb-3 pr-4">Player</th>
                    <th className="text-center text-white/60 text-sm font-medium pb-3 px-2">Score</th>
                    <th className="text-center text-white/60 text-sm font-medium pb-3 px-2">W</th>
                    <th className="text-center text-white/60 text-sm font-medium pb-3 px-2">L</th>
                    <th className="text-center text-white/60 text-sm font-medium pb-3 px-2">D</th>
                    <th className="text-center text-white/60 text-sm font-medium pb-3 px-2">Games</th>
                    {record.standings.some(s => s.prize_won && s.prize_won > 0) && (
                      <th className="text-right text-white/60 text-sm font-medium pb-3 pl-4">Prize</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {record.standings.map((standing) => (
                    <tr key={standing.id} className="border-b border-white/5">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          {standing.rank === 1 && <Medal className="w-4 h-4 text-yellow-400" />}
                          {standing.rank === 2 && <Medal className="w-4 h-4 text-gray-400" />}
                          {standing.rank === 3 && <Medal className="w-4 h-4 text-orange-400" />}
                          <span className="text-white font-medium">{standing.rank}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          {standing.avatar && (
                            <Avatar
                              src={standing.avatar}
                              name={standing.name || standing.player_name}
                              size="sm"
                            />
                          )}
                          <span className="text-white">{standing.name || standing.player_name}</span>
                        </div>
                      </td>
                      <td className="text-center text-white px-2">{standing.score}</td>
                      <td className="text-center text-green-400 px-2">{standing.wins}</td>
                      <td className="text-center text-red-400 px-2">{standing.losses}</td>
                      <td className="text-center text-yellow-400 px-2">{standing.draws}</td>
                      <td className="text-center text-white/60 px-2">{standing.games_played}</td>
                      {record.standings.some(s => s.prize_won && s.prize_won > 0) && (
                        <td className="text-right text-gold-400 pl-4">
                          {standing.prize_won ? `$${standing.prize_won.toFixed(2)}` : '-'}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {record.tournament.final_standings && (
              <div className="mt-4 p-4 bg-white/5 rounded-lg">
                <p className="text-white/80 whitespace-pre-wrap">{record.tournament.final_standings}</p>
              </div>
            )}
          </div>
        )}

        {/* Interactive Chess Board */}
        {record.games.length > 0 && (
          <div className="mb-6">
            <ChessBoard
              initialPgn={selectedGame?.pgn_data || record.games[0]?.pgn_data || ''}
              editable={isOrganizer}
            />
          </div>
        )}

        {/* Round by Round Results */}
        {record.games.length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-5 h-5 text-gold-400" />
              <h3 className="text-lg font-semibold text-white">Game Results</h3>
            </div>

            <div className="space-y-6">
              {Object.entries(gamesByRound)
                .sort(([a], [b]) => parseInt(a) - parseInt(b))
                .map(([round, games]) => (
                  <div key={round}>
                    <h4 className="text-white font-medium mb-3">Round {round}</h4>
                    <div className="space-y-2">
                      {games.map((game) => (
                        <div
                          key={game.id}
                          onClick={() => game.pgn_data && setSelectedGame(game)}
                          className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                            game.pgn_data
                              ? 'bg-white/5 hover:bg-white/10 cursor-pointer'
                              : 'bg-white/5 opacity-60'
                          } ${selectedGame?.id === game.id ? 'ring-2 ring-gold-500' : ''}`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-white">{game.white_player_name}</span>
                              <span className="text-white/40">vs</span>
                              <span className="text-white">{game.black_player_name}</span>
                              {game.pgn_data && (
                                <span className="text-xs text-gold-400">(Click to view)</span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-white/80 font-medium">
                              {game.result === 'white_win' && '1-0'}
                              {game.result === 'black_win' && '0-1'}
                              {game.result === 'draw' && '½-½'}
                              {game.result === 'ongoing' && 'Ongoing'}
                              {game.result === 'abandoned' && 'Abandoned'}
                            </span>
                            {game.moves_count && (
                              <span className="text-white/40 text-sm ml-2">
                                ({game.moves_count} moves)
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Submit Results Button (Organizer Only) */}
        {isOrganizer && !record.tournament.completed_at && (
          <div className="flex gap-3">
            <button
              onClick={() => setShowResultsForm(!showResultsForm)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-400 hover:to-orange-500 transition-all"
            >
              <Upload className="w-4 h-4" />
              Submit Tournament Results
            </button>
          </div>
        )}

        {/* Submit Results Form */}
        {showResultsForm && isOrganizer && (
          <div className="mt-6 bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Submit Tournament Results</h3>
            <form onSubmit={handleSubmitResults} className="space-y-4">
              <div>
                <label className="block text-white/80 mb-2">
                  Final Standings (CSV format) *
                </label>
                <p className="text-white/50 text-sm mb-2">
                  Format: Player Name, Rank, Score, Wins, Losses, Draws, Games Played, Prize Won
                </p>
                <textarea
                  value={standingsInput}
                  onChange={(e) => setStandingsInput(e.target.value)}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white font-mono text-sm"
                  rows={10}
                  placeholder="John Doe, 1, 5.5, 5, 1, 1, 7, 500&#10;Jane Smith, 2, 5.0, 5, 2, 0, 7, 300&#10;..."
                  required
                />
              </div>
              <div>
                <label className="block text-white/80 mb-2">Additional Notes (optional)</label>
                <textarea
                  value={finalStandingsText}
                  onChange={(e) => setFinalStandingsText(e.target.value)}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  rows={4}
                  placeholder="Additional tournament summary or notes..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-400 hover:to-orange-500 transition-all disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Results'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowResultsForm(false)}
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

export default TournamentRecord;
