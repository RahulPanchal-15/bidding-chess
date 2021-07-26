import {
  INPUT_EVENT_TYPE,
  COLOR,
  Chessboard,
  MARKER_TYPE,
} from "./src/cm-chessboard/Chessboard.js";

// taking div with 'board' id to render chesssboard
const BOARD = document.querySelector("#board");

// FEN Values for testing purposes
const fenValues = {
  checkmate: "rnb1kbnr/pppp1ppp/8/4p3/5PPq/8/PPPPP2P/RNBQKBNR w KQkq - 1 3",
  promotion: "rnbqkb1r/ppppppPp/8/5B1n/8/8/PPPPPpKP/RNBQ2NR b kq - 3 9",
  draw: "4k3/4P3/4K3/8/8/8/8/8 b - - 0 78",
  castling: "4k2r/6r1/8/8/8/8/3R4/R3K3 w Qk - 0 1",
  fresh: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
};

// initializing chess engine
const chess = new Chess();

// function to create a new game after previous game finishes
function newGame(chess, board) {
  // to display game over message
  if (chess.in_checkmate()) {
    alert(
      `CHECKMATE! ${chess.turn() === "w" ? "Black" : "White"} wins (o゜▽゜)o☆`
    );
    window.chessData.state = 2; // win
  } else if (chess.in_draw()) {
    alert(`DRAW! No one wins ⚆_⚆`);
    window.chessData.state = 1;
  } else if (chess.in_stalemate()) {
    alert(`STALEMATE! Too bad ಥ_ಥ`);
    window.chessData.state = 1;
  } else if (chess.in_threefold_repetition()) {
    alert(`THREEFOLD REPETITION! Why you do this ಠ▃ಠ`);
    window.chessData.state = 1;
  } else {
    alert("ERROR!");
    window.chessData.state = 1;
  }

  // resetting chess engine and chessboard
  chess.reset();
  board.setPosition(chess.fen());
  // console.log("FEN", chess.fen());
}

// pawn promotion workaround
function promote() {
  let piece = undefined;
  while (!piece)
    piece = prompt(
      "Enter promotion piece: \nq: Queen\nr: Rook\nn: Knight\nb: Bishop"
    );
  return piece;
}

// returns the last move made by player in PGN format
function lastPGN() {
  let arr = chess.pgn().split(" ");
  return arr[arr.length - 1];
}

// handler for chess game
function inputHandler(event) {
  // console.log("event", event);
  // removes markers from previous move
  event.chessboard.removeMarkers(undefined, MARKER_TYPE.dot);
  // checks whether game_over = true, if yes, reset and new game
  if (chess.game_over()) {
    newGame(chess, board);
  }
  if (event.type === INPUT_EVENT_TYPE.moveStart) {
    // event.type == INPUT_EVENT_TYPE.moveStart, render the move markers
    const moves = chess.moves({ square: event.square, verbose: true });
    for (const move of moves) {
      event.chessboard.addMarker(move.to, MARKER_TYPE.dot);
    }
    return moves.length > 0;
  } else if (event.type === INPUT_EVENT_TYPE.moveDone) {
    // event.type == INPUT_EVENT_TYPE.moveDone, update chess engine and move piece on chessboard
    const move = { from: event.squareFrom, to: event.squareTo, promotion: "q" };
    let result = chess.move(move);
    // console.log(move);
    // console.log("result", result);

    // handles invalid moves, i.e. moves made which aren't marked on board
    if (!result) {
      console.warn("Invalid Move", move);
      return result;
    }

    // pawn promotion fix, due to lack of chess engine support to let player chose promotion piece
    if (result.flags.includes("p")) {
      // undos the default queen promotion
      chess.undo();
      // returns piece name, based on user input, and sets promotion property of move to returned value
      move.promotion = promote();
      // now updates chess according to new promotion value
      result = chess.move(move);
      // refreshes board according to chess engine's FEN value
      board.setPosition(chess.fen());
    }

    switch (result.flags) {
      case "k": // Kingside Castling
      case "q": // Queenside Castling
      case "e": // En Passant
        board.setPosition(chess.fen());
        break;
    }
    // console.log(result.flags);
    // console.log("FEN", chess.fen());
    // console.log("PGN", chess.pgn());
    // console.log("PGN", lastPGN());
    window.chessData.FEN = chess.fen();
    window.chessData.PGN = lastPGN();
    window.chessData.turn = chess.turn() === "w" ? 1 : 2; // white = 1, black = 2
    window.chessData.state = 0;
    return result;
  }
}

// creating new board
let board = new Chessboard(BOARD, {
  position: chess.fen(),
  sprite: { url: "./assets/images/chessboard-sprite-staunty.svg" },
  style: { moveMarker: MARKER_TYPE.square, hoverMarker: undefined },
  orientation: COLOR.white,
});

window.chessData = {};
window.chessData.FEN = chess.fen();
window.chessData.PGN = lastPGN();
window.chessData.turn = chess.turn() === "w" ? 1 : 2; // white = 1, black = 2
if (!chess.game_over || window.chessData.FEN === fenValues.fresh) {
  window.chessData.state = 0;  // game in progress
} else {
  if (chess.in_checkmate()) window.chessData.state = 2;
  else window.chessData.state = 1;
}

board.enableMoveInput(inputHandler);

console.log("Use object 'chessData' in the console to get game data.");