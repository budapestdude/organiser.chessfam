// TODO: Full conversion to chessboardjs needed
// This is a temporary stub to fix the build

interface ChessBoardWithVariationsProps {
  initialPgn?: string;
  onPgnChange?: (pgn: string) => void;
  editable?: boolean;
}

export default function ChessBoardWithVariations({
  initialPgn
}: ChessBoardWithVariationsProps) {
  return (
    <div className="bg-white/5 rounded-xl p-6 border border-white/10">
      <div className="text-white/60 text-center py-12">
        <p>Interactive chess board with variations</p>
        <p className="text-sm mt-2">This component is being updated to use chessboard.js</p>
        {initialPgn && <p className="text-xs mt-4 text-white/40 font-mono">{initialPgn.substring(0, 100)}...</p>}
      </div>
    </div>
  );
}
