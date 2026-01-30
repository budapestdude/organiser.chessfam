import { X, Crown, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UpgradePromptProps {
  isOpen: boolean;
  onClose: () => void;
  quotaUsed?: number;
  quotaLimit?: number;
  message?: string;
}

export default function UpgradePrompt({
  isOpen,
  onClose,
  quotaUsed = 10,
  quotaLimit = 10,
  message = 'You\'ve reached your monthly game creation limit',
}: UpgradePromptProps) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleUpgrade = () => {
    onClose();
    navigate('/premium');
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0a0a0a] border border-white/20 rounded-xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-b border-yellow-500/30 p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/60 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-full flex items-center justify-center">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Upgrade to Premium</h2>
              <p className="text-sm text-yellow-400">Unlock unlimited game creation</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Quota Status */}
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <p className="text-red-400 font-medium mb-1">{message}</p>
            <p className="text-sm text-white/60">
              You&apos;ve used {quotaUsed} of {quotaLimit} games this month
            </p>
          </div>

          {/* Premium Features */}
          <div>
            <h3 className="font-semibold text-white mb-3">Premium Benefits:</h3>
            <div className="space-y-2">
              {[
                'Unlimited game creation',
                'Priority support',
                'Advanced statistics',
                'Ad-free experience',
                'Premium badge',
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-white/80">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Preview */}
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-3xl font-bold text-white">€15</span>
              <span className="text-white/60">/month</span>
            </div>
            <p className="text-sm text-white/60">or €100/year (save 44%)</p>
            <p className="text-xs text-green-400 mt-2">14-day free trial included</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-lg transition"
            >
              Maybe Later
            </button>
            <button
              onClick={handleUpgrade}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
            >
              <Crown className="w-4 h-4" />
              Upgrade Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
