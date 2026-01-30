import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Crown, Star, Loader2, CheckCircle, Clock, XCircle, Globe, Award } from 'lucide-react';
import { useStore } from '../store';
import { mastersApi, type CreateMasterApplicationInput, type MasterApplication as MasterApplicationType } from '../api/masters';

const TITLES = [
  { value: 'GM', label: 'Grandmaster (GM)' },
  { value: 'IM', label: 'International Master (IM)' },
  { value: 'FM', label: 'FIDE Master (FM)' },
  { value: 'CM', label: 'Candidate Master (CM)' },
  { value: 'NM', label: 'National Master (NM)' },
  { value: 'WGM', label: 'Woman Grandmaster (WGM)' },
  { value: 'WIM', label: 'Woman International Master (WIM)' },
  { value: 'WFM', label: 'Woman FIDE Master (WFM)' },
];

const SPECIALTIES = [
  'Opening Theory',
  'Endgame Technique',
  'Positional Play',
  'Tactical Training',
  'Tournament Preparation',
  'Beginner Coaching',
  'Advanced Strategy',
  'Game Analysis',
];

const LANGUAGES = [
  'English',
  'Spanish',
  'Russian',
  'Chinese',
  'Hindi',
  'French',
  'German',
  'Portuguese',
  'Arabic',
  'Japanese',
];

const MasterApplication = () => {
  const navigate = useNavigate();
  const { user, openAuthModal } = useStore();
  const [loading, setLoading] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [existingApplication, setExistingApplication] = useState<MasterApplicationType | null>(null);

  const [formData, setFormData] = useState<CreateMasterApplicationInput>({
    title: 'FM',
    fide_id: '',
    lichess_username: '',
    chesscom_username: '',
    peak_rating: 2200,
    current_rating: 2200,
    price_bullet: 30,
    price_blitz: 35,
    price_rapid: 40,
    price_classical: 50,
    bio: '',
    specialties: [],
    experience_years: 1,
    languages: ['English'],
  });

  // Check for existing application
  useEffect(() => {
    const checkExistingApplication = async () => {
      if (!user) {
        setCheckingExisting(false);
        return;
      }

      try {
        const response = await mastersApi.getMyApplication();
        if (response.data) {
          setExistingApplication(response.data);
        }
      } catch {
        // No existing application, that's fine
      } finally {
        setCheckingExisting(false);
      }
    };
    checkExistingApplication();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal('login');
      return;
    }

    if (!formData.title) {
      setError('Chess title is required');
      return;
    }
    if (formData.peak_rating < 1800) {
      setError('Peak rating must be at least 1800');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await mastersApi.applyToBeMaster(formData);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  const toggleSpecialty = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties?.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...(prev.specialties || []), specialty]
    }));
  };

  const toggleLanguage = (language: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages?.includes(language)
        ? prev.languages.filter(l => l !== language)
        : [...(prev.languages || []), language]
    }));
  };

  if (!user) {
    return (
      <div className="min-h-screen py-8 px-4 md:px-8 max-w-4xl mx-auto flex flex-col items-center justify-center">
        <Crown className="w-16 h-16 text-white/20 mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Sign in to apply</h2>
        <p className="text-white/50 mb-6">You need to be logged in to become a master</p>
        <button
          onClick={() => openAuthModal('login')}
          className="px-6 py-3 bg-gold-500 text-chess-darker font-semibold rounded-xl hover:bg-gold-400 transition-colors"
        >
          Sign In
        </button>
      </div>
    );
  }

  if (checkingExisting) {
    return (
      <div className="min-h-screen py-8 px-4 md:px-8 max-w-4xl mx-auto flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-gold-500 animate-spin mb-4" />
        <p className="text-white/50">Checking application status...</p>
      </div>
    );
  }

  // Show existing application status
  if (existingApplication) {
    const statusConfig = {
      pending: { icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/20', label: 'Under Review' },
      approved: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/20', label: 'Approved' },
      rejected: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/20', label: 'Rejected' },
    };
    const status = statusConfig[existingApplication.status];
    const StatusIcon = status.icon;

    return (
      <div className="min-h-screen py-8 px-4 md:px-8 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <button
            onClick={() => navigate('/masters')}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-2xl font-display font-bold text-white">Application Status</h1>
          <div className="w-16" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 rounded-2xl p-8 border border-white/10 text-center"
        >
          <div className={`w-20 h-20 rounded-full ${status.bg} flex items-center justify-center mx-auto mb-4`}>
            <StatusIcon className={`w-10 h-10 ${status.color}`} />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">{status.label}</h2>
          <p className="text-white/60 mb-6">
            {existingApplication.status === 'pending' && 'Your application is being reviewed by our team.'}
            {existingApplication.status === 'approved' && 'Congratulations! You are now a verified master.'}
            {existingApplication.status === 'rejected' && 'Unfortunately, your application was not approved.'}
          </p>

          {existingApplication.rejection_reason && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 text-left">
              <p className="text-sm text-red-400 font-medium mb-1">Reason:</p>
              <p className="text-white/70">{existingApplication.rejection_reason}</p>
            </div>
          )}

          <div className="flex items-center justify-center gap-4">
            {existingApplication.status === 'approved' ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="px-6 py-3 bg-gold-500 text-chess-darker font-semibold rounded-xl hover:bg-gold-400 transition-colors"
              >
                Go to Dashboard
              </button>
            ) : (
              <button
                onClick={() => navigate('/masters')}
                className="px-6 py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors"
              >
                View Masters
              </button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen py-8 px-4 md:px-8 max-w-4xl mx-auto flex flex-col items-center justify-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-4"
        >
          <CheckCircle className="w-10 h-10 text-green-400" />
        </motion.div>
        <h2 className="text-xl font-semibold text-white mb-2">Application Submitted!</h2>
        <p className="text-white/50 mb-6 text-center max-w-md">
          Your application is now under review. We'll notify you once it's been processed.
        </p>
        <button
          onClick={() => navigate('/masters')}
          className="px-6 py-3 bg-gold-500 text-chess-darker font-semibold rounded-xl hover:bg-gold-400 transition-colors"
        >
          Back to Masters
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 md:px-8 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <button
          onClick={() => navigate('/masters')}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <h1 className="text-2xl font-display font-bold text-white">Become a Master</h1>
        <div className="w-16" />
      </motion.div>

      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-gradient-to-r from-gold-500/20 to-gold-600/20 border border-gold-500/30 rounded-xl p-4 mb-6"
      >
        <div className="flex items-start gap-3">
          <Crown className="w-5 h-5 text-gold-400 mt-0.5" />
          <div>
            <h3 className="font-semibold text-white">Join Our Master Community</h3>
            <p className="text-sm text-white/60">
              Share your expertise, teach chess enthusiasts, and earn by offering lessons and game analysis.
            </p>
          </div>
        </div>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400"
        >
          {error}
        </motion.div>
      )}

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="bg-white/5 rounded-2xl p-6 border border-white/10 space-y-6"
      >
        {/* Title & Credentials */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-gold-400" />
            Title & Credentials
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/70 mb-2">Chess Title *</label>
              <select
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-gold-500 focus:outline-none"
                required
              >
                {TITLES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-2">FIDE ID</label>
              <input
                type="text"
                value={formData.fide_id || ''}
                onChange={(e) => setFormData({ ...formData, fide_id: e.target.value })}
                placeholder="e.g., 12345678"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-gold-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-2">Peak Rating *</label>
              <input
                type="number"
                value={formData.peak_rating}
                onChange={(e) => setFormData({ ...formData, peak_rating: parseInt(e.target.value) || 0 })}
                min={1800}
                max={3000}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-gold-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-2">Current Rating</label>
              <input
                type="number"
                value={formData.current_rating}
                onChange={(e) => setFormData({ ...formData, current_rating: parseInt(e.target.value) || 0 })}
                min={0}
                max={3000}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-gold-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Online Profiles */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-gold-400" />
            Online Profiles
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/70 mb-2">Lichess Username</label>
              <input
                type="text"
                value={formData.lichess_username || ''}
                onChange={(e) => setFormData({ ...formData, lichess_username: e.target.value })}
                placeholder="Your Lichess username"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-gold-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-2">Chess.com Username</label>
              <input
                type="text"
                value={formData.chesscom_username || ''}
                onChange={(e) => setFormData({ ...formData, chesscom_username: e.target.value })}
                placeholder="Your Chess.com username"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-gold-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-gold-400" />
            Hourly Rates (USD)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-white/70 mb-2">Bullet</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50">$</span>
                <input
                  type="number"
                  value={formData.price_bullet || ''}
                  onChange={(e) => setFormData({ ...formData, price_bullet: parseFloat(e.target.value) || undefined })}
                  min={0}
                  placeholder="30"
                  className="w-full pl-8 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-gold-500 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-2">Blitz</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50">$</span>
                <input
                  type="number"
                  value={formData.price_blitz || ''}
                  onChange={(e) => setFormData({ ...formData, price_blitz: parseFloat(e.target.value) || undefined })}
                  min={0}
                  placeholder="35"
                  className="w-full pl-8 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-gold-500 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-2">Rapid</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50">$</span>
                <input
                  type="number"
                  value={formData.price_rapid || ''}
                  onChange={(e) => setFormData({ ...formData, price_rapid: parseFloat(e.target.value) || undefined })}
                  min={0}
                  placeholder="40"
                  className="w-full pl-8 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-gold-500 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-2">Classical</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50">$</span>
                <input
                  type="number"
                  value={formData.price_classical || ''}
                  onChange={(e) => setFormData({ ...formData, price_classical: parseFloat(e.target.value) || undefined })}
                  min={0}
                  placeholder="50"
                  className="w-full pl-8 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-gold-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Experience */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Experience</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/70 mb-2">Years of Experience</label>
              <input
                type="number"
                value={formData.experience_years || ''}
                onChange={(e) => setFormData({ ...formData, experience_years: parseInt(e.target.value) || undefined })}
                min={0}
                max={50}
                placeholder="5"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-gold-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Specialties */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Specialties</h3>
          <div className="flex flex-wrap gap-2">
            {SPECIALTIES.map((specialty) => (
              <button
                key={specialty}
                type="button"
                onClick={() => toggleSpecialty(specialty)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  formData.specialties?.includes(specialty)
                    ? 'bg-gold-500 text-chess-darker'
                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                {specialty}
              </button>
            ))}
          </div>
        </div>

        {/* Languages */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Languages</h3>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((language) => (
              <button
                key={language}
                type="button"
                onClick={() => toggleLanguage(language)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  formData.languages?.includes(language)
                    ? 'bg-gold-500 text-chess-darker'
                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                {language}
              </button>
            ))}
          </div>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm text-white/70 mb-2">Bio / About You</label>
          <textarea
            value={formData.bio || ''}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            placeholder="Tell potential students about yourself, your playing style, teaching approach..."
            rows={4}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-gold-500 focus:outline-none resize-none"
          />
        </div>

        {/* Submit */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 bg-gold-500 text-chess-darker font-semibold rounded-xl hover:bg-gold-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Crown className="w-5 h-5" />
                Submit Application
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate('/masters')}
            className="px-6 py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors"
          >
            Cancel
          </button>
        </div>
      </motion.form>
    </div>
  );
};

export default MasterApplication;
