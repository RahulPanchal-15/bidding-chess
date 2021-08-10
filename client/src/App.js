import React, { Component } from "react";
import ChessBoard from "./ChessBoard";
import Instructions from "./Intstructions";
import Stats from "./Stats";
import Web3 from "web3";
import Ubiquito from "./contracts/Ubiquito.json";
import ChessFactory from "./contracts/ChessFactory.json";
import ChessGame from "./contracts/ChessGame.json";
import MetaMaskOnboarding from '@metamask/onboarding';
import "./App.css";

const BN = require('bn.js');

class App extends Component {
  constructor() {
    super();
    this.state = {
      loaded: false,
      isMetaMaskInstalled: false,
      connected: false,
      rightNetwork : false,
      isActive: false,
      fen: "",
      move: "",
      ubiBalance: 0,
      whitePool: 0,
      blackPool: 0,
      whiteCoins: 0,
      blackCoins: 0,
      turn: 1,
      hasMoved: false,
      result: 0,
      playerSide: 0,
      minBid: 0,
      minCoinBid: 0,
      processing: false,
    };
    this.handleBoardChange = this.handleBoardChange.bind(this);
    this.gameRef = React.createRef();
  }

  componentDidMount = async() => {
    
    const {ethereum} = window;
    if(ethereum && ethereum.isMetaMask) {
      try {
        this.web3 = new Web3(window.ethereum);
        this.web3.eth.handleRevert = true;
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        this.loadData();
      } catch (error) {
        console.log(error);
        this.setState(
          {
            loaded: true,
            isMetaMaskInstalled: (ethereum && ethereum.isMetaMask),
            ubiBalance : 0
          },
          this.listenToAccountChange
        );
      }
    } else {
      this.setState(
        {
          loaded: true,
          isMetaMaskInstalled: (ethereum && ethereum.isMetaMask)
        },
        this.listenToAccountChange
      );
    }
  }


  loadData = async () => {
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    this.web3 = new Web3(window.ethereum);
    this.web3.eth.handleRevert = true;
    this.accounts = await window.ethereum.request({ method: 'eth_accounts' });
    this.networkId = await this.web3.eth.net.getId();

    if(Ubiquito.networks[this.networkId]) {

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
  
      let ubiBALANCE = await this.ubi.methods.balanceOf(this.accounts[0]).call();
  
      let gameExists = await this.factory.methods.isActive().call();
  
      if(gameExists){
        this.currentGameAddress = await this.factory.methods
          .getLatestGame()
          .call();
        console.log("Current Game Address!", this.currentGameAddress);
  
        this.chessGame = new this.web3.eth.Contract(
          ChessGame.abi,
          this.currentGameAddress
        );
  
        let currentFen = await this.chessGame.methods.FEN().call();
        let currentPlay = await this.chessGame.methods.turn().call();
        let bids = await this.chessGame.methods.getPlayerBids(this.accounts[0]).call();
        this.bid = bids[0]
        this.cbid = bids[1]
        let minBID = await this.chessGame.methods.MIN_BID().call();
        this.printMinBid = this.state.minBid.length > 9 ? this.web3.utils.fromWei(this.state.minBid,"ether") : this.minBid;
        let minCoinBID = await this.chessGame.methods.MIN_COIN_BID().call();
        this.printMinCoinBid = this.minCoinBid;
        let playerS = await this.chessGame.methods.getPlayerSide(this.accounts[0]).call();
        let whitePOOL = await this.chessGame.methods.getPool(1).call();
        let whiteCOINS = await this.chessGame.methods.getCoins(1).call();
        let blackPOOL = await this.chessGame.methods.getPool(2).call();
        let blackCOINS = await this.chessGame.methods.getCoins(2).call();
        let currentResult = await this.chessGame.methods.GAME_RESULT().call();
        this.setState(
          {
            loaded: true,
            isMetaMaskInstalled : true,
            connected: true,
            rightNetwork: true,
            fen: currentFen,
            turn: currentPlay,
            result: currentResult,
            playerSide: playerS,
            whitePool: whitePOOL,
            blackPool: blackPOOL,
            whiteCoins: whiteCOINS,
            blackCoins: blackCOINS,
            minBid: minBID,
            minCoinBid: minCoinBID,
            ubiBalance : ubiBALANCE,
            isActive: gameExists
          },
          this.listenToAccountChange
        );
      } else {

        this.setState(
          {
            loaded: true,
            isMetaMaskInstalled : true,
            connected: true,
            rightNetwork: true,
            ubiBalance : ubiBALANCE,
            isActive: gameExists
          },
          this.listenToAccountChange
        );
      }
    } else {

      this.setState(
        {
          loaded: true,
          isMetaMaskInstalled : true,
          connected: false,
          rightNetwork: false
        },
        this.listenToAccountChange
      );

    } 
  }

  listenToAccountChange = () => {
    if(this.state.isMetaMaskInstalled){
      window.ethereum.on('accountsChanged', (accounts)  => {
        window.location.reload();
      });
      window.ethereum.on('chainChanged', (_chainId) => window.location.reload());
    }
  }

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

  installMetamask = () => {
    const onboarding = new MetaMaskOnboarding(MetaMaskOnboarding.FORWARDER_MODE.OPEN_TAB);
    const button = document.getElementById("install");
    button.disabled = true;
    onboarding.startOnboarding();
  }

  activateBidButtons = () => {
    let buttons = document.querySelectorAll("#row");
    for(let rows of buttons){
      let bidButtons = rows.querySelectorAll("#bid-buttons #bid-button");
      for (var counter = 0; counter < bidButtons.length; counter++) {
        bidButtons[counter].className = "btn btn-light";
        bidButtons[counter].disabled=false;
      }
    }
  };

  deactivateBidButtons = (disable_) => {
    let buttons = document.querySelectorAll("#row");
    for(let rows of buttons){
      let bidButtons = rows.querySelectorAll("#bid-buttons #bid-button");
      for (var counter = 0; counter < bidButtons.length; counter++) {
        // bidButtons[counter].className = "btn btn-outline-dark"
        bidButtons[counter].disabled=disable_;
      }
    }
  };

  activateInstructions = (e) => {
    const sidebar = document.querySelector("#sidebar");
    sidebar.classList.toggle("active");
  };

  handleSubmitBidEther = async (event) => {
    if (this.gameRef.current.state.hasMoved) {
      const bid = event.currentTarget.value;
      const balance = await this.web3.eth.getBalance(this.accounts[0]);
      if(new BN(bid).cmp(new BN(balance)) === -1){
        const result = this.gameRef.current.state.result;
        const newFEN = this.gameRef.current.state.final_fen;
        const move = this.gameRef.current.state.move;
        console.log(move);
        const side = this.state.turn;
        this.deactivateBidButtons(true);
        this.setState({processing:true});
        await this.chessGame.methods
          .performMove(result, side, 0, move, newFEN)
          .send({ value: bid, from: this.accounts[0] })
          .on("receipt", (confirmationNumber,receipt)=>{
            alert("Transaction Successfull!");
            window.location.reload();
          })
          .on("error", (err)=> {
            alert("Transaction Failed : ",err.message);
            this.deactivateBidButtons(false);
            this.setState({processing:false});
          });
      } else{
        alert("Insufficient Funds");
      } 
    }
    else {
      alert("Make a move!");
    }
      
  };

  handleSubmitBidCoin = async (event) => {
    if (this.gameRef.current.state.hasMoved) {
      const bid = event.currentTarget.value;
      const ubiBalance = this.state.ubiBalance;
      if(parseInt(bid)<=parseInt(ubiBalance)){
        const result = this.gameRef.current.state.result;
        const newFEN = this.gameRef.current.state.final_fen;
        const move = this.gameRef.current.state.move;
        const side = this.state.turn;
        this.deactivateBidButtons(true);
        this.setState({processing:true});
        await this.ubi.methods
          .approve(this.currentGameAddress, bid)
          .send({ from: this.accounts[0] })
          .on("error", (err)=> {
            alert("Transaction Failed : ",err.message);
            this.deactivateBidButtons(false);
            this.setState({processing:false});
          })
          .then(async () => {
            await this.chessGame.methods
              .performMove(result, side, bid, move, newFEN)
              .send({ from: this.accounts[0] })
              .on("receipt", (confirmationNumber,receipt)=>{
                alert("Transaction Successfull!");
                window.location.reload();
              })
              .on("error", (err)=> {
                alert("Transaction Failed : ",err.message);
                this.deactivateBidButtons(false);
                this.setState({processing:false});
              });
            } 
          );
      } else {
        alert('Insufficient UBI balance!');
      }
    }
    else {
      alert("Make a move!");
    }
  };

  render() {
  if (!this.state.loaded) {

    return (
      <div className="container">
        <p align="center">
          <img src="loading.gif" alt="Loading"/>
        </p>
      </div>
    );
      
  }

  return (
    <div className="App">

      <div className="App-header">
        
        <h1 style={{ color: "white", display: "inline-block" }}>
          Bidding Chess
        </h1>
        
        <div>
          <button
            type="button"
            id="sidebarCollapse"
            className="btn btn-light"
            onClick={this.activateInstructions}
            >
            <i className="fas fa-align-left"></i>
            <span role="img" aria-label="emoji">About 😲</span>
          </button>
          <button
            type="button"
            className="btn btn-dark"
            style={{marginLeft: "5px"}}
            >
            UBI Balance: {this.state.ubiBalance}<img id="ubi-logo" src="./logo.svg" alt="ubi" />
          </button>
        </div>
      </div>

      <div className="App-content">
        
        <div className="nav-container">
          <Instructions activateFn = {this.activateInstructions} />
        </div>

        {
          this.state.isActive &&

          <div className="board-container">
            <ChessBoard
              fen={this.state.fen}
              result={this.state.result}
              turn={this.state.turn}
              ref={this.gameRef}
              boardChange={this.handleBoardChange}
              className="container"
            />
            {
              (this.state.turn===this.state.playerSide || this.state.playerSide==="0")
              &&
              <div className="row" id="row">
              <div id="bid-buttons" className="col">
                <button
                  id="bid-button"
                  className="btn btn-outline-dark"
                  name="bid1"
                  value={this.state.minBid}
                  onClick={this.handleSubmitBidEther}
                >
                  LOW
                  <img id="eth-logo" src="./ethereum.svg" alt="ether" />
                </button>
              </div>
              <div id="bid-buttons" className="col">
                <button
                  id="bid-button"
                  className="btn btn-outline-dark"
                  name="bid2"
                  value={this.state.minBid * 5}
                  onClick={this.handleSubmitBidEther}
                  >
                  MEDIUM
                  <img id="eth-logo" src="./ethereum.svg" alt="ether" />
                </button>
              </div>
              <div id="bid-buttons" className="col">
                <button
                  id="bid-button"
                  className="btn btn-outline-dark"
                  name="bid3"
                  value={this.state.minBid * 10}
                  onClick={this.handleSubmitBidEther}
                  >
                  HIGH
                  <img id="eth-logo" src="./ethereum.svg" alt="ether" />
                </button>
              </div>
            </div> 
            }
            {
              (this.state.turn===this.state.playerSide || this.state.playerSide==="0")
              &&
              <div className="row" id="row">
                <div id="bid-buttons" className="col">
                  <button
                    id="bid-button"
                    className="btn btn-outline-dark"
                    name="bid1"
                    value={this.state.minCoinBid}
                    onClick={this.handleSubmitBidCoin}
                    >
                    {this.state.minCoinBid}
                    <img id="ubi-logo" src="./logo.svg" alt="ubi" />
                  </button>
                </div>
                <div id="bid-buttons" className="col">
                  <button
                    id="bid-button"
                    className="btn btn-outline-dark"
                    name="bid2"
                    value={this.state.minCoinBid * 5}
                    onClick={this.handleSubmitBidCoin}
                  >
                    {this.state.minCoinBid * 5}
                    <img id="ubi-logo" src="./logo.svg" alt="ubi" />
                  </button>
                </div>
                <div id="bid-buttons" className="col">
                  <button
                    id="bid-button"
                    className="btn btn-outline-dark"
                    name="bid3"
                    value={this.state.minCoinBid * 10}
                    onClick={this.handleSubmitBidCoin}
                    >
                    {this.state.minCoinBid * 10}
                    <img id="ubi-logo" src="./logo.svg" alt="ubi" />
                  </button>
                </div>
              </div>
            } 
          </div>
        }

        { this.state.isActive &&
          <div className="stats-container">
              <Stats 
                turn = {this.state.turn} 
                whitePool = {this.web3.utils.fromWei(this.state.whitePool,"ether")}
                blackPool = {this.web3.utils.fromWei(this.state.blackPool,"ether")}
                whiteCoins = {this.state.whiteCoins}
                blackCoins = {this.state.blackCoins}
                bid = {this.web3.utils.fromWei(this.bid,"ether")}
                cbid = {this.cbid}
                playerSide = {this.state.playerSide}
              />
              <hr/>
              {
                this.state.processing &&
                <button className="btn" style={{backgroundColor: "dodgerblue", width: "70%", marginTop: "4px", cursor: "default"}}>
                  Processing Transaction...
                </button>
              }
          </div>
        }

        { !this.state.isActive && this.state.connected && 
          <div className="not-active">
            <div className="box">
              <strong>OOPS! Chess Game just ended.</strong>
              <hr/>
              Please wait for us to organise a new game!
            </div>
          </div>
        }

        { !this.state.isActive && !this.state.isMetaMaskInstalled &&
          <div className="not-active">
            <div className="box">
              <strong>OOPS! Looks like you dont have MetaMask Installed.</strong>
              <hr/>
                <button type="button" id="install" className="btn btn-primary" onClick={this.installMetamask}>
                  Install Metamask
                </button>
            </div>
          </div>
        }


        {
          this.state.isMetaMaskInstalled && !this.state.rightNetwork && this.state.connected &&
          <div className="not-active">
            <div className="box">
              <strong>Open MetaMask wallet and choose Ropsten Test Network.</strong>
            </div>
          </div>
        }


        { this.state.isMetaMaskInstalled && !this.state.connected && !this.state.rightNetwork &&
          <div className="not-active">
            <div className="box">
              <strong>Connect to MetaMask and choose Ropsten Test Network.</strong>
              <hr/>
                <button type="button" id="install" className="btn btn-primary" onClick={this.loadData}>
                  Connect
            </button>
            </div>
          </div>
        }


      </div>
    </div>
  );
  }
}

export default App;