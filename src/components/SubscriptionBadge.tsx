import { Crown, Sparkles } from 'lucide-react';

interface SubscriptionBadgeProps {
  tier: 'free' | 'premium';
  inTrial?: boolean;
  className?: string;
}

export default function SubscriptionBadge({ tier, inTrial = false, className = '' }: SubscriptionBadgeProps) {
  if (tier === 'premium') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-400 text-xs font-semibold rounded-full border border-yellow-500/30 ${className}`}
      >
        <Crown className="w-3.5 h-3.5" />
        Premium
      </span>
    );
  }

  if (inTrial) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 text-xs font-semibold rounded-full border border-purple-500/30 ${className}`}
      >
        <Sparkles className="w-3.5 h-3.5" />
        Trial
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/5 text-white/60 text-xs font-medium rounded-full border border-white/10 ${className}`}
    >
      Free
    </span>
  );
}
