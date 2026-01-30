import { useEffect, useRef } from 'react';
// @ts-ignore - chessboardjs doesn't have types
// @ts-ignore - cm-chessboard doesn't have types
import { Chessboard } from 'cm-chessboard/src/Chessboard.js';
import 'cm-chessboard/assets/chessboard.css';

interface ChessPositionViewerProps {
  fen: string;
  interactive?: boolean;
  size?: number;
}

export default function ChessPositionViewer({
  fen,
  interactive = false,
  size = 300
}: ChessPositionViewerProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const boardInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (boardRef.current && !boardInstanceRef.current) {
      boardInstanceRef.current = Chessboard(boardRef.current, {
        position: fen,
        draggable: interactive,
        pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png',
        boardWidth: size,
      });
    }

    return () => {
      if (boardInstanceRef.current) {
        boardInstanceRef.current.destroy();
        boardInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (boardInstanceRef.current) {
      boardInstanceRef.current.position(fen, false);
    }
  }, [fen]);

  return (
    <div className="bg-white/5 rounded-lg p-4 border border-white/10 inline-block my-4">
      <div ref={boardRef} style={{ width: `${size}px` }} />
      {interactive && (
        <p className="text-xs text-white/50 mt-2 text-center">
          Interactive - try moving pieces
        </p>
      )}
    </div>
  );
}
