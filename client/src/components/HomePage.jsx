import { useState } from 'react';
import { assetUrl } from '../utils/format';
import {
  FAQ_ASIDE_BLURB,
  FAQ_ITEMS,
  GAME_PITCH,
  HOW_TO_PLAY,
  TELEGRAM_CTA_LABEL,
  TELEGRAM_URL,
  buildLiveHeadline,
  buildLiveSubcopy,
} from '../content/gameCopy';
import BidBar from './BidBar';
import GameStage from './GameStage';
import GameStatus from './GameStatus';
import MetaMaskButton from './MetaMaskButton';

function MiniBoard() {
  const squares = Array.from({ length: 64 }, (_, i) => {
    const row = Math.floor(i / 8);
    const col = i % 8;
    const dark = (row + col) % 2 === 1;
    return { i, dark };
  });

  const pieceMap = {
    0: 'br.svg',
    1: 'bn.svg',
    2: 'bb.svg',
    3: 'bq.svg',
    4: 'bk.svg',
    5: 'bb.svg',
    6: 'bn.svg',
    7: 'br.svg',
    56: 'wr.svg',
    57: 'wn.svg',
    58: 'wb.svg',
    59: 'wq.svg',
    60: 'wk.svg',
    61: 'wb.svg',
    62: 'wn.svg',
    63: 'wr.svg',
  };

  return (
    <div className="mx-auto aspect-square w-full max-w-[min(72vw,420px)] overflow-hidden border-3 border-ink shadow-brutal">
      <div className="grid h-full w-full grid-cols-8 grid-rows-8">
        {squares.map(({ i, dark }) => (
          <div
            key={i}
            className={`relative flex items-center justify-center ${
              dark ? 'surface-walnut' : 'surface-buff'
            }`}
          >
            {pieceMap[i] && (
              <img
                src={assetUrl(pieceMap[i])}
                alt=""
                className="h-[70%] w-[70%] object-contain"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function FaqAccordion() {
  const [openItem, setOpenItem] = useState('network');

  return (
    <div className="space-y-2">
      {FAQ_ITEMS.map((item) => {
        const expanded = openItem === item.id;
        return (
          <div key={item.id} className="border-3 border-ink bg-card shadow-brutal-sm">
            <button
              type="button"
              className="flex w-full items-center justify-between surface-shell px-3 py-2 text-left font-mono text-sm font-semibold"
              onClick={() => setOpenItem(expanded ? null : item.id)}
              aria-expanded={expanded}
            >
              {item.question}
              <span aria-hidden="true">{expanded ? '−' : '+'}</span>
            </button>
            {expanded && (
              <div className="surface-card border-t-3 border-ink px-3 py-2 font-mono text-sm">
                {item.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function HomePage({
  gameReady,
  isActive,
  fen,
  turn,
  result,
  playerSide,
  whitePool,
  blackPool,
  whiteCoins,
  blackCoins,
  playerBid,
  playerCoinBid,
  minBid,
  minCoinBid,
  processing,
  hasMoved,
  playState,
  canInteract,
  connected,
  boardRef,
  onBoardChange,
  onUndoMove,
  onBidEther,
  onBidCoin,
  onConnect,
  connecting,
  onSwitchNetwork,
  switchingNetwork = false,
  onInstallMetamask,
  isMetaMaskInstalled,
  readError,
  onShowChainError,
  onCopyInvite,
  copyingInvite = false,
}) {
  const showLiveGame = Boolean(gameReady && isActive && fen);

  return (
    <div className="relative">
      <div className="chequered-bg pointer-events-none absolute inset-0 -z-10 min-h-full" aria-hidden="true" />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <section className="brutal-panel p-4 md:p-6">
            <p className="font-mono text-xs font-semibold uppercase tracking-widest text-ink/70">
              Shared on-chain chess
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold uppercase leading-tight md:text-4xl">
              {showLiveGame ? buildLiveHeadline(turn) : 'Move. Bid. Win the pool.'}
            </h2>
            <p className="mt-3 max-w-xl font-mono text-sm leading-relaxed md:text-base">
              {showLiveGame
                ? buildLiveSubcopy({ connected, turn, playerSide })
                : GAME_PITCH}
            </p>

            <div className="mt-6">
              {showLiveGame ? (
                <GameStage
                  boardRef={boardRef}
                  fen={fen}
                  turn={turn}
                  result={result}
                  onBoardChange={onBoardChange}
                  interactive={canInteract}
                />
              ) : (
                <MiniBoard />
              )}
            </div>

            {showLiveGame && (
              <BidBar
                playState={playState}
                hasMoved={hasMoved}
                processing={processing}
                minBid={minBid}
                minCoinBid={minCoinBid}
                turn={turn}
                onBidEther={onBidEther}
                onBidCoin={onBidCoin}
                onConnect={onConnect}
                connecting={connecting}
                onInstallMetamask={onInstallMetamask}
                onSwitchNetwork={onSwitchNetwork}
                switchingNetwork={switchingNetwork}
                onUndoMove={onUndoMove}
                onCopyInvite={onCopyInvite}
                copyingInvite={copyingInvite}
              />
            )}

            {!showLiveGame && (
              <div className="mt-6 flex flex-wrap gap-3">
                {!isMetaMaskInstalled ? (
                  <MetaMaskButton onClick={onInstallMetamask}>Install MetaMask</MetaMaskButton>
                ) : playState === 'wrongNetwork' ? (
                  <MetaMaskButton onClick={onSwitchNetwork} disabled={switchingNetwork}>
                    {switchingNetwork ? 'Switching...' : 'Switch to Sepolia'}
                  </MetaMaskButton>
                ) : !connected ? (
                  <MetaMaskButton onClick={onConnect} disabled={connecting}>
                    {connecting ? 'Connecting...' : 'Connect wallet'}
                  </MetaMaskButton>
                ) : readError ? (
                  <button type="button" className="brutal-btn-accent" onClick={onShowChainError}>
                    Fix chain connection
                  </button>
                ) : (
                  <button type="button" className="brutal-btn" disabled>
                    Waiting for an active game
                  </button>
                )}
                <a
                  href={TELEGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="brutal-btn inline-flex items-center"
                >
                  {TELEGRAM_CTA_LABEL}
                </a>
              </div>
            )}
          </section>

          <section className="brutal-panel mt-4 p-4 md:p-6">
            <h3 className="font-display text-lg font-bold uppercase">How to play</h3>
            <ol className="mt-4 grid gap-3 sm:grid-cols-2">
              {HOW_TO_PLAY.map((step, index) => (
                <li
                  key={step.title}
                  className="surface-shell border-3 border-ink p-3 shadow-brutal-sm"
                >
                  <p className="font-mono text-[11px] font-semibold uppercase text-ink/70">
                    Step {index + 1}
                  </p>
                  <div className="mt-1 flex items-start gap-2">
                    <img
                      src={assetUrl(['wk.svg', 'wq.svg', 'wn.svg', 'wr.svg'][index])}
                      alt=""
                      className="mt-0.5 h-7 w-7 shrink-0"
                    />
                    <div>
                      <p className="font-display text-base font-bold">{step.title}</p>
                      <p className="mt-1 font-mono text-xs leading-relaxed">{step.detail}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <div className="flex flex-col gap-6">
          {showLiveGame ? (
            <GameStatus
              turn={turn}
              playerSide={playerSide}
              whitePool={whitePool}
              blackPool={blackPool}
              whiteCoins={whiteCoins}
              blackCoins={blackCoins}
              playerBid={playerBid}
              playerCoinBid={playerCoinBid}
              processing={processing}
              connected={connected}
            />
          ) : null}

          <aside className="surface-lilac flex flex-col gap-4 border-3 border-ink p-4 shadow-brutal md:p-5">
            <div className="surface-hero flex items-center gap-2 border-3 border-ink px-3 py-2 shadow-brutal-sm">
              <img src={assetUrl('bk.svg')} alt="" className="h-8 w-8" />
              <h3 className="font-display text-lg font-bold uppercase text-ink">FAQ</h3>
            </div>

            <p className="font-mono text-xs leading-relaxed">{FAQ_ASIDE_BLURB}</p>

            <FaqAccordion />

            <div className="surface-shell mt-auto border-3 border-ink px-3 py-3 shadow-brutal-sm">
              <p className="font-mono text-[11px] font-semibold uppercase text-ink/70">Rewards</p>
              <p className="mt-1 font-mono text-xs leading-relaxed">
                Win and reclaim your ETH plus a cut of the loser pool — paid in ETH and UBIQUITO.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
