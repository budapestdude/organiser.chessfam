import { useState, useEffect } from 'react';
import { Clock, Loader2, Users } from 'lucide-react';
import api from '../api/client';

interface WaitlistButtonProps {
  gameId: number;
  gameStatus: string;
  onWaitlistUpdate?: () => void;
}

interface WaitlistStatus {
  in_waitlist: boolean;
  position: number | null;
  total_waiting: number;
}

const WaitlistButton = ({ gameId, gameStatus, onWaitlistUpdate }: WaitlistButtonProps) => {
  const [status, setStatus] = useState<WaitlistStatus>({
    in_waitlist: false,
    position: null,
    total_waiting: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch waitlist status
  const fetchStatus = async () => {
    try {
      const response = await api.get(`/waitlist/${gameId}/status`);
      setStatus(response.data.data);
    } catch (err: any) {
      console.error('Failed to fetch waitlist status:', err);
    }
  };

  useEffect(() => {
    if (gameStatus === 'full') {
      fetchStatus();
    }
  }, [gameId, gameStatus]);

  const handleJoinWaitlist = async () => {
    setLoading(true);
    setError(null);

    try {
      await api.post(`/waitlist/${gameId}/join`);
      await fetchStatus();
      onWaitlistUpdate?.();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to join waitlist');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveWaitlist = async () => {
    setLoading(true);
    setError(null);

    try {
      await api.delete(`/waitlist/${gameId}/leave`);
      await fetchStatus();
      onWaitlistUpdate?.();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to leave waitlist');
    } finally {
      setLoading(false);
    }
  };

  // Only show for full games
  if (gameStatus !== 'full') {
    return null;
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {status.in_waitlist ? (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-white">
              <Clock className="w-5 h-5 text-blue-400" />
              <span className="font-medium">You're on the waitlist</span>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-400">#{status.position}</div>
              <div className="text-xs text-white/50">in line</div>
            </div>
          </div>

          {status.total_waiting > 1 && (
            <p className="text-sm text-white/60 mb-3">
              <Users className="w-4 h-4 inline mr-1" />
              {status.total_waiting} people waiting
            </p>
          )}

          <p className="text-sm text-white/70 mb-3">
            You'll receive an email notification when a spot becomes available.
          </p>

          <button
            onClick={handleLeaveWaitlist}
            disabled={loading}
            className="w-full py-2 bg-white/10 hover:bg-white/20 disabled:bg-white/5 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Leaving...</span>
              </>
            ) : (
              <span>Leave Waitlist</span>
            )}
          </button>
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-5 h-5 text-white/70" />
            <div>
              <p className="text-white font-medium">Game is Full</p>
              {status.total_waiting > 0 && (
                <p className="text-sm text-white/50">
                  {status.total_waiting} {status.total_waiting === 1 ? 'person' : 'people'} waiting
                </p>
              )}
            </div>
          </div>

          <p className="text-sm text-white/60 mb-3">
            Join the waitlist to be notified when a spot opens up.
          </p>

          <button
            onClick={handleJoinWaitlist}
            disabled={loading}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Joining...</span>
              </>
            ) : (
              <>
                <Clock className="w-4 h-4" />
                <span>Join Waitlist</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default WaitlistButton;
