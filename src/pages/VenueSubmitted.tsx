import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, MapPin, Building2, Clock } from 'lucide-react';
import { useEffect } from 'react';

interface SubmissionData {
  id: number;
  venue_name: string;
  venue_type: string;
  city: string;
  country: string;
}

export default function VenueSubmitted() {
  const navigate = useNavigate();
  const location = useLocation();
  const submission = location.state?.submission as SubmissionData;

  useEffect(() => {
    if (!submission) {
      navigate('/');
    }
  }, [submission, navigate]);

  if (!submission) {
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
          <h1 className="text-4xl font-bold mb-2">Venue Submitted!</h1>
          <p className="text-gray-400">Thank you for registering your venue</p>
        </div>

        {/* Submission Details Card */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-8 mb-6">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/10">
            <div className="w-16 h-16 bg-gradient-to-br from-gold-400 to-gold-600 rounded-full flex items-center justify-center">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{submission.venue_name}</h2>
              <p className="text-gold-400 capitalize">{submission.venue_type.replace('_', ' ')}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gold-400 mt-1" />
              <div>
                <p className="text-sm text-gray-400">Location</p>
                <p className="font-semibold">{submission.city}, {submission.country}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-gold-400 mt-1" />
              <div>
                <p className="text-sm text-gray-400">Status</p>
                <p className="font-semibold">Pending Review</p>
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
              <span>Our team will review your venue submission within 2-3 business days</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">•</span>
              <span>You'll receive an email notification once your venue is approved</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">•</span>
              <span>Approved venues will be visible to all users searching for chess locations</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">•</span>
              <span>You can track your submission status in your dashboard</span>
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
