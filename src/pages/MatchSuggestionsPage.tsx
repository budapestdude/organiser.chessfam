import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Sliders } from 'lucide-react';
import MatchSuggestions from '../components/MatchSuggestions';
import { useGeolocation } from '../hooks/useGeolocation';

const MatchSuggestionsPage = () => {
  const { latitude, longitude, isLoading: locationLoading, error: locationError } = useGeolocation();
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <TrendingUp className="w-10 h-10 text-blue-400" />
            <div>
              <h1 className="text-4xl font-bold text-white">Match Suggestions</h1>
              <p className="text-white/60">
                Discover games that match your preferences and skill level
              </p>
            </div>
          </div>

          {/* Location Status */}
          {locationLoading && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-blue-300">
              Getting your location to find nearby games...
            </div>
          )}

          {locationError && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 text-amber-300">
              <p className="font-medium">Location access disabled</p>
              <p className="text-sm mt-1">
                Enable location to get distance-based suggestions. You can still browse all games.
              </p>
            </div>
          )}

          {latitude && longitude && !locationLoading && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-green-300">
              <p className="text-sm">
                ✓ Location enabled - showing games sorted by distance and match score
              </p>
            </div>
          )}
        </motion.div>

        {/* How it Works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 rounded-2xl p-6 border border-white/10 mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <Sliders className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">How Matching Works</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="text-3xl font-bold text-blue-400 mb-2">40pts</div>
              <p className="text-sm text-white/70">
                <strong>Rating Match</strong>
                <br />
                Games with players near your rating
              </p>
            </div>

            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="text-3xl font-bold text-green-400 mb-2">30pts</div>
              <p className="text-sm text-white/70">
                <strong>Location</strong>
                <br />
                Games happening nearby (5-15km)
              </p>
            </div>

            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="text-3xl font-bold text-purple-400 mb-2">15pts</div>
              <p className="text-sm text-white/70">
                <strong>Time Control</strong>
                <br />
                Matches your preferred pace
              </p>
            </div>

            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="text-3xl font-bold text-yellow-400 mb-2">15pts</div>
              <p className="text-sm text-white/70">
                <strong>Skill Level</strong>
                <br />
                Appropriate difficulty level
              </p>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-sm text-blue-300">
              <strong>Tip:</strong> Set your preferences using the settings icon to get better
              matches. Games scoring 60+ are good matches, 80+ are excellent!
            </p>
          </div>
        </motion.div>

        {/* Match Suggestions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <MatchSuggestions
            limit={showAllSuggestions ? 100 : 20}
            showPreferences={true}
          />

          {!showAllSuggestions && (
            <div className="text-center mt-6">
              <button
                onClick={() => setShowAllSuggestions(true)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Show All Suggestions
              </button>
            </div>
          )}
        </motion.div>

        {/* Empty State Help */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 bg-white/5 rounded-2xl p-6 border border-white/10"
        >
          <h3 className="text-lg font-semibold text-white mb-3">Not seeing enough matches?</h3>
          <ul className="space-y-2 text-white/70">
            <li>• Try expanding your maximum distance preference</li>
            <li>• Consider more time controls and skill levels</li>
            <li>• Check back later - new games are posted regularly</li>
            <li>• Create your own game to attract players to you!</li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
};

export default MatchSuggestionsPage;
