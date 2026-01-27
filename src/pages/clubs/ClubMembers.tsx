import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { clubsAPI } from '../../api/clubs';
import type { ClubMember } from '../../types';
import BulkEmailModal from '../../components/BulkEmailModal';
import {
  ChevronLeft,
  Search,
  Filter,
  Download,
  Mail,
  UserCheck,
  UserX,
  Users,
  Shield,
} from 'lucide-react';

export default function ClubMembers() {
  const { id } = useParams<{ id: string }>();
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<ClubMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showBulkEmailModal, setShowBulkEmailModal] = useState(false);
  const [showRoleChangeModal, setShowRoleChangeModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, [id]);

  useEffect(() => {
    filterMembers();
  }, [members, searchQuery, roleFilter, statusFilter]);

  const fetchMembers = async () => {
    if (!id) return;
    try {
      const data = await clubsAPI.getMembers(parseInt(id));
      setMembers(data.members || []);
    } catch (error) {
      console.error('Failed to fetch members:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterMembers = () => {
    let filtered = [...members];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (m) =>
          m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter((m) => m.role === roleFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((m) => m.membership_status === statusFilter);
    }

    setFilteredMembers(filtered);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredMembers.map((m) => m.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkRemove = async () => {
    if (!id || selectedIds.size === 0) return;

    if (!confirm(`Remove ${selectedIds.size} member(s) from the club?`)) return;

    setActionLoading(true);
    try {
      await clubsAPI.bulkMemberAction(parseInt(id), {
        action: 'remove',
        member_ids: Array.from(selectedIds),
      });
      alert(`Successfully removed ${selectedIds.size} member(s)`);
      setSelectedIds(new Set());
      fetchMembers();
    } catch (error) {
      console.error('Failed to remove members:', error);
      alert('Failed to remove members. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRoleChange = async (newRole: 'member' | 'admin' | 'coach') => {
    if (!id || selectedIds.size === 0) return;

    setActionLoading(true);
    try {
      await clubsAPI.bulkMemberAction(parseInt(id), {
        action: newRole === 'admin' ? 'promote' : 'demote',
        member_ids: Array.from(selectedIds),
        new_role: newRole,
      });
      alert(`Successfully changed role for ${selectedIds.size} member(s)`);
      setSelectedIds(new Set());
      setShowRoleChangeModal(false);
      fetchMembers();
    } catch (error) {
      console.error('Failed to change roles:', error);
      alert('Failed to change roles. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkEmail = async (subject: string, body: string) => {
    if (!id || selectedIds.size === 0) return;

    await clubsAPI.bulkMemberAction(parseInt(id), {
      action: 'email',
      member_ids: Array.from(selectedIds),
      email_subject: subject,
      email_body: body,
    });
  };

  const handleExport = async (format: 'csv' | 'xlsx') => {
    if (!id) return;
    try {
      const blob = await clubsAPI.exportMembers(parseInt(id), format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `club-${id}-members.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export members:', error);
      alert('Failed to export members. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="w-12 h-12 border-4 border-gold-400/30 border-t-gold-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Back Button */}
      <Link
        to={`/clubs/${id}`}
        className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Back to Club</span>
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Members</h1>
          <p className="text-white/60">
            {filteredMembers.length} of {members.length} members
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleExport('csv')}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => handleExport('xlsx')}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-gold-400 focus:outline-none transition-colors"
            />
          </div>

          {/* Role Filter */}
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-gold-400 focus:outline-none transition-colors"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="coach">Coach</option>
              <option value="member">Member</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-gold-400 focus:outline-none transition-colors"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="glass-card p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-gold-400" />
            <span className="text-white font-medium">{selectedIds.size} selected</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowRoleChangeModal(true)}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-400 hover:bg-purple-500/30 transition-colors disabled:opacity-50"
            >
              <Shield className="w-4 h-4" />
              <span>Change Role</span>
            </button>
            <button
              onClick={handleBulkRemove}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
            >
              <UserX className="w-4 h-4" />
              <span>Remove</span>
            </button>
            <button
              onClick={() => setShowBulkEmailModal(true)}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 hover:bg-blue-500/30 transition-colors disabled:opacity-50"
            >
              <Mail className="w-4 h-4" />
              <span>Email</span>
            </button>
          </div>
        </div>
      )}

      {/* Members Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-4 px-4 w-12">
                  <input
                    type="checkbox"
                    checked={
                      filteredMembers.length > 0 &&
                      filteredMembers.every((m) => selectedIds.has(m.id))
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-gold-500 focus:ring-gold-500"
                  />
                </th>
                <th className="text-left py-4 px-4 text-sm font-medium text-white/60">Name</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-white/60">Email</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-white/60">Rating</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-white/60">Role</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-white/60">Status</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-white/60">Joined</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Users className="w-12 h-12 text-white/20" />
                      <p className="text-white/60">
                        {members.length === 0
                          ? 'No members yet'
                          : 'No members match your filters'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => (
                  <tr
                    key={member.id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(member.id)}
                        onChange={(e) => handleSelectOne(member.id, e.target.checked)}
                        className="w-4 h-4 rounded border-white/20 bg-white/5 text-gold-500 focus:ring-gold-500"
                      />
                    </td>
                    <td className="py-3 px-4 text-white font-medium">{member.name}</td>
                    <td className="py-3 px-4 text-white/80 text-sm">{member.email}</td>
                    <td className="py-3 px-4 text-white/80 text-sm">
                      {member.rating || 'Unrated'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          member.role === 'admin'
                            ? 'bg-purple-500/20 text-purple-400'
                            : member.role === 'coach'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-gray-500/20 text-gray-400'
                        }`}
                      >
                        {member.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          member.membership_status === 'active'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-gray-500/20 text-gray-400'
                        }`}
                      >
                        {member.membership_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-white/80 text-sm">
                      {formatDate(member.joined_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Change Modal */}
      {showRoleChangeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass-card p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-white mb-4">
              Change Role for {selectedIds.size} Member(s)
            </h2>
            <p className="text-white/60 mb-6">Select the new role:</p>
            <div className="space-y-3 mb-6">
              <button
                onClick={() => handleRoleChange('admin')}
                disabled={actionLoading}
                className="w-full flex items-center gap-3 px-4 py-3 bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-400 hover:bg-purple-500/30 transition-colors disabled:opacity-50"
              >
                <Shield className="w-5 h-5" />
                <span className="font-medium">Admin</span>
              </button>
              <button
                onClick={() => handleRoleChange('coach')}
                disabled={actionLoading}
                className="w-full flex items-center gap-3 px-4 py-3 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 hover:bg-blue-500/30 transition-colors disabled:opacity-50"
              >
                <UserCheck className="w-5 h-5" />
                <span className="font-medium">Coach</span>
              </button>
              <button
                onClick={() => handleRoleChange('member')}
                disabled={actionLoading}
                className="w-full flex items-center gap-3 px-4 py-3 bg-gray-500/20 border border-gray-500/30 rounded-lg text-gray-400 hover:bg-gray-500/30 transition-colors disabled:opacity-50"
              >
                <Users className="w-5 h-5" />
                <span className="font-medium">Member</span>
              </button>
            </div>
            <button
              onClick={() => setShowRoleChangeModal(false)}
              className="w-full px-6 py-3 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Bulk Email Modal */}
      <BulkEmailModal
        isOpen={showBulkEmailModal}
        onClose={() => setShowBulkEmailModal(false)}
        onSend={handleBulkEmail}
        recipientCount={selectedIds.size}
        recipientType="members"
      />
    </div>
  );
}
