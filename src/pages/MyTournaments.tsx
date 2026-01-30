import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Calendar, MapPin, Users, Edit, Trash2, Plus, Loader2, Eye } from 'lucide-react';
import { tournamentsApi, type Tournament } from '../api/tournaments';
import { useStore } from '../store';

const MyTournaments = () => {
  const navigate = useNavigate();
  const { user, openAuthModal } = useStore();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user) {
      openAuthModal('login');
      return;
    }

    const fetchTournaments = async () => {
      try {
        setLoading(true);
        const response = await tournamentsApi.getMyTournaments();
        console.log('My Tournaments API Response:', response);
        console.log('My Tournaments data:', response?.data);
        setTournaments(response?.data || []);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch my tournaments:', err);
        setError('Failed to load your tournaments');
      } finally {
        setLoading(false);
      }
    };

    fetchTournaments();
  }, [user, openAuthModal]);

  const handleDelete = async (id: number) => {
    try {
      setDeleting(true);
      await tournamentsApi.deleteTournament(id);
      setTournaments(tournaments.filter(t => t.id !== id));
      setDeleteConfirmId(null);
      setError(null);
    } catch (err: any) {
      console.error('Failed to delete tournament:', err);
      setError(err.response?.data?.error || 'Failed to delete tournament');
    } finally {
      setDeleting(false);
    }
  };

  const typeColors: Record<string, string> = {
    Classical: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    Rapid: 'bg-green-500/20 text-green-400 border-green-500/30',
    Blitz: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    Bullet: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  const statusColors: Record<string, string> = {
    upcoming: 'bg-green-500/20 text-green-400',
    ongoing: 'bg-blue-500/20 text-blue-400',
    completed: 'bg-gray-500/20 text-gray-400',
    cancelled: 'bg-red-500/20 text-red-400',
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen py-8 px-4 md:px-8 lg:px-16 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <h1 className="text-2xl font-display font-bold text-white">My Tournaments</h1>
        <button
          onClick={() => navigate('/tournaments/create')}
          className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-chess-darker font-semibold rounded-xl hover:bg-gold-400 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create New
        </button>
      </motion.div>

      {/* Error Banner */}
      {error && (
        <div className="mb-4 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      )}

      {/* Empty State */}
      {!loading && tournaments.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <Trophy className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">No Tournaments Yet</h2>
          <p className="text-white/50 mb-6">Create your first tournament to get started!</p>
          <button
            onClick={() => navigate('/tournaments/create')}
            className="px-6 py-3 bg-gold-500 text-chess-darker font-semibold rounded-xl hover:bg-gold-400 transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Tournament
          </button>
        </motion.div>
      )}

      {/* Tournaments List */}
      {!loading && tournaments.length > 0 && (
        <div className="space-y-4">
          {tournaments.map((tournament, index) => (
            <motion.div
              key={tournament.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white/5 rounded-xl p-6 border border-white/10 hover:border-primary-500/30 transition-all"
            >
              <div className="flex flex-col md:flex-row gap-6">
                {/* Tournament Image */}
                <div className="flex-shrink-0">
                  <img
                    src={tournament.image || 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=600&h=400&fit=crop'}
                    alt={tournament.name}
                    className="w-full md:w-40 h-32 rounded-xl object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=600&h=400&fit=crop';
                    }}
                  />
                </div>

                {/* Tournament Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-1">{tournament.name}</h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${typeColors[tournament.tournament_type || 'Classical'] || 'bg-gray-500/20 text-gray-400'}`}>
                          {tournament.tournament_type || 'Classical'}
                        </span>
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${statusColors[tournament.status] || 'bg-gray-500/20 text-gray-400'}`}>
                          {tournament.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Trophy className="w-4 h-4 text-gold-400" />
                      <span className="text-sm font-medium text-gold-400">
                        ${tournament.prize_pool?.toLocaleString() || 'TBD'}
                      </span>
                    </div>
                  </div>

                  <p className="text-white/60 text-sm mb-3 line-clamp-2">{tournament.description}</p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <div className="flex items-center gap-2 text-xs text-white/50">
                      <Calendar className="w-3 h-3" />
                      {new Date(tournament.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/50">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{tournament.venue_city || 'Online'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/50">
                      <Users className="w-3 h-3" />
                      {tournament.current_participants}/{tournament.max_participants || '∞'} players
                    </div>
                    <div className="text-xs text-white/50">
                      Entry: ${tournament.entry_fee}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/tournament/${tournament.id}`)}
                      className="px-4 py-2 bg-white/5 text-white rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2 text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    {tournament.status === 'upcoming' && (
                      <>
                        <button
                          onClick={() => navigate(`/tournaments/edit/${tournament.id}`)}
                          className="px-4 py-2 bg-primary-500/20 text-primary-400 rounded-lg hover:bg-primary-500/30 transition-colors flex items-center gap-2 text-sm"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(tournament.id)}
                          className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors flex items-center gap-2 text-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => navigate(`/tournaments/${tournament.id}/participants`)}
                      className="px-4 py-2 bg-white/5 text-white rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2 text-sm ml-auto"
                    >
                      <Users className="w-4 h-4" />
                      View Participants ({tournament.current_participants})
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-chess-darker border border-white/10 rounded-xl p-6 max-w-md w-full"
          >
            <h3 className="text-xl font-semibold text-white mb-2">Delete Tournament?</h3>
            <p className="text-white/60 mb-6">
              Are you sure you want to delete this tournament? This action cannot be undone.
              {(() => {
                const tournament = tournaments.find(t => t.id === deleteConfirmId);
                return tournament && tournament.current_participants > 0 && (
                  <span className="block mt-2 text-red-400">
                    Note: This tournament has registered participants. You may want to notify them first.
                  </span>
                );
              })()}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-white/5 text-white rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default MyTournaments;
