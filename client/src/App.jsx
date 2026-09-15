import { useCallback, useEffect, useMemo, useState } from 'react';
import AppShell from './components/AppShell';
import ChainErrorModal from './components/ChainErrorModal';
import ChessLoader from './components/ChessLoader';
import HomePage from './components/HomePage';
import { useChessGame } from './hooks/useChessGame';
import { useToast } from './hooks/useToast';
import { useWallet } from './hooks/useWallet';
import { canPlayerMove, formatEth } from './utils/format';
import { copyInvite } from './utils/share';

export default function App() {
  const { toast, showToast, dismissToast } = useToast();
  const [chainErrorOpen, setChainErrorOpen] = useState(false);

  const wallet = useWallet();

  const {
    loaded: walletLoaded,
    isMetaMaskInstalled,
    connected,
    rightNetwork,
    account,
    ubiBalance,
    connect,
    connecting,
    switchingNetwork,
    watchingToken,
    switchToSepolia,
    watchUbiToken,
    installMetamask,
    getProvider,
    getUbi,
    setUbiBalance,
  } = wallet;

  const game = useChessGame({
    getWalletProvider: getProvider,
    getUbi,
    account,
    rightNetwork,
    connected,
    setUbiBalance,
    showToast,
  });

  const {
    gameLoaded,
    readError,
    isActive,
    fen,
    turn,
    result,
    playerSide,
    whitePool,
    blackPool,
    whiteCoins,
    blackCoins,
    minBid,
    minCoinBid,
    playerBid,
    playerCoinBid,
    processing,
    hasMoved,
    boardRef,
    handleBoardChange,
    undoPendingMove,
    submitBidEther,
    submitBidCoin,
  } = game;

  useEffect(() => {
    if (readError) {
      setChainErrorOpen(true);
    } else {
      setChainErrorOpen(false);
    }
  }, [readError]);

  const playState = useMemo(() => {
    if (!isMetaMaskInstalled) return 'needMetamask';
    if (!connected) return 'needWallet';
    if (!rightNetwork) return 'wrongNetwork';
    if (!canPlayerMove(turn, playerSide)) return 'waiting';
    return 'ready';
  }, [connected, isMetaMaskInstalled, playerSide, rightNetwork, turn]);

  const canInteract = playState === 'ready';
  const appReady = walletLoaded && gameLoaded;

  const [copyingInvite, setCopyingInvite] = useState(false);

  const handleCopyInvite = useCallback(async () => {
    setCopyingInvite(true);
    try {
      const result = await copyInvite(turn);
      if (result.ok) {
        showToast({ type: 'success', message: 'Invite copied — send it to the other side.' });
      } else {
        showToast({ type: 'error', message: 'Could not copy invite. Copy the page URL instead.' });
      }
    } finally {
      setCopyingInvite(false);
    }
  }, [showToast, turn]);

  const handleCopyAddress = useCallback(
    async (address) => {
      try {
        await navigator.clipboard.writeText(address);
        showToast({ type: 'success', message: 'Address copied.' });
      } catch {
        showToast({ type: 'error', message: 'Could not copy address.' });
      }
    },
    [showToast]
  );

  if (!appReady) {
    return (
      <div className="surface-field flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <ChessLoader size={80} />
        <p className="max-w-xs text-center font-mono text-sm text-ink/70">
          Hold your horses — checking where the game stands.
        </p>
      </div>
    );
  }

  return (
    <AppShell
      title="Bidding Chess"
      account={account}
      ubiBalance={ubiBalance}
      connected={connected && rightNetwork}
      connecting={connecting}
      onConnect={connect}
      isMetaMaskInstalled={isMetaMaskInstalled}
      onInstallMetamask={installMetamask}
      onWatchUbiToken={watchUbiToken}
      watchingToken={watchingToken}
      onCopyAddress={handleCopyAddress}
      toast={toast}
      onDismissToast={dismissToast}
    >
      <ChainErrorModal
        open={Boolean(readError) && chainErrorOpen}
        message={readError}
        isMetaMaskInstalled={isMetaMaskInstalled}
        connected={connected}
        rightNetwork={rightNetwork}
        connecting={connecting}
        switchingNetwork={switchingNetwork}
        onConnect={connect}
        onSwitchNetwork={switchToSepolia}
        onInstallMetamask={installMetamask}
        onClose={() => setChainErrorOpen(false)}
      />

      <HomePage
        gameReady={gameLoaded}
        isActive={isActive}
        fen={fen}
        turn={turn}
        result={result}
        playerSide={playerSide}
        whitePool={formatEth(whitePool)}
        blackPool={formatEth(blackPool)}
        whiteCoins={whiteCoins}
        blackCoins={blackCoins}
        playerBid={formatEth(playerBid)}
        playerCoinBid={playerCoinBid}
        minBid={minBid}
        minCoinBid={minCoinBid}
        processing={processing}
        hasMoved={hasMoved}
        playState={playState}
        canInteract={canInteract}
        connected={connected && rightNetwork}
        boardRef={boardRef}
        onBoardChange={handleBoardChange}
        onUndoMove={undoPendingMove}
        onBidEther={submitBidEther}
        onBidCoin={submitBidCoin}
        onConnect={connect}
        connecting={connecting}
        onSwitchNetwork={switchToSepolia}
        switchingNetwork={switchingNetwork}
        onInstallMetamask={installMetamask}
        isMetaMaskInstalled={isMetaMaskInstalled}
        readError={readError}
        onShowChainError={() => setChainErrorOpen(true)}
        onCopyInvite={handleCopyInvite}
        copyingInvite={copyingInvite}
      />
    </AppShell>
  );
}
