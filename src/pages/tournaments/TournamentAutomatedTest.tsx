import { useState, useEffect } from 'react';
import { pairingsTestAPI } from '../../api/pairingsTest';
import type { CreateTestTournamentResponse, AutomatedTournamentResult, SingleRoundResult, TournamentParticipant } from '../../api/pairingsTest';
import type { StandingsEntry } from '../../api/pairings';
import { Play, Zap, Trash2, SkipForward, Trophy, TrendingUp, Medal, UserX, Clock, Users as UsersIcon, AlertCircle } from 'lucide-react';

export default function TournamentAutomatedTest() {
  const [playerCount, setPlayerCount] = useState(16);
  const [customPlayerCount, setCustomPlayerCount] = useState('');
  const [useCustomCount, setUseCustomCount] = useState(false);
  const [rounds, setRounds] = useState(5);
  const [pairingSystem, setPairingSystem] = useState<'dutch' | 'burstein'>('dutch');
  const [tournamentName, setTournamentName] = useState('Test Tournament');

  const [tournament, setTournament] = useState<CreateTestTournamentResponse | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [isRunningSingle, setIsRunningSingle] = useState(false);

  const [currentRound, setCurrentRound] = useState(0);
  const [roundResults, setRoundResults] = useState<SingleRoundResult[]>([]);
  const [finalResult, setFinalResult] = useState<AutomatedTournamentResult | null>(null);
  const [standings, setStandings] = useState<StandingsEntry[]>([]);

  const [participants, setParticipants] = useState<TournamentParticipant[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [byeRoundNumber, setByeRoundNumber] = useState(1);
  const [withdrawalCount, setWithdrawalCount] = useState(1);
  const [showParticipants, setShowParticipants] = useState(false);

  // Refresh participants list
  const refreshParticipants = async () => {
    if (!tournament) return;
    try {
      const data = await pairingsTestAPI.getTournamentParticipants(tournament.tournamentId);
      setParticipants(data);
    } catch (error) {
      console.error('Failed to refresh participants:', error);
    }
  };

  useEffect(() => {
    if (tournament) {
      refreshParticipants();
    }
  }, [tournament, currentRound]);

  const createTestTournament = async () => {
    setIsCreating(true);
    try {
      const finalPlayerCount = useCustomCount ? parseInt(customPlayerCount) : playerCount;

      if (finalPlayerCount < 4 || finalPlayerCount > 500) {
        alert('Player count must be between 4 and 500');
        setIsCreating(false);
        return;
      }

      const result = await pairingsTestAPI.createTestTournament({
        playerCount: finalPlayerCount,
        rounds,
        pairingSystem,
        tournamentName: `${tournamentName} - ${new Date().toLocaleTimeString()}`
      });
      setTournament(result);
      setCurrentRound(0);
      setRoundResults([]);
      setFinalResult(null);
      setStandings([]);
      setParticipants([]);
    } catch (error) {
      console.error('Failed to create test tournament:', error);
      alert('Failed to create test tournament');
    } finally {
      setIsCreating(false);
    }
  };

  const withdrawPlayer = async (playerId: number) => {
    if (!tournament) return;

    if (!confirm('Withdraw this player from the tournament?')) return;

    try {
      await pairingsTestAPI.withdrawPlayer(tournament.tournamentId, playerId);
      await refreshParticipants();
      alert('Player withdrawn successfully');
    } catch (error) {
      console.error('Failed to withdraw player:', error);
      alert('Failed to withdraw player');
    }
  };

  const requestVoluntaryBye = async () => {
    if (!tournament || !selectedPlayerId) {
      alert('Please select a player');
      return;
    }

    try {
      await pairingsTestAPI.requestVoluntaryBye(tournament.tournamentId, selectedPlayerId, byeRoundNumber);
      await refreshParticipants();
      alert('Voluntary bye granted');
      setSelectedPlayerId(null);
    } catch (error) {
      console.error('Failed to request voluntary bye:', error);
      alert('Failed to request voluntary bye');
    }
  };

  const simulateWithdrawals = async () => {
    if (!tournament) return;

    if (!confirm(`Randomly withdraw ${withdrawalCount} player(s)?`)) return;

    try {
      const result = await pairingsTestAPI.simulateRandomWithdrawals(tournament.tournamentId, withdrawalCount);
      await refreshParticipants();
      alert(`${result.length} player(s) withdrawn: ${result.map(p => p.playerName).join(', ')}`);
    } catch (error) {
      console.error('Failed to simulate withdrawals:', error);
      alert('Failed to simulate withdrawals');
    }
  };

  const runFullTournament = async () => {
    if (!tournament) return;

    setIsRunningAll(true);
    try {
      const result = await pairingsTestAPI.runAutomatedTournament(tournament.tournamentId);
      setFinalResult(result);
      setStandings(result.standings);
      setCurrentRound(result.totalRounds);
    } catch (error) {
      console.error('Failed to run tournament:', error);
      alert('Failed to run tournament');
    } finally {
      setIsRunningAll(false);
    }
  };

  const runSingleRound = async () => {
    if (!tournament) return;

    setIsRunningSingle(true);
    try {
      const result = await pairingsTestAPI.runSingleTestRound(tournament.tournamentId);
      setRoundResults(prev => [...prev, result]);
      setStandings(result.standings);
      setCurrentRound(result.round);
    } catch (error) {
      console.error('Failed to run round:', error);
      alert('Failed to run round');
    } finally {
      setIsRunningSingle(false);
    }
  };

  const deleteTournament = async () => {
    if (!tournament) return;

    if (!confirm('Delete this test tournament?')) return;

    try {
      await pairingsTestAPI.deleteTestTournament(tournament.tournamentId);
      setTournament(null);
      setCurrentRound(0);
      setRoundResults([]);
      setFinalResult(null);
      setStandings([]);
    } catch (error) {
      console.error('Failed to delete tournament:', error);
      alert('Failed to delete tournament');
    }
  };

  const getMedalIcon = (position: number) => {
    if (position === 1) return <Medal className="w-5 h-5 text-yellow-400" />;
    if (position === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (position === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return null;
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gold-500/20 rounded-lg">
            <Trophy className="w-6 h-6 text-gold-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Automated Tournament Testing</h1>
        </div>
        <p className="text-white/60 text-sm">
          Create and run complete mock tournaments to test the pairing system end-to-end
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Configuration */}
        <div className="lg:col-span-1 space-y-6">
          {/* Tournament Setup */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Tournament Setup</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">
                  Tournament Name
                </label>
                <input
                  type="text"
                  value={tournamentName}
                  onChange={(e) => setTournamentName(e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-gold-500"
                  disabled={!!tournament}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">
                  Number of Players
                </label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="preset"
                      checked={!useCustomCount}
                      onChange={() => setUseCustomCount(false)}
                      disabled={!!tournament}
                      className="text-gold-500"
                    />
                    <label htmlFor="preset" className="text-white/80 text-sm">Preset</label>
                  </div>
                  {!useCustomCount && (
                    <select
                      value={playerCount}
                      onChange={(e) => setPlayerCount(parseInt(e.target.value))}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-gold-500"
                      disabled={!!tournament}
                    >
                      <option value={8}>8 Players</option>
                      <option value={12}>12 Players</option>
                      <option value={16}>16 Players</option>
                      <option value={24}>24 Players</option>
                      <option value={32}>32 Players</option>
                      <option value={64}>64 Players</option>
                      <option value={100}>100 Players</option>
                      <option value={128}>128 Players</option>
                      <option value={200}>200 Players</option>
                      <option value={300}>300 Players</option>
                      <option value={500}>500 Players</option>
                    </select>
                  )}
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="custom"
                      checked={useCustomCount}
                      onChange={() => setUseCustomCount(true)}
                      disabled={!!tournament}
                      className="text-gold-500"
                    />
                    <label htmlFor="custom" className="text-white/80 text-sm">Custom (4-500)</label>
                  </div>
                  {useCustomCount && (
                    <input
                      type="number"
                      min="4"
                      max="500"
                      value={customPlayerCount}
                      onChange={(e) => setCustomPlayerCount(e.target.value)}
                      placeholder="Enter player count"
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-gold-500"
                      disabled={!!tournament}
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">
                  Number of Rounds
                </label>
                <select
                  value={rounds}
                  onChange={(e) => setRounds(parseInt(e.target.value))}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-gold-500"
                  disabled={!!tournament}
                >
                  <option value={3}>3 Rounds</option>
                  <option value={5}>5 Rounds</option>
                  <option value={7}>7 Rounds</option>
                  <option value={9}>9 Rounds</option>
                  <option value={11}>11 Rounds</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">
                  Pairing System
                </label>
                <select
                  value={pairingSystem}
                  onChange={(e) => setPairingSystem(e.target.value as 'dutch' | 'burstein')}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-gold-500"
                  disabled={!!tournament}
                >
                  <option value="dutch">Dutch System</option>
                  <option value="burstein">Burstein System</option>
                </select>
              </div>

              <button
                onClick={createTestTournament}
                disabled={isCreating || !!tournament}
                className="w-full py-3 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 disabled:from-white/10 disabled:to-white/10 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all"
              >
                {isCreating ? 'Creating...' : tournament ? 'Tournament Created' : 'Create Test Tournament'}
              </button>
            </div>
          </div>

          {/* Tournament Controls */}
          {tournament && (
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Controls</h2>

              <div className="space-y-3">
                <button
                  onClick={runFullTournament}
                  disabled={isRunningAll || currentRound >= rounds}
                  className="w-full py-3 bg-green-500/20 hover:bg-green-500/30 disabled:bg-white/5 disabled:cursor-not-allowed border border-green-500/30 text-green-400 disabled:text-white/30 font-semibold rounded-lg flex items-center justify-center gap-2 transition-all"
                >
                  <Zap className="w-4 h-4" />
                  {isRunningAll ? 'Running All Rounds...' : 'Run All Rounds'}
                </button>

                <button
                  onClick={runSingleRound}
                  disabled={isRunningSingle || currentRound >= rounds}
                  className="w-full py-3 bg-blue-500/20 hover:bg-blue-500/30 disabled:bg-white/5 disabled:cursor-not-allowed border border-blue-500/30 text-blue-400 disabled:text-white/30 font-semibold rounded-lg flex items-center justify-center gap-2 transition-all"
                >
                  <SkipForward className="w-4 h-4" />
                  {isRunningSingle ? 'Running Round...' : 'Run Next Round'}
                </button>

                <button
                  onClick={deleteTournament}
                  className="w-full py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 font-semibold rounded-lg flex items-center justify-center gap-2 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Tournament
                </button>
              </div>

              <div className="mt-4 p-4 bg-white/5 rounded-lg">
                <div className="text-xs text-white/60 mb-1">Progress</div>
                <div className="text-white font-semibold">
                  Round {currentRound} of {rounds}
                </div>
                <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-gold-500 to-gold-600 transition-all duration-500"
                    style={{ width: `${(currentRound / rounds) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Edge Case Testing */}
          {tournament && (
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-400" />
                Edge Case Testing
              </h2>

              <div className="space-y-4">
                {/* Simulate Withdrawals */}
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">
                    Simulate Random Withdrawals
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={withdrawalCount}
                      onChange={(e) => setWithdrawalCount(parseInt(e.target.value))}
                      className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-gold-500 text-sm"
                    >
                      <option value={1}>1 player</option>
                      <option value={2}>2 players</option>
                      <option value={3}>3 players</option>
                      <option value={5}>5 players</option>
                      <option value={10}>10 players</option>
                    </select>
                    <button
                      onClick={simulateWithdrawals}
                      className="px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 text-orange-400 font-medium rounded-lg flex items-center gap-2 transition-all text-sm"
                    >
                      <UserX className="w-4 h-4" />
                      Withdraw
                    </button>
                  </div>
                </div>

                {/* Voluntary Bye */}
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">
                    Grant Voluntary Bye
                  </label>
                  <div className="space-y-2">
                    <select
                      value={selectedPlayerId || ''}
                      onChange={(e) => setSelectedPlayerId(e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-gold-500 text-sm"
                    >
                      <option value="">Select player...</option>
                      {participants
                        .filter(p => p.status === 'confirmed')
                        .map(p => (
                          <option key={p.id} value={p.id}>
                            {p.player_name} ({p.player_rating})
                          </option>
                        ))}
                    </select>
                    <div className="flex gap-2">
                      <select
                        value={byeRoundNumber}
                        onChange={(e) => setByeRoundNumber(parseInt(e.target.value))}
                        className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-gold-500 text-sm"
                      >
                        {Array.from({ length: rounds }, (_, i) => i + 1).map(round => (
                          <option key={round} value={round}>
                            Round {round}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={requestVoluntaryBye}
                        disabled={!selectedPlayerId}
                        className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 disabled:bg-white/5 disabled:cursor-not-allowed border border-purple-500/30 disabled:border-white/10 text-purple-400 disabled:text-white/30 font-medium rounded-lg flex items-center gap-2 transition-all text-sm"
                      >
                        <Clock className="w-4 h-4" />
                        Grant Bye
                      </button>
                    </div>
                  </div>
                </div>

                {/* Show Participants */}
                <button
                  onClick={() => setShowParticipants(!showParticipants)}
                  className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-all text-sm"
                >
                  <UsersIcon className="w-4 h-4" />
                  {showParticipants ? 'Hide' : 'Show'} Participants ({participants.length})
                </button>

                {/* Participants List */}
                {showParticipants && participants.length > 0 && (
                  <div className="max-h-64 overflow-y-auto space-y-1">
                    {participants.map(p => (
                      <div
                        key={p.id}
                        className={`p-2 rounded-lg flex items-center justify-between text-xs ${
                          p.status === 'withdrawn'
                            ? 'bg-red-500/10 border border-red-500/20'
                            : 'bg-white/5'
                        }`}
                      >
                        <div className="flex-1">
                          <div className={`font-medium ${p.status === 'withdrawn' ? 'text-red-400 line-through' : 'text-white'}`}>
                            {p.player_name}
                          </div>
                          <div className="text-white/40">{p.player_rating} • {p.score || 0} pts</div>
                        </div>
                        {p.status === 'confirmed' && (
                          <button
                            onClick={() => withdrawPlayer(p.id)}
                            className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-xs"
                          >
                            Withdraw
                          </button>
                        )}
                        {p.status === 'withdrawn' && (
                          <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs">
                            Withdrawn
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: Results */}
        <div className="lg:col-span-2 space-y-6">
          {!tournament && (
            <div className="glass-card p-12 text-center">
              <Play className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <p className="text-white/60">Create a test tournament to get started</p>
            </div>
          )}

          {/* Tournament Info */}
          {tournament && (
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-gold-400" />
                Tournament Information
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-white/5 rounded-lg">
                  <div className="text-xs text-white/60">Tournament ID</div>
                  <div className="text-white font-semibold">{tournament.tournamentId}</div>
                </div>
                <div className="p-3 bg-white/5 rounded-lg">
                  <div className="text-xs text-white/60">Participants</div>
                  <div className="text-white font-semibold">
                    {participants.filter(p => p.status === 'confirmed').length} active
                    {participants.filter(p => p.status === 'withdrawn').length > 0 && (
                      <span className="text-red-400 ml-1">
                        ({participants.filter(p => p.status === 'withdrawn').length} withdrawn)
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-3 bg-white/5 rounded-lg">
                  <div className="text-xs text-white/60">Total Rounds</div>
                  <div className="text-white font-semibold">{tournament.rounds}</div>
                </div>
                <div className="p-3 bg-white/5 rounded-lg">
                  <div className="text-xs text-white/60">Pairing System</div>
                  <div className="text-white font-semibold capitalize">{tournament.pairingSystem}</div>
                </div>
              </div>
            </div>
          )}

          {/* Standings */}
          {standings.length > 0 && (
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-gold-400" />
                Current Standings
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-xs font-medium text-white/60">Rank</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-white/60">Player</th>
                      <th className="text-center py-3 px-4 text-xs font-medium text-white/60">Rating</th>
                      <th className="text-center py-3 px-4 text-xs font-medium text-white/60">Score</th>
                      <th className="text-center py-3 px-4 text-xs font-medium text-white/60">W-D-L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((entry, index) => (
                      <tr key={entry.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-semibold">{index + 1}</span>
                            {getMedalIcon(index + 1)}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-white font-medium">{entry.player_name}</td>
                        <td className="py-3 px-4 text-center text-white/80">{entry.player_rating}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-3 py-1 bg-gold-500/20 text-gold-400 rounded-full font-semibold">
                            {entry.score}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center text-white/60 text-sm">
                          {entry.wins}-{entry.draws}-{entry.losses}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Round Results */}
          {roundResults.length > 0 && (
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Round-by-Round Results</h2>
              <div className="space-y-4">
                {roundResults.map((round, idx) => (
                  <div key={idx} className="p-4 bg-white/5 rounded-lg">
                    <div className="font-semibold text-white mb-2">Round {round.round}</div>
                    <div className="text-sm text-white/60">
                      {round.results.length} games completed
                    </div>
                    <div className="mt-2 text-xs text-white/40">
                      Results: {round.results.filter(r => r.result === 'white_win').length} white wins,{' '}
                      {round.results.filter(r => r.result === 'draw').length} draws,{' '}
                      {round.results.filter(r => r.result === 'black_win').length} black wins
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Final Results */}
          {finalResult && (
            <div className="glass-card p-6 border-2 border-gold-500/30">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Trophy className="w-6 h-6 text-gold-400" />
                Tournament Complete!
              </h2>
              <div className="space-y-3">
                <div className="text-white/80">
                  Completed all {finalResult.totalRounds} rounds with {finalResult.roundResults.length} round results
                </div>
                <div className="p-4 bg-gold-500/10 rounded-lg">
                  <div className="text-gold-400 font-semibold mb-2">Winner</div>
                  <div className="text-white text-lg font-bold">
                    {finalResult.standings[0]?.player_name}
                  </div>
                  <div className="text-white/60 text-sm">
                    Score: {finalResult.standings[0]?.score} points
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
