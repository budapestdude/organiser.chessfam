import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { tournamentsAPI } from '../../api/tournaments';
import type { Tournament } from '../../types';
import { ChevronLeft, Users, BarChart3, Calendar, MapPin, Trophy } from 'lucide-react';
import { format } from 'date-fns';
import TournamentAnalytics from './TournamentAnalytics';

export default function TournamentDetail() {
  const { id } = useParams<{ id: string }>();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'participants' | 'analytics'>('overview');

  useEffect(() => {
    const fetchTournament = async () => {
      if (!id) return;
      try {
        const data = await tournamentsAPI.getTournamentById(parseInt(id));
        setTournament(data);
      } catch (error) {
        console.error('Failed to fetch tournament:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTournament();
  }, [id]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="w-12 h-12 border-4 border-gold-400/30 border-t-gold-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="glass-card p-12 text-center">
        <h3 className="text-xl font-semibold text-white mb-2">Tournament not found</h3>
        <p className="text-white/60 mb-6">This tournament may have been deleted or you don't have access to it.</p>
        <Link
          to="/tournaments"
          className="inline-flex px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-chess-darker font-semibold rounded-lg hover:from-gold-400 hover:to-gold-500 transition-all"
        >
          Back to Tournaments
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Back Button */}
      <Link
        to="/tournaments"
        className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Back to Tournaments</span>
      </Link>

      {/* Header */}
      <div className="glass-card p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-white">{tournament.name}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(tournament.status)}`}>
                {tournament.status}
              </span>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-white/60">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{format(new Date(tournament.start_date), 'MMMM d, yyyy')}</span>
              </div>
              {tournament.city && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{tournament.city}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                <span>{tournament.tournament_type}</span>
              </div>
            </div>
          </div>
          <a
            href={`${import.meta.env.VITE_MAIN_APP_URL}/tournaments/${tournament.id}/edit`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors"
          >
            Edit
          </a>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
          <div>
            <p className="text-xs text-white/40 mb-1">Participants</p>
            <p className="text-lg font-semibold text-white">
              {tournament.current_participants} / {tournament.max_participants}
            </p>
          </div>
          <div>
            <p className="text-xs text-white/40 mb-1">Entry Fee</p>
            <p className="text-lg font-semibold text-white">
              {formatCurrency(tournament.entry_fee / 100)}
            </p>
          </div>
          <div>
            <p className="text-xs text-white/40 mb-1">Format</p>
            <p className="text-lg font-semibold text-white">{tournament.format}</p>
          </div>
          <div>
            <p className="text-xs text-white/40 mb-1">Time Control</p>
            <p className="text-lg font-semibold text-white">{tournament.time_control}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/10 mb-6">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-gold-500 text-gold-500'
                : 'border-transparent text-white/60 hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Overview</span>
          </button>
          <button
            onClick={() => setActiveTab('participants')}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors ${
              activeTab === 'participants'
                ? 'border-gold-500 text-gold-500'
                : 'border-transparent text-white/60 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Participants</span>
            <span className="px-2 py-0.5 bg-white/10 rounded-full text-xs">
              {tournament.current_participants}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors ${
              activeTab === 'analytics'
                ? 'border-gold-500 text-gold-500'
                : 'border-transparent text-white/60 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Analytics</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="glass-card p-6">
          <h2 className="text-xl font-bold text-white mb-4">Tournament Details</h2>

          {tournament.description && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-white/60 mb-2">Description</h3>
              <p className="text-white">{tournament.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-white/60 mb-2">Registration Deadline</h3>
              <p className="text-white">{format(new Date(tournament.registration_deadline), 'MMMM d, yyyy')}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-white/60 mb-2">End Date</h3>
              <p className="text-white">{format(new Date(tournament.end_date), 'MMMM d, yyyy')}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-white/60 mb-2">Currency</h3>
              <p className="text-white">{tournament.currency}</p>
            </div>
            {tournament.venue_name && (
              <div>
                <h3 className="text-sm font-medium text-white/60 mb-2">Venue</h3>
                <p className="text-white">{tournament.venue_name}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'participants' && (
        <div className="glass-card p-6">
          <h2 className="text-xl font-bold text-white mb-4">Participants</h2>
          <p className="text-white/60">Participant management coming in Phase 3...</p>
        </div>
      )}

      {activeTab === 'participants' && (
        <div className="glass-card p-6">
          <h2 className="text-xl font-bold text-white mb-4">Participants</h2>
          <p className="text-white/60 mb-6">Manage tournament registrations, approvals, and payments.</p>
          <Link
            to={`/tournaments/${id}/participants`}
            className="inline-flex px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-chess-darker font-semibold rounded-lg hover:from-gold-400 hover:to-gold-500 transition-all duration-300 transform hover:scale-105"
          >
            View & Manage Participants
          </Link>
        </div>
      )}

      {activeTab === 'analytics' && (
        <TournamentAnalytics tournamentId={parseInt(id!)} />
      )}
    </div>
  );
}
