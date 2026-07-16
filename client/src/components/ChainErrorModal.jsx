import MetaMaskButton from './MetaMaskButton';

export default function ChainErrorModal({
  open,
  message,
  isMetaMaskInstalled,
  connected,
  rightNetwork = false,
  connecting,
  switchingNetwork = false,
  onConnect,
  onSwitchNetwork,
  onInstallMetamask,
  onClose,
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="chain-error-title"
    >
      <div className="brutal-panel w-full max-w-lg p-6 md:p-8">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 id="chain-error-title" className="font-display text-2xl font-bold uppercase">
            Chain unavailable
          </h2>
          <button type="button" className="brutal-btn px-3 py-1" onClick={onClose}>
            Close
          </button>
        </div>

        <p className="font-mono text-sm leading-relaxed">{message}</p>
        <p className="mt-3 font-mono text-sm leading-relaxed">
          Bidding Chess is deployed on the <strong>Sepolia</strong> test network (chain ID
          11155111). Connect MetaMask to Sepolia to load the live game.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          {!isMetaMaskInstalled && (
            <MetaMaskButton onClick={onInstallMetamask}>Install MetaMask</MetaMaskButton>
          )}
          {isMetaMaskInstalled && !connected && (
            <MetaMaskButton onClick={onConnect} disabled={connecting}>
              {connecting ? 'Connecting...' : 'Connect wallet'}
            </MetaMaskButton>
          )}
          {isMetaMaskInstalled && connected && !rightNetwork && onSwitchNetwork && (
            <MetaMaskButton onClick={onSwitchNetwork} disabled={switchingNetwork}>
              {switchingNetwork ? 'Switching...' : 'Switch to Sepolia'}
            </MetaMaskButton>
          )}
          <button type="button" className="brutal-btn" onClick={onClose}>
            Continue browsing
          </button>
        </div>
      </div>
    </div>
  );
}
