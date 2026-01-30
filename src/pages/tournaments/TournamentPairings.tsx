import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trophy,
  Loader2,
  Trash2,
  CheckCircle,
  Medal,
  Clock,
  User,
} from 'lucide-react';
import { pairingsAPI, Pairing, RoundSummary, StandingsEntry } from '../../api/pairings';
import { tournamentsAPI } from '../../api/tournaments';

export default function TournamentPairings() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const tournamentId = parseInt(id!);

  const [tournament, setTournament] = useState<any>(null);
  const [rounds, setRounds] = useState<RoundSummary[]>([]);
  const [selectedRound, setSelectedRound] = useState<number | null>(null);
  const [pairings, setPairings] = useState<Pairing[]>([]);
  const [standings, setStandings] = useState<StandingsEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [submittingResult, setSubmittingResult] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'pairings' | 'standings'>('pairings');
  const system: 'dutch' | 'burstein' = 'dutch'; // Default pairing system

  useEffect(() => {
    loadData();
  }, [tournamentId]);

  useEffect(() => {
    if (selectedRound !== null) {
      loadRoundPairings(selectedRound);
    }
  }, [selectedRound]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tournamentData, roundsData, standingsData] = await Promise.all([
        tournamentsAPI.getTournamentById(tournamentId),
        pairingsAPI.getAllRounds(tournamentId),
        pairingsAPI.getStandings(tournamentId),
      ]);

      setTournament(tournamentData);
      setRounds(roundsData);
      setStandings(standingsData);

      // Auto-select the latest round
      if (roundsData.length > 0) {
        setSelectedRound(roundsData[roundsData.length - 1].round_number);
      }
    } catch (error) {
      console.error('Failed to load tournament data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRoundPairings = async (roundNumber: number) => {
    try {
      const pairingsData = await pairingsAPI.getRoundPairings(tournamentId, roundNumber);
      setPairings(pairingsData);
    } catch (error) {
      console.error('Failed to load round pairings:', error);
    }
  };

  const handleGenerateNextRound = async () => {
    try {
      setGenerating(true);
      await pairingsAPI.generateNextRound(tournamentId, system);
      await loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to generate pairings');
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmitResult = async (
    gameId: number,
    result: 'white_win' | 'black_win' | 'draw' | 'forfeit_white' | 'forfeit_black'
  ) => {
    try {
      setSubmittingResult(gameId);
      await pairingsAPI.submitResult(tournamentId, gameId, result);
      await loadRoundPairings(selectedRound!);
      await pairingsAPI.getStandings(tournamentId).then(setStandings);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to submit result');
    } finally {
      setSubmittingResult(null);
    }
  };

  const handleDeleteRound = async (roundNumber: number) => {
    if (!confirm(`Are you sure you want to delete Round ${roundNumber}?`)) {
      return;
    }

    try {
      await pairingsAPI.deleteRound(tournamentId, roundNumber);
      await loadData();
      setSelectedRound(null);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete round');
    }
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case 'white_win':
      case 'black_win':
        return 'text-green-400';
      case 'draw':
        return 'text-yellow-400';
      case 'forfeit_white':
      case 'forfeit_black':
        return 'text-red-400';
      default:
        return 'text-white/60';
    }
  };

  const getResultText = (result: string) => {
    switch (result) {
      case 'white_win':
        return '1-0';
      case 'black_win':
        return '0-1';
      case 'draw':
        return '½-½';
      case 'forfeit_white':
        return '0-1 (forfeit)';
      case 'forfeit_black':
        return '1-0 (forfeit)';
      default:
        return 'Ongoing';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="w-8 h-8 text-gold-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/tournaments/${id}`)}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white/60" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">
              {tournament?.name} - Pairings
            </h1>
            <p className="text-white/60">Swiss System ({system})</p>
          </div>
        </div>
        <button
          onClick={handleGenerateNextRound}
          disabled={generating}
          className="px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-chess-darker font-semibold rounded-lg hover:from-gold-400 hover:to-gold-500 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-gold-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {generating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" />
              Generate Round {rounds.length + 1}
            </>
          )}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-white/10">
        <button
          onClick={() => setActiveTab('pairings')}
          className={`px-4 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'pairings'
              ? 'text-gold-400 border-gold-400'
              : 'text-white/60 border-transparent hover:text-white'
          }`}
        >
          Pairings
        </button>
        <button
          onClick={() => setActiveTab('standings')}
          className={`px-4 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'standings'
              ? 'text-gold-400 border-gold-400'
              : 'text-white/60 border-transparent hover:text-white'
          }`}
        >
          Standings
        </button>
      </div>

      {activeTab === 'pairings' && (
        <>
          {/* Round Navigation */}
          {rounds.length > 0 && (
            <div className="glass-card p-4 mb-6">
              <div className="flex items-center gap-2 overflow-x-auto">
                <span className="text-white/60 text-sm font-medium whitespace-nowrap mr-2">
                  Round:
                </span>
                {rounds.map((round) => (
                  <button
                    key={round.round_number}
                    onClick={() => setSelectedRound(round.round_number)}
                    className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                      selectedRound === round.round_number
                        ? 'bg-gold-500 text-chess-darker'
                        : 'bg-white/5 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    {round.round_number}
                    <span className="ml-2 text-xs opacity-75">
                      ({round.completed_games}/{round.total_games})
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Pairings Table */}
          {selectedRound !== null && pairings.length > 0 && (
            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="px-4 py-3 text-left text-sm font-medium text-white/60">
                        Board
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-white/60">
                        White
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-white/60">
                        Result
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-white/60">
                        Black
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-white/60">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pairings.map((pairing) => (
                      <tr
                        key={pairing.id}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                      >
                        <td className="px-4 py-4 text-white font-medium">
                          {pairing.board_number}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-white/40" />
                            <div>
                              <div className="text-white font-medium">
                                {pairing.white_player_name}
                              </div>
                              <div className="text-xs text-white/40">
                                {pairing.white_player_rating}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span
                            className={`font-bold ${getResultColor(pairing.result)}`}
                          >
                            {getResultText(pairing.result)}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <div className="text-right">
                              <div className="text-white font-medium">
                                {pairing.black_player_name}
                              </div>
                              <div className="text-xs text-white/40">
                                {pairing.black_player_rating}
                              </div>
                            </div>
                            <User className="w-4 h-4 text-white/40" />
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          {pairing.result === 'ongoing' && (
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() =>
                                  handleSubmitResult(pairing.id, 'white_win')
                                }
                                disabled={submittingResult === pairing.id}
                                className="px-3 py-1 bg-white/5 hover:bg-white/10 text-white text-xs rounded transition-colors disabled:opacity-50"
                                title="White wins"
                              >
                                1-0
                              </button>
                              <button
                                onClick={() => handleSubmitResult(pairing.id, 'draw')}
                                disabled={submittingResult === pairing.id}
                                className="px-3 py-1 bg-white/5 hover:bg-white/10 text-white text-xs rounded transition-colors disabled:opacity-50"
                                title="Draw"
                              >
                                ½-½
                              </button>
                              <button
                                onClick={() =>
                                  handleSubmitResult(pairing.id, 'black_win')
                                }
                                disabled={submittingResult === pairing.id}
                                className="px-3 py-1 bg-white/5 hover:bg-white/10 text-white text-xs rounded transition-colors disabled:opacity-50"
                                title="Black wins"
                              >
                                0-1
                              </button>
                            </div>
                          )}
                          {pairing.result !== 'ongoing' && (
                            <div className="flex items-center justify-center">
                              <CheckCircle className="w-5 h-5 text-green-400" />
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Delete Round Button */}
              {selectedRound === rounds.length && (
                <div className="p-4 border-t border-white/10">
                  <button
                    onClick={() => handleDeleteRound(selectedRound)}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete This Round
                  </button>
                </div>
              )}
            </div>
          )}

          {/* No Rounds Yet */}
          {rounds.length === 0 && (
            <div className="glass-card p-12 text-center">
              <Clock className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                No rounds yet
              </h3>
              <p className="text-white/60 mb-6">
                Generate the first round to start the tournament
              </p>
              <button
                onClick={handleGenerateNextRound}
                disabled={generating}
                className="px-6 py-3 bg-gold-500 hover:bg-gold-600 text-chess-darker font-semibold rounded-lg transition-colors disabled:opacity-50 inline-flex items-center gap-2"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Generate Round 1
                  </>
                )}
              </button>
            </div>
          )}
        </>
      )}

      {activeTab === 'standings' && (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-3 text-left text-sm font-medium text-white/60">
                    Rank
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-white/60">
                    Player
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-white/60">
                    Rating
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-white/60">
                    Score
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-white/60">
                    W-D-L
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-white/60">
                    Games
                  </th>
                </tr>
              </thead>
              <tbody>
                {standings.map((entry, index) => (
                  <tr
                    key={entry.id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {index < 3 && (
                          <Medal
                            className={`w-5 h-5 ${
                              index === 0
                                ? 'text-yellow-400'
                                : index === 1
                                ? 'text-gray-300'
                                : 'text-amber-600'
                            }`}
                          />
                        )}
                        <span className="text-white font-medium">{index + 1}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-white font-medium">
                      {entry.player_name}
                    </td>
                    <td className="px-4 py-4 text-center text-white/60">
                      {entry.player_rating}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="text-gold-400 font-bold text-lg">
                        {entry.score}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center text-white/60 text-sm">
                      {entry.wins}-{entry.draws}-{entry.losses}
                    </td>
                    <td className="px-4 py-4 text-center text-white/60">
                      {entry.games_played}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {standings.length === 0 && (
            <div className="p-12 text-center">
              <Trophy className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <p className="text-white/60">
                No standings yet. Generate rounds and submit results to see standings.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
