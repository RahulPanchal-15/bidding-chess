const Coin = artifacts.require('Ubiquito');
const Factory = artifacts.require('ChessFactory');
const Game = artifacts.require('ChessGame');
const truffleAssert = require('truffle-assertions');
const BN = require('bn.js');

contract("GameContract:", (accounts) => {

  const [Owner, W1, B1, W2, B2, W3, B3, W4, B4, W5] = accounts;

  // it("Create game with 4 max moves and minimum eth bid 10, min coin bid as 100, rate as", async () => {
  //   let factory = await Factory.deployed();
  //   await truffleAssert.passes(
  //     factory.createGame({ from: Owner }),
  //     "Could not create a game!"
  //   );
  // });

  let min = 0;
  let minCoin = 0;

  it(" initialises min bids ", async() => {
    let factory = await Factory.deployed();
    let gameAddress = await factory.getLatestGame(); 
    let game = await Game.at(gameAddress);
    min = await game.MIN_BID();
    minCoin = await game.MIN_COIN_BID();
  })

  it("minimum bid must be 10wei and white plays first", async () => {
    let factory = await Factory.deployed();
    let gameAddress = await factory.getLatestGame();
    let game = await Game.at(gameAddress);

    await truffleAssert.reverts(
      game.performMove(0,1,0,"e4","FEN STRING", { from: W1, value: 9 }),
      "ChessGame: Invalid Bid!"
    );

    await truffleAssert.reverts(
      game.performMove(0,2,0,"e4","FEN STRING", { from: B1, value: min }),
      "ChessGame: Not your turn!"
    );

    await truffleAssert.passes(
      game.performMove(0,1,0,"e4","FEN STRING", { from: W1, value: min }), // W1 - min
    );

  });

  it("alternate turns", async () => {
    let factory = await Factory.deployed();
    let gameAddress = await factory.getLatestGame();
    let game = await Game.at(gameAddress);

    await truffleAssert.reverts(
      game.performMove(0,1,0,"e5","FEN STRING", { from: B1, value: min }),
      "ChessGame: Not your turn!"
    );

    await truffleAssert.passes(
      game.performMove(0,2,0,"e5","FEN STRING", { from: B1, value: min }) // B1 - min
    );

    await truffleAssert.reverts(
      game.performMove(0,2,0,"e5","FEN STRING", { from: B1, value: min }),
      "ChessGame: Not your turn!"
    )

    await truffleAssert.passes(
      game.performMove(0,1,0,"Qh5","FEN STRING", { from: W1, value: min*10 }) // W1 - min*10
    );

  });

  it("cannot change sides", async () => {

    let factory = await Factory.deployed();
    let gameAddress = await factory.getLatestGame();
    let game = await Game.at(gameAddress);
    await truffleAssert.reverts(
      game.performMove(0,2,0,"Nf6","FEN STRING", { from: W1, value: min*10 }),
      "ChessGame: You cannot change sides!"
    );

    await truffleAssert.passes(
      game.performMove(0,2,0,"Nf6","FEN STRING", { from: B2, value: min*5 }) // B2 - min*5
    );

    await truffleAssert.reverts(
      game.performMove(0,1,0,"Qxe5+","FEN STRING", { from: B2, value: min }),
      "ChessGame: You cannot change sides!"
    );

  });

  it("cannot play more than 4 moves", async () => {

    let factory = await Factory.deployed();
    let gameAddress = await factory.getLatestGame();
    let game = await Game.at(gameAddress);

    await truffleAssert.passes(
      game.performMove(0,1,0,"Qxe5+","FEN STRING", { from: W1, value: min*10 }) // W1 - min*10
    );

    await truffleAssert.passes(
      game.performMove(0,2,0,"Qe7","FEN STRING", { from: B3, value: min }) // B3 - min
    );

    await truffleAssert.passes(
      game.performMove(0,1,0,"Qxc7","FEN STRING", { from: W1, value: min*5 }) // W1 - min*5
    );

    await truffleAssert.passes(
      game.performMove(0,2,0,"e4","FEN STRING", { from: B1, value: min*5 }) // B1 - min*5
    );

    await truffleAssert.passes(
      game.performMove(0,1,0,"e4","FEN STRING", { from: W1, value: min*5 }), //W1 - min*5
      "ChessGame: You have played maximum chances!"
    );

  });

  it("pool fills accurately", async () => {

    let factory = await Factory.deployed();
    let gameAddress = await factory.getLatestGame();
    let game = await Game.at(gameAddress);

    let whitePool = await game.getPool(1);
    let blackPool = await game.getPool(2);

    assert.equal(31*min, parseInt(whitePool.toString()), "White Pool inaccuracy!");
    assert.equal(12*min, parseInt(blackPool.toString()), "Black Pool inaccuracy!");

  });

  // it("bids of addresses are accurate", async () => {

  //   let factory = await Factory.deployed();
  //   let gameAddress = await factory.getLatestGame();
  //   let game = await Game.at(gameAddress);

  //   await truffleAssert.passes(
  //     game.performMove(0,2,0,"Qxc8+","FEN STRING", { from: B2, value: min*5}) // B2 - min*5
  //   );

  //   let bidsW1 = await game.bids(W1);
  //   let bidsB1 = await game.bids(B1);
  //   let bidsB2 = await game.bids(B2);
  //   let bidsB3 = await game.bids(B3);
  //   let bidsW2 = await game.bids(W2);

  //   assert.equal(parseInt(bidsW1.toString()), 31*min, "W1");
  //   assert.equal(parseInt(bidsB1.toString()), 6*min, "B1");
  //   assert.equal(parseInt(bidsB2.toString()), 10*min, "B2");
  //   assert.equal(parseInt(bidsB3.toString()), min, "B3");


  // });



});