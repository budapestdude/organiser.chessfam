import { useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, Save, Share2, Download, Trash2 } from 'lucide-react';
import ChessBoardWithVariations from '../components/ChessBoardWithVariations';
import { useStore } from '../store';

const Analysis = () => {
  const [pgn, setPgn] = useState('');
  const [analysisName, setAnalysisName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const user = useStore((state) => state.user);

  const handleSave = () => {
    if (!user) {
      alert('Please sign in to save analysis');
      return;
    }
    setShowSaveModal(true);
  };

  const handleShare = async () => {
    if (!pgn) {
      alert('No moves to share. Make some moves first!');
      return;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Chess Analysis',
          text: 'Check out my chess analysis',
          url: window.location.href,
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      // Fallback: copy PGN to clipboard
      try {
        await navigator.clipboard.writeText(pgn);
        alert('PGN copied to clipboard!');
      } catch (err) {
        console.error('Copy failed:', err);
      }
    }
  };

  const handleDownload = () => {
    if (!pgn) {
      alert('No moves to download. Make some moves first!');
      return;
    }

    const blob = new Blob([pgn], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chess-analysis-${new Date().toISOString().split('T')[0]}.pgn`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    if (pgn && !confirm('Are you sure you want to reset the board? This will clear all moves.')) {
      return;
    }
    setPgn('');
  };

  return (
    <div className="min-h-screen bg-chess-darker pt-20 pb-32">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-bold text-white">
                Chess Analysis Board
              </h1>
              <p className="text-white/60 mt-1">
                Analyze positions, study openings, and prepare strategies
              </p>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex flex-wrap gap-3 mb-6"
        >
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            title="Save analysis"
          >
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline">Save</span>
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            title="Share analysis"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Share</span>
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-gold-600 hover:bg-gold-700 text-white rounded-lg transition-colors"
            title="Download PGN"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Download PGN</span>
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors ml-auto"
            title="Reset board"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </motion.div>

        {/* Chess Board */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 md:p-6"
        >
          <ChessBoardWithVariations
            initialPgn={pgn}
            onPgnChange={(newPgn) => setPgn(newPgn)}
            editable={true}
          />
        </motion.div>

        {/* Tips Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-3">Quick Tips</h3>
          <div className="space-y-2 text-sm text-white/70">
            <p>• <strong>Make moves</strong> by dragging pieces on the board</p>
            <p>• <strong>Variations auto-create</strong> - just drag a different piece when a move already exists</p>
            <p>• <strong>Navigate variations</strong> by clicking the purple branch icon (🌿) that appears</p>
            <p>• <strong>Promote variations</strong> to make them the main line with the ↑ button</p>
            <p>• <strong>Delete variations</strong> you don't want with the trash icon</p>
            <p>• <strong>Upload PGN</strong> to analyze existing games</p>
            <p>• <strong>Manual input</strong> works too - type moves in algebraic notation (e.g., "e4", "Nf3")</p>
            <p>• <strong>Navigate moves</strong> using the arrow controls below the board</p>
          </div>
        </motion.div>

        {/* Save Modal */}
        {showSaveModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-chess-dark border border-white/10 rounded-2xl p-6 max-w-md w-full"
            >
              <h3 className="text-xl font-bold text-white mb-4">Save Analysis</h3>
              <p className="text-white/60 text-sm mb-4">
                Give your analysis a name so you can find it later.
              </p>
              <input
                type="text"
                value={analysisName}
                onChange={(e) => setAnalysisName(e.target.value)}
                placeholder="e.g., Sicilian Defense Study"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-500 mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    // TODO: Implement save to backend
                    alert('Save functionality coming soon!');
                    setShowSaveModal(false);
                    setAnalysisName('');
                  }}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-lg font-semibold transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setShowSaveModal(false);
                    setAnalysisName('');
                  }}
                  className="px-6 py-2.5 border border-white/20 text-white/70 rounded-lg font-semibold hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analysis;
