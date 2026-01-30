import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, Users, TrendingUp, Loader2, RefreshCw, Settings } from 'lucide-react';
import { useMatchSuggestions } from '../hooks/useMatchSuggestions';
import { useGeolocation } from '../hooks/useGeolocation';
import { useNavigate } from 'react-router-dom';

interface MatchSuggestionsProps {
  limit?: number;
  showPreferences?: boolean;
}

const MatchSuggestions = ({ limit = 10, showPreferences = true }: MatchSuggestionsProps) => {
  const navigate = useNavigate();
  const { latitude, longitude, isLoading: locationLoading } = useGeolocation();
  const [showPrefsModal, setShowPrefsModal] = useState(false);

  const {
    suggestions,
    isLoading,
    error,
    preferences,
    isLoadingPreferences,
    savePreferences,
    refreshSuggestions,
  } = useMatchSuggestions({
    lat: latitude ?? undefined,
    lng: longitude ?? undefined,
    enabled: true,
  });

  const [localPrefs, setLocalPrefs] = useState({
    preferred_time_controls: [] as string[],
    preferred_player_levels: [] as string[],
    max_distance_km: 50,
    preferred_days: [] as string[],
  });

  useEffect(() => {
    if (preferences) {
      setLocalPrefs({
        preferred_time_controls: preferences.preferred_time_controls || [],
        preferred_player_levels: preferences.preferred_player_levels || [],
        max_distance_km: preferences.max_distance_km || 50,
        preferred_days: preferences.preferred_days || [],
      });
    }
  }, [preferences]);

  const handleSavePreferences = async () => {
    try {
      await savePreferences(localPrefs);
      setShowPrefsModal(false);
      refreshSuggestions();
    } catch (err: any) {
      console.error('Failed to save preferences:', err);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const displayedSuggestions = suggestions.slice(0, limit);

  return (
    <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-6 h-6 text-blue-400" />
          <div>
            <h3 className="text-xl font-semibold text-white">Match Suggestions</h3>
            <p className="text-sm text-white/50">
              {locationLoading
                ? 'Getting your location...'
                : suggestions.length > 0
                ? `${suggestions.length} games match your preferences`
                : 'No matches found'}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={refreshSuggestions}
            disabled={isLoading}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh suggestions"
          >
            <RefreshCw className={`w-5 h-5 text-white ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {showPreferences && (
            <button
              onClick={() => setShowPrefsModal(true)}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              title="Preferences"
            >
              <Settings className="w-5 h-5 text-white" />
            </button>
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4 text-red-400">
          {error}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
        </div>
      )}

      {/* Suggestions List */}
      {!isLoading && displayedSuggestions.length > 0 && (
        <div className="space-y-3">
          {displayedSuggestions.map((suggestion, index) => (
            <motion.div
              key={suggestion.game_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => navigate(`/games/${suggestion.game_id}`)}
              className="bg-white/5 hover:bg-white/10 rounded-xl p-4 border border-white/10 cursor-pointer transition-all group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  {/* Venue & Creator */}
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                      {suggestion.venue_name}
                    </h4>
                    <span className="text-sm text-white/50">
                      by {suggestion.creator_name}
                    </span>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {/* Date & Time */}
                    <div className="flex items-center gap-2 text-white/70">
                      <Clock className="w-4 h-4" />
                      <span>
                        {formatDate(suggestion.game_date)} at {formatTime(suggestion.game_time)}
                      </span>
                    </div>

                    {/* Players */}
                    <div className="flex items-center gap-2 text-white/70">
                      <Users className="w-4 h-4" />
                      <span>
                        {suggestion.participant_count}/{suggestion.max_players} players
                      </span>
                    </div>

                    {/* Distance */}
                    {suggestion.distance !== undefined && (
                      <div className="flex items-center gap-2 text-white/70">
                        <MapPin className="w-4 h-4" />
                        <span>{suggestion.distance.toFixed(1)} km away</span>
                      </div>
                    )}

                    {/* Time Control */}
                    {suggestion.time_control && (
                      <div className="text-white/70">
                        <span className="font-medium">Time:</span> {suggestion.time_control}
                      </div>
                    )}

                    {/* Player Level */}
                    {suggestion.player_level && (
                      <div className="text-white/70">
                        <span className="font-medium">Level:</span> {suggestion.player_level}
                      </div>
                    )}
                  </div>

                  {/* Match Reasons */}
                  {suggestion.match_reasons && suggestion.match_reasons.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {suggestion.match_reasons.map((reason, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full"
                        >
                          {reason}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Match Score */}
                <div className="flex flex-col items-center">
                  <div className={`text-3xl font-bold ${getScoreColor(suggestion.score)}`}>
                    {suggestion.score}
                  </div>
                  <div className="text-xs text-white/40">match</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && displayedSuggestions.length === 0 && (
        <div className="text-center py-12">
          <TrendingUp className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/50 mb-2">No match suggestions available</p>
          <p className="text-sm text-white/40">
            Try adjusting your preferences or check back later
          </p>
        </div>
      )}

      {/* View All Link */}
      {displayedSuggestions.length > 0 && suggestions.length > limit && (
        <button
          onClick={() => navigate('/match-suggestions')}
          className="w-full mt-4 py-2 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
        >
          View all {suggestions.length} suggestions →
        </button>
      )}

      {/* Preferences Modal */}
      {showPrefsModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 rounded-2xl p-6 max-w-md w-full border border-white/10"
          >
            <h3 className="text-xl font-semibold text-white mb-4">Match Preferences</h3>

            <div className="space-y-4">
              {/* Max Distance */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Maximum Distance: {localPrefs.max_distance_km} km
                </label>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={localPrefs.max_distance_km}
                  onChange={(e) =>
                    setLocalPrefs({ ...localPrefs, max_distance_km: parseInt(e.target.value) })
                  }
                  className="w-full"
                />
              </div>

              {/* Time Controls */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Preferred Time Controls
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Bullet', 'Blitz', 'Rapid', 'Classical'].map((tc) => (
                    <button
                      key={tc}
                      onClick={() => {
                        const current = localPrefs.preferred_time_controls;
                        setLocalPrefs({
                          ...localPrefs,
                          preferred_time_controls: current.includes(tc)
                            ? current.filter((t) => t !== tc)
                            : [...current, tc],
                        });
                      }}
                      className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                        localPrefs.preferred_time_controls.includes(tc)
                          ? 'bg-blue-600 text-white'
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      {tc}
                    </button>
                  ))}
                </div>
              </div>

              {/* Player Levels */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Preferred Player Levels
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Beginner', 'Intermediate', 'Advanced', 'Expert'].map((level) => (
                    <button
                      key={level}
                      onClick={() => {
                        const current = localPrefs.preferred_player_levels;
                        setLocalPrefs({
                          ...localPrefs,
                          preferred_player_levels: current.includes(level)
                            ? current.filter((l) => l !== level)
                            : [...current, level],
                        });
                      }}
                      className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                        localPrefs.preferred_player_levels.includes(level)
                          ? 'bg-blue-600 text-white'
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSavePreferences}
                disabled={isLoadingPreferences}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg transition-colors"
              >
                {isLoadingPreferences ? 'Saving...' : 'Save Preferences'}
              </button>
              <button
                onClick={() => setShowPrefsModal(false)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default MatchSuggestions;
