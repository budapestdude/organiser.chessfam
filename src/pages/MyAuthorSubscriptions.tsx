import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Calendar, DollarSign, XCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { useStore } from '../store';
import { authorSubscriptionsApi, type AuthorSubscription } from '../api/authorSubscriptions';

const MyAuthorSubscriptions = () => {
  const navigate = useNavigate();
  const { user } = useStore();
  const [subscriptions, setSubscriptions] = useState<AuthorSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      loadSubscriptions();
    }
  }, [user]);

  const loadSubscriptions = async () => {
    try {
      const response = await authorSubscriptionsApi.getMySubscriptions();
      setSubscriptions(response.data);
    } catch (error) {
      console.error('Failed to load subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (subscriptionId: number, authorName: string) => {
    if (!confirm(`Cancel your subscription to ${authorName}? You'll keep access until the end of your billing period.`)) {
      return;
    }

    try {
      setActionLoading(subscriptionId);
      await authorSubscriptionsApi.cancelSubscription(subscriptionId);
      await loadSubscriptions();
      alert('Subscription canceled successfully');
    } catch (error: any) {
      console.error('Failed to cancel subscription:', error);
      alert(error.response?.data?.message || 'Failed to cancel subscription');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReactivate = async (subscriptionId: number, authorName: string) => {
    if (!confirm(`Reactivate your subscription to ${authorName}?`)) {
      return;
    }

    try {
      setActionLoading(subscriptionId);
      await authorSubscriptionsApi.reactivateSubscription(subscriptionId);
      await loadSubscriptions();
      alert('Subscription reactivated successfully');
    } catch (error: any) {
      console.error('Failed to reactivate subscription:', error);
      alert(error.response?.data?.message || 'Failed to reactivate subscription');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatPrice = (cents: number) => {
    return `€${(cents / 100).toFixed(2)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'canceled':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'past_due':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-white/10 text-white/60 border-white/20';
    }
  };

  if (!user) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen py-8 px-4 md:px-8 max-w-6xl mx-auto">
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
        <h1 className="text-4xl font-display font-bold text-white mb-2 flex items-center gap-3">
          <Users className="w-10 h-10 text-gold-400" />
          My Author Subscriptions
        </h1>
        <p className="text-white/60">
          Manage your subscriptions to content creators
        </p>
      </motion.div>

      {loading ? (
        <div className="bg-white/5 rounded-2xl p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500 mx-auto"></div>
          <p className="text-white/60 mt-4">Loading your subscriptions...</p>
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="bg-white/5 rounded-2xl p-12 text-center">
          <Users className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No Active Subscriptions</h3>
          <p className="text-white/60 mb-6">
            You haven't subscribed to any authors yet. Browse blogs to find creators you'd like to support!
          </p>
          <button
            onClick={() => navigate('/blogs')}
            className="px-6 py-3 bg-gold-500 hover:bg-gold-600 text-chess-darker font-semibold rounded-lg transition-colors"
          >
            Browse Blogs
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {subscriptions.map((subscription) => (
            <motion.div
              key={subscription.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Subscription Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-white">
                      {subscription.author_name || `Author #${subscription.authorId}`}
                    </h3>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(subscription.status)}`}>
                      {subscription.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-white/70">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-white/40" />
                      <span>{subscription.tier === 'monthly' ? 'Monthly' : 'Annual'} Plan</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-white/40" />
                      <span>{formatPrice(subscription.amount)}</span>
                    </div>
                    {subscription.currentPeriodEnd && (
                      <div className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 text-white/40" />
                        <span>Renews {formatDate(subscription.currentPeriodEnd)}</span>
                      </div>
                    )}
                  </div>

                  {subscription.cancelAtPeriodEnd && (
                    <div className="mt-2 text-sm text-yellow-400 flex items-center gap-2">
                      <XCircle className="w-4 h-4" />
                      <span>Cancels at period end • Access until {formatDate(subscription.currentPeriodEnd)}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  {subscription.status === 'active' && !subscription.cancelAtPeriodEnd && (
                    <button
                      onClick={() => handleCancel(subscription.id, subscription.author_name || `Author #${subscription.authorId}`)}
                      disabled={actionLoading === subscription.id}
                      className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionLoading === subscription.id ? 'Processing...' : 'Cancel Subscription'}
                    </button>
                  )}

                  {subscription.cancelAtPeriodEnd && (
                    <button
                      onClick={() => handleReactivate(subscription.id, subscription.author_name || `Author #${subscription.authorId}`)}
                      disabled={actionLoading === subscription.id}
                      className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-all text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {actionLoading === subscription.id ? 'Processing...' : 'Reactivate'}
                    </button>
                  )}

                  <button
                    onClick={() => navigate(`/blogs?author=${subscription.authorId}`)}
                    className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-all text-sm font-medium"
                  >
                    View Content
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Help Info */}
      <div className="mt-8 bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
        <h3 className="text-white font-semibold mb-2">About Author Subscriptions</h3>
        <ul className="text-blue-300/80 text-sm space-y-2">
          <li>• Subscribing to an author gives you access to ALL their paid content</li>
          <li>• You'll automatically get access to new paid content they publish</li>
          <li>• Cancel anytime - you'll keep access until the end of your billing period</li>
          <li>• Support independent chess content creators directly</li>
        </ul>
      </div>
    </div>
  );
};

export default MyAuthorSubscriptions;
