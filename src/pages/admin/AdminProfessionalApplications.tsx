import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Check,
  X,
  Loader2,
  Users,
  Award,
  Camera,
  Video,
  Mic,
  Code,
  Pen,
  BarChart3,
  Laptop,
  PenTool,
  Film,
  ExternalLink,
  MapPin,
  Globe
} from 'lucide-react';
import { useStore } from '../../store';
import { professionalsApi } from '../../api/professionals';

interface Application {
  id: number;
  user_id: number;
  professional_type: string;
  name: string;
  bio?: string;
  profile_image?: string;
  type_specific_data: any;
  verification_documents?: string[];
  portfolio_urls?: string[];
  experience_years?: number;
  specialties?: string[];
  languages?: string[];
  proposed_services?: any[];
  country?: string;
  city?: string;
  remote_available: boolean;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_email?: string;
}

const TYPE_ICONS: Record<string, any> = {
  coach: Award,
  arbiter: Award,
  photographer: Camera,
  videographer: Video,
  analyst: BarChart3,
  commentator: Mic,
  influencer: Users,
  writer: Pen,
  dgt_operator: Laptop,
  programmer: Code,
  editor: PenTool,
  designer: PenTool,
  producer: Film
};

export default function AdminProfessionalApplications() {
  const navigate = useNavigate();
  const { user } = useStore();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');

  useEffect(() => {
    if (!user?.is_admin) {
      navigate('/');
      return;
    }
    fetchApplications();
  }, [user, navigate, page, statusFilter]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await professionalsApi.getPendingApplications({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        page,
        limit: 20
      });
      setApplications(response.data?.applications || response.data?.data || []);
      setTotal(response.data?.total || 0);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (applicationId: number) => {
    if (!confirm('Approve this application? The user will become a verified professional.')) {
      return;
    }

    setSubmitting(true);
    try {
      await professionalsApi.approveApplication(applicationId);
      setSelectedApplication(null);
      await fetchApplications();
      alert('Application approved successfully');
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
      await professionalsApi.rejectApplication(applicationId, rejectionReason);
      setSelectedApplication(null);
      setRejectionReason('');
      await fetchApplications();
      alert('Application rejected');
    } catch (error: any) {
      console.error('Error rejecting application:', error);
      alert(error.response?.data?.message || 'Failed to reject application');
    } finally {
      setSubmitting(false);
    }
  };

  const getTypeLabel = (type: string): string => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const TypeIcon = selectedApplication ? TYPE_ICONS[selectedApplication.professional_type] || Users : Users;

  return (
    <div className="p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-display font-bold text-white mb-2">Professional Applications</h1>
        <p className="text-white/60">Review and manage professional applications</p>
      </motion.div>

      {/* Status Filter */}
      <div className="flex gap-2 mb-6">
        {(['pending', 'approved', 'rejected', 'all'] as const).map((status) => (
          <button
            key={status}
            onClick={() => {
              setStatusFilter(status);
              setPage(1);
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
              statusFilter === status
                ? 'bg-gold-500 text-chess-darker'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Applications Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 border border-white/10 rounded-xl overflow-hidden"
      >
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
          </div>
        ) : applications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Users className="w-12 h-12 text-white/20 mb-4" />
            <p className="text-white/60">No applications found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Applicant</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Type</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Experience</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Location</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {applications.map((app) => {
                  const Icon = TYPE_ICONS[app.professional_type] || Users;
                  return (
                    <tr key={app.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white/40">
                            {app.name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-white font-medium">{app.name}</div>
                            <div className="text-white/40 text-sm">{app.user_email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-gold-400" />
                          <span className="text-white/80">{getTypeLabel(app.professional_type)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-white/80">
                          {app.experience_years ? `${app.experience_years} years` : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-white/80 text-sm">
                          {app.city && app.country ? `${app.city}, ${app.country}` : '-'}
                          {app.remote_available && (
                            <div className="flex items-center gap-1 text-green-400 text-xs mt-1">
                              <Globe className="w-3 h-3" />
                              Remote
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          app.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                          app.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedApplication(app)}
                          className="text-gold-400 hover:text-gold-300 transition-colors"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && applications.length > 0 && (
          <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between">
            <div className="text-white/60 text-sm">
              Showing {applications.length} of {total} applications
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={applications.length < 20}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Application Detail Modal */}
      {selectedApplication && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedApplication(null)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-chess-darker border border-white/10 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-chess-darker border-b border-white/10 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gold-500/20 rounded-lg flex items-center justify-center">
                  <TypeIcon className="w-6 h-6 text-gold-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedApplication.name}</h2>
                  <p className="text-white/60 text-sm">{getTypeLabel(selectedApplication.professional_type)}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedApplication(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Bio */}
              {selectedApplication.bio && (
                <div>
                  <h3 className="text-sm font-semibold text-white/70 mb-2">Bio</h3>
                  <p className="text-white/90">{selectedApplication.bio}</p>
                </div>
              )}

              {/* Experience & Location */}
              <div className="grid md:grid-cols-2 gap-4">
                {selectedApplication.experience_years && (
                  <div>
                    <h3 className="text-sm font-semibold text-white/70 mb-2">Experience</h3>
                    <p className="text-white/90">{selectedApplication.experience_years} years</p>
                  </div>
                )}
                {(selectedApplication.city || selectedApplication.country) && (
                  <div>
                    <h3 className="text-sm font-semibold text-white/70 mb-2">Location</h3>
                    <div className="flex items-center gap-2 text-white/90">
                      <MapPin className="w-4 h-4" />
                      {selectedApplication.city && selectedApplication.country && (
                        `${selectedApplication.city}, ${selectedApplication.country}`
                      )}
                    </div>
                    {selectedApplication.remote_available && (
                      <div className="flex items-center gap-2 text-green-400 text-sm mt-1">
                        <Globe className="w-4 h-4" />
                        Remote available
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Languages */}
              {selectedApplication.languages && selectedApplication.languages.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-white/70 mb-2">Languages</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedApplication.languages.map((lang, i) => (
                      <span key={i} className="px-3 py-1 bg-white/10 text-white/90 rounded-lg text-sm">
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Specialties */}
              {selectedApplication.specialties && selectedApplication.specialties.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-white/70 mb-2">Specialties</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedApplication.specialties.map((spec, i) => (
                      <span key={i} className="px-3 py-1 bg-white/10 text-white/90 rounded-lg text-sm">
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Proposed Services */}
              {selectedApplication.proposed_services && selectedApplication.proposed_services.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-white/70 mb-2">Proposed Services</h3>
                  <div className="space-y-3">
                    {selectedApplication.proposed_services.map((service: any, i: number) => (
                      <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-4">
                        <div className="font-medium text-white mb-1">{service.service_name}</div>
                        {service.service_description && (
                          <p className="text-white/60 text-sm mb-2">{service.service_description}</p>
                        )}
                        <div className="text-gold-400 text-sm">
                          {service.base_price ? `$${service.base_price}` : 'Custom quote'} - {service.pricing_model}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Portfolio URLs */}
              {selectedApplication.portfolio_urls && selectedApplication.portfolio_urls.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-white/70 mb-2">Portfolio</h3>
                  <div className="space-y-2">
                    {selectedApplication.portfolio_urls.map((url: string, i: number) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-gold-400 hover:text-gold-300 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        {url}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin Actions */}
              {selectedApplication.status === 'pending' && (
                <div className="pt-6 border-t border-white/10 space-y-4">
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApprove(selectedApplication.id)}
                      disabled={submitting}
                      className="flex-1 px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-5 h-5" />
                          Approve
                        </>
                      )}
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm text-white/70 mb-2">Rejection Reason</label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Explain why this application is being rejected..."
                      rows={3}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-gold-500 focus:outline-none resize-none"
                    />
                    <button
                      onClick={() => handleReject(selectedApplication.id)}
                      disabled={submitting || !rejectionReason.trim()}
                      className="w-full mt-3 px-6 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <X className="w-5 h-5" />
                          Reject Application
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Rejection Reason Display */}
              {selectedApplication.status === 'rejected' && selectedApplication.rejection_reason && (
                <div className="pt-6 border-t border-white/10">
                  <h3 className="text-sm font-semibold text-white/70 mb-2">Rejection Reason</h3>
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                    <p className="text-red-400">{selectedApplication.rejection_reason}</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
