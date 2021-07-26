const Coin = artifacts.require('Ubiquito');
const Factory = artifacts.require('ChessFactory');
const Game = artifacts.require('ChessGame');
const truffleAssert = require('truffle-assertions');

contract("ChessFactory", (accounts) => {

  const [Owner, W1, B1, W2, B2, W3, B3, W4, B4, W5] = accounts;

  it(" send 10000 Ubiquito to ChessFactory", async() => {
    let coin = await Coin.deployed();
    await truffleAssert.passes(
      coin.transfer(Factory.address,10000,{from: Owner})
    );
    let balance = await coin.balanceOf(Factory.address);
    console.log("ChessFactory Ubi balance : ",balance.toString());
  });

  it(" send 100 ubiquito to W1", async() => {
    let coin = await Coin.deployed();
    await truffleAssert.passes(
      coin.transfer(W1,100,{from:Owner})
    );
    let temp = await coin.balanceOf(W1);
    console.log(temp.toString());
  });

  it(" send 100 ubiquito to B1", async() => {
    let coin = await Coin.deployed();
    await truffleAssert.passes(
      coin.transfer(B1,100,{from:Owner})
    )
  });

  it("create game with 4 max moves and minimum eth bid 1000, min coin bid as 100, rate as", async () => {
    let factory = await Factory.deployed();
    await truffleAssert.passes(
      factory.createGame(4, 1000, 50, 100, { from: Owner }),
      "Could not create a game!"
    );
    
    
  });

  it(" W1 approves ChessGame of 50ubi", async() => {
    let factory = await Factory.deployed();
    let gameAddress = await factory.getLatestGame();
    let coin = await Coin.deployed();
    truffleAssert.passes(
      coin.approve(gameAddress,50,{from:W1})
    )
  });

  
  it(" W1 moves e4 - Bids 50 ubi ", async() => {
    let factory = await Factory.deployed();
    let gameAddress = await factory.getLatestGame(); 
    let game = await Game.at(gameAddress);
    let coin = await Coin.deployed();
    await truffleAssert.passes(
      game.performMoveUsingCoin( 0, 1,50,web3.utils.toHex("e4"),{from: W1}) // W1 - 100ubi
      );
      let w1_prevBalance = await web3.eth.getBalance(W1);
      console.log("W1 after move balance(eth) : ",w1_prevBalance.toString());
      let balance = await coin.balanceOf(W1);
      console.log("W1 after move balance(ubi) : ",balance.toString());
    }); 
    
    it(" B1 approves ChessGame of 50ubi", async() => {
      let factory = await Factory.deployed();
      let gameAddress = await factory.getLatestGame();
      let coin = await Coin.deployed();
      truffleAssert.passes(
        coin.approve(gameAddress,50,{from:B1})
      )
    });

    it(" B1 moves e5 - Bids 50 ubi ", async() => {
      let factory = await Factory.deployed();
      let coin = await Coin.deployed();
      let gameAddress = await factory.getLatestGame(); 
      let game = await Game.at(gameAddress);
      await truffleAssert.passes(
        game.performMoveUsingCoin( 0, 2,50,web3.utils.toHex("e5"),{from: B1})
      );
      let b1_prevBalance = await web3.eth.getBalance(B1);
      console.log("B1 after move balance(eth) : ",b1_prevBalance.toString());
      let balance = await coin.balanceOf(B1);
      console.log("B1 after move balance(ubi) : ",balance.toString());
  });

  it(" W2 moves c4 - Bids 1000wei ", async() => {
    let factory = await Factory.deployed();
    let coin = await Coin.deployed();
    let gameAddress = await factory.getLatestGame(); 
    let game = await Game.at(gameAddress);
    await truffleAssert.passes(
      game.performMoveUsingEther(1,  1,web3.utils.toHex("c4"),{from: W2, value: 1000})
    );
    let w2_prevBalance = await web3.eth.getBalance(W2);
    console.log("W1 after move balance(eth) : ",w2_prevBalance.toString());
    let balance = await coin.balanceOf(W2);
    console.log("W2 after move balance(ubi) : ",balance.toString());
  }); 

  it(" Factory sets reward for the game", async() => {
    let factory = await Factory.deployed();

    await truffleAssert.passes(
      factory.setRewardFor(1,{from: Owner})
    )

    await truffleAssert.passes(
      factory.rewardWinners(1,{from:Owner}),
      "Error while rewarding!"
    );

    let coin = await Coin.deployed();
    let gameAddress = await factory.getLatestGame(); 
    let balance = await coin.balanceOf(gameAddress);
    console.log("ChessGame Ubi balance : ",balance.toString());
    balance = await coin.balanceOf(Factory.address);
    console.log("ChessFactory Ubi balance : ",balance.toString());

    let w1_afterBalance = await web3.eth.getBalance(W1);
    console.log("W1 final balance(eth) : ",w1_afterBalance.toString());
    let balanceW1 = await coin.balanceOf(W1);
    console.log("W1 final balance(ubi) : ",balanceW1.toString());

    let b1_afterBalance = await web3.eth.getBalance(B1);
    console.log("B1 final balance(eth) : ",b1_afterBalance.toString());
    let balanceB1 = await coin.balanceOf(B1);
    console.log("B1 final balance(ubi) : ",balanceB1.toString());

    let w2_afterBalance = await web3.eth.getBalance(W2);
    console.log("W2 final balance(eth) : ",w2_afterBalance.toString());
    let balanceW2 = await coin.balanceOf(W2);
    console.log("W2 final balance(ubi) : ",balanceW2.toString());

  });


}
);