/**
 * Turn MetaMask / ethers / contract errors into short UI-facing messages.
 */
export function formatWalletError(error, fallback = 'Transaction failed.') {
  if (!error) return fallback;

  const code = error.code ?? error.error?.code;
  const raw = [
    error.shortMessage,
    error.message,
    error.error?.message,
    error.reason,
    error.data?.message,
    typeof error === 'string' ? error : null,
  ]
    .filter(Boolean)
    .join(' ');

  // User rejected in MetaMask / wallet
  if (
    code === 4001 ||
    code === 'ACTION_REJECTED' ||
    /user denied|user rejected|rejected the request|denied transaction signature/i.test(
      raw
    )
  ) {
    return 'You cancelled the transaction in MetaMask.';
  }

  // Common wallet / RPC cases
  if (/insufficient funds|exceeds the balance|gas required exceeds/i.test(raw)) {
    return 'Insufficient funds for this transaction (including gas).';
  }
  if (/nonce too low/i.test(raw)) {
    return 'Transaction nonce conflict. Try again.';
  }
  if (/replacement transaction underpriced|already known/i.test(raw)) {
    return 'A similar transaction is already pending. Check MetaMask.';
  }
  if (/network changed|disconnected|failed to fetch|timeout/i.test(raw)) {
    return 'Network error. Check your connection and try again.';
  }

  // Solidity require / revert strings
  const revertMatch = raw.match(
    /(?:execution reverted(?:\s*:)?|reverted with reason string|revert)\s*:?\s*["']?([^"'\n{]+)/i
  );
  if (revertMatch?.[1]) {
    return cleanMessage(revertMatch[1]);
  }

  // Strip trailing JSON payloads MetaMask sometimes appends
  const beforeJson = raw.split(/\s*\{\s*"/)[0];
  const cleaned = cleanMessage(beforeJson || raw);
  if (cleaned && cleaned.length > 0 && cleaned.length < 160) {
    return cleaned;
  }

  return fallback;
}

function cleanMessage(text) {
  return String(text)
    .replace(/^MetaMask\s+Tx\s+Signature:\s*/i, '')
    .replace(/^Error:\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}
