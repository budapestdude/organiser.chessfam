import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Pin, Trash2, MessageCircle, Megaphone, Calendar } from 'lucide-react';
import { clubMessagingApi, type ClubMessage, type SendMessageInput } from '../api/clubMessaging';
import { useStore } from '../store';

interface ClubMessagingProps {
  clubId: number;
  isMember: boolean;
  canManageMessages: boolean; // admins and owners can pin/delete
}

const ClubMessaging = ({ clubId, isMember, canManageMessages }: ClubMessagingProps) => {
  const { user, openAuthModal } = useStore();
  const [messages, setMessages] = useState<ClubMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [messageType, setMessageType] = useState<'general' | 'announcement' | 'event'>('general');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
  }, [clubId, page]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await clubMessagingApi.getMessages(clubId, { page, limit: 50 });
      const newMessages = response.data.messages || response.data || [];

      if (page === 1) {
        setMessages(newMessages);
      } else {
        setMessages([...messages, ...newMessages]);
      }

      setHasMore(newMessages.length === 50);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      openAuthModal('login');
      return;
    }

    if (!isMember) {
      alert('You must be a member to send messages');
      return;
    }

    if (!messageText.trim()) return;

    try {
      setSending(true);
      const input: SendMessageInput = {
        message_text: messageText,
        message_type: messageType,
      };

      await clubMessagingApi.sendMessage(clubId, input);
      setMessageText('');
      setMessageType('general');

      // Refresh messages
      setPage(1);
      fetchMessages();
    } catch (error: any) {
      console.error('Failed to send message:', error);
      alert(error.response?.data?.error || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleTogglePin = async (messageId: number, currentlyPinned: boolean) => {
    if (!canManageMessages) return;

    try {
      await clubMessagingApi.togglePin(messageId, !currentlyPinned);
      fetchMessages();
    } catch (error: any) {
      console.error('Failed to toggle pin:', error);
      alert(error.response?.data?.error || 'Failed to pin/unpin message');
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    if (!canManageMessages) return;

    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      await clubMessagingApi.deleteMessage(messageId);
      fetchMessages();
    } catch (error: any) {
      console.error('Failed to delete message:', error);
      alert(error.response?.data?.error || 'Failed to delete message');
    }
  };

  const handleMarkAsRead = async (messageId: number) => {
    try {
      await clubMessagingApi.markAsRead(messageId);
      // Optionally update local state
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'announcement':
        return <Megaphone className="w-4 h-4 text-gold-400" />;
      case 'event':
        return <Calendar className="w-4 h-4 text-blue-400" />;
      default:
        return <MessageCircle className="w-4 h-4 text-white/40" />;
    }
  };

  const getMessageBgColor = (type: string) => {
    switch (type) {
      case 'announcement':
        return 'bg-gold-500/10 border-gold-500/30';
      case 'event':
        return 'bg-blue-500/10 border-blue-500/30';
      default:
        return 'bg-white/5 border-white/10';
    }
  };

  // Separate pinned and regular messages
  const pinnedMessages = messages.filter(m => m.is_pinned);
  const regularMessages = messages.filter(m => !m.is_pinned);

  if (loading && page === 1) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="inline-block w-8 h-8 border-4 border-gold-400/30 border-t-gold-400 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-gold-400" />
          Club Messages
        </h3>
      </div>

      {/* Messages Container */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <div className="h-[500px] overflow-y-auto p-4 space-y-3">
          {/* Pinned Messages */}
          {pinnedMessages.length > 0 && (
            <div className="space-y-2 pb-4 border-b border-white/10">
              <div className="text-xs font-medium text-gold-400 flex items-center gap-1">
                <Pin className="w-3 h-3" />
                Pinned Messages
              </div>
              {pinnedMessages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  canManage={canManageMessages}
                  onTogglePin={handleTogglePin}
                  onDelete={handleDeleteMessage}
                  onMarkAsRead={handleMarkAsRead}
                  getMessageIcon={getMessageIcon}
                  getMessageBgColor={getMessageBgColor}
                />
              ))}
            </div>
          )}

          {/* Regular Messages */}
          {regularMessages.length === 0 && pinnedMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <MessageCircle className="w-12 h-12 text-white/20 mb-3" />
              <p className="text-white/50">No messages yet</p>
              {isMember && <p className="text-white/30 text-sm mt-1">Be the first to send a message!</p>}
            </div>
          ) : (
            regularMessages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                canManage={canManageMessages}
                onTogglePin={handleTogglePin}
                onDelete={handleDeleteMessage}
                onMarkAsRead={handleMarkAsRead}
                getMessageIcon={getMessageIcon}
                getMessageBgColor={getMessageBgColor}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        {isMember && (
          <form onSubmit={handleSendMessage} className="border-t border-white/10 p-4">
            {/* Message Type Selector */}
            {canManageMessages && (
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setMessageType('general')}
                  className={`px-3 py-1 rounded-lg text-sm flex items-center gap-1 transition-colors ${
                    messageType === 'general'
                      ? 'bg-white/20 text-white'
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  <MessageCircle className="w-3 h-3" />
                  General
                </button>
                <button
                  type="button"
                  onClick={() => setMessageType('announcement')}
                  className={`px-3 py-1 rounded-lg text-sm flex items-center gap-1 transition-colors ${
                    messageType === 'announcement'
                      ? 'bg-gold-500/20 text-gold-400'
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  <Megaphone className="w-3 h-3" />
                  Announcement
                </button>
                <button
                  type="button"
                  onClick={() => setMessageType('event')}
                  className={`px-3 py-1 rounded-lg text-sm flex items-center gap-1 transition-colors ${
                    messageType === 'event'
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  <Calendar className="w-3 h-3" />
                  Event
                </button>
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-gold-500 focus:outline-none"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={sending || !messageText.trim()}
                className="px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-chess-darker font-semibold rounded-xl hover:from-gold-400 hover:to-gold-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </form>
        )}

        {!isMember && (
          <div className="border-t border-white/10 p-4 text-center text-white/50 text-sm">
            Join the club to send messages
          </div>
        )}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="text-center">
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={loading}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white/70 hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Load More Messages'}
          </button>
        </div>
      )}
    </div>
  );
};

// Message Bubble Component
const MessageBubble = ({
  message,
  canManage,
  onTogglePin,
  onDelete,
  onMarkAsRead,
  getMessageIcon,
  getMessageBgColor,
}: {
  message: ClubMessage;
  canManage: boolean;
  onTogglePin: (messageId: number, isPinned: boolean) => void;
  onDelete: (messageId: number) => void;
  onMarkAsRead: (messageId: number) => void;
  getMessageIcon: (type: string) => React.ReactElement;
  getMessageBgColor: (type: string) => string;
}) => {

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`border rounded-xl p-4 ${getMessageBgColor(message.message_type)}`}
      onMouseEnter={() => !message.is_read && onMarkAsRead(message.id)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <img
            src={message.sender_avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${message.sender_name}`}
            alt={message.sender_name}
            className="w-10 h-10 rounded-full"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-white">{message.sender_name}</span>
              {getMessageIcon(message.message_type)}
              <span className="text-xs text-white/40">
                {new Date(message.created_at).toLocaleString()}
              </span>
            </div>
            <p className="text-white/80">{message.message_text}</p>
          </div>
        </div>

        {/* Actions */}
        {canManage && (
          <div className="flex gap-1">
            <button
              onClick={() => onTogglePin(message.id, message.is_pinned)}
              className={`p-2 rounded-lg transition-colors ${
                message.is_pinned
                  ? 'bg-gold-500/20 text-gold-400'
                  : 'hover:bg-white/10 text-white/60'
              }`}
              title={message.is_pinned ? 'Unpin' : 'Pin'}
            >
              <Pin className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(message.id)}
              className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ClubMessaging;
