import { useState, useEffect } from 'react';
import { Check, X, Eye, User } from 'lucide-react';
import * as adminApi from '../../api/admin';

interface Verification {
  id: number;
  user_id: number;
  status: 'pending' | 'approved' | 'rejected';
  full_name: string;
  date_of_birth: string;
  country: string;
  id_type: string;
  id_number?: string;
  id_front_image: string;
  id_back_image?: string;
  selfie_image: string;
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: number;
  rejection_reason?: string;
  admin_notes?: string;
  user_name?: string;
  user_email?: string;
}

export default function AdminVerifications() {
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVerification, setSelectedVerification] = useState<Verification | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    fetchVerifications();
  }, []);

  const fetchVerifications = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getPendingVerifications({ limit: 100 });
      setVerifications(response.data.verifications || []);
    } catch (error) {
      console.error('Error fetching verifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewDetails = async (verification: Verification) => {
    try {
      const response = await adminApi.getVerificationDetails(verification.id);
      setSelectedVerification(response.data);
      setShowModal(true);
    } catch (error) {
      console.error('Error fetching verification details:', error);
      alert('Failed to load verification details');
    }
  };

  const handleApprove = async (verificationId: number, adminNotes?: string) => {
    if (!confirm('Approve this identity verification?')) return;

    try {
      setProcessingId(verificationId);
      await adminApi.approveVerification(verificationId, adminNotes);
      setVerifications(prev => prev.filter(v => v.id !== verificationId));
      setShowModal(false);
      setSelectedVerification(null);
      alert('Verification approved successfully');
    } catch (error: any) {
      console.error('Error approving verification:', error);
      alert(error.response?.data?.message || 'Failed to approve verification');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (verificationId: number, reason: string, adminNotes?: string) => {
    if (!reason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    if (!confirm('Reject this identity verification?')) return;

    try {
      setProcessingId(verificationId);
      await adminApi.rejectVerification(verificationId, reason, adminNotes);
      setVerifications(prev => prev.filter(v => v.id !== verificationId));
      setShowModal(false);
      setSelectedVerification(null);
      alert('Verification rejected');
    } catch (error: any) {
      console.error('Error rejecting verification:', error);
      alert(error.response?.data?.message || 'Failed to reject verification');
    } finally {
      setProcessingId(null);
    }
  };

  const formatIdType = (type: string) => {
    const types: Record<string, string> = {
      passport: 'Passport',
      drivers_license: "Driver's License",
      national_id: 'National ID Card',
    };
    return types[type] || type;
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
        <h1 className="text-2xl font-bold text-white mb-2">Identity Verifications</h1>
        <p className="text-white/60">Review and approve user identity verifications</p>
      </div>

      {verifications.length === 0 ? (
        <div className="text-center py-12 bg-white/5 rounded-lg">
          <Check className="w-10 h-10 text-green-500 mx-auto mb-3" />
          <p className="text-white/60">No pending verifications</p>
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
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                      <User className="text-white/60 w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{verification.full_name}</h3>
                      <p className="text-sm text-white/60">{verification.user_email || `User #${verification.user_id}`}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div>
                      <p className="text-xs text-white/40 mb-1">Country</p>
                      <p className="text-sm text-white">{verification.country}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/40 mb-1">ID Type</p>
                      <p className="text-sm text-white">{formatIdType(verification.id_type)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/40 mb-1">Date of Birth</p>
                      <p className="text-sm text-white">
                        {new Date(verification.date_of_birth).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-white/40 mb-1">Submitted</p>
                      <p className="text-sm text-white">
                        {new Date(verification.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => viewDetails(verification)}
                  className="ml-4 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg flex items-center gap-2 transition"
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
          <div className="bg-[#0a0a0a] border border-white/20 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#0a0a0a] border-b border-white/10 p-6 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Review Verification</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-white/60 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* User Info */}
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="font-semibold text-white mb-4">Personal Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-white/40 mb-1">Full Name</p>
                    <p className="text-white">{selectedVerification.full_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-white/40 mb-1">Date of Birth</p>
                    <p className="text-white">
                      {new Date(selectedVerification.date_of_birth).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-white/40 mb-1">Country</p>
                    <p className="text-white">{selectedVerification.country}</p>
                  </div>
                  <div>
                    <p className="text-sm text-white/40 mb-1">ID Type</p>
                    <p className="text-white">{formatIdType(selectedVerification.id_type)}</p>
                  </div>
                  {selectedVerification.id_number && (
                    <div>
                      <p className="text-sm text-white/40 mb-1">ID Number</p>
                      <p className="text-white">{selectedVerification.id_number}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-white/40 mb-1">User Email</p>
                    <p className="text-white">{selectedVerification.user_email || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Document Images */}
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="font-semibold text-white mb-4">Uploaded Documents</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {/* ID Front */}
                  <div>
                    <p className="text-sm text-white/60 mb-2">ID Front</p>
                    <img
                      src={selectedVerification.id_front_image}
                      alt="ID Front"
                      className="w-full rounded-lg border border-white/10 cursor-pointer hover:opacity-80"
                      onClick={() => window.open(selectedVerification.id_front_image, '_blank')}
                    />
                  </div>

                  {/* ID Back */}
                  {selectedVerification.id_back_image && (
                    <div>
                      <p className="text-sm text-white/60 mb-2">ID Back</p>
                      <img
                        src={selectedVerification.id_back_image}
                        alt="ID Back"
                        className="w-full rounded-lg border border-white/10 cursor-pointer hover:opacity-80"
                        onClick={() => window.open(selectedVerification.id_back_image!, '_blank')}
                      />
                    </div>
                  )}

                  {/* Selfie */}
                  <div className="md:col-span-2">
                    <p className="text-sm text-white/60 mb-2">Selfie with ID</p>
                    <img
                      src={selectedVerification.selfie_image}
                      alt="Selfie"
                      className="max-w-md mx-auto rounded-lg border border-white/10 cursor-pointer hover:opacity-80"
                      onClick={() => window.open(selectedVerification.selfie_image, '_blank')}
                    />
                  </div>
                </div>
                <p className="text-xs text-white/40 mt-4">Click images to open in new tab</p>
              </div>

              {/* Admin Notes */}
              <div className="bg-white/5 rounded-lg p-4">
                <label className="block text-sm font-medium text-white mb-2">
                  Admin Notes (optional)
                </label>
                <textarea
                  id="admin-notes"
                  rows={3}
                  className="w-full px-4 py-2 bg-black border border-white/20 rounded-lg text-white focus:border-white/40 outline-none resize-none"
                  placeholder="Internal notes (not visible to user)"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    const reason = prompt('Enter rejection reason (will be visible to user):');
                    if (reason) {
                      const notes = (document.getElementById('admin-notes') as HTMLTextAreaElement)?.value;
                      handleReject(selectedVerification.id, reason, notes);
                    }
                  }}
                  disabled={processingId === selectedVerification.id}
                  className="flex-1 px-6 py-3 bg-red-500/20 text-red-500 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <X className="w-5 h-5" />
                  {processingId === selectedVerification.id ? 'Processing...' : 'Reject'}
                </button>
                <button
                  onClick={() => {
                    const notes = (document.getElementById('admin-notes') as HTMLTextAreaElement)?.value;
                    handleApprove(selectedVerification.id, notes);
                  }}
                  disabled={processingId === selectedVerification.id}
                  className="flex-1 px-6 py-3 bg-green-500/20 text-green-500 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  {processingId === selectedVerification.id ? 'Processing...' : 'Approve'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
