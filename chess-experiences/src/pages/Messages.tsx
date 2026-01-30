import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, MessageSquare, User, Loader2 } from 'lucide-react';
import { useStore } from '../store';

const Messages = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const conversationId = searchParams.get('chat');
  const {
    user,
    apiConversations,
    apiMessages,
    messagesLoading,
    messagesError,
    fetchConversations,
    fetchMessages,
    sendMessageToApi,
    markConversationReadApi,
    openAuthModal
  } = useStore();
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations on mount
  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user, fetchConversations]);

  // Fetch messages when conversation changes
  useEffect(() => {
    if (conversationId && user) {
      const convId = parseInt(conversationId);
      fetchMessages(convId);
      markConversationReadApi(convId);
    }
  }, [conversationId, user, fetchMessages, markConversationReadApi]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [apiMessages, conversationId]);

  if (!user) {
    return (
      <div className="min-h-screen py-8 px-4 md:px-8 max-w-4xl mx-auto flex flex-col items-center justify-center">
        <MessageSquare className="w-16 h-16 text-white/20 mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Sign in to view messages</h2>
        <p className="text-white/50 mb-6">Connect with masters and players</p>
        <button
          onClick={() => openAuthModal('login')}
          className="px-6 py-3 bg-gold-500 text-chess-darker font-semibold rounded-xl
                   hover:bg-gold-400 transition-colors"
        >
          Sign In
        </button>
      </div>
    );
  }

  const activeConversation = conversationId
    ? apiConversations.find((c) => c.id === parseInt(conversationId))
    : null;
  const conversationMessages = conversationId
    ? apiMessages[parseInt(conversationId)] || []
    : [];

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeConversation) return;

    setSending(true);
    try {
      await sendMessageToApi(activeConversation.otherUserId, newMessage.trim());
      setNewMessage('');
      // Refresh messages
      await fetchMessages(activeConversation.id);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 md:px-8 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <h1 className="text-2xl font-display font-bold text-white">Messages</h1>
        <div className="w-16" />
      </motion.div>

      {/* Error Message */}
      {messagesError && (
        <div className="mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400">
          {messagesError}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Conversations List */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="md:col-span-1 bg-white/5 rounded-2xl border border-white/10 overflow-hidden"
        >
          <div className="p-4 border-b border-white/10">
            <h2 className="font-semibold text-white">Conversations</h2>
          </div>
          <div className="overflow-y-auto h-full">
            {messagesLoading && apiConversations.length === 0 ? (
              <div className="p-6 text-center">
                <Loader2 className="w-8 h-8 text-white/40 mx-auto mb-3 animate-spin" />
                <p className="text-white/50 text-sm">Loading conversations...</p>
              </div>
            ) : apiConversations.length === 0 ? (
              <div className="p-6 text-center">
                <MessageSquare className="w-12 h-12 text-white/20 mx-auto mb-3" />
                <p className="text-white/50 text-sm">No conversations yet</p>
                <p className="text-white/30 text-xs mt-1">
                  Start a conversation from a master or player profile
                </p>
              </div>
            ) : (
              apiConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => navigate(`/messages?chat=${conv.id}`)}
                  className={`w-full p-4 flex items-center gap-3 hover:bg-white/5 transition-colors border-b border-white/5
                            ${conversationId === String(conv.id) ? 'bg-white/10' : ''}`}
                >
                  {conv.otherUserAvatar ? (
                    <img
                      src={conv.otherUserAvatar}
                      alt={conv.otherUserName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                      <User className="w-6 h-6 text-white/40" />
                    </div>
                  )}
                  <div className="flex-1 text-left">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-white">{conv.otherUserName}</h3>
                      {conv.unreadCount > 0 && (
                        <span className="w-5 h-5 bg-gold-500 text-chess-darker text-xs font-bold rounded-full flex items-center justify-center">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-white/50 truncate">
                      {conv.lastMessage || 'No messages yet'}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </motion.div>

        {/* Chat Area */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="md:col-span-2 bg-white/5 rounded-2xl border border-white/10 flex flex-col overflow-hidden"
        >
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-white/10 flex items-center gap-3">
                {activeConversation.otherUserAvatar ? (
                  <img
                    src={activeConversation.otherUserAvatar}
                    alt={activeConversation.otherUserName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-white/40" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-white">{activeConversation.otherUserName}</h3>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messagesLoading && conversationMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <Loader2 className="w-8 h-8 text-white/40 mb-3 animate-spin" />
                    <p className="text-white/50">Loading messages...</p>
                  </div>
                ) : conversationMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <MessageSquare className="w-12 h-12 text-white/20 mb-3" />
                    <p className="text-white/50">No messages yet</p>
                    <p className="text-white/30 text-sm">Send a message to start the conversation</p>
                  </div>
                ) : (
                  conversationMessages.map((msg) => {
                    const isOwn = msg.senderId === user.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                            isOwn
                              ? 'bg-gold-500 text-chess-darker rounded-br-md'
                              : 'bg-white/10 text-white rounded-bl-md'
                          }`}
                        >
                          <p>{msg.content}</p>
                          <p className={`text-xs mt-1 ${isOwn ? 'text-chess-darker/60' : 'text-white/40'}`}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-white/10">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    disabled={sending}
                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl
                             text-white placeholder-white/30 focus:border-gold-500 focus:outline-none
                             disabled:opacity-50"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sending}
                    className="px-4 py-3 bg-gold-500 text-chess-darker rounded-xl
                             hover:bg-gold-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
              <User className="w-16 h-16 text-white/20 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Select a conversation</h3>
              <p className="text-white/50 text-sm">
                Choose a conversation from the list or start a new one from a profile
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Messages;
