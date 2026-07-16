const hre = require("hardhat");
const { writeTruffleArtifact } = require("./lib/writeTruffleArtifact");

const UBI_INITIAL_SUPPLY = 100000000000000000000n;
const UBI_FACTORY_FUND = 100000000000n;
const CREATE_GAME_GAS_PRICE = 5;

function factoryEthAmount() {
  const fromEnv = process.env.FACTORY_ETH;
  if (fromEnv) {
    return hre.ethers.parseEther(fromEnv);
  }
  return hre.ethers.parseEther("0.1");
}

async function resolveUbiquito(deployer) {
  const existing = (process.env.UBIQUITO_ADDRESS || "").trim();
  if (existing) {
    if (!hre.ethers.isAddress(existing)) {
      throw new Error(`UBIQUITO_ADDRESS is not a valid address: ${existing}`);
    }
    const code = await hre.ethers.provider.getCode(existing);
    if (!code || code === "0x") {
      throw new Error(`No contract code at UBIQUITO_ADDRESS: ${existing}`);
    }
    const ubiquito = await hre.ethers.getContractAt("Ubiquito", existing);
    const balance = await ubiquito.balanceOf(deployer.address);
    console.log("Reusing Ubiquito:", existing);
    console.log("Deployer UBI balance:", balance.toString());
    if (balance < UBI_FACTORY_FUND) {
      throw new Error(
        `Deployer UBI balance ${balance} is below factory fund ${UBI_FACTORY_FUND}`
      );
    }
    return { ubiquito, ubiquitoAddress: existing, ubiquitoTxHash: "" };
  }

  const Ubiquito = await hre.ethers.getContractFactory("Ubiquito");
  const ubiquito = await Ubiquito.deploy(UBI_INITIAL_SUPPLY);
  await ubiquito.waitForDeployment();
  const ubiquitoAddress = await ubiquito.getAddress();
  const ubiquitoTx = ubiquito.deploymentTransaction();
  console.log("Deployed Ubiquito:", ubiquitoAddress);
  return {
    ubiquito,
    ubiquitoAddress,
    ubiquitoTxHash: ubiquitoTx?.hash || "",
  };
}

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const network = await hre.ethers.provider.getNetwork();
  const chainId = Number(network.chainId);
  const factoryEth = factoryEthAmount();

  console.log("Deploying with:", deployer.address);
  console.log("Network chainId:", chainId);
  console.log(
    "Deployer balance:",
    hre.ethers.formatEther(
      await hre.ethers.provider.getBalance(deployer.address)
    ),
    "ETH"
  );
  console.log("Factory endowment:", hre.ethers.formatEther(factoryEth), "ETH");

  const { ubiquito, ubiquitoAddress, ubiquitoTxHash } =
    await resolveUbiquito(deployer);

  const ChessFactory = await hre.ethers.getContractFactory("ChessFactory");
  const factory = await ChessFactory.deploy(ubiquitoAddress, {
    value: factoryEth,
  });
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  const factoryTx = factory.deploymentTransaction();
  console.log("ChessFactory:", factoryAddress);

  const transferTx = await ubiquito.transfer(factoryAddress, UBI_FACTORY_FUND);
  await transferTx.wait();
  console.log("Funded factory with", UBI_FACTORY_FUND.toString(), "UBI");

  const createTx = await factory.createGame(CREATE_GAME_GAS_PRICE);
  await createTx.wait();
  const latestGame = await factory.getLatestGame();
  console.log("Latest game:", latestGame);

  writeTruffleArtifact("Ubiquito", chainId, ubiquitoAddress, ubiquitoTxHash);
  writeTruffleArtifact(
    "ChessFactory",
    chainId,
    factoryAddress,
    factoryTx?.hash
  );

  console.log("\nDeployment complete.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
