import { useEffect, useState, useCallback } from 'react';
import { Search, Ban, Shield, Trash2, ShieldCheck, MoreVertical } from 'lucide-react';
import DataTable from '../../components/admin/DataTable';
import * as adminApi from '../../api/admin';

interface User {
  id: number;
  name: string;
  email: string;
  rating: number;
  avatar: string | null;
  is_admin: boolean;
  email_verified: boolean;
  identity_verified: boolean;
  is_banned: boolean;
  ban_reason: string | null;
  created_at: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [actionModal, setActionModal] = useState<{
    type: 'ban' | 'unban' | 'delete' | 'promote' | 'verify' | 'revoke_verification' | null;
    user: User | null;
  }>({ type: null, user: null });
  const [actionReason, setActionReason] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getUsers({
        page: pagination.page,
        limit: pagination.limit,
        search: search || undefined,
        status: status !== 'all' ? status : undefined,
      });
      setUsers(res.data.users);
      setPagination(prev => ({ ...prev, ...res.data.pagination }));
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, status]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleAction = async () => {
    if (!actionModal.user) return;

    try {
      switch (actionModal.type) {
        case 'ban':
          await adminApi.banUser(actionModal.user.id, actionReason);
          break;
        case 'unban':
          await adminApi.unbanUser(actionModal.user.id);
          break;
        case 'delete':
          await adminApi.deleteUser(actionModal.user.id);
          break;
        case 'promote':
          await adminApi.updateUser(actionModal.user.id, { is_admin: !actionModal.user.is_admin });
          break;
        case 'verify':
          await adminApi.verifyUser(actionModal.user.id, actionReason);
          break;
        case 'revoke_verification':
          if (!actionReason) {
            alert('Reason is required to revoke verification');
            return;
          }
          await adminApi.revokeUserVerification(actionModal.user.id, actionReason);
          break;
      }
      setActionModal({ type: null, user: null });
      setActionReason('');
      fetchUsers();
    } catch (error) {
      console.error('Action failed:', error);
    }
  };

  const columns = [
    {
      key: 'user',
      header: 'User',
      render: (user: User) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-medium overflow-hidden">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              user.name.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <p className="font-medium text-white">{user.name}</p>
            <p className="text-xs text-white/40">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'rating',
      header: 'Rating',
      render: (user: User) => (
        <span className="text-yellow-400">{user.rating}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (user: User) => (
        <div className="flex flex-wrap items-center gap-1">
          {user.is_admin && (
            <span className="px-2 py-0.5 text-xs bg-purple-500/20 text-purple-400 rounded-full">Admin</span>
          )}
          {user.email_verified ? (
            <span className="px-2 py-0.5 text-xs bg-green-500/20 text-green-400 rounded-full">Email ✓</span>
          ) : (
            <span className="px-2 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 rounded-full">Email ✗</span>
          )}
          {user.identity_verified ? (
            <span className="px-2 py-0.5 text-xs bg-blue-500/20 text-blue-400 rounded-full">ID ✓</span>
          ) : (
            <span className="px-2 py-0.5 text-xs bg-gray-500/20 text-gray-400 rounded-full">ID ✗</span>
          )}
          {user.is_banned && (
            <span className="px-2 py-0.5 text-xs bg-red-500/20 text-red-400 rounded-full">Banned</span>
          )}
        </div>
      ),
    },
    {
      key: 'created_at',
      header: 'Joined',
      render: (user: User) => (
        <span className="text-white/60">{new Date(user.created_at).toLocaleDateString()}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '60px',
      render: (user: User) => (
        <div className="relative group">
          <button className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors">
            <MoreVertical className="w-4 h-4" />
          </button>
          <div className="absolute right-0 top-full mt-1 w-40 bg-[#252540] rounded-lg shadow-lg border border-white/10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
            {user.is_banned ? (
              <button
                onClick={() => setActionModal({ type: 'unban', user })}
                className="w-full px-4 py-2 text-left text-sm text-green-400 hover:bg-white/5 flex items-center gap-2"
              >
                <Shield className="w-4 h-4" />
                Unban
              </button>
            ) : (
              <button
                onClick={() => setActionModal({ type: 'ban', user })}
                className="w-full px-4 py-2 text-left text-sm text-yellow-400 hover:bg-white/5 flex items-center gap-2"
              >
                <Ban className="w-4 h-4" />
                Ban
              </button>
            )}
            <button
              onClick={() => setActionModal({ type: 'promote', user })}
              className="w-full px-4 py-2 text-left text-sm text-purple-400 hover:bg-white/5 flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              {user.is_admin ? 'Remove Admin' : 'Make Admin'}
            </button>
            {user.identity_verified ? (
              <button
                onClick={() => setActionModal({ type: 'revoke_verification', user })}
                className="w-full px-4 py-2 text-left text-sm text-orange-400 hover:bg-white/5 flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                Revoke Verification
              </button>
            ) : (
              <button
                onClick={() => setActionModal({ type: 'verify', user })}
                className="w-full px-4 py-2 text-left text-sm text-blue-400 hover:bg-white/5 flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                Verify Identity
              </button>
            )}
            <button
              onClick={() => setActionModal({ type: 'delete', user })}
              className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-white/5 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-8">User Management</h1>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </form>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPagination(prev => ({ ...prev, page: 1 }));
          }}
          className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="all">All Users</option>
          <option value="verified">Verified</option>
          <option value="unverified">Unverified</option>
          <option value="banned">Banned</option>
        </select>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        pagination={pagination}
        onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
        emptyMessage="No users found"
      />

      {/* Action Modal */}
      {actionModal.type && actionModal.user && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1a1a2e] rounded-xl p-6 w-full max-w-md border border-white/10">
            <h3 className="text-xl font-bold text-white mb-4">
              {actionModal.type === 'ban' && 'Ban User'}
              {actionModal.type === 'unban' && 'Unban User'}
              {actionModal.type === 'delete' && 'Delete User'}
              {actionModal.type === 'promote' && (actionModal.user.is_admin ? 'Remove Admin' : 'Make Admin')}
              {actionModal.type === 'verify' && 'Verify User Identity'}
              {actionModal.type === 'revoke_verification' && 'Revoke Identity Verification'}
            </h3>
            <p className="text-white/60 mb-4">
              {actionModal.type === 'ban' && `Are you sure you want to ban ${actionModal.user.name}?`}
              {actionModal.type === 'unban' && `Are you sure you want to unban ${actionModal.user.name}?`}
              {actionModal.type === 'delete' && `Are you sure you want to permanently delete ${actionModal.user.name}? This cannot be undone.`}
              {actionModal.type === 'promote' && `Are you sure you want to ${actionModal.user.is_admin ? 'remove admin privileges from' : 'make'} ${actionModal.user.name} ${actionModal.user.is_admin ? '' : 'an admin'}?`}
              {actionModal.type === 'verify' && `Verify ${actionModal.user.name}'s identity without requiring an application. This will grant them verified status.`}
              {actionModal.type === 'revoke_verification' && `Revoke identity verification for ${actionModal.user.name}. This will remove their verified status.`}
            </p>

            {(actionModal.type === 'ban' || actionModal.type === 'verify' || actionModal.type === 'revoke_verification') && (
              <textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder={
                  actionModal.type === 'ban'
                    ? "Reason for ban (required)..."
                    : actionModal.type === 'verify'
                    ? "Reason for verification (optional)..."
                    : "Reason for revocation (required)..."
                }
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
                rows={3}
              />
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setActionModal({ type: null, user: null });
                  setActionReason('');
                }}
                className="px-4 py-2 text-white/60 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAction}
                disabled={(actionModal.type === 'ban' || actionModal.type === 'revoke_verification') && !actionReason}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  actionModal.type === 'delete'
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : actionModal.type === 'verify'
                    ? 'bg-blue-500 hover:bg-blue-600 text-white'
                    : actionModal.type === 'revoke_verification'
                    ? 'bg-orange-500 hover:bg-orange-600 text-white'
                    : 'bg-purple-500 hover:bg-purple-600 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
