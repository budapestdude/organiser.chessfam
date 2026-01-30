import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, AlertTriangle, Send, Loader2 } from 'lucide-react';
import api from '../api/client';

interface GameReviewModalProps {
  gameId: number;
  opponentId: number;
  opponentName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const ALLOWED_BADGES = [
  { id: 'good_sport', label: 'Good Sport', emoji: '🤝' },
  { id: 'punctual', label: 'Punctual', emoji: '⏰' },
  { id: 'skilled', label: 'Skilled', emoji: '🎯' },
  { id: 'friendly', label: 'Friendly', emoji: '😊' },
  { id: 'respectful', label: 'Respectful', emoji: '🙏' },
  { id: 'patient', label: 'Patient', emoji: '🧘' },
  { id: 'focused', label: 'Focused', emoji: '🎓' },
  { id: 'fun_opponent', label: 'Fun Opponent', emoji: '🎉' },
];

const GameReviewModal = ({
  gameId,
  opponentId,
  opponentName,
  isOpen,
  onClose,
  onSuccess,
}: GameReviewModalProps) => {
  const [opponentRating, setOpponentRating] = useState(5);
  const [gameQualityRating, setGameQualityRating] = useState(5);
  const [comment, setComment] = useState('');
  const [selectedBadges, setSelectedBadges] = useState<string[]>([]);
  const [isReporting, setIsReporting] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [hoveredOpponentStar, setHoveredOpponentStar] = useState(0);
  const [hoveredQualityStar, setHoveredQualityStar] = useState(0);

  const toggleBadge = (badgeId: string) => {
    setSelectedBadges((prev) =>
      prev.includes(badgeId) ? prev.filter((b) => b !== badgeId) : [...prev, badgeId]
    );
  };

  const handleSubmit = async () => {
    if (isReporting && !reportReason.trim()) {
      setError('Please provide a reason for reporting');
      return;
    }

    if (!isReporting && !comment.trim()) {
      setError('Please write a review comment');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await api.post(`/game-reviews/${gameId}/submit`, {
        opponent_id: opponentId,
        opponent_rating: opponentRating,
        game_quality_rating: gameQualityRating,
        comment: comment.trim(),
        badges: selectedBadges,
        reported: isReporting,
        report_reason: isReporting ? reportReason.trim() : null,
      });

      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setOpponentRating(5);
    setGameQualityRating(5);
    setComment('');
    setSelectedBadges([]);
    setIsReporting(false);
    setReportReason('');
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-gray-900 rounded-2xl p-6 max-w-2xl w-full border border-white/10 max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Review Game</h2>
            <button
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Opponent Info */}
          <div className="bg-white/5 rounded-lg p-4 mb-6 border border-white/10">
            <p className="text-white/70 text-sm mb-1">Reviewing</p>
            <p className="text-white font-semibold text-lg">{opponentName}</p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Report Toggle */}
          <div className="mb-6">
            <button
              onClick={() => setIsReporting(!isReporting)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isReporting
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>{isReporting ? 'Reporting this player' : 'Report inappropriate behavior'}</span>
            </button>
          </div>

          {isReporting ? (
            /* Report Form */
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Reason for reporting *
                </label>
                <textarea
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Please describe the inappropriate behavior..."
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 resize-none focus:outline-none focus:border-red-500"
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-white/40 mt-1">{reportReason.length}/500 characters</p>
              </div>

              <p className="text-sm text-white/50">
                Your report will be reviewed by our moderation team. Thank you for helping keep our
                community safe.
              </p>
            </div>
          ) : (
            /* Review Form */
            <div className="space-y-6">
              {/* Opponent Rating */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  How would you rate your opponent? *
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setOpponentRating(star)}
                      onMouseEnter={() => setHoveredOpponentStar(star)}
                      onMouseLeave={() => setHoveredOpponentStar(0)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= (hoveredOpponentStar || opponentRating)
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-white/20'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-white font-medium">{opponentRating}/5</span>
                </div>
              </div>

              {/* Game Quality Rating */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  How was the overall game quality? *
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setGameQualityRating(star)}
                      onMouseEnter={() => setHoveredQualityStar(star)}
                      onMouseLeave={() => setHoveredQualityStar(0)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= (hoveredQualityStar || gameQualityRating)
                            ? 'text-blue-400 fill-blue-400'
                            : 'text-white/20'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-white font-medium">{gameQualityRating}/5</span>
                </div>
              </div>

              {/* Badges */}
              <div>
                <label className="block text-sm font-medium text-white mb-3">
                  Award badges (optional)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {ALLOWED_BADGES.map((badge) => (
                    <button
                      key={badge.id}
                      onClick={() => toggleBadge(badge.id)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${
                        selectedBadges.includes(badge.id)
                          ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                          : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      <span className="text-2xl">{badge.emoji}</span>
                      <span className="text-xs text-center">{badge.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Your review *
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience playing this game..."
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 resize-none focus:outline-none focus:border-blue-500"
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-white/40 mt-1">{comment.length}/500 characters</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className={`flex-1 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                isReporting
                  ? 'bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white'
              }`}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>{isReporting ? 'Submit Report' : 'Submit Review'}</span>
                </>
              )}
            </button>
            <button
              onClick={() => {
                resetForm();
                onClose();
              }}
              disabled={submitting}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 disabled:bg-white/5 text-white rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>

          {/* XP Reward Info */}
          {!isReporting && (
            <p className="text-center text-sm text-white/50 mt-4">
              You'll earn <span className="text-blue-400 font-medium">15 XP</span> for submitting
              this review
            </p>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default GameReviewModal;
