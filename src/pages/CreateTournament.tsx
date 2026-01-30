import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Calendar, Clock, Users, Loader2, CheckCircle, MapPin, Repeat, Star } from 'lucide-react';
import { useStore } from '../store';
import { tournamentsApi, type CreateTournamentInput } from '../api/tournaments';
import ImageUpload from '../components/ImageUpload';
import ImageGalleryUpload from '../components/ImageGalleryUpload';
import DefaultImageSelector from '../components/DefaultImageSelector';

const TOURNAMENT_CATEGORIES = [
  {
    value: 'one-off',
    label: 'One-Off Tournament',
    description: 'A single standalone tournament',
    icon: Trophy
  },
  {
    value: 'recurring',
    label: 'Recurring Tournament',
    description: 'Tournament that repeats on a schedule',
    icon: Repeat
  },
  {
    value: 'festival',
    label: 'Festival',
    description: 'Collection of tournaments with different formats and sections',
    icon: Star
  },
];

const RECURRENCE_PATTERNS = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 Weeks' },
  { value: 'monthly', label: 'Monthly' },
];

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
  const [step, setStep] = useState<'category' | 'form'>('category');
  const [selectedCategory, setSelectedCategory] = useState<'one-off' | 'recurring' | 'festival'>('one-off');

  // Time control component state
  const [timeControl, setTimeControl] = useState({
    initial_time: '',      // in minutes
    increment: '',         // in seconds
    moves_to_time: '',     // e.g., 40 (for 40 moves in X time)
    time_after_moves: '',  // time after reaching moves (in minutes)
    increment_after: '',   // increment after reaching moves (in seconds)
  });

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
    tournament_category?: string;
    is_recurring?: boolean;
    recurrence_pattern?: string;
    recurrence_count?: number;
    is_festival?: boolean;
  }>({
    name: '',
    description: '',
    tournament_type: 'swiss',
    time_control: '',
    format: 'otb',
    start_date: '',
    end_date: '',
    registration_deadline: '',
    max_participants: 32,
    entry_fee: 0,
    prize_pool: 0,
    currency: 'USD',
    tournament_category: 'one-off',
    is_recurring: false,
    is_festival: false,
    rating_min: undefined,
    rating_max: undefined,
    rules: '',
    address: '',
    city: '',
    state: '',
    country: '',
    images: [],
  });

  // Format time control string from components
  const formatTimeControl = (): string => {
    const { initial_time, increment, moves_to_time, time_after_moves, increment_after } = timeControl;

    if (!initial_time) return '';

    // Simple format: "90+30" (90 minutes, 30 second increment)
    let timeControlStr = initial_time;
    if (increment) {
      timeControlStr += `+${increment}`;
    }

    // Complex format with time after moves: "40/90, SD/30+30"
    // (40 moves in 90 minutes, then sudden death with 30 minutes + 30 second increment)
    if (moves_to_time && time_after_moves) {
      timeControlStr = `${moves_to_time}/${initial_time}`;
      if (increment) {
        timeControlStr += `+${increment}`;
      }
      timeControlStr += `, SD/${time_after_moves}`;
      if (increment_after) {
        timeControlStr += `+${increment_after}`;
      }
    }

    return timeControlStr;
  };

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

      // Format time control from components
      const formattedTimeControl = formatTimeControl();

      // Create tournament with formatted time control and early bird pricing
      const tournamentData = {
        ...formData,
        time_control: formattedTimeControl,
        early_bird_pricing: earlyBirdTiers.length > 0 ? earlyBirdTiers : undefined,
      };

      await tournamentsApi.createTournament(tournamentData);

      // Tournament created successfully - it will be pending approval
      setSuccess(true);
      setTimeout(() => {
        navigate('/tournament/pending');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create tournament');
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (category: 'one-off' | 'recurring' | 'festival') => {
    setSelectedCategory(category);
    setFormData({
      ...formData,
      tournament_category: category,
      is_recurring: category === 'recurring',
      is_festival: category === 'festival',
    });
    setStep('form');
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

  // Category Selection Step
  if (step === 'category') {
    return (
      <div className="min-h-screen py-8 px-4 md:px-8 max-w-5xl mx-auto">
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

        {/* Category Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h2 className="text-xl font-semibold text-white mb-2">Choose Tournament Type</h2>
          <p className="text-white/60">Select the type of tournament you want to create</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {TOURNAMENT_CATEGORIES.map((category, index) => {
            const Icon = category.icon;
            return (
              <motion.button
                key={category.value}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                onClick={() => handleCategorySelect(category.value as 'one-off' | 'recurring' | 'festival')}
                className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-gold-500/50 rounded-2xl p-8 transition-all text-left"
              >
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-gold-500/20 to-gold-600/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Icon className="w-8 h-8 text-gold-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{category.label}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{category.description}</p>
              </motion.button>
            );
          })}
        </div>
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
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-white/70 mb-3">
                Cover Image
              </label>
              <div className="space-y-4">
                <DefaultImageSelector
                  type="tournament"
                  selectedImage={formData.image}
                  onSelect={(url) => setFormData({ ...formData, image: url })}
                />
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-chess-dark px-2 text-white/50">or upload your own</span>
                  </div>
                </div>
                <ImageUpload
                  helperText="JPG, PNG, GIF or WebP, max 5MB"
                  value={formData.image}
                  onChange={(url) => setFormData({ ...formData, image: url })}
                  onClear={() => setFormData({ ...formData, image: '' })}
                />
              </div>
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
            Format & Tournament Type
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
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

        {/* Time Control */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-gold-400" />
            Time Control
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/70 mb-2">Initial Time (minutes) *</label>
              <input
                type="number"
                value={timeControl.initial_time}
                onChange={(e) => setTimeControl({ ...timeControl, initial_time: e.target.value })}
                placeholder="e.g., 90"
                min={1}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-gold-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-2">Increment (seconds)</label>
              <input
                type="number"
                value={timeControl.increment}
                onChange={(e) => setTimeControl({ ...timeControl, increment: e.target.value })}
                placeholder="e.g., 30"
                min={0}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-gold-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Advanced time control (e.g., 40/90, SD/30+30) */}
          <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <label className="text-sm font-semibold text-white">Advanced Time Control</label>
              <span className="text-xs text-white/40">(Optional - for classical tournaments)</span>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-white/70 mb-2">Moves to Time Control</label>
                <input
                  type="number"
                  value={timeControl.moves_to_time}
                  onChange={(e) => setTimeControl({ ...timeControl, moves_to_time: e.target.value })}
                  placeholder="e.g., 40"
                  min={1}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-gold-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">Time After (minutes)</label>
                <input
                  type="number"
                  value={timeControl.time_after_moves}
                  onChange={(e) => setTimeControl({ ...timeControl, time_after_moves: e.target.value })}
                  placeholder="e.g., 30"
                  min={1}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-gold-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">Increment After (seconds)</label>
                <input
                  type="number"
                  value={timeControl.increment_after}
                  onChange={(e) => setTimeControl({ ...timeControl, increment_after: e.target.value })}
                  placeholder="e.g., 30"
                  min={0}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-gold-500 focus:outline-none"
                />
              </div>
            </div>
            <p className="text-xs text-white/50 mt-2">
              Example: "40 moves in 90 minutes, then 30 minutes + 30 seconds increment" = 40/90, SD/30+30
            </p>
          </div>

          {/* Preview */}
          {timeControl.initial_time && (
            <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <p className="text-sm text-blue-300">
                <strong>Time Control Preview:</strong> {formatTimeControl() || 'Enter initial time'}
              </p>
            </div>
          )}
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

        {/* Recurring Tournament Settings */}
        {selectedCategory === 'recurring' && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Repeat className="w-5 h-5 text-gold-400" />
              Recurrence Settings
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/70 mb-2">Recurrence Pattern *</label>
                <select
                  value={formData.recurrence_pattern || ''}
                  onChange={(e) => setFormData({ ...formData, recurrence_pattern: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-gold-500 focus:outline-none"
                  required
                >
                  <option value="">Select Pattern</option>
                  {RECURRENCE_PATTERNS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">Number of Occurrences</label>
                <input
                  type="number"
                  value={formData.recurrence_count || ''}
                  onChange={(e) => setFormData({ ...formData, recurrence_count: parseInt(e.target.value) || undefined })}
                  min={2}
                  max={52}
                  placeholder="e.g., 4 (leave empty for continuous)"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-gold-500 focus:outline-none"
                />
                <p className="text-xs text-white/40 mt-1">
                  Leave empty to continue indefinitely until manually stopped
                </p>
              </div>
            </div>
            <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <p className="text-sm text-blue-300">
                <strong>Note:</strong> Recurring tournaments will automatically create new instances based on your schedule.
                Each instance will be a separate tournament with the same settings.
              </p>
            </div>
          </div>
        )}

        {/* Festival Settings */}
        {selectedCategory === 'festival' && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-gold-400" />
              Festival Settings
            </h3>
            <div className="p-6 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl">
              <p className="text-white/80 mb-3">
                <strong>Festival Mode:</strong> You're creating a festival - a collection of multiple tournaments.
              </p>
              <p className="text-sm text-white/60 leading-relaxed">
                The tournament you create will serve as the main festival container.
                After creation, you'll be able to add multiple sub-tournaments with different formats,
                time controls, and sections (Open, U2000, U1600, etc.).
              </p>
            </div>
          </div>
        )}

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

        {/* Special Pricing Discounts */}
        {formData.entry_fee && formData.entry_fee > 0 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Special Group Discounts (Optional)</h3>
              <p className="text-sm text-white/50">Offer percentage discounts for specific player groups. These stack with early bird pricing.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Junior Discount */}
              <div className="bg-white/5 rounded-xl p-4 space-y-3">
                <h4 className="font-medium text-white flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Junior Players
                </h4>
                <div>
                  <label className="block text-xs text-white/60 mb-1">Discount %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.junior_discount || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      junior_discount: e.target.value ? parseFloat(e.target.value) : undefined
                    })}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-gold-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/60 mb-1">Max Age (default: 18)</label>
                  <input
                    type="number"
                    min="1"
                    max="25"
                    value={formData.junior_age_max || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      junior_age_max: e.target.value ? parseInt(e.target.value) : undefined
                    })}
                    placeholder="18"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-gold-500 focus:outline-none"
                  />
                </div>
                {formData.junior_discount && formData.junior_discount > 0 && (
                  <div className="mt-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded text-xs text-blue-400">
                    Junior price: ${(formData.entry_fee * (1 - formData.junior_discount / 100)).toFixed(2)}
                  </div>
                )}
              </div>

              {/* Senior Discount */}
              <div className="bg-white/5 rounded-xl p-4 space-y-3">
                <h4 className="font-medium text-white flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Senior Players
                </h4>
                <div>
                  <label className="block text-xs text-white/60 mb-1">Discount %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.senior_discount || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      senior_discount: e.target.value ? parseFloat(e.target.value) : undefined
                    })}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-gold-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/60 mb-1">Min Age (default: 65)</label>
                  <input
                    type="number"
                    min="50"
                    max="99"
                    value={formData.senior_age_min || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      senior_age_min: e.target.value ? parseInt(e.target.value) : undefined
                    })}
                    placeholder="65"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-gold-500 focus:outline-none"
                  />
                </div>
                {formData.senior_discount && formData.senior_discount > 0 && (
                  <div className="mt-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded text-xs text-blue-400">
                    Senior price: ${(formData.entry_fee * (1 - formData.senior_discount / 100)).toFixed(2)}
                  </div>
                )}
              </div>

              {/* Women Discount */}
              <div className="bg-white/5 rounded-xl p-4 space-y-3">
                <h4 className="font-medium text-white flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Women Players
                </h4>
                <div>
                  <label className="block text-xs text-white/60 mb-1">Discount %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.women_discount || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      women_discount: e.target.value ? parseFloat(e.target.value) : undefined
                    })}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-gold-500 focus:outline-none"
                  />
                </div>
                <p className="text-xs text-white/40 mt-2">Discount applies to all women players regardless of age</p>
                {formData.women_discount && formData.women_discount > 0 && (
                  <div className="mt-2 p-2 bg-purple-500/10 border border-purple-500/20 rounded text-xs text-purple-400">
                    Women price: ${(formData.entry_fee * (1 - formData.women_discount / 100)).toFixed(2)}
                  </div>
                )}
              </div>
            </div>

            {/* Titled Player Discounts */}
            <div>
              <h4 className="font-medium text-white mb-3">Titled Player Discounts (Optional)</h4>
              <p className="text-xs text-white/40 mb-4">Discounts for verified FIDE titled players only</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* GM/WGM Discount */}
              <div className="bg-white/5 rounded-xl p-4 space-y-3">
                <h4 className="font-medium text-white">GM / WGM</h4>
                <div>
                  <label className="block text-xs text-white/60 mb-1">Discount %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.gm_wgm_discount || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      gm_wgm_discount: e.target.value ? parseFloat(e.target.value) : undefined
                    })}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-gold-500 focus:outline-none"
                  />
                </div>
                <p className="text-xs text-white/40">Applies to verified GMs and WGMs</p>
                {formData.gm_wgm_discount && formData.gm_wgm_discount > 0 && (
                  <div className="mt-2 p-2 bg-gold-500/10 border border-gold-500/20 rounded text-xs text-gold-400">
                    GM/WGM price: ${(formData.entry_fee * (1 - formData.gm_wgm_discount / 100)).toFixed(2)}
                  </div>
                )}
              </div>

              {/* IM/WIM Discount */}
              <div className="bg-white/5 rounded-xl p-4 space-y-3">
                <h4 className="font-medium text-white">IM / WIM</h4>
                <div>
                  <label className="block text-xs text-white/60 mb-1">Discount %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.im_wim_discount || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      im_wim_discount: e.target.value ? parseFloat(e.target.value) : undefined
                    })}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-gold-500 focus:outline-none"
                  />
                </div>
                <p className="text-xs text-white/40">Applies to verified IMs and WIMs</p>
                {formData.im_wim_discount && formData.im_wim_discount > 0 && (
                  <div className="mt-2 p-2 bg-orange-500/10 border border-orange-500/20 rounded text-xs text-orange-400">
                    IM/WIM price: ${(formData.entry_fee * (1 - formData.im_wim_discount / 100)).toFixed(2)}
                  </div>
                )}
              </div>

              {/* FM/WFM Discount */}
              <div className="bg-white/5 rounded-xl p-4 space-y-3">
                <h4 className="font-medium text-white">FM / WFM</h4>
                <div>
                  <label className="block text-xs text-white/60 mb-1">Discount %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.fm_wfm_discount || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      fm_wfm_discount: e.target.value ? parseFloat(e.target.value) : undefined
                    })}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-gold-500 focus:outline-none"
                  />
                </div>
                <p className="text-xs text-white/40">Applies to verified FMs and WFMs</p>
                {formData.fm_wfm_discount && formData.fm_wfm_discount > 0 && (
                  <div className="mt-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded text-xs text-blue-400">
                    FM/WFM price: ${(formData.entry_fee * (1 - formData.fm_wfm_discount / 100)).toFixed(2)}
                  </div>
                )}
              </div>
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
