import { Star, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface ReviewCardProps {
  review: {
    id: number;
    user_name?: string;
    user_avatar?: string;
    rating: number;
    comment?: string;
    is_verified: boolean;
    created_at: string;
  };
  index?: number;
}

export default function ReviewCard({ review, index = 0 }: ReviewCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white/5 border border-white/10 rounded-xl p-6"
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
          {review.user_avatar ? (
            <img
              src={review.user_avatar}
              alt={review.user_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-xl text-white/40">
              {review.user_name?.charAt(0).toUpperCase() || 'U'}
            </span>
          )}
        </div>

        <div className="flex-1">
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-white">
                  {review.user_name || 'Anonymous'}
                </span>
                {review.is_verified && (
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-xs">
                    <CheckCircle className="w-3 h-3" />
                    Verified
                  </div>
                )}
              </div>
              <span className="text-sm text-white/40">{formatDate(review.created_at)}</span>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < review.rating
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-white/20'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Comment */}
          {review.comment && (
            <p className="text-white/80 leading-relaxed">{review.comment}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
