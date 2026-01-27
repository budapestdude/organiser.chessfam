import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../store';
import { Trophy, Users, Euro, Calendar, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';

export default function TournamentsList() {
  const { tournaments, tournamentsLoading, fetchTournaments } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchTournaments();
  }, [fetchTournaments]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-500/20 text-blue-400';
      case 'ongoing':
        return 'bg-green-500/20 text-green-400';
      case 'completed':
        return 'bg-gray-500/20 text-gray-400';
      case 'cancelled':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-white/10 text-white/60';
    }
  };

  // Filter tournaments
  const filteredTournaments = tournaments.filter(tournament => {
    const matchesSearch = tournament.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tournament.city?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || tournament.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (tournamentsLoading && tournaments.length === 0) {
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
          <h1 className="text-3xl font-bold text-white mb-2">My Tournaments</h1>
          <p className="text-white/60">Manage your tournament events</p>
        </div>
        <a
          href={`${import.meta.env.VITE_MAIN_APP_URL}/tournaments/create`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-chess-darker font-semibold rounded-lg hover:from-gold-400 hover:to-gold-500 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-gold-500/25"
        >
          Create Tournament
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
              placeholder="Search tournaments..."
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
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tournament Grid */}
      {filteredTournaments.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Trophy className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No tournaments found</h3>
          <p className="text-white/60 mb-6">
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Create your first tournament to get started'}
          </p>
          {!searchQuery && statusFilter === 'all' && (
            <a
              href={`${import.meta.env.VITE_MAIN_APP_URL}/tournaments/create`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-chess-darker font-semibold rounded-lg hover:from-gold-400 hover:to-gold-500 transition-all"
            >
              Create Tournament
            </a>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredTournaments.map((tournament) => (
            <Link
              key={tournament.id}
              to={`/tournaments/${tournament.id}`}
              className="glass-card p-6 hover:bg-white/10 transition-all group"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-white mb-1 truncate group-hover:text-gold-400 transition-colors">
                    {tournament.name}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <Calendar className="w-4 h-4" />
                    <span>{format(new Date(tournament.start_date), 'MMM d, yyyy')}</span>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(tournament.status)}`}>
                  {tournament.status}
                </span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
                <div>
                  <div className="flex items-center gap-2 text-white/40 text-xs mb-1">
                    <Users className="w-3 h-3" />
                    <span>Participants</span>
                  </div>
                  <p className="text-white font-semibold">
                    {tournament.current_participants} / {tournament.max_participants}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-white/40 text-xs mb-1">
                    <Euro className="w-3 h-3" />
                    <span>Entry Fee</span>
                  </div>
                  <p className="text-white font-semibold">
                    {formatCurrency(tournament.entry_fee / 100)}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-white/40 text-xs mb-1">
                    <Trophy className="w-3 h-3" />
                    <span>Type</span>
                  </div>
                  <p className="text-white font-semibold text-sm truncate">
                    {tournament.tournament_type}
                  </p>
                </div>
              </div>

              {/* Location */}
              {tournament.city && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-sm text-white/60">{tournament.city}</p>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* Summary */}
      {filteredTournaments.length > 0 && (
        <div className="mt-6 text-center text-sm text-white/50">
          Showing {filteredTournaments.length} of {tournaments.length} tournament{tournaments.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
