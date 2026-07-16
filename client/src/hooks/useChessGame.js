import { useCallback, useEffect, useRef, useState } from 'react';
import BN from 'bn.js';
import ChessFactory from '../contracts/ChessFactory.json';
import ChessGame from '../contracts/ChessGame.json';
import Ubiquito from '../contracts/Ubiquito.json';
import { formatWalletError } from '../utils/walletErrors';
import { createReadContext } from '../web3/readProvider';

const POLL_INTERVAL_MS = 8000;

export function useChessGame({
  getWalletWeb3,
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

  const readWeb3Ref = useRef(null);
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
    setTurn(String(payload.turn));
    setResult(String(payload.result));
    setWhitePool(payload.whitePool);
    setBlackPool(payload.blackPool);
    setWhiteCoins(payload.whiteCoins);
    setBlackCoins(payload.blackCoins);
    setMinBid(payload.minBid);
    setMinCoinBid(payload.minCoinBid);
  }, []);

  const applyPlayerState = useCallback((payload) => {
    setPlayerSide(String(payload.playerSide ?? '0'));
    setPlayerBid(payload.playerBid ?? '0');
    setPlayerCoinBid(payload.playerCoinBid ?? '0');
  }, []);

  const clearPlayerState = useCallback(() => {
    setPlayerSide('0');
    setPlayerBid('0');
    setPlayerCoinBid('0');
  }, []);

  const fetchPublicGame = useCallback(
    async (web3, networkId) => {
      if (!web3 || !ChessFactory.networks[networkId]) {
        setIsActive(false);
        return;
      }

      const factory = new web3.eth.Contract(
        ChessFactory.abi,
        ChessFactory.networks[networkId].address
      );

      const gameExists = await factory.methods.isActive().call();
      if (!gameExists) {
        currentGameAddressRef.current = null;
        applyPublicState({ isActive: false });
        return;
      }

      const gameAddress = await factory.methods.getLatestGame().call();
      currentGameAddressRef.current = gameAddress;

      const chessGame = new web3.eth.Contract(ChessGame.abi, gameAddress);

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
        chessGame.methods.FEN().call(),
        chessGame.methods.turn().call(),
        chessGame.methods.MIN_BID().call(),
        chessGame.methods.MIN_COIN_BID().call(),
        chessGame.methods.getPool(1).call(),
        chessGame.methods.getCoins(1).call(),
        chessGame.methods.getPool(2).call(),
        chessGame.methods.getCoins(2).call(),
        chessGame.methods.GAME_RESULT().call(),
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
    async (web3, networkId, activeAccount) => {
      if (!web3 || !activeAccount || !ChessFactory.networks[networkId]) {
        clearPlayerState();
        return;
      }

      const gameAddress = currentGameAddressRef.current;
      if (!gameAddress) {
        clearPlayerState();
        return;
      }

      const chessGame = new web3.eth.Contract(ChessGame.abi, gameAddress);
      const ubiAddress = Ubiquito.networks[networkId]?.address;
      const ubi = ubiAddress
        ? new web3.eth.Contract(Ubiquito.abi, ubiAddress)
        : null;

      const [bids, playerS] = await Promise.all([
        chessGame.methods.getPlayerBids(activeAccount).call(),
        chessGame.methods.getPlayerSide(activeAccount).call(),
      ]);

      if (ubi && setUbiBalance) {
        const balance = await ubi.methods.balanceOf(activeAccount).call();
        setUbiBalance(balance);
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
    const readWeb3 = readWeb3Ref.current;
    const readNetworkId = readNetworkIdRef.current;
    if (!readWeb3 || !readNetworkId) return;

    await fetchPublicGame(readWeb3, readNetworkId);

    if (connected && rightNetwork && account) {
      const walletWeb3 = getWalletWeb3?.() || readWeb3;
      const walletNetworkId = await walletWeb3.eth.net.getId();
      await fetchPlayerData(walletWeb3, walletNetworkId, account);
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
    getWalletWeb3,
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

        readWeb3Ref.current = ctx.web3;
        readNetworkIdRef.current = ctx.networkId;
        setReadError(null);
        await fetchPublicGame(ctx.web3, ctx.networkId);
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

    const walletWeb3 = getWalletWeb3?.();
    if (!walletWeb3) return;

    (async () => {
      try {
        const networkId = await walletWeb3.eth.net.getId();
        if (!ChessFactory.networks[networkId]) return;
        readWeb3Ref.current = walletWeb3;
        readNetworkIdRef.current = networkId;
        setReadError(null);
        await fetchPublicGame(walletWeb3, networkId);
        if (account) {
          await fetchPlayerData(walletWeb3, networkId, account);
        }
      } catch (error) {
        console.error(error);
      }
    })();
  }, [account, connected, fetchPlayerData, fetchPublicGame, getWalletWeb3, rightNetwork]);

  useEffect(() => {
    if (!gameLoaded || !readWeb3Ref.current) return undefined;

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

  const getWriteContext = useCallback(() => {
    const walletWeb3 = getWalletWeb3?.();
    if (!walletWeb3 || !account) return null;

    const gameAddress = currentGameAddressRef.current;
    if (!gameAddress) return null;

    const chessGame = new walletWeb3.eth.Contract(ChessGame.abi, gameAddress);
    return { web3: walletWeb3, chessGame, gameAddress };
  }, [account, getWalletWeb3]);

  const submitBidEther = useCallback(
    async (bid) => {
      const boardState = boardRef.current?.getMoveState?.();
      if (!boardState?.hasMoved) {
        showToast({ type: 'error', message: 'Make a move before placing a bid.' });
        return;
      }

      const write = getWriteContext();
      if (!write) {
        showToast({ type: 'error', message: 'Connect your wallet to play.' });
        return;
      }

      const balance = await write.web3.eth.getBalance(account);
      if (new BN(String(bid)).cmp(new BN(String(balance))) >= 0) {
        showToast({ type: 'error', message: 'Insufficient ETH balance.' });
        return;
      }

      setProcessing(true);
      showToast({ type: 'pending', message: 'Confirm the transaction in MetaMask.' });

      try {
        await write.chessGame.methods
          .performMove(boardState.result, turn, 0, boardState.move, boardState.finalFen)
          .send({ value: bid, from: account });

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

      const write = getWriteContext();
      const ubi = getUbi?.();
      if (!write || !ubi) {
        showToast({ type: 'error', message: 'Connect your wallet to play.' });
        return;
      }

      const balance = await ubi.methods.balanceOf(account).call();
      if (parseInt(bid, 10) > parseInt(balance, 10)) {
        showToast({
          type: 'error',
          message: 'Insufficient UBI. Get UBI from the header, or bid with ETH.',
        });
        return;
      }

      setProcessing(true);
      showToast({ type: 'pending', message: 'Approve UBI, then confirm the move in MetaMask.' });

      try {
        await ubi.methods.approve(write.gameAddress, bid).send({ from: account });

        await write.chessGame.methods
          .performMove(boardState.result, turn, bid, boardState.move, boardState.finalFen)
          .send({ from: account });

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
