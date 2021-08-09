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
      move: '',
      hasMoved : false,
      result: props.result,
      sideTurn : props.turn === 1 ? "w" : "b",
      promotionPiece : null
    };
  }

  componentDidMount() {
    // let promotion = "rnbqkb1r/ppppppPp/8/5B1n/8/8/PPPPPpKP/RNBQ2NR b kq - 3 9";
    this.game = new Chess(this.state.fen);
    // this.game = new Chess(promotion);
    let board_element = document.querySelector("#root .App #game #board")
    this.board = new Chessboard(board_element, {
      position: this.state.fen,
      // position: promotion,
      orientation: parseInt(this.state.turn) === 1 ? COLOR.white : COLOR.black,
      responsive: true,
      sprite: {
        url: "./chessboard-sprite.svg", // pieces and markers are stored as svg in the sprite
        grid: 40 // the sprite is tiled with one piece every 40px
      }
    });
    this.board.enableMoveInput(this.inputHandler);
  }

  handlePromotion = async(e) => {
    let piece = e.currentTarget.value;
    document.getElementById("promotion-tray").style.display = "none";
    document.getElementById("game").style.paddingBottom = "16px";
    console.log(piece)
    this.setState({
      promotionPiece : piece
    });
    this.currentMove.promotion= piece;
    console.log(this.currentMove);
    // now updates chess according to new promotion value
    const result = this.game.move(this.currentMove);
    console.log(result);
    // refreshes board according to chess engine's FEN value
    this.board.setPosition(this.game.fen());
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
      move: this.lastPGN(),
      result : this.getResult(this.game)
    });
    this.props.boardChange(true,this.state.result);
    this.board.disableMoveInput();
    return result;
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
    
    if(parseInt(this.state.result)===0){

      if (event.type === INPUT_EVENT_TYPE.moveStart) {
        // event.type == INPUT_EVENT_TYPE.moveStart, render the move markers
        const moves = this.game.moves({ square: event.square, verbose: true });
        for (const move of moves) {
          event.chessboard.addMarker(move.to, MARKER_TYPE.dot);
        }
        return moves.length > 0;
      } else if (event.type === INPUT_EVENT_TYPE.moveDone) {
        // event.type == INPUT_EVENT_TYPE.moveDone, update chess engine and move piece on chessboard
        this.currentMove = { from: event.squareFrom, to: event.squareTo, promotion: "q" };
        let result = this.game.move(this.currentMove);
  
        // handles invalid moves, i.e. moves made which aren't marked on board
        if (!result) {
          console.warn("Invalid Move", this.currentMove);
          return result;
        }
  
        // pawn promotion fix, due to lack of chess engine support to let player chose promotion piece
        if (result.flags.includes("p")) {
          
          console.log("Pawn promotion")
          // undos the default queen promotion
          this.game.undo();
          // returns piece name, based on user input, and sets promotion property of move to returned value
          // this.move.promotion = this.promote();
          // now updates chess according to new promotion value
          // result = this.game.move(this.currentMove);
          // refreshes board according to chess engine's FEN value
          // this.board.setPosition(this.game.fen());
          // undos the default queen promotion
          // this.game.undo();
          // returns piece name, based on user input, and sets promotion property of move to returned value
          document.getElementById("promotion-tray").style.display = "block";
          document.getElementById("game").style.paddingBottom = "2px";
          return;
        }
  
        switch (result.flags) {
          case "k": // Kingside Castling
          case "q": // Queenside Castling
          case "e": // En Passant
            this.board.setPosition(this.game.fen());
            break;
          default:;
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
              marginTop: '20px'
            }}
        >
        </div>
        <div className = "promotion-tray" id="promotion-tray" style = {{display: "none"}}>
          <b>Pawn Promotion | </b>
          <button id = "promotion-icon" value = "q" onClick={this.handlePromotion} ref={this.promotionRef}>
            <img src = {this.state.sideTurn+"q.svg"} alt="wq"/>
          </button>
          <button id = "promotion-icon" value = "r" onClick={this.handlePromotion} ref={this.promotionRef}>
          <img src = {this.state.sideTurn+"r.svg"} alt="wq"/>
          </button>
          <button id = "promotion-icon" value = "b" onClick={this.handlePromotion} ref={this.promotionRef}>
            <img src = {this.state.sideTurn+"b.svg"} alt="wq"/>
          </button>
          <button id = "promotion-icon" value = "n" onClick={this.handlePromotion} ref={this.promotionRef}>
          <img src = {this.state.sideTurn+"n.svg"} alt="wq"/>
          </button>
        </div>
        {/* <div className="container">
          <button className="btn btn-dark" type="button" id="undo-button" onClick={this.undoMove}>Undo</button>
        </div> */}
      </div>
    );
  }
}


export default ChessBoard;