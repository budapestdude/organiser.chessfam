// Admin page for managing communities
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  Users,
  MapPin,
  Search,
  X,
  Check,
  AlertTriangle,
  EyeOff,
  Globe,
  Lock,
  Building2,
  Trophy,
  Radio,
  Video,
} from 'lucide-react';
import { useStore } from '../store';
import { communitiesApi } from '../api/communities';
import type { Community as BackendCommunity } from '../api/communities';
import * as theaterApi from '../api/theater';
import { Avatar } from '../components/Avatar';
import { parseStreamUrl } from '../components/StreamEmbed';

// Map backend community type to frontend type
type Community = BackendCommunity;
type CommunityType = 'venue' | 'club' | 'tournament' | 'online' | 'city';

interface CommunityFormData {
  name: string;
  slug: string;
  description: string;
  type: CommunityType;
  city: string;
  country: string;
  linkedEntityId: string;
  isVisible: boolean;
  isPublic: boolean;
  imageUrl: string;
  coverImageUrl: string;
}

interface TheaterContent {
  id: number;
  community_id: number;
  type: string;
  title: string;
  stream_url?: string;
  is_live: boolean;
  priority: number;
  viewer_count?: number;
  created_at: string;
  updated_at: string;
}

const defaultFormData: CommunityFormData = {
  name: '',
  slug: '',
  description: '',
  type: 'venue',
  city: '',
  country: '',
  linkedEntityId: '',
  isVisible: true,
  isPublic: true,
  imageUrl: '',
  coverImageUrl: '',
};

export default function AdminCommunities() {
  const navigate = useNavigate();
  const { user } = useStore();

  // State
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<CommunityType | 'all'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showTheaterModal, setShowTheaterModal] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [formData, setFormData] = useState<CommunityFormData>(defaultFormData);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check admin access
  useEffect(() => {
    if (!user?.is_admin) {
      navigate('/');
      return;
    }
    fetchCommunities();
  }, [user, navigate]);

  const fetchCommunities = async () => {
    try {
      setLoading(true);
      const response = await communitiesApi.getAll({ limit: 100 });
      setCommunities(response.communities);
    } catch (err) {
      console.error('Error fetching communities:', err);
      setError('Failed to load communities');
    } finally {
      setLoading(false);
    }
  };

  // Filter communities
  const filteredCommunities = communities.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.city?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || c.type === typeFilter;
    return matchesSearch && matchesType;
  });

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  // Handle form changes
  const handleFormChange = (field: keyof CommunityFormData, value: string | boolean) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      // Auto-generate slug when name changes
      if (field === 'name' && !prev.slug) {
        updated.slug = generateSlug(value as string);
      }
      return updated;
    });
  };

  // Create community
  const handleCreate = async () => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await communitiesApi.create({
        name: formData.name,
        description: formData.description || undefined,
        type: formData.type,
        city: formData.city || undefined,
        country: formData.country || undefined,
        latitude: undefined,
        longitude: undefined,
        image: formData.imageUrl || undefined,
        tags: [],
        is_private: !formData.isPublic,
        max_members: undefined,
      });

      setShowCreateModal(false);
      setFormData(defaultFormData);
      await fetchCommunities();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create community');
    } finally {
      setSubmitting(false);
    }
  };

  // Update community
  const handleUpdate = async () => {
    if (!selectedCommunity || !formData.name.trim()) {
      setError('Name is required');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await communitiesApi.update(selectedCommunity.id, {
        name: formData.name,
        description: formData.description || undefined,
        city: formData.city || undefined,
        country: formData.country || undefined,
        image: formData.imageUrl || undefined,
        banner_image: formData.coverImageUrl || undefined,
        is_private: !formData.isPublic,
      });

      setShowEditModal(false);
      setSelectedCommunity(null);
      setFormData(defaultFormData);
      await fetchCommunities();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to update community');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete community
  const handleDelete = async () => {
    if (!selectedCommunity) return;

    setSubmitting(true);
    setError(null);

    try {
      // Backend doesn't have delete endpoint yet, update to inactive instead
      await communitiesApi.update(selectedCommunity.id, { is_active: false });
      setShowDeleteModal(false);
      setSelectedCommunity(null);
      await fetchCommunities();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to delete community');
    } finally {
      setSubmitting(false);
    }
  };

  // Open edit modal
  const openEditModal = (community: Community) => {
    setSelectedCommunity(community);
    setFormData({
      name: community.name,
      slug: community.slug,
      description: community.description || '',
      type: community.type,
      city: community.city || '',
      country: community.country || '',
      linkedEntityId: '', // Not used in backend
      isVisible: community.is_active,
      isPublic: !community.is_private,
      imageUrl: community.image || '',
      coverImageUrl: community.banner_image || '',
    });
    setShowEditModal(true);
  };

  // Get type icon
  const getTypeIcon = (type: CommunityType) => {
    switch (type) {
      case 'venue':
        return <MapPin className="w-4 h-4" />;
      case 'club':
        return <Building2 className="w-4 h-4" />;
      case 'tournament':
        return <Trophy className="w-4 h-4" />;
      case 'online':
        return <Globe className="w-4 h-4" />;
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
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-4xl font-display font-bold text-white mb-2">Communities</h1>
          <p className="text-white/60">Manage live page communities</p>
        </div>
        <button
          onClick={() => {
            setFormData(defaultFormData);
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Community
        </button>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search communities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'venue', 'club', 'tournament', 'online'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-3 py-2 rounded-lg font-medium capitalize transition-all ${
                typeFilter === type
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Communities List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredCommunities.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No communities found</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredCommunities.map((community) => (
            <motion.div
              key={community.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800/50 backdrop-blur rounded-xl p-4 border border-gray-700"
            >
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <Avatar
                  src={community.image}
                  name={community.name}
                  size="lg"
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-white truncate">{community.name}</h3>
                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
                      community.type === 'venue' ? 'bg-blue-500/20 text-blue-400' :
                      community.type === 'club' ? 'bg-green-500/20 text-green-400' :
                      community.type === 'tournament' ? 'bg-purple-500/20 text-purple-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {getTypeIcon(community.type)}
                      {community.type}
                    </span>
                    {!community.is_active && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-yellow-500/20 text-yellow-400">
                        <EyeOff className="w-3 h-3" />
                        Inactive
                      </span>
                    )}
                    {community.is_private && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-red-500/20 text-red-400">
                        <Lock className="w-3 h-3" />
                        Private
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 mb-2">/{community.slug}</p>
                  {community.description && (
                    <p className="text-sm text-gray-300 line-clamp-2 mb-2">{community.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    {community.city && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {community.city}, {community.country}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {community.member_count || 0} members
                    </span>
                    <span className="flex items-center gap-1">
                      <Radio className="w-4 h-4" />
                      {community.online_count || 0} online
                    </span>
                  </div>
                  {/* Active Tags */}
                  {community.tags && community.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {community.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded text-xs bg-blue-500/20 text-blue-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedCommunity(community);
                      setShowTheaterModal(true);
                    }}
                    className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
                    title="Manage theater content"
                  >
                    <Video className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => openEditModal(community)}
                    className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedCommunity(community);
                      setShowDeleteModal(true);
                    }}
                    className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors"
                    title="Deactivate"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {(showCreateModal || showEditModal) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowCreateModal(false);
              setShowEditModal(false);
              setError(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-white">
                  {showCreateModal ? 'Create Community' : 'Edit Community'}
                </h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    setError(null);
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    placeholder="Community name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Slug *</label>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">/</span>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => handleFormChange('slug', e.target.value)}
                      className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                      placeholder="community-slug"
                      disabled={showEditModal}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500 resize-none"
                    placeholder="Community description..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => handleFormChange('type', e.target.value as CommunityType)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    disabled={showEditModal}
                  >
                    <option value="venue">Venue</option>
                    <option value="club">Club</option>
                    <option value="tournament">Tournament</option>
                    <option value="online">Online</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleFormChange('city', e.target.value)}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                      placeholder="New York"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Country</label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => handleFormChange('country', e.target.value)}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                      placeholder="US"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Linked Entity ID</label>
                  <input
                    type="text"
                    value={formData.linkedEntityId}
                    onChange={(e) => handleFormChange('linkedEntityId', e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    placeholder="venue_123 or club_456"
                  />
                  <p className="text-xs text-gray-500 mt-1">ID of the linked venue, club, or tournament</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Image URL</label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => handleFormChange('imageUrl', e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    placeholder="https://..."
                  />
                </div>

                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isVisible}
                      onChange={(e) => handleFormChange('isVisible', e.target.checked)}
                      className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-300">Visible</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isPublic}
                      onChange={(e) => handleFormChange('isPublic', e.target.checked)}
                      className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-300">Public</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    setError(null);
                  }}
                  className="flex-1 py-2 px-4 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  onClick={showCreateModal ? handleCreate : handleUpdate}
                  className="flex-1 py-2 px-4 bg-purple-600 hover:bg-purple-500 rounded-lg text-white transition-colors flex items-center justify-center gap-2"
                  disabled={submitting}
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      {showCreateModal ? 'Create' : 'Save'}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && selectedCommunity && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-full bg-red-500/20">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">Delete Community</h3>
              </div>

              <p className="text-gray-300 mb-6">
                Are you sure you want to deactivate <strong>{selectedCommunity.name}</strong>? This will hide it from public view but preserve all data.
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-2 px-4 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-500 rounded-lg text-white transition-colors flex items-center justify-center gap-2"
                  disabled={submitting}
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Deactivate
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Theater Content Modal */}
      <AnimatePresence>
        {showTheaterModal && selectedCommunity && (
          <TheaterContentModal
            community={selectedCommunity}
            onClose={() => {
              setShowTheaterModal(false);
              setSelectedCommunity(null);
            }}
            onUpdate={fetchCommunities}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Theater Content Modal Component
interface TheaterContentModalProps {
  community: Community;
  onClose: () => void;
  onUpdate: () => void;
}

const TheaterContentModal: React.FC<TheaterContentModalProps> = ({ community, onClose, onUpdate }) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [theaterContent, setTheaterContent] = useState<TheaterContent[]>([]);

  // Form state
  const [streamUrl, setStreamUrl] = useState('');
  const [title, setTitle] = useState('');
  const [isLive, setIsLive] = useState(true);
  const [priority, setPriority] = useState(0);

  useEffect(() => {
    fetchTheaterContent();
  }, []);

  const fetchTheaterContent = async () => {
    try {
      setLoading(true);
      const response = await theaterApi.getAllTheaterContent(community.id);
      const content = response.data.data || [];
      setTheaterContent(content);

      // Pre-fill form with active content if exists
      const activeContent = content.find((c: any) => c.is_live);
      if (activeContent) {
        setStreamUrl(activeContent.stream_url || '');
        setTitle(activeContent.title);
        setIsLive(activeContent.is_live);
        setPriority(activeContent.priority);
      }
    } catch (err) {
      console.error('Error fetching theater content:', err);
      setError('Failed to load theater content');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!streamUrl.trim()) {
      setError('Stream URL is required');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Parse the URL to get platform info
      const streamConfig = parseStreamUrl(streamUrl);

      if (!streamConfig) {
        setError('Invalid stream URL. Please use a valid YouTube or Twitch URL.');
        setSubmitting(false);
        return;
      }

      // Create/update theater content
      await theaterApi.upsertTheaterContent(community.id, {
        type: 'stream',
        title: title || `${community.name} Stream`,
        stream_url: streamUrl,
        is_live: isLive,
        viewer_count: 0,
        priority,
      });

      await fetchTheaterContent();
      onUpdate();
      setError(null);

      // Show success message
      alert('Theater content saved successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to save theater content');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to remove this theater content?')) {
      return;
    }

    setSubmitting(true);
    try {
      await theaterApi.deleteTheaterContent(community.id, id);
      await fetchTheaterContent();
      onUpdate();

      // Clear form
      setStreamUrl('');
      setTitle('');
      setIsLive(true);
      setPriority(0);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to delete theater content');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-800 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-semibold text-white">Theater Content</h3>
            <p className="text-sm text-gray-400 mt-1">
              Manage stream embeds for <strong>{community.name}</strong>
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Current Theater Content */}
            {theaterContent.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-300 mb-3">Current Content</h4>
                <div className="space-y-2">
                  {theaterContent.map((content) => (
                    <div
                      key={content.id}
                      className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{content.title}</p>
                        <p className="text-xs text-gray-400 truncate">{content.stream_url}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            content.is_live ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                          }`}>
                            {content.is_live ? 'Live' : 'Inactive'}
                          </span>
                          <span className="text-xs text-gray-500">Priority: {content.priority}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(content.id)}
                        disabled={submitting}
                        className="ml-3 p-2 rounded bg-red-500/20 hover:bg-red-500/30 text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add/Edit Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Stream URL *
                </label>
                <input
                  type="url"
                  value={streamUrl}
                  onChange={(e) => setStreamUrl(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  placeholder="https://youtube.com/watch?v=... or https://twitch.tv/..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supports YouTube and Twitch stream URLs
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  placeholder="Stream title (optional)"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Priority
                  </label>
                  <input
                    type="number"
                    value={priority}
                    onChange={(e) => setPriority(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Higher priority shows first
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Status
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer mt-2">
                    <input
                      type="checkbox"
                      checked={isLive}
                      onChange={(e) => setIsLive(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-300">Show as live</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6 pt-6 border-t border-gray-700">
              <button
                onClick={onClose}
                className="flex-1 py-2 px-4 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-2 px-4 bg-purple-600 hover:bg-purple-500 rounded-lg text-white transition-colors flex items-center justify-center gap-2"
                disabled={submitting}
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Save Theater Content
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
};
