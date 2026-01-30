import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, MapPin, Globe, Calendar, Loader2, CheckCircle } from 'lucide-react';
import { useStore } from '../store';
import { clubsApi, type CreateClubInput } from '../api/clubs';

const COUNTRIES = [
  'United States', 'United Kingdom', 'Canada', 'Germany', 'France', 'Spain',
  'Italy', 'Russia', 'China', 'India', 'Brazil', 'Australia', 'Japan',
  'South Korea', 'Netherlands', 'Sweden', 'Norway', 'Poland', 'Hungary',
  'Czech Republic', 'Ukraine', 'Armenia', 'Azerbaijan', 'Israel', 'Turkey', 'Other'
];

const CreateClub = () => {
  const navigate = useNavigate();
  const { user, openAuthModal } = useStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<CreateClubInput>({
    name: '',
    description: '',
    city: '',
    country: '',
    founded_year: new Date().getFullYear(),
    meeting_schedule: '',
    membership_fee: 0,
    website: '',
    contact_email: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal('login');
      return;
    }

    if (!formData.name.trim()) {
      setError('Club name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await clubsApi.createClub(formData);
      setSuccess(true);
      setTimeout(() => {
        navigate(`/clubs/${response.data.id}`);
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create club');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen py-8 px-4 md:px-8 max-w-4xl mx-auto flex flex-col items-center justify-center">
        <Users className="w-16 h-16 text-white/20 mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Sign in to register a club</h2>
        <p className="text-white/50 mb-6">You need to be logged in to create a chess club</p>
        <button
          onClick={() => openAuthModal('login')}
          className="px-6 py-3 bg-gold-500 text-chess-darker font-semibold rounded-xl hover:bg-gold-400 transition-colors"
        >
          Sign In
        </button>
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
        <h2 className="text-xl font-semibold text-white mb-2">Club Created!</h2>
        <p className="text-white/50">Redirecting to your club page...</p>
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
          onClick={() => navigate('/clubs')}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <h1 className="text-2xl font-display font-bold text-white">Register Club</h1>
        <div className="w-16" />
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
        {/* Basic Info */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-gold-400" />
            Club Information
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm text-white/70 mb-2">Club Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Downtown Chess Club"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-gold-500 focus:outline-none"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-white/70 mb-2">Description</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Tell people about your club, its history, and what makes it special..."
                rows={4}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-gold-500 focus:outline-none resize-none"
              />
            </div>
          </div>
        </div>

        {/* Location */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-gold-400" />
            Location
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-white/70 mb-2">City</label>
              <input
                type="text"
                value={formData.city || ''}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="e.g., New York"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-gold-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-2">Country</label>
              <select
                value={formData.country || ''}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-gold-500 focus:outline-none"
              >
                <option value="">Select Country</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-2">Founded Year</label>
              <input
                type="number"
                value={formData.founded_year || ''}
                onChange={(e) => setFormData({ ...formData, founded_year: parseInt(e.target.value) || undefined })}
                min={1800}
                max={new Date().getFullYear()}
                placeholder={new Date().getFullYear().toString()}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-gold-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Schedule & Fees */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gold-400" />
            Schedule & Membership
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/70 mb-2">Meeting Schedule</label>
              <input
                type="text"
                value={formData.meeting_schedule || ''}
                onChange={(e) => setFormData({ ...formData, meeting_schedule: e.target.value })}
                placeholder="e.g., Every Tuesday & Thursday, 7-10 PM"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-gold-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-2">Membership Fee ($/month)</label>
              <input
                type="number"
                value={formData.membership_fee || ''}
                onChange={(e) => setFormData({ ...formData, membership_fee: parseFloat(e.target.value) || 0 })}
                min={0}
                step={0.01}
                placeholder="0 (Free)"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-gold-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Contact */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-gold-400" />
            Contact Information
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/70 mb-2">Website</label>
              <input
                type="url"
                value={formData.website || ''}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://yourclub.com"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-gold-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-2">Contact Email</label>
              <input
                type="email"
                value={formData.contact_email || ''}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                placeholder="contact@yourclub.com"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-gold-500 focus:outline-none"
              />
            </div>
          </div>
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
                Creating...
              </>
            ) : (
              <>
                <Users className="w-5 h-5" />
                Register Club
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate('/clubs')}
            className="px-6 py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors"
          >
            Cancel
          </button>
        </div>
      </motion.form>
    </div>
  );
};

export default CreateClub;
