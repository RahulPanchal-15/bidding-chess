var ubiquito = artifacts.require('./Ubiquito.sol');
var gameFactoryContract = artifacts.require("./ChessFactory.sol");


module.exports = async function(deployer) {
  const accounts = await web3.eth.getAccounts();
  await deployer.deploy(ubiquito,100000);
  await deployer.deploy(gameFactoryContract,ubiquito.address);
};
