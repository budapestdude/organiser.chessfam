import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Edit2, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { useGameChat } from '../hooks/useGameChat';
import { useGameNotifications } from '../hooks/useGameNotifications';
import { useStore } from '../store';
import Avatar from './Avatar';

interface GameChatProps {
  gameId: number;
  isParticipant: boolean;
}

const GameChat = ({ gameId, isParticipant }: GameChatProps) => {
  const { user } = useStore();
  const [message, setMessage] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const {
    messages,
    isLoading,
    error,
    hasMore,
    sendMessage,
    editMessage,
    deleteMessage,
    loadMore,
    refresh,
  } = useGameChat({ gameId, enabled: isParticipant });

  const { notifications } = useGameNotifications({ gameId, enabled: isParticipant });

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Refresh chat when new message notification arrives
  useEffect(() => {
    const newMessageNotif = notifications.find(n => n.event === 'game:message');
    if (newMessageNotif) {
      refresh();
    }
  }, [notifications, refresh]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    try {
      await sendMessage(message);
      setMessage('');
      inputRef.current?.focus();
    } catch (err: any) {
      console.error('Failed to send message:', err);
    }
  };

  const handleEditMessage = async (messageId: number) => {
    if (!editText.trim()) return;

    try {
      await editMessage(messageId, editText);
      setEditingMessageId(null);
      setEditText('');
    } catch (err: any) {
      console.error('Failed to edit message:', err);
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      await deleteMessage(messageId);
    } catch (err: any) {
      console.error('Failed to delete message:', err);
    }
  };

  const startEdit = (messageId: number, currentText: string) => {
    setEditingMessageId(messageId);
    setEditText(currentText);
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setEditText('');
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (!isParticipant) {
    return (
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <div className="flex items-center justify-center gap-2 text-white/50">
          <AlertCircle className="w-5 h-5" />
          <p>Join this game to access the chat</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 rounded-2xl border border-white/10 flex flex-col h-[600px]">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <h3 className="text-lg font-semibold text-white">Game Chat</h3>
        <p className="text-sm text-white/50">
          {messages.length} {messages.length === 1 ? 'message' : 'messages'}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Load more button */}
        {hasMore && (
          <button
            onClick={loadMore}
            disabled={isLoading}
            className="w-full py-2 text-sm text-white/50 hover:text-white transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Load older messages'}
          </button>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {messages.map((msg) => {
            const isOwnMessage = user?.id === msg.user_id;
            const isEditing = editingMessageId === msg.id;

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
              >
                <Avatar
                  src={msg.user_avatar}
                  size="sm"
                />

                <div className={`flex-1 ${isOwnMessage ? 'items-end' : ''}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-white">
                      {msg.user_name || 'User'}
                    </span>
                    <span className="text-xs text-white/40">
                      {formatTime(msg.created_at)}
                      {msg.edited_at && ' (edited)'}
                    </span>
                  </div>

                  {isEditing ? (
                    <div className="space-y-2">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm resize-none focus:outline-none focus:border-blue-500"
                        rows={2}
                        maxLength={1000}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditMessage(msg.id)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`inline-block px-4 py-2 rounded-2xl ${
                        msg.deleted
                          ? 'bg-white/5 border border-white/10 text-white/40 italic'
                          : isOwnMessage
                          ? 'bg-blue-600 text-white'
                          : 'bg-white/10 text-white'
                      }`}
                    >
                      <p className="text-sm break-words">{msg.message}</p>
                    </div>
                  )}

                  {/* Message actions */}
                  {isOwnMessage && !msg.deleted && !isEditing && (
                    <div className="flex gap-2 mt-1">
                      <button
                        onClick={() => startEdit(msg.id, msg.message)}
                        className="text-white/40 hover:text-white transition-colors"
                        title="Edit message"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="text-white/40 hover:text-red-400 transition-colors"
                        title="Delete message"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-white/40">
            <p>No messages yet</p>
            <p className="text-sm">Be the first to say something!</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/10">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
            className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 resize-none focus:outline-none focus:border-blue-500"
            rows={1}
            maxLength={1000}
          />
          <button
            onClick={handleSendMessage}
            disabled={!message.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-white/10 disabled:text-white/40 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        <p className="text-xs text-white/40 mt-2">
          {message.length}/1000 characters
        </p>
      </div>
    </div>
  );
};

export default GameChat;
