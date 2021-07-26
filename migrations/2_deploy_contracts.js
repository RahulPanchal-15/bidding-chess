var ubiquito = artifacts.require('./Ubiquito.sol');
var gameFactoryContract = artifacts.require("./ChessFactory.sol");


module.exports = async function(deployer) {
  const accounts = await web3.eth.getAccounts();
  await deployer.deploy(ubiquito,100000);
  await deployer.deploy(gameFactoryContract,ubiquito.address,35,12,60);
  
  //Comment out the below code for testing
  let ubi = await ubiquito.deployed();
  //transfer 10000 ubi to ChessFactory
  await ubi.transfer(gameFactoryContract.address,10000,{from: accounts[0]}); 
  let factory = await gameFactoryContract.deployed();
  //create a game
  await factory.createGame(8,100,10,15,{from: accounts[0]});

};
