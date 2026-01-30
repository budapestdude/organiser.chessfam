import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Building2, Check, X, MapPin, Mail, Phone, Globe, Calendar, Pencil, Trash2, Search } from 'lucide-react';
import { useStore } from '../store';
import { venuesApi } from '../api/venues';
import * as adminApi from '../api/admin';

export default function AdminVenues() {
  const navigate = useNavigate();
  const { user } = useStore();
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedVenue, setSelectedVenue] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

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
      console.log('Fetching venues with filter:', filter, 'statusFilter:', statusFilter);
      const response = await adminApi.getAllVenues({ limit: 100, search: searchTerm, status: statusFilter });
      console.log('Venues API response:', response.data);
      console.log('Venues array:', response.data.data.venues);
      console.log('Venues count:', response.data.data.venues?.length);
      setVenues(response.data.data.venues || []);
    } catch (error: any) {
      console.error('Error fetching venues:', error);
      console.error('Error response:', error.response?.data);
      alert(`Failed to fetch venues: ${error.response?.data?.error || error.message}`);
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

  const openEditModal = (venue: any) => {
    setSelectedVenue(venue);
    setEditForm({
      name: venue.name || '',
      description: venue.description || '',
      address: venue.address || '',
      city: venue.city || '',
      country: venue.country || '',
      venue_type: venue.venue_type || '',
      capacity: venue.capacity || 0,
      status: venue.status || 'approved',
    });
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!selectedVenue) return;
    setSubmitting(true);
    try {
      await adminApi.updateVenue(selectedVenue.id, editForm);
      setShowEditModal(false);
      await fetchVenues();
      alert('Venue updated successfully');
    } catch (error: any) {
      console.error('Error updating venue:', error);
      alert(error.response?.data?.message || 'Failed to update venue');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (venueId: number, venueName: string) => {
    if (!confirm(`Are you sure you want to delete "${venueName}"? This action cannot be undone.`)) {
      return;
    }
    try {
      await adminApi.deleteVenue(venueId);
      await fetchVenues();
      alert('Venue deleted successfully');
    } catch (error: any) {
      console.error('Error deleting venue:', error);
      alert(error.response?.data?.message || 'Failed to delete venue');
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
        <h1 className="text-4xl font-display font-bold text-white mb-2">Manage Venues</h1>
        <p className="text-white/60">View, edit, or delete any venue</p>
      </motion.div>

      {/* Search */}
      <div className="mb-6 flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && fetchVenues()}
            placeholder="Search venues..."
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white
                     placeholder:text-white/30 focus:outline-none focus:border-gold-500/50"
          />
        </div>
        <button
          onClick={fetchVenues}
          className="px-6 py-3 bg-gold-500 text-chess-darker font-semibold rounded-lg
                   hover:bg-gold-400 transition-all"
        >
          Search
        </button>
      </div>

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
                {venue.owner_name && (
                  <div className="flex items-center gap-2 text-white/70">
                    <span className="font-medium">Owner: {venue.owner_name}</span>
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

              <div className="flex gap-2 pt-4 border-t border-white/10">
                {venue.status === 'pending' && (
                  <>
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
                  </>
                )}
                <button
                  onClick={() => openEditModal(venue)}
                  className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-all border border-blue-500/30 flex items-center gap-2"
                  title="Edit venue"
                >
                  <Pencil className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(venue.id, venue.name)}
                  className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all border border-red-500/30 flex items-center gap-2"
                  title="Delete venue"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
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

      {/* Edit Modal */}
      {showEditModal && selectedVenue && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-chess-darker border border-white/10 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Edit Venue</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/70 mb-2">Venue Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white
                           focus:outline-none focus:border-gold-500/50"
                />
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-2">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white
                           focus:outline-none focus:border-gold-500/50 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/70 mb-2">City</label>
                  <input
                    type="text"
                    value={editForm.city}
                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white
                             focus:outline-none focus:border-gold-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-2">Country</label>
                  <input
                    type="text"
                    value={editForm.country}
                    onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white
                             focus:outline-none focus:border-gold-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-2">Address</label>
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white
                           focus:outline-none focus:border-gold-500/50"
                />
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-2">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white
                           focus:outline-none focus:border-gold-500/50"
                >
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleUpdate}
                disabled={submitting}
                className="flex-1 py-3 bg-gold-500 text-chess-darker font-semibold rounded-lg
                         hover:bg-gold-400 transition-all disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="px-6 py-3 bg-white/5 text-white/70 font-semibold rounded-lg
                         hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
