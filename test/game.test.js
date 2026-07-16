const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { deployGameStack } = require("./helpers/deploy");

describe("GameContract", function () {
  async function fixture() {
    const stack = await deployGameStack();
    const min = await stack.game.MIN_BID();
    const minCoin = await stack.game.MIN_COIN_BID();
    const [, W1, B1, , B2, , B3] = stack.signers;
    return { ...stack, min, minCoin, W1, B1, B2, B3 };
  }

  it("minimum bid must be enforced and white plays first", async function () {
    const { game, min, W1, B1 } = await loadFixture(fixture);

    await expect(
      game.connect(W1).performMove(0, 1, 0, "e4", "FEN STRING", { value: 9n })
    ).to.be.revertedWith("ChessGame: Invalid Bid!");

    await expect(
      game.connect(B1).performMove(0, 2, 0, "e4", "FEN STRING", { value: min })
    ).to.be.revertedWith("ChessGame: Not your turn!");

    await expect(
      game.connect(W1).performMove(0, 1, 0, "e4", "FEN STRING", { value: min })
    ).to.not.be.reverted;
  });

  it("alternate turns", async function () {
    const { game, min, W1, B1 } = await loadFixture(fixture);

    await game.connect(W1).performMove(0, 1, 0, "e4", "FEN STRING", { value: min });

    await expect(
      game.connect(B1).performMove(0, 1, 0, "e5", "FEN STRING", { value: min })
    ).to.be.revertedWith("ChessGame: Not your turn!");

    await expect(
      game.connect(B1).performMove(0, 2, 0, "e5", "FEN STRING", { value: min })
    ).to.not.be.reverted;

    await expect(
      game.connect(B1).performMove(0, 2, 0, "e5", "FEN STRING", { value: min })
    ).to.be.revertedWith("ChessGame: Not your turn!");

    await expect(
      game
        .connect(W1)
        .performMove(0, 1, 0, "Qh5", "FEN STRING", { value: min * 10n })
    ).to.not.be.reverted;
  });

  it("cannot change sides", async function () {
    const { game, min, W1, B1, B2 } = await loadFixture(fixture);

    await game.connect(W1).performMove(0, 1, 0, "e4", "FEN STRING", { value: min });
    await game.connect(B1).performMove(0, 2, 0, "e5", "FEN STRING", { value: min });
    await game
      .connect(W1)
      .performMove(0, 1, 0, "Qh5", "FEN STRING", { value: min * 10n });

    await expect(
      game
        .connect(W1)
        .performMove(0, 2, 0, "Nf6", "FEN STRING", { value: min * 10n })
    ).to.be.revertedWith("ChessGame: You cannot change sides!");

    await expect(
      game
        .connect(B2)
        .performMove(0, 2, 0, "Nf6", "FEN STRING", { value: min * 5n })
    ).to.not.be.reverted;

    await expect(
      game
        .connect(B2)
        .performMove(0, 1, 0, "Qxe5+", "FEN STRING", { value: min })
    ).to.be.revertedWith("ChessGame: You cannot change sides!");
  });

  it("allows white to continue within max chances and fills pools", async function () {
    const { game, min, W1, B1, B2, B3 } = await loadFixture(fixture);

    await game.connect(W1).performMove(0, 1, 0, "e4", "FEN STRING", { value: min });
    await game.connect(B1).performMove(0, 2, 0, "e5", "FEN STRING", { value: min });
    await game
      .connect(W1)
      .performMove(0, 1, 0, "Qh5", "FEN STRING", { value: min * 10n });
    await game
      .connect(B2)
      .performMove(0, 2, 0, "Nf6", "FEN STRING", { value: min * 5n });
    await game
      .connect(W1)
      .performMove(0, 1, 0, "Qxe5+", "FEN STRING", { value: min * 10n });
    await game
      .connect(B3)
      .performMove(0, 2, 0, "Qe7", "FEN STRING", { value: min });
    await game
      .connect(W1)
      .performMove(0, 1, 0, "Qxc7", "FEN STRING", { value: min * 5n });
    await game
      .connect(B1)
      .performMove(0, 2, 0, "e4", "FEN STRING", { value: min * 5n });
    await expect(
      game
        .connect(W1)
        .performMove(0, 1, 0, "e4", "FEN STRING", { value: min * 5n })
    ).to.not.be.reverted;

    const whitePool = await game.getPool(1);
    const blackPool = await game.getPool(2);
    expect(whitePool).to.equal(min * 31n);
    expect(blackPool).to.equal(min * 12n);
  });
});
