import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { tournamentsAPI } from '../../api/tournaments';
import type { Participant } from '../../types';
import BulkEmailModal from '../../components/BulkEmailModal';
import {
  ChevronLeft,
  Search,
  Filter,
  Download,
  Mail,
  CheckCircle,
  XCircle,
  RefreshCw,
  Users,
} from 'lucide-react';

export default function TournamentParticipants() {
  const { id } = useParams<{ id: string }>();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [filteredParticipants, setFilteredParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [showBulkEmailModal, setShowBulkEmailModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchParticipants();
  }, [id]);

  useEffect(() => {
    filterParticipants();
  }, [participants, searchQuery, statusFilter, paymentFilter]);

  const fetchParticipants = async () => {
    if (!id) return;
    try {
      const data = await tournamentsAPI.getParticipants(parseInt(id));
      setParticipants(data.participants || []);
    } catch (error) {
      console.error('Failed to fetch participants:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterParticipants = () => {
    let filtered = [...participants];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }

    // Payment filter
    if (paymentFilter !== 'all') {
      filtered = filtered.filter((p) => p.payment_status === paymentFilter);
    }

    setFilteredParticipants(filtered);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredParticipants.map((p) => p.id)));
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

  const handleBulkAction = async (action: 'approve' | 'reject' | 'refund') => {
    if (!id || selectedIds.size === 0) return;

    const confirmMessage =
      action === 'approve'
        ? `Approve ${selectedIds.size} participant(s)?`
        : action === 'reject'
        ? `Reject ${selectedIds.size} participant(s)?`
        : `Process refund for ${selectedIds.size} participant(s)?`;

    if (!confirm(confirmMessage)) return;

    setActionLoading(true);
    try {
      await tournamentsAPI.bulkParticipantAction(parseInt(id), {
        action,
        participant_ids: Array.from(selectedIds),
      });
      alert(`Successfully ${action}ed ${selectedIds.size} participant(s)`);
      setSelectedIds(new Set());
      fetchParticipants();
    } catch (error) {
      console.error(`Failed to ${action} participants:`, error);
      alert(`Failed to ${action} participants. Please try again.`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkEmail = async (subject: string, body: string) => {
    if (!id || selectedIds.size === 0) return;

    await tournamentsAPI.bulkParticipantAction(parseInt(id), {
      action: 'email',
      participant_ids: Array.from(selectedIds),
      email_subject: subject,
      email_body: body,
    });
  };

  const handleExport = async (format: 'csv' | 'xlsx') => {
    if (!id) return;
    try {
      const blob = await tournamentsAPI.exportParticipants(parseInt(id), format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tournament-${id}-participants.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export participants:', error);
      alert('Failed to export participants. Please try again.');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount / 100);
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
        to={`/tournaments/${id}`}
        className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Back to Tournament</span>
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Participants</h1>
          <p className="text-white/60">
            {filteredParticipants.length} of {participants.length} participants
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

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-gold-400 focus:outline-none transition-colors"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Payment Filter */}
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-gold-400 focus:outline-none transition-colors"
            >
              <option value="all">All Payments</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="refunded">Refunded</option>
              <option value="failed">Failed</option>
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
              onClick={() => handleBulkAction('approve')}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 hover:bg-green-500/30 transition-colors disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Approve</span>
            </button>
            <button
              onClick={() => handleBulkAction('reject')}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              <span>Reject</span>
            </button>
            <button
              onClick={() => handleBulkAction('refund')}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-yellow-400 hover:bg-yellow-500/30 transition-colors disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refund</span>
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

      {/* Participants Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-4 px-4 w-12">
                  <input
                    type="checkbox"
                    checked={
                      filteredParticipants.length > 0 &&
                      filteredParticipants.every((p) => selectedIds.has(p.id))
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-gold-500 focus:ring-gold-500"
                  />
                </th>
                <th className="text-left py-4 px-4 text-sm font-medium text-white/60">Name</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-white/60">Email</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-white/60">Rating</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-white/60">Status</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-white/60">Payment</th>
                <th className="text-right py-4 px-4 text-sm font-medium text-white/60">Amount</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-white/60">Registered</th>
              </tr>
            </thead>
            <tbody>
              {filteredParticipants.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Users className="w-12 h-12 text-white/20" />
                      <p className="text-white/60">
                        {participants.length === 0
                          ? 'No participants yet'
                          : 'No participants match your filters'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredParticipants.map((participant) => (
                  <tr
                    key={participant.id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(participant.id)}
                        onChange={(e) => handleSelectOne(participant.id, e.target.checked)}
                        className="w-4 h-4 rounded border-white/20 bg-white/5 text-gold-500 focus:ring-gold-500"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-white font-medium">{participant.name}</div>
                      {participant.country && (
                        <div className="text-xs text-white/60">{participant.country}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-white/80 text-sm">{participant.email}</td>
                    <td className="py-3 px-4 text-white/80 text-sm">
                      {participant.rating || 'Unrated'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          participant.status === 'approved'
                            ? 'bg-green-500/20 text-green-400'
                            : participant.status === 'pending'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {participant.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          participant.payment_status === 'paid'
                            ? 'bg-green-500/20 text-green-400'
                            : participant.payment_status === 'pending'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : participant.payment_status === 'refunded'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {participant.payment_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-white font-semibold text-sm">
                      {formatCurrency(participant.payment_amount)}
                    </td>
                    <td className="py-3 px-4 text-white/80 text-sm">
                      {formatDate(participant.registered_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Email Modal */}
      <BulkEmailModal
        isOpen={showBulkEmailModal}
        onClose={() => setShowBulkEmailModal(false)}
        onSend={handleBulkEmail}
        recipientCount={selectedIds.size}
        recipientType="participants"
      />
    </div>
  );
}
