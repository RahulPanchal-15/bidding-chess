const path = require("path");
const HDWalletProvider = require("@truffle/hdwallet-provider");
require("dotenv").config("../.env");

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  contracts_build_directory: path.join(__dirname, "client/src/contracts"),
  networks: {
    develop: {
      port: 8545
    },
    rinkeby_infura: {
      provider: function() {
        return new HDWalletProvider({
          mnenomic: {
            phrase: process.env.MNEMONIC
          },
          providerOrUrl: `https://rinkeby.infura.io/v3/${process.env.API_KEY}`,
          addressIndex: process.env.ADDRESS_INDEX,
        })
      },
      gasPrice:  25000,
      network_id: 4
    },
  },
  compilers: {
    solc: {
      version: "^0.8.4"
    }
  }
};
