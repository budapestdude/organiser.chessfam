import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, Calendar, MapPin, Users, Mail } from 'lucide-react';
import { useEffect } from 'react';

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

export default function ClubConfirmation() {
  const navigate = useNavigate();
  const location = useLocation();
  const membership = location.state?.membership as MembershipData;

  useEffect(() => {
    if (!membership) {
      navigate('/');
    }
  }, [membership, navigate]);

  if (!membership) {
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
          <h1 className="text-4xl font-bold mb-2">Membership Activated!</h1>
          <p className="text-gray-400">Welcome to the club</p>
        </div>

        {/* Membership Details Card */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-8 mb-6">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/10">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{membership.club_name}</h2>
              <p className="text-purple-400">Club Membership</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-purple-400 mt-1" />
              <div>
                <p className="text-sm text-gray-400">Location</p>
                <p className="font-semibold">{membership.club_location}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-purple-400 mt-1" />
              <div>
                <p className="text-sm text-gray-400">Membership Type</p>
                <p className="font-semibold capitalize">{membership.membership_type}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-purple-400 mt-1" />
              <div>
                <p className="text-sm text-gray-400">Member Name</p>
                <p className="font-semibold">{membership.member_name}</p>
                {membership.member_rating && (
                  <p className="text-sm text-gray-500">Rating: {membership.member_rating}</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-purple-400 mt-1" />
              <div>
                <p className="text-sm text-gray-400">Confirmation Email</p>
                <p className="font-semibold">{membership.member_email}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10">
              <div className="flex justify-between items-center text-lg">
                <span className="font-semibold">Membership Fee Paid</span>
                <span className="font-bold text-gold-400">${membership.membership_fee}</span>
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
              <span>You'll receive a welcome email with club details and meeting information</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">•</span>
              <span>Check the club's schedule for upcoming events and gatherings</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">•</span>
              <span>View all your memberships in your dashboard</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">•</span>
              <span>Connect with other members and start playing!</span>
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
            onClick={() => navigate('/clubs')}
            className="flex-1 bg-white/5 border border-white/10 text-white font-semibold py-3 rounded-lg hover:bg-white/10 transition-all"
          >
            Browse Clubs
          </button>
        </div>
      </div>
    </div>
  );
}
