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


  it("create game with 4 max moves and minimum eth bid 1000, min coin bid as 100, rate as", async () => {
    let factory = await Factory.deployed();
    await truffleAssert.passes(
      factory.createGame(4, 1000, 50, 100, { from: Owner }),
      "Could not create a game!"
    );
    
    
  });

  it(" W1 moves e4 - Bids 10wei ", async() => {
    let factory = await Factory.deployed();
    let gameAddress = await factory.getLatestGame(); 
    let game = await Game.at(gameAddress);
    let coin = await Coin.deployed();
    let balance = await coin.balanceOf(gameAddress);
    console.log("ChessGame Ubi balance : ",balance.toString());
    await truffleAssert.passes(
      game.performMoveUsingEther(0,1,web3.utils.toHex("e4"),{from: W1, value: 1000})
    )
  }); 

  it(" B1 moves e5 - Bids 10wei ", async() => {
    let factory = await Factory.deployed();
    let gameAddress = await factory.getLatestGame(); 
    let game = await Game.at(gameAddress);
    await truffleAssert.passes(
      game.performMoveUsingEther(0,2,web3.utils.toHex("e5"),{from: B1, value: 10000})
    )
  });

  it(" W2 moves c4 - Bids 50wei ", async() => {
    let factory = await Factory.deployed();
    let gameAddress = await factory.getLatestGame(); 
    let game = await Game.at(gameAddress);
    await truffleAssert.passes(
      game.performMoveUsingEther(1,1,web3.utils.toHex("c4"),{from: W2, value: 1000})
    )
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


  });


}
);