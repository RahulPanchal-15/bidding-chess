import { assetUrl, canPlayerMove, formatCompactUbi, sideLabel } from '../utils/format';

function PoolRow({ label, ethAmount, ubiAmount, tone }) {
  const toneClasses =
    tone === 'dark'
      ? 'surface-walnut text-foam'
      : tone === 'signal'
        ? 'surface-hero'
        : 'surface-shell';

  return (
    <div className={`border-3 border-ink p-3 shadow-brutal-sm ${toneClasses}`}>
      <p className="font-mono text-[11px] font-semibold uppercase tracking-wide">{label}</p>
      <div className="mt-2 flex flex-wrap gap-3 font-mono text-sm font-bold">
        <span className="inline-flex items-center gap-1">
          {ethAmount}
          <img src={assetUrl('ethereum.svg')} alt="ETH" className="h-4 w-4" />
        </span>
        <span className="inline-flex items-center gap-1">
          {formatCompactUbi(ubiAmount)}
          <img src={assetUrl('logo.svg')} alt="UBI" className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}

export default function GameStatus({
  turn,
  playerSide,
  whitePool,
  blackPool,
  whiteCoins,
  blackCoins,
  playerBid,
  playerCoinBid,
  processing,
  connected,
}) {
  const isYourTurn = connected && canPlayerMove(turn, playerSide);

  let statusLabel = `${sideLabel(turn)} to move`;
  if (connected) {
    statusLabel = isYourTurn ? 'Your turn' : 'Wait for opponent';
  }

  return (
    <aside className="brutal-panel flex flex-col gap-3 p-4">
      <h3 className="font-display text-lg font-bold uppercase">Game status</h3>

      <div
        className={`border-3 border-ink px-3 py-2 font-mono text-sm font-bold uppercase shadow-brutal-sm ${
          isYourTurn ? 'surface-hero' : 'surface-shell'
        }`}
      >
        {statusLabel}
      </div>

      <p className="font-mono text-xs">
        Side to move: <strong>{sideLabel(turn)}</strong>
        {connected && playerSide !== '0' && (
          <>
            {' '}
            · You play: <strong>{sideLabel(playerSide)}</strong>
          </>
        )}
        {!connected && <> · Spectating</>}
      </p>

      <PoolRow label="White pool" ethAmount={whitePool} ubiAmount={whiteCoins} tone="light" />
      <PoolRow label="Black pool" ethAmount={blackPool} ubiAmount={blackCoins} tone="dark" />

      {connected && (
        <PoolRow
          label="Your contribution"
          ethAmount={playerBid}
          ubiAmount={playerCoinBid}
          tone="signal"
        />
      )}

      {processing && (
        <p className="border-3 border-ink bg-rose px-3 py-2 font-mono text-xs font-semibold uppercase text-foam shadow-brutal-sm">
          Processing transaction...
        </p>
      )}
    </aside>
  );
}
