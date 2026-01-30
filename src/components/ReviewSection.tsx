import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MessageSquare, Send, AlertCircle } from 'lucide-react';
import { useStore } from '../store';

interface Review {
  id: number;
  user_name: string;
  user_avatar?: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface ReviewSectionProps {
  entityType: 'master' | 'tournament' | 'club' | 'venue';
  entityId: number;
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
  canReview: boolean; // Whether user can review (has booking/membership for master/tournament/club, or always true for venue)
  requiresBooking?: boolean; // If true, shows message about needing to book first
  onSubmitReview: (rating: number, comment: string) => Promise<void>;
}

const ReviewSection = ({
  entityType,
  reviews,
  averageRating,
  totalReviews,
  canReview,
  requiresBooking = false,
  onSubmitReview,
}: ReviewSectionProps) => {
  const { user, openAuthModal } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [hoveredStar, setHoveredStar] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!comment.trim()) {
      setError('Please write a review');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await onSubmitReview(rating, comment);
      setComment('');
      setRating(5);
      setShowForm(false);
    } catch (err: any) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getEntityLabel = () => {
    switch (entityType) {
      case 'master': return 'master';
      case 'tournament': return 'tournament';
      case 'club': return 'club';
      case 'venue': return 'venue';
    }
  };

  return (
    <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h3 className="text-xl font-semibold text-white">Reviews</h3>
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-5 h-5 ${star <= averageRating ? 'text-gold-400 fill-gold-400' : 'text-white/20'}`}
                />
              ))}
            </div>
            <span className="text-white font-medium">{averageRating.toFixed(1)}</span>
            <span className="text-white/50">({totalReviews} reviews)</span>
          </div>
        </div>

        {user ? (
          canReview ? (
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 bg-gold-500 text-chess-darker font-medium rounded-xl hover:bg-gold-400 transition-colors flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Write a Review
            </button>
          ) : requiresBooking ? (
            <div className="flex items-center gap-2 text-white/50 text-sm">
              <AlertCircle className="w-4 h-4" />
              Book this {getEntityLabel()} to leave a review
            </div>
          ) : null
        ) : (
          <button
            onClick={() => openAuthModal('login')}
            className="px-4 py-2 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition-colors"
          >
            Sign in to review
          </button>
        )}
      </div>

      {/* Review Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden"
          >
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              {/* Star Rating */}
              <div className="mb-4">
                <label className="block text-sm text-white/70 mb-2">Your Rating</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(0)}
                      onClick={() => setRating(star)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 transition-colors ${
                          star <= (hoveredStar || rating)
                            ? 'text-gold-400 fill-gold-400'
                            : 'text-white/20'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-white font-medium">{rating}/5</span>
                </div>
              </div>

              {/* Comment */}
              <div className="mb-4">
                <label className="block text-sm text-white/70 mb-2">Your Review</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={`Share your experience with this ${getEntityLabel()}...`}
                  rows={4}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white
                           placeholder-white/30 focus:border-gold-500 focus:outline-none resize-none"
                />
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-6 py-2 bg-gold-500 text-chess-darker font-medium rounded-xl
                           hover:bg-gold-400 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reviews List */}
      {reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-white/5 rounded-xl border border-white/10"
            >
              <div className="flex items-start gap-3">
                {review.user_avatar ? (
                  <img
                    src={review.user_avatar}
                    alt={review.user_name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center">
                    <span className="text-chess-darker font-semibold">
                      {review.user_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-white">{review.user_name}</span>
                    <span className="text-xs text-white/40">{formatDate(review.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${star <= review.rating ? 'text-gold-400 fill-gold-400' : 'text-white/20'}`}
                      />
                    ))}
                  </div>
                  <p className="text-white/70 text-sm">{review.comment}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <MessageSquare className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/50">No reviews yet</p>
          {canReview && (
            <p className="text-white/30 text-sm mt-1">Be the first to leave a review!</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ReviewSection;
