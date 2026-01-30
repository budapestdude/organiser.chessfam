// TODO: Full conversion to chessboardjs needed
// This is a temporary stub to fix the build

interface ChessNotationTextProps {
  content: string;
}

export default function ChessNotationText({ content }: ChessNotationTextProps) {
  return <span className="text-white/90">{content}</span>;
}
