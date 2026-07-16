import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Chess } from 'chess.js';
import { Chessboard, COLOR, INPUT_EVENT_TYPE, MARKER_TYPE } from 'cm-chessboard';
import { assetUrl } from '../utils/format';
import '../styles/cm-chessboard.css';

function getLocalResult(chessGame) {
  if (chessGame.in_checkmate()) return 1;
  if (
    chessGame.in_draw() ||
    chessGame.in_stalemate() ||
    chessGame.in_threefold_repetition()
  ) {
    return 2;
  }
  return 0;
}

function lastPGN(chessGame) {
  const arr = chessGame.pgn().split(' ');
  return arr[arr.length - 1];
}

const ChessBoard = forwardRef(function ChessBoard(
  { fen, turn, result, onBoardChange, interactive = true },
  ref
) {
  const boardElementRef = useRef(null);
  const boardRef = useRef(null);
  const gameRef = useRef(null);
  const currentMoveRef = useRef(null);
  const lastSyncedFenRef = useRef('');
  const hasMovedRef = useRef(false);

  const [moveState, setMoveState] = useState({
    hasMoved: false,
    move: '',
    finalFen: '',
    result: '0',
  });
  const [showPromotion, setShowPromotion] = useState(false);
  const sideTurn = String(turn) === '1' ? 'w' : 'b';

  const setMovedState = useCallback((nextState) => {
    hasMovedRef.current = nextState.hasMoved;
    setMoveState(nextState);
  }, []);

  const commitMove = useCallback(
    (chessGame, moveResult) => {
      const nextState = {
        hasMoved: true,
        move: lastPGN(chessGame),
        finalFen: chessGame.fen(),
        result: String(getLocalResult(chessGame)),
      };
      setMovedState(nextState);
      onBoardChange?.(true);
      boardRef.current?.disableMoveInput();
      return moveResult;
    },
    [onBoardChange, setMovedState]
  );

  const inputHandler = useCallback(
    (event) => {
      event.chessboard.removeMarkers(undefined, MARKER_TYPE.dot);
      const chessGame = gameRef.current;

      if (!interactive) return false;
      if (parseInt(String(result), 10) !== 0) return false;

      if (event.type === INPUT_EVENT_TYPE.moveStart) {
        const moves = chessGame.moves({ square: event.square, verbose: true });
        for (const move of moves) {
          event.chessboard.addMarker(move.to, MARKER_TYPE.dot);
        }
        return moves.length > 0;
      }

      if (event.type === INPUT_EVENT_TYPE.moveDone) {
        currentMoveRef.current = {
          from: event.squareFrom,
          to: event.squareTo,
          promotion: 'q',
        };

        const moveResult = chessGame.move(currentMoveRef.current);
        if (!moveResult) {
          console.warn('Invalid move', currentMoveRef.current);
          return false;
        }

        if (moveResult.flags.includes('p')) {
          chessGame.undo();
          setShowPromotion(true);
          return false;
        }

        if (['k', 'q', 'e'].includes(moveResult.flags)) {
          boardRef.current?.setPosition(chessGame.fen());
        }

        return commitMove(chessGame, moveResult);
      }

      return false;
    },
    [commitMove, interactive, result]
  );

  const handlePromotion = useCallback(
    (event) => {
      const piece = event.currentTarget.value;
      const chessGame = gameRef.current;
      setShowPromotion(false);

      currentMoveRef.current.promotion = piece;
      const moveResult = chessGame.move(currentMoveRef.current);
      boardRef.current?.setPosition(chessGame.fen());
      commitMove(chessGame, moveResult);
    },
    [commitMove]
  );

  useImperativeHandle(
    ref,
    () => ({
      getMoveState: () => moveState,
      resetMoveInput: () => {
        const restoreFen = lastSyncedFenRef.current || fen;
        if (restoreFen) {
          gameRef.current = new Chess(restoreFen);
          boardRef.current?.setPosition(restoreFen, false);
          boardRef.current?.removeMarkers?.(undefined, MARKER_TYPE.dot);
        }

        const resetState = {
          hasMoved: false,
          move: '',
          finalFen: '',
          result: '0',
        };
        setMovedState(resetState);
        setShowPromotion(false);
        currentMoveRef.current = null;
        onBoardChange?.(false);

        if (interactive) {
          boardRef.current?.enableMoveInput(inputHandler);
        } else {
          boardRef.current?.disableMoveInput();
        }
      },
    }),
    [fen, inputHandler, interactive, moveState, onBoardChange, setMovedState]
  );

  useEffect(() => {
    if (!boardElementRef.current || boardRef.current || !fen) return;

    gameRef.current = new Chess(fen);
    lastSyncedFenRef.current = fen;
    boardRef.current = new Chessboard(boardElementRef.current, {
      position: fen,
      orientation: parseInt(turn, 10) === 1 ? COLOR.white : COLOR.black,
      responsive: true,
      sprite: {
        url: assetUrl('chessboard-sprite.svg'),
        grid: 40,
      },
    });
    if (interactive) {
      boardRef.current.enableMoveInput(inputHandler);
    } else {
      boardRef.current.disableMoveInput();
    }
  }, [fen, inputHandler, interactive, turn]);

  useEffect(() => {
    if (!boardRef.current) return;
    if (interactive) {
      boardRef.current.enableMoveInput(inputHandler);
    } else {
      boardRef.current.disableMoveInput();
      setShowPromotion(false);
      if (hasMovedRef.current) {
        setMovedState({
          hasMoved: false,
          move: '',
          finalFen: '',
          result: '0',
        });
        onBoardChange?.(false);
      }
    }
  }, [inputHandler, interactive, onBoardChange, setMovedState]);

  useEffect(() => {
    if (!boardRef.current || !fen || fen === lastSyncedFenRef.current) return;
    if (hasMovedRef.current) return;

    lastSyncedFenRef.current = fen;
    gameRef.current = new Chess(fen);
    boardRef.current.setPosition(fen, false);
    boardRef.current.setOrientation(parseInt(turn, 10) === 1 ? COLOR.white : COLOR.black);
    setMovedState({
      hasMoved: false,
      move: '',
      finalFen: '',
      result: '0',
    });
    setShowPromotion(false);
    if (interactive) {
      boardRef.current.enableMoveInput(inputHandler);
    } else {
      boardRef.current.disableMoveInput();
    }
    onBoardChange?.(false);
  }, [fen, inputHandler, interactive, onBoardChange, setMovedState, turn]);

  return (
    <div className="mx-auto w-full">
      <div
        ref={boardElementRef}
        className="mx-auto aspect-square w-full max-w-[min(72vw,520px)] border-3 border-ink shadow-brutal-sm"
      />

      {showPromotion && (
        <div className="surface-shell mt-3 border-3 border-ink p-3 shadow-brutal-sm">
          <p className="mb-2 font-mono text-xs font-semibold uppercase">Promote pawn</p>
          <div className="flex flex-wrap gap-2">
            {['q', 'r', 'b', 'n'].map((piece) => (
              <button
                key={piece}
                type="button"
                value={piece}
                onClick={handlePromotion}
                className="brutal-btn flex h-12 w-12 items-center justify-center p-1"
              >
                <img
                  src={assetUrl(`${sideTurn}${piece}.svg`)}
                  alt={`Promote to ${piece}`}
                  className="h-8 w-8"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

export default ChessBoard;
