import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, X, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import api from '../api/client';

interface PGNUploaderProps {
  gameId: number;
  onSuccess?: () => void;
  existingPGN?: {
    pgn_data: string;
    move_count: number;
    opening_name?: string;
    uploaded_by: number;
    created_at: string;
  };
}

const PGNUploader = ({ gameId, onSuccess, existingPGN }: PGNUploaderProps) => {
  const [pgnText, setPgnText] = useState(existingPGN?.pgn_data || '');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showEditor, setShowEditor] = useState(!existingPGN);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024) {
      setError('File too large (max 50KB)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setPgnText(text);
      setShowEditor(true);
    };
    reader.onerror = () => {
      setError('Failed to read file');
    };
    reader.readAsText(file);
  };

  const handleUpload = async () => {
    if (!pgnText.trim()) {
      setError('Please enter or upload PGN notation');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(false);

    try {
      await api.post(`/games/${gameId}/pgn`, {
        pgn_data: pgnText,
      });

      setSuccess(true);
      setTimeout(() => {
        setShowEditor(false);
        onSuccess?.();
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload PGN');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this PGN?')) return;

    setUploading(true);
    setError(null);

    try {
      await api.delete(`/games/${gameId}/pgn`);
      setPgnText('');
      setShowEditor(true);
      onSuccess?.();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete PGN');
    } finally {
      setUploading(false);
    }
  };

  if (existingPGN && !showEditor) {
    return (
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-green-400" />
            <div>
              <h3 className="text-lg font-semibold text-white">Game Notation (PGN)</h3>
              <p className="text-sm text-white/50">
                {existingPGN.move_count} moves
                {existingPGN.opening_name && ` • ${existingPGN.opening_name}`}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowEditor(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            View/Edit
          </button>
        </div>

        <div className="bg-white/5 rounded-lg p-4 max-h-48 overflow-y-auto border border-white/10">
          <pre className="text-sm text-white/80 font-mono whitespace-pre-wrap break-words">
            {existingPGN.pgn_data.substring(0, 200)}
            {existingPGN.pgn_data.length > 200 && '...'}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 rounded-2xl p-6 border border-white/10"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Upload className="w-6 h-6 text-blue-400" />
          <div>
            <h3 className="text-lg font-semibold text-white">Upload PGN Notation</h3>
            <p className="text-sm text-white/50">
              Earn <span className="text-blue-400 font-medium">25 XP</span> for uploading game
              notation
            </p>
          </div>
        </div>

        {existingPGN && (
          <button
            onClick={() => setShowEditor(false)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        )}
      </div>

      {/* Success Message */}
      {success && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 mb-4 flex items-center gap-3"
        >
          <CheckCircle className="w-5 h-5 text-green-400" />
          <div>
            <p className="text-green-400 font-medium">PGN uploaded successfully!</p>
            <p className="text-green-400/80 text-sm">You earned 25 XP</p>
          </div>
        </motion.div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4 flex items-center gap-3 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      )}

      {/* File Upload */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-white mb-2">Upload PGN File</label>
        <div className="relative">
          <input
            type="file"
            accept=".pgn,.txt"
            onChange={handleFileUpload}
            className="hidden"
            id="pgn-file-input"
          />
          <label
            htmlFor="pgn-file-input"
            className="flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 border-2 border-dashed border-white/20 rounded-lg cursor-pointer transition-colors"
          >
            <FileText className="w-5 h-5 text-white/70" />
            <span className="text-white/70">Choose PGN file (max 50KB)</span>
          </label>
        </div>
      </div>

      {/* Or Divider */}
      <div className="flex items-center gap-4 my-4">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-sm text-white/40">OR</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      {/* Text Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-white mb-2">Paste PGN Text</label>
        <textarea
          value={pgnText}
          onChange={(e) => setPgnText(e.target.value)}
          placeholder="[Event &quot;Casual Game&quot;]&#10;[Site &quot;ChessFam&quot;]&#10;[Date &quot;2024.01.01&quot;]&#10;[White &quot;Player1&quot;]&#10;[Black &quot;Player2&quot;]&#10;[Result &quot;1-0&quot;]&#10;&#10;1. e4 e5 2. Nf3 Nc6 ..."
          className="w-full h-64 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/30 font-mono text-sm resize-none focus:outline-none focus:border-blue-500"
        />
        <p className="text-xs text-white/40 mt-1">{pgnText.length} characters</p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleUpload}
          disabled={uploading || !pgnText.trim() || success}
          className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
        >
          {uploading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Uploading...</span>
            </>
          ) : success ? (
            <>
              <CheckCircle className="w-5 h-5" />
              <span>Uploaded</span>
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              <span>{existingPGN ? 'Update PGN' : 'Upload PGN'}</span>
            </>
          )}
        </button>

        {existingPGN && (
          <button
            onClick={handleDelete}
            disabled={uploading}
            className="px-6 py-3 bg-red-600/20 hover:bg-red-600/30 disabled:bg-red-600/10 text-red-400 border border-red-500/30 rounded-lg transition-colors"
          >
            Delete
          </button>
        )}
      </div>

      {/* Help Text */}
      <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <p className="text-sm text-blue-300">
          <strong>Tip:</strong> PGN (Portable Game Notation) is the standard format for recording
          chess games. You can export your game from chess.com, lichess.org, or any chess software.
        </p>
      </div>
    </motion.div>
  );
};

export default PGNUploader;
