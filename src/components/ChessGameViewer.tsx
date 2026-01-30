import { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { Play, Pause, SkipBack, SkipForward, ChevronLeft, ChevronRight } from 'lucide-react';
import $ from 'jquery';
import '@chrisoakman/chessboardjs/dist/chessboard-1.0.0.min.css';

// Make jQuery available globally FIRST
if (typeof window !== 'undefined') {
  (window as any).$ = $;
  (window as any).jQuery = $;
  console.log('[ChessGameViewer] jQuery set on window:', {
    hasWindow$: !!(window as any).$,
    hasWindowjQuery: !!(window as any).jQuery,
    $fn: !!(window as any).$ && !!(window as any).$.fn
  });
}

interface ChessGameViewerProps {
  pgn: string;
}

export default function ChessGameViewer({ pgn }: ChessGameViewerProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const boardInstanceRef = useRef<any>(null);
  const [game, setGame] = useState<Chess | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [currentMove, setCurrentMove] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const [chessboardLoaded, setChessboardLoaded] = useState(false);
  const [whiteName, setWhiteName] = useState('White');
  const [blackName, setBlackName] = useState('Black');
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // 1x speed by default

  // Load chessboard.js dynamically after component mounts
  useEffect(() => {
    if (typeof window !== 'undefined' && !chessboardLoaded) {
      console.log('[ChessGameViewer] Loading chessboard.js...');

      // Dynamically load the chessboard.js script
      // @ts-ignore - no types available for chessboard.js
      import('@chrisoakman/chessboardjs/dist/chessboard-1.0.0.min.js')
        .then(() => {
          console.log('[ChessGameViewer] Chessboard.js loaded successfully');
          console.log('[ChessGameViewer] window.Chessboard:', !!(window as any).Chessboard);
          setChessboardLoaded(true);
        })
        .catch((err) => {
          console.error('[ChessGameViewer] Failed to load chessboard.js:', err);
        });
    }
  }, [chessboardLoaded]);

  // Initialize board after chessboard.js is loaded
  useEffect(() => {
    if (!chessboardLoaded || !boardRef.current || boardInstanceRef.current) {
      console.log('[ChessGameViewer] Skipping board init', {
        chessboardLoaded,
        hasRef: !!boardRef.current,
        hasInstance: !!boardInstanceRef.current
      });
      return;
    }

    const Chessboard = (window as any).Chessboard;

    console.log('[ChessGameViewer] Initializing board', {
      hasRef: !!boardRef.current,
      hasChessboard: !!Chessboard,
      jQuery: !!(window as any).jQuery,
      $: !!(window as any).$
    });

    if (!Chessboard) {
      console.error('[ChessGameViewer] Chessboard constructor not found on window');
      return;
    }

    try {
      const config = {
        draggable: false,
        position: 'start',
        pieceTheme: '/img/chesspieces/wikipedia/{piece}.png',
        moveSpeed: 400, // Smooth animation speed in ms
        appearSpeed: 200, // Speed for pieces appearing
      };

      console.log('[ChessGameViewer] Creating board with config:', config);
      boardInstanceRef.current = Chessboard(boardRef.current, config);
      console.log('[ChessGameViewer] Board initialized successfully', boardInstanceRef.current);
    } catch (err) {
      console.error('[ChessGameViewer] Failed to initialize board:', err);
    }

    return () => {
      console.log('[ChessGameViewer] Cleaning up board');
      if (boardInstanceRef.current) {
        try {
          boardInstanceRef.current.destroy();
        } catch (err) {
          console.error('[ChessGameViewer] Error destroying board:', err);
        }
        boardInstanceRef.current = null;
      }
    };
  }, [chessboardLoaded]);

  // Load PGN
  useEffect(() => {
    try {
      console.log('[ChessGameViewer] Loading PGN:', pgn);

      // Parse PGN headers for player names
      const whiteMatch = pgn.match(/\[White\s+"([^"]+)"\]/);
      const blackMatch = pgn.match(/\[Black\s+"([^"]+)"\]/);

      if (whiteMatch && whiteMatch[1]) {
        setWhiteName(whiteMatch[1]);
      } else {
        setWhiteName('White');
      }

      if (blackMatch && blackMatch[1]) {
        setBlackName(blackMatch[1]);
      } else {
        setBlackName('Black');
      }

      console.log('[ChessGameViewer] Players:', { white: whiteMatch?.[1] || 'White', black: blackMatch?.[1] || 'Black' });

      // Clean PGN - remove comments and extra whitespace
      const cleanedPgn = pgn
        .replace(/\{[^}]*\}/g, '') // Remove curly brace comments
        .replace(/;[^\n]*/g, '') // Remove semicolon comments
        .trim();

      console.log('[ChessGameViewer] Cleaned PGN:', cleanedPgn);

      const chess = new Chess();
      const loadResult = chess.loadPgn(cleanedPgn);
      console.log('[ChessGameViewer] PGN load result:', loadResult);

      // Get the move history
      const moves = chess.history();
      console.log('[ChessGameViewer] Move history:', moves);
      setHistory(moves);

      // Reset to starting position
      chess.reset();
      setGame(chess);
      setCurrentMove(0);
      setError(null);

      // Update board to start position
      if (boardInstanceRef.current) {
        boardInstanceRef.current.position('start', false);
      }
    } catch (err) {
      console.error('[ChessGameViewer] Failed to load PGN:', err);
      setError(err instanceof Error ? err.message : 'Invalid PGN format');
      setGame(null);
      setHistory([]);
    }
  }, [pgn]);

  // Track previous move to determine if we're going forward or backward
  const prevMoveRef = useRef(0);
  const lastAnimatedMoveRef = useRef<string | null>(null);

  // Update board position when currentMove changes
  useEffect(() => {
    if (!boardInstanceRef.current || !game) return;

    const isForward = currentMove > prevMoveRef.current;
    const isBackward = currentMove < prevMoveRef.current;
    const isSingleStep = Math.abs(currentMove - prevMoveRef.current) === 1;

    console.log('[ChessGameViewer] Move change:', {
      from: prevMoveRef.current,
      to: currentMove,
      isForward,
      isBackward,
      isSingleStep
    });

    prevMoveRef.current = currentMove;

    // For single-step forward moves, use the .move() method for smooth animation
    if (isForward && isSingleStep && currentMove > 0 && currentMove <= history.length) {
      const lastMove = history[currentMove - 1];

      // Parse the move to get from/to squares
      const tempGameForMove = new Chess();
      for (let i = 0; i < currentMove - 1; i++) {
        tempGameForMove.move(history[i]);
      }

      try {
        const moveObj = tempGameForMove.move(lastMove);
        if (moveObj) {
          console.log('[ChessGameViewer] Move object:', moveObj);

          // Check if this is a castling move
          if (moveObj.flags.includes('k') || moveObj.flags.includes('q')) {
            // Castling - need to move both king and rook
            console.log('[ChessGameViewer] Castling detected', moveObj);

            // Move king
            const kingMove = `${moveObj.from}-${moveObj.to}`;

            // Determine rook move based on castling side
            let rookMove = '';
            if (moveObj.flags.includes('k')) {
              // Kingside castling
              if (moveObj.color === 'w') {
                rookMove = 'h1-f1'; // White kingside
              } else {
                rookMove = 'h8-f8'; // Black kingside
              }
            } else if (moveObj.flags.includes('q')) {
              // Queenside castling
              if (moveObj.color === 'w') {
                rookMove = 'a1-d1'; // White queenside
              } else {
                rookMove = 'a8-d8'; // Black queenside
              }
            }

            console.log('[ChessGameViewer] Executing castling moves:', { kingMove, rookMove });

            // Move both pieces - pass as separate parameters, not a single string
            boardInstanceRef.current.move(kingMove, rookMove);

            setTimeout(() => {
              lastAnimatedMoveRef.current = null;
            }, 500);

            return; // Exit early
          } else {
            // Normal move
            const moveNotation = `${moveObj.from}-${moveObj.to}`;
            console.log('[ChessGameViewer] Executing smooth move:', moveNotation);

            // Store the move we're animating
            lastAnimatedMoveRef.current = moveNotation;

            // Execute the move
            boardInstanceRef.current.move(moveNotation);

            // Clear the animated move after animation completes (plus buffer)
            setTimeout(() => {
              lastAnimatedMoveRef.current = null;
            }, 500); // moveSpeed is 400ms, add 100ms buffer

            return; // Exit early, don't use position()
          }
        }
      } catch (error) {
        console.error('[ChessGameViewer] Error parsing move:', error);
      }
    }

    // For all other cases (reset, jump, backward), use position()
    const tempGame = new Chess();
    for (let i = 0; i < currentMove; i++) {
      if (history[i]) {
        try {
          tempGame.move(history[i]);
        } catch (error) {
          console.error('[ChessGameViewer] Invalid move:', history[i], error);
        }
      }
    }

    const newFen = tempGame.fen();

    // Get current board position to compare
    const currentFen = boardInstanceRef.current.fen();

    // Only update if position actually changed
    if (currentFen !== newFen) {
      console.log('[ChessGameViewer] Setting position to:', newFen);
      boardInstanceRef.current.position(newFen, false); // Use false for instant update to avoid flashing
    } else {
      console.log('[ChessGameViewer] Position unchanged, skipping update');
    }
  }, [currentMove, history, game]);

  // Auto-play interval
  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (isPlaying) {
      // Base speed is 1500ms, adjust by playback speed
      const interval = 1500 / playbackSpeed;
      intervalRef.current = window.setInterval(() => {
        setCurrentMove((prev) => {
          if (prev >= history.length) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, interval);
    }

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, history.length, playbackSpeed]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setCurrentMove(0);
    setIsPlaying(false);
  };

  const handleEnd = () => {
    setCurrentMove(history.length);
    setIsPlaying(false);
  };

  const handlePrevMove = () => {
    setCurrentMove(Math.max(0, currentMove - 1));
    setIsPlaying(false);
  };

  const handleNextMove = () => {
    setCurrentMove(Math.min(history.length, currentMove + 1));
    setIsPlaying(false);
  };

  const cycleSpeed = () => {
    const speeds = [0.5, 1, 2, 4];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    setPlaybackSpeed(speeds[nextIndex]);
  };

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
            <span className="text-red-400 text-xs font-bold">!</span>
          </div>
          <div>
            <h4 className="text-red-400 font-semibold mb-1">Invalid PGN</h4>
            <p className="text-red-300/80 text-sm">
              The chess game could not be loaded. Please check that the PGN format is valid.
            </p>
            <p className="text-red-300/60 text-xs mt-2">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
        <div className="text-white/60 text-center">Loading game...</div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
      {/* Black Player Name */}
      <div className="mb-3 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-black/30 rounded-lg">
          <div className="w-3 h-3 rounded-full bg-gray-800 border border-gray-600"></div>
          <span className="text-white font-medium text-sm">{blackName}</span>
        </div>
      </div>

      {/* Chessboard */}
      <div className="mb-3 flex justify-center">
        <div
          ref={boardRef}
          style={{ width: '300px' }}
          className="relative"
        />
      </div>

      {/* White Player Name */}
      <div className="mb-4 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg">
          <div className="w-3 h-3 rounded-full bg-white border border-gray-300"></div>
          <span className="text-white font-medium text-sm">{whiteName}</span>
        </div>
      </div>

      {/* Move Display and Speed Control */}
      <div className="text-center mb-3 space-y-2">
        <div className="flex items-center justify-center gap-3">
          <div className="text-white/70 text-sm">
            {currentMove > 0 && history[currentMove - 1] ? (
              <>
                <span className="text-white font-semibold">
                  {Math.floor((currentMove - 1) / 2) + 1}.{(currentMove - 1) % 2 === 0 ? '' : '..'} {history[currentMove - 1]}
                </span>
                <span className="ml-2 text-white/50">
                  ({currentMove}/{history.length})
                </span>
              </>
            ) : (
              <span>Starting position</span>
            )}
          </div>

          {/* Speed Button */}
          <button
            onClick={cycleSpeed}
            className="px-2 py-1 rounded text-xs font-medium bg-white/10 text-white/80 hover:bg-white/20 transition-colors"
            title="Cycle playback speed"
          >
            {playbackSpeed}x
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={handleReset}
          className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white"
          title="Reset to start"
        >
          <SkipBack className="w-4 h-4" />
        </button>

        <button
          onClick={handlePrevMove}
          disabled={currentMove === 0}
          className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white disabled:opacity-30 disabled:cursor-not-allowed"
          title="Previous move"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          onClick={handlePlayPause}
          className="p-2 bg-gold-500 hover:bg-gold-400 rounded-lg transition-colors text-chess-darker"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>

        <button
          onClick={handleNextMove}
          disabled={currentMove === history.length}
          className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white disabled:opacity-30 disabled:cursor-not-allowed"
          title="Next move"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <button
          onClick={handleEnd}
          className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white"
          title="Jump to end"
        >
          <SkipForward className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
