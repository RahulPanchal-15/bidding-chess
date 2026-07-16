const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { deployGameStack } = require("./helpers/deploy");

// e4 e5 | c4 c6 | Qh5 Nf6 | Qxf7# — short mate sequence (moves as labels only)
describe("Simulate Game", function () {
  async function fixture() {
    const stack = await deployGameStack();
    const min = await stack.game.MIN_BID();
    const minCoin = await stack.game.MIN_COIN_BID();
    const [, W1, B1, W2, B2, W3, B3, W4] = stack.signers;
    return { ...stack, min, minCoin, W1, B1, W2, B2, W3, B3, W4 };
  }

  it("plays a short game ending in white checkmate", async function () {
    const { factory, game, min, W1, B1, W2, B2, W3, B3, W4 } =
      await loadFixture(fixture);

    await expect(
      game
        .connect(W1)
        .performMove(0, 1, 0, "e4", "this is going to be the fen", { value: min })
    ).to.not.be.reverted;

    await expect(
      game
        .connect(B1)
        .performMove(0, 2, 0, "e5", "this is going to be the fen", { value: min })
    ).to.not.be.reverted;

    await expect(
      game
        .connect(W2)
        .performMove(0, 1, 0, "c4", "this is going to be the fen", {
          value: min * 5n,
        })
    ).to.not.be.reverted;

    await expect(
      game
        .connect(B2)
        .performMove(0, 2, 0, "c5", "this is going to be the fen", {
          value: min * 5n,
        })
    ).to.not.be.reverted;

    await expect(
      game
        .connect(W3)
        .performMove(0, 1, 0, "Qh5", "this is going to be the fen", {
          value: min * 10n,
        })
    ).to.not.be.reverted;

    await expect(
      game
        .connect(B3)
        .performMove(0, 2, 0, "Nf6", "this is going to be the fen", { value: min })
    ).to.not.be.reverted;

    await expect(
      game
        .connect(W4)
        .performMove(1, 1, 0, "Qxf7#", "this is going to be the fen", {
          value: min * 10n,
        })
    ).to.not.be.reverted;

    expect(await factory.getLatestGame()).to.equal(await game.getAddress());
  });
});
