import { useCallback, useEffect, useRef, useState } from 'react';
import { Contract } from 'ethers';
import ChessFactory from '../contracts/ChessFactory.json';
import ChessGame from '../contracts/ChessGame.json';
import Ubiquito from '../contracts/Ubiquito.json';
import { formatWalletError } from '../utils/walletErrors';
import { createReadContext } from '../web3/readProvider';

const POLL_INTERVAL_MS = 8000;

const asString = (value) => {
  if (value === undefined || value === null) return '0';
  if (typeof value === 'bigint') return value.toString();
  return String(value);
};

export function useChessGame({
  getWalletProvider,
  getUbi,
  account,
  rightNetwork,
  connected,
  setUbiBalance,
  showToast,
}) {
  const [gameLoaded, setGameLoaded] = useState(false);
  const [readError, setReadError] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const [fen, setFen] = useState('');
  const [turn, setTurn] = useState('1');
  const [result, setResult] = useState('0');
  const [playerSide, setPlayerSide] = useState('0');
  const [whitePool, setWhitePool] = useState('0');
  const [blackPool, setBlackPool] = useState('0');
  const [whiteCoins, setWhiteCoins] = useState('0');
  const [blackCoins, setBlackCoins] = useState('0');
  const [minBid, setMinBid] = useState('0');
  const [minCoinBid, setMinCoinBid] = useState('0');
  const [playerBid, setPlayerBid] = useState('0');
  const [playerCoinBid, setPlayerCoinBid] = useState('0');
  const [processing, setProcessing] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);

  const readProviderRef = useRef(null);
  const readNetworkIdRef = useRef(null);
  const currentGameAddressRef = useRef(null);
  const boardRef = useRef(null);
  const processingRef = useRef(false);

  useEffect(() => {
    processingRef.current = processing;
  }, [processing]);

  const applyPublicState = useCallback((payload) => {
    setIsActive(payload.isActive);
    if (!payload.isActive) {
      setFen('');
      return;
    }

    setFen(payload.fen);
    setTurn(asString(payload.turn));
    setResult(asString(payload.result));
    setWhitePool(asString(payload.whitePool));
    setBlackPool(asString(payload.blackPool));
    setWhiteCoins(asString(payload.whiteCoins));
    setBlackCoins(asString(payload.blackCoins));
    setMinBid(asString(payload.minBid));
    setMinCoinBid(asString(payload.minCoinBid));
  }, []);

  const applyPlayerState = useCallback((payload) => {
    setPlayerSide(asString(payload.playerSide ?? '0'));
    setPlayerBid(asString(payload.playerBid ?? '0'));
    setPlayerCoinBid(asString(payload.playerCoinBid ?? '0'));
  }, []);

  const clearPlayerState = useCallback(() => {
    setPlayerSide('0');
    setPlayerBid('0');
    setPlayerCoinBid('0');
  }, []);

  const fetchPublicGame = useCallback(
    async (provider, networkId) => {
      if (!provider || !ChessFactory.networks[networkId]) {
        setIsActive(false);
        return;
      }

      const factory = new Contract(
        ChessFactory.networks[networkId].address,
        ChessFactory.abi,
        provider
      );

      const gameExists = await factory.isActive();
      if (!gameExists) {
        currentGameAddressRef.current = null;
        applyPublicState({ isActive: false });
        return;
      }

      const gameAddress = await factory.getLatestGame();
      currentGameAddressRef.current = gameAddress;

      const chessGame = new Contract(gameAddress, ChessGame.abi, provider);

      const [
        currentFen,
        currentTurn,
        minBID,
        minCoinBID,
        whitePOOL,
        whiteCOINS,
        blackPOOL,
        blackCOINS,
        currentResult,
      ] = await Promise.all([
        chessGame.FEN(),
        chessGame.turn(),
        chessGame.MIN_BID(),
        chessGame.MIN_COIN_BID(),
        chessGame.getPool(1),
        chessGame.getCoins(1),
        chessGame.getPool(2),
        chessGame.getCoins(2),
        chessGame.GAME_RESULT(),
      ]);

      applyPublicState({
        isActive: true,
        fen: currentFen,
        turn: currentTurn,
        result: currentResult,
        whitePool: whitePOOL,
        blackPool: blackPOOL,
        whiteCoins: whiteCOINS,
        blackCoins: blackCOINS,
        minBid: minBID,
        minCoinBid: minCoinBID,
      });
    },
    [applyPublicState]
  );

  const fetchPlayerData = useCallback(
    async (provider, networkId, activeAccount) => {
      if (!provider || !activeAccount || !ChessFactory.networks[networkId]) {
        clearPlayerState();
        return;
      }

      const gameAddress = currentGameAddressRef.current;
      if (!gameAddress) {
        clearPlayerState();
        return;
      }

      const chessGame = new Contract(gameAddress, ChessGame.abi, provider);
      const ubiAddress = Ubiquito.networks[networkId]?.address;
      const ubi = ubiAddress
        ? new Contract(ubiAddress, Ubiquito.abi, provider)
        : null;

      const [bids, playerS] = await Promise.all([
        chessGame.getPlayerBids(activeAccount),
        chessGame.getPlayerSide(activeAccount),
      ]);

      if (ubi && setUbiBalance) {
        const balance = await ubi.balanceOf(activeAccount);
        setUbiBalance(balance.toString());
      }

      applyPlayerState({
        playerSide: playerS,
        playerBid: bids[0],
        playerCoinBid: bids[1],
      });
    },
    [applyPlayerState, clearPlayerState, setUbiBalance]
  );

  const refreshAll = useCallback(async () => {
    const readProvider = readProviderRef.current;
    const readNetworkId = readNetworkIdRef.current;
    if (!readProvider || !readNetworkId) return;

    await fetchPublicGame(readProvider, readNetworkId);

    if (connected && rightNetwork && account) {
      const walletProvider = getWalletProvider?.() || readProvider;
      const { chainId } = await walletProvider.getNetwork();
      const walletNetworkId = Number(chainId);
      await fetchPlayerData(walletProvider, walletNetworkId, account);
    } else {
      clearPlayerState();
      setUbiBalance?.('0');
    }
  }, [
    account,
    clearPlayerState,
    connected,
    fetchPlayerData,
    fetchPublicGame,
    getWalletProvider,
    rightNetwork,
    setUbiBalance,
  ]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const ctx = await createReadContext();
        if (cancelled) return;

        if (!ctx) {
          setReadError(
            'Could not reach the game chain. Connect a wallet on Sepolia, or check your network connection.'
          );
          setGameLoaded(true);
          return;
        }

        readProviderRef.current = ctx.provider;
        readNetworkIdRef.current = ctx.networkId;
        setReadError(null);
        await fetchPublicGame(ctx.provider, ctx.networkId);
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          setReadError(error?.message || 'Failed to load game state.');
        }
      } finally {
        if (!cancelled) setGameLoaded(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fetchPublicGame]);

  // Once the wallet is on a deployed network, prefer it for reads too.
  useEffect(() => {
    if (!connected || !rightNetwork) return;

    const walletProvider = getWalletProvider?.();
    if (!walletProvider) return;

    (async () => {
      try {
        const { chainId } = await walletProvider.getNetwork();
        const networkId = Number(chainId);
        if (!ChessFactory.networks[networkId]) return;
        readProviderRef.current = walletProvider;
        readNetworkIdRef.current = networkId;
        setReadError(null);
        await fetchPublicGame(walletProvider, networkId);
        if (account) {
          await fetchPlayerData(walletProvider, networkId, account);
        }
      } catch (error) {
        console.error(error);
      }
    })();
  }, [account, connected, fetchPlayerData, fetchPublicGame, getWalletProvider, rightNetwork]);

  useEffect(() => {
    if (!gameLoaded || !readProviderRef.current) return undefined;

    refreshAll().catch(console.error);

    const poll = async () => {
      if (processingRef.current || document.hidden) return;
      await refreshAll();
    };

    const intervalId = window.setInterval(poll, POLL_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, [account, connected, gameLoaded, refreshAll, rightNetwork]);

  const handleBoardChange = useCallback((moveStatus) => {
    setHasMoved(moveStatus);
  }, []);

  const resetMoveState = useCallback(() => {
    setHasMoved(false);
    boardRef.current?.resetMoveInput?.();
  }, []);

  const undoPendingMove = useCallback(() => {
    if (processing) return;
    resetMoveState();
  }, [processing, resetMoveState]);

  const getWriteContext = useCallback(async () => {
    const walletProvider = getWalletProvider?.();
    if (!walletProvider || !account) return null;

    const gameAddress = currentGameAddressRef.current;
    if (!gameAddress) return null;

    const signer = await walletProvider.getSigner();
    const chessGame = new Contract(gameAddress, ChessGame.abi, signer);
    return { provider: walletProvider, signer, chessGame, gameAddress };
  }, [account, getWalletProvider]);

  const submitBidEther = useCallback(
    async (bid) => {
      const boardState = boardRef.current?.getMoveState?.();
      if (!boardState?.hasMoved) {
        showToast({ type: 'error', message: 'Make a move before placing a bid.' });
        return;
      }

      const write = await getWriteContext();
      if (!write) {
        showToast({ type: 'error', message: 'Connect your wallet to play.' });
        return;
      }

      const balance = await write.provider.getBalance(account);
      if (BigInt(String(bid)) >= balance) {
        showToast({ type: 'error', message: 'Insufficient ETH balance.' });
        return;
      }

      setProcessing(true);
      showToast({ type: 'pending', message: 'Confirm the transaction in MetaMask.' });

      try {
        const tx = await write.chessGame.performMove(
          boardState.result,
          turn,
          0,
          boardState.move,
          boardState.finalFen,
          { value: bid }
        );
        await tx.wait();

        showToast({
          type: 'success',
          message: 'Move locked. Share the invite below — or post it on X.',
        });
        resetMoveState();
        await refreshAll();
      } catch (err) {
        showToast({
          type: 'error',
          message: formatWalletError(err),
        });
      } finally {
        setProcessing(false);
      }
    },
    [account, getWriteContext, refreshAll, resetMoveState, showToast, turn]
  );

  const submitBidCoin = useCallback(
    async (bid) => {
      const boardState = boardRef.current?.getMoveState?.();
      if (!boardState?.hasMoved) {
        showToast({ type: 'error', message: 'Make a move before placing a bid.' });
        return;
      }

      const write = await getWriteContext();
      const ubiRead = getUbi?.();
      if (!write || !ubiRead) {
        showToast({ type: 'error', message: 'Connect your wallet to play.' });
        return;
      }

      const balance = await ubiRead.balanceOf(account);
      if (BigInt(String(bid)) > BigInt(balance.toString())) {
        showToast({
          type: 'error',
          message: 'Insufficient UBI. Get UBI from the header, or bid with ETH.',
        });
        return;
      }

      setProcessing(true);
      showToast({ type: 'pending', message: 'Approve UBI, then confirm the move in MetaMask.' });

      try {
        const ubi = ubiRead.connect(write.signer);
        const approveTx = await ubi.approve(write.gameAddress, bid);
        await approveTx.wait();

        const moveTx = await write.chessGame.performMove(
          boardState.result,
          turn,
          bid,
          boardState.move,
          boardState.finalFen
        );
        await moveTx.wait();

        showToast({
          type: 'success',
          message: 'Move locked. Share the invite below — or post it on X.',
        });
        resetMoveState();
        await refreshAll();
      } catch (err) {
        showToast({
          type: 'error',
          message: formatWalletError(err),
        });
      } finally {
        setProcessing(false);
      }
    },
    [account, getUbi, getWriteContext, refreshAll, resetMoveState, showToast, turn]
  );

  return {
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
    refreshAll,
    handleBoardChange,
    undoPendingMove,
    submitBidEther,
    submitBidCoin,
  };
}
