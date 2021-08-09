const Coin = artifacts.require('Ubiquito');
const Factory = artifacts.require('ChessFactory');
const Game = artifacts.require('ChessGame');
const truffleAssert = require('truffle-assertions');
const BN = require('bn.js');

contract("ChessFactory", (accounts) => {

  const [Owner, W1, B1, W2, B2, W3, B3, W4, B4, W5] = accounts;
  let min = 0;
  let minCoin = 0;

  async function getBalances() {
    const balances = await accounts.map(async(element) => {
      return (await web3.eth.getBalance(element));
    });
    return await Promise.all(balances);
  }

  function compareBalances(beforeBalance,afterBalance) {
    let differences = [];
    for(i = 0; i < beforeBalance.length; i++) { 
      differences.push((new BN(afterBalance[i]).sub(new BN(beforeBalance[i]))).toString());
    }
    return differences;
  }

  
  it(" initialises min bids ", async() => {
    let factory = await Factory.deployed();
    let gameAddress = await factory.getLatestGame(); 
    let game = await Game.at(gameAddress);
    min = await game.MIN_BID();
    minCoin = await game.MIN_COIN_BID();
  })

  // it(" send minCoin Ubiquito to ChessFactory", async() => {
  //   let coin = await Coin.deployed();
  //   await truffleAssert.passes(
  //     coin.transfer(Factory.address,minCoin,{from: Owner})
  //   );
  //   let balance = await coin.balanceOf(Factory.address);
  //   console.log("ChessFactory Ubi balance : ",balance.toString());
  // });

  it(" send minCoin ubiquito to W1", async() => {
    let coin = await Coin.deployed();
    await truffleAssert.passes(
      coin.transfer(W1,minCoin,{from:Owner})
    );
    let temp = await coin.balanceOf(W1);
    console.log(temp.toString());
  });

  it(" send minCoin*5 ubiquito to B1", async() => {
    let coin = await Coin.deployed();
    await truffleAssert.passes(
      coin.transfer(B1,minCoin*5,{from:Owner})
    )
  });

  // it("create game with 4 max moves and minimum eth bid 1000, min coin bid as 100, rate as", async () => {
  //   let factory = await Factory.deployed();
  //   await truffleAssert.passes(
  //     factory.createGame(4, 1000, 50, 100, { from: Owner }),
  //     "Could not create a game!"
  //   );
    
    
  // });

    it(" W1 approves ChessGame of minCoin ubi", async() => {
      let factory = await Factory.deployed();
      let gameAddress = await factory.getLatestGame();
      let coin = await Coin.deployed();
      truffleAssert.passes(
        coin.approve(gameAddress,minCoin,{from:W1})
      )
    });

  
    it(" W1 moves e4 - Bids minCoin ubi ", async() => {
      let factory = await Factory.deployed();
      let gameAddress = await factory.getLatestGame(); 
      let game = await Game.at(gameAddress);
      let coin = await Coin.deployed();
      await truffleAssert.passes(
        game.performMove( 0, 1,minCoin,"e4","this will be the fen string",{from: W1}) // W1 - 100ubi
      );
      let w1_prevBalance = await web3.eth.getBalance(W1);
      console.log("W1 after move balance(eth) : ",w1_prevBalance.toString());
      let balance = await coin.balanceOf(W1);
      console.log("W1 after move balance(ubi) : ",balance.toString());
    }); 
    
    it(" B1 approves ChessGame of minCoin*5 ubi", async() => {
      let factory = await Factory.deployed();
      let gameAddress = await factory.getLatestGame();
      let coin = await Coin.deployed();
      truffleAssert.passes(
        coin.approve(gameAddress,minCoin*5,{from:B1})
      )
    });

    it(" B1 moves e5 - Bids minCoin ubi ", async() => {
      let factory = await Factory.deployed();
      let coin = await Coin.deployed();
      let gameAddress = await factory.getLatestGame(); 
      let game = await Game.at(gameAddress);
      let x = null;
      let b1_prevBalance = await web3.eth.getBalance(B1);
      console.log("B1 before move balance(eth) : ",b1_prevBalance.toString());
      await truffleAssert.passes(
        x = game.performMove(0,2,minCoin*5,"e5","this will be the fen string",{from: B1})
      );
      console.log(x);
      b1_prevBalance = await web3.eth.getBalance(B1);
      console.log("B1 after move balance(eth) : ",b1_prevBalance.toString());
      let balance = await coin.balanceOf(B1);
      console.log("B1 after move balance(ubi) : ",balance.toString());
  });

  it(" W2 moves c4 - Bids (min)wei ", async() => {
    let factory = await Factory.deployed();
    let coin = await Coin.deployed();
    let gameAddress = await factory.getLatestGame(); 
    let game = await Game.at(gameAddress);
    let x = null;
    const beforeBalance = await getBalances();
    await truffleAssert.passes(
      x = game.performMove(1,1,0,"c4","this will be the fen string",{from: W2, value: min})
    );
    console.log(x);
    let w2_prevBalance = await web3.eth.getBalance(W2);
    console.log("W2 after move balance(eth) : ",w2_prevBalance.toString());
    let balance = await coin.balanceOf(W2);
    console.log("W2 after move balance(ubi) : ",balance.toString());

    const afterBalance = await getBalances();
    const difference = compareBalances(beforeBalance,afterBalance);
    
    console.log("W2 before balance : ",beforeBalance[3]);
    console.log("W2 after balance  : ",afterBalance[3]);
    
    
    console.log("Difference in Balances :\n", difference);
  }); 

  it(" Factory sets reward for the game", async() => {
    let factory = await Factory.deployed();

    // await truffleAssert.passes(
    //   factory.setRewardFor(1,{from: Owner})
    // )

    // await truffleAssert.passes(
    //   factory.rewardWinners(1,{from:Owner}),
    //   "Error while rewarding!"
    // );

    let coin = await Coin.deployed();
    let gameAddress = await factory.getLatestGame(); 
    let balance = await coin.balanceOf(gameAddress);
    console.log("ChessGame Ubi balance : ",balance.toString());
    balance = await coin.balanceOf(Factory.address);
    console.log("ChessFactory Ubi balance : ",balance.toString());
    console.log("ChessFactory ETH balance : ",await web3.eth.getBalance(Factory.address));

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