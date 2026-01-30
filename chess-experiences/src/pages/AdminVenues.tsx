import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Building2, Check, X, MapPin, Mail, Phone, Globe, Calendar } from 'lucide-react';
import { useStore } from '../store';
import { venuesApi } from '../api/venues';

export default function AdminVenues() {
  const navigate = useNavigate();
  const { user } = useStore();
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [selectedVenue, setSelectedVenue] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user?.is_admin) {
      navigate('/');
      return;
    }
    fetchVenues();
  }, [filter, user, navigate]);

  const fetchVenues = async () => {
    try {
      setLoading(true);
      const statusFilter = filter === 'all' ? undefined : filter;
      const response = await venuesApi.getAllVenueSubmissions(statusFilter);
      setVenues(response.data || []);
    } catch (error) {
      console.error('Error fetching venues:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (venueId: number, status: string) => {
    if (status === 'rejected' && !adminNotes.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    setSubmitting(true);
    try {
      await venuesApi.updateVenueStatus(venueId, status, adminNotes);
      setSelectedVenue(null);
      setAdminNotes('');
      await fetchVenues();
    } catch (error: any) {
      console.error('Error updating venue status:', error);
      alert(error.response?.data?.message || 'Failed to update venue status');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-400 bg-green-500/20';
      case 'rejected':
        return 'text-red-400 bg-red-500/20';
      default:
        return 'text-yellow-400 bg-yellow-500/20';
    }
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
        <h1 className="text-4xl font-display font-bold text-white mb-2">Venue Submissions</h1>
        <p className="text-white/60">Review and manage venue submissions</p>
      </motion.div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-all capitalize
                      ${filter === status
                        ? 'bg-gold-500 text-chess-darker'
                        : 'bg-white/5 text-white/70 hover:bg-white/10'
                      }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Venue List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-white/50">Loading submissions...</div>
        </div>
      ) : venues.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 text-white/30 mx-auto mb-4" />
          <p className="text-white/50">No {filter !== 'all' && filter} submissions found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {venues.map((venue) => (
            <motion.div
              key={venue.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 rounded-2xl border border-white/10 p-6 hover:bg-white/10 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-1">{venue.venue_name}</h3>
                  <p className="text-sm text-gold-400 capitalize">{venue.venue_type.replace('_', ' ')}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(venue.status)}`}>
                  {venue.status}
                </span>
              </div>

              <div className="space-y-2 mb-4 text-sm">
                <div className="flex items-center gap-2 text-white/70">
                  <MapPin className="w-4 h-4" />
                  <span>{venue.address}, {venue.city}, {venue.country}</span>
                </div>
                <div className="flex items-center gap-2 text-white/70">
                  <Mail className="w-4 h-4" />
                  <span>{venue.email}</span>
                </div>
                {venue.phone && (
                  <div className="flex items-center gap-2 text-white/70">
                    <Phone className="w-4 h-4" />
                    <span>{venue.phone}</span>
                  </div>
                )}
                {venue.website && (
                  <div className="flex items-center gap-2 text-white/70">
                    <Globe className="w-4 h-4" />
                    <a href={venue.website} target="_blank" rel="noopener noreferrer" className="text-gold-400 hover:underline">
                      Visit Website
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-2 text-white/70">
                  <Calendar className="w-4 h-4" />
                  <span>Submitted {new Date(venue.created_at).toLocaleDateString()}</span>
                </div>
                {venue.submitter_name && (
                  <div className="flex items-center gap-2 text-white/70">
                    <span className="font-medium">Submitted by: {venue.submitter_name}</span>
                  </div>
                )}
              </div>

              {venue.description && (
                <p className="text-sm text-white/60 mb-4 line-clamp-3">{venue.description}</p>
              )}

              {venue.amenities && venue.amenities.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-white/50 mb-2">Amenities:</p>
                  <div className="flex flex-wrap gap-1">
                    {venue.amenities.map((amenity: string, index: number) => (
                      <span key={index} className="px-2 py-1 bg-white/5 rounded text-xs text-white/60">
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {venue.admin_notes && (
                <div className="bg-white/5 rounded-lg p-3 mb-4">
                  <p className="text-xs text-white/50 mb-1">Admin Notes:</p>
                  <p className="text-sm text-white/70">{venue.admin_notes}</p>
                </div>
              )}

              {venue.status === 'pending' && (
                <div className="flex gap-2 pt-4 border-t border-white/10">
                  <button
                    onClick={() => setSelectedVenue(venue)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-all border border-green-500/30"
                  >
                    <Check className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      setSelectedVenue(venue);
                      setAdminNotes('');
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all border border-red-500/30"
                  >
                    <X className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Approval/Rejection Modal */}
      {selectedVenue && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-chess-darker border border-white/10 rounded-2xl p-6 max-w-md w-full"
          >
            <h2 className="text-2xl font-bold text-white mb-4">
              {selectedVenue.status === 'pending' ? 'Review Venue' : 'Update Status'}
            </h2>
            <p className="text-white/70 mb-4">
              {selectedVenue.venue_name}
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm text-white/70 mb-2">Admin Notes (required for rejection)</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white
                           placeholder:text-white/30 focus:outline-none focus:border-gold-500/50 resize-none"
                  placeholder="Add notes about this submission..."
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleStatusUpdate(selectedVenue.id, 'approved')}
                disabled={submitting}
                className="flex-1 py-3 bg-green-500/20 text-green-400 font-semibold rounded-lg hover:bg-green-500/30 transition-all border border-green-500/30 disabled:opacity-50"
              >
                <Check className="w-4 h-4 inline mr-2" />
                Approve
              </button>
              <button
                onClick={() => handleStatusUpdate(selectedVenue.id, 'rejected')}
                disabled={submitting || !adminNotes.trim()}
                className="flex-1 py-3 bg-red-500/20 text-red-400 font-semibold rounded-lg hover:bg-red-500/30 transition-all border border-red-500/30 disabled:opacity-50"
              >
                <X className="w-4 h-4 inline mr-2" />
                Reject
              </button>
            </div>
            <button
              onClick={() => {
                setSelectedVenue(null);
                setAdminNotes('');
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
