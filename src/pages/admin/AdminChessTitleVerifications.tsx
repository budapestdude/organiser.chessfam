import { useState, useEffect } from 'react';
import { Check, X, Eye, Award, ExternalLink } from 'lucide-react';
import * as adminApi from '../../api/admin';

interface ChessTitleVerification {
  id: number;
  user_id: number;
  status: 'pending' | 'approved' | 'rejected' | 'revoked';
  claimed_title: string;
  fide_id?: string;
  certificate_image: string;
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: number;
  rejection_reason?: string;
  admin_notes?: string;
  user_email?: string;
  user_name?: string;
  current_chess_title?: string;
  current_title_verified?: boolean;
}

export default function AdminChessTitleVerifications() {
  const [verifications, setVerifications] = useState<ChessTitleVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVerification, setSelectedVerification] = useState<ChessTitleVerification | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [imageZoomed, setImageZoomed] = useState(false);

  useEffect(() => {
    fetchVerifications();
  }, []);

  const fetchVerifications = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getPendingChessTitleVerifications({ limit: 100 });
      setVerifications(response.data.verifications || []);
    } catch (error) {
      console.error('Error fetching chess title verifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewDetails = async (verification: ChessTitleVerification) => {
    try {
      const response = await adminApi.getChessTitleVerificationDetails(verification.id);
      setSelectedVerification(response.data);
      setShowModal(true);
      setRejectionReason('');
      setAdminNotes('');
    } catch (error) {
      console.error('Error fetching verification details:', error);
      alert('Failed to load verification details');
    }
  };

  const handleApprove = async () => {
    if (!selectedVerification) return;
    if (!confirm(`Approve ${selectedVerification.claimed_title} title for ${selectedVerification.user_name}?`)) return;

    try {
      setProcessingId(selectedVerification.id);
      await adminApi.approveChessTitleVerification(selectedVerification.id, adminNotes || undefined);
      setVerifications(prev => prev.filter(v => v.id !== selectedVerification.id));
      setShowModal(false);
      setSelectedVerification(null);
      alert('Chess title verified successfully! User will receive an email notification.');
    } catch (error: any) {
      console.error('Error approving verification:', error);
      alert(error.response?.data?.error || 'Failed to approve verification');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!selectedVerification) return;
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    if (!confirm(`Reject ${selectedVerification.claimed_title} title verification for ${selectedVerification.user_name}?`)) return;

    try {
      setProcessingId(selectedVerification.id);
      await adminApi.rejectChessTitleVerification(
        selectedVerification.id,
        rejectionReason,
        adminNotes || undefined
      );
      setVerifications(prev => prev.filter(v => v.id !== selectedVerification.id));
      setShowModal(false);
      setSelectedVerification(null);
      alert('Verification rejected. User will receive an email with the reason.');
    } catch (error: any) {
      console.error('Error rejecting verification:', error);
      alert(error.response?.data?.error || 'Failed to reject verification');
    } finally {
      setProcessingId(null);
    }
  };

  const getTitleColor = (title: string) => {
    const colors: Record<string, string> = {
      GM: 'bg-yellow-500 text-black',
      IM: 'bg-orange-500 text-white',
      FM: 'bg-blue-500 text-white',
      CM: 'bg-green-500 text-white',
      WGM: 'bg-yellow-500 text-black',
      WIM: 'bg-orange-500 text-white',
      WFM: 'bg-blue-500 text-white',
      WCM: 'bg-green-500 text-white',
    };
    return colors[title] || 'bg-gray-500 text-white';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-white"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Award className="w-8 h-8 text-yellow-500" />
          <h1 className="text-2xl font-bold text-white">Chess Title Verifications</h1>
        </div>
        <p className="text-white/60">Review and verify FIDE chess titles</p>
      </div>

      {verifications.length === 0 ? (
        <div className="text-center py-12 bg-white/5 rounded-lg">
          <Check className="w-10 h-10 text-green-500 mx-auto mb-3" />
          <p className="text-white/60">No pending chess title verifications</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {verifications.map((verification) => (
            <div
              key={verification.id}
              className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`px-3 py-1 ${getTitleColor(verification.claimed_title)} rounded-lg font-bold text-sm`}>
                      {verification.claimed_title}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{verification.user_name}</h3>
                      <p className="text-sm text-white/60">{verification.user_email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                    <div>
                      <span className="text-white/50">Claimed Title:</span>
                      <p className="text-white font-medium">{verification.claimed_title}</p>
                    </div>
                    <div>
                      <span className="text-white/50">FIDE ID:</span>
                      <p className="text-white font-mono">{verification.fide_id || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="text-white/50">Current Title:</span>
                      <p className="text-white">{verification.current_chess_title || 'None'}</p>
                    </div>
                    <div>
                      <span className="text-white/50">Submitted:</span>
                      <p className="text-white">{new Date(verification.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => viewDetails(verification)}
                  className="ml-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center gap-2 transition"
                >
                  <Eye className="w-4 h-4" />
                  Review
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {showModal && selectedVerification && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`px-3 py-1.5 ${getTitleColor(selectedVerification.claimed_title)} rounded-lg font-bold`}>
                  {selectedVerification.claimed_title}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedVerification.user_name}</h2>
                  <p className="text-white/60">{selectedVerification.user_email}</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-white/60 hover:text-white p-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-white/60 mb-1">Claimed Title</label>
                  <div className={`inline-block px-3 py-1 ${getTitleColor(selectedVerification.claimed_title)} rounded font-bold`}>
                    {selectedVerification.claimed_title}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-white/60 mb-1">FIDE ID</label>
                  <div className="flex items-center gap-2">
                    <p className="text-white font-mono">{selectedVerification.fide_id || 'Not provided'}</p>
                    {selectedVerification.fide_id && (
                      <a
                        href={`https://ratings.fide.com/profile/${selectedVerification.fide_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-sm"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View on FIDE
                      </a>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-white/60 mb-1">Current Title</label>
                  <p className="text-white">{selectedVerification.current_chess_title || 'None'}</p>
                </div>

                <div>
                  <label className="block text-sm text-white/60 mb-1">Submission Date</label>
                  <p className="text-white">{new Date(selectedVerification.created_at).toLocaleString()}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-2">FIDE Title Certificate</label>
                <div className="relative">
                  <img
                    src={selectedVerification.certificate_image}
                    alt="Title Certificate"
                    className={`w-full rounded-lg border border-white/20 cursor-pointer hover:border-white/40 transition ${
                      imageZoomed ? 'fixed inset-0 m-auto max-w-6xl max-h-screen z-50 object-contain' : ''
                    }`}
                    onClick={() => setImageZoomed(!imageZoomed)}
                  />
                  {imageZoomed && (
                    <div
                      className="fixed inset-0 bg-black/90 z-40"
                      onClick={() => setImageZoomed(false)}
                    />
                  )}
                </div>
                <p className="text-xs text-white/40 mt-2">Click image to zoom</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm text-white/60 mb-2">
                  Rejection Reason (required if rejecting)
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g., Certificate image is unclear, FIDE ID does not match certificate, Title does not match claimed title..."
                  className="w-full px-4 py-2 bg-black border border-white/20 rounded-lg text-white placeholder-white/30 focus:border-white/40 outline-none resize-none"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-2">
                  Admin Notes (internal, optional)
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Internal notes about this verification..."
                  className="w-full px-4 py-2 bg-black border border-white/20 rounded-lg text-white placeholder-white/30 focus:border-white/40 outline-none resize-none"
                  rows={2}
                />
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-400">
                <strong>Verification Tips:</strong> Check that the certificate shows the user's full name, the correct title, and the FIDE logo. If FIDE ID is provided, verify it matches the certificate. Ensure the image is clear and unaltered.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition"
                disabled={processingId === selectedVerification.id}
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                disabled={processingId === selectedVerification.id}
              >
                {processingId === selectedVerification.id ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <X className="w-5 h-5" />
                    Reject
                  </>
                )}
              </button>
              <button
                onClick={handleApprove}
                className="flex-1 px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                disabled={processingId === selectedVerification.id}
              >
                {processingId === selectedVerification.id ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Approve & Verify
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
