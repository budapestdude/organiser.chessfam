import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Crown, Shield, Award, Ban, MoreVertical, UserX, RefreshCw } from 'lucide-react';
import { clubsApi, type ClubMember } from '../api/clubs';
import { useStore } from '../store';

interface ClubMembersProps {
  clubId: number;
  userRole?: string; // 'owner' | 'admin' | 'officer' | 'member'
}

const ClubMembers = ({ clubId, userRole }: ClubMembersProps) => {
  const { user } = useStore();
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedMember, setSelectedMember] = useState<ClubMember | null>(null);
  const [showActions, setShowActions] = useState(false);

  const isOwner = userRole === 'owner';
  const isAdmin = userRole === 'admin' || isOwner;
  const canManage = isAdmin;

  useEffect(() => {
    fetchMembers();
  }, [clubId, page]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const response = await clubsApi.getMembers(clubId, page, 50);
      setMembers(response.data.members || response.data || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Failed to fetch members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeRole = async (userId: number, newRole: 'member' | 'officer' | 'admin') => {
    if (!canManage) return;

    try {
      await clubsApi.updateMemberRole(clubId, userId, newRole);
      alert('Member role updated successfully');
      fetchMembers();
      setShowActions(false);
      setSelectedMember(null);
    } catch (error: any) {
      console.error('Failed to update role:', error);
      alert(error.response?.data?.error || 'Failed to update member role');
    }
  };

  const handleBanMember = async (userId: number, memberName: string) => {
    if (!canManage) return;

    const reason = prompt(`Why are you banning ${memberName}?`);
    if (reason === null) return; // Cancelled

    try {
      await clubsApi.banMember(clubId, userId, reason || undefined);
      alert(`${memberName} has been banned from the club`);
      fetchMembers();
      setShowActions(false);
      setSelectedMember(null);
    } catch (error: any) {
      console.error('Failed to ban member:', error);
      alert(error.response?.data?.error || 'Failed to ban member');
    }
  };

  const handleUnbanMember = async (userId: number, memberName: string) => {
    if (!canManage) return;

    if (!confirm(`Are you sure you want to unban ${memberName}?`)) return;

    try {
      await clubsApi.unbanMember(clubId, userId);
      alert(`${memberName} has been unbanned`);
      fetchMembers();
      setShowActions(false);
      setSelectedMember(null);
    } catch (error: any) {
      console.error('Failed to unban member:', error);
      alert(error.response?.data?.error || 'Failed to unban member');
    }
  };

  const handleTransferOwnership = async (userId: number, memberName: string) => {
    if (!isOwner) return;

    if (!confirm(`Are you sure you want to transfer ownership to ${memberName}? This action cannot be undone.`)) return;

    try {
      await clubsApi.transferOwnership(clubId, userId);
      alert(`Ownership transferred to ${memberName}`);
      fetchMembers();
      setShowActions(false);
      setSelectedMember(null);
    } catch (error: any) {
      console.error('Failed to transfer ownership:', error);
      alert(error.response?.data?.error || 'Failed to transfer ownership');
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-4 h-4 text-gold-400" />;
      case 'admin':
        return <Shield className="w-4 h-4 text-blue-400" />;
      case 'officer':
        return <Award className="w-4 h-4 text-purple-400" />;
      default:
        return <Users className="w-4 h-4 text-white/40" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-gold-500/20 text-gold-400 border-gold-500/30';
      case 'admin':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'officer':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default:
        return 'bg-white/5 text-white/60 border-white/10';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="inline-block w-8 h-8 border-4 border-gold-400/30 border-t-gold-400 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-gold-400" />
          Members ({members.length})
        </h3>
      </div>

      <div className="space-y-3">
        {members.map((member) => (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                {/* Avatar */}
                <div className="relative">
                  <img
                    src={member.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${member.name}`}
                    alt={member.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-white/10"
                  />
                  {member.status === 'banned' && (
                    <div className="absolute -bottom-1 -right-1 bg-red-500 rounded-full p-1">
                      <Ban className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>

                {/* Member Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-white font-medium">{member.name}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-xs border flex items-center gap-1 ${getRoleBadgeColor(member.role)}`}>
                      {getRoleIcon(member.role)}
                      {member.role}
                    </span>
                    {member.status === 'banned' && (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-red-500/20 text-red-400 border border-red-500/30">
                        Banned
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-white/50">
                    {member.rating && <span>Rating: {member.rating}</span>}
                    <span>Joined {new Date(member.joined_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Actions Menu */}
              {canManage && user && member.user_id !== user.id && (
                <div className="relative">
                  <button
                    onClick={() => {
                      setSelectedMember(member);
                      setShowActions(selectedMember?.id === member.id ? !showActions : true);
                    }}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <MoreVertical className="w-5 h-5 text-white/60" />
                  </button>

                  {selectedMember?.id === member.id && showActions && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute right-0 top-full mt-2 bg-chess-darker border border-white/10 rounded-xl shadow-xl z-10 min-w-[200px] overflow-hidden"
                    >
                      {/* Change Role */}
                      {isAdmin && member.role !== 'owner' && (
                        <div className="border-b border-white/10">
                          <div className="px-4 py-2 text-xs text-white/50 font-medium">Change Role</div>
                          {['member', 'officer', 'admin'].map((role) => (
                            member.role !== role && (
                              <button
                                key={role}
                                onClick={() => handleChangeRole(member.user_id, role as any)}
                                className="w-full px-4 py-2 text-left text-sm text-white/70 hover:bg-white/10 transition-colors flex items-center gap-2"
                              >
                                {getRoleIcon(role)}
                                Make {role.charAt(0).toUpperCase() + role.slice(1)}
                              </button>
                            )
                          ))}
                        </div>
                      )}

                      {/* Ban/Unban */}
                      {isAdmin && (
                        <div className="border-b border-white/10">
                          {member.status === 'banned' ? (
                            <button
                              onClick={() => handleUnbanMember(member.user_id, member.name)}
                              className="w-full px-4 py-3 text-left text-sm text-green-400 hover:bg-white/10 transition-colors flex items-center gap-2"
                            >
                              <RefreshCw className="w-4 h-4" />
                              Unban Member
                            </button>
                          ) : (
                            <button
                              onClick={() => handleBanMember(member.user_id, member.name)}
                              className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-white/10 transition-colors flex items-center gap-2"
                            >
                              <UserX className="w-4 h-4" />
                              Ban Member
                            </button>
                          )}
                        </div>
                      )}

                      {/* Transfer Ownership */}
                      {isOwner && member.role !== 'owner' && member.status !== 'banned' && (
                        <button
                          onClick={() => handleTransferOwnership(member.user_id, member.name)}
                          className="w-full px-4 py-3 text-left text-sm text-gold-400 hover:bg-white/10 transition-colors flex items-center gap-2"
                        >
                          <Crown className="w-4 h-4" />
                          Transfer Ownership
                        </button>
                      )}
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-white/5 rounded-lg text-white/70 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-white/50 text-sm">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 bg-white/5 rounded-lg text-white/70 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {members.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/50">No members found</p>
        </div>
      )}
    </div>
  );
};

export default ClubMembers;
