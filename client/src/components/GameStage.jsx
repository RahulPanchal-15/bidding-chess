import ChessBoard from './ChessBoard';

export default function GameStage({
  boardRef,
  fen,
  turn,
  result,
  onBoardChange,
  interactive = true,
}) {
  return (
    <ChessBoard
      ref={boardRef}
      fen={fen}
      turn={turn}
      result={result}
      onBoardChange={onBoardChange}
      interactive={interactive}
    />
  );
}
