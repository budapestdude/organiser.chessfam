import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import chessTitleVerificationApi, {
  type ChessTitleVerificationSubmission,
  type ChessTitleVerificationStatus
} from '../api/chessTitleVerification';
import { Upload, Check, AlertCircle, Clock, Award } from 'lucide-react';

const FIDE_TITLES = [
  { value: 'GM', label: 'Grandmaster (GM)' },
  { value: 'IM', label: 'International Master (IM)' },
  { value: 'FM', label: 'FIDE Master (FM)' },
  { value: 'CM', label: 'Candidate Master (CM)' },
  { value: 'WGM', label: 'Woman Grandmaster (WGM)' },
  { value: 'WIM', label: 'Woman International Master (WIM)' },
  { value: 'WFM', label: 'Woman FIDE Master (WFM)' },
  { value: 'WCM', label: 'Woman Candidate Master (WCM)' },
];

export default function VerifyChessTitle() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [status, setStatus] = useState<ChessTitleVerificationStatus | null>(null);

  const [formData, setFormData] = useState<ChessTitleVerificationSubmission>({
    claimed_title: 'GM',
    fide_id: '',
    certificate_image: '',
  });

  const [preview, setPreview] = useState('');

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await chessTitleVerificationApi.getStatus();
      setStatus(response.data.data);
    } catch (err) {
      console.error('Error fetching chess title verification status:', err);
    }
  };

  const handleImageUpload = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setFormData(prev => ({ ...prev, certificate_image: base64 }));
      setPreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (!formData.claimed_title) {
      setError('Please select a chess title');
      setLoading(false);
      return;
    }

    if (!formData.certificate_image) {
      setError('Please upload your FIDE title certificate');
      setLoading(false);
      return;
    }

    try {
      await chessTitleVerificationApi.submitVerification(formData);
      setSuccess(true);
      setTimeout(() => {
        navigate('/profile');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit chess title verification');
    } finally {
      setLoading(false);
    }
  };

  // If already verified
  if (status?.chess_title_verified) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Award className="text-black w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Chess Title Verified</h2>
          <p className="text-white/60 mb-6">Your chess title has been verified and is displayed on your profile.</p>
          <button
            onClick={() => navigate('/profile')}
            className="px-6 py-2 bg-white text-black rounded-lg hover:bg-white/90 transition"
          >
            Go to Profile
          </button>
        </div>
      </div>
    );
  }

  // If pending review
  if (status?.latest_submission?.status === 'pending') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="text-yellow-500 w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Verification Pending</h2>
          <p className="text-white/60 mb-2">
            Your chess title verification is under review. This typically takes 24-48 hours.
          </p>
          <div className="bg-white/5 rounded-lg p-4 mb-6 text-left">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-white/60">Claimed Title:</span>
              <span className="font-semibold text-yellow-400">{status.latest_submission.claimed_title}</span>
            </div>
            {status.latest_submission.fide_id && (
              <div className="flex justify-between text-sm mb-2">
                <span className="text-white/60">FIDE ID:</span>
                <span className="font-mono">{status.latest_submission.fide_id}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Submitted:</span>
              <span>{new Date(status.latest_submission.created_at).toLocaleDateString()}</span>
            </div>
          </div>
          <button
            onClick={() => navigate('/profile')}
            className="px-6 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition"
          >
            Go to Profile
          </button>
        </div>
      </div>
    );
  }

  // Show rejection message if rejected
  const rejectionMessage = status?.latest_submission?.status === 'rejected' && (
    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
      <div className="flex items-start gap-3">
        <AlertCircle className="text-red-500 mt-0.5 flex-shrink-0 w-5 h-5" />
        <div>
          <p className="font-semibold text-red-500 mb-1">Previous Verification Rejected</p>
          <p className="text-sm text-white/60 mb-3">
            {status.latest_submission.rejection_reason || 'Your previous verification was rejected. Please ensure your certificate is clear and matches the claimed title.'}
          </p>
          <div className="text-xs text-white/40">
            <p className="mb-1">Common reasons for rejection:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Certificate image is unclear or unreadable</li>
              <li>FIDE ID does not match the certificate</li>
              <li>Title on certificate does not match claimed title</li>
              <li>Certificate appears to be altered</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  if (success) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="text-green-500 w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Verification Submitted!</h2>
          <p className="text-white/60 mb-6">
            Your chess title verification is under review. We'll notify you within 24-48 hours.
          </p>
          <p className="text-sm text-white/40">Redirecting to profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center">
              <Award className="w-6 h-6 text-black" />
            </div>
            <h1 className="text-3xl font-bold">Verify Your Chess Title</h1>
          </div>
          <p className="text-white/60">
            Verify your FIDE chess title to display a verified badge on your profile. Only FIDE titles (GM, IM, FM, CM, WGM, WIM, WFM, WCM) can be verified.
          </p>
        </div>

        {rejectionMessage}

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-lg p-6 space-y-4">
            <h2 className="text-xl font-semibold mb-4">Chess Title Information</h2>

            <div>
              <label className="block text-sm font-medium mb-2">FIDE Chess Title *</label>
              <select
                value={formData.claimed_title}
                onChange={(e) => setFormData({ ...formData, claimed_title: e.target.value as any })}
                className="w-full px-4 py-2 bg-black border border-white/20 rounded-lg focus:border-white/40 outline-none"
                required
              >
                {FIDE_TITLES.map(title => (
                  <option key={title.value} value={title.value}>{title.label}</option>
                ))}
              </select>
              <p className="text-xs text-white/40 mt-1">
                Select the FIDE title you want to verify
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">FIDE ID (optional)</label>
              <input
                type="text"
                value={formData.fide_id}
                onChange={(e) => setFormData({ ...formData, fide_id: e.target.value })}
                className="w-full px-4 py-2 bg-black border border-white/20 rounded-lg focus:border-white/40 outline-none font-mono"
                placeholder="e.g., 12345678"
              />
              <p className="text-xs text-white/40 mt-1">
                Your FIDE ID helps us verify your title faster. Find it on{' '}
                <a
                  href="https://ratings.fide.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  ratings.fide.com
                </a>
              </p>
            </div>
          </div>

          <div className="bg-[#0a0a0a] border border-white/10 rounded-lg p-6 space-y-4">
            <h2 className="text-xl font-semibold mb-2">FIDE Title Certificate</h2>
            <p className="text-sm text-white/60 mb-4">
              Upload a clear photo or scan of your official FIDE title certificate. The image must be less than 5MB and show your name and title clearly.
            </p>

            <div>
              <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center">
                {preview ? (
                  <div className="relative">
                    <img src={preview} alt="Certificate" className="max-h-64 mx-auto rounded border border-white/10" />
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, certificate_image: '' });
                        setPreview('');
                      }}
                      className="mt-4 text-sm text-red-500 hover:text-red-400"
                    >
                      Remove and upload different image
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <Upload className="w-12 h-12 text-white/40 mx-auto mb-3" />
                    <p className="text-white/60 mb-1 font-medium">Click to upload certificate</p>
                    <p className="text-xs text-white/40">JPG, PNG, or PDF (max 5MB)</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
              <p className="text-xs text-blue-400">
                <strong>Tip:</strong> Ensure the certificate shows your full name, the title being awarded, and the FIDE logo. Blurry or incomplete images will be rejected.
              </p>
            </div>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <p className="text-sm text-yellow-400">
              <strong>Privacy Notice:</strong> Your certificate is encrypted and securely stored. It will only be reviewed by our verification team and will not be shared with third parties.
            </p>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-semibold rounded-lg hover:from-yellow-400 hover:to-yellow-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Submit for Verification'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
