import Web3 from 'web3';
import ChessFactory from '../contracts/ChessFactory.json';
import {
  DEPRECATED_NETWORK_IDS,
  LOCAL_NETWORK_IDS,
  SEPOLIA,
  SEPOLIA_CHAIN_ID,
} from './networks';

const DEPLOYED_NETWORK_IDS = Object.keys(ChessFactory.networks);
const DEFAULT_READ_RPC_URL = SEPOLIA.rpcUrls[0];

function preferredNetworkId() {
  const fromEnv = import.meta.env.VITE_NETWORK_ID;
  if (fromEnv && ChessFactory.networks[fromEnv]) {
    return Number(fromEnv);
  }
  // Prefer non-local, non-deprecated deploy if present, else first artifact network.
  const remote = DEPLOYED_NETWORK_IDS.find(
    (id) => !LOCAL_NETWORK_IDS.has(id) && !DEPRECATED_NETWORK_IDS.has(id)
  );
  return Number(remote || DEPLOYED_NETWORK_IDS[0]);
}

async function tryProvider(providerUrlOrEthereum) {
  const web3 = new Web3(providerUrlOrEthereum);
  const networkId = await web3.eth.net.getId();
  if (!ChessFactory.networks[networkId]) {
    return null;
  }
  return { web3, networkId };
}

async function tryHttpRpc(rpcUrl, networkIdHint) {
  try {
    const web3 = new Web3(rpcUrl);
    const networkId = networkIdHint || (await web3.eth.net.getId());
    if (!ChessFactory.networks[networkId]) {
      console.warn('Read RPC network does not match deployed contracts.', networkId);
      return null;
    }
    return { web3, networkId };
  } catch (error) {
    console.error('Failed to connect to read RPC', rpcUrl, error);
    return null;
  }
}

/**
 * Read-only Web3 for spectating. Never prompts MetaMask.
 * Priority:
 *   VITE_READ_RPC_URL (optional override)
 *   → localhost Hardhat/Ganache (if local artifacts)
 *   → public Sepolia RPC (if Sepolia artifacts)
 *   → MetaMask (silent) current chain
 */
export async function createReadContext() {
  const envRpc = import.meta.env.VITE_READ_RPC_URL;
  if (envRpc) {
    const hint = Number(import.meta.env.VITE_NETWORK_ID) || undefined;
    const fromEnv = await tryHttpRpc(envRpc, hint);
    if (fromEnv) return fromEnv;
  }

  const hasLocalDeploy = [...LOCAL_NETWORK_IDS].some((id) => ChessFactory.networks[id]);
  if (hasLocalDeploy) {
    try {
      const local = await tryProvider('http://127.0.0.1:8545');
      if (local) return local;
    } catch {
      // Local Hardhat/Ganache not running — continue.
    }
  }

  const hasSepoliaDeploy = Boolean(ChessFactory.networks[String(SEPOLIA_CHAIN_ID)]);
  if (hasSepoliaDeploy) {
    const sepolia = await tryHttpRpc(DEFAULT_READ_RPC_URL, SEPOLIA_CHAIN_ID);
    if (sepolia) return sepolia;
  }

  if (typeof window !== 'undefined' && window.ethereum) {
    try {
      const injected = await tryProvider(window.ethereum);
      if (injected) return injected;
    } catch (error) {
      console.error('Silent MetaMask read failed', error);
    }
  }

  return null;
}

export function getPreferredNetworkId() {
  return preferredNetworkId();
}

export function getFactoryAddress(networkId) {
  return ChessFactory.networks[networkId]?.address ?? null;
}
