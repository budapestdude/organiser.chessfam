import React, { useState, useEffect, useRef } from 'react';
// @ts-ignore - chessboardjs doesn't have types
// @ts-ignore - cm-chessboard doesn't have types
import { Chessboard } from 'cm-chessboard/src/Chessboard.js';
import 'cm-chessboard/assets/chessboard.css';
import { Chess } from 'chess.js';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Upload,
  RotateCw,
  Download,
  Play,
  Pause,
  FileText,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

interface ChessBoardProps {
  initialPgn?: string;
  onPgnChange?: (pgn: string) => void;
  editable?: boolean;
}

const ChessBoard: React.FC<ChessBoardProps> = ({
  initialPgn = '',
  onPgnChange,
  editable = true
}) => {
  const boardRef = useRef<HTMLDivElement>(null);
  const boardInstanceRef = useRef<any>(null);
  const [game, setGame] = useState(new Chess());
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>('white');
  const [moveInput, setMoveInput] = useState('');
  const [pgnInput, setPgnInput] = useState('');
  const [showPgnUpload, setShowPgnUpload] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [autoPlay, setAutoPlay] = useState(false);
  const [autoPlaySpeed, setAutoPlaySpeed] = useState(1000);

  // Initialize board
  useEffect(() => {
    if (boardRef.current && !boardInstanceRef.current) {
      const config: any = {
        position: 'start',
        draggable: editable,
        pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png',
        orientation: boardOrientation,
      };

      if (editable) {
        config.onDrop = (source: string, target: string) => {
          const move = {
            from: source,
            to: target,
            promotion: 'q'
          };

          try {
            const newGame = new Chess(game.fen());
            const result = newGame.move(move);

            if (result) {
              // Truncate history if we're making a move from a previous position
              const newHistory = currentMoveIndex >= 0
                ? [...moveHistory.slice(0, currentMoveIndex + 1), result.san]
                : [result.san];

              setGame(newGame);
              setMoveHistory(newHistory);
              setCurrentMoveIndex(newHistory.length - 1);
              setError(null);

              if (onPgnChange) {
                onPgnChange(newGame.pgn());
              }

              return;
            }
            return 'snapback';
          } catch (err) {
            return 'snapback';
          }
        };
      }

      boardInstanceRef.current = Chessboard(boardRef.current, config);
    }

    return () => {
      if (boardInstanceRef.current) {
        boardInstanceRef.current.destroy();
        boardInstanceRef.current = null;
      }
    };
  }, []);

  // Update board when game changes
  useEffect(() => {
    if (boardInstanceRef.current) {
      boardInstanceRef.current.position(game.fen(), true);
    }
  }, [game]);

  // Initialize game from PGN (only on mount)
  useEffect(() => {
    if (initialPgn) {
      loadPgn(initialPgn);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Auto-play effect
  useEffect(() => {
    if (!autoPlay) return;

    if (currentMoveIndex < moveHistory.length - 1) {
      const timeout = setTimeout(() => {
        handleNext();
      }, autoPlaySpeed);
      return () => clearTimeout(timeout);
    } else {
      setAutoPlay(false);
    }
  }, [autoPlay, currentMoveIndex, moveHistory.length, autoPlaySpeed]);

  const loadPgn = (pgn: string) => {
    try {
      const newGame = new Chess();
      newGame.loadPgn(pgn);

      // Get move history
      const history = newGame.history();

      // Reset to start position
      newGame.reset();
      setGame(newGame);
      setMoveHistory(history);
      setCurrentMoveIndex(-1);
      setError(null);
      setSuccess('PGN loaded successfully!');
      setTimeout(() => setSuccess(null), 3000);

      if (onPgnChange) {
        onPgnChange(pgn);
      }
    } catch (err) {
      setError('Invalid PGN format');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handlePgnUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pgnInput.trim()) {
      setError('Please enter PGN notation');
      setTimeout(() => setError(null), 3000);
      return;
    }

    loadPgn(pgnInput);
    setShowPgnUpload(false);
    setPgnInput('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      loadPgn(content);
    };
    reader.readAsText(file);
  };

  const makeMove = (move: string) => {
    try {
      const newGame = new Chess(game.fen());
      const result = newGame.move(move);

      if (result) {
        // Truncate history if we're making a move from a previous position
        const newHistory = currentMoveIndex >= 0
          ? [...moveHistory.slice(0, currentMoveIndex + 1), result.san]
          : [result.san];

        setGame(newGame);
        setMoveHistory(newHistory);
        setCurrentMoveIndex(newHistory.length - 1);
        setError(null);
        setMoveInput('');

        if (onPgnChange) {
          onPgnChange(newGame.pgn());
        }

        return true;
      }
      return false;
    } catch (err) {
      setError('Invalid move');
      setTimeout(() => setError(null), 3000);
      return false;
    }
  };

  const handleMoveInput = (e: React.FormEvent) => {
    e.preventDefault();
    if (!moveInput.trim()) return;

    if (!makeMove(moveInput)) {
      setError(`Invalid move: ${moveInput}`);
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleFirst = () => {
    const newGame = new Chess();
    setGame(newGame);
    setCurrentMoveIndex(-1);
    setAutoPlay(false);
  };

  const handlePrevious = () => {
    if (currentMoveIndex < 0) return;

    const newGame = new Chess();
    for (let i = 0; i < currentMoveIndex; i++) {
      newGame.move(moveHistory[i]);
    }
    setGame(newGame);
    setCurrentMoveIndex(currentMoveIndex - 1);
    setAutoPlay(false);
  };

  const handleNext = () => {
    if (currentMoveIndex >= moveHistory.length - 1) {
      setAutoPlay(false);
      return;
    }

    const newGame = new Chess(game.fen());
    newGame.move(moveHistory[currentMoveIndex + 1]);
    setGame(newGame);
    setCurrentMoveIndex(currentMoveIndex + 1);
  };

  const handleLast = () => {
    const newGame = new Chess();
    moveHistory.forEach(move => newGame.move(move));
    setGame(newGame);
    setCurrentMoveIndex(moveHistory.length - 1);
    setAutoPlay(false);
  };

  const toggleAutoPlay = () => {
    setAutoPlay(!autoPlay);
  };

  const flipBoard = () => {
    const newOrientation = boardOrientation === 'white' ? 'black' : 'white';
    setBoardOrientation(newOrientation);
    if (boardInstanceRef.current) {
      boardInstanceRef.current.orientation(newOrientation);
    }
  };

  const downloadPgn = () => {
    const pgn = game.pgn();
    const blob = new Blob([pgn], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'game.pgn';
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetBoard = () => {
    const newGame = new Chess();
    setGame(newGame);
    setMoveHistory([]);
    setCurrentMoveIndex(-1);
    setMoveInput('');
    setError(null);
    setAutoPlay(false);
  };

  // Get move pairs for display (1. e4 e5, 2. Nf3 Nc6, etc.)
  const getMovePairs = () => {
    const pairs: Array<{ number: number; white: string; black?: string }> = [];
    for (let i = 0; i < moveHistory.length; i += 2) {
      pairs.push({
        number: Math.floor(i / 2) + 1,
        white: moveHistory[i],
        black: moveHistory[i + 1]
      });
    }
    return pairs;
  };

  const gameStatus = game.isCheckmate()
    ? 'Checkmate!'
    : game.isDraw()
    ? 'Draw!'
    : game.isStalemate()
    ? 'Stalemate!'
    : game.isThreefoldRepetition()
    ? 'Draw by repetition!'
    : game.isInsufficientMaterial()
    ? 'Draw by insufficient material!'
    : game.isCheck()
    ? 'Check!'
    : '';

  return (
    <div className="space-y-6">
      {/* Status Messages */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-red-400">{error}</p>
        </motion.div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-center gap-3"
        >
          <CheckCircle2 className="w-5 h-5 text-green-400" />
          <p className="text-green-400">{success}</p>
        </motion.div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Chessboard */}
        <div className="lg:col-span-2">
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Board</h3>
              <div className="flex gap-2">
                <button
                  onClick={flipBoard}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  title="Flip board"
                >
                  <RotateCw className="w-4 h-4 text-white" />
                </button>
                {moveHistory.length > 0 && (
                  <button
                    onClick={downloadPgn}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                    title="Download PGN"
                  >
                    <Download className="w-4 h-4 text-white" />
                  </button>
                )}
              </div>
            </div>

            {gameStatus && (
              <div className={`mb-4 p-3 rounded-lg text-center font-medium ${
                game.isCheckmate() ? 'bg-gold-500/20 text-gold-400' :
                game.isCheck() ? 'bg-orange-500/20 text-orange-400' :
                'bg-blue-500/20 text-blue-400'
              }`}>
                {gameStatus}
                {game.isCheckmate() && (
                  <div className="text-sm mt-1">
                    {game.turn() === 'w' ? 'Black' : 'White'} wins!
                  </div>
                )}
              </div>
            )}

            <div className="relative">
              <div ref={boardRef} style={{ width: '100%', maxWidth: '600px' }} />
            </div>

            {/* Board Controls */}
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                onClick={handleFirst}
                disabled={currentMoveIndex < 0}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="First move"
              >
                <ChevronsLeft className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={handlePrevious}
                disabled={currentMoveIndex < 0}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Previous move"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={toggleAutoPlay}
                disabled={moveHistory.length === 0 || currentMoveIndex >= moveHistory.length - 1}
                className="p-2 bg-gold-500/20 hover:bg-gold-500/30 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title={autoPlay ? 'Pause' : 'Auto-play'}
              >
                {autoPlay ? (
                  <Pause className="w-5 h-5 text-gold-400" />
                ) : (
                  <Play className="w-5 h-5 text-gold-400" />
                )}
              </button>
              <button
                onClick={handleNext}
                disabled={currentMoveIndex >= moveHistory.length - 1}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Next move"
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={handleLast}
                disabled={currentMoveIndex >= moveHistory.length - 1}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Last move"
              >
                <ChevronsRight className="w-5 h-5 text-white" />
              </button>
            </div>

            {autoPlay && (
              <div className="mt-4">
                <label className="block text-sm text-white/70 mb-2">
                  Auto-play Speed: {autoPlaySpeed}ms
                </label>
                <input
                  type="range"
                  min="300"
                  max="3000"
                  step="100"
                  value={autoPlaySpeed}
                  onChange={(e) => setAutoPlaySpeed(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            )}
          </div>
        </div>

        {/* Move History & Controls */}
        <div className="space-y-4">
          {/* Move Input */}
          {editable && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-white mb-3">Enter Move</h4>
              <form onSubmit={handleMoveInput} className="space-y-3">
                <input
                  type="text"
                  value={moveInput}
                  onChange={(e) => setMoveInput(e.target.value)}
                  placeholder="e.g., e4, Nf3, O-O"
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-gold-500"
                />
                <button
                  type="submit"
                  className="w-full py-2 bg-gradient-to-r from-gold-500 to-gold-600 text-chess-darker font-semibold rounded-lg hover:from-gold-400 hover:to-gold-500 transition-all"
                >
                  Make Move
                </button>
              </form>
            </div>
          )}

          {/* PGN Upload */}
          {editable && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <button
                onClick={() => setShowPgnUpload(!showPgnUpload)}
                className="w-full flex items-center justify-between text-white hover:text-gold-400 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  <span className="font-semibold">Load PGN</span>
                </div>
                <ChevronRight className={`w-4 h-4 transition-transform ${showPgnUpload ? 'rotate-90' : ''}`} />
              </button>

              {showPgnUpload && (
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="block text-xs text-white/70 mb-2">Upload PGN File</label>
                    <input
                      type="file"
                      accept=".pgn"
                      onChange={handleFileUpload}
                      className="w-full text-sm text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gold-500/20 file:text-gold-400 hover:file:bg-gold-500/30 file:cursor-pointer"
                    />
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="px-2 bg-chess-darker text-white/50">or paste PGN</span>
                    </div>
                  </div>

                  <form onSubmit={handlePgnUpload} className="space-y-3">
                    <textarea
                      value={pgnInput}
                      onChange={(e) => setPgnInput(e.target.value)}
                      placeholder="Paste PGN notation here..."
                      rows={6}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-xs font-mono placeholder-white/40 focus:outline-none focus:border-gold-500 resize-none"
                    />
                    <button
                      type="submit"
                      className="w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                      Load PGN
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* Move History */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Move History ({moveHistory.length})
              </h4>
              {moveHistory.length > 0 && editable && (
                <button
                  onClick={resetBoard}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto space-y-1 text-sm">
              {getMovePairs().length === 0 ? (
                <p className="text-white/50 text-center py-8">No moves yet</p>
              ) : (
                getMovePairs().map((pair, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-2 p-2 rounded-lg ${
                      (currentMoveIndex === index * 2 || currentMoveIndex === index * 2 + 1)
                        ? 'bg-gold-500/20'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    <span className="text-white/50 w-8">{pair.number}.</span>
                    <span
                      className={`flex-1 cursor-pointer ${
                        currentMoveIndex === index * 2 ? 'text-gold-400 font-semibold' : 'text-white'
                      }`}
                      onClick={() => {
                        const newGame = new Chess();
                        for (let i = 0; i <= index * 2; i++) {
                          newGame.move(moveHistory[i]);
                        }
                        setGame(newGame);
                        setCurrentMoveIndex(index * 2);
                      }}
                    >
                      {pair.white}
                    </span>
                    {pair.black && (
                      <span
                        className={`flex-1 cursor-pointer ${
                          currentMoveIndex === index * 2 + 1 ? 'text-gold-400 font-semibold' : 'text-white'
                        }`}
                        onClick={() => {
                          const newGame = new Chess();
                          for (let i = 0; i <= index * 2 + 1; i++) {
                            newGame.move(moveHistory[i]);
                          }
                          setGame(newGame);
                          setCurrentMoveIndex(index * 2 + 1);
                        }}
                      >
                        {pair.black}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Game Info */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-white/60">Turn:</span>
                <span className="text-white font-medium">
                  {game.turn() === 'w' ? 'White' : 'Black'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Move:</span>
                <span className="text-white font-medium">
                  {Math.floor(game.moveNumber())}
                </span>
              </div>
              {game.isCheck() && (
                <div className="flex justify-between">
                  <span className="text-white/60">Status:</span>
                  <span className="text-orange-400 font-medium">Check!</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChessBoard;
