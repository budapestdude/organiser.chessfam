import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Users, Settings, X, Check } from 'lucide-react';
import { communitiesApi } from '../api/communities';
import type { Community } from '../api/communities';

// Event tag types
type EventTag = 'blitz' | 'rapid' | 'classical' | 'gm-present' | 'im-present' | 'tournament-live' | 'lesson' | 'simul' | 'open-play';

interface EventTagData {
  id: EventTag;
  label: string;
  color: string;
}

const eventTags: Record<EventTag, EventTagData> = {
  'blitz': { id: 'blitz', label: 'Blitz', color: 'bg-yellow-500' },
  'rapid': { id: 'rapid', label: 'Rapid', color: 'bg-orange-500' },
  'classical': { id: 'classical', label: 'Classical', color: 'bg-blue-500' },
  'gm-present': { id: 'gm-present', label: 'GM Here', color: 'bg-purple-500' },
  'im-present': { id: 'im-present', label: 'IM Here', color: 'bg-indigo-500' },
  'tournament-live': { id: 'tournament-live', label: 'Live Tournament', color: 'bg-red-500' },
  'lesson': { id: 'lesson', label: 'Lesson', color: 'bg-green-500' },
  'simul': { id: 'simul', label: 'Simul', color: 'bg-pink-500' },
  'open-play': { id: 'open-play', label: 'Open Play', color: 'bg-cyan-500' },
};

interface CommunitySectionProps {
  entityType: 'location' | 'club' | 'tournament';
  entityId: string;
  entityName: string;
  isAdmin?: boolean;
}

const CommunitySection = ({ entityType, entityId: _entityId, entityName, isAdmin = false }: CommunitySectionProps) => {
  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [showManageModal, setShowManageModal] = useState(false);
  const [selectedTags, setSelectedTags] = useState<EventTag[]>([]);

  // Generate slug from entity name (same logic as backend)
  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  // Fetch community data from API
  useEffect(() => {
    const fetchCommunity = async () => {
      try {
        setLoading(true);
        const slug = generateSlug(entityName);

        // Try to fetch by slug
        try {
          const communityData = await communitiesApi.getBySlug(slug);
          setCommunity(communityData);
          setSelectedTags(communityData.tags.filter(tag =>
            ['blitz', 'rapid', 'classical', 'gm-present', 'im-present', 'tournament-live', 'lesson', 'simul', 'open-play'].includes(tag)
          ) as EventTag[]);
        } catch (err: any) {
          // If not found by exact slug, try with type suffix
          if (err.response?.status === 404) {
            const slugWithType = `${slug}-${entityType}`;
            const communityData = await communitiesApi.getBySlug(slugWithType);
            setCommunity(communityData);
            setSelectedTags(communityData.tags.filter(tag =>
              ['blitz', 'rapid', 'classical', 'gm-present', 'im-present', 'tournament-live', 'lesson', 'simul', 'open-play'].includes(tag)
            ) as EventTag[]);
          } else {
            throw err;
          }
        }
      } catch (error) {
        console.error('Failed to fetch community:', error);
        setCommunity(null);
      } finally {
        setLoading(false);
      }
    };

    if (entityName) {
      fetchCommunity();
    }
  }, [entityName, entityType]);

  const toggleTag = (tag: EventTag) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const saveTags = async () => {
    if (!community) return;

    try {
      await communitiesApi.update(community.id, {
        tags: selectedTags
      });

      // Update local state
      setCommunity({
        ...community,
        tags: selectedTags
      });

      setShowManageModal(false);
    } catch (error) {
      console.error('Failed to save tags:', error);
      alert('Failed to save tags. Please try again.');
    }
  };

  // Show loading state
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-xl p-5 border border-purple-500/20"
      >
        <div className="flex items-center justify-center py-8">
          <div className="text-white/50 text-sm">Loading community...</div>
        </div>
      </motion.div>
    );
  }

  // Show message if community not found
  if (!community) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-xl p-5 border border-purple-500/20"
      >
        <div className="flex items-center gap-2 mb-3">
          <MessageCircle className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-bold text-white">Community</h3>
        </div>
        <p className="text-sm text-white/50 text-center py-4">
          No community found for this {entityType}
        </p>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-xl p-5 border border-purple-500/20"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-bold text-white">Community</h3>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowManageModal(true)}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              title="Manage Community"
            >
              <Settings className="w-4 h-4 text-white/50" />
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4 text-white/50" />
            <span className="text-white/70">{community.member_count || 0} members</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-white/70">{community.online_count || 0} online</span>
          </div>
        </div>

        {/* Active Tags */}
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedTags.map(tagId => {
              const tag = eventTags[tagId];
              return (
                <span
                  key={tagId}
                  className={`${tag.color} text-white text-xs px-2 py-1 rounded-full`}
                >
                  {tag.label}
                </span>
              );
            })}
          </div>
        )}

        {/* Live Chat Info */}
        <div className="mb-4 p-3 bg-white/5 rounded-lg border border-white/10">
          <p className="text-sm text-white/70 text-center">
            Join the live community chat to connect with other members
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <a
            href="/live"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Open Live Chat
          </a>
        </div>

        {/* Info text */}
        <p className="text-xs text-white/40 mt-3 text-center">
          Chat with {community.online_count || 0} members online now on /live
        </p>
      </motion.div>

      {/* Manage Community Modal */}
      <AnimatePresence>
        {showManageModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={() => setShowManageModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1a1a1a] rounded-2xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Manage Community</h3>
                <button
                  onClick={() => setShowManageModal(false)}
                  className="text-white/40 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 space-y-6">
                {/* Community Name */}
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Community Name
                  </label>
                  <input
                    type="text"
                    defaultValue={entityName}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50"
                  />
                </div>

                {/* Active Event Tags */}
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Active Event Tags
                  </label>
                  <p className="text-xs text-white/40 mb-3">
                    Select tags to highlight current events in this community
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(eventTags) as EventTag[]).map(tagId => {
                      const tag = eventTags[tagId];
                      const isSelected = selectedTags.includes(tagId);
                      return (
                        <button
                          key={tagId}
                          onClick={() => toggleTag(tagId)}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                            isSelected
                              ? `${tag.color} text-white`
                              : 'bg-white/5 text-white/50 hover:bg-white/10'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                          {tag.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Visibility */}
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Visibility on /live
                  </label>
                  <div className="flex gap-2">
                    <button className="flex-1 px-4 py-2 bg-purple-500 text-white text-sm rounded-lg">
                      Visible
                    </button>
                    <button className="flex-1 px-4 py-2 bg-white/5 text-white/50 text-sm rounded-lg hover:bg-white/10">
                      Hidden
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-white/10 flex gap-2">
                <button
                  onClick={() => setShowManageModal(false)}
                  className="flex-1 px-4 py-2 bg-white/5 text-white/70 text-sm rounded-lg hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  onClick={saveTags}
                  className="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium rounded-lg"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CommunitySection;
