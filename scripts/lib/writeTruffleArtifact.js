const fs = require("fs");
const path = require("path");

const CLIENT_CONTRACTS_DIR = path.join(
  __dirname,
  "..",
  "..",
  "client",
  "src",
  "contracts"
);

/**
 * Update Truffle-shaped client artifact JSON with a network deployment entry.
 * Preserves existing abi/bytecode; only merges into `networks`.
 */
function writeTruffleArtifact(contractName, chainId, address, transactionHash) {
  const artifactPath = path.join(CLIENT_CONTRACTS_DIR, `${contractName}.json`);
  if (!fs.existsSync(artifactPath)) {
    throw new Error(`Client artifact not found: ${artifactPath}`);
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  if (!artifact.networks) {
    artifact.networks = {};
  }

  artifact.networks[String(chainId)] = {
    events: artifact.networks[String(chainId)]?.events || {},
    links: {},
    address,
    transactionHash: transactionHash || "",
  };
  artifact.updatedAt = new Date().toISOString();

  fs.writeFileSync(artifactPath, JSON.stringify(artifact, null, 2) + "\n");
  console.log(
    `Updated ${contractName} networks[${chainId}] -> ${address}`
  );
}

module.exports = { writeTruffleArtifact, CLIENT_CONTRACTS_DIR };
