import { assetUrl, formatEthLabel, formatUbiLabel, sideLabel } from '../utils/format';
import {
  TELEGRAM_CTA_LABEL,
  TELEGRAM_URL,
  buildWaitingCopy,
} from '../content/gameCopy';
import { getInvitePayload } from '../utils/share';
import MetaMaskButton from './MetaMaskButton';

function BidTierButton({ label, sublabel, icon, disabled, onClick }) {
  return (
    <button
      type="button"
      className="brutal-btn flex min-h-[4.25rem] w-full min-w-0 flex-col items-center justify-center gap-1 px-2 py-2.5 text-center"
      disabled={disabled}
      onClick={onClick}
    >
      <span className="font-mono text-[10px] font-semibold uppercase tracking-wide opacity-70">
        {sublabel}
      </span>
      <span className="inline-flex max-w-full items-center justify-center gap-1.5">
        <img src={assetUrl(icon)} alt="" className="h-4 w-4 shrink-0" />
        <span className="truncate font-mono text-xs font-bold normal-case tracking-normal">
          {label}
        </span>
      </span>
    </button>
  );
}

function BidAssetGroup({ title, icon, children }) {
  return (
    <div className="min-w-0 border-3 border-ink bg-card p-3 shadow-brutal-sm">
      <div className="mb-3 flex items-center gap-2">
        <img src={assetUrl(icon)} alt="" className="h-5 w-5 shrink-0" />
        <p className="font-mono text-[11px] font-semibold uppercase tracking-wide">{title}</p>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">{children}</div>
    </div>
  );
}

export default function BidBar({
  playState,
  hasMoved,
  processing,
  minBid,
  minCoinBid,
  turn,
  onBidEther,
  onBidCoin,
  onConnect,
  connecting,
  onInstallMetamask,
  onSwitchNetwork,
  switchingNetwork = false,
  onUndoMove,
  onCopyInvite,
  copyingInvite = false,
}) {
  const ethTiers = [
    { key: 'low', multiplier: 1, sublabel: 'Low' },
    { key: 'med', multiplier: 5, sublabel: 'Med' },
    { key: 'high', multiplier: 10, sublabel: 'High' },
  ];

  const ubiTiers = [
    { key: 'ubi-low', multiplier: 1, sublabel: 'Low' },
    { key: 'ubi-med', multiplier: 5, sublabel: 'Med' },
    { key: 'ubi-high', multiplier: 10, sublabel: 'High' },
  ];

  if (playState === 'needWallet') {
    return (
      <section className="brutal-panel surface-shell mt-4 p-4">
        <h3 className="font-display text-sm font-bold uppercase">Want to play?</h3>
        <p className="mt-2 font-mono text-xs leading-relaxed">
          Watch the board freely. Connect a wallet on <strong>Sepolia</strong>, drag a piece, then
          bid ETH or UBI to lock the move.
        </p>
        <MetaMaskButton className="brutal-btn-accent mt-4" onClick={onConnect} disabled={connecting}>
          {connecting ? 'Connecting...' : 'Connect wallet to play'}
        </MetaMaskButton>
      </section>
    );
  }

  if (playState === 'needMetamask') {
    return (
      <section className="brutal-panel surface-shell mt-4 p-4">
        <h3 className="font-display text-sm font-bold uppercase">Want to play?</h3>
        <p className="mt-2 font-mono text-xs leading-relaxed">
          Install MetaMask to drag a piece and bid on the next move.
        </p>
        <MetaMaskButton className="brutal-btn-accent mt-4" onClick={onInstallMetamask}>
          Install MetaMask
        </MetaMaskButton>
      </section>
    );
  }

  if (playState === 'wrongNetwork') {
    return (
      <section className="brutal-panel mt-4 border-rose bg-rose/10 p-4">
        <h3 className="font-display text-sm font-bold uppercase">Wrong network</h3>
        <p className="mt-2 font-mono text-xs leading-relaxed">
          This game runs on the <strong>Sepolia</strong> test network (chain ID 11155111). Switch
          MetaMask to Sepolia to place bids. You can keep watching the board in the meantime.
        </p>
        {onSwitchNetwork && (
          <MetaMaskButton
            className="brutal-btn-accent mt-4"
            onClick={onSwitchNetwork}
            disabled={switchingNetwork}
          >
            {switchingNetwork ? 'Switching...' : 'Switch to Sepolia'}
          </MetaMaskButton>
        )}
      </section>
    );
  }

  if (playState === 'waiting') {
    const invite = getInvitePayload(turn);

    return (
      <section className="brutal-panel mt-4 p-4 md:p-5">
        <h3 className="font-display text-sm font-bold uppercase md:text-base">
          Waiting on {sideLabel(turn)}
        </h3>
        <p className="mt-2 font-mono text-xs leading-relaxed">{buildWaitingCopy(turn)}</p>

        <div className="mt-4 border-3 border-ink bg-card p-3 shadow-brutal-sm md:p-4">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-wide text-ink/70">
            Share this
          </p>
          <p className="mt-2 whitespace-pre-line font-mono text-xs leading-relaxed md:text-sm">
            {invite.text}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            className="brutal-btn-accent"
            disabled={copyingInvite}
            onClick={onCopyInvite}
          >
            {copyingInvite ? 'Copying...' : 'Copy invite'}
          </button>
          <a
            href={invite.twitterUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="brutal-btn inline-flex items-center"
          >
            Post on X
          </a>
          <a
            href={TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="brutal-btn inline-flex items-center"
          >
            {TELEGRAM_CTA_LABEL}
          </a>
        </div>
      </section>
    );
  }

  // playState === 'ready'
  const disabled = !hasMoved || processing;

  return (
    <section
      className={`brutal-panel mt-4 p-4 transition-colors md:p-5 ${
        hasMoved ? 'surface-hero' : 'surface-shell'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-sm font-bold uppercase md:text-base">Confirm bid</h3>
          <p className="mt-1 max-w-xl font-mono text-xs leading-relaxed">
            {hasMoved
              ? 'Pick ETH or UBI below. First bid locks you to this color for the rest of the game.'
              : 'Drag a legal piece on the board first — then choose a bid tier to lock the move.'}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {hasMoved && !processing && (
            <button type="button" className="brutal-btn px-3 py-1.5 text-xs" onClick={onUndoMove}>
              Undo move
            </button>
          )}
          <span
            className={`border-3 border-ink px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wide shadow-brutal-sm ${
              hasMoved ? 'bg-card' : 'bg-card/80'
            }`}
          >
            {processing ? 'Processing…' : hasMoved ? 'Ready to lock' : 'Move required'}
          </span>
        </div>
      </div>

      <div
        className={`mt-4 flex flex-col gap-3 ${disabled && !processing ? 'opacity-70' : ''}`}
      >
        <BidAssetGroup title="Bid with ETH" icon="ethereum.svg">
          {ethTiers.map(({ key, multiplier, sublabel }) => {
            const wei = (BigInt(String(minBid || 0)) * BigInt(multiplier)).toString();
            return (
              <BidTierButton
                key={key}
                label={formatEthLabel(wei)}
                sublabel={sublabel}
                icon="ethereum.svg"
                disabled={disabled}
                onClick={() => onBidEther(wei)}
              />
            );
          })}
        </BidAssetGroup>

        <BidAssetGroup title="Bid with UBI" icon="logo.svg">
          {ubiTiers.map(({ key, multiplier, sublabel }) => {
            const amount = String(Number(minCoinBid) * multiplier);
            return (
              <BidTierButton
                key={key}
                label={formatUbiLabel(amount)}
                sublabel={sublabel}
                icon="logo.svg"
                disabled={disabled}
                onClick={() => onBidCoin(amount)}
              />
            );
          })}
        </BidAssetGroup>
      </div>
    </section>
  );
}
