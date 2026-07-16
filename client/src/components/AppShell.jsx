import { useEffect, useId, useRef, useState } from 'react';
import {
  CREATOR_NAME,
  CREATOR_TWITTER_HANDLE,
  CREATOR_TWITTER_URL,
  TELEGRAM_CTA_LABEL,
  TELEGRAM_URL,
} from '../content/gameCopy';
import { assetUrl, formatAddress, formatCompactUbi } from '../utils/format';
import MetaMaskButton from './MetaMaskButton';
import Toast from './Toast';

function ChevronIcon({ open }) {
  return (
    <svg
      viewBox="0 0 12 12"
      className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`}
      aria-hidden="true"
    >
      <path
        d="M2.5 4.5 L6 8 L9.5 4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="square"
      />
    </svg>
  );
}

function AccountChip({ account, onCopyAddress }) {
  if (!account) return null;

  return (
    <button
      type="button"
      className="surface-shell border-3 border-ink px-3 py-2 font-mono text-xs font-semibold text-ink shadow-brutal-sm hover:bg-card md:text-sm"
      title={account}
      aria-label={`Copy address ${account}`}
      onClick={() => onCopyAddress?.(account)}
    >
      {formatAddress(account)}
    </button>
  );
}

function UbiBalanceMenu({ ubiBalance, onWatchUbiToken, watchingToken }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const menuId = useId();
  const needsUbi = Number(ubiBalance) === 0;

  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div className="relative flex flex-wrap items-center gap-2" ref={rootRef}>
      <div className="flex overflow-hidden border-3 border-ink shadow-brutal-sm">
        <div className="surface-shell px-3 py-2 font-mono text-xs font-semibold text-ink md:text-sm">
          UBI: {formatCompactUbi(ubiBalance)}
        </div>
        {onWatchUbiToken && (
          <button
            type="button"
            className="surface-shell inline-flex items-center justify-center border-l-3 border-ink px-2.5 text-ink hover:bg-card"
            aria-haspopup="menu"
            aria-expanded={open}
            aria-controls={menuId}
            aria-label="Open UBI token menu"
            onClick={() => setOpen((value) => !value)}
          >
            <ChevronIcon open={open} />
          </button>
        )}
      </div>

      {needsUbi && (
        <a
          href={TELEGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="brutal-btn-accent inline-flex items-center px-3 py-2 font-mono text-xs font-semibold md:text-sm"
        >
          {TELEGRAM_CTA_LABEL}
        </a>
      )}

      {onWatchUbiToken && open && (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 top-full z-30 mt-1 min-w-[13rem] border-3 border-ink bg-card shadow-brutal"
        >
          <button
            type="button"
            role="menuitem"
            className="w-full px-3 py-2.5 text-left font-mono text-xs font-semibold text-ink hover:bg-shell disabled:opacity-60"
            disabled={watchingToken}
            onClick={async () => {
              await onWatchUbiToken();
              setOpen(false);
            }}
          >
            {watchingToken ? 'Adding…' : 'Track token in Wallet'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function AppShell({
  title,
  account,
  ubiBalance,
  connected,
  connecting,
  onConnect,
  isMetaMaskInstalled,
  onInstallMetamask,
  onWatchUbiToken,
  watchingToken = false,
  onCopyAddress,
  children,
  toast,
  onDismissToast,
}) {
  return (
    <div className="surface-field flex min-h-screen flex-col">
      <header className="brutal-bar px-4 py-3">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src={assetUrl('logo.svg')}
              alt=""
              className="hidden h-8 w-8 sm:block"
              aria-hidden="true"
            />
            <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-ink md:text-3xl">
              {title}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {connected ? (
              <>
                <AccountChip account={account} onCopyAddress={onCopyAddress} />
                <UbiBalanceMenu
                  ubiBalance={ubiBalance}
                  onWatchUbiToken={onWatchUbiToken}
                  watchingToken={watchingToken}
                />
              </>
            ) : isMetaMaskInstalled ? (
              <MetaMaskButton onClick={onConnect} disabled={connecting} iconClassName="h-4 w-4">
                {connecting ? 'Connecting...' : 'Connect wallet'}
              </MetaMaskButton>
            ) : (
              <MetaMaskButton onClick={onInstallMetamask} iconClassName="h-4 w-4">
                Install MetaMask
              </MetaMaskButton>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:py-10">{children}</main>

      <footer className="brutal-bar mt-auto border-t-3 border-ink px-4 py-4">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 font-mono text-xs md:text-sm">
          <p>
            Created by <span className="font-semibold">{CREATOR_NAME}</span>
          </p>
          <a
            href={CREATOR_TWITTER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-2 underline-offset-2 hover:opacity-80"
          >
            {CREATOR_TWITTER_HANDLE}
          </a>
        </div>
      </footer>

      <Toast toast={toast} onDismiss={onDismissToast} />
    </div>
  );
}
