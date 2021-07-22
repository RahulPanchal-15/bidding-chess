const Coin = artifacts.require('Ubiquito');
const Factory = artifacts.require('ChessFactory');
const Game = artifacts.require('ChessGame');
const truffleAssert = require('truffle-assertions');

contract("GameContract:", (accounts) => {

  const [Owner, W1, B1, W2, B2, W3, B3, W4, B4, W5] = accounts;

  it(" send 10000 Ubiquito to ChessFactory", async() => {
    let coin = await Coin.deployed();
    await truffleAssert.passes(
      coin.transfer(Factory.address,10000,{from: Owner})
    );
    let balance = await coin.balanceOf(Factory.address);
    console.log("ChessFactory Ubi balance : ",balance.toString());
  });

  it("create game with 4 max moves and minimum eth bid 10, min coin bid as 100, rate as", async () => {
    let factory = await Factory.deployed();
    await truffleAssert.passes(
      factory.createGame(4, 10, 50, 100, { from: Owner }),
      "Could not create a game!"
    );
  });

  it("minimum bid must be 10wei and white plays first", async () => {
    let factory = await Factory.deployed();
    let gameAddress = await factory.getLatestGame();
    let game = await Game.at(gameAddress);

    await truffleAssert.reverts(
      game.performMoveUsingEther(0, 1, web3.utils.toHex("e4"), { from: W1, value: 9 }),
      "ChessGame: Invalid Bid!"
    );

    await truffleAssert.reverts(
      game.performMoveUsingEther(0, 2, web3.utils.toHex("e4"), { from: B1, value: 10 }),
      "ChessGame: Not your turn!"
    );

    await truffleAssert.passes(
      game.performMoveUsingEther(0, 1, web3.utils.toHex("e4"), { from: W1, value: 10 }), // W1 - 10
    );

  });

  it("alternate turns", async () => {
    let factory = await Factory.deployed();
    let gameAddress = await factory.getLatestGame();
    let game = await Game.at(gameAddress);

    await truffleAssert.reverts(
      game.performMoveUsingEther(0, 1, web3.utils.toHex("e5"), { from: B1, value: 10 }),
      "ChessGame: Not your turn!"
    );

    await truffleAssert.passes(
      game.performMoveUsingEther(0, 2, web3.utils.toHex("e5"), { from: B1, value: 10 }) // B1 - 10
    );

    await truffleAssert.reverts(
      game.performMoveUsingEther(0, 2, web3.utils.toHex("e5"), { from: B1, value: 10 }),
      "ChessGame: Not your turn!"
    )

    await truffleAssert.passes(
      game.performMoveUsingEther(0, 1, web3.utils.toHex("Qh5"), { from: W1, value: 100 }) // W1 - 100
    );

  });

  it("cannot change sides", async () => {

    let factory = await Factory.deployed();
    let gameAddress = await factory.getLatestGame();
    let game = await Game.at(gameAddress);

    await truffleAssert.reverts(
      game.performMoveUsingEther(0, 2, web3.utils.toHex("Nf6"), { from: W1, value: 100 }),
      "ChessGame: You cannot change sides!"
    );

    await truffleAssert.passes(
      game.performMoveUsingEther(0, 2, web3.utils.toHex("Nf6"), { from: B2, value: 50 }) // B2 - 50
    );

    await truffleAssert.reverts(
      game.performMoveUsingEther(0, 1, web3.utils.toHex("Qxe5+"), { from: B2, value: 10 }),
      "ChessGame: You cannot change sides!"
    );

  });

  it("cannot play more than 4 moves", async () => {

    let factory = await Factory.deployed();
    let gameAddress = await factory.getLatestGame();
    let game = await Game.at(gameAddress);

    await truffleAssert.passes(
      game.performMoveUsingEther(0, 1, web3.utils.toHex("Qxe5+"), { from: W1, value: 100 }) // W1 - 100
    );

    await truffleAssert.passes(
      game.performMoveUsingEther(0, 2, web3.utils.toHex("Qe7"), { from: B3, value: 10 }) // B3 - 10
    );

    await truffleAssert.passes(
      game.performMoveUsingEther(0, 1, web3.utils.toHex("Qxc7"), { from: W1, value: 50 }) // W1 - 50
    );

    await truffleAssert.passes(
      game.performMoveUsingEther(0, 2, web3.utils.toHex("Nxe4"), { from: B1, value: 50 }) // B1 - 50
    );

    await truffleAssert.reverts(
      game.performMoveUsingEther(0, 1, web3.utils.toHex("Qxc8+"), { from: W1, value: 50 }),
      "ChessGame: You have played maximum chances!"
    );

  });

  it("pool fills accurately", async () => {

    let factory = await Factory.deployed();
    let gameAddress = await factory.getLatestGame();
    let game = await Game.at(gameAddress);

    let whitePool = await game.getPool(1);
    let blackPool = await game.getPool(2);

    assert.equal(260, parseInt(whitePool.toString()), "White Pool inaccuracy!");
    assert.equal(120, parseInt(blackPool.toString()), "Black Pool inaccuracy!");

  });
  
  
  
});
  
    // it("bids of addresses are accurate", async () => {
  
    //   let factory = await Factory.deployed();
    //   let gameAddress = await factory.getLatestGame();
    //   let game = await Game.at(gameAddress);
  
    //   await truffleAssert.passes(
    //     game.performMoveUsingEther(0,1 , web3.utils.toHex("Qxc8+"), { from: W2, value: 50}) // W2 - 30
    //   );
  
    //   let bidsW1 = await game.bids(W1);
    //   let bidsB1 = await game.bids(B1);
    //   let bidsB2 = await game.bids(B2);
    //   let bidsB3 = await game.bids(B3);
    //   let bidsW2 = await game.bids(W2);
  
    //   assert.equal(parseInt(bidsW1.toString()), 260, "W1");
    //   assert.equal(parseInt(bidsW2.toString()), 50, "W2");
    //   assert.equal(parseInt(bidsB1.toString()), 60, "B1");
    //   assert.equal(parseInt(bidsB2.toString()), 50, "B2");
    //   assert.equal(parseInt(bidsB3.toString()), 10, "B3");
  
  
    // });