import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CreditCard, Shield, Lock, Users, MapPin, Calendar } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import apiClient from '../api/client';

interface MembershipData {
  id: number;
  club_name: string;
  club_location: string;
  member_name: string;
  member_email: string;
  member_rating?: number;
  membership_fee: number;
  membership_type: string;
}

export default function ClubPayment() {
  const navigate = useNavigate();
  const location = useLocation();
  const membership = location.state?.membership as MembershipData;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!membership) {
    navigate('/');
    return null;
  }

  const handleConfirmPayment = async () => {
    try {
      setLoading(true);
      setError(null);

      // Create checkout session
      const response = await apiClient.post('/payments/club-membership', {
        clubId: membership.id,
        membershipType: membership.membership_type,
      });

      // Redirect to Stripe
      const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
      if (!stripePublishableKey) {
        throw new Error('Stripe publishable key not configured');
      }

      const stripe = await loadStripe(stripePublishableKey);
      if (!stripe) {
        throw new Error('Failed to load Stripe');
      }

      // Redirect to checkout
      const result = await (stripe as any).redirectToCheckout({
        sessionId: response.data.sessionId,
      });

      if (result?.error) {
        throw new Error(result.error.message);
      }
    } catch (err: any) {
      console.error('Payment failed:', err);
      setError(err.response?.data?.message || err.message || 'Payment failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white pt-20">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gold-400/10 rounded-full mb-4">
            <CreditCard className="w-8 h-8 text-gold-400" />
          </div>
          <h1 className="text-4xl font-bold mb-2">Secure Payment</h1>
          <p className="text-gray-400">Complete your club membership</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Membership Summary */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Membership Summary</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-gold-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-400">Club</p>
                  <p className="font-medium">{membership.club_name}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gold-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-400">Location</p>
                  <p className="font-medium">{membership.club_location}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gold-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-400">Membership Type</p>
                  <p className="font-medium capitalize">{membership.membership_type}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-gold-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-400">Member</p>
                  <p className="font-medium">{membership.member_name}</p>
                  {membership.member_rating && (
                    <p className="text-sm text-gray-500">Rating: {membership.member_rating}</p>
                  )}
                </div>
              </div>
              <div className="border-t border-white/10 pt-3 mt-3">
                <div className="flex justify-between text-lg">
                  <span className="font-semibold">Membership Fee</span>
                  <span className="font-bold text-gold-400">${membership.membership_fee}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Payment Details</h2>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-red-300 mb-1">Payment Error</h3>
                    <p className="text-sm text-red-200/80">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Secure Payment Notice */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-blue-300 mb-1">Secure Checkout</h3>
                  <p className="text-sm text-blue-200/80">
                    You'll be redirected to Stripe's secure checkout page to complete your payment.
                    Your payment information is never stored on our servers.
                  </p>
                </div>
              </div>
            </div>

            {/* Proceed to Checkout Button */}
            <button
              onClick={handleConfirmPayment}
              disabled={loading}
              className="w-full bg-gradient-to-r from-gold-400 to-gold-500 text-black font-semibold py-3 rounded-lg hover:from-gold-500 hover:to-gold-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Lock className="w-5 h-5" />
              {loading ? 'Processing...' : 'Proceed to Secure Checkout'}
            </button>

            {/* Security Notice */}
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-400">
              <Shield className="w-4 h-4" />
              <span>Secured by Stripe - PCI DSS Compliant</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
