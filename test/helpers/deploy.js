const { ethers } = require("hardhat");

const UBI_INITIAL_SUPPLY = 100000000000000000000n;
const UBI_FACTORY_FUND = 100000000000n;
const FACTORY_ETH = ethers.parseEther("3");
const CREATE_GAME_GAS_PRICE = 5;

/**
 * Deploy Ubiquito + ChessFactory, fund factory, create first game.
 * Mirrors scripts/deploy.js for use in tests.
 */
async function deployGameStack() {
  const signers = await ethers.getSigners();
  const [owner] = signers;

  const Ubiquito = await ethers.getContractFactory("Ubiquito");
  const ubiquito = await Ubiquito.deploy(UBI_INITIAL_SUPPLY);
  await ubiquito.waitForDeployment();

  const ChessFactory = await ethers.getContractFactory("ChessFactory");
  const factory = await ChessFactory.deploy(await ubiquito.getAddress(), {
    value: FACTORY_ETH,
  });
  await factory.waitForDeployment();

  await (await ubiquito.transfer(await factory.getAddress(), UBI_FACTORY_FUND)).wait();
  await (await factory.createGame(CREATE_GAME_GAS_PRICE)).wait();

  const gameAddress = await factory.getLatestGame();
  const game = await ethers.getContractAt("ChessGame", gameAddress);

  return { owner, signers, ubiquito, factory, game, gameAddress };
}

module.exports = { deployGameStack };
