import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Users, Loader2, Award, Calendar } from 'lucide-react';
import { tournamentsApi, type Tournament, type TournamentParticipant } from '../api/tournaments';

const TournamentParticipants = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [participants, setParticipants] = useState<TournamentParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!id) {
      navigate('/tournaments');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch tournament info and participants in parallel
        const [tournamentResponse, participantsResponse] = await Promise.all([
          tournamentsApi.getTournamentById(parseInt(id)),
          tournamentsApi.getParticipants(parseInt(id), 1, 100)
        ]);

        setTournament(tournamentResponse.data);
        setParticipants(participantsResponse.data || []);
        setTotal(participantsResponse.meta?.total || 0);
        setError(null);
      } catch (err: any) {
        console.error('Failed to fetch data:', err);
        setError(err.response?.data?.error || 'Failed to load participants');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  const getRatingColor = (rating: number) => {
    if (rating >= 2400) return 'text-purple-400';
    if (rating >= 2200) return 'text-red-400';
    if (rating >= 2000) return 'text-orange-400';
    if (rating >= 1800) return 'text-yellow-400';
    if (rating >= 1600) return 'text-green-400';
    if (rating >= 1400) return 'text-blue-400';
    return 'text-gray-400';
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-500/20 text-green-400';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'failed':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 md:px-8 lg:px-16 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <button
          onClick={() => navigate(`/tournament/${id}`)}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Tournament
        </button>

        {tournament && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-display font-bold text-white mb-2">{tournament.name}</h1>
                <div className="flex items-center gap-4 text-sm text-white/60">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(tournament.start_date).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {tournament.current_participants}/{tournament.max_participants || '∞'} Registered
                  </div>
                  <div className="flex items-center gap-1">
                    <Trophy className="w-4 h-4 text-gold-400" />
                    ${tournament.prize_pool?.toLocaleString() || 'TBD'} Prize
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
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
      {!loading && participants.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12 bg-white/5 rounded-xl border border-white/10"
        >
          <Users className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">No Participants Yet</h2>
          <p className="text-white/50">Be the first to register for this tournament!</p>
        </motion.div>
      )}

      {/* Participants List */}
      {!loading && participants.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Users className="w-5 h-5" />
              Participants ({total})
            </h2>
          </div>

          <div className="grid gap-3">
            {participants.map((participant, index) => (
              <motion.div
                key={participant.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-primary-500/30 transition-all"
              >
                <div className="flex items-center gap-4">
                  {/* Rank/Number */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/70 font-semibold">
                    {index + 1}
                  </div>

                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <img
                      src={participant.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(participant.name)}&background=random`}
                      alt={participant.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  </div>

                  {/* Player Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white truncate">{participant.name}</h3>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="flex items-center gap-1">
                        <Award className={`w-3 h-3 ${getRatingColor(participant.rating)}`} />
                        <span className={getRatingColor(participant.rating)}>{participant.rating}</span>
                      </div>
                      <span className="text-white/40">•</span>
                      <span className="text-white/50">
                        Registered {new Date(participant.registration_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Payment Status */}
                  {tournament && tournament.entry_fee > 0 && (
                    <div className="flex-shrink-0">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium capitalize ${getPaymentStatusColor(participant.status)}`}>
                        {participant.status === 'paid' ? 'Paid' : 'Pending'}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TournamentParticipants;
