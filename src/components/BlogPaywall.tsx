import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, Check, Zap } from 'lucide-react';
import { useStore } from '../store';
import { authorSubscriptionsApi } from '../api/authorSubscriptions';

interface BlogPaywallProps {
  authorId: number;
  authorName: string;
  previewContent: string;
}

const BlogPaywall = ({ authorId, authorName, previewContent }: BlogPaywallProps) => {
  const { user, openAuthModal } = useStore();
  const [pricing, setPricing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    loadPricing();
  }, [authorId]);

  const loadPricing = async () => {
    try {
      const response = await authorSubscriptionsApi.getPricing(authorId);
      setPricing(response.data);
    } catch (error) {
      console.error('Failed to load pricing:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (tier: 'monthly' | 'annual') => {
    if (!user) {
      openAuthModal('signup');
      return;
    }

    try {
      setSubscribing(true);
      const response = await authorSubscriptionsApi.createCheckout({
        authorId,
        tier,
      });
      // Redirect to Stripe checkout
      window.location.href = response.data.checkoutUrl;
    } catch (error: any) {
      console.error('Failed to create checkout:', error);
      alert(error.response?.data?.message || 'Failed to start subscription');
      setSubscribing(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500 mx-auto"></div>
        <p className="text-white/60 mt-4">Loading subscription info...</p>
      </div>
    );
  }

  if (!pricing || !pricing.enabled) {
    return (
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center">
        <Lock className="w-16 h-16 text-white/20 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-white mb-2">Subscriber-Only Content</h3>
        <p className="text-white/60 mb-6">
          This content is exclusive to {authorName}'s subscribers, but subscriptions are not currently available.
        </p>
      </div>
    );
  }

  const monthlyPrice = (pricing.monthlyPriceCents / 100).toFixed(2);
  const annualPrice = (pricing.annualPriceCents / 100).toFixed(2);
  const annualMonthlyPrice = ((pricing.annualPriceCents / 12) / 100).toFixed(2);
  const annualSavings = ((pricing.monthlyPriceCents * 12 - pricing.annualPriceCents) / 100).toFixed(2);

  // Check if user is premium member for discount messaging
  const isPremiumMember = (user as any)?.subscription_tier === 'premium';
  const hasMonthlyDiscount = isPremiumMember && pricing.monthlyPremiumDiscountPercent > 0;
  const hasAnnualDiscount = isPremiumMember && pricing.annualPremiumDiscountPercent > 0;

  const discountedMonthlyPrice = hasMonthlyDiscount
    ? (pricing.monthlyPriceCents * (1 - pricing.monthlyPremiumDiscountPercent / 100) / 100).toFixed(2)
    : monthlyPrice;
  const discountedAnnualPrice = hasAnnualDiscount
    ? (pricing.annualPriceCents * (1 - pricing.annualPremiumDiscountPercent / 100) / 100).toFixed(2)
    : annualPrice;

  return (
    <div className="space-y-6">
      {/* Preview Content */}
      <div className="relative">
        <div className="prose prose-invert max-w-none">
          {/* Show preview content with fade-out */}
          <div className="relative">
            <div className="mb-4" dangerouslySetInnerHTML={{ __html: previewContent }} />
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-chess-darker to-transparent"></div>
          </div>
        </div>
      </div>

      {/* Paywall */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-gold-500/10 to-gold-600/5 backdrop-blur-sm border border-gold-500/20 rounded-2xl p-8"
      >
        <div className="text-center mb-8">
          <Lock className="w-16 h-16 text-gold-400 mx-auto mb-4" />
          <h3 className="text-3xl font-bold text-white mb-2">
            Subscribe to {authorName}
          </h3>
          <p className="text-white/70 text-lg">
            Get unlimited access to all paid content from {authorName}
          </p>
        </div>

        {isPremiumMember && (hasMonthlyDiscount || hasAnnualDiscount) && (
          <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-4 mb-6 flex items-start gap-3">
            <Zap className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-blue-400 font-semibold">Premium Member Discount!</p>
              <p className="text-blue-300/80 text-sm">
                You're a ChessFam Premium member and eligible for special pricing on author subscriptions.
              </p>
            </div>
          </div>
        )}

        {/* Pricing Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Monthly Plan */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-gold-500/30 transition-all cursor-pointer"
            onClick={() => !subscribing && handleSubscribe('monthly')}
          >
            <div className="text-center">
              <h4 className="text-white font-semibold text-lg mb-2">Monthly</h4>
              <div className="mb-4">
                {hasMonthlyDiscount && (
                  <div className="text-white/40 line-through text-sm">€{monthlyPrice}</div>
                )}
                <div className="text-4xl font-bold text-white">
                  €{discountedMonthlyPrice}
                  <span className="text-lg text-white/60">/month</span>
                </div>
                {hasMonthlyDiscount && (
                  <div className="text-green-400 text-sm mt-1">
                    Save {pricing.monthlyPremiumDiscountPercent}%
                  </div>
                )}
              </div>
              <button
                disabled={subscribing}
                className="w-full px-6 py-3 bg-gold-500 hover:bg-gold-600 text-chess-darker font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {subscribing ? 'Processing...' : 'Subscribe Monthly'}
              </button>
            </div>
          </motion.div>

          {/* Annual Plan */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white/5 border-2 border-gold-500/50 rounded-xl p-6 relative hover:border-gold-500 transition-all cursor-pointer"
            onClick={() => !subscribing && handleSubscribe('annual')}
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gold-500 text-chess-darker text-xs font-bold rounded-full">
              BEST VALUE
            </div>
            <div className="text-center">
              <h4 className="text-white font-semibold text-lg mb-2">Annual</h4>
              <div className="mb-4">
                {hasAnnualDiscount && (
                  <div className="text-white/40 line-through text-sm">€{annualPrice}</div>
                )}
                <div className="text-4xl font-bold text-white">
                  €{discountedAnnualPrice}
                  <span className="text-lg text-white/60">/year</span>
                </div>
                <div className="text-green-400 text-sm mt-1">
                  €{annualMonthlyPrice}/month • Save €{annualSavings}
                </div>
                {hasAnnualDiscount && (
                  <div className="text-green-400 text-sm">
                    Plus {pricing.annualPremiumDiscountPercent}% premium discount
                  </div>
                )}
              </div>
              <button
                disabled={subscribing}
                className="w-full px-6 py-3 bg-gold-500 hover:bg-gold-600 text-chess-darker font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {subscribing ? 'Processing...' : 'Subscribe Annually'}
              </button>
            </div>
          </motion.div>
        </div>

        {/* Benefits */}
        <div className="bg-white/5 rounded-xl p-6 space-y-3">
          <h4 className="text-white font-semibold mb-3">What you'll get:</h4>
          <div className="flex items-start gap-3 text-white/80">
            <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <span>Unlimited access to all paid articles by {authorName}</span>
          </div>
          <div className="flex items-start gap-3 text-white/80">
            <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <span>Access to future paid content automatically</span>
          </div>
          <div className="flex items-start gap-3 text-white/80">
            <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <span>Cancel anytime - no long-term commitment</span>
          </div>
          <div className="flex items-start gap-3 text-white/80">
            <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <span>Support independent chess content creators</span>
          </div>
        </div>

        {!user && (
          <div className="text-center mt-6 pt-6 border-t border-white/10">
            <p className="text-white/60 mb-3">Already a subscriber?</p>
            <button
              onClick={() => openAuthModal('login')}
              className="text-gold-400 hover:text-gold-300 font-semibold"
            >
              Sign in to access your subscription
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default BlogPaywall;
