/** Sepolia — primary public deployment. */
export const SEPOLIA_CHAIN_ID = 11155111;
export const SEPOLIA_CHAIN_ID_HEX = '0xaa36a7';

export const SEPOLIA = {
  chainId: SEPOLIA_CHAIN_ID,
  chainIdHex: SEPOLIA_CHAIN_ID_HEX,
  chainName: 'Sepolia',
  nativeCurrency: {
    name: 'Sepolia Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: ['https://ethereum-sepolia-rpc.publicnode.com'],
  blockExplorerUrls: ['https://sepolia.etherscan.io'],
};

export const LOCAL_NETWORK_IDS = new Set(['5777', '31337']);
/** Ropsten and other dead networks still present in old artifacts. */
export const DEPRECATED_NETWORK_IDS = new Set(['3']);

/** Matches Ubiquito.sol ERC20("UBIQUITO ", "UBI") with decimals() = 0 */
export const UBI_TOKEN = {
  symbol: 'UBI',
  decimals: 0,
};

export function isSupportedPlayNetwork(networkId, networksMap) {
  const id = String(networkId);
  if (DEPRECATED_NETWORK_IDS.has(id)) return false;
  return Boolean(networksMap?.[id] || networksMap?.[networkId]);
}

export function networkLabel(networkId) {
  const id = String(networkId);
  if (id === String(SEPOLIA_CHAIN_ID)) return 'Sepolia';
  if (id === '31337') return 'Hardhat Local';
  if (id === '5777') return 'Local Ganache';
  return `Network ${id}`;
}
