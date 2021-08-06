const Game = artifacts.require('ChessGame');
const Coin = artifacts.require('Ubiquito');
const Factory = artifacts.require('ChessFactory');
const truffleAssert = require('truffle-assertions');
const BN = require('bn.js');

//e4 e5 | c4 c6 | Qh5 Nf6 | Qxf7# - 4 step checkmate

contract("Simulate Game:", (accounts) => {

  const [Owner,W1,B1,W2,B2,W3,B3,W4,B4,W5] = accounts;
  let min = 0;
  let minCoin = 0;

  async function getBalances() {
    const balances = await accounts.map(async(element) => {
      return (await web3.eth.getBalance(element));
    });
    return await Promise.all(balances);
  }

  async function getUbiBalances() {
    const ubi = await Coin.deployed();
    const balances = await accounts.map(async(element) => {
      return (await ubi.balanceOf(element)).toString()
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
  
  // it(" create game with 10000 max moves and minimum eth bid 10000, min coin bid as 100000, rate as ", async() => {
  //   let factory = await Factory.deployed();
  //   await truffleAssert.passes(
  //     factory.createGame(10000,10000,50000,100000,{from: Owner}),
  //     "Could not create a game!"
  //   );
  // });

  it(" initialises min bids ", async() => {
    let factory = await Factory.deployed();
    let gameAddress = await factory.getLatestGame(); 
    console.log("GAME ADDRESS :", gameAddress);
    let game = await Game.at(gameAddress);
    min = await game.MIN_BID();
    console.log("MIN BID : ",min.toString());
    minCoin = await game.MIN_COIN_BID();
  })


  it(" W1 moves e4 - Bids (min)wei ", async() => {


    let factory = await Factory.deployed();
    let gameAddress = await factory.getLatestGame(); 
    let game = await Game.at(gameAddress);
    await truffleAssert.passes(
      game.performMove(0,1,0,"move","this is going to be the fen",{from: W1, value: min})
    )
  }); 

  it(" B1 moves e5 - Bids 10000wei ", async() => {
    let factory = await Factory.deployed();
    let gameAddress = await factory.getLatestGame(); 
    let game = await Game.at(gameAddress);
    await truffleAssert.passes(
      game.performMove(0,2,0,"e5","this is going to be the fen",{from: B1, value: min})
    )
  });

  it(" W2 moves c4 - Bids (min*5)wei ", async() => {
    let factory = await Factory.deployed();
    let gameAddress = await factory.getLatestGame(); 
    let game = await Game.at(gameAddress);
    await truffleAssert.passes(
      game.performMove(0,1,0,"c4","this is going to be the fen",{from: W2, value: min*5})
    )
  }); 

  it(" B2 moves c5 - Bids (min*5)wei ", async() => {
    let factory = await Factory.deployed();
    let gameAddress = await factory.getLatestGame(); 
    let game = await Game.at(gameAddress);
    await truffleAssert.passes(
      game.performMove(0,2,0,"c5","this is going to be the fen",{from: B2, value: min*5})
    )
  });

  it(" W3 moves Qh5 - Bids (min)wei ", async() => {
    let factory = await Factory.deployed();
    let gameAddress = await factory.getLatestGame(); 
    let game = await Game.at(gameAddress);
    await truffleAssert.passes(
      game.performMove(0,1,0,"Qh5","this is going to be the fen",{from: W3, value: min*10})
    )
  }); 

  it(" Factory force kills", async() => {
    let factory = await Factory.deployed();
    const beforeBalance = await getBalances();
    console.log(beforeBalance);
    
    let tx = await factory.forceKill(1,false,{from:Owner});
    console.log(tx);
    const afterBalance = await getBalances();
    console.log(afterBalance);
    const difference = compareBalances(beforeBalance,afterBalance);
    console.log(difference);

  });

  // it(" B3 moves Nf6 - Bids 100000wei ", async() => {
  //   let factory = await Factory.deployed();
  //   let gameAddress = await factory.getLatestGame(); 
  //   let game = await Game.at(gameAddress);
  //   let tx = null;
  //   console.log("B3 before balance : ",await web3.eth.getBalance(B3));
  //   await truffleAssert.passes(
  //     tx = game.performMove(0,2,0,"Nf6","this is going to be the fen",{from: B3, value: min})
  //   )
  //   console.log(tx);
  //   console.log("B3 after balance : ",await web3.eth.getBalance(B3));
  // });

  // it(" W4 moves Qxf7# - Bids (min*10)wei ", async() => {
  //   let factory = await Factory.deployed();
  //   let gameAddress = await factory.getLatestGame(); 
  //   let game = await Game.at(gameAddress);
  //   const beforeBalance = await getBalances();
    
  //   let tx = null;
  //   truffleAssert.passes(
  //     tx = await game.performMove(1,1,0,"Qxf7#","this is going to be the fen",{from: W4, value:min*10})
  //   );
  //   console.log(tx);
  //   const afterBalance = await getBalances();
  //   const difference = compareBalances(beforeBalance,afterBalance);
    
  //   console.log("W4 before balance : ",beforeBalance[7]);
  //   console.log("W4 after balance  : ",afterBalance[7]);
    
    
  //   console.log("Difference in Balances :\n", difference);
  //   console.log("UBI BALANCES : ",await getUbiBalances());
  // });

  // it(" Factory changed defaults", async() => {
  //   let factory = await Factory.deployed();
  //   await factory.setGameDefaults(20,2000000000,200,10000002,200000000,{from: Owner});
  // })  
  
  // it(" Create new game", async() => {
    
  //   let factory = await Factory.deployed();
  //   console.log("WAS CALLED : ",await factory.WAS_CALLED());
    
  //   await factory.createGame({from:Owner});
  //   let gameAddress = await factory.getLatestGame();
  //   const ubi = await Coin.deployed(); 
  //   console.log("GAME ADDRESS : ",gameAddress);
  //   console.log("GAME BALANCE ETH: ",await web3.eth.getBalance(gameAddress));
  //   console.log("GAME BALANCE UBI: ",await ubi.balanceOf(gameAddress));
  //   let game = null;
  //   truffleAssert.passes(
  //     game = await Game.at(gameAddress)
  //   );
  //   console.log("GAME_ID : ",await game.GAME_ID());
  // });


  //   it(" initialises min bids ", async() => {
  //     let factory = await Factory.deployed();
  //     let gameAddress = await factory.getLatestGame(); 
  //     let game = await Game.at(gameAddress);
  //     min = await game.MIN_BID();
  //     console.log("MIN BID : ",min.toString());
  //     minCoin = await game.MIN_COIN_BID();
  //   })

  //   it(" W5 moves e4 - Bids (min)wei ", async() => {


  //     let factory = await Factory.deployed();
  //     let gameAddress = await factory.getLatestGame(); 
  //     let game = await Game.at(gameAddress);
  //     console.log("W5 before balance : ",await web3.eth.getBalance(W5));
  //     await truffleAssert.passes(
  //       game.performMove(0,1,0,"move","this is going to be the fen",{from: W5, value: min})
  //     )
  //     console.log("W5 after balance : ",await web3.eth.getBalance(W5));
  //   }); 
  
  //   it(" B4 moves e5 - Bids 10000wei ", async() => {
  //     let factory = await Factory.deployed();
  //     let gameAddress = await factory.getLatestGame(); 
  //     let game = await Game.at(gameAddress);
  //     console.log("B4 before balance : ",await web3.eth.getBalance(B4));
  //     await truffleAssert.passes(
  //       game.performMove(0,2,0,"e5","this is going to be the fen",{from: B4, value: min})
  //     )
  //     console.log("B4 after balance : ",await web3.eth.getBalance(B4));
  //   });
      
  //   it(" Factory force kills", async() => {
  //     let factory = await Factory.deployed();
  //     const beforeBalance = await getBalances();
  //     console.log(beforeBalance);
      
  //     let tx = await factory.forceKill(2,false,{from:Owner});
  //     console.log(tx);
  //     const afterBalance = await getBalances();
  //     console.log(afterBalance);
  //     const difference = compareBalances(beforeBalance,afterBalance);
  //     console.log(difference);

  //   });

    
    
    
    

});