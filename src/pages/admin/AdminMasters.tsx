import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Star, Pencil, Trash2, Search, X } from 'lucide-react';
import { useStore } from '../../store';
import * as adminApi from '../../api/admin';

export default function AdminMasters() {
  const navigate = useNavigate();
  const { user } = useStore();
  const [masters, setMasters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMaster, setSelectedMaster] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user?.is_admin) {
      navigate('/');
      return;
    }
    fetchMasters();
  }, [user, navigate]);

  const fetchMasters = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getAllMastersAdmin({ limit: 100, search: searchTerm });
      console.log('Masters API response:', response.data);
      setMasters(response.data.data.masters || []);
    } catch (error: any) {
      console.error('Error fetching masters:', error);
      console.error('Error response:', error.response?.data);
      alert(`Failed to fetch masters: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (master: any) => {
    setSelectedMaster(master);
    setEditForm({
      name: master.name || '',
      title: master.title || '',
      rating: master.rating || 0,
      hourly_rate: master.hourly_rate || 0,
      bio: master.bio || '',
      specialties: master.specialties || [],
      languages: master.languages || [],
      is_active: master.is_active ?? true,
      status: master.status || 'approved',
      premium_discount_eligible: master.premium_discount_eligible || false,
    });
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!selectedMaster) return;
    setSubmitting(true);
    try {
      await adminApi.updateMasterAdmin(selectedMaster.id, editForm);
      setShowEditModal(false);
      await fetchMasters();
      alert('Master updated successfully');
    } catch (error: any) {
      console.error('Error updating master:', error);
      alert(error.response?.data?.message || 'Failed to update master');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (masterId: number, masterName: string) => {
    if (!confirm(`Are you sure you want to delete "${masterName}"? This action cannot be undone.`)) {
      return;
    }
    try {
      await adminApi.deleteMasterAdmin(masterId);
      await fetchMasters();
      alert('Master deleted successfully');
    } catch (error: any) {
      console.error('Error deleting master:', error);
      alert(error.response?.data?.message || 'Failed to delete master');
    }
  };

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
        <h1 className="text-4xl font-display font-bold text-white mb-2">Manage Masters</h1>
        <p className="text-white/60">Edit or delete any master</p>
      </motion.div>

      <div className="mb-6 flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && fetchMasters()}
            placeholder="Search masters..."
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white
                     placeholder:text-white/30 focus:outline-none focus:border-gold-500/50"
          />
        </div>
        <button
          onClick={fetchMasters}
          className="px-6 py-3 bg-gold-500 text-chess-darker font-semibold rounded-lg
                   hover:bg-gold-400 transition-all"
        >
          Search
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-white/50">Loading masters...</div>
        </div>
      ) : masters.length === 0 ? (
        <div className="text-center py-12">
          <Star className="w-16 h-16 text-white/30 mx-auto mb-4" />
          <p className="text-white/50">No masters found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {masters.map((master) => (
            <motion.div
              key={master.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 rounded-xl border border-white/10 p-4 hover:bg-white/10 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">{master.name}</h3>
                  <p className="text-sm text-white/60">{master.title} • {master.rating}</p>
                  {master.user_name && (
                    <p className="text-xs text-white/50 mt-1">User: {master.user_name}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(master)}
                    className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-all"
                    title="Edit master"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(master.id, master.name)}
                    className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all"
                    title="Delete master"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="text-sm space-y-1">
                <p className="text-white/70">Hourly Rate: ${master.hourly_rate}/hr</p>
                {master.specialties && master.specialties.length > 0 && (
                  <p className="text-white/70">Specialties: {master.specialties.join(', ')}</p>
                )}
                <p className="text-white/70">
                  Status: <span className={`capitalize ${
                    master.status === 'approved' ? 'text-green-400' :
                    master.status === 'pending' ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {master.status}
                  </span>
                </p>
                <p className="text-white/70">
                  Active: <span className={master.is_active ? 'text-green-400' : 'text-red-400'}>
                    {master.is_active ? 'Yes' : 'No'}
                  </span>
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showEditModal && selectedMaster && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-chess-darker border border-white/10 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Edit Master</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-white/70 mb-2">Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white
                             focus:outline-none focus:border-gold-500/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-white/70 mb-2">Title</label>
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      placeholder="e.g. GM, IM, FM"
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white
                               focus:outline-none focus:border-gold-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-2">Rating</label>
                    <input
                      type="number"
                      value={editForm.rating}
                      onChange={(e) => setEditForm({ ...editForm, rating: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white
                               focus:outline-none focus:border-gold-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-white/70 mb-2">Hourly Rate ($)</label>
                  <input
                    type="number"
                    value={editForm.hourly_rate}
                    onChange={(e) => setEditForm({ ...editForm, hourly_rate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white
                             focus:outline-none focus:border-gold-500/50"
                  />
                </div>

                <div>
                  <label className="block text-sm text-white/70 mb-2">Bio</label>
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white
                             focus:outline-none focus:border-gold-500/50 resize-none"
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

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={editForm.is_active}
                    onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="is_active" className="text-sm text-white/70">Master is active</label>
                </div>

                <div className="border-t border-white/10 pt-4 mt-4">
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
                        Premium members will receive 10% off the hourly rate for this master's challenges
                      </p>
                    </div>
                  </label>
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
      </AnimatePresence>
    </div>
  );
}
