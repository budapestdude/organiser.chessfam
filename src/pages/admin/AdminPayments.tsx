import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, DollarSign } from 'lucide-react';
import DataTable from '../../components/admin/DataTable';
import * as adminApi from '../../api/admin';

interface Payment {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  booking_id: number | null;
  tournament_id: number | null;
  booking_date: string | null;
  tournament_name: string | null;
  amount: number;
  currency: string;
  status: string;
  payment_type: string;
  refund_amount: number | null;
  created_at: string;
}

export default function AdminPayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [refundModal, setRefundModal] = useState<Payment | null>(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getPayments({
        page: pagination.page,
        limit: pagination.limit,
        status: status || undefined,
      });
      setPayments(res.data.payments);
      setPagination(prev => ({ ...prev, ...res.data.pagination }));
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, status]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleRefund = async () => {
    if (!refundModal) return;

    try {
      const amount = refundAmount ? parseInt(refundAmount) * 100 : undefined; // Convert to cents
      await adminApi.refundPayment(refundModal.id, amount, refundReason);
      setRefundModal(null);
      setRefundAmount('');
      setRefundReason('');
      fetchPayments();
    } catch (error) {
      console.error('Failed to process refund:', error);
    }
  };

  const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const getStatusColor = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'succeeded':
        return 'bg-green-500/20 text-green-400';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'failed':
        return 'bg-red-500/20 text-red-400';
      case 'refunded':
        return 'bg-purple-500/20 text-purple-400';
      case 'partially_refunded':
        return 'bg-orange-500/20 text-orange-400';
      default:
        return 'bg-white/10 text-white/40';
    }
  };

  const columns = [
    {
      key: 'id',
      header: 'ID',
      width: '80px',
      render: (payment: Payment) => (
        <span className="text-white/40">#{payment.id}</span>
      ),
    },
    {
      key: 'user',
      header: 'User',
      render: (payment: Payment) => (
        <div>
          <p className="text-white/80">{payment.user_name}</p>
          <p className="text-xs text-white/40">{payment.user_email}</p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (payment: Payment) => (
        <div>
          <p className="text-white/80 capitalize">{payment.payment_type.replace('_', ' ')}</p>
          <p className="text-xs text-white/40">
            {payment.tournament_name || (payment.booking_date && `Booking on ${new Date(payment.booking_date).toLocaleDateString()}`)}
          </p>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (payment: Payment) => (
        <div>
          <p className="text-green-400 font-medium">{formatCurrency(payment.amount)}</p>
          {payment.refund_amount && (
            <p className="text-xs text-red-400">Refunded: {formatCurrency(payment.refund_amount)}</p>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (payment: Payment) => (
        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(payment.status)}`}>
          {payment.status.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Date',
      render: (payment: Payment) => (
        <span className="text-white/40 text-sm">{new Date(payment.created_at).toLocaleDateString()}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '80px',
      render: (payment: Payment) => (
        payment.status === 'succeeded' && (
          <button
            onClick={() => setRefundModal(payment)}
            className="p-2 rounded-lg hover:bg-purple-500/20 text-purple-400 transition-colors"
            title="Refund"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )
      ),
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-8">Payments</h1>

      {/* Filters */}
      <div className="mb-6">
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPagination(prev => ({ ...prev, page: 1 }));
          }}
          className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="">All Payments</option>
          <option value="succeeded">Succeeded</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={payments}
        loading={loading}
        pagination={pagination}
        onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
        emptyMessage="No payments found"
      />

      {/* Refund Modal */}
      {refundModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1a1a2e] rounded-xl p-6 w-full max-w-md border border-white/10">
            <h3 className="text-xl font-bold text-white mb-4">Process Refund</h3>
            <div className="bg-white/5 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/60">Payment ID:</span>
                <span className="text-white">#{refundModal.id}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/60">User:</span>
                <span className="text-white">{refundModal.user_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/60">Amount:</span>
                <span className="text-green-400 font-medium">{formatCurrency(refundModal.amount)}</span>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-white/60 text-sm mb-2">
                Refund Amount (leave empty for full refund)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  placeholder={`${(refundModal.amount / 100).toFixed(2)}`}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-white/60 text-sm mb-2">Reason (optional)</label>
              <textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Reason for refund..."
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setRefundModal(null);
                  setRefundAmount('');
                  setRefundReason('');
                }}
                className="px-4 py-2 text-white/60 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRefund}
                className="px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white font-medium transition-colors"
              >
                Process Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
