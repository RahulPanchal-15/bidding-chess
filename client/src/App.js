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
      loaded: false,
      fen: "",
      turn: 1,
      hasMoved: false,
      result: 0,
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
        Ubiquito.networks[this.networkId] &&
          Ubiquito.networks[this.networkId].address
      );

      this.factory = new this.web3.eth.Contract(
        ChessFactory.abi,
        ChessFactory.networks[this.networkId] &&
          ChessFactory.networks[this.networkId].address
      );

      this.factory_owner = await this.factory.methods.owner().call();

      this.currentGameAddress = await this.factory.methods
        .getLatestGame()
        .call();
      console.log("Current Game Address!", this.currentGameAddress);

      this.chessGame = new this.web3.eth.Contract(
        ChessGame.abi,
        this.currentGameAddress
      );

      let currentFen = await this.chessGame.methods.getFEN().call();
      console.log("currentFEN :", currentFen);

      let currentPlay = await this.chessGame.methods.turn().call();

      this.ubiBalance = await this.ubi.methods
        .balanceOf(this.accounts[0])
        .call();
      this.minBid = await this.chessGame.methods.MIN_BID().call();
      console.log("this.minBid : ", this.minBid);
      this.minCoinBid = await this.chessGame.methods.MIN_COIN_BID().call();

      let currentResult = await this.chessGame.methods.GAME_RESULT().call();

      this.setState(
        {
          loaded: true,
          fen: currentFen,
          turn: currentPlay,
          result: currentResult,
        },
        this.updateFunction
      );
      console.log("current play", this.state.turn);
    } catch (error) {
      alert(`Install Metamask extension and choose the Ropsten TestNet.`);
      console.error(error);
    }
  };

  handleBoardChange = (moveStatus, result) => {
    this.setState({
      hasMoved: moveStatus,
    });
    if (moveStatus) {
      this.activateBidButtons();
    } else {
      this.deactivateBidButtons();
    }
  };

  activateBidButtons = () => {
    let buttons = document.querySelectorAll("#bid-buttons")[0];
    // let buttons = document.querySelectorAll("#bid-buttons").children;
    console.log(buttons);
    for (var counter = 0; counter < buttons.length; counter++) {
      buttons[counter].className = "btn btn-dark";
    }
  };

  activateInstructions = (e) => {
    const button = e.currentTarget;
    console.log(button);
    // sidebar.toggleClass('active');
    const sidebar = document.querySelector("#sidebar");
    console.log(sidebar);
    sidebar.classList.toggle("active");
    console.log("HERE");
  };

  deactivateBidButtons = () => {
    let buttons = document.querySelector(
      "#bid-buttons, #coin-bid-buttons"
    ).children;
    for (var counter = 0; counter < buttons.length; counter++) {
      buttons[counter].className = "btn btn-outline-dark";
    }
  };

  handleSubmitBidEther = async (event) => {
    if (this.gameRef.current.state.hasMoved) {
      const bid = event.currentTarget.value;
      const result = this.gameRef.current.state.result;
      const newFEN = this.gameRef.current.state.final_fen;
      const side = this.state.turn;
      console.log("Ether BID : ", bid);
      await this.chessGame.methods
        .performMoveUsingEther(result, side, newFEN)
        .send({ value: bid, from: this.accounts[0] });
    } else {
      alert("Make a move!");
    }
  };

  handleSubmitBidCoin = async (event) => {
    if (this.gameRef.current.state.hasMoved) {
      const bid = event.currentTarget.value;
      const result = this.gameRef.current.state.result;
      const newFEN = this.gameRef.current.state.final_fen;
      const side = this.state.turn;
      console.log("BID: ", bid);
      await this.ubi.methods
        .approve(this.currentGameAddress, bid)
        .send({ from: this.accounts[0] })
        .then(async () => {
          await this.chessGame.methods
            .performMoveUsingCoin(result, side, bid, newFEN)
            .send({ from: this.accounts[0] });
        });
    } else {
      alert("Make a move!");
    }
  };

  listenToGameOver = () => {
    this.chessGame.events
      .GameResult({}, (event) => {})
      .on("data", (event) => {
        let gameId = event.returnValues._gameId;
        console.log("Game over : ", gameId);
        this.factory.methods
          .setReward(gameId)
          .call({ from: this.factory_owner }); //OWNER
      });
  };

  render() {
    if (!this.state.loaded) {
      return <div>Please Wait</div>;
    }
    return (
      <div className="App">
        <div className="App-header">
          <h1 style={{ color: "white", display: "inline-block" }}>
            Bidding Chess
          </h1>
          <button
            type="button"
            id="sidebarCollapse"
            className="btn btn-primary"
            onClick={this.activateInstructions}
          >
            <i className="fas fa-align-left"></i>
            <span>Instructions</span>
          </button>
          UBI Balance: {this.ubiBalance}
        </div>

        <div className="wrapper">
          <nav id="sidebar" className="navbar-light bg-light">
            <div className="sidebar-header">
              <h3>Instructions</h3>
              <p>
                Lorem ipsum dolor sit amet consectetur adipisicing elit.
                Sapiente necessitatibus doloribus est natus itaque quis
                explicabo? Ea beatae placeat et autem at perspiciatis, soluta
                excepturi nemo, voluptates doloribus pariatur! Quibusdam.
              </p>
            </div>
          </nav>
          <div id="content">
            <div className="container">
              <ChessBoard
                fen={this.state.fen}
                result={this.state.result}
                turn={this.state.turn}
                ref={this.gameRef}
                boardChange={this.handleBoardChange}
                className="container"
              />
            </div>
            <div className="container">
              <div className="row" id="row">
                <div id="bid-buttons" className="col">
                  <button
                    id="bid-button"
                    className="btn btn-outline-dark"
                    name="bid1"
                    value={this.minBid}
                    onClick={this.handleSubmitBidEther}
                  >
                    {this.minBid}
                    <img id="eth-logo" src="./ethereum.svg" alt="ether" />
                  </button>
                </div>
                <div id="bid-buttons" className="col">
                  <button
                    id="bid-button"
                    className="btn btn-outline-dark"
                    name="bid2"
                    value={this.minBid * 5}
                    onClick={this.handleSubmitBidEther}
                  >
                    {this.minBid * 5}
                    <img id="eth-logo" src="./ethereum.svg" alt="ether" />
                  </button>
                </div>
                <div id="bid-buttons" className="col">
                  <button
                    id="bid-button"
                    className="btn btn-outline-dark"
                    name="bid3"
                    value={this.minBid * 10}
                    onClick={this.handleSubmitBidEther}
                  >
                    {this.minBid * 10}
                    <img id="eth-logo" src="./ethereum.svg" alt="ether" />
                  </button>
                </div>
              </div>
              <div className="row" id="row">
                <div id="bid-buttons" className="col">
                  <button
                    id="bid-button"
                    className="btn btn-outline-dark"
                    name="bid1"
                    value={this.minCoinBid}
                    onClick={this.handleSubmitBidCoin}
                  >
                    {this.minCoinBid}
                    <img id="eth-logo" src="./ethereum.svg" alt="ether" />
                  </button>
                </div>
                <div id="bid-buttons" className="col">
                  <button
                    id="bid-button"
                    className="btn btn-outline-dark"
                    name="bid2"
                    value={this.minCoinBid * 5}
                    onClick={this.handleSubmitBidCoin}
                  >
                    {this.minCoinBid * 5}
                    <img id="eth-logo" src="./ethereum.svg" alt="ether" />
                  </button>
                </div>
                <div id="bid-buttons" className="col">
                  <button
                    id="bid-button"
                    className="btn btn-outline-dark"
                    name="bid3"
                    value={this.minCoinBid * 10}
                    onClick={this.handleSubmitBidCoin}
                  >
                    {this.minCoinBid * 10}
                    <img id="eth-logo" src="./ethereum.svg" alt="ether" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default App;