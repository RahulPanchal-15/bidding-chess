const BN = require('bn.js');
var ubiquito = artifacts.require('./Ubiquito.sol');
var gameFactoryContract = artifacts.require("./ChessFactory.sol");


module.exports = async function(deployer) {
  const accounts = await web3.eth.getAccounts();
  await deployer.deploy(ubiquito,new BN("100000000000000000000"),{from: accounts[0]});
  await deployer.deploy(gameFactoryContract,ubiquito.address,{from: accounts[0],value: web3.utils.toWei("2","ether")});
  
  //Comment out the below code for testing
  let ubi = await ubiquito.deployed();
  await ubi.transfer(gameFactoryContract.address,100000000000,{from: accounts[0]}); 
  let factory = await gameFactoryContract.deployed();
  await factory.createGame(30,{from: accounts[0]});
};
