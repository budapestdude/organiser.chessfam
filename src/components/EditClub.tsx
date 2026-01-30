import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save } from 'lucide-react';
import { clubsApi, type Club, type CreateClubInput } from '../api/clubs';

interface EditClubProps {
  club: Club;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedClub: Club) => void;
}

const EditClub = ({ club, isOpen, onClose, onUpdate }: EditClubProps) => {
  const [formData, setFormData] = useState<Partial<CreateClubInput>>({
    name: club.name,
    description: club.description || '',
    address: club.address || '',
    city: club.city || '',
    state: club.state || '',
    country: club.country || '',
    founded_year: club.founded_year || undefined,
    image: club.image || '',
    meeting_schedule: club.meeting_schedule || '',
    membership_fee: club.membership_fee || 0,
    website: club.website || '',
    contact_email: club.contact_email || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (club) {
      setFormData({
        name: club.name,
        description: club.description || '',
        address: club.address || '',
        city: club.city || '',
        state: club.state || '',
        country: club.country || '',
        founded_year: club.founded_year || undefined,
        image: club.image || '',
        meeting_schedule: club.meeting_schedule || '',
        membership_fee: club.membership_fee || 0,
        website: club.website || '',
        contact_email: club.contact_email || '',
      });
    }
  }, [club]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name) {
      setError('Club name is required');
      return;
    }

    try {
      setSaving(true);
      const response = await clubsApi.updateClub(club.id, formData);
      onUpdate(response.data.data || response.data);
      onClose();
    } catch (error: any) {
      console.error('Failed to update club:', error);
      setError(error.response?.data?.error || 'Failed to update club');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-chess-darker border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-chess-darker border-b border-white/10 px-6 py-4 flex items-center justify-between">
            <h2 className="text-2xl font-display font-bold text-white">Edit Club</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Basic Information</h3>

              <div>
                <label className="block text-sm text-white/70 mb-2">Club Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white
                           placeholder-white/30 focus:border-gold-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white
                           placeholder-white/30 focus:border-gold-500 focus:outline-none resize-none"
                  placeholder="Tell people about your club..."
                />
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-2">Club Image URL</label>
                <input
                  type="url"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white
                           placeholder-white/30 focus:border-gold-500 focus:outline-none"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Location</h3>

              <div>
                <label className="block text-sm text-white/70 mb-2">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white
                           placeholder-white/30 focus:border-gold-500 focus:outline-none"
                  placeholder="123 Main St"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/70 mb-2">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white
                             placeholder-white/30 focus:border-gold-500 focus:outline-none"
                    placeholder="New York"
                  />
                </div>

                <div>
                  <label className="block text-sm text-white/70 mb-2">State/Province</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white
                             placeholder-white/30 focus:border-gold-500 focus:outline-none"
                    placeholder="NY"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-2">Country</label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white
                           placeholder-white/30 focus:border-gold-500 focus:outline-none"
                  placeholder="USA"
                />
              </div>
            </div>

            {/* Club Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Club Details</h3>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/70 mb-2">Founded Year</label>
                  <input
                    type="number"
                    value={formData.founded_year || ''}
                    onChange={(e) => setFormData({ ...formData, founded_year: parseInt(e.target.value) || undefined })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white
                             placeholder-white/30 focus:border-gold-500 focus:outline-none"
                    placeholder="2020"
                    min="1800"
                    max={new Date().getFullYear()}
                  />
                </div>

                <div>
                  <label className="block text-sm text-white/70 mb-2">Monthly Membership Fee ($)</label>
                  <input
                    type="number"
                    value={formData.membership_fee || ''}
                    onChange={(e) => setFormData({ ...formData, membership_fee: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white
                             placeholder-white/30 focus:border-gold-500 focus:outline-none"
                    placeholder="50"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-2">Meeting Schedule</label>
                <input
                  type="text"
                  value={formData.meeting_schedule}
                  onChange={(e) => setFormData({ ...formData, meeting_schedule: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white
                           placeholder-white/30 focus:border-gold-500 focus:outline-none"
                  placeholder="Every Tuesday at 7 PM"
                />
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Contact Information</h3>

              <div>
                <label className="block text-sm text-white/70 mb-2">Website</label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white
                           placeholder-white/30 focus:border-gold-500 focus:outline-none"
                  placeholder="https://yourclub.com"
                />
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-2">Contact Email</label>
                <input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white
                           placeholder-white/30 focus:border-gold-500 focus:outline-none"
                  placeholder="contact@yourclub.com"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-white/70
                         hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-chess-darker
                         font-semibold rounded-xl hover:from-gold-400 hover:to-gold-500 transition-all
                         disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-chess-darker/30 border-t-chess-darker rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EditClub;
