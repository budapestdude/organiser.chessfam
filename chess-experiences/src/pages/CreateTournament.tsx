import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Calendar, Clock, Users, Loader2, CheckCircle } from 'lucide-react';
import { useStore } from '../store';
import { tournamentsApi, type CreateTournamentInput } from '../api/tournaments';

const TOURNAMENT_TYPES = [
  { value: 'swiss', label: 'Swiss System' },
  { value: 'round_robin', label: 'Round Robin' },
  { value: 'knockout', label: 'Knockout/Elimination' },
  { value: 'arena', label: 'Arena' },
];

const TIME_CONTROLS = [
  { value: 'bullet', label: 'Bullet (1-2 min)' },
  { value: 'blitz', label: 'Blitz (3-5 min)' },
  { value: 'rapid', label: 'Rapid (10-30 min)' },
  { value: 'classical', label: 'Classical (60+ min)' },
];

const FORMATS = [
  { value: 'otb', label: 'Over the Board' },
  { value: 'online', label: 'Online' },
  { value: 'hybrid', label: 'Hybrid' },
];

const CreateTournament = () => {
  const navigate = useNavigate();
  const { user, openAuthModal } = useStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<CreateTournamentInput>({
    name: '',
    description: '',
    tournament_type: 'swiss',
    time_control: 'rapid',
    format: 'otb',
    start_date: '',
    end_date: '',
    registration_deadline: '',
    max_participants: 32,
    entry_fee: 0,
    prize_pool: 0,
    rating_min: undefined,
    rating_max: undefined,
    rules: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal('login');
      return;
    }

    if (!formData.name.trim()) {
      setError('Tournament name is required');
      return;
    }
    if (!formData.start_date) {
      setError('Start date is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await tournamentsApi.createTournament(formData);
      setSuccess(true);
      setTimeout(() => {
        navigate(`/tournaments/${response.data.id}`);
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create tournament');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen py-8 px-4 md:px-8 max-w-4xl mx-auto flex flex-col items-center justify-center">
        <Trophy className="w-16 h-16 text-white/20 mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Sign in to create a tournament</h2>
        <p className="text-white/50 mb-6">You need to be logged in to organize tournaments</p>
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
        <h2 className="text-xl font-semibold text-white mb-2">Tournament Created!</h2>
        <p className="text-white/50">Redirecting to your tournament...</p>
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
          onClick={() => navigate('/tournaments')}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <h1 className="text-2xl font-display font-bold text-white">Create Tournament</h1>
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
            <Trophy className="w-5 h-5 text-gold-400" />
            Basic Information
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm text-white/70 mb-2">Tournament Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Spring Open Championship 2024"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-gold-500 focus:outline-none"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-white/70 mb-2">Description</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your tournament..."
                rows={3}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-gold-500 focus:outline-none resize-none"
              />
            </div>
          </div>
        </div>

        {/* Format */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-gold-400" />
            Format & Time Control
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-white/70 mb-2">Tournament Type</label>
              <select
                value={formData.tournament_type || 'swiss'}
                onChange={(e) => setFormData({ ...formData, tournament_type: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-gold-500 focus:outline-none"
              >
                {TOURNAMENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-2">Time Control</label>
              <select
                value={formData.time_control || 'rapid'}
                onChange={(e) => setFormData({ ...formData, time_control: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-gold-500 focus:outline-none"
              >
                {TIME_CONTROLS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-2">Format</label>
              <select
                value={formData.format || 'otb'}
                onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-gold-500 focus:outline-none"
              >
                {FORMATS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Dates */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gold-400" />
            Schedule
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-white/70 mb-2">Start Date *</label>
              <input
                type="datetime-local"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-gold-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-2">End Date</label>
              <input
                type="datetime-local"
                value={formData.end_date || ''}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-gold-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-2">Registration Deadline</label>
              <input
                type="datetime-local"
                value={formData.registration_deadline || ''}
                onChange={(e) => setFormData({ ...formData, registration_deadline: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-gold-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Participants & Fees */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-gold-400" />
            Participants & Fees
          </h3>
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-white/70 mb-2">Max Participants</label>
              <input
                type="number"
                value={formData.max_participants || ''}
                onChange={(e) => setFormData({ ...formData, max_participants: parseInt(e.target.value) || undefined })}
                min={2}
                placeholder="32"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-gold-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-2">Entry Fee ($)</label>
              <input
                type="number"
                value={formData.entry_fee || ''}
                onChange={(e) => setFormData({ ...formData, entry_fee: parseFloat(e.target.value) || 0 })}
                min={0}
                step={0.01}
                placeholder="0"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-gold-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-2">Prize Pool ($)</label>
              <input
                type="number"
                value={formData.prize_pool || ''}
                onChange={(e) => setFormData({ ...formData, prize_pool: parseFloat(e.target.value) || 0 })}
                min={0}
                step={0.01}
                placeholder="0"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-gold-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-2">Min Rating</label>
              <input
                type="number"
                value={formData.rating_min || ''}
                onChange={(e) => setFormData({ ...formData, rating_min: parseInt(e.target.value) || undefined })}
                min={0}
                max={3500}
                placeholder="Any"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-gold-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Rules */}
        <div>
          <label className="block text-sm text-white/70 mb-2">Tournament Rules</label>
          <textarea
            value={formData.rules || ''}
            onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
            placeholder="Enter any specific rules or guidelines..."
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
                Creating...
              </>
            ) : (
              <>
                <Trophy className="w-5 h-5" />
                Create Tournament
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate('/tournaments')}
            className="px-6 py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors"
          >
            Cancel
          </button>
        </div>
      </motion.form>
    </div>
  );
};

export default CreateTournament;
