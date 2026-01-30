import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, DollarSign, Check, AlertCircle } from 'lucide-react';
import { useStore } from '../store';
import { authorSubscriptionsApi } from '../api/authorSubscriptions';

const AuthorPricingSetup = () => {
  const navigate = useNavigate();
  const { user } = useStore();
  const [loading, setLoading] = useState(false);
  const [existingPricing, setExistingPricing] = useState<any>(null);
  const [loadingPricing, setLoadingPricing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    monthlyPriceCents: 500, // €5/month default
    annualPriceCents: 5000, // €50/year default
    defaultPreviewPercent: 30,
  });

  useEffect(() => {
    if (user) {
      loadExistingPricing();
    }
  }, [user]);

  const loadExistingPricing = async () => {
    try {
      const response = await authorSubscriptionsApi.getPricing(user!.id);
      setExistingPricing(response.data);
      if (response.data) {
        setFormData({
          monthlyPriceCents: response.data.monthlyPriceCents || 500,
          annualPriceCents: response.data.annualPriceCents || 5000,
          defaultPreviewPercent: response.data.defaultPreviewPercent || 30,
        });
      }
    } catch (error) {
      // No pricing setup yet, that's okay
      console.log('No existing pricing found');
    } finally {
      setLoadingPricing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      await authorSubscriptionsApi.setupPricing(formData);
      setSuccess(true);
      // Reload pricing
      await loadExistingPricing();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to setup pricing');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    navigate('/');
    return null;
  }

  const monthlyPrice = (formData.monthlyPriceCents / 100).toFixed(2);
  const annualMonthlyEquivalent = ((formData.annualPriceCents / 12) / 100).toFixed(2);
  const annualSavings = ((formData.monthlyPriceCents * 12 - formData.annualPriceCents) / 100).toFixed(2);

  return (
    <div className="min-h-screen py-8 px-4 md:px-8 max-w-4xl mx-auto">
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-white/60 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-display font-bold text-white mb-2">Author Subscription Pricing</h1>
        <p className="text-white/60">
          Set up your Substack-style subscription pricing. Readers will subscribe to YOU and get access to all your paid content.
        </p>
      </motion.div>

      {loadingPricing ? (
        <div className="bg-white/5 rounded-2xl p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500 mx-auto"></div>
          <p className="text-white/60 mt-4">Loading your pricing...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Success Message */}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-500/20 border border-green-500/30 rounded-xl p-4 flex items-start gap-3"
            >
              <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-green-400 font-semibold">Pricing saved successfully!</p>
                <p className="text-green-300/80 text-sm">
                  Your subscription pricing is now live. You can start marking blogs as paid content.
                </p>
              </div>
            </motion.div>
          )}

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-400 font-semibold">Error</p>
                <p className="text-red-300/80 text-sm">{error}</p>
              </div>
            </motion.div>
          )}

          {/* Pricing Setup */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 space-y-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-gold-400" />
              Subscription Pricing
            </h2>

            {/* Monthly Price */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Monthly Subscription Price (€)
              </label>
              <input
                type="number"
                min="1"
                max="1000"
                step="0.01"
                value={(formData.monthlyPriceCents / 100).toFixed(2)}
                onChange={(e) => setFormData({ ...formData, monthlyPriceCents: Math.round(parseFloat(e.target.value) * 100) })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-gold-500 focus:outline-none"
                required
              />
              <p className="text-xs text-white/50 mt-1">
                Readers will pay €{monthlyPrice}/month for access to all your paid content
              </p>
            </div>

            {/* Annual Price */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Annual Subscription Price (€)
              </label>
              <input
                type="number"
                min="1"
                max="10000"
                step="0.01"
                value={(formData.annualPriceCents / 100).toFixed(2)}
                onChange={(e) => setFormData({ ...formData, annualPriceCents: Math.round(parseFloat(e.target.value) * 100) })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-gold-500 focus:outline-none"
                required
              />
              <p className="text-xs text-white/50 mt-1">
                €{annualMonthlyEquivalent}/month equivalent • Saves €{annualSavings} vs monthly
              </p>
            </div>

            {/* Default Preview */}
            <div className="border-t border-white/10 pt-6">
              <label className="block text-sm font-medium text-white/70 mb-2">
                Default Preview Amount: {formData.defaultPreviewPercent}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="10"
                value={formData.defaultPreviewPercent}
                onChange={(e) => setFormData({ ...formData, defaultPreviewPercent: parseInt(e.target.value) })}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-white/40 mt-1">
                <span>No preview</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>Full</span>
              </div>
              <p className="text-xs text-white/50 mt-2">
                This will be the default preview percentage for your paid blogs (you can customize per-blog)
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-8 py-4 bg-gold-500 hover:bg-gold-600 text-chess-darker font-bold text-lg rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : existingPricing ? 'Update Pricing' : 'Enable Paid Subscriptions'}
          </button>

          {/* Info Box */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
            <p className="text-blue-400 text-sm">
              <strong>Note:</strong> When you save this pricing, Stripe products and prices will be created automatically.
              Once enabled, you can start marking your blogs as paid content in the blog editor.
            </p>
          </div>
        </form>
      )}
    </div>
  );
};

export default AuthorPricingSetup;
