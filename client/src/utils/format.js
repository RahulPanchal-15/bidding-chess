import { formatEther } from 'ethers';

export const assetUrl = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;

export const formatEth = (wei) => {
  if (wei === undefined || wei === null || wei === '') return '0';
  try {
    return formatEther(String(wei));
  } catch {
    return '0';
  }
};

export const formatEthLabel = (wei) => `${formatEth(wei)} ETH`;

const UBI_COMPACT_TIERS = [
  { div: 10n ** 12n, suffix: 'T' },
  { div: 10n ** 9n, suffix: 'B' },
  { div: 10n ** 6n, suffix: 'M' },
  { div: 10n ** 3n, suffix: 'K' },
];

/** Compact whole-unit UBI (0 decimals): 999 → "999", 1500 → "1.5K", 2e6 → "2M". */
export const formatCompactUbi = (amount) => {
  if (amount === undefined || amount === null || amount === '') return '0';

  let value;
  try {
    value = BigInt(String(amount).trim().split('.')[0]);
  } catch {
    return '0';
  }

  const negative = value < 0n;
  const abs = negative ? -value : value;
  const sign = negative ? '-' : '';

  if (abs < 1000n) return `${sign}${abs}`;

  for (const { div, suffix } of UBI_COMPACT_TIERS) {
    if (abs >= div) {
      const whole = abs / div;
      const tenths = (abs % div) / (div / 10n);
      if (tenths === 0n) return `${sign}${whole}${suffix}`;
      return `${sign}${whole}.${tenths}${suffix}`;
    }
  }

  return `${sign}${abs}`;
};

export const formatUbiLabel = (amount) => `${formatCompactUbi(amount)} UBI`;

/** Compact wallet address: 0x1234…abcd */
export const formatAddress = (address, { prefix = 4, suffix = 4 } = {}) => {
  if (!address || typeof address !== 'string') return '';
  const value = address.trim();
  if (value.length <= prefix + suffix + 2) return value;
  return `${value.slice(0, 2 + prefix)}…${value.slice(-suffix)}`;
};

export const canPlayerMove = (turn, playerSide) =>
  playerSide === '0' || String(turn) === String(playerSide);

export const sideLabel = (side) => {
  if (side === '1' || side === 1) return 'White';
  if (side === '2' || side === 2) return 'Black';
  return 'Undecided';
};
