import { Check, Crown, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { subscriptionApi } from '../api/subscription';
import { useStore } from '../store';

interface PricingTableProps {
  onCheckoutStart?: () => void;
  onCheckoutError?: (error: string) => void;
}

export default function PricingTable({ onCheckoutStart, onCheckoutError }: PricingTableProps) {
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('annual');
  const [loading, setLoading] = useState(false);
  const { user } = useStore();
  const isAuthenticated = !!user;

  // These would come from environment variables in production
  const PRICE_IDS = {
    monthly: import.meta.env.VITE_STRIPE_PREMIUM_MONTHLY_PRICE_ID || 'price_monthly',
    annual: import.meta.env.VITE_STRIPE_PREMIUM_ANNUAL_PRICE_ID || 'price_annual',
  };

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      window.location.href = '/login?redirect=/premium';
      return;
    }

    setLoading(true);
    onCheckoutStart?.();

    try {
      const priceId = billingInterval === 'monthly' ? PRICE_IDS.monthly : PRICE_IDS.annual;
      const response = await subscriptionApi.createCheckout(priceId);

      if (response.success && response.data.checkoutUrl) {
        // Redirect to Stripe Checkout
        window.location.href = response.data.checkoutUrl;
      } else {
        throw new Error('Failed to create checkout session');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      onCheckoutError?.(error.response?.data?.message || 'Failed to start checkout');
      setLoading(false);
    }
  };

  const freePlanFeatures = [
    'Create up to 10 games per month',
    'Join unlimited games',
    'Access to community features',
    'Basic chess tools',
    'Tournament participation',
  ];

  const premiumPlanFeatures = [
    '10% discount on tournaments, clubs & master challenges',
    'Unlimited game creation',
    'Priority support',
    'Advanced statistics',
    'Ad-free experience',
    'Premium badge',
  ];

  return (
    <div className="max-w-5xl mx-auto">
      {/* Billing Toggle */}
      <div className="flex justify-center mb-8">
        <div className="bg-white/5 border border-white/10 rounded-lg p-1 inline-flex">
          <button
            onClick={() => setBillingInterval('monthly')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition ${
              billingInterval === 'monthly'
                ? 'bg-white text-black'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingInterval('annual')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition relative ${
              billingInterval === 'annual'
                ? 'bg-white text-black'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Annual
            <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
              Save 44%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Free Plan */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-white mb-2">Free</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-white">$0</span>
              <span className="text-white/60">/month</span>
            </div>
            <p className="text-sm text-white/60 mt-2">Great for casual players</p>
          </div>

          <div className="mb-6">
            <h4 className="text-sm font-semibold text-white/80 mb-3">Features:</h4>
            <ul className="space-y-2.5">
              {freePlanFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-white/70">
                  <Check className="w-4 h-4 text-white/40 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <button
            disabled
            className="w-full px-4 py-2.5 bg-white/5 text-white/40 rounded-lg cursor-not-allowed"
          >
            Current Plan
          </button>
        </div>

        {/* Premium Plan */}
        <div className="bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border-2 border-yellow-500/30 rounded-xl p-6 relative overflow-hidden">
          {/* Popular Badge */}
          <div className="absolute top-4 right-4">
            <span className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white text-xs font-bold px-3 py-1 rounded-full">
              POPULAR
            </span>
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-5 h-5 text-yellow-400" />
              <h3 className="text-xl font-bold text-white">Premium</h3>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-white">
                {billingInterval === 'monthly' ? '€15' : '€8.33'}
              </span>
              <span className="text-white/60">/month</span>
            </div>
            {billingInterval === 'annual' && (
              <p className="text-sm text-white/60 mt-1">Billed annually at €100</p>
            )}
            <p className="text-sm text-white/60 mt-2">Save 10% on all your chess activities</p>
            <div className="flex items-center gap-1.5 mt-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <p className="text-sm text-purple-400 font-medium">14-day free trial</p>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="text-sm font-semibold text-white/80 mb-3">Everything in Free, plus:</h4>
            <ul className="space-y-2.5">
              {premiumPlanFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-white/90">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm font-medium">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full px-4 py-2.5 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Crown className="w-4 h-4" />
                Start Free Trial
              </>
            )}
          </button>
        </div>
      </div>

      {/* Trial Info */}
      <div className="mt-6 text-center">
        <p className="text-sm text-white/40">
          No credit card required for trial. Cancel anytime during trial period.
        </p>
      </div>
    </div>
  );
}
