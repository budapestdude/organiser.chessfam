import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Users, Pencil, Trash2, Search, X, Check, XCircle, Clock, Upload } from 'lucide-react';
import { useStore } from '../../store';
import * as adminApi from '../../api/admin';
import { uploadsApi } from '../../api/uploads';

type TabType = 'pending' | 'all';

export default function AdminClubs() {
  const navigate = useNavigate();
  const { user } = useStore();
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [clubs, setClubs] = useState<any[]>([]);
  const [pendingClubs, setPendingClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClub, setSelectedClub] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (!user?.is_admin) {
      navigate('/');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    await Promise.all([fetchClubs(), fetchPendingClubs()]);
  };

  const fetchClubs = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getAllClubs({ limit: 100, search: searchTerm });
      setClubs(response.data.data.clubs || []);
    } catch (error: any) {
      console.error('Error fetching clubs:', error);
      alert(`Failed to fetch clubs: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingClubs = async () => {
    try {
      const response = await adminApi.getPendingClubs();
      setPendingClubs(response.data.clubs || []);
    } catch (error: any) {
      console.error('Error fetching pending clubs:', error);
    }
  };

  const handleApprove = async (clubId: number, clubName: string) => {
    if (!confirm(`Approve club "${clubName}"?`)) return;
    try {
      await adminApi.approveClub(clubId);
      await fetchData();
      alert('Club approved successfully');
    } catch (error: any) {
      console.error('Error approving club:', error);
      alert(error.response?.data?.message || 'Failed to approve club');
    }
  };

  const handleReject = async (clubId: number, clubName: string) => {
    const reason = prompt(`Reject club "${clubName}"?\n\nEnter rejection reason (optional):`);
    if (reason === null) return; // User clicked cancel
    try {
      await adminApi.rejectClub(clubId, reason || undefined);
      await fetchData();
      alert('Club rejected');
    } catch (error: any) {
      console.error('Error rejecting club:', error);
      alert(error.response?.data?.message || 'Failed to reject club');
    }
  };

  const openEditModal = (club: any) => {
    setSelectedClub(club);
    setEditForm({
      name: club.name || '',
      description: club.description || '',
      address: club.address || '',
      city: club.city || '',
      country: club.country || '',
      founded_year: club.founded_year || '',
      membership_fee: club.membership_fee || 0,
      is_active: club.is_active ?? true,
      website: club.website || '',
      contact_email: club.contact_email || '',
      premium_discount_eligible: club.premium_discount_eligible || false,
      image: club.image || '',
    });
    setImagePreview(club.image || null);
    setImageFile(null);
    setShowEditModal(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdate = async () => {
    if (!selectedClub) return;
    setSubmitting(true);
    try {
      let imageUrl = editForm.image;

      // Upload new image if selected
      if (imageFile) {
        setUploadingImage(true);
        try {
          const uploadResponse = await uploadsApi.uploadImage(imageFile);
          imageUrl = uploadResponse.url;
        } catch (uploadError: any) {
          console.error('Error uploading image:', uploadError);
          alert('Failed to upload image. Please try again.');
          setSubmitting(false);
          setUploadingImage(false);
          return;
        }
        setUploadingImage(false);
      }

      // Prepare update payload with proper null handling
      const updatePayload = {
        ...editForm,
        image: imageUrl,
        // Convert empty string to null for integer fields
        founded_year: editForm.founded_year === '' ? null : editForm.founded_year,
      };

      await adminApi.updateClub(selectedClub.id, updatePayload);
      setShowEditModal(false);
      setImageFile(null);
      setImagePreview(null);
      await fetchData();
      alert('Club updated successfully');
    } catch (error: any) {
      console.error('Error updating club:', error);
      alert(error.response?.data?.message || 'Failed to update club');
    } finally {
      setSubmitting(false);
      setUploadingImage(false);
    }
  };

  const handleDelete = async (clubId: number, clubName: string) => {
    if (!confirm(`Are you sure you want to delete "${clubName}"? This action cannot be undone.`)) {
      return;
    }
    try {
      await adminApi.deleteClub(clubId);
      await fetchData();
      alert('Club deleted successfully');
    } catch (error: any) {
      console.error('Error deleting club:', error);
      alert(error.response?.data?.message || 'Failed to delete club');
    }
  };

  const displayedClubs = activeTab === 'pending' ? pendingClubs : clubs;

  return (
    <div className="min-h-screen py-8 px-4 md:px-8 max-w-7xl mx-auto">
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => navigate('/admin/dashboard')}
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
        <h1 className="text-4xl font-display font-bold text-white mb-2">Manage Clubs</h1>
        <p className="text-white/60">Approve submissions and manage clubs</p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            activeTab === 'pending'
              ? 'bg-gold-500 text-chess-darker'
              : 'bg-white/5 text-white/70 hover:bg-white/10'
          }`}
        >
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Pending ({pendingClubs.length})
          </div>
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            activeTab === 'all'
              ? 'bg-gold-500 text-chess-darker'
              : 'bg-white/5 text-white/70 hover:bg-white/10'
          }`}
        >
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            All Clubs ({clubs.length})
          </div>
        </button>
      </div>

      {activeTab === 'all' && (
        <div className="mb-6 flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchClubs()}
              placeholder="Search clubs..."
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white
                       placeholder:text-white/30 focus:outline-none focus:border-gold-500/50"
            />
          </div>
          <button
            onClick={fetchClubs}
            className="px-6 py-3 bg-gold-500 text-chess-darker font-semibold rounded-lg
                     hover:bg-gold-400 transition-all"
          >
            Search
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-white/50">Loading clubs...</div>
        </div>
      ) : displayedClubs.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-white/30 mx-auto mb-4" />
          <p className="text-white/50">
            {activeTab === 'pending' ? 'No pending clubs' : 'No clubs found'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {displayedClubs.map((club) => (
            <motion.div
              key={club.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 rounded-xl border border-white/10 p-4 hover:bg-white/10 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">{club.name}</h3>
                  <p className="text-sm text-white/60">{club.city}, {club.country}</p>
                  {club.owner_name && (
                    <p className="text-xs text-white/50 mt-1">Owner: {club.owner_name}</p>
                  )}
                  {club.owner_email && (
                    <p className="text-xs text-white/50">Email: {club.owner_email}</p>
                  )}
                  {activeTab === 'pending' && (
                    <span className="inline-block mt-2 px-2 py-1 text-xs bg-yellow-500/20 text-yellow-400 rounded">
                      Pending Approval
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  {activeTab === 'pending' ? (
                    <>
                      <button
                        onClick={() => handleApprove(club.id, club.name)}
                        className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-all"
                        title="Approve club"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleReject(club.id, club.name)}
                        className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all"
                        title="Reject club"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => openEditModal(club)}
                        className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-all"
                        title="Edit club"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(club.id, club.name)}
                        className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all"
                        title="Delete club"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="text-sm space-y-1">
                <p className="text-white/70">Members: {club.member_count || 0}</p>
                {club.founded_year && (
                  <p className="text-white/70">Founded: {club.founded_year}</p>
                )}
                {club.membership_fee > 0 && (
                  <p className="text-white/70">Fee: ${club.membership_fee}/year</p>
                )}
                {activeTab === 'all' && (
                  <p className="text-white/70">
                    Status: <span className={club.is_active ? 'text-green-400' : 'text-gray-400'}>
                      {club.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showEditModal && selectedClub && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-chess-darker border border-white/10 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Edit Club</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-white/70 mb-2">Club Name</label>
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
                             focus:outline-none focus:border-gold-500/50"
                  />
                </div>

                <div>
                  <label className="block text-sm text-white/70 mb-2">Club Image</label>
                  {imagePreview && (
                    <div className="mb-3">
                      <img
                        src={imagePreview}
                        alt="Club preview"
                        className="w-full h-48 object-cover rounded-lg border border-white/10"
                      />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-all cursor-pointer">
                      <Upload className="w-5 h-5" />
                      <span>{imageFile ? imageFile.name : 'Choose Image'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                    {imagePreview && (
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview(null);
                          setEditForm({ ...editForm, image: '' });
                        }}
                        className="px-4 py-3 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all"
                        title="Remove image"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-white/50 mt-2">
                    Recommended: 1200x600px or 2:1 aspect ratio. Max 5MB.
                  </p>
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-white/70 mb-2">Founded Year</label>
                    <input
                      type="number"
                      value={editForm.founded_year}
                      onChange={(e) => setEditForm({ ...editForm, founded_year: parseInt(e.target.value) || '' })}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white
                               focus:outline-none focus:border-gold-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-2">Membership Fee ($)</label>
                    <input
                      type="number"
                      value={editForm.membership_fee}
                      onChange={(e) => setEditForm({ ...editForm, membership_fee: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white
                               focus:outline-none focus:border-gold-500/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-white/70 mb-2">Website</label>
                    <input
                      type="url"
                      value={editForm.website}
                      onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white
                               focus:outline-none focus:border-gold-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-2">Contact Email</label>
                    <input
                      type="email"
                      value={editForm.contact_email}
                      onChange={(e) => setEditForm({ ...editForm, contact_email: e.target.value })}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white
                               focus:outline-none focus:border-gold-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-white/70 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.is_active}
                      onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                      className="w-5 h-5"
                    />
                    <span>Active Club</span>
                  </label>
                </div>

                <div className="border-t border-white/10 pt-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.premium_discount_eligible}
                      onChange={(e) => setEditForm({ ...editForm, premium_discount_eligible: e.target.checked })}
                      className="w-5 h-5 rounded border-white/20 bg-white/5 text-gold-500
                                 focus:ring-2 focus:ring-gold-500/50 cursor-pointer"
                    />
                    <div>
                      <span className="text-white font-medium">Premium Discount Eligible</span>
                      <p className="text-xs text-white/50 mt-1">
                        Premium members will receive 10% off the membership fee for this club
                      </p>
                    </div>
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleUpdate}
                    disabled={submitting || uploadingImage}
                    className="flex-1 py-3 bg-gold-500 text-chess-darker font-semibold rounded-lg
                             hover:bg-gold-400 transition-all disabled:opacity-50"
                  >
                    {uploadingImage ? 'Uploading Image...' : submitting ? 'Updating...' : 'Update Club'}
                  </button>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="px-6 py-3 bg-white/5 text-white/70 font-semibold rounded-lg
                             hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
