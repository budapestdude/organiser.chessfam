import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, X, Building2, Users, Trophy, MessageCircle, Copy, RefreshCw, Loader2, ChevronDown } from 'lucide-react';
import { useStore } from '../store';
import { ownershipApi, type OwnershipClaim, type UnclaimedEntity, type EntityType } from '../api/ownership';

const entityTypeLabels: Record<EntityType, string> = {
  venue: 'Venue',
  club: 'Club',
  tournament: 'Tournament',
  community: 'Community'
};

const entityTypeIcons: Record<EntityType, typeof Building2> = {
  venue: Building2,
  club: Users,
  tournament: Trophy,
  community: MessageCircle
};

export default function AdminOwnership() {
  const navigate = useNavigate();
  const { user } = useStore();
  const [activeTab, setActiveTab] = useState<'claims' | 'unclaimed'>('claims');
  const [claims, setClaims] = useState<OwnershipClaim[]>([]);
  const [unclaimed, setUnclaimed] = useState<UnclaimedEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState<OwnershipClaim | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filterType, setFilterType] = useState<EntityType | 'all'>('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.is_admin) {
      navigate('/');
      return;
    }
    fetchData();
  }, [user, navigate, activeTab, filterType]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const typeFilter = filterType === 'all' ? undefined : filterType;

      if (activeTab === 'claims') {
        const data = await ownershipApi.getPendingClaims(typeFilter);
        setClaims(data);
      } else {
        const data = await ownershipApi.getUnclaimedEntities(typeFilter);
        setUnclaimed(data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewClaim = async (approved: boolean) => {
    if (!selectedClaim) return;

    setSubmitting(true);
    try {
      await ownershipApi.reviewClaimRequest(selectedClaim.id, approved, reviewNotes);
      setSelectedClaim(null);
      setReviewNotes('');
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to review claim');
    } finally {
      setSubmitting(false);
    }
  };

  const copyClaimCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const regenerateCode = async (entity: UnclaimedEntity) => {
    try {
      const result = await ownershipApi.regenerateClaimCode(entity.type, entity.id);
      setUnclaimed(prev => prev.map(e =>
        e.type === entity.type && e.id === entity.id
          ? { ...e, claim_code: result.claimCode }
          : e
      ));
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to regenerate code');
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 md:px-8 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-3xl font-display font-bold text-white">Ownership Management</h1>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('claims')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'claims'
              ? 'bg-gold-500 text-chess-darker'
              : 'bg-white/5 text-white/70 hover:bg-white/10'
          }`}
        >
          Pending Claims
          {claims.length > 0 && activeTab !== 'claims' && (
            <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
              {claims.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('unclaimed')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'unclaimed'
              ? 'bg-gold-500 text-chess-darker'
              : 'bg-white/5 text-white/70 hover:bg-white/10'
          }`}
        >
          Unclaimed Entities
        </button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as EntityType | 'all')}
            className="appearance-none bg-white/5 border border-white/10 rounded-lg px-4 py-2 pr-10 text-white focus:outline-none focus:border-gold-500"
          >
            <option value="all">All Types</option>
            <option value="venue">Venues</option>
            <option value="club">Clubs</option>
            <option value="tournament">Tournaments</option>
            <option value="community">Communities</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
        </div>
        <button
          onClick={fetchData}
          className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
        >
          <RefreshCw className="w-5 h-5 text-white/70" />
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
        </div>
      ) : activeTab === 'claims' ? (
        /* Claims List */
        claims.length === 0 ? (
          <div className="bg-white/5 rounded-xl p-12 text-center">
            <Check className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <p className="text-white/70">No pending claims to review</p>
          </div>
        ) : (
          <div className="space-y-4">
            {claims.map((claim) => {
              const Icon = entityTypeIcons[claim.entity_type];
              return (
                <motion.div
                  key={claim.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/5 rounded-xl p-6 border border-white/10"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-gold-500/20 rounded-lg">
                        <Icon className="w-6 h-6 text-gold-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-white/50 uppercase">
                            {entityTypeLabels[claim.entity_type]}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-1">
                          {claim.entity_name || `ID: ${claim.entity_id}`}
                        </h3>
                        <p className="text-white/60 text-sm mb-2">
                          Claimed by: <span className="text-white">{claim.claimer_name}</span>
                        </p>
                        <p className="text-white/70 text-sm">{claim.claim_reason}</p>
                        <p className="text-white/40 text-xs mt-2">
                          Submitted: {new Date(claim.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedClaim(claim)}
                      className="px-4 py-2 bg-gold-500 text-chess-darker rounded-lg font-medium hover:bg-gold-400 transition-colors"
                    >
                      Review
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )
      ) : (
        /* Unclaimed List */
        unclaimed.length === 0 ? (
          <div className="bg-white/5 rounded-xl p-12 text-center">
            <Building2 className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/70">No unclaimed entities</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {unclaimed.map((entity) => {
              const Icon = entityTypeIcons[entity.type];
              return (
                <motion.div
                  key={`${entity.type}-${entity.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/5 rounded-xl p-5 border border-white/10"
                >
                  <div className="flex items-start gap-3 mb-4">
                    <div className="p-2 bg-white/10 rounded-lg">
                      <Icon className="w-5 h-5 text-white/70" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-white/50 uppercase">
                        {entityTypeLabels[entity.type]}
                      </span>
                      <h3 className="text-white font-medium truncate">{entity.name}</h3>
                    </div>
                  </div>

                  {entity.claim_code && (
                    <div className="bg-white/5 rounded-lg p-3 mb-3">
                      <p className="text-xs text-white/50 mb-1">Claim Code:</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-gold-400 font-mono text-sm truncate">
                          {entity.claim_code}
                        </code>
                        <button
                          onClick={() => copyClaimCode(entity.claim_code!)}
                          className="p-1.5 bg-white/10 rounded hover:bg-white/20 transition-colors"
                          title="Copy code"
                        >
                          {copiedCode === entity.claim_code ? (
                            <Check className="w-4 h-4 text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4 text-white/70" />
                          )}
                        </button>
                        <button
                          onClick={() => regenerateCode(entity)}
                          className="p-1.5 bg-white/10 rounded hover:bg-white/20 transition-colors"
                          title="Regenerate code"
                        >
                          <RefreshCw className="w-4 h-4 text-white/70" />
                        </button>
                      </div>
                    </div>
                  )}

                  <p className="text-white/40 text-xs">
                    Created: {new Date(entity.created_at).toLocaleDateString()}
                  </p>
                </motion.div>
              );
            })}
          </div>
        )
      )}

      {/* Review Modal */}
      <AnimatePresence>
        {selectedClaim && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedClaim(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-chess-dark rounded-xl p-6 max-w-lg w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-white mb-4">Review Claim</h2>

              <div className="bg-white/5 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-white/50">Entity</p>
                    <p className="text-white">{selectedClaim.entity_name || `${entityTypeLabels[selectedClaim.entity_type]} #${selectedClaim.entity_id}`}</p>
                  </div>
                  <div>
                    <p className="text-white/50">Claimed By</p>
                    <p className="text-white">{selectedClaim.claimer_name}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-white/50 text-sm">Reason</p>
                  <p className="text-white">{selectedClaim.claim_reason}</p>
                </div>
                {selectedClaim.verification_info && (
                  <div className="mt-4">
                    <p className="text-white/50 text-sm">Verification Info</p>
                    <pre className="text-white/70 text-xs bg-white/5 rounded p-2 mt-1 overflow-auto">
                      {JSON.stringify(selectedClaim.verification_info, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Review Notes (optional)
                </label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add notes about your decision..."
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-gold-500 resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleReviewClaim(true)}
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 disabled:opacity-50 transition-colors"
                >
                  <Check className="w-5 h-5" />
                  Approve
                </button>
                <button
                  onClick={() => handleReviewClaim(false)}
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 disabled:opacity-50 transition-colors"
                >
                  <X className="w-5 h-5" />
                  Reject
                </button>
              </div>

              <button
                onClick={() => setSelectedClaim(null)}
                className="w-full mt-3 px-4 py-2 text-white/70 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
