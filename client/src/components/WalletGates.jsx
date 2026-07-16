import MetaMaskButton from './MetaMaskButton';
import MetaMaskIcon from './MetaMaskIcon';

export default function WalletGates({
  gate,
  onConnect,
  connecting = false,
  onInstallMetamask,
  onSwitchNetwork,
  switchingNetwork = false,
}) {
  if (!gate) return null;

  const content = {
    noMetamask: {
      title: 'MetaMask required',
      body: 'Install MetaMask to connect your wallet and play Bidding Chess.',
      action: { label: 'Install MetaMask', onClick: onInstallMetamask },
      showIcon: true,
    },
    notConnected: {
      title: 'Connect wallet',
      body: 'Connect MetaMask on the Sepolia test network to join the communal game.',
      action: {
        label: connecting ? 'Connecting...' : 'Connect',
        onClick: onConnect,
        disabled: connecting,
      },
      showIcon: true,
    },
    wrongNetwork: {
      title: 'Wrong network',
      body: 'This game runs on Sepolia (chain ID 11155111). Switch MetaMask to Sepolia to play.',
      action: onSwitchNetwork
        ? {
            label: switchingNetwork ? 'Switching...' : 'Switch to Sepolia',
            onClick: onSwitchNetwork,
            disabled: switchingNetwork,
          }
        : null,
      showIcon: true,
    },
    gameEnded: {
      title: 'Game ended',
      body: 'The current communal game has finished. Check back soon for the next round.',
      action: null,
      showIcon: false,
    },
  }[gate];

  if (!content) return null;

  return (
    <section className="flex min-h-[50vh] items-center justify-center">
      <div className="brutal-panel max-w-lg p-6 text-left md:p-8">
        <h2 className="flex items-center gap-3 font-display text-2xl font-bold uppercase">
          {content.showIcon && <MetaMaskIcon className="h-8 w-8" />}
          {content.title}
        </h2>
        <p className="mt-3 font-mono text-sm leading-relaxed">{content.body}</p>
        {content.action && (
          <MetaMaskButton
            className="brutal-btn-accent mt-6"
            onClick={content.action.onClick}
            disabled={content.action.disabled}
          >
            {content.action.label}
          </MetaMaskButton>
        )}
      </div>
    </section>
  );
}
