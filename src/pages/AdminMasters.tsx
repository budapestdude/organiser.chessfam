import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Crown, Check, X, Trophy, Calendar, ExternalLink, Loader2, Users, ShieldOff } from 'lucide-react';
import { useStore } from '../store';
import { mastersApi, type MasterApplication } from '../api/masters';
import * as adminApi from '../api/admin';

interface ApplicationWithUser extends MasterApplication {
  user_name?: string;
  user_email?: string;
  user_avatar?: string;
}

interface Master {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  chess_title?: string;
  chess_title_verified?: boolean;
  rating: number;
  is_master: boolean;
  created_at: string;
}

type TabType = 'applications' | 'masters';

export default function AdminMasters() {
  const navigate = useNavigate();
  const { user } = useStore();
  const [activeTab, setActiveTab] = useState<TabType>('applications');
  const [applications, setApplications] = useState<ApplicationWithUser[]>([]);
  const [masters, setMasters] = useState<Master[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<ApplicationWithUser | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [total, setTotal] = useState(0);
  const [mastersTotal, setMastersTotal] = useState(0);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!user?.is_admin) {
      navigate('/');
      return;
    }
    if (activeTab === 'applications') {
      fetchApplications();
    } else {
      fetchMasters();
    }
  }, [user, navigate, page, activeTab]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await mastersApi.getPendingApplications(page, 20);
      setApplications(response.data?.applications || []);
      setTotal(response.data?.total || 0);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMasters = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getAllMasters({ page, limit: 20 });
      setMasters(response.data?.users || []);
      setMastersTotal(response.data?.pagination?.total || 0);
    } catch (error) {
      console.error('Error fetching masters:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeMaster = async (masterId: number, masterName: string) => {
    if (!confirm(`Revoke master status from ${masterName}? This action cannot be undone.`)) {
      return;
    }

    setSubmitting(true);
    try {
      await adminApi.updateUser(masterId, { is_master: false });
      await fetchMasters();
      alert('Master status revoked successfully');
    } catch (error: any) {
      console.error('Error revoking master status:', error);
      alert(error.response?.data?.error || 'Failed to revoke master status');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (applicationId: number) => {
    setSubmitting(true);
    try {
      await mastersApi.approveApplication(applicationId);
      setSelectedApplication(null);
      await fetchApplications();
    } catch (error: any) {
      console.error('Error approving application:', error);
      alert(error.response?.data?.message || 'Failed to approve application');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (applicationId: number) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    setSubmitting(true);
    try {
      await mastersApi.rejectApplication(applicationId, rejectionReason);
      setSelectedApplication(null);
      setRejectionReason('');
      await fetchApplications();
    } catch (error: any) {
      console.error('Error rejecting application:', error);
      alert(error.response?.data?.message || 'Failed to reject application');
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (price?: number) => {
    if (!price) return '-';
    return `$${price}/hr`;
  };

  return (
    <div className="min-h-screen py-8 px-4 md:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => navigate('/dashboard')}
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
        <h1 className="text-4xl font-display font-bold text-white mb-2">Masters Management</h1>
        <p className="text-white/60">
          Review applications and manage existing masters
        </p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-white/10">
        <button
          onClick={() => {
            setActiveTab('applications');
            setPage(1);
          }}
          className={`px-6 py-3 font-medium transition-all border-b-2 ${
            activeTab === 'applications'
              ? 'text-gold-400 border-gold-400'
              : 'text-white/60 border-transparent hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5" />
            Pending Applications
            {total > 0 && <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full text-xs">{total}</span>}
          </div>
        </button>
        <button
          onClick={() => {
            setActiveTab('masters');
            setPage(1);
          }}
          className={`px-6 py-3 font-medium transition-all border-b-2 ${
            activeTab === 'masters'
              ? 'text-gold-400 border-gold-400'
              : 'text-white/60 border-transparent hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Active Masters
            {mastersTotal > 0 && <span className="text-white/40 text-sm ml-1">({mastersTotal})</span>}
          </div>
        </button>
      </div>

      {/* Content */}
      {activeTab === 'applications' ? (
        /* Applications List */
      <>
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
        </div>
      ) : applications.length === 0 ? (
        <div className="text-center py-12">
          <Crown className="w-16 h-16 text-white/30 mx-auto mb-4" />
          <p className="text-white/50">No pending applications</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {applications.map((application) => (
            <motion.div
              key={application.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 rounded-2xl border border-white/10 p-6 hover:bg-white/10 transition-all"
            >
              {/* Header */}
              <div className="flex items-start gap-4 mb-4">
                {application.user_avatar ? (
                  <img
                    src={application.user_avatar}
                    alt={application.user_name}
                    className="w-16 h-16 rounded-xl object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center">
                    <span className="text-2xl font-bold text-chess-darker">
                      {application.user_name?.charAt(0).toUpperCase() || '?'}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white">
                    {application.user_name || 'Unknown User'}
                  </h3>
                  <p className="text-sm text-white/60">{application.user_email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 bg-gold-500/20 text-gold-400 text-sm font-bold rounded">
                      {application.title}
                    </span>
                    <span className="text-white/60 text-sm">
                      {application.current_rating} rating
                    </span>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-3 mb-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-white/50">Peak Rating</span>
                    <p className="text-white font-medium">{application.peak_rating}</p>
                  </div>
                  <div>
                    <span className="text-white/50">Experience</span>
                    <p className="text-white font-medium">
                      {application.experience_years ? `${application.experience_years} years` : 'Not specified'}
                    </p>
                  </div>
                </div>

                {/* Pricing */}
                <div>
                  <span className="text-white/50 text-sm">Pricing</span>
                  <div className="flex gap-3 mt-1">
                    <span className="px-2 py-1 bg-white/5 rounded text-xs text-white/70">
                      Bullet: {formatPrice(application.price_bullet)}
                    </span>
                    <span className="px-2 py-1 bg-white/5 rounded text-xs text-white/70">
                      Blitz: {formatPrice(application.price_blitz)}
                    </span>
                    <span className="px-2 py-1 bg-white/5 rounded text-xs text-white/70">
                      Rapid: {formatPrice(application.price_rapid)}
                    </span>
                    <span className="px-2 py-1 bg-white/5 rounded text-xs text-white/70">
                      Classical: {formatPrice(application.price_classical)}
                    </span>
                  </div>
                </div>

                {/* External Links */}
                <div className="flex gap-4 text-sm">
                  {application.fide_id && (
                    <a
                      href={`https://ratings.fide.com/profile/${application.fide_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-gold-400 hover:underline"
                    >
                      <Trophy className="w-4 h-4" />
                      FIDE Profile
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {application.lichess_username && (
                    <a
                      href={`https://lichess.org/@/${application.lichess_username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-gold-400 hover:underline"
                    >
                      Lichess
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {application.chesscom_username && (
                    <a
                      href={`https://www.chess.com/member/${application.chesscom_username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-gold-400 hover:underline"
                    >
                      Chess.com
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                {/* Specialties */}
                {application.specialties && application.specialties.length > 0 && (
                  <div>
                    <span className="text-white/50 text-sm">Specialties</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {application.specialties.map((specialty, idx) => (
                        <span key={idx} className="px-2 py-1 bg-white/5 rounded text-xs text-white/60">
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Languages */}
                {application.languages && application.languages.length > 0 && (
                  <div>
                    <span className="text-white/50 text-sm">Languages</span>
                    <p className="text-white/70 text-sm mt-1">
                      {application.languages.join(', ')}
                    </p>
                  </div>
                )}

                {/* Bio */}
                {application.bio && (
                  <div>
                    <span className="text-white/50 text-sm">Bio</span>
                    <p className="text-white/70 text-sm mt-1 line-clamp-3">{application.bio}</p>
                  </div>
                )}

                {/* Submitted Date */}
                <div className="flex items-center gap-2 text-white/50 text-sm">
                  <Calendar className="w-4 h-4" />
                  <span>Applied {new Date(application.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-white/10">
                <button
                  onClick={() => handleApprove(application.id)}
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-all border border-green-500/30 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  Approve
                </button>
                <button
                  onClick={() => {
                    setSelectedApplication(application);
                    setRejectionReason('');
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all border border-red-500/30"
                >
                  <X className="w-4 h-4" />
                  Reject
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="flex justify-center gap-2 mt-8">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-white/5 text-white/70 rounded-lg disabled:opacity-30"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-white/60">
            Page {page} of {Math.ceil(total / 20)}
          </span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page >= Math.ceil(total / 20)}
            className="px-4 py-2 bg-white/5 text-white/70 rounded-lg disabled:opacity-30"
          >
            Next
          </button>
        </div>
      )}
      </>
      ) : (
        /* Masters List */
        <>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
          </div>
        ) : masters.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-white/30 mx-auto mb-4" />
            <p className="text-white/50">No active masters found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {masters.map((master) => (
              <motion.div
                key={master.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 rounded-2xl border border-white/10 p-6 hover:bg-white/10 transition-all"
              >
                <div className="flex items-start gap-4 mb-4">
                  {master.avatar ? (
                    <img
                      src={master.avatar}
                      alt={master.name}
                      className="w-16 h-16 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center">
                      <span className="text-2xl font-bold text-chess-darker">
                        {master.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white">{master.name}</h3>
                    <p className="text-sm text-white/60">{master.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {master.chess_title && (
                        <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                          master.chess_title_verified
                            ? 'bg-gold-500/20 text-gold-400'
                            : 'bg-white/10 text-white/50'
                        }`}>
                          {master.chess_title}
                          {master.chess_title_verified && ' ✓'}
                        </span>
                      )}
                      <span className="text-white/60 text-sm">{master.rating} rating</span>
                    </div>
                  </div>
                </div>

                <div className="text-sm text-white/50 mb-4">
                  Member since {new Date(master.created_at).toLocaleDateString()}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/player/${master.id}`)}
                    className="flex-1 px-4 py-2 bg-white/5 text-white/70 rounded-lg hover:bg-white/10 transition-all text-sm"
                  >
                    View Profile
                  </button>
                  <button
                    onClick={() => handleRevokeMaster(master.id, master.name)}
                    disabled={submitting}
                    className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all border border-red-500/30 disabled:opacity-50"
                  >
                    <ShieldOff className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Masters Pagination */}
        {mastersTotal > 20 && (
          <div className="flex justify-center gap-2 mt-8">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-white/5 text-white/70 rounded-lg disabled:opacity-30"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-white/60">
              Page {page} of {Math.ceil(mastersTotal / 20)}
            </span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page >= Math.ceil(mastersTotal / 20)}
              className="px-4 py-2 bg-white/5 text-white/70 rounded-lg disabled:opacity-30"
            >
              Next
            </button>
          </div>
        )}
        </>
      )}

      {/* Rejection Modal */}
      {selectedApplication && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-chess-darker border border-white/10 rounded-2xl p-6 max-w-md w-full"
          >
            <h2 className="text-2xl font-bold text-white mb-2">Reject Application</h2>
            <p className="text-white/70 mb-4">
              {selectedApplication.user_name} - {selectedApplication.title}
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm text-white/70 mb-2">
                  Reason for rejection <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white
                           placeholder:text-white/30 focus:outline-none focus:border-gold-500/50 resize-none"
                  placeholder="Please explain why this application is being rejected..."
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleReject(selectedApplication.id)}
                disabled={submitting || !rejectionReason.trim()}
                className="flex-1 py-3 bg-red-500/20 text-red-400 font-semibold rounded-lg hover:bg-red-500/30 transition-all border border-red-500/30 disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
                ) : (
                  <X className="w-4 h-4 inline mr-2" />
                )}
                Reject Application
              </button>
            </div>
            <button
              onClick={() => {
                setSelectedApplication(null);
                setRejectionReason('');
              }}
              className="w-full mt-3 py-2 text-white/60 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
