var ubiquito = artifacts.require('./Ubiquito.sol');
var gameFactoryContract = artifacts.require("./ChessFactory.sol");


module.exports = async function(deployer) {
  const accounts = await web3.eth.getAccounts();
  await deployer.deploy(ubiquito,1000000000000);
  await deployer.deploy(gameFactoryContract,ubiquito.address,{from:accounts[0], value:web3.utils.toWei("2","ether")});

  let ubi = await ubiquito.deployed();
  await ubi.transfer(gameFactoryContract.address,100000000);
  let factory = await gameFactoryContract.deployed();
  await factory.createGame({from: accounts[0]});  
};
