import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Headphones, HeadphoneOff, PhoneOff, Phone, Users, Volume2 } from 'lucide-react';
import { usePeerVoice, type VoiceParticipant } from '../hooks/usePeerVoice';
import { useVoiceRoomInfo } from '../hooks/useVoiceRoomInfo';

interface VoiceChannelProps {
  roomId: string;
  roomName: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  isCompact?: boolean;
}

export default function VoiceChannel({
  roomId,
  roomName,
  userId,
  userName,
  userAvatar,
  isCompact = false,
}: VoiceChannelProps) {
  const {
    isConnected,
    isConnecting,
    isMuted,
    isDeafened,
    participants,
    localAudioLevel,
    error,
    joinVoice,
    leaveVoice,
    toggleMute,
    toggleDeafen,
  } = usePeerVoice({
    roomId,
    odbc: userId,
    userName,
    userAvatar,
  });

  // Fetch room info when not connected (to see who's in the room)
  const { users: roomUsers, isLoading: roomInfoLoading } = useVoiceRoomInfo({
    roomId,
    enabled: !isConnected, // Only fetch when not connected
  });

  // Visual audio level indicator (0-100%)
  const audioLevelPercent = Math.min(100, (localAudioLevel / 128) * 100);

  const totalInVoice = isConnected ? participants.length + 1 : roomUsers.length;

  if (isCompact) {
    return (
      <div className="flex items-center gap-2">
        {isConnected ? (
          <>
            <div className="flex items-center gap-1">
              <div className="relative">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                    isMuted ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                  }`}
                  style={{
                    boxShadow: !isMuted && audioLevelPercent > 10
                      ? `0 0 ${audioLevelPercent / 5}px ${audioLevelPercent / 10}px rgba(34, 197, 94, ${audioLevelPercent / 100})`
                      : undefined,
                  }}
                >
                  {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </div>
              </div>
              <button
                onClick={toggleMute}
                className={`p-1.5 rounded-lg transition-colors ${
                  isMuted ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              <button
                onClick={toggleDeafen}
                className={`p-1.5 rounded-lg transition-colors ${
                  isDeafened ? 'bg-orange-500/20 text-orange-400' : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
                title={isDeafened ? 'Undeafen' : 'Deafen'}
              >
                {isDeafened ? <HeadphoneOff className="w-4 h-4" /> : <Headphones className="w-4 h-4" />}
              </button>
              <button
                onClick={leaveVoice}
                className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                title="Leave voice"
              >
                <PhoneOff className="w-4 h-4" />
              </button>
            </div>
            {participants.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-white/50">
                <Users className="w-3 h-3" />
                <span>{participants.length + 1}</span>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={joinVoice}
              disabled={isConnecting}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 disabled:opacity-50 transition-colors"
            >
              <Phone className="w-4 h-4" />
              <span className="text-xs">{isConnecting ? 'Connecting...' : 'Join Voice'}</span>
            </button>
            {roomUsers.length > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="flex -space-x-2">
                  {roomUsers.slice(0, 3).map((user) => (
                    <div
                      key={user.odbc}
                      className="w-6 h-6 rounded-full border-2 border-[#1a1a2e] bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-[10px] text-white font-medium"
                      title={user.userName}
                    >
                      {user.userAvatar ? (
                        <img src={user.userAvatar} alt={user.userName} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        user.userName.charAt(0).toUpperCase()
                      )}
                    </div>
                  ))}
                  {roomUsers.length > 3 && (
                    <div className="w-6 h-6 rounded-full border-2 border-[#1a1a2e] bg-white/20 flex items-center justify-center text-[10px] text-white/70">
                      +{roomUsers.length - 3}
                    </div>
                  )}
                </div>
                <span className="text-xs text-green-400">{roomUsers.length} in voice</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-green-400" />
          <span className="text-sm font-medium text-white">{roomName}</span>
        </div>
        {!isConnected ? (
          <button
            onClick={joinVoice}
            disabled={isConnecting}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 transition-colors text-sm"
          >
            <Phone className="w-4 h-4" />
            {isConnecting ? 'Connecting...' : 'Join'}
          </button>
        ) : (
          <button
            onClick={leaveVoice}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-sm"
          >
            <PhoneOff className="w-4 h-4" />
            Leave
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="px-4 py-2 bg-red-500/20 text-red-400 text-xs">
          {error}
        </div>
      )}

      {/* Voice controls (when connected) */}
      <AnimatePresence>
        {isConnected && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-white/10"
          >
            <div className="px-4 py-3">
              {/* Self */}
              <div className="flex items-center gap-3 mb-3">
                <div className="relative">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium overflow-hidden ${
                      isMuted ? 'ring-2 ring-red-500/50' : audioLevelPercent > 10 ? 'ring-2 ring-green-500' : ''
                    }`}
                    style={{
                      boxShadow: !isMuted && audioLevelPercent > 10
                        ? `0 0 ${audioLevelPercent / 3}px rgba(34, 197, 94, 0.6)`
                        : undefined,
                    }}
                  >
                    {userAvatar ? (
                      <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                        {userName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  {isMuted && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                      <MicOff className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white font-medium">{userName} (You)</p>
                  <p className="text-xs text-white/50">
                    {isMuted ? 'Muted' : isDeafened ? 'Deafened' : 'Speaking...'}
                  </p>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMute}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-colors ${
                    isMuted
                      ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  <span className="text-sm">{isMuted ? 'Unmute' : 'Mute'}</span>
                </button>
                <button
                  onClick={toggleDeafen}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-colors ${
                    isDeafened
                      ? 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  {isDeafened ? <HeadphoneOff className="w-4 h-4" /> : <Headphones className="w-4 h-4" />}
                  <span className="text-sm">{isDeafened ? 'Undeafen' : 'Deafen'}</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Participants */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-4 h-4 text-white/50" />
          <span className="text-xs text-white/50">
            {totalInVoice > 0 ? `${totalInVoice} in voice` : 'No one in voice'}
          </span>
          {!isConnected && roomInfoLoading && (
            <span className="text-xs text-white/30">(loading...)</span>
          )}
        </div>

        {totalInVoice === 0 ? (
          <p className="text-xs text-white/30 italic">No one in voice chat yet. Be the first to join!</p>
        ) : (
          <div className="space-y-2">
            {isConnected ? (
              // Show connected participants with full details
              participants.map((participant) => (
                <ParticipantRow key={participant.peerId} participant={participant} />
              ))
            ) : (
              // Show room users (preview before joining)
              roomUsers.map((user) => (
                <div key={user.odbc} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium overflow-hidden ring-2 ring-green-500/30">
                    {user.userAvatar ? (
                      <img src={user.userAvatar} alt={user.userName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                        {user.userName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/80 truncate">{user.userName}</p>
                    <p className="text-xs text-green-400">In voice</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ParticipantRow({ participant }: { participant: VoiceParticipant }) {
  const audioLevelPercent = Math.min(100, (participant.audioLevel / 128) * 100);

  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium overflow-hidden ${
            participant.isMuted ? 'ring-2 ring-red-500/50' : participant.isSpeaking ? 'ring-2 ring-green-500' : ''
          }`}
          style={{
            boxShadow: !participant.isMuted && participant.isSpeaking
              ? `0 0 ${audioLevelPercent / 3}px rgba(34, 197, 94, 0.6)`
              : undefined,
          }}
        >
          {participant.avatar ? (
            <img src={participant.avatar} alt={participant.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              {participant.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        {participant.isMuted && (
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
            <MicOff className="w-2.5 h-2.5 text-white" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white/80 truncate">{participant.name}</p>
      </div>
      {participant.isSpeaking && !participant.isMuted && (
        <div className="flex items-center gap-0.5">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="w-1 bg-green-400 rounded-full"
              animate={{
                height: [4, 12, 4],
              }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                delay: i * 0.1,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
