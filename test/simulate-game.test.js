const Coin = artifacts.require('Ubiquito');
const Game = artifacts.require('ChessGame');
const Factory = artifacts.require('ChessFactory');
const truffleAssert = require('truffle-assertions');
const BN = require('bn.js');

//e4 e5 | c4 c6 | Qh5 Nf6 | Qxf7# - 4 step checkmate

contract("Simulate Game:", (accounts) => {

  const [Owner,W1,B1,W2,B2,W3,B3,W4,B4,W5] = accounts;

  async function getBalances() {
    const balances = await accounts.map(async(element) => {
      return (await web3.eth.getBalance(element));
    });
    return await Promise.all(balances);
  }

  function compareBalances(beforeBalance,afterBalance) {
    let differences = [];
    console.log((new BN(45).sub(new BN(15))).toString());
    for(i = 0; i < beforeBalance.length; i++) { 
      differences.push((new BN(afterBalance[i]).sub(new BN(beforeBalance[i]))).toString());
    }
    return differences;
  }

  async function withdrawFunds(account) {
    let factory = await Factory.deployed();
    let gameAddress = await factory.getLatestGame(); 
    let game = await Game.at(gameAddress);
    let beforeBalance = await web3.eth.getBalance(account);
    // console.log("Before Balance : ", beforeBalance.toString());
    await truffleAssert.passes(
      game.collectRewards(account,{from: account}),
    );
    let afterBalance = await web3.eth.getBalance(account);
    // console.log("After Balance  : ", afterBalance.toString());
    let difference = afterBalance.sub(beforeBalance);
    console.log("Difference : ", difference.toString());
  }

  it(" send 10000 Ubiquito to ChessFactory", async() => {
    let coin = await Coin.deployed();
    await truffleAssert.passes(
      coin.transfer(Factory.address,10000,{from: Owner})
    );
    let balance = await coin.balanceOf(Factory.address);
    console.log("ChessFactory Ubi balance : ",balance.toString());
  });
  
  it(" create game with 10 max moves and minimum eth bid 10, min coin bid as 100, rate as ", async() => {
    let factory = await Factory.deployed();
    await truffleAssert.passes(
      factory.createGame(10,10,50,100,{from: Owner}),
      "Could not create a game!"
    );
  });

  it(" W1 moves e4 - Bids 10wei ", async() => {
    let factory = await Factory.deployed();
    let gameAddress = await factory.getLatestGame(); 
    let game = await Game.at(gameAddress);
    await truffleAssert.passes(
      game.performMoveUsingEther(0, 1,web3.utils.toHex("e4"),{from: W1, value: 10})
    )
  }); 

  it(" B1 moves e5 - Bids 10wei ", async() => {
    let factory = await Factory.deployed();
    let gameAddress = await factory.getLatestGame(); 
    let game = await Game.at(gameAddress);
    await truffleAssert.passes(
      game.performMoveUsingEther(0, 2,web3.utils.toHex("e5"),{from: B1, value: 10})
    )
  });

  it(" W2 moves c4 - Bids 50wei ", async() => {
    let factory = await Factory.deployed();
    let gameAddress = await factory.getLatestGame(); 
    let game = await Game.at(gameAddress);
    await truffleAssert.passes(
      game.performMoveUsingEther(0, 1,web3.utils.toHex("c4"),{from: W2, value: 50})
    )
  }); 

  it(" B2 moves c5 - Bids 50wei ", async() => {
    let factory = await Factory.deployed();
    let gameAddress = await factory.getLatestGame(); 
    let game = await Game.at(gameAddress);
    await truffleAssert.passes(
      game.performMoveUsingEther(0, 2,web3.utils.toHex("c5"),{from: B2, value: 50})
    )
  });

  it(" W3 moves Qh5 - Bids 100wei ", async() => {
    let factory = await Factory.deployed();
    let gameAddress = await factory.getLatestGame(); 
    let game = await Game.at(gameAddress);
    await truffleAssert.passes(
      game.performMoveUsingEther(0, 1,web3.utils.toHex("Qh5"),{from: W3, value: 100})
    )
  }); 

  it(" B3 moves Nf6 - Bids 10wei ", async() => {
    let factory = await Factory.deployed();
    let gameAddress = await factory.getLatestGame(); 
    let game = await Game.at(gameAddress);
    await truffleAssert.passes(
      game.performMoveUsingEther(0, 2,web3.utils.toHex("Nf6"),{from: B3, value: 10})
    )
  });

  it(" W4 moves Qxf7# - Bids 100wei ", async() => {
    let factory = await Factory.deployed();
    let gameAddress = await factory.getLatestGame(); 
    let game = await Game.at(gameAddress);
    truffleAssert.passes(
      await game.performMoveUsingEther(1, 1,web3.utils.toHex("Qxf7#"),{from: W4, value:100})
    );
  });
  
  // it(" Factory opens Escrow", async() => {
  //   let factory = await Factory.deployed();
  //   await truffleAssert.passes(
  //     factory.returnRewards(1)
  //   )
  // });

  it(" Factory sets reward for the game", async() => {
    let factory = await Factory.deployed();
    await truffleAssert.passes(
      factory.setRewardFor(1,{from: Owner})
    )
  });


  it(" Factory rewards Winners", async() => {
    let factory = await Factory.deployed();
    const beforeBalance = await getBalances();
    await truffleAssert.passes(
      factory.rewardWinners(1)
    );
    const afterBalance = await getBalances();
    const difference = compareBalances(beforeBalance,afterBalance);
    console.log("Difference in Balances :\n", difference);
  });


});