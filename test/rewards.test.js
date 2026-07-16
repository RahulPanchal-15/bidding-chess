const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { deployGameStack } = require("./helpers/deploy");

describe("ChessFactory rewards flow", function () {
  async function fixture() {
    const stack = await deployGameStack();
    const min = await stack.game.MIN_BID();
    const minCoin = await stack.game.MIN_COIN_BID();
    const [, W1, B1, W2] = stack.signers;
    return { ...stack, min, minCoin, W1, B1, W2 };
  }

  it("supports UBI bids and ETH bids", async function () {
    const { ubiquito, factory, game, gameAddress, owner, min, minCoin, W1, B1, W2 } =
      await loadFixture(fixture);

    await (await ubiquito.connect(owner).transfer(W1.address, minCoin)).wait();
    await (await ubiquito.connect(owner).transfer(B1.address, minCoin * 5n)).wait();

    expect(await ubiquito.balanceOf(W1.address)).to.equal(minCoin);

    await (await ubiquito.connect(W1).approve(gameAddress, minCoin)).wait();
    await expect(
      game.connect(W1).performMove(0, 1, minCoin, "e4", "this will be the fen string")
    ).to.not.be.reverted;

    await (await ubiquito.connect(B1).approve(gameAddress, minCoin * 5n)).wait();
    await expect(
      game
        .connect(B1)
        .performMove(0, 2, minCoin * 5n, "e5", "this will be the fen string")
    ).to.not.be.reverted;

    // Result.WinLoss (1) ends the game and pays out rewards (same as legacy Truffle test).
    await expect(
      game
        .connect(W2)
        .performMove(1, 1, 0, "c4", "this will be the fen string", { value: min })
    ).to.not.be.reverted;

    expect(await game.REWARDED()).to.equal(true);
    expect(await factory.getLatestGame()).to.equal(gameAddress);
  });
});
