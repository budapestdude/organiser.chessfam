import { useNavigate, useLocation } from 'react-router-dom';
import { CreditCard, Shield, Lock, Trophy, Calendar, MapPin, Users } from 'lucide-react';

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

export default function TournamentPayment() {
  const navigate = useNavigate();
  const location = useLocation();
  const registration = location.state?.registration as RegistrationData;

  if (!registration) {
    navigate('/');
    return null;
  }

  const handleConfirmPayment = () => {
    navigate('/tournament-confirmation', { state: { registration } });
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
          <p className="text-gray-400">Complete your tournament registration</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Registration Summary */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Registration Summary</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Trophy className="w-5 h-5 text-gold-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-400">Tournament</p>
                  <p className="font-medium">{registration.tournament_name}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gold-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-400">Date</p>
                  <p className="font-medium">{registration.tournament_date}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gold-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-400">Location</p>
                  <p className="font-medium">{registration.tournament_location}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-gold-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-400">Player</p>
                  <p className="font-medium">{registration.player_name}</p>
                  {registration.player_rating && (
                    <p className="text-sm text-gray-500">Rating: {registration.player_rating}</p>
                  )}
                </div>
              </div>
              <div className="border-t border-white/10 pt-3 mt-3">
                <div className="flex justify-between text-lg">
                  <span className="font-semibold">Entry Fee</span>
                  <span className="font-bold text-gold-400">${registration.entry_fee}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Form Placeholder */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Payment Details</h2>

            {/* Stripe Integration Notice */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-blue-300 mb-1">Stripe Integration Coming Soon</h3>
                  <p className="text-sm text-blue-200/80">
                    This is a placeholder for the Stripe payment integration. In production,
                    you'll securely enter your payment information here using Stripe Elements.
                  </p>
                </div>
              </div>
            </div>

            {/* Placeholder Form Fields */}
            <div className="space-y-4 mb-6 opacity-50 pointer-events-none">
              <div>
                <label className="block text-sm font-medium mb-2">Card Number</label>
                <div className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-400">•••• •••• •••• ••••</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Expiry Date</label>
                  <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                    <span className="text-gray-400">MM / YY</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">CVV</label>
                  <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                    <span className="text-gray-400">•••</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Confirm Payment Button */}
            <button
              onClick={handleConfirmPayment}
              className="w-full bg-gradient-to-r from-gold-400 to-gold-500 text-black font-semibold py-3 rounded-lg hover:from-gold-500 hover:to-gold-600 transition-all flex items-center justify-center gap-2"
            >
              <Lock className="w-5 h-5" />
              Confirm Payment (Demo)
            </button>

            {/* Security Notice */}
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-400">
              <Shield className="w-4 h-4" />
              <span>Secured by Stripe (Integration Pending)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
