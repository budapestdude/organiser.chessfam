import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Edit, Loader2, Trophy, Calendar, Save, X, Upload, Trash2, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { tournamentsApi } from '../../api/tournaments';
import { uploadsApi } from '../../api/uploads';

interface TournamentSeries {
  id: number;
  name: string;
  description: string;
  image: string;
  images?: string[];
  organizer_name: string;
  organizer_name_override?: string;
  edition_count: string;
  created_at: string;
}

const AdminSeries = () => {
  const navigate = useNavigate();
  const [series, setSeries] = useState<TournamentSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingSeries, setEditingSeries] = useState<TournamentSeries | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state for editing
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editImage, setEditImage] = useState('');
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editOrganizerName, setEditOrganizerName] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  useEffect(() => {
    fetchSeries();
  }, []);

  const fetchSeries = async () => {
    try {
      console.log('[AdminSeries] Fetching all tournament series...');
      const response = await tournamentsApi.getAllTournamentSeries();
      console.log('[AdminSeries] Received response:', response);
      console.log('[AdminSeries] Series count:', response.data?.length);

      setSeries(response.data || []);
      setError(null);
    } catch (error: any) {
      console.error('[AdminSeries] Error fetching series:', error);
      setError(error.message || 'Failed to load series');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (item: TournamentSeries) => {
    setEditingSeries(item);
    setEditName(item.name);
    setEditDescription(item.description || '');
    setEditImage(item.image || '');
    setEditOrganizerName(item.organizer_name_override || '');
    // Parse images - handle both string and array formats
    const images = item.images;
    if (typeof images === 'string') {
      try {
        setEditImages(JSON.parse(images));
      } catch {
        setEditImages([]);
      }
    } else if (Array.isArray(images)) {
      setEditImages(images);
    } else {
      setEditImages([]);
    }
  };

  const handleCancelEdit = () => {
    setEditingSeries(null);
    setEditName('');
    setEditDescription('');
    setEditImage('');
    setEditImages([]);
    setEditOrganizerName('');
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    setUploadingImage(true);
    try {
      console.log('[AdminSeries] Uploading cover image:', file.name);
      const response = await uploadsApi.uploadImage(file);
      console.log('[AdminSeries] Upload response:', response);

      setEditImage(response.url);
      alert('Cover image uploaded successfully!');
    } catch (error) {
      console.error('[AdminSeries] Error uploading image:', error);
      alert('Failed to upload cover image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleGalleryUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Validate files
    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not an image file`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} is too large (max 5MB)`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    setUploadingGallery(true);
    try {
      console.log('[AdminSeries] Uploading gallery images:', validFiles.length);
      const response = await uploadsApi.uploadImages(validFiles);
      console.log('[AdminSeries] Upload response:', response);

      const newUrls = response.files.map(f => f.url);
      setEditImages([...editImages, ...newUrls]);
      alert(`${newUrls.length} image(s) uploaded successfully!`);

      // Reset input
      event.target.value = '';
    } catch (error) {
      console.error('[AdminSeries] Error uploading gallery images:', error);
      alert('Failed to upload gallery images');
    } finally {
      setUploadingGallery(false);
    }
  };

  const handleDeleteGalleryImage = (index: number) => {
    if (confirm('Are you sure you want to delete this image?')) {
      setEditImages(editImages.filter((_, i) => i !== index));
    }
  };

  const handleSaveEdit = async () => {
    if (!editingSeries) return;

    setSaving(true);
    try {
      console.log('[AdminSeries] Updating series:', editingSeries.id);
      console.log('[AdminSeries] Update data:', {
        name: editName,
        description: editDescription,
        image: editImage,
        images: editImages,
        organizer_name_override: editOrganizerName
      });

      const response = await tournamentsApi.updateTournamentSeries(editingSeries.id, {
        name: editName,
        description: editDescription,
        image: editImage,
        images: editImages,
        organizer_name_override: editOrganizerName
      });

      console.log('[AdminSeries] Update response:', response);

      // Update series in local state
      setSeries(series.map(s => s.id === editingSeries.id ? { ...s, ...response.data } : s));

      handleCancelEdit();
      alert('Series updated successfully!');
    } catch (error: any) {
      console.error('[AdminSeries] Error updating series:', error);
      console.error('[AdminSeries] Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      const errorMessage = error.response?.data?.message || error.message || 'Failed to update series';
      alert(`Failed to update series: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tournament Series</h1>
          <p className="text-white/60 mt-1">Manage tournament series homepages</p>
        </div>
        <button
          onClick={fetchSeries}
          disabled={loading}
          className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          Reload
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-400">{error}</p>
          <p className="text-red-400/60 text-sm mt-1">
            Check browser console for details. Series may not be created yet - run seed script on backend.
          </p>
        </div>
      )}

      {/* Edit Modal */}
      {editingSeries && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleCancelEdit}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-chess-dark rounded-2xl border border-white/10 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Edit Series</h2>
              <button
                onClick={handleCancelEdit}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Series Name *
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white
                           placeholder:text-white/30 focus:border-primary-500 focus:outline-none"
                  placeholder="e.g., Tata Steel Chess Tournament"
                />
              </div>

              {/* Organizer Name Override */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Organizer Name (Optional)
                </label>
                <input
                  type="text"
                  value={editOrganizerName}
                  onChange={(e) => setEditOrganizerName(e.target.value)}
                  className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white
                           placeholder:text-white/30 focus:border-primary-500 focus:outline-none"
                  placeholder="e.g., Tata Steel Chess Foundation"
                />
                <p className="text-xs text-white/50 mt-1">
                  Custom organizer name to display (e.g., tournament organization). Leave empty to show user's name.
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Description
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={4}
                  className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white
                           placeholder:text-white/30 focus:border-primary-500 focus:outline-none resize-none"
                  placeholder="Describe the tournament series..."
                />
              </div>

              {/* Image Upload/URL */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Series Image
                </label>

                {/* Upload Button */}
                <div className="mb-3">
                  <input
                    type="file"
                    id="image-upload"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    className="hidden"
                  />
                  <label
                    htmlFor="image-upload"
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg
                              border border-white/10 cursor-pointer transition-colors
                              ${uploadingImage
                                ? 'bg-white/5 opacity-50 cursor-not-allowed'
                                : 'bg-white/5 hover:bg-white/10'}`}
                  >
                    {uploadingImage ? (
                      <>
                        <Loader2 className="w-5 h-5 text-white/60 animate-spin" />
                        <span className="text-white/60">Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-white/60" />
                        <span className="text-white/80">Upload Image</span>
                      </>
                    )}
                  </label>
                  <p className="text-xs text-white/40 mt-1">
                    Max 5MB, JPG/PNG/WebP
                  </p>
                </div>

                {/* Or divider */}
                <div className="flex items-center gap-3 my-3">
                  <div className="flex-1 h-px bg-white/10"></div>
                  <span className="text-sm text-white/40">or</span>
                  <div className="flex-1 h-px bg-white/10"></div>
                </div>

                {/* URL Input */}
                <input
                  type="url"
                  value={editImage}
                  onChange={(e) => setEditImage(e.target.value)}
                  disabled={uploadingImage}
                  className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white
                           placeholder:text-white/30 focus:border-primary-500 focus:outline-none
                           disabled:opacity-50"
                  placeholder="Enter image URL..."
                />

                {/* Image Preview */}
                {editImage && (
                  <div className="mt-3 rounded-lg overflow-hidden border border-white/10">
                    <img
                      src={editImage}
                      alt="Preview"
                      className="w-full h-40 object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=800';
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Gallery Images */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Gallery Images
                </label>

                {/* Upload Button */}
                <div className="mb-3">
                  <input
                    type="file"
                    id="gallery-upload"
                    accept="image/*"
                    multiple
                    onChange={handleGalleryUpload}
                    disabled={uploadingGallery}
                    className="hidden"
                  />
                  <label
                    htmlFor="gallery-upload"
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg
                              border border-white/10 cursor-pointer transition-colors
                              ${uploadingGallery
                                ? 'bg-white/5 opacity-50 cursor-not-allowed'
                                : 'bg-white/5 hover:bg-white/10'}`}
                  >
                    {uploadingGallery ? (
                      <>
                        <Loader2 className="w-5 h-5 text-white/60 animate-spin" />
                        <span className="text-white/60">Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-5 h-5 text-white/60" />
                        <span className="text-white/80">Add Gallery Images</span>
                      </>
                    )}
                  </label>
                  <p className="text-xs text-white/40 mt-1">
                    Select multiple images (max 5 at once, 5MB each)
                  </p>
                </div>

                {/* Gallery Grid */}
                {editImages.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    {editImages.map((imageUrl, index) => (
                      <div
                        key={index}
                        className="relative group rounded-lg overflow-hidden border border-white/10
                                 aspect-square"
                      >
                        <img
                          src={imageUrl}
                          alt={`Gallery ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=400';
                          }}
                        />
                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteGalleryImage(index)}
                          className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600
                                   text-white rounded-lg opacity-0 group-hover:opacity-100
                                   transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {editImages.length === 0 && (
                  <p className="text-sm text-white/40 text-center py-4">
                    No gallery images yet. Upload some to showcase this series!
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-4">
                <button
                  onClick={handleSaveEdit}
                  disabled={saving || !editName}
                  className="flex-1 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold
                           rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                           flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Save Changes
                    </>
                  )}
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={saving}
                  className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-semibold
                           rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Series List */}
      <div className="grid gap-4">
        {series.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 rounded-xl p-6 border border-white/10 hover:border-white/20 transition-colors"
          >
            <div className="flex items-start gap-4">
              {/* Series Image */}
              <div className="w-32 h-32 rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src={item.image || 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=400'}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=400';
                  }}
                />
              </div>

              {/* Series Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">{item.name}</h3>
                    <p className="text-sm text-white/50">by {item.organizer_name}</p>
                  </div>
                  <button
                    onClick={() => handleEditClick(item)}
                    className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white
                             rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                </div>

                {item.description && (
                  <p className="text-white/70 text-sm mb-4 line-clamp-2">{item.description}</p>
                )}

                <div className="flex items-center gap-4 text-sm text-white/50">
                  <span className="flex items-center gap-1">
                    <Trophy className="w-4 h-4" />
                    {item.edition_count} edition{item.edition_count !== '1' ? 's' : ''}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Created {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="mt-3">
                  <button
                    onClick={() => navigate(`/tournament/${item.id}/series`)}
                    className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
                  >
                    View Series Page →
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        {series.length === 0 && !error && (
          <div className="text-center py-12 text-white/50">
            <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">No tournament series found</p>
            <p className="text-sm text-white/40">
              Series are created automatically by the seed script during deployment.
            </p>
            <p className="text-sm text-white/40">
              Expected: 15 series (Tata Steel, Reykjavik Open, etc.)
            </p>
            <button
              onClick={fetchSeries}
              className="mt-4 px-6 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
            >
              Retry Loading
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSeries;
