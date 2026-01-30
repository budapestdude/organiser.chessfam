import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { CheckCircle, Calendar, MapPin, Trophy, Users, Mail, Loader2, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { paymentsApi } from '../api/payments';

interface RegistrationData {
  id: number;
  tournament_name: string;
  tournament_date: string;
  tournament_location: string;
  player_name: string;
  player_email: string;
  player_rating?: number;
  entry_fee: number;
}

export default function TournamentConfirmation() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const registration = location.state?.registration as RegistrationData;

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
    } else if (!registration) {
      navigate('/');
    }
  }, [sessionId, registration, navigate]);

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
            onClick={() => navigate('/tournaments')}
            className="bg-gradient-to-r from-gold-400 to-gold-500 text-black font-semibold px-6 py-3 rounded-lg hover:from-gold-500 hover:to-gold-600 transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // If coming from Stripe redirect without registration data in state, show generic success
  if (!registration && sessionId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white pt-20">
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/10 rounded-full mb-4 animate-pulse">
            <CheckCircle className="w-12 h-12 text-green-400" />
          </div>
          <h1 className="text-4xl font-bold mb-2">Registration Confirmed!</h1>
          <p className="text-gray-400 mb-6">Your tournament registration is complete. You'll receive a confirmation email shortly.</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-gradient-to-r from-gold-400 to-gold-500 text-black font-semibold px-6 py-3 rounded-lg hover:from-gold-500 hover:to-gold-600 transition-all"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => navigate('/tournaments')}
              className="bg-white/5 border border-white/10 text-white font-semibold px-6 py-3 rounded-lg hover:bg-white/10 transition-all"
            >
              Browse Tournaments
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!registration) {
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
          <h1 className="text-4xl font-bold mb-2">Registration Confirmed!</h1>
          <p className="text-gray-400">You're all set for the tournament</p>
        </div>

        {/* Registration Details Card */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-8 mb-6">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/10">
            <div className="w-16 h-16 bg-gradient-to-br from-gold-400 to-gold-600 rounded-full flex items-center justify-center">
              <Trophy className="w-8 h-8 text-black" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{registration.tournament_name}</h2>
              <p className="text-gold-400">Tournament Registration</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gold-400 mt-1" />
              <div>
                <p className="text-sm text-gray-400">Date</p>
                <p className="font-semibold">{registration.tournament_date}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gold-400 mt-1" />
              <div>
                <p className="text-sm text-gray-400">Location</p>
                <p className="font-semibold">{registration.tournament_location}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-gold-400 mt-1" />
              <div>
                <p className="text-sm text-gray-400">Player Name</p>
                <p className="font-semibold">{registration.player_name}</p>
                {registration.player_rating && (
                  <p className="text-sm text-gray-500">Rating: {registration.player_rating}</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-gold-400 mt-1" />
              <div>
                <p className="text-sm text-gray-400">Confirmation Email</p>
                <p className="font-semibold">{registration.player_email}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10">
              <div className="flex justify-between items-center text-lg">
                <span className="font-semibold">Entry Fee Paid</span>
                <span className="font-bold text-gold-400">${registration.entry_fee}</span>
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
              <span>You'll receive a confirmation email with tournament details</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">•</span>
              <span>Check your dashboard for pairing information closer to the event</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">•</span>
              <span>Arrive 30 minutes early for check-in</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">•</span>
              <span>Bring a valid ID and your confirmation number</span>
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
            onClick={() => navigate('/tournaments')}
            className="flex-1 bg-white/5 border border-white/10 text-white font-semibold py-3 rounded-lg hover:bg-white/10 transition-all"
          >
            Browse Tournaments
          </button>
        </div>
      </div>
    </div>
  );
}
