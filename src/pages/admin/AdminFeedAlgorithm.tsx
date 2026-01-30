import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Sliders, AlertCircle, CheckCircle } from 'lucide-react';
import apiClient from '../../api/client';

interface AlgorithmSettings {
  weights?: {
    value: {
      likes: number;
      comments: number;
      recency: number;
      engagement: number;
    };
    updated_at: string;
    updated_by: number;
  };
  boost_factors?: {
    value: {
      tournament_posts: number;
      pgn_posts: number;
      image_posts: number;
      verified_users: number;
    };
    updated_at: string;
    updated_by: number;
  };
  time_decay?: {
    value: {
      half_life_hours: number;
      enabled: boolean;
    };
    updated_at: string;
    updated_by: number;
  };
  filters?: {
    value: {
      min_content_length: number;
      hide_deleted: boolean;
      hide_flagged: boolean;
    };
    updated_at: string;
    updated_by: number;
  };
}

export default function AdminFeedAlgorithm() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<AlgorithmSettings>({});
  const [saveSuccess, setSaveSuccess] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/feed-algorithm/settings');
      setSettings(response.data.data);
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError('You need admin privileges to access algorithm settings.');
      } else if (err.response?.status === 404) {
        setError('Feed algorithm settings not initialized. Please contact system administrator.');
      } else {
        setError(err.response?.data?.message || 'Failed to load settings');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSetting = async (key: string, value: any) => {
    try {
      setError('');
      setSaveSuccess('');
      await apiClient.put(`/feed-algorithm/settings/${key}`, { value });
      setSaveSuccess(`${key} updated successfully!`);
      setTimeout(() => setSaveSuccess(''), 3000);
      loadSettings(); // Reload to get updated timestamps
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError('You need admin privileges to update algorithm settings.');
      } else {
        setError(err.response?.data?.message || `Failed to update ${key}`);
      }
    }
  };

  const handleWeightChange = (field: string, value: number) => {
    if (!settings.weights) return;
    const newWeights = {
      ...settings.weights.value,
      [field]: value
    };
    setSettings({
      ...settings,
      weights: {
        ...settings.weights,
        value: newWeights
      }
    });
  };

  const handleBoostChange = (field: string, value: number) => {
    if (!settings.boost_factors) return;
    const newBoosts = {
      ...settings.boost_factors.value,
      [field]: value
    };
    setSettings({
      ...settings,
      boost_factors: {
        ...settings.boost_factors,
        value: newBoosts
      }
    });
  };

  const handleTimeDecayChange = (field: string, value: number | boolean) => {
    if (!settings.time_decay) return;
    const newTimeDecay = {
      ...settings.time_decay.value,
      [field]: value
    };
    setSettings({
      ...settings,
      time_decay: {
        ...settings.time_decay,
        value: newTimeDecay
      }
    });
  };

  const handleFilterChange = (field: string, value: number | boolean) => {
    if (!settings.filters) return;
    const newFilters = {
      ...settings.filters.value,
      [field]: value
    };
    setSettings({
      ...settings,
      filters: {
        ...settings.filters,
        value: newFilters
      }
    });
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="text-white/50">Loading algorithm settings...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !settings.weights) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/30 rounded-xl p-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-400" />
              <h2 className="text-xl font-bold text-white">Error Loading Settings</h2>
            </div>
            <p className="text-red-400">{error}</p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
              <Sliders className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Feed Algorithm</h1>
              <p className="text-white/60">Configure ranking and filtering settings</p>
            </div>
          </div>
        </motion.div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-2 text-red-400">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {saveSuccess && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex items-center gap-2 text-green-400">
            <CheckCircle className="w-5 h-5" />
            {saveSuccess}
          </div>
        )}

        {/* Weights */}
        {settings.weights && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Ranking Weights</h2>
              <button
                onClick={() => handleUpdateSetting('weights', settings.weights!.value)}
                className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-chess-darker font-semibold rounded-lg hover:bg-gold-400 transition-colors"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(settings.weights.value).map(([key, value]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-white/70 mb-2 capitalize">
                    {key.replace('_', ' ')}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={value}
                    onChange={(e) => handleWeightChange(key, parseFloat(e.target.value))}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-gold-500"
                  />
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Boost Factors */}
        {settings.boost_factors && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Boost Factors</h2>
              <button
                onClick={() => handleUpdateSetting('boost_factors', settings.boost_factors!.value)}
                className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-chess-darker font-semibold rounded-lg hover:bg-gold-400 transition-colors"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(settings.boost_factors.value).map(([key, value]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-white/70 mb-2 capitalize">
                    {key.replace('_', ' ')}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={value}
                    onChange={(e) => handleBoostChange(key, parseFloat(e.target.value))}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-gold-500"
                  />
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Time Decay */}
        {settings.time_decay && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Time Decay</h2>
              <button
                onClick={() => handleUpdateSetting('time_decay', settings.time_decay!.value)}
                className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-chess-darker font-semibold rounded-lg hover:bg-gold-400 transition-colors"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Half-life (hours)
                </label>
                <input
                  type="number"
                  value={settings.time_decay.value.half_life_hours}
                  onChange={(e) => handleTimeDecayChange('half_life_hours', parseFloat(e.target.value))}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-gold-500"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.time_decay.value.enabled}
                  onChange={(e) => handleTimeDecayChange('enabled', e.target.checked)}
                  className="w-5 h-5 rounded bg-white/5 border-white/10"
                />
                <label className="text-sm font-medium text-white/70">
                  Enable time decay
                </label>
              </div>
            </div>
          </motion.div>
        )}

        {/* Filters */}
        {settings.filters && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Content Filters</h2>
              <button
                onClick={() => handleUpdateSetting('filters', settings.filters!.value)}
                className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-chess-darker font-semibold rounded-lg hover:bg-gold-400 transition-colors"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Minimum content length
                </label>
                <input
                  type="number"
                  value={settings.filters.value.min_content_length}
                  onChange={(e) => handleFilterChange('min_content_length', parseInt(e.target.value))}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-gold-500"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.filters.value.hide_deleted}
                  onChange={(e) => handleFilterChange('hide_deleted', e.target.checked)}
                  className="w-5 h-5 rounded bg-white/5 border-white/10"
                />
                <label className="text-sm font-medium text-white/70">
                  Hide deleted posts
                </label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.filters.value.hide_flagged}
                  onChange={(e) => handleFilterChange('hide_flagged', e.target.checked)}
                  className="w-5 h-5 rounded bg-white/5 border-white/10"
                />
                <label className="text-sm font-medium text-white/70">
                  Hide flagged posts
                </label>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
