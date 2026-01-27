import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../store';
import { Building2, Users, Euro, Calendar, Search, Filter } from 'lucide-react';

export default function ClubsList() {
  const { clubs, clubsLoading, fetchClubs } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchClubs();
  }, [fetchClubs]);

  const formatCurrency = (amount: number) => {
    if (!amount) return '€0';
    return new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  // Filter clubs
  const filteredClubs = clubs.filter(club => {
    const matchesSearch = club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         club.city?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' ||
                         (statusFilter === 'active' && club.is_active) ||
                         (statusFilter === 'inactive' && !club.is_active);
    return matchesSearch && matchesStatus;
  });

  if (clubsLoading && clubs.length === 0) {
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
          <h1 className="text-3xl font-bold text-white mb-2">My Clubs</h1>
          <p className="text-white/60">Manage your chess clubs</p>
        </div>
        <a
          href={`${import.meta.env.VITE_MAIN_APP_URL}/clubs/create`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-chess-darker font-semibold rounded-lg hover:from-gold-400 hover:to-gold-500 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-gold-500/25"
        >
          Create Club
        </a>
      </div>

      {/* Filters */}
      <div className="glass-card p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clubs..."
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
              <option value="all">All Clubs</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Club Grid */}
      {filteredClubs.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Building2 className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No clubs found</h3>
          <p className="text-white/60 mb-6">
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Create your first club to get started'}
          </p>
          {!searchQuery && statusFilter === 'all' && (
            <a
              href={`${import.meta.env.VITE_MAIN_APP_URL}/clubs/create`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-chess-darker font-semibold rounded-lg hover:from-gold-400 hover:to-gold-500 transition-all"
            >
              Create Club
            </a>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredClubs.map((club) => (
            <Link
              key={club.id}
              to={`/clubs/${club.id}`}
              className="glass-card p-6 hover:bg-white/10 transition-all group"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-white mb-1 truncate group-hover:text-gold-400 transition-colors">
                    {club.name}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <span>{club.city}</span>
                    {club.country && <span>• {club.country}</span>}
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  club.is_active
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-gray-500/20 text-gray-400'
                }`}>
                  {club.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
                <div>
                  <div className="flex items-center gap-2 text-white/40 text-xs mb-1">
                    <Users className="w-3 h-3" />
                    <span>Members</span>
                  </div>
                  <p className="text-white font-semibold">{club.member_count || 0}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-white/40 text-xs mb-1">
                    <Euro className="w-3 h-3" />
                    <span>Fee</span>
                  </div>
                  <p className="text-white font-semibold">
                    {club.membership_fee ? formatCurrency(club.membership_fee / 100) : 'Free'}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-white/40 text-xs mb-1">
                    <Calendar className="w-3 h-3" />
                    <span>Founded</span>
                  </div>
                  <p className="text-white font-semibold">{club.founded_year || 'N/A'}</p>
                </div>
              </div>

              {/* Description */}
              {club.description && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-sm text-white/60 line-clamp-2">{club.description}</p>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* Summary */}
      {filteredClubs.length > 0 && (
        <div className="mt-6 text-center text-sm text-white/50">
          Showing {filteredClubs.length} of {clubs.length} club{clubs.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
