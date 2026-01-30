// Stream embedding component for theater box
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, Maximize2, Minimize2, ExternalLink, Users, Radio, X } from 'lucide-react';

export type StreamPlatform = 'twitch' | 'youtube' | 'chesscom' | 'lichess' | 'custom';

export interface StreamConfig {
  platform: StreamPlatform;
  streamId?: string;
  videoId?: string;
  channelName?: string;
  gameId?: string;
  customUrl?: string;
  title?: string;
  viewerCount?: number;
  isLive?: boolean;
  autoplay?: boolean;
  muted?: boolean;
}

interface StreamEmbedProps {
  config: StreamConfig;
  className?: string;
  showOverlay?: boolean;
  onClose?: () => void;
}

// Parse a URL to extract stream info
export function parseStreamUrl(url: string): StreamConfig | null {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    // Twitch
    if (hostname.includes('twitch.tv')) {
      const channelMatch = url.match(/twitch\.tv\/([^/?]+)/);
      if (channelMatch) {
        return {
          platform: 'twitch',
          channelName: channelMatch[1],
        };
      }
    }

    // YouTube
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      let videoId: string | null = null;

      if (hostname.includes('youtu.be')) {
        videoId = urlObj.pathname.slice(1);
      } else {
        videoId = urlObj.searchParams.get('v');
      }

      if (videoId) {
        return {
          platform: 'youtube',
          videoId,
        };
      }
    }

    // Chess.com TV
    if (hostname.includes('chess.com')) {
      if (url.includes('/tv') || url.includes('/live')) {
        return {
          platform: 'chesscom',
          customUrl: url,
        };
      }
    }

    // Lichess TV
    if (hostname.includes('lichess.org')) {
      const gameMatch = url.match(/lichess\.org\/([a-zA-Z0-9]{8,12})/);
      if (gameMatch) {
        return {
          platform: 'lichess',
          gameId: gameMatch[1],
        };
      }
      if (url.includes('/tv')) {
        return {
          platform: 'lichess',
          customUrl: 'https://lichess.org/tv',
        };
      }
    }

    // Custom URL fallback
    return {
      platform: 'custom',
      customUrl: url,
    };
  } catch {
    return null;
  }
}

// Generate embed URL for different platforms
function getEmbedUrl(config: StreamConfig): string {
  const { platform, streamId, videoId, channelName, gameId, customUrl, autoplay = false, muted = true } = config;

  switch (platform) {
    case 'twitch':
      if (channelName) {
        return `https://player.twitch.tv/?channel=${channelName}&parent=${window.location.hostname}&autoplay=${autoplay}&muted=${muted}`;
      }
      if (videoId) {
        return `https://player.twitch.tv/?video=${videoId}&parent=${window.location.hostname}&autoplay=${autoplay}&muted=${muted}`;
      }
      break;

    case 'youtube':
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}&mute=${muted ? 1 : 0}&rel=0&modestbranding=1`;
      }
      break;

    case 'lichess':
      if (gameId) {
        return `https://lichess.org/embed/game/${gameId}?theme=auto&bg=dark`;
      }
      return 'https://lichess.org/tv/embed?theme=auto&bg=dark';

    case 'chesscom':
      // Chess.com doesn't have a public embed API, use custom URL
      return customUrl || 'https://www.chess.com/tv';

    case 'custom':
      return customUrl || '';
  }

  return customUrl || streamId || '';
}

// Get platform-specific styling
function getPlatformStyle(platform: StreamPlatform): { icon: string; color: string; bgColor: string } {
  switch (platform) {
    case 'twitch':
      return { icon: '📺', color: 'text-purple-400', bgColor: 'bg-purple-500/20' };
    case 'youtube':
      return { icon: '▶️', color: 'text-red-400', bgColor: 'bg-red-500/20' };
    case 'chesscom':
      return { icon: '♟️', color: 'text-green-400', bgColor: 'bg-green-500/20' };
    case 'lichess':
      return { icon: '♞', color: 'text-white', bgColor: 'bg-gray-500/20' };
    default:
      return { icon: '🎬', color: 'text-blue-400', bgColor: 'bg-blue-500/20' };
  }
}

export const StreamEmbed: React.FC<StreamEmbedProps> = ({
  config,
  className = '',
  showOverlay = true,
  onClose,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(config.muted ?? true);
  const [isPlaying, setIsPlaying] = useState(config.autoplay ?? false);
  const [showControls, setShowControls] = useState(false);

  const embedUrl = getEmbedUrl({ ...config, muted: isMuted, autoplay: isPlaying });
  const platformStyle = getPlatformStyle(config.platform);

  const handleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  const handleMuteToggle = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const handlePlayToggle = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const handleExternalLink = useCallback(() => {
    let url: string;
    switch (config.platform) {
      case 'twitch':
        url = config.channelName ? `https://twitch.tv/${config.channelName}` : '';
        break;
      case 'youtube':
        url = config.videoId ? `https://youtube.com/watch?v=${config.videoId}` : '';
        break;
      case 'lichess':
        url = config.gameId ? `https://lichess.org/${config.gameId}` : 'https://lichess.org/tv';
        break;
      default:
        url = config.customUrl || '';
    }
    if (url) window.open(url, '_blank');
  }, [config]);

  return (
    <AnimatePresence>
      <motion.div
        className={`relative overflow-hidden rounded-lg bg-gray-900 ${
          isFullscreen ? 'fixed inset-0 z-50' : className
        }`}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        {/* Stream iframe */}
        <div className="relative w-full h-full aspect-video">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              className="absolute inset-0 w-full h-full"
              frameBorder="0"
              allowFullScreen
              allow="autoplay; fullscreen; encrypted-media"
              title={config.title || 'Stream'}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
              <p className="text-gray-400">No stream available</p>
            </div>
          )}
        </div>

        {/* Overlay with stream info and controls */}
        {showOverlay && (
          <AnimatePresence>
            {(showControls || config.isLive) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 pointer-events-none"
              >
                {/* Top bar with title and badges */}
                <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/70 to-transparent pointer-events-auto">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {/* Live badge */}
                      {config.isLive && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-red-600 rounded text-xs font-medium text-white">
                          <Radio className="w-3 h-3 animate-pulse" />
                          LIVE
                        </span>
                      )}
                      {/* Platform badge */}
                      <span className={`px-2 py-0.5 rounded text-xs ${platformStyle.bgColor} ${platformStyle.color}`}>
                        {platformStyle.icon} {config.platform.charAt(0).toUpperCase() + config.platform.slice(1)}
                      </span>
                    </div>

                    {/* Close button */}
                    {onClose && (
                      <button
                        onClick={onClose}
                        className="p-1 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    )}
                  </div>

                  {/* Title */}
                  {config.title && (
                    <h3 className="mt-2 text-white text-sm font-medium truncate">
                      {config.title}
                    </h3>
                  )}
                </div>

                {/* Bottom bar with controls and viewer count */}
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent pointer-events-auto">
                  <div className="flex items-center justify-between">
                    {/* Viewer count */}
                    {config.viewerCount !== undefined && (
                      <div className="flex items-center gap-1 text-white/80 text-sm">
                        <Users className="w-4 h-4" />
                        <span>{config.viewerCount.toLocaleString()}</span>
                      </div>
                    )}

                    {/* Controls */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handlePlayToggle}
                        className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                        title={isPlaying ? 'Pause' : 'Play'}
                      >
                        {isPlaying ? (
                          <Pause className="w-4 h-4 text-white" />
                        ) : (
                          <Play className="w-4 h-4 text-white" />
                        )}
                      </button>

                      <button
                        onClick={handleMuteToggle}
                        className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                        title={isMuted ? 'Unmute' : 'Mute'}
                      >
                        {isMuted ? (
                          <VolumeX className="w-4 h-4 text-white" />
                        ) : (
                          <Volume2 className="w-4 h-4 text-white" />
                        )}
                      </button>

                      <button
                        onClick={handleExternalLink}
                        className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                        title="Open in new tab"
                      >
                        <ExternalLink className="w-4 h-4 text-white" />
                      </button>

                      <button
                        onClick={handleFullscreen}
                        className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                        title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                      >
                        {isFullscreen ? (
                          <Minimize2 className="w-4 h-4 text-white" />
                        ) : (
                          <Maximize2 className="w-4 h-4 text-white" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

// Chess game embed component specifically for lichess/chess.com games
interface ChessGameEmbedProps {
  gameId: string;
  platform: 'lichess' | 'chesscom';
  whitePlayer?: string;
  blackPlayer?: string;
  whiteRating?: number;
  blackRating?: number;
  className?: string;
}

export const ChessGameEmbed: React.FC<ChessGameEmbedProps> = ({
  gameId,
  platform,
  whitePlayer,
  blackPlayer,
  whiteRating,
  blackRating,
  className = '',
}) => {
  const embedUrl =
    platform === 'lichess'
      ? `https://lichess.org/embed/game/${gameId}?theme=auto&bg=dark`
      : `https://www.chess.com/emboard?id=${gameId}`;

  return (
    <div className={`relative overflow-hidden rounded-lg bg-gray-900 ${className}`}>
      {/* Player info header */}
      <div className="absolute top-0 left-0 right-0 p-2 bg-gradient-to-b from-black/80 to-transparent z-10">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-gray-800 border border-gray-600 rounded-sm" />
            <span className="text-white font-medium">{blackPlayer || 'Black'}</span>
            {blackRating && <span className="text-gray-400">({blackRating})</span>}
          </div>
        </div>
      </div>

      {/* Game iframe */}
      <div className="aspect-square">
        <iframe
          src={embedUrl}
          className="w-full h-full"
          frameBorder="0"
          allowFullScreen
          title="Chess game"
        />
      </div>

      {/* Player info footer */}
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent z-10">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-white border border-gray-400 rounded-sm" />
            <span className="text-white font-medium">{whitePlayer || 'White'}</span>
            {whiteRating && <span className="text-gray-400">({whiteRating})</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

// Theater box component that combines stream and game embeds
interface TheaterBoxProps {
  type: 'stream' | 'game' | 'announcement';
  streamConfig?: StreamConfig;
  gameConfig?: ChessGameEmbedProps;
  announcementContent?: React.ReactNode;
  title?: string;
  subtitle?: string;
  onClose?: () => void;
  className?: string;
}

export const TheaterBox: React.FC<TheaterBoxProps> = ({
  type,
  streamConfig,
  gameConfig,
  announcementContent,
  title,
  subtitle,
  onClose,
  className = '',
}) => {
  return (
    <div className={`relative overflow-hidden rounded-xl bg-gray-800 ${className}`}>
      {/* Header */}
      {(title || subtitle) && (
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              {title && <h3 className="text-lg font-semibold text-white">{title}</h3>}
              {subtitle && <p className="text-sm text-gray-400">{subtitle}</p>}
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {type === 'stream' && streamConfig && (
          <StreamEmbed config={streamConfig} className="aspect-video" />
        )}

        {type === 'game' && gameConfig && (
          <ChessGameEmbed {...gameConfig} className="max-w-md mx-auto" />
        )}

        {type === 'announcement' && announcementContent && (
          <div className="prose prose-invert max-w-none">{announcementContent}</div>
        )}
      </div>
    </div>
  );
};

export default StreamEmbed;
