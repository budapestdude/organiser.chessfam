import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CreditCard, Shield, Lock, Loader2 } from 'lucide-react';
import { paymentsApi } from '../api/payments';

interface BookingData {
  id: number;
  master_name: string;
  master_title: string;
  session_type: string;
  booking_date: string;
  booking_time: string;
  time_control: string;
  number_of_games: number;
  location_type: string;
  total_price: number;
}

export default function PaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const bookingData = location.state?.booking as BookingData;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!bookingData) {
    navigate('/');
    return null;
  }

  const handleConfirmPayment = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await paymentsApi.createBookingCheckout(bookingData.id);
      // Redirect to Stripe Checkout
      window.location.href = response.url;
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.response?.data?.message || 'Failed to create checkout. Please try again.');
      setIsLoading(false);
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
          <p className="text-gray-400">Complete your booking with {bookingData.master_name}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Booking Summary */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Booking Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Master</span>
                <span className="font-medium">{bookingData.master_title} {bookingData.master_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Session Type</span>
                <span className="font-medium capitalize">{bookingData.session_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Date & Time</span>
                <span className="font-medium">{bookingData.booking_date} at {bookingData.booking_time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Time Control</span>
                <span className="font-medium capitalize">{bookingData.time_control}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Number of Games</span>
                <span className="font-medium">{bookingData.number_of_games}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Location</span>
                <span className="font-medium capitalize">{bookingData.location_type}</span>
              </div>
              <div className="border-t border-white/10 pt-3 mt-3">
                <div className="flex justify-between text-lg">
                  <span className="font-semibold">Total Amount</span>
                  <span className="font-bold text-gold-400">${bookingData.total_price}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Section */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Payment</h2>

            {/* Secure Payment Notice */}
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-green-300 mb-1">Secure Checkout</h3>
                  <p className="text-sm text-green-200/80">
                    You'll be redirected to Stripe's secure checkout page to complete your payment.
                    Your card details are never stored on our servers.
                  </p>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Proceed to Payment Button */}
            <button
              onClick={handleConfirmPayment}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-gold-400 to-gold-500 text-black font-semibold py-3 rounded-lg hover:from-gold-500 hover:to-gold-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Redirecting to Stripe...
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  Proceed to Secure Payment
                </>
              )}
            </button>

            {/* Security Notice */}
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-400">
              <Shield className="w-4 h-4" />
              <span>Secured by Stripe</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
