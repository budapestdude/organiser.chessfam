import { useEffect, useState } from 'react';
import { useStore } from '../../store';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Euro, TrendingUp, TrendingDown, Calendar, Download, Building2, Trophy } from 'lucide-react';

export default function FinancialReports() {
  const { financialData, financialsLoading, fetchFinancials } = useStore();

  // Default to last 12 months
  const defaultTo = new Date().toISOString().split('T')[0];
  const defaultFrom = new Date(new Date().setMonth(new Date().getMonth() - 12)).toISOString().split('T')[0];

  const [dateFrom, setDateFrom] = useState(defaultFrom);
  const [dateTo, setDateTo] = useState(defaultTo);

  useEffect(() => {
    fetchFinancials(dateFrom, dateTo);
  }, [dateFrom, dateTo, fetchFinancials]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const exportToCSV = () => {
    if (!financialData?.transactions) return;

    const headers = ['Date', 'Type', 'Event', 'Participant', 'Amount', 'Status'];
    const rows = financialData.transactions.map(t => [
      formatDate(t.date),
      t.type,
      t.event_name,
      t.participant_name,
      t.amount,
      t.status,
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-report-${dateFrom}-to-${dateTo}.csv`;
    a.click();
  };

  if (financialsLoading && !financialData) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="w-12 h-12 border-4 border-gold-400/30 border-t-gold-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Financial Reports</h1>
          <p className="text-white/60">Track revenue and transactions across all events</p>
        </div>
        <button
          onClick={exportToCSV}
          disabled={!financialData?.transactions?.length}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Date Range Filter */}
      <div className="glass-card p-6 mb-6">
        <div className="flex items-center gap-4">
          <Calendar className="w-5 h-5 text-gold-400" />
          <span className="text-white font-medium">Date Range:</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-gold-400 focus:outline-none transition-colors"
          />
          <span className="text-white/60">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-gold-400 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {!financialData ? (
        <div className="glass-card p-12 text-center">
          <h3 className="text-xl font-semibold text-white mb-2">No financial data available</h3>
          <p className="text-white/60">Financial data will appear once you have events with transactions.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <p className="text-white/60 text-sm">Total Revenue</p>
              </div>
              <p className="text-3xl font-bold text-white">
                {formatCurrency(financialData.summary.total_revenue)}
              </p>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <TrendingDown className="w-5 h-5 text-red-400" />
                </div>
                <p className="text-white/60 text-sm">Total Refunds</p>
              </div>
              <p className="text-3xl font-bold text-white">
                {formatCurrency(financialData.summary.total_refunds)}
              </p>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gold-500/20 rounded-lg">
                  <Euro className="w-5 h-5 text-gold-400" />
                </div>
                <p className="text-white/60 text-sm">Net Revenue</p>
              </div>
              <p className="text-3xl font-bold text-white">
                {formatCurrency(financialData.summary.net_revenue)}
              </p>
            </div>
          </div>

          {/* Monthly Revenue Chart */}
          {financialData.by_month && financialData.by_month.length > 0 && (
            <div className="glass-card p-6">
              <h2 className="text-xl font-bold text-white mb-6">Monthly Revenue</h2>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={financialData.by_month}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis
                    dataKey="month"
                    stroke="rgba(255,255,255,0.6)"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis
                    stroke="rgba(255,255,255,0.6)"
                    style={{ fontSize: '12px' }}
                    tickFormatter={(value) => `€${value}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a2e',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend />
                  <Bar
                    dataKey="revenue"
                    fill="#10b981"
                    name="Revenue"
                    radius={[8, 8, 0, 0]}
                  />
                  <Bar
                    dataKey="refunds"
                    fill="#ef4444"
                    name="Refunds"
                    radius={[8, 8, 0, 0]}
                  />
                  <Bar
                    dataKey="net"
                    fill="#fbbf24"
                    name="Net"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Event Breakdown */}
          {financialData.by_event && financialData.by_event.length > 0 && (
            <div className="glass-card p-6">
              <h2 className="text-xl font-bold text-white mb-6">Revenue by Event</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-sm font-medium text-white/60">Event</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-white/60">Type</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-white/60">Participants</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-white/60">Revenue</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-white/60">Refunds</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-white/60">Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {financialData.by_event.map((event) => (
                      <tr key={event.event_id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {event.type === 'tournament' ? (
                              <Trophy className="w-4 h-4 text-gold-400" />
                            ) : (
                              <Building2 className="w-4 h-4 text-blue-400" />
                            )}
                            <span className="text-white">{event.event_name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            event.type === 'tournament'
                              ? 'bg-gold-500/20 text-gold-400'
                              : 'bg-blue-500/20 text-blue-400'
                          }`}>
                            {event.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-white">{event.participants}</td>
                        <td className="py-3 px-4 text-right text-green-400 font-semibold">
                          {formatCurrency(event.revenue)}
                        </td>
                        <td className="py-3 px-4 text-right text-red-400">
                          {formatCurrency(event.refunds)}
                        </td>
                        <td className="py-3 px-4 text-right text-white font-semibold">
                          {formatCurrency(event.revenue - event.refunds)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Transaction History */}
          {financialData.transactions && financialData.transactions.length > 0 && (
            <div className="glass-card p-6">
              <h2 className="text-xl font-bold text-white mb-6">Recent Transactions</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-sm font-medium text-white/60">Date</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-white/60">Type</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-white/60">Event</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-white/60">Participant</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-white/60">Amount</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-white/60">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {financialData.transactions.slice(0, 50).map((transaction) => (
                      <tr key={transaction.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4 text-white/80 text-sm">{formatDate(transaction.date)}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            transaction.type === 'payment'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {transaction.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-white/80 text-sm">{transaction.event_name}</td>
                        <td className="py-3 px-4 text-white/80 text-sm">{transaction.participant_name}</td>
                        <td className={`py-3 px-4 text-right font-semibold text-sm ${
                          transaction.type === 'payment' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {transaction.type === 'payment' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            transaction.status === 'completed'
                              ? 'bg-green-500/20 text-green-400'
                              : transaction.status === 'pending'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-gray-500/20 text-gray-400'
                          }`}>
                            {transaction.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {financialData.transactions.length > 50 && (
                <p className="text-center text-white/60 text-sm mt-4">
                  Showing 50 of {financialData.transactions.length} transactions
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
