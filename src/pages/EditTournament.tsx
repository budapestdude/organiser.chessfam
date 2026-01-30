import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Calendar, Clock, Users, Loader2, CheckCircle, MapPin } from 'lucide-react';
import { useStore } from '../store';
import { tournamentsApi, type CreateTournamentInput, type Tournament } from '../api/tournaments';
import ImageUpload from '../components/ImageUpload';
import ImageGalleryUpload from '../components/ImageGalleryUpload';

const COUNTRIES = [
  'United States', 'United Kingdom', 'Canada', 'Germany', 'France', 'Spain',
  'Italy', 'Russia', 'China', 'India', 'Brazil', 'Australia', 'Japan',
  'South Korea', 'Netherlands', 'Sweden', 'Norway', 'Poland', 'Hungary',
  'Czech Republic', 'Ukraine', 'Armenia', 'Azerbaijan', 'Israel', 'Turkey', 'Other'
];

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

const EditTournament = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, openAuthModal } = useStore();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [tournament, setTournament] = useState<Tournament | null>(null);

  // Early bird pricing state
  const [earlyBirdTiers, setEarlyBirdTiers] = useState<Array<{
    deadline: string;
    discount: number;
    discount_type: 'percentage' | 'fixed';
    label: string;
  }>>([]);

  const [formData, setFormData] = useState<CreateTournamentInput & {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
  }>({
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
    address: '',
    city: '',
    state: '',
    country: '',
    image: '',
    images: [],
    junior_discount: 0,
    senior_discount: 0,
    women_discount: 0,
    gm_wgm_discount: 0,
    im_wim_discount: 0,
    fm_wfm_discount: 0,
    junior_age_max: undefined,
    senior_age_min: undefined,
    currency: 'USD',
  });

  useEffect(() => {
    if (!user) {
      openAuthModal('login');
      return;
    }

    if (!id) {
      navigate('/my-tournaments');
      return;
    }

    const fetchTournament = async () => {
      try {
        setFetchLoading(true);
        const response = await tournamentsApi.getTournamentById(parseInt(id));
        const tournamentData: Tournament = response.data;

        // Check if user is the organizer
        if (tournamentData.organizer_id !== user.id) {
          setError('You can only edit tournaments you created');
          setTimeout(() => navigate('/my-tournaments'), 2000);
          return;
        }

        // Check if tournament can be edited
        if (tournamentData.status !== 'upcoming') {
          setError('You can only edit upcoming tournaments');
          setTimeout(() => navigate('/my-tournaments'), 2000);
          return;
        }

        setTournament(tournamentData);

        // Convert datetime-local format
        const formatDateForInput = (date?: string) => {
          if (!date) return '';
          return new Date(date).toISOString().slice(0, 16);
        };

        // Pre-fill form with tournament data
        setFormData({
          name: tournamentData.name,
          description: tournamentData.description || '',
          tournament_type: tournamentData.tournament_type || 'swiss',
          time_control: tournamentData.time_control || 'rapid',
          format: tournamentData.format || 'otb',
          start_date: formatDateForInput(tournamentData.start_date),
          end_date: formatDateForInput(tournamentData.end_date),
          registration_deadline: formatDateForInput(tournamentData.registration_deadline),
          max_participants: tournamentData.max_participants,
          entry_fee: tournamentData.entry_fee,
          prize_pool: tournamentData.prize_pool,
          rating_min: tournamentData.rating_min,
          rating_max: tournamentData.rating_max,
          rules: tournamentData.rules || '',
          address: '',
          city: tournamentData.venue_city || '',
          state: '',
          country: '',
          image: tournamentData.image || '',
          images: tournamentData.images || [],
          junior_discount: tournamentData.junior_discount || 0,
          senior_discount: tournamentData.senior_discount || 0,
          women_discount: tournamentData.women_discount || 0,
          gm_wgm_discount: tournamentData.gm_wgm_discount || 0,
          im_wim_discount: tournamentData.im_wim_discount || 0,
          fm_wfm_discount: tournamentData.fm_wfm_discount || 0,
          junior_age_max: tournamentData.junior_age_max,
          senior_age_min: tournamentData.senior_age_min,
          currency: tournamentData.currency || 'USD',
        });

        // Initialize early bird pricing if exists
        if (tournamentData.early_bird_pricing && Array.isArray(tournamentData.early_bird_pricing)) {
          setEarlyBirdTiers(tournamentData.early_bird_pricing);
        }
      } catch (err: any) {
        console.error('Failed to fetch tournament:', err);
        setError(err.response?.data?.error || 'Failed to load tournament');
        setTimeout(() => navigate('/my-tournaments'), 2000);
      } finally {
        setFetchLoading(false);
      }
    };

    fetchTournament();
  }, [id, user, openAuthModal, navigate]);

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
    // Require location for OTB and hybrid tournaments
    if (formData.format !== 'online' && !formData.city?.trim()) {
      setError('City is required for in-person tournaments');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Include early bird pricing in update
      const tournamentData = {
        ...formData,
        early_bird_pricing: earlyBirdTiers.length > 0 ? earlyBirdTiers : undefined,
      };

      await tournamentsApi.updateTournament(parseInt(id!), tournamentData);
      setSuccess(true);
      setTimeout(() => {
        navigate(`/tournament/${id}`);
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update tournament');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen py-8 px-4 md:px-8 max-w-4xl mx-auto flex flex-col items-center justify-center">
        <Trophy className="w-16 h-16 text-white/20 mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Sign in to edit tournament</h2>
        <p className="text-white/50 mb-6">You need to be logged in to edit tournaments</p>
        <button
          onClick={() => openAuthModal('login')}
          className="px-6 py-3 bg-gold-500 text-chess-darker font-semibold rounded-xl hover:bg-gold-400 transition-colors"
        >
          Sign In
        </button>
      </div>
    );
  }

  if (fetchLoading) {
    return (
      <div className="min-h-screen py-8 px-4 md:px-8 max-w-4xl mx-auto flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin mb-4" />
        <p className="text-white/50">Loading tournament...</p>
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
        <h2 className="text-xl font-semibold text-white mb-2">Tournament Updated!</h2>
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
          onClick={() => navigate(`/tournament/${id}`)}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <h1 className="text-2xl font-display font-bold text-white">Edit Tournament</h1>
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
            <div className="md:col-span-2">
              <ImageUpload
                label="Cover Image"
                helperText="Main tournament image (JPG, PNG, GIF or WebP, max 5MB)"
                value={formData.image}
                onChange={(url) => setFormData({ ...formData, image: url })}
                onClear={() => setFormData({ ...formData, image: '' })}
              />
            </div>
            <div className="md:col-span-2">
              <ImageGalleryUpload
                label="Additional Images"
                helperText="Up to 5 images (JPG, PNG, GIF or WebP, max 5MB each)"
                value={formData.images || []}
                onChange={(urls) => setFormData({ ...formData, images: urls })}
                maxImages={5}
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

        {/* Location - shown for OTB and hybrid */}
        {formData.format !== 'online' && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gold-400" />
              Location
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm text-white/70 mb-2">Venue Address</label>
                <input
                  type="text"
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g., 123 Chess Street"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-gold-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">City *</label>
                <input
                  type="text"
                  value={formData.city || ''}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="e.g., New York"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-gold-500 focus:outline-none"
                  required={formData.format !== 'online'}
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">State / Province</label>
                <input
                  type="text"
                  value={formData.state || ''}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="e.g., NY"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-gold-500 focus:outline-none"
                />
              </div>
              <div className="md:col-span-2">
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
            </div>
          </div>
        )}

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
              <label className="block text-sm text-white/70 mb-2">Currency</label>
              <select
                value={formData.currency || 'USD'}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-gold-500 focus:outline-none"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD ($)</option>
                <option value="AUD">AUD ($)</option>
                <option value="INR">INR (₹)</option>
                <option value="JPY">JPY (¥)</option>
                <option value="CNY">CNY (¥)</option>
                <option value="CHF">CHF (Fr)</option>
                <option value="SEK">SEK (kr)</option>
                <option value="NOK">NOK (kr)</option>
                <option value="DKK">DKK (kr)</option>
                <option value="PLN">PLN (zł)</option>
                <option value="CZK">CZK (Kč)</option>
                <option value="HUF">HUF (Ft)</option>
                <option value="RON">RON (lei)</option>
                <option value="BGN">BGN (лв)</option>
                <option value="HRK">HRK (kn)</option>
                <option value="TRY">TRY (₺)</option>
                <option value="ILS">ILS (₪)</option>
                <option value="ZAR">ZAR (R)</option>
                <option value="BRL">BRL (R$)</option>
                <option value="MXN">MXN ($)</option>
                <option value="ARS">ARS ($)</option>
                <option value="CLP">CLP ($)</option>
                <option value="COP">COP ($)</option>
                <option value="SGD">SGD ($)</option>
                <option value="MYR">MYR (RM)</option>
                <option value="THB">THB (฿)</option>
                <option value="IDR">IDR (Rp)</option>
                <option value="PHP">PHP (₱)</option>
                <option value="KRW">KRW (₩)</option>
                <option value="NZD">NZD ($)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-2">Entry Fee</label>
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
              <label className="block text-sm text-white/70 mb-2">Prize Pool</label>
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

        {/* Variable Pricing Discounts */}
        {formData.entry_fee && formData.entry_fee > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <svg className="w-6 h-6 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Variable Pricing Discounts
              </h3>
              <p className="text-white/50 text-sm mt-1">
                Offer percentage discounts to specific player categories
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Junior Discount */}
              <div>
                <label className="block text-sm text-white/70 mb-2">Junior Discount (%)</label>
                <input
                  type="number"
                  value={formData.junior_discount || ''}
                  onChange={(e) => setFormData({ ...formData, junior_discount: parseFloat(e.target.value) || 0 })}
                  min={0}
                  max={100}
                  step={0.1}
                  placeholder="0"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-gold-500 focus:outline-none"
                />
                <p className="text-xs text-white/40 mt-1">
                  {formData.junior_discount && formData.junior_discount > 0
                    ? `Juniors pay $${(formData.entry_fee * (1 - formData.junior_discount / 100)).toFixed(2)}`
                    : 'No discount'}
                </p>
              </div>

              {/* Senior Discount */}
              <div>
                <label className="block text-sm text-white/70 mb-2">Senior Discount (%)</label>
                <input
                  type="number"
                  value={formData.senior_discount || ''}
                  onChange={(e) => setFormData({ ...formData, senior_discount: parseFloat(e.target.value) || 0 })}
                  min={0}
                  max={100}
                  step={0.1}
                  placeholder="0"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-gold-500 focus:outline-none"
                />
                <p className="text-xs text-white/40 mt-1">
                  {formData.senior_discount && formData.senior_discount > 0
                    ? `Seniors pay $${(formData.entry_fee * (1 - formData.senior_discount / 100)).toFixed(2)}`
                    : 'No discount'}
                </p>
              </div>

              {/* Women Discount */}
              <div>
                <label className="block text-sm text-white/70 mb-2">Women Discount (%)</label>
                <input
                  type="number"
                  value={formData.women_discount || ''}
                  onChange={(e) => setFormData({ ...formData, women_discount: parseFloat(e.target.value) || 0 })}
                  min={0}
                  max={100}
                  step={0.1}
                  placeholder="0"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-gold-500 focus:outline-none"
                />
                <p className="text-xs text-white/40 mt-1">
                  {formData.women_discount && formData.women_discount > 0
                    ? `Women pay $${(formData.entry_fee * (1 - formData.women_discount / 100)).toFixed(2)}`
                    : 'No discount'}
                </p>
              </div>
            </div>

            {/* Titled Player Discounts */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-white mb-4">Titled Player Discounts (Optional)</h3>
              <p className="text-sm text-white/50 mb-4">Discounts for verified FIDE titled players only</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm text-white/70 mb-2">GM / WGM Discount (%)</label>
                <input
                  type="number"
                  value={formData.gm_wgm_discount || ''}
                  onChange={(e) => setFormData({ ...formData, gm_wgm_discount: parseFloat(e.target.value) || 0 })}
                  min={0}
                  max={100}
                  step={0.1}
                  placeholder="0"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-gold-500 focus:outline-none"
                />
                <p className="text-xs text-white/40 mt-1">
                  {formData.gm_wgm_discount && formData.gm_wgm_discount > 0
                    ? `GMs/WGMs pay $${(formData.entry_fee * (1 - formData.gm_wgm_discount / 100)).toFixed(2)}`
                    : 'No discount'}
                </p>
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-2">IM / WIM Discount (%)</label>
                <input
                  type="number"
                  value={formData.im_wim_discount || ''}
                  onChange={(e) => setFormData({ ...formData, im_wim_discount: parseFloat(e.target.value) || 0 })}
                  min={0}
                  max={100}
                  step={0.1}
                  placeholder="0"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-gold-500 focus:outline-none"
                />
                <p className="text-xs text-white/40 mt-1">
                  {formData.im_wim_discount && formData.im_wim_discount > 0
                    ? `IMs/WIMs pay $${(formData.entry_fee * (1 - formData.im_wim_discount / 100)).toFixed(2)}`
                    : 'No discount'}
                </p>
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-2">FM / WFM Discount (%)</label>
                <input
                  type="number"
                  value={formData.fm_wfm_discount || ''}
                  onChange={(e) => setFormData({ ...formData, fm_wfm_discount: parseFloat(e.target.value) || 0 })}
                  min={0}
                  max={100}
                  step={0.1}
                  placeholder="0"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-gold-500 focus:outline-none"
                />
                <p className="text-xs text-white/40 mt-1">
                  {formData.fm_wfm_discount && formData.fm_wfm_discount > 0
                    ? `FMs/WFMs pay $${(formData.entry_fee * (1 - formData.fm_wfm_discount / 100)).toFixed(2)}`
                    : 'No discount'}
                </p>
              </div>
            </div>

            {/* Age Range Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <label className="block text-sm text-white/70 mb-2">Junior Max Age</label>
                <input
                  type="number"
                  value={formData.junior_age_max || ''}
                  onChange={(e) => setFormData({ ...formData, junior_age_max: parseInt(e.target.value) || undefined })}
                  min={1}
                  max={25}
                  placeholder="18 (default)"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-gold-500 focus:outline-none"
                />
                <p className="text-xs text-white/40 mt-1">
                  Maximum age for junior discount eligibility
                </p>
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-2">Senior Min Age</label>
                <input
                  type="number"
                  value={formData.senior_age_min || ''}
                  onChange={(e) => setFormData({ ...formData, senior_age_min: parseInt(e.target.value) || undefined })}
                  min={50}
                  max={100}
                  placeholder="65 (default)"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-gold-500 focus:outline-none"
                />
                <p className="text-xs text-white/40 mt-1">
                  Minimum age for senior discount eligibility
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Early Bird Pricing */}
        {formData.entry_fee && formData.entry_fee > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Early Bird Pricing (Optional)</h3>
                <p className="text-sm text-white/50">Offer up to 3 tiers of discounts for early registrations</p>
              </div>
              {earlyBirdTiers.length < 3 && (
                <button
                  type="button"
                  onClick={() => {
                    setEarlyBirdTiers([
                      ...earlyBirdTiers,
                      {
                        deadline: '',
                        discount: 0,
                        discount_type: 'percentage',
                        label: earlyBirdTiers.length === 0 ? 'Super Early Bird' : earlyBirdTiers.length === 1 ? 'Early Bird' : 'Regular Early Bird'
                      }
                    ]);
                  }}
                  className="px-4 py-2 bg-gold-500/20 text-gold-400 rounded-lg hover:bg-gold-500/30 transition-colors text-sm font-medium"
                >
                  + Add Tier
                </button>
              )}
            </div>

            {earlyBirdTiers.length === 0 && (
              <p className="text-white/40 text-sm">No early bird pricing tiers added yet</p>
            )}

            <div className="space-y-4">
              {earlyBirdTiers.map((tier, index) => (
                <div key={index} className="bg-white/5 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white">Tier {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => {
                        setEarlyBirdTiers(earlyBirdTiers.filter((_, i) => i !== index));
                      }}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-white/60 mb-1">Label</label>
                      <input
                        type="text"
                        value={tier.label}
                        onChange={(e) => {
                          const updated = [...earlyBirdTiers];
                          updated[index].label = e.target.value;
                          setEarlyBirdTiers(updated);
                        }}
                        placeholder="e.g., Super Early Bird"
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/30 focus:border-gold-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-white/60 mb-1">Deadline</label>
                      <input
                        type="date"
                        value={tier.deadline}
                        onChange={(e) => {
                          const updated = [...earlyBirdTiers];
                          updated[index].deadline = e.target.value;
                          setEarlyBirdTiers(updated);
                        }}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-gold-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-white/60 mb-1">Discount Type</label>
                      <select
                        value={tier.discount_type}
                        onChange={(e) => {
                          const updated = [...earlyBirdTiers];
                          updated[index].discount_type = e.target.value as 'percentage' | 'fixed';
                          setEarlyBirdTiers(updated);
                        }}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-gold-500 focus:outline-none"
                      >
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed Amount ($)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-white/60 mb-1">
                        Discount {tier.discount_type === 'percentage' ? '(%)' : '($)'}
                      </label>
                      <input
                        type="number"
                        value={tier.discount || ''}
                        onChange={(e) => {
                          const updated = [...earlyBirdTiers];
                          updated[index].discount = parseFloat(e.target.value) || 0;
                          setEarlyBirdTiers(updated);
                        }}
                        min={0}
                        max={tier.discount_type === 'percentage' ? 100 : formData.entry_fee}
                        step={tier.discount_type === 'percentage' ? 1 : 0.01}
                        placeholder={tier.discount_type === 'percentage' ? '20' : '10.00'}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/30 focus:border-gold-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {tier.deadline && tier.discount > 0 && (
                    <div className="mt-2 p-2 bg-gold-500/10 border border-gold-500/20 rounded text-xs text-gold-400">
                      Price with this tier: ${
                        tier.discount_type === 'percentage'
                          ? (formData.entry_fee! * (1 - tier.discount / 100)).toFixed(2)
                          : Math.max(0, formData.entry_fee! - tier.discount).toFixed(2)
                      }
                      {' '}(save ${
                        tier.discount_type === 'percentage'
                          ? (formData.entry_fee! * (tier.discount / 100)).toFixed(2)
                          : tier.discount.toFixed(2)
                      })
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

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

        {/* Warning about participants */}
        {tournament && tournament.current_participants > 0 && (
          <div className="p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-xl text-yellow-400 text-sm">
            ⚠️ This tournament has {tournament.current_participants} registered participant{tournament.current_participants > 1 ? 's' : ''}.
            Significant changes may affect their plans. Consider notifying them.
          </div>
        )}

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
                Updating...
              </>
            ) : (
              <>
                <Trophy className="w-5 h-5" />
                Save Changes
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate(`/tournament/${id}`)}
            className="px-6 py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors"
          >
            Cancel
          </button>
        </div>
      </motion.form>
    </div>
  );
};

export default EditTournament;
