import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Settings, DollarSign, Check, AlertCircle } from 'lucide-react';
import { useStore } from '../../store';
import * as adminApi from '../../api/admin';

export default function PlatformSettings() {
  const navigate = useNavigate();
  const { user } = useStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [discountSettings, setDiscountSettings] = useState({
    discountPercent: 20,
    enabled: true,
  });

  useEffect(() => {
    if (!user?.is_admin) {
      navigate('/');
      return;
    }
    fetchSettings();
  }, [user, navigate]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getPremiumDiscountSettings();
      setDiscountSettings(response.data.data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);

    try {
      await adminApi.updatePremiumDiscountSettings(
        discountSettings.discountPercent,
        discountSettings.enabled
      );
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 md:px-8 max-w-4xl mx-auto">
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => navigate('/admin/dashboard')}
        className="flex items-center gap-2 text-white/60 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Dashboard
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-display font-bold text-white mb-2 flex items-center gap-3">
          <Settings className="w-10 h-10 text-gold-400" />
          Platform Settings
        </h1>
        <p className="text-white/60">Configure site-wide platform settings</p>
      </motion.div>

      {loading ? (
        <div className="bg-white/5 rounded-2xl p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500 mx-auto"></div>
          <p className="text-white/60 mt-4">Loading settings...</p>
        </div>
      ) : (
        <form onSubmit={handleSave}>
          {/* Success Message */}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-500/20 border border-green-500/30 rounded-xl p-4 flex items-start gap-3 mb-6"
            >
              <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-green-400 font-semibold">Settings saved successfully!</p>
                <p className="text-green-300/80 text-sm">
                  Changes will apply to all new author subscriptions.
                </p>
              </div>
            </motion.div>
          )}

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 flex items-start gap-3 mb-6"
            >
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-400 font-semibold">Error</p>
                <p className="text-red-300/80 text-sm">{error}</p>
              </div>
            </motion.div>
          )}

          {/* Premium Discount Settings */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <DollarSign className="w-6 h-6 text-gold-400" />
              <h2 className="text-2xl font-bold text-white">Author Subscription Discounts</h2>
            </div>

            <p className="text-white/60 text-sm">
              Configure site-wide discounts for platform premium members on author subscriptions.
              This discount applies to all authors automatically.
            </p>

            {/* Enable/Disable Toggle */}
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
              <div>
                <label className="text-white font-medium">Enable Premium Member Discounts</label>
                <p className="text-white/50 text-sm mt-1">
                  When enabled, premium members get discounted rates on author subscriptions
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setDiscountSettings({ ...discountSettings, enabled: !discountSettings.enabled })
                }
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                  discountSettings.enabled ? 'bg-gold-500' : 'bg-white/20'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    discountSettings.enabled ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Discount Percentage */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Discount Percentage: {discountSettings.discountPercent}%
              </label>
              <input
                type="range"
                min="0"
                max="50"
                step="5"
                value={discountSettings.discountPercent}
                onChange={(e) =>
                  setDiscountSettings({ ...discountSettings, discountPercent: parseInt(e.target.value) })
                }
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                disabled={!discountSettings.enabled}
              />
              <div className="flex justify-between text-xs text-white/40 mt-1">
                <span>0%</span>
                <span>10%</span>
                <span>20%</span>
                <span>30%</span>
                <span>40%</span>
                <span>50%</span>
              </div>
              <p className="text-xs text-white/50 mt-2">
                Premium members will receive this discount on both monthly and annual author subscriptions
              </p>
            </div>

            {/* Preview */}
            {discountSettings.enabled && discountSettings.discountPercent > 0 && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <p className="text-blue-400 text-sm font-semibold mb-2">Example Pricing:</p>
                <div className="space-y-1 text-sm text-white/70">
                  <p>• €10/month subscription → Premium members pay €{(10 * (1 - discountSettings.discountPercent / 100)).toFixed(2)}/month</p>
                  <p>• €100/year subscription → Premium members pay €{(100 * (1 - discountSettings.discountPercent / 100)).toFixed(2)}/year</p>
                </div>
              </div>
            )}
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={saving}
            className="w-full px-8 py-4 bg-gold-500 hover:bg-gold-600 text-chess-darker font-bold text-lg rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>

          {/* Info Box */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 mt-6">
            <p className="text-white/60 text-sm">
              <strong>Note:</strong> These settings apply platform-wide to all author subscriptions.
              When authors set up their pricing, the premium discount is automatically applied based on these settings.
            </p>
          </div>
        </form>
      )}
    </div>
  );
}
