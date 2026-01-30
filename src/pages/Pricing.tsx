import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import PricingTable from '../components/PricingTable';
import { AlertCircle, CheckCircle } from 'lucide-react';

export default function Pricing() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    // Check for success/cancel params from Stripe redirect
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');

    if (success === 'true') {
      setNotification({
        type: 'success',
        message: 'Successfully subscribed to Premium! Welcome aboard.',
      });
      // Clear params after showing message
      setTimeout(() => {
        navigate('/account/subscription', { replace: true });
      }, 2000);
    } else if (canceled === 'true') {
      setNotification({
        type: 'error',
        message: 'Checkout was canceled. No charges were made.',
      });
      // Clear param after a delay
      setTimeout(() => {
        setNotification(null);
      }, 5000);
    }
  }, [searchParams, navigate]);

  const handleCheckoutError = (error: string) => {
    setNotification({
      type: 'error',
      message: error,
    });
  };

  return (
    <div className="min-h-screen bg-black text-white py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            Start with a 14-day free trial. Upgrade to Premium for 10% off tournaments, clubs, master challenges, and more exclusive benefits.
          </p>
        </div>

        {/* Notification */}
        {notification && (
          <div className="max-w-5xl mx-auto mb-8">
            <div
              className={`p-4 rounded-lg border flex items-start gap-3 ${
                notification.type === 'success'
                  ? 'bg-green-500/10 border-green-500/30 text-green-400'
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}
            >
              {notification.type === 'success' ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              )}
              <p>{notification.message}</p>
            </div>
          </div>
        )}

        {/* Pricing Table */}
        <PricingTable onCheckoutError={handleCheckoutError} />

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h3 className="font-semibold text-white mb-2">What's included in the free trial?</h3>
              <p className="text-white/60 text-sm">
                You get full Premium access for 14 days, including 10% discount on tournaments, clubs & master challenges, unlimited game creation, advanced stats, and all premium features. No credit card required to start.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h3 className="font-semibold text-white mb-2">Can I cancel anytime?</h3>
              <p className="text-white/60 text-sm">
                Yes! You can cancel your subscription at any time from your account settings. You'll continue to have access until the end of your billing period.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h3 className="font-semibold text-white mb-2">What happens when my trial ends?</h3>
              <p className="text-white/60 text-sm">
                After your 14-day trial, you'll be downgraded to the Free plan with a 10 games/month limit. You can upgrade to Premium at any time to get unlimited access again.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h3 className="font-semibold text-white mb-2">How do I manage my subscription?</h3>
              <p className="text-white/60 text-sm">
                Visit your Account Settings to view your current plan, update payment methods, or cancel your subscription. You'll have full control over your billing.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h3 className="font-semibold text-white mb-2">Is the annual plan worth it?</h3>
              <p className="text-white/60 text-sm">
                The annual plan saves you 44% compared to paying monthly (€100/year vs €180/year). That's €80 in savings!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
