import { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
// @ts-ignore - chessboardjs doesn't have types
// @ts-ignore - cm-chessboard doesn't have types
import { Chessboard } from 'cm-chessboard/src/Chessboard.js';
import 'cm-chessboard/assets/chessboard.css';
import { Check, X, Lightbulb } from 'lucide-react';

interface ChessPuzzleProps {
  fen: string;
  solutionMoves: string[];
  hint?: string;
}

export default function ChessPuzzle({ fen, solutionMoves, hint }: ChessPuzzleProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const boardInstanceRef = useRef<any>(null);
  const [game, setGame] = useState(() => new Chess(fen));
  const [moveIndex, setMoveIndex] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [status, setStatus] = useState<'solving' | 'correct' | 'incorrect'>('solving');
  const [message, setMessage] = useState('');

  // Initialize board
  useEffect(() => {
    if (boardRef.current && !boardInstanceRef.current) {
      boardInstanceRef.current = Chessboard(boardRef.current, {
        position: fen,
        draggable: true,
        pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png',
        boardWidth: 400,
        onDrop: (source: string, target: string) => {
          const gameCopy = new Chess(game.fen());

          try {
            const move = gameCopy.move({
              from: source,
              to: target,
              promotion: 'q',
            });

            if (!move) return 'snapback';

            const expectedMove = solutionMoves[moveIndex];

            if (move.san === expectedMove) {
              setGame(gameCopy);
              setMoveIndex(moveIndex + 1);

              if (moveIndex + 1 >= solutionMoves.length) {
                setStatus('correct');
                setMessage('Puzzle solved! Well done!');
              } else {
                setMessage(`Correct! Next move...`);
              }
              return;
            } else {
              setStatus('incorrect');
              setMessage(`Not quite. Expected: ${expectedMove}`);
              setTimeout(() => {
                setStatus('solving');
                setMessage('');
              }, 2000);
              return 'snapback';
            }
          } catch {
            return 'snapback';
          }
        },
      });
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

  const resetPuzzle = () => {
    const newGame = new Chess(fen);
    setGame(newGame);
    setMoveIndex(0);
    setStatus('solving');
    setMessage('');
    setShowHint(false);
    if (boardInstanceRef.current) {
      boardInstanceRef.current.position(fen, false);
    }
  };

  return (
    <div className="bg-white/5 rounded-xl p-6 border border-white/10 my-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-white font-semibold flex items-center gap-2">
          <span className="text-gold-400">♟</span> Chess Puzzle
        </h4>
        <div className="flex gap-2">
          {hint && (
            <button
              onClick={() => setShowHint(!showHint)}
              className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors flex items-center gap-2 text-sm"
            >
              <Lightbulb className="w-4 h-4" />
              Hint
            </button>
          )}
          <button
            onClick={resetPuzzle}
            className="px-3 py-1 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors text-sm"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div>
          <div ref={boardRef} style={{ width: '400px' }} />
        </div>

        <div className="flex-1">
          {status === 'correct' && (
            <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 flex items-center gap-3">
              <Check className="w-6 h-6 text-green-400" />
              <span className="text-green-400 font-semibold">{message}</span>
            </div>
          )}

          {status === 'incorrect' && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
              <X className="w-6 h-6 text-red-400" />
              <span className="text-red-400 font-semibold">{message}</span>
            </div>
          )}

          {status === 'solving' && message && (
            <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
              <span className="text-blue-400">{message}</span>
            </div>
          )}

          {showHint && hint && (
            <div className="bg-gold-500/20 border border-gold-500/30 rounded-lg p-4 mt-4">
              <div className="flex items-start gap-2">
                <Lightbulb className="w-5 h-5 text-gold-400 mt-0.5" />
                <div>
                  <div className="text-gold-400 font-semibold mb-1">Hint</div>
                  <div className="text-white/80">{hint}</div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 text-white/60 text-sm">
            <div>Move {moveIndex + 1} of {solutionMoves.length}</div>
            <div className="text-xs mt-1 text-white/40">
              Drag pieces to solve the puzzle
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
