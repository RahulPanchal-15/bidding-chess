import React, { Component } from "react";
import ChessBoard from "./ChessBoard";
import getWeb3 from "./getWeb3";
import Ubiquito from "./contracts/Ubiquito.json";
import ChessFactory from "./contracts/ChessFactory.json";
import ChessGame from "./contracts/ChessGame.json";

import "./App.css";

class App extends Component {

  constructor() {
    super();
    this.state = { 
      loading : false, 
      fen : "",
      turn: 1,
      hasMoved: false,
      result: 0
    };
    this.handleBoardChange = this.handleBoardChange.bind(this);
    this.gameRef = React.createRef();
  }
  
  
  componentDidMount = async () => {
    try {
      
      this.web3 = await getWeb3();

      this.accounts = await this.web3.eth.getAccounts();

      this.networkId = await this.web3.eth.net.getId();
      
      this.ubi = new this.web3.eth.Contract(
        Ubiquito.abi,
        Ubiquito.networks[this.networkId] && Ubiquito.networks[this.networkId].address,
      );

      this.factory = new this.web3.eth.Contract(
        ChessFactory.abi,
        ChessFactory.networks[this.networkId] && ChessFactory.networks[this.networkId].address,
      );

      this.factory_owner = await this.factory.methods.owner().call();

      let currentGameAddress = await this.factory.methods.getLatestGame().call();
      console.log("Current Game Address!", currentGameAddress)

      this.chessGame = new this.web3.eth.Contract(
        ChessGame.abi,
        currentGameAddress
      );

      let currentFen = await this.chessGame.methods.getFEN().call();
      console.log("currentFEN :",currentFen)

      let currentPlay = await this.chessGame.methods.turn().call();
      
      this.minBid =  await this.chessGame.methods.MIN_BID().call();

      let currentResult = await this.chessGame.methods.GAME_RESULT().call();

      this.setState({
        loaded:true, 
        fen: currentFen,
        turn: currentPlay,
        result: currentResult
      }, 
      this.updateFunction
      );
      console.log("current play",this.state.turn);
    } catch (error) {
      alert(
        `Install Metamask extension and choose the Ropsten TestNet.`,
      );
      console.error(error);
    }
  };

  handleBoardChange = (moveStatus) => {
    this.setState({
      hasMoved: moveStatus
    });
    if(moveStatus){
      this.activateBidButtons();
    }else {
      this.deactivateBidButtons();
    }
  }

  activateBidButtons = () => {
    let buttons = document.querySelector("#bid-buttons").children;
    for(var counter = 0; counter<buttons.length;counter++){
      buttons[counter].className = "btn btn-dark";
    }
  }

  deactivateBidButtons = () => {
    let buttons = document.querySelector("#bid-buttons").children;
    for(var counter = 0; counter<buttons.length;counter++){
      buttons[counter].className = "btn btn-outline-dark";
    }
  }


  
  handleSubmitBidEther = (event) => {
    if(this.gameRef.current.state.hasMoved){
      const bid = event.target.value;
      const result = this.gameRef.current.state.result;
      const newFEN = this.gameRef.current.state.final_fen;
      const side = this.state.turn;
      this.chessGame.methods.performMoveUsingEther(result,side,newFEN).send({value:bid,from:this.accounts[0]});
    }
    else{
      alert("Make a move!");
    }
  }

  handleSubmitBidCoin = (event) => {
    if(this.gameRef.current.state.hasMoved){
      const bid = event.target.value;
      const result = this.gameRef.current.state.result;
      const newFEN = this.gameRef.current.state.final_fen;
      const side = this.state.turn;
      this.chessGame.methods.performMoveUsingEther(result,side,newFEN).send({value:bid,from:this.factory_owner});
      
    }
    else{
      alert("Make a move!");
    }
  }

  listenToGameOver = () => {
    this.chessGame.events.GameResult({},(event)=>{})
    .on("data", (event)=> {
      let gameId = event.returnValues._gameId;
      this.factory.methods.setReward(gameId).call({from:accounts[0]}); //OWNER


    });
  }

  render() {
    if(!this.state.loaded){
      return(
        <div>
          Please Wait
        </div>
      )
    }
    return (
      <div className="App">
        <div className="App-header">
          Bidding Chess
        </div>
        <ChessBoard fen={this.state.fen} result = {this.state.result} turn={this.state.turn} ref={this.gameRef} boardChange={this.handleBoardChange}/>
        <div id="bid-buttons" className="container">
          <button id="bid-button" className="btn btn-outline-dark" name="bid1" value={this.minBid} onClick={this.handleSubmitBidEther}>{this.minBid}<img id="eth-logo" src="./ethereum.svg" alt="ether"/></button>
          <button id="bid-button" className="btn btn-outline-dark" name="bid2" value={this.minBid * 5} onClick={this.handleSubmitBidEther}>{this.minBid*5}<img id="eth-logo" src="./ethereum.svg" alt="ether"/></button>
          <button id="bid-button" className="btn btn-outline-dark" name="bid3" value={this.minBid * 10} onClick={this.handleSubmitBidEther}>{this.minBid*10}<img id="eth-logo" src="./ethereum.svg" alt="ether"/></button>
        </div>
      </div>
    );
  }
}

export default App;
