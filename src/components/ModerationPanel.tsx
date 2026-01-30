// Moderation panel for community management
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  AlertTriangle,
  Ban,
  Trash2,
  EyeOff,
  Clock,
  User,
  MessageSquare,
  Flag,
  Check,
  X,
  ChevronDown,
  Search,
} from 'lucide-react';
import { Avatar } from './Avatar';
import { membersApi } from '../api/live';
import type { CommunityMember, MemberRole } from '../types/live';

// ============================================
// TYPES
// ============================================

interface Report {
  id: string;
  reportedBy: string;
  reportedByName?: string;
  targetType: 'message' | 'user';
  targetId: string;
  reason: string;
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  targetContent?: string;
  targetUserName?: string;
}

interface ModerationAction {
  id: string;
  moderatorId: string;
  moderatorName?: string;
  actionType: 'warn' | 'mute' | 'kick' | 'ban' | 'delete_message' | 'timeout';
  targetUserId: string;
  targetUserName?: string;
  reason?: string;
  duration?: number;
  createdAt: string;
}

interface ModerationPanelProps {
  communityId: string;
  isOpen: boolean;
  onClose: () => void;
  currentUserRole: MemberRole;
}

// ============================================
// MODERATION PANEL
// ============================================

export const ModerationPanel: React.FC<ModerationPanelProps> = ({
  communityId,
  isOpen,
  onClose,
  currentUserRole,
}) => {
  const [activeTab, setActiveTab] = useState<'reports' | 'members' | 'actions' | 'settings'>('reports');
  const [reports, setReports] = useState<Report[]>([]);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [actions, setActions] = useState<ModerationAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'resolved'>('pending');

  const canModerate = ['moderator', 'admin', 'owner'].includes(currentUserRole);

  useEffect(() => {
    if (isOpen && canModerate) {
      fetchData();
    }
  }, [isOpen, activeTab, communityId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'reports':
          await fetchReports();
          break;
        case 'members':
          await fetchMembers();
          break;
        case 'actions':
          await fetchActions();
          break;
      }
    } catch (err) {
      console.error('Error fetching moderation data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    // Mock data for now - would be replaced with actual API call
    const mockReports: Report[] = [
      {
        id: '1',
        reportedBy: 'user1',
        reportedByName: 'John Doe',
        targetType: 'message',
        targetId: 'msg1',
        reason: 'spam',
        description: 'User is posting spam messages',
        status: 'pending',
        createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        targetContent: 'Check out this amazing offer! Click here...',
      },
      {
        id: '2',
        reportedBy: 'user2',
        reportedByName: 'Jane Smith',
        targetType: 'user',
        targetId: 'user3',
        reason: 'harassment',
        description: 'User is being rude to others',
        status: 'pending',
        createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        targetUserName: 'Problem User',
      },
    ];
    setReports(mockReports);
  };

  const fetchMembers = async () => {
    const data = await membersApi.getByCommumity(communityId);
    setMembers(data);
  };

  const fetchActions = async () => {
    // Mock data for now
    const mockActions: ModerationAction[] = [
      {
        id: '1',
        moderatorId: 'mod1',
        moderatorName: 'Admin User',
        actionType: 'warn',
        targetUserId: 'user3',
        targetUserName: 'Problem User',
        reason: 'Inappropriate behavior',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '2',
        moderatorId: 'mod1',
        moderatorName: 'Admin User',
        actionType: 'timeout',
        targetUserId: 'user4',
        targetUserName: 'Spammer',
        reason: 'Spam messages',
        duration: 24 * 60,
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      },
    ];
    setActions(mockActions);
  };

  const handleResolveReport = async (reportId: string, action: 'resolve' | 'dismiss') => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === reportId
          ? { ...r, status: action === 'resolve' ? 'resolved' : 'dismissed' }
          : r
      )
    );
  };

  const handleBanUser = async (userId: string, reason?: string) => {
    try {
      await membersApi.ban(communityId, userId, reason);
      await fetchMembers();
    } catch (err) {
      console.error('Error banning user:', err);
    }
  };

  const handleUpdateRole = async (userId: string, role: MemberRole) => {
    try {
      await membersApi.updateRole(communityId, userId, role);
      await fetchMembers();
    } catch (err) {
      console.error('Error updating role:', err);
    }
  };

  if (!canModerate) {
    return null;
  }

  const filteredReports = reports.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      return (
        r.reason.toLowerCase().includes(search) ||
        r.description?.toLowerCase().includes(search) ||
        r.reportedByName?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const filteredMembers = members.filter((m) => {
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      return m.user?.displayName?.toLowerCase().includes(search);
    }
    return true;
  });

  return (
    <AnimatePresence>
      {isOpen && (
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
            className="bg-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <Shield className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">Moderation Panel</h2>
                    <p className="text-sm text-gray-400">Manage community content and members</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mt-6">
                {[
                  { id: 'reports', label: 'Reports', icon: Flag },
                  { id: 'members', label: 'Members', icon: User },
                  { id: 'actions', label: 'Action Log', icon: Clock },
                  { id: 'settings', label: 'Settings', icon: Shield },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                    {tab.id === 'reports' && reports.filter((r) => r.status === 'pending').length > 0 && (
                      <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                        {reports.filter((r) => r.status === 'pending').length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Search and Filters */}
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  />
                </div>
                {activeTab === 'reports' && (
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                    className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="resolved">Resolved</option>
                  </select>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  {/* Reports Tab */}
                  {activeTab === 'reports' && (
                    <div className="space-y-4">
                      {filteredReports.length === 0 ? (
                        <div className="text-center py-12">
                          <Flag className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                          <p className="text-gray-400">No reports to review</p>
                        </div>
                      ) : (
                        filteredReports.map((report) => (
                          <ReportCard
                            key={report.id}
                            report={report}
                            onResolve={() => handleResolveReport(report.id, 'resolve')}
                            onDismiss={() => handleResolveReport(report.id, 'dismiss')}
                          />
                        ))
                      )}
                    </div>
                  )}

                  {/* Members Tab */}
                  {activeTab === 'members' && (
                    <div className="space-y-2">
                      {filteredMembers.length === 0 ? (
                        <div className="text-center py-12">
                          <User className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                          <p className="text-gray-400">No members found</p>
                        </div>
                      ) : (
                        filteredMembers.map((member) => (
                          <MemberCard
                            key={member.id}
                            member={member}
                            currentUserRole={currentUserRole}
                            onUpdateRole={(role) => handleUpdateRole(member.userId, role)}
                            onBan={(reason) => handleBanUser(member.userId, reason)}
                          />
                        ))
                      )}
                    </div>
                  )}

                  {/* Actions Tab */}
                  {activeTab === 'actions' && (
                    <div className="space-y-3">
                      {actions.length === 0 ? (
                        <div className="text-center py-12">
                          <Clock className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                          <p className="text-gray-400">No moderation actions yet</p>
                        </div>
                      ) : (
                        actions.map((action) => (
                          <ActionCard key={action.id} action={action} />
                        ))
                      )}
                    </div>
                  )}

                  {/* Settings Tab */}
                  {activeTab === 'settings' && (
                    <ModerationSettings communityId={communityId} />
                  )}
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ============================================
// REPORT CARD
// ============================================

interface ReportCardProps {
  report: Report;
  onResolve: () => void;
  onDismiss: () => void;
}

const ReportCard: React.FC<ReportCardProps> = ({ report, onResolve, onDismiss }) => {
  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      spam: 'Spam',
      harassment: 'Harassment',
      hate_speech: 'Hate Speech',
      misinformation: 'Misinformation',
      inappropriate: 'Inappropriate Content',
      other: 'Other',
    };
    return labels[reason] || reason;
  };

  const getReasonColor = (reason: string) => {
    const colors: Record<string, string> = {
      spam: 'bg-yellow-500/20 text-yellow-400',
      harassment: 'bg-red-500/20 text-red-400',
      hate_speech: 'bg-red-600/20 text-red-500',
      misinformation: 'bg-orange-500/20 text-orange-400',
      inappropriate: 'bg-purple-500/20 text-purple-400',
      other: 'bg-gray-500/20 text-gray-400',
    };
    return colors[reason] || colors.other;
  };

  const timeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="bg-gray-700/50 rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${report.targetType === 'message' ? 'bg-blue-500/20' : 'bg-purple-500/20'}`}>
            {report.targetType === 'message' ? (
              <MessageSquare className="w-4 h-4 text-blue-400" />
            ) : (
              <User className="w-4 h-4 text-purple-400" />
            )}
          </div>
          <div>
            <p className="text-sm text-white font-medium">
              {report.targetType === 'message' ? 'Message Report' : 'User Report'}
            </p>
            <p className="text-xs text-gray-400">
              Reported by {report.reportedByName} • {timeAgo(report.createdAt)}
            </p>
          </div>
        </div>
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getReasonColor(report.reason)}`}>
          {getReasonLabel(report.reason)}
        </span>
      </div>

      {report.description && (
        <p className="text-sm text-gray-300 mb-3">{report.description}</p>
      )}

      {report.targetContent && (
        <div className="p-3 bg-gray-800 rounded-lg mb-3">
          <p className="text-xs text-gray-500 mb-1">Reported content:</p>
          <p className="text-sm text-gray-300">{report.targetContent}</p>
        </div>
      )}

      {report.targetUserName && (
        <div className="flex items-center gap-2 mb-3">
          <p className="text-xs text-gray-500">Reported user:</p>
          <span className="text-sm text-white">{report.targetUserName}</span>
        </div>
      )}

      {report.status === 'pending' && (
        <div className="flex gap-2">
          <button
            onClick={onResolve}
            className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-white text-sm transition-colors"
          >
            <Check className="w-4 h-4" />
            Resolve
          </button>
          <button
            onClick={onDismiss}
            className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-white text-sm transition-colors"
          >
            <X className="w-4 h-4" />
            Dismiss
          </button>
        </div>
      )}

      {report.status !== 'pending' && (
        <div className={`flex items-center gap-2 text-sm ${
          report.status === 'resolved' ? 'text-green-400' : 'text-gray-400'
        }`}>
          <Check className="w-4 h-4" />
          {report.status === 'resolved' ? 'Resolved' : 'Dismissed'}
        </div>
      )}
    </div>
  );
};

// ============================================
// MEMBER CARD
// ============================================

interface MemberCardProps {
  member: CommunityMember;
  currentUserRole: MemberRole;
  onUpdateRole: (role: MemberRole) => void;
  onBan: (reason?: string) => void;
}

const MemberCard: React.FC<MemberCardProps> = ({
  member,
  currentUserRole,
  onUpdateRole,
  onBan,
}) => {
  const [showActions, setShowActions] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [banReason, setBanReason] = useState('');

  const getRoleColor = (role: MemberRole) => {
    const colors: Record<MemberRole, string> = {
      owner: 'bg-yellow-500/20 text-yellow-400',
      admin: 'bg-purple-500/20 text-purple-400',
      moderator: 'bg-blue-500/20 text-blue-400',
      member: 'bg-gray-500/20 text-gray-400',
    };
    return colors[role];
  };

  const canModify = (targetRole: MemberRole) => {
    const hierarchy: Record<MemberRole, number> = {
      owner: 4,
      admin: 3,
      moderator: 2,
      member: 1,
    };
    return hierarchy[currentUserRole] > hierarchy[targetRole];
  };

  const handleBan = () => {
    onBan(banReason || undefined);
    setShowBanModal(false);
    setBanReason('');
  };

  return (
    <>
      <div className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors">
        <Avatar
          src={member.user?.avatarUrl}
          name={member.user?.displayName}
          size="md"
          chessTitle={member.user?.chessTitle}
          chessTitleVerified={member.user?.chessTitleVerified}
        />
        <div className="flex-1 min-w-0">
          <p className="text-white font-medium truncate">
            {member.user?.displayName || 'Unknown User'}
          </p>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-xs ${getRoleColor(member.role)}`}>
              {member.role}
            </span>
            {member.isBanned && (
              <span className="px-2 py-0.5 rounded text-xs bg-red-500/20 text-red-400">
                Banned
              </span>
            )}
          </div>
        </div>

        {canModify(member.role) && !member.isBanned && (
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showActions ? 'rotate-180' : ''}`} />
            </button>

            {showActions && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-gray-800 rounded-lg shadow-xl border border-gray-700 py-1 z-10">
                {currentUserRole === 'owner' && member.role !== 'admin' && (
                  <button
                    onClick={() => { onUpdateRole('admin'); setShowActions(false); }}
                    className="w-full px-4 py-2 text-left text-sm text-white hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Shield className="w-4 h-4 text-purple-400" />
                    Make Admin
                  </button>
                )}
                {['owner', 'admin'].includes(currentUserRole) && member.role !== 'moderator' && (
                  <button
                    onClick={() => { onUpdateRole('moderator'); setShowActions(false); }}
                    className="w-full px-4 py-2 text-left text-sm text-white hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Shield className="w-4 h-4 text-blue-400" />
                    Make Moderator
                  </button>
                )}
                {member.role !== 'member' && (
                  <button
                    onClick={() => { onUpdateRole('member'); setShowActions(false); }}
                    className="w-full px-4 py-2 text-left text-sm text-white hover:bg-gray-700 flex items-center gap-2"
                  >
                    <User className="w-4 h-4 text-gray-400" />
                    Remove Role
                  </button>
                )}
                <hr className="my-1 border-gray-700" />
                <button
                  onClick={() => { setShowBanModal(true); setShowActions(false); }}
                  className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-700 flex items-center gap-2"
                >
                  <Ban className="w-4 h-4" />
                  Ban User
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Ban Modal */}
      <AnimatePresence>
        {showBanModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4"
            onClick={() => setShowBanModal(false)}
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
                  <Ban className="w-6 h-6 text-red-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">Ban User</h3>
              </div>

              <p className="text-gray-300 mb-4">
                Are you sure you want to ban <strong>{member.user?.displayName}</strong>? They will no longer be able to participate in this community.
              </p>

              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-1">Reason (optional)</label>
                <textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Enter reason for ban..."
                  rows={3}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500 resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowBanModal(false)}
                  className="flex-1 py-2 px-4 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBan}
                  className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-500 rounded-lg text-white transition-colors flex items-center justify-center gap-2"
                >
                  <Ban className="w-4 h-4" />
                  Ban User
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// ============================================
// ACTION CARD
// ============================================

interface ActionCardProps {
  action: ModerationAction;
}

const ActionCard: React.FC<ActionCardProps> = ({ action }) => {
  const getActionIcon = (type: ModerationAction['actionType']) => {
    const icons: Record<ModerationAction['actionType'], React.ReactNode> = {
      warn: <AlertTriangle className="w-4 h-4 text-yellow-400" />,
      mute: <EyeOff className="w-4 h-4 text-orange-400" />,
      kick: <User className="w-4 h-4 text-red-400" />,
      ban: <Ban className="w-4 h-4 text-red-500" />,
      delete_message: <Trash2 className="w-4 h-4 text-gray-400" />,
      timeout: <Clock className="w-4 h-4 text-blue-400" />,
    };
    return icons[type];
  };

  const getActionLabel = (type: ModerationAction['actionType']) => {
    const labels: Record<ModerationAction['actionType'], string> = {
      warn: 'Warned',
      mute: 'Muted',
      kick: 'Kicked',
      ban: 'Banned',
      delete_message: 'Message deleted',
      timeout: 'Timed out',
    };
    return labels[type];
  };

  const timeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="flex items-start gap-3 p-3 bg-gray-700/30 rounded-lg">
      <div className="p-2 rounded-lg bg-gray-700">
        {getActionIcon(action.actionType)}
      </div>
      <div className="flex-1">
        <p className="text-sm text-white">
          <span className="font-medium">{action.moderatorName}</span>{' '}
          <span className="text-gray-400">{getActionLabel(action.actionType)}</span>{' '}
          <span className="font-medium">{action.targetUserName}</span>
        </p>
        {action.reason && (
          <p className="text-xs text-gray-400 mt-1">Reason: {action.reason}</p>
        )}
        {action.duration && (
          <p className="text-xs text-gray-400">Duration: {action.duration} minutes</p>
        )}
      </div>
      <span className="text-xs text-gray-500">{timeAgo(action.createdAt)}</span>
    </div>
  );
};

// ============================================
// MODERATION SETTINGS
// ============================================

interface ModerationSettingsProps {
  communityId: string;
}

const ModerationSettings: React.FC<ModerationSettingsProps> = ({ communityId: _communityId }) => {
  const [settings, setSettings] = useState({
    autoModEnabled: true,
    spamFilter: true,
    linkFilter: false,
    profanityFilter: true,
    slowMode: false,
    slowModeInterval: 10,
    requireVerification: false,
  });

  const handleToggle = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Auto-Moderation</h3>
        <div className="space-y-4">
          <SettingToggle
            label="Enable Auto-Moderation"
            description="Automatically moderate messages based on configured rules"
            enabled={settings.autoModEnabled}
            onToggle={() => handleToggle('autoModEnabled')}
          />
          <SettingToggle
            label="Spam Filter"
            description="Automatically detect and remove spam messages"
            enabled={settings.spamFilter}
            onToggle={() => handleToggle('spamFilter')}
            disabled={!settings.autoModEnabled}
          />
          <SettingToggle
            label="Link Filter"
            description="Require approval for messages containing links"
            enabled={settings.linkFilter}
            onToggle={() => handleToggle('linkFilter')}
            disabled={!settings.autoModEnabled}
          />
          <SettingToggle
            label="Profanity Filter"
            description="Filter out inappropriate language"
            enabled={settings.profanityFilter}
            onToggle={() => handleToggle('profanityFilter')}
            disabled={!settings.autoModEnabled}
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Chat Settings</h3>
        <div className="space-y-4">
          <SettingToggle
            label="Slow Mode"
            description="Limit how often users can send messages"
            enabled={settings.slowMode}
            onToggle={() => handleToggle('slowMode')}
          />
          {settings.slowMode && (
            <div className="ml-4">
              <label className="block text-sm text-gray-400 mb-1">Interval (seconds)</label>
              <input
                type="number"
                value={settings.slowModeInterval}
                onChange={(e) => setSettings((prev) => ({ ...prev, slowModeInterval: parseInt(e.target.value) || 10 }))}
                min={5}
                max={300}
                className="w-32 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          )}
          <SettingToggle
            label="Require Verification"
            description="Only verified members can send messages"
            enabled={settings.requireVerification}
            onToggle={() => handleToggle('requireVerification')}
          />
        </div>
      </div>
    </div>
  );
};

// ============================================
// SETTING TOGGLE
// ============================================

interface SettingToggleProps {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

const SettingToggle: React.FC<SettingToggleProps> = ({
  label,
  description,
  enabled,
  onToggle,
  disabled = false,
}) => {
  return (
    <div className={`flex items-center justify-between p-4 bg-gray-700/30 rounded-lg ${disabled ? 'opacity-50' : ''}`}>
      <div>
        <p className="text-white font-medium">{label}</p>
        <p className="text-sm text-gray-400">{description}</p>
      </div>
      <button
        onClick={onToggle}
        disabled={disabled}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          enabled ? 'bg-purple-600' : 'bg-gray-600'
        } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span
          className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-6' : ''
          }`}
        />
      </button>
    </div>
  );
};

export default ModerationPanel;
