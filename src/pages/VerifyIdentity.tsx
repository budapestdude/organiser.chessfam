import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import verificationApi, { type VerificationSubmission, type VerificationStatus } from '../api/verification';
import { Upload, Check, AlertCircle, Clock } from 'lucide-react';

const countries = [
  'United States', 'Canada', 'United Kingdom', 'Australia', 'Germany', 'France',
  'Spain', 'Italy', 'Netherlands', 'Belgium', 'Switzerland', 'Austria',
  'Poland', 'Czech Republic', 'Hungary', 'Romania', 'Bulgaria', 'Greece',
  'Portugal', 'Ireland', 'Sweden', 'Norway', 'Denmark', 'Finland',
  'India', 'China', 'Japan', 'South Korea', 'Brazil', 'Mexico',
  'Argentina', 'Chile', 'Colombia', 'Peru', 'Other'
];

export default function VerifyIdentity() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [status, setStatus] = useState<VerificationStatus | null>(null);

  const [formData, setFormData] = useState<VerificationSubmission>({
    full_name: '',
    date_of_birth: '',
    country: '',
    id_type: 'passport',
    id_number: '',
    id_front_image: '',
    id_back_image: '',
    selfie_image: '',
  });

  const [previews, setPreviews] = useState({
    id_front: '',
    id_back: '',
    selfie: '',
  });

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await verificationApi.getStatus();
      setStatus(response.data);
    } catch (err) {
      console.error('Error fetching verification status:', err);
    }
  };

  const handleImageUpload = (field: 'id_front_image' | 'id_back_image' | 'selfie_image', file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setFormData(prev => ({ ...prev, [field]: base64 }));

      const previewField = field === 'id_front_image' ? 'id_front' :
                          field === 'id_back_image' ? 'id_back' : 'selfie';
      setPreviews(prev => ({ ...prev, [previewField]: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (!formData.full_name || !formData.date_of_birth || !formData.country) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    if (!formData.id_front_image || !formData.selfie_image) {
      setError('Please upload your ID front image and selfie');
      setLoading(false);
      return;
    }

    if (formData.id_type === 'drivers_license' && !formData.id_back_image) {
      setError('Please upload the back of your driver\'s license');
      setLoading(false);
      return;
    }

    try {
      await verificationApi.submitVerification(formData);
      setSuccess(true);
      setTimeout(() => {
        navigate('/profile');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit verification');
    } finally {
      setLoading(false);
    }
  };

  // If already verified
  if (status?.is_verified) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="text-green-500 w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Already Verified</h2>
          <p className="text-white/60 mb-6">Your identity has been verified. You have full access to all features.</p>
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
  if (status?.verification?.status === 'pending') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="text-yellow-500 w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Verification Pending</h2>
          <p className="text-white/60 mb-2">
            Your verification is under review. This typically takes 24-48 hours.
          </p>
          <p className="text-sm text-white/40 mb-6">
            Submitted: {new Date(status.verification.created_at).toLocaleDateString()}
          </p>
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
  const rejectionMessage = status?.verification?.status === 'rejected' && (
    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
      <div className="flex items-start gap-3">
        <AlertCircle className="text-red-500 mt-0.5 flex-shrink-0 w-5 h-5" />
        <div>
          <p className="font-semibold text-red-500 mb-1">Previous Verification Rejected</p>
          <p className="text-sm text-white/60">
            {status.verification.rejection_reason || 'Your previous verification was rejected. Please ensure all information and documents are clear and accurate.'}
          </p>
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
            Your verification is under review. We'll notify you within 24-48 hours.
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
          <h1 className="text-3xl font-bold mb-2">Verify Your Identity</h1>
          <p className="text-white/60">
            Identity verification is required to create challenges, join tournaments, schedule games, and access other platform features.
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
            <h2 className="text-xl font-semibold mb-4">Personal Information</h2>

            <div>
              <label className="block text-sm font-medium mb-2">Full Name (as on ID) *</label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-4 py-2 bg-black border border-white/20 rounded-lg focus:border-white/40 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Date of Birth *</label>
              <input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                className="w-full px-4 py-2 bg-black border border-white/20 rounded-lg focus:border-white/40 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Country *</label>
              <select
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full px-4 py-2 bg-black border border-white/20 rounded-lg focus:border-white/40 outline-none"
                required
              >
                <option value="">Select country</option>
                {countries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">ID Type *</label>
              <select
                value={formData.id_type}
                onChange={(e) => setFormData({ ...formData, id_type: e.target.value as any })}
                className="w-full px-4 py-2 bg-black border border-white/20 rounded-lg focus:border-white/40 outline-none"
                required
              >
                <option value="passport">Passport</option>
                <option value="drivers_license">Driver's License</option>
                <option value="national_id">National ID Card</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">ID Number (optional)</label>
              <input
                type="text"
                value={formData.id_number}
                onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
                className="w-full px-4 py-2 bg-black border border-white/20 rounded-lg focus:border-white/40 outline-none"
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="bg-[#0a0a0a] border border-white/10 rounded-lg p-6 space-y-4">
            <h2 className="text-xl font-semibold mb-4">Document Upload</h2>
            <p className="text-sm text-white/60 mb-4">
              Please upload clear photos of your government-issued ID and a selfie. All images must be less than 5MB.
            </p>

            {/* ID Front */}
            <div>
              <label className="block text-sm font-medium mb-2">ID Front Image *</label>
              <div className="border-2 border-dashed border-white/20 rounded-lg p-4 text-center">
                {previews.id_front ? (
                  <div className="relative">
                    <img src={previews.id_front} alt="ID Front" className="max-h-48 mx-auto rounded" />
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, id_front_image: '' });
                        setPreviews({ ...previews, id_front: '' });
                      }}
                      className="mt-2 text-sm text-red-500 hover:text-red-400"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <Upload className="w-8 h-8 text-white/40 mx-auto mb-2" />
                    <p className="text-white/60 mb-1">Click to upload ID front</p>
                    <p className="text-xs text-white/40">JPG, PNG (max 5MB)</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleImageUpload('id_front_image', e.target.files[0])}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* ID Back (conditional) */}
            {formData.id_type === 'drivers_license' && (
              <div>
                <label className="block text-sm font-medium mb-2">ID Back Image *</label>
                <div className="border-2 border-dashed border-white/20 rounded-lg p-4 text-center">
                  {previews.id_back ? (
                    <div className="relative">
                      <img src={previews.id_back} alt="ID Back" className="max-h-48 mx-auto rounded" />
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, id_back_image: '' });
                          setPreviews({ ...previews, id_back: '' });
                        }}
                        className="mt-2 text-sm text-red-500 hover:text-red-400"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <Upload className="w-8 h-8 text-white/40 mx-auto mb-2" />
                      <p className="text-white/60 mb-1">Click to upload ID back</p>
                      <p className="text-xs text-white/40">JPG, PNG (max 5MB)</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleImageUpload('id_back_image', e.target.files[0])}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            )}

            {/* Selfie */}
            <div>
              <label className="block text-sm font-medium mb-2">Selfie with ID *</label>
              <p className="text-xs text-white/40 mb-2">Please hold your ID next to your face</p>
              <div className="border-2 border-dashed border-white/20 rounded-lg p-4 text-center">
                {previews.selfie ? (
                  <div className="relative">
                    <img src={previews.selfie} alt="Selfie" className="max-h-48 mx-auto rounded" />
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, selfie_image: '' });
                        setPreviews({ ...previews, selfie: '' });
                      }}
                      className="mt-2 text-sm text-red-500 hover:text-red-400"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <Upload className="w-8 h-8 text-white/40 mx-auto mb-2" />
                    <p className="text-white/60 mb-1">Click to upload selfie</p>
                    <p className="text-xs text-white/40">JPG, PNG (max 5MB)</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleImageUpload('selfie_image', e.target.files[0])}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <p className="text-sm text-blue-400">
              <strong>Privacy Notice:</strong> Your documents are encrypted and securely stored. They will only be reviewed by our verification team and will not be shared with third parties.
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
              className="flex-1 px-6 py-3 bg-white text-black rounded-lg hover:bg-white/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Submit Verification'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
