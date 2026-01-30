import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { subscriptionApi, type SubscriptionStatus } from '../api/subscription';
import SubscriptionBadge from '../components/SubscriptionBadge';
import { Crown, Calendar, CreditCard, AlertCircle, CheckCircle, ExternalLink, Loader } from 'lucide-react';

export default function SubscriptionManagement() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await subscriptionApi.getStatus();
      setStatus(response.data);
    } catch (err: any) {
      console.error('Error fetching subscription status:', err);
      setError(err.response?.data?.message || 'Failed to load subscription details');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You\'ll still have access until the end of your billing period.')) {
      return;
    }

    try {
      setActionLoading(true);
      setError('');
      await subscriptionApi.cancel();
      setSuccessMessage('Subscription canceled. You\'ll have access until the end of your billing period.');
      await fetchStatus();
    } catch (err: any) {
      console.error('Error canceling subscription:', err);
      setError(err.response?.data?.message || 'Failed to cancel subscription');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivate = async () => {
    try {
      setActionLoading(true);
      setError('');
      await subscriptionApi.reactivate();
      setSuccessMessage('Subscription reactivated successfully!');
      await fetchStatus();
    } catch (err: any) {
      console.error('Error reactivating subscription:', err);
      setError(err.response?.data?.message || 'Failed to reactivate subscription');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBillingPortal = async () => {
    try {
      setActionLoading(true);
      const response = await subscriptionApi.getBillingPortal();
      if (response.success && response.data.portalUrl) {
        window.location.href = response.data.portalUrl;
      }
    } catch (err: any) {
      console.error('Error opening billing portal:', err);
      setError(err.response?.data?.message || 'Failed to open billing portal');
      setActionLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getDaysRemaining = (dateStr: string | null) => {
    if (!dateStr) return null;
    const days = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-white/60 mx-auto mb-4" />
          <p className="text-white/60">Loading subscription details...</p>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Failed to Load</h2>
          <p className="text-white/60 mb-6">{error || 'Could not load subscription details'}</p>
          <button
            onClick={() => navigate('/profile')}
            className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const trialDaysRemaining = status.inTrial && status.trialEndsAt ? getDaysRemaining(status.trialEndsAt) : null;

  return (
    <div className="min-h-screen bg-black text-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Subscription Management</h1>
          <p className="text-white/60">Manage your ChessFam subscription and billing</p>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <p className="text-green-400">{successMessage}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Current Plan */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Plan</h2>

          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                {status.tier === 'premium' && <Crown className="w-6 h-6 text-yellow-400" />}
                <h3 className="text-2xl font-bold capitalize">{status.tier}</h3>
                <SubscriptionBadge tier={status.tier} inTrial={status.inTrial} />
              </div>
              <p className="text-white/60">
                {status.tier === 'premium' ? '10% discount on tournaments, clubs & master challenges' : '10 games per month limit'}
              </p>
            </div>

            {status.tier === 'free' && (
              <button
                onClick={() => navigate('/premium')}
                className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white font-semibold rounded-lg transition flex items-center gap-2"
              >
                <Crown className="w-4 h-4" />
                Upgrade
              </button>
            )}
          </div>

          {/* Trial Info */}
          {status.inTrial && trialDaysRemaining !== null && (
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 mb-6">
              <p className="text-purple-400 font-medium">
                Your free trial ends in {trialDaysRemaining} {trialDaysRemaining === 1 ? 'day' : 'days'}
              </p>
              <p className="text-sm text-white/60 mt-1">
                Trial ends on {formatDate(status.trialEndsAt)}
              </p>
            </div>
          )}

          {/* Cancellation Warning */}
          {status.cancelAtPeriodEnd && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
              <p className="text-yellow-400 font-medium">Subscription will be canceled</p>
              <p className="text-sm text-white/60 mt-1">
                You'll have access until {formatDate(status.currentPeriodEnd)}
              </p>
            </div>
          )}

          {/* Billing Info */}
          {status.tier === 'premium' && status.currentPeriodEnd && (
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center gap-2 text-white/60 mb-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">Next Billing Date</span>
                </div>
                <p className="font-semibold">{formatDate(status.currentPeriodEnd)}</p>
              </div>

              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center gap-2 text-white/60 mb-1">
                  <CreditCard className="w-4 h-4" />
                  <span className="text-sm">Status</span>
                </div>
                <p className="font-semibold capitalize">{status.status}</p>
              </div>
            </div>
          )}
        </div>

        {/* Usage Stats */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Usage This Month</h2>

          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-white/60">Games Created</span>
              <span className="text-white">
                {status.quotaUsed} {status.quotaLimit === -1 ? '' : `/ ${status.quotaLimit}`}
              </span>
            </div>

            {status.quotaLimit !== -1 && (
              <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    status.quotaRemaining === 0
                      ? 'bg-red-500'
                      : status.quotaRemaining <= 3
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${(status.quotaUsed / status.quotaLimit) * 100}%` }}
                />
              </div>
            )}
          </div>

          {status.quotaLimit !== -1 && (
            <p className="text-sm text-white/60">
              {status.quotaRemaining > 0
                ? `${status.quotaRemaining} ${status.quotaRemaining === 1 ? 'game' : 'games'} remaining`
                : 'Monthly limit reached'}
            </p>
          )}

          {status.tier === 'free' && status.quotaRemaining === 0 && (
            <button
              onClick={() => navigate('/premium')}
              className="mt-4 w-full px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white font-semibold rounded-lg transition"
            >
              Upgrade for Unlimited Games
            </button>
          )}
        </div>

        {/* Actions */}
        {status.tier === 'premium' && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Manage Subscription</h2>

            <div className="space-y-3">
              <button
                onClick={handleBillingPortal}
                disabled={actionLoading}
                className="w-full px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Manage Payment Methods & Invoices
              </button>

              {status.cancelAtPeriodEnd ? (
                <button
                  onClick={handleReactivate}
                  disabled={actionLoading}
                  className="w-full px-4 py-2.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? 'Processing...' : 'Reactivate Subscription'}
                </button>
              ) : (
                <button
                  onClick={handleCancel}
                  disabled={actionLoading}
                  className="w-full px-4 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? 'Processing...' : 'Cancel Subscription'}
                </button>
              )}
            </div>

            <p className="text-xs text-white/40 mt-4 text-center">
              Changes will take effect at the end of your current billing period
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
