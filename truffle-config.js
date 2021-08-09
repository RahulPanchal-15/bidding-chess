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
    ropsten_infura: {
      provider: function() {
        return new HDWalletProvider({
          mnemonic: {
            phrase: process.env.MNEMONIC
          },
          providerOrUrl: `wss://ropsten.infura.io/ws/v3/${process.env.API_KEY}`,
          addressIndex: process.env.ADDRESS_INDEX,
        })
      },
      gasPrice:  250000,
      network_id: 3
    },
  },
  compilers: {
    solc: {
      version: "^0.8.4"
    }
  }
};
