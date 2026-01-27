import { useState } from 'react';
import { getAllTestScenarios } from '../../utils/pairings/testDataGenerator';
import { generateSwissPairings } from '../../utils/pairings/swissPairing';
import { validatePairings } from '../../utils/pairings/pairingValidator';
import type { TestScenario, PairingRound, ValidationResult } from '../../types/pairings';
import {
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Trophy,
  Users,
  Target,
  Shuffle,
} from 'lucide-react';

export default function PairingsTest() {
  const [selectedScenario, setSelectedScenario] = useState<TestScenario | null>(null);
  const [pairingResult, setPairingResult] = useState<PairingRound | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    pairings: true,
    validation: true,
    stats: false,
    players: false,
  });

  const scenarios = getAllTestScenarios();

  const runTest = () => {
    if (!selectedScenario) return;

    setIsRunning(true);

    // Simulate some delay for realism
    setTimeout(() => {
      // Generate pairings
      const round = generateSwissPairings(
        selectedScenario.players,
        selectedScenario.players[0]?.colorHistory.length + 1 || 1,
        selectedScenario.config
      );

      setPairingResult(round);

      // Validate pairings
      const validation = validatePairings(
        round,
        selectedScenario.players,
        selectedScenario.config
      );

      setValidationResult(validation);
      setIsRunning(false);
    }, 500);
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="glass-card border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gold-500/20 rounded-lg">
            <Trophy className="w-6 h-6 text-gold-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Swiss Pairing System Test</h1>
        </div>
        <p className="text-white/60 text-sm">
          Test the Swiss pairing algorithm with predefined scenarios and custom configurations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Scenario Selection */}
        <div className="lg:col-span-1">
          <div className="glass-card border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Shuffle className="w-5 h-5 text-gold-400" />
              Test Scenarios
            </h2>

            <div className="space-y-2">
              {scenarios.map((scenario, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedScenario(scenario);
                    setPairingResult(null);
                    setValidationResult(null);
                  }}
                  className={`w-full text-left p-4 rounded-lg transition-all ${
                    selectedScenario?.name === scenario.name
                      ? 'bg-gold-500/20 border border-gold-500/50'
                      : 'bg-white/5 hover:bg-white/10 border border-transparent'
                  }`}
                >
                  <div className="font-medium text-white text-sm">{scenario.name}</div>
                  <div className="text-xs text-white/60 mt-1">{scenario.description}</div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-white/40">
                    <span>{scenario.players.length} players</span>
                    <span>•</span>
                    <span>{scenario.config.system}</span>
                  </div>
                </button>
              ))}
            </div>

            {selectedScenario && (
              <button
                onClick={runTest}
                disabled={isRunning}
                className="w-full mt-4 py-3 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 disabled:from-white/10 disabled:to-white/10 disabled:cursor-not-allowed text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-all"
              >
                {isRunning ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Run Test
                  </>
                )}
              </button>
            )}
          </div>

          {/* Configuration Display */}
          {selectedScenario && (
            <div className="glass-card border border-white/10 rounded-2xl p-6 mt-6">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Target className="w-4 h-4 text-gold-400" />
                Configuration
              </h3>
              <div className="space-y-2 text-xs">
                <ConfigItem label="System" value={selectedScenario.config.system} />
                <ConfigItem
                  label="Allow Repeats"
                  value={selectedScenario.config.allowRepeats ? 'Yes' : 'No'}
                />
                <ConfigItem
                  label="Max Color Streak"
                  value={selectedScenario.config.maxColorStreak.toString()}
                />
                <ConfigItem
                  label="Score Groups"
                  value={selectedScenario.config.scoreGroups ? 'Yes' : 'No'}
                />
                <ConfigItem
                  label="Rating Limit"
                  value={selectedScenario.config.ratingDifferenceLimit?.toString() || 'None'}
                />
                <ConfigItem
                  label="Accelerated"
                  value={selectedScenario.config.acceleratedPairings ? 'Yes' : 'No'}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right: Results */}
        <div className="lg:col-span-2 space-y-6">
          {!pairingResult && !validationResult && (
            <div className="glass-card border border-white/10 rounded-2xl p-12 text-center">
              <Users className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <p className="text-white/60">Select a scenario and run the test to see results</p>
            </div>
          )}

          {/* Validation Summary */}
          {validationResult && (
            <div className="glass-card border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  {validationResult.isValid ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400" />
                  )}
                  Validation Result
                </h2>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    validationResult.isValid
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {validationResult.isValid ? 'VALID' : 'INVALID'}
                </span>
              </div>

              {/* Errors */}
              {validationResult.errors.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="w-4 h-4 text-red-400" />
                    <span className="text-sm font-medium text-red-400">
                      {validationResult.errors.length} Error(s)
                    </span>
                  </div>
                  <div className="space-y-1">
                    {validationResult.errors.map((error, idx) => (
                      <div key={idx} className="text-xs text-red-400/80 bg-red-500/10 p-2 rounded">
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {validationResult.warnings.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm font-medium text-yellow-400">
                      {validationResult.warnings.length} Warning(s)
                    </span>
                  </div>
                  <div className="space-y-1">
                    {validationResult.warnings.slice(0, 5).map((warning, idx) => (
                      <div
                        key={idx}
                        className="text-xs text-yellow-400/80 bg-yellow-500/10 p-2 rounded"
                      >
                        {warning}
                      </div>
                    ))}
                    {validationResult.warnings.length > 5 && (
                      <div className="text-xs text-white/40 italic">
                        ... and {validationResult.warnings.length - 5} more warnings
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Statistics */}
          {validationResult && (
            <div className="glass-card border border-white/10 rounded-2xl p-6">
              <button
                onClick={() => toggleSection('stats')}
                className="w-full flex items-center justify-between mb-4"
              >
                <h2 className="text-lg font-semibold text-white">Statistics</h2>
                {expandedSections.stats ? (
                  <ChevronUp className="w-5 h-5 text-white/60" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-white/60" />
                )}
              </button>

              {expandedSections.stats && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <StatCard
                    label="Total Pairings"
                    value={validationResult.stats.totalPairings.toString()}
                  />
                  <StatCard label="Byes" value={validationResult.stats.byeCount.toString()} />
                  <StatCard
                    label="Repeats"
                    value={validationResult.stats.repeatPairings.toString()}
                    highlight={validationResult.stats.repeatPairings > 0}
                  />
                  <StatCard
                    label="Color Issues"
                    value={validationResult.stats.colorImbalances.toString()}
                    highlight={validationResult.stats.colorImbalances > 0}
                  />
                  <StatCard
                    label="Avg Rating Diff"
                    value={Math.round(validationResult.stats.ratingDifferenceAvg).toString()}
                  />
                  <StatCard
                    label="Max Rating Diff"
                    value={validationResult.stats.ratingDifferenceMax.toString()}
                  />
                </div>
              )}
            </div>
          )}

          {/* Pairings List */}
          {pairingResult && selectedScenario && (
            <div className="glass-card border border-white/10 rounded-2xl p-6">
              <button
                onClick={() => toggleSection('pairings')}
                className="w-full flex items-center justify-between mb-4"
              >
                <h2 className="text-lg font-semibold text-white">
                  Round {pairingResult.roundNumber} Pairings ({pairingResult.pairings.length})
                </h2>
                {expandedSections.pairings ? (
                  <ChevronUp className="w-5 h-5 text-white/60" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-white/60" />
                )}
              </button>

              {expandedSections.pairings && (
                <div className="space-y-2">
                  {pairingResult.pairings.map((pairing, idx) => {
                    const whitePlayer = selectedScenario.players.find(
                      p => p.id === pairing.whitePlayerId
                    );
                    const blackPlayer = selectedScenario.players.find(
                      p => p.id === pairing.blackPlayerId
                    );

                    if (pairing.isBye) {
                      return (
                        <div
                          key={idx}
                          className="flex items-center gap-4 p-4 bg-white/5 rounded-lg"
                        >
                          <div className="w-8 text-center text-white/60 font-mono text-sm">
                            {pairing.boardNumber}
                          </div>
                          <div className="flex-1">
                            <div className="text-white font-medium">{whitePlayer?.name}</div>
                            <div className="text-xs text-white/60">
                              {whitePlayer?.rating} • {whitePlayer?.score} pts
                            </div>
                          </div>
                          <div className="px-3 py-1 bg-purple-500/20 text-purple-400 text-xs font-semibold rounded">
                            BYE
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={idx} className="p-4 bg-white/5 rounded-lg">
                        <div className="flex items-center gap-4 mb-2">
                          <div className="w-8 text-center text-white/60 font-mono text-sm">
                            {pairing.boardNumber}
                          </div>
                          <div className="flex-1 grid grid-cols-2 gap-4">
                            {/* White Player */}
                            <div>
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-white rounded-full" />
                                <span className="text-white font-medium text-sm">
                                  {whitePlayer?.name}
                                </span>
                              </div>
                              <div className="text-xs text-white/60 ml-5">
                                {whitePlayer?.rating} • {whitePlayer?.score} pts
                              </div>
                            </div>

                            {/* Black Player */}
                            <div>
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-gray-800 border border-white/20 rounded-full" />
                                <span className="text-white font-medium text-sm">
                                  {blackPlayer?.name}
                                </span>
                              </div>
                              <div className="text-xs text-white/60 ml-5">
                                {blackPlayer?.rating} • {blackPlayer?.score} pts
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Rating Difference */}
                        {whitePlayer && blackPlayer && (
                          <div className="ml-12 text-xs text-white/40">
                            Rating diff: {Math.abs(whitePlayer.rating - blackPlayer.rating)}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {pairingResult.unpaired.length > 0 && (
                    <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                      <div className="text-yellow-400 font-medium text-sm mb-2">
                        Unpaired Players
                      </div>
                      <div className="space-y-1">
                        {pairingResult.unpaired.map(id => {
                          const player = selectedScenario.players.find(p => p.id === id);
                          return (
                            <div key={id} className="text-xs text-yellow-400/80">
                              {player?.name} ({player?.rating})
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Players List */}
          {selectedScenario && (
            <div className="glass-card border border-white/10 rounded-2xl p-6">
              <button
                onClick={() => toggleSection('players')}
                className="w-full flex items-center justify-between mb-4"
              >
                <h2 className="text-lg font-semibold text-white">
                  Players ({selectedScenario.players.length})
                </h2>
                {expandedSections.players ? (
                  <ChevronUp className="w-5 h-5 text-white/60" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-white/60" />
                )}
              </button>

              {expandedSections.players && (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {selectedScenario.players.map(player => (
                    <div key={player.id} className="p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-white font-medium text-sm">{player.name}</div>
                          <div className="text-xs text-white/60">Rating: {player.rating}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-medium text-sm">{player.score} pts</div>
                          <div className="text-xs text-white/60">
                            {player.colorHistory.length} rounds
                          </div>
                        </div>
                      </div>
                      {player.colorHistory.length > 0 && (
                        <div className="mt-2 flex items-center gap-1">
                          {player.colorHistory.map((color, idx) => (
                            <div
                              key={idx}
                              className={`w-4 h-4 rounded-full ${
                                color === 'white'
                                  ? 'bg-white'
                                  : 'bg-gray-800 border border-white/20'
                              }`}
                              title={`Round ${idx + 1}: ${color}`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ConfigItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-white/60">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`p-4 rounded-lg ${
        highlight ? 'bg-yellow-500/10 border border-yellow-500/30' : 'bg-white/5'
      }`}
    >
      <div className={`text-xs ${highlight ? 'text-yellow-400' : 'text-white/60'}`}>{label}</div>
      <div className={`text-lg font-bold mt-1 ${highlight ? 'text-yellow-400' : 'text-white'}`}>
        {value}
      </div>
    </div>
  );
}
