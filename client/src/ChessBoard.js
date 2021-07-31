import React, {Component} from 'react';
import Chess from 'chess.js';


import {Chessboard, INPUT_EVENT_TYPE, COLOR, MARKER_TYPE} from "cm-chessboard"

// import "./styles/page.css"
import "./styles/cm-chessboard.css"
import "./ChessBoard.css"

class ChessBoard extends Component {
  constructor(props) {
    super();
    this.state = {
      fen: props.fen,
      turn: props.turn,
      final_fen: '',
      hasMoved : false,
      result: props.result
    };
  }

  componentDidMount() {
    this.game = new Chess(this.state.fen);
    let board_element = document.querySelector("#root .App #game #board")
    this.board = new Chessboard(board_element, {
      position: this.state.fen,
      orientation: parseInt(this.state.turn) === 1 ? COLOR.white : COLOR.black,
      responsive: true,
      sprite: {
        url: "./chessboard-sprite.svg", // pieces and markers are stored as svg in the sprite
        grid: 40 // the sprite is tiled with one piece every 40px
      }
    });
    this.board.enableMoveInput(this.inputHandler);
  }
  
  promote = () => {
    let piece = undefined;
    while (!piece)
      piece = prompt(
        "Enter promotion piece: \nq: Queen\nr: Rook\nn: Knight\nb: Bishop"
      );
    return piece;
  }

  undoMove = () => {
    this.game.undo();
    this.board.setPosition(this.game.fen());
    this.setState({
      hasMoved:false
    })
    this.props.boardChange(false);
    this.board.enableMoveInput(this.inputHandler);
  }

  lastPGN = () => {
    let arr = this.game.pgn().split(" ");
    return arr[arr.length - 1];
  }

  getResult = (chessGame) => {
    let result = 0 // NA
    if (chessGame.in_checkmate()) {
      // alert(
      //   `CHECKMATE! ${chessGame.turn() === "w" ? "Black" : "White"} wins (o゜▽゜)o☆`
      // );
      result = 1; // win
    } else if (chessGame.in_draw()) {
      // alert(`DRAW! No one wins ⚆_⚆`);
      result = 2;
    } else if (chessGame.in_stalemate()) {
      // alert(`STALEMATE! Too bad ಥ_ಥ`);
      result = 2;
    } else if (chessGame.in_threefold_repetition()) {
      // alert(`THREEFOLD REPETITION! Why you do this ಠ▃ಠ`);
      result = 2;
    } else {
      result = 0;
    }
    return result;
  }

  inputHandler = (event) => {
    // console.log("event", event);
    // removes markers from previous move
    event.chessboard.removeMarkers(undefined, MARKER_TYPE.dot);
    
    if(parseInt(this.state.result)==0){

      if (event.type === INPUT_EVENT_TYPE.moveStart) {
        // event.type == INPUT_EVENT_TYPE.moveStart, render the move markers
        const moves = this.game.moves({ square: event.square, verbose: true });
        for (const move of moves) {
          event.chessboard.addMarker(move.to, MARKER_TYPE.dot);
        }
        return moves.length > 0;
      } else if (event.type === INPUT_EVENT_TYPE.moveDone) {
        // event.type == INPUT_EVENT_TYPE.moveDone, update chess engine and move piece on chessboard
        const move = { from: event.squareFrom, to: event.squareTo, promotion: "q" };
        let result = this.game.move(move);
  
        // handles invalid moves, i.e. moves made which aren't marked on board
        if (!result) {
          console.warn("Invalid Move", move);
          return result;
        }
  
        // pawn promotion fix, due to lack of chess engine support to let player chose promotion piece
        if (result.flags.includes("p")) {
          // undos the default queen promotion
          this.game.undoMove();
          // returns piece name, based on user input, and sets promotion property of move to returned value
          move.promotion = this.promote();
          // now updates chess according to new promotion value
          result = this.game.move(move);
          // refreshes board according to chess engine's FEN value
          this.board.setPosition(this.game.fen());
        }
  
        switch (result.flags) {
          case "k": // Kingside Castling
          case "q": // Queenside Castling
          case "e": // En Passant
            this.board.setPosition(this.game.fen());
            break;
          default:
            console.log("Invalid character");
        }
  
        this.setState({
          final_fen: this.game.fen(),
          hasMoved: true,
          result : this.getResult(this.game)
        });
        this.props.boardChange(true,this.state.result);
        this.board.disableMoveInput();
        return result;
      }
      
    }
    // checks whether game_over = true, if yes, reset and new game
    // if (this.game.game_over()) {
    //   alert("Game over,please wait for new game to begin!");
    // }
    
  };

  render() {
    return (
      <div id="game" className="game">
        <div
            id='board' 
            name = "chessgame"
            style={{
              display: 'inline-block',
              alignContent: 'center',
              maxWidth: '60vh',
              maxHeight: '60vh',
              width: `calc(100vw - 40px)`,
              height: `calc(95vw - 40px)`,
              marginRight: '20p',
              marginTop: '20px',
              marginBottom: '20px'
            }}
        >
        </div>
        {/* <div className="container">
          <button className="btn btn-dark" type="button" id="undo-button" onClick={this.undoMove}>Undo</button>
        </div> */}
      </div>
    );
  }
}

export default ChessBoard;