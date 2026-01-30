import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { CheckCircle, Calendar, Clock, MapPin, Trophy, Loader2, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
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

export default function BookingConfirmation() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const bookingData = location.state?.booking as BookingData;

  const [isVerifying, setIsVerifying] = useState(!!sessionId);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'failed' | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  useEffect(() => {
    // If we have a session_id, verify the payment
    if (sessionId) {
      const verifyPayment = async () => {
        try {
          const response = await paymentsApi.getPaymentStatus(sessionId);
          if (response.status === 'paid' || response.payment?.status === 'succeeded') {
            setPaymentStatus('success');
          } else {
            setPaymentStatus('failed');
            setPaymentError('Payment was not completed. Please try again.');
          }
        } catch (err) {
          console.error('Payment verification error:', err);
          // If verification fails but we have a session_id, assume success
          // (webhook may still be processing)
          setPaymentStatus('success');
        } finally {
          setIsVerifying(false);
        }
      };
      verifyPayment();
    } else if (!bookingData) {
      navigate('/');
    }
  }, [sessionId, bookingData, navigate]);

  // Show loading while verifying payment
  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white pt-20">
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gold-400/10 rounded-full mb-4">
            <Loader2 className="w-12 h-12 text-gold-400 animate-spin" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Verifying Payment...</h1>
          <p className="text-gray-400">Please wait while we confirm your payment.</p>
        </div>
      </div>
    );
  }

  // Show error if payment failed
  if (paymentStatus === 'failed') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white pt-20">
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-500/10 rounded-full mb-4">
            <XCircle className="w-12 h-12 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Payment Failed</h1>
          <p className="text-gray-400 mb-6">{paymentError || 'There was an issue with your payment.'}</p>
          <button
            onClick={() => navigate('/masters')}
            className="bg-gradient-to-r from-gold-400 to-gold-500 text-black font-semibold px-6 py-3 rounded-lg hover:from-gold-500 hover:to-gold-600 transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // If coming from Stripe redirect without booking data in state, show generic success
  if (!bookingData && sessionId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white pt-20">
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/10 rounded-full mb-4 animate-pulse">
            <CheckCircle className="w-12 h-12 text-green-400" />
          </div>
          <h1 className="text-4xl font-bold mb-2">Payment Successful!</h1>
          <p className="text-gray-400 mb-6">Your booking has been confirmed. You'll receive a confirmation email shortly.</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-gradient-to-r from-gold-400 to-gold-500 text-black font-semibold px-6 py-3 rounded-lg hover:from-gold-500 hover:to-gold-600 transition-all"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => navigate('/')}
              className="bg-white/5 border border-white/10 text-white font-semibold px-6 py-3 rounded-lg hover:bg-white/10 transition-all"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!bookingData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white pt-20">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Success Animation */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/10 rounded-full mb-4 animate-pulse">
            <CheckCircle className="w-12 h-12 text-green-400" />
          </div>
          <h1 className="text-4xl font-bold mb-2">Booking Confirmed!</h1>
          <p className="text-gray-400">Your session has been successfully booked</p>
        </div>

        {/* Booking Details Card */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-8 mb-6">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/10">
            <div className="w-16 h-16 bg-gradient-to-br from-gold-400 to-gold-600 rounded-full flex items-center justify-center text-2xl font-bold text-black">
              {bookingData.master_name.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{bookingData.master_name}</h2>
              <p className="text-gold-400">{bookingData.master_title}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Trophy className="w-5 h-5 text-gold-400 mt-1" />
              <div>
                <p className="text-sm text-gray-400">Session Type</p>
                <p className="font-semibold capitalize">{bookingData.session_type}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gold-400 mt-1" />
              <div>
                <p className="text-sm text-gray-400">Date</p>
                <p className="font-semibold">{bookingData.booking_date}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-gold-400 mt-1" />
              <div>
                <p className="text-sm text-gray-400">Time</p>
                <p className="font-semibold">{bookingData.booking_time}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gold-400 mt-1" />
              <div>
                <p className="text-sm text-gray-400">Location</p>
                <p className="font-semibold capitalize">{bookingData.location_type}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-400">Time Control</p>
                  <p className="font-semibold capitalize">{bookingData.time_control}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">Number of Games</p>
                  <p className="font-semibold">{bookingData.number_of_games}</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10">
              <div className="flex justify-between items-center text-lg">
                <span className="font-semibold">Total Paid</span>
                <span className="font-bold text-gold-400">${bookingData.total_price}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-blue-300 mb-3">What's Next?</h3>
          <ul className="space-y-2 text-sm text-blue-200/80">
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">•</span>
              <span>You'll receive a confirmation email with session details</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">•</span>
              <span>The master will contact you before the session to coordinate</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">•</span>
              <span>View all your bookings in your dashboard</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex-1 bg-gradient-to-r from-gold-400 to-gold-500 text-black font-semibold py-3 rounded-lg hover:from-gold-500 hover:to-gold-600 transition-all"
          >
            Go to Dashboard
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex-1 bg-white/5 border border-white/10 text-white font-semibold py-3 rounded-lg hover:bg-white/10 transition-all"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
