import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, Copy, RefreshCw, CheckCircle, Loader2 } from 'lucide-react';
import api from '../api/client';

interface PrivateGameInviteProps {
  gameId: number;
  invitationLink: string;
  onRegenerate?: (newLink: string) => void;
}

const PrivateGameInvite = ({ gameId, invitationLink, onRegenerate }: PrivateGameInviteProps) => {
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(invitationLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      setError('Failed to copy link');
    }
  };

  const handleRegenerate = async () => {
    if (!confirm('Are you sure? This will invalidate the current invitation link.')) {
      return;
    }

    setRegenerating(true);
    setError(null);

    try {
      const response = await api.post(`/games/${gameId}/regenerate-invite`);
      const newLink = response.data.data.invitation_link;
      onRegenerate?.(newLink);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to regenerate link');
    } finally {
      setRegenerating(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join my chess game!',
          text: 'I\'ve invited you to join a private chess game. Click the link to join:',
          url: invitationLink,
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Link className="w-6 h-6 text-blue-400" />
        <div>
          <h3 className="text-lg font-semibold text-white">Private Game Invitation</h3>
          <p className="text-sm text-white/50">Share this link to invite players</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Invitation Link */}
      <div className="mb-4">
        <div className="flex items-center gap-2 p-3 bg-white/10 rounded-lg border border-white/20">
          <input
            type="text"
            value={invitationLink}
            readOnly
            className="flex-1 bg-transparent text-white text-sm focus:outline-none select-all"
          />
          <motion.button
            onClick={handleCopy}
            whileTap={{ scale: 0.95 }}
            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            title="Copy link"
          >
            {copied ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </motion.button>
        </div>

        {copied && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-green-400 mt-2"
          >
            Link copied to clipboard!
          </motion.p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleShare}
          className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Link className="w-4 h-4" />
          <span>Share Link</span>
        </button>

        <button
          onClick={handleRegenerate}
          disabled={regenerating}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:bg-white/5 text-white rounded-lg transition-colors flex items-center gap-2"
          title="Generate new link"
        >
          {regenerating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Warning */}
      <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
        <p className="text-sm text-amber-300">
          <strong>Note:</strong> Anyone with this link can join your private game. Regenerating
          the link will invalidate the current one.
        </p>
      </div>
    </div>
  );
};

export default PrivateGameInvite;
