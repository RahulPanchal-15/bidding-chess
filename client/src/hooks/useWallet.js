import { useCallback, useEffect, useRef, useState } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import MetaMaskOnboarding from '@metamask/onboarding';
import Ubiquito from '../contracts/Ubiquito.json';
import { isSupportedPlayNetwork, SEPOLIA, UBI_TOKEN } from '../web3/networks';

export function useWallet() {
  const [loaded, setLoaded] = useState(false);
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false);
  const [connected, setConnected] = useState(false);
  const [rightNetwork, setRightNetwork] = useState(false);
  const [account, setAccount] = useState(null);
  const [ubiBalance, setUbiBalance] = useState('0');
  const [connecting, setConnecting] = useState(false);
  const [switchingNetwork, setSwitchingNetwork] = useState(false);
  const [watchingToken, setWatchingToken] = useState(false);

  const providerRef = useRef(null);
  const ubiRef = useRef(null);
  const networkIdRef = useRef(null);

  const getProvider = useCallback(() => providerRef.current, []);

  const applyDisconnected = useCallback(() => {
    providerRef.current = null;
    ubiRef.current = null;
    networkIdRef.current = null;
    setAccount(null);
    setUbiBalance('0');
    setConnected(false);
    setRightNetwork(false);
  }, []);

  const syncFromAccounts = useCallback(
    async (accounts) => {
      const { ethereum } = window;
      if (!ethereum?.isMetaMask) {
        setIsMetaMaskInstalled(false);
        applyDisconnected();
        return;
      }

      setIsMetaMaskInstalled(true);

      if (!accounts?.length) {
        applyDisconnected();
        return;
      }

      const provider = new BrowserProvider(window.ethereum);
      providerRef.current = provider;

      const network = await provider.getNetwork();
      const networkId = Number(network.chainId);
      networkIdRef.current = networkId;
      setAccount(accounts[0]);

      if (!isSupportedPlayNetwork(networkId, Ubiquito.networks)) {
        ubiRef.current = null;
        setUbiBalance('0');
        setConnected(true);
        setRightNetwork(false);
        return;
      }

      const ubi = new Contract(
        Ubiquito.networks[networkId].address,
        Ubiquito.abi,
        provider
      );
      ubiRef.current = ubi;

      const balance = await ubi.balanceOf(accounts[0]);
      setUbiBalance(balance.toString());
      setConnected(true);
      setRightNetwork(true);
    },
    [applyDisconnected]
  );

  /** Silent hydrate — never opens MetaMask. */
  const hydrate = useCallback(async () => {
    const { ethereum } = window;
    if (!ethereum?.isMetaMask) {
      setIsMetaMaskInstalled(false);
      applyDisconnected();
      setLoaded(true);
      return;
    }

    try {
      const accounts = await ethereum.request({ method: 'eth_accounts' });
      await syncFromAccounts(accounts);
    } catch (error) {
      console.error(error);
      applyDisconnected();
      setIsMetaMaskInstalled(Boolean(window.ethereum?.isMetaMask));
    } finally {
      setLoaded(true);
    }
  }, [applyDisconnected, syncFromAccounts]);

  /** Explicit user action — may open MetaMask. */
  const connect = useCallback(async () => {
    const { ethereum } = window;
    if (!ethereum?.isMetaMask) {
      setIsMetaMaskInstalled(false);
      setLoaded(true);
      return;
    }

    setConnecting(true);
    try {
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      await syncFromAccounts(accounts);
    } catch (error) {
      console.error(error);
      // Keep UI on connect gate if user rejected the prompt.
      if (!account) {
        applyDisconnected();
      }
    } finally {
      setConnecting(false);
      setLoaded(true);
    }
  }, [account, applyDisconnected, syncFromAccounts]);

  /**
   * Prompt MetaMask to switch to Sepolia (EIP-3326).
   * If the chain is missing (4902), add it first (EIP-3085).
   */
  const switchToSepolia = useCallback(async () => {
    const { ethereum } = window;
    if (!ethereum?.isMetaMask) {
      setIsMetaMaskInstalled(false);
      return;
    }

    setSwitchingNetwork(true);
    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA.chainIdHex }],
      });
    } catch (error) {
      // 4902 = chain not added yet in MetaMask
      if (error?.code === 4902) {
        try {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: SEPOLIA.chainIdHex,
                chainName: SEPOLIA.chainName,
                nativeCurrency: SEPOLIA.nativeCurrency,
                rpcUrls: SEPOLIA.rpcUrls,
                blockExplorerUrls: SEPOLIA.blockExplorerUrls,
              },
            ],
          });
        } catch (addError) {
          console.error(addError);
        }
      } else if (error?.code !== 4001) {
        // 4001 = user rejected; ignore quietly
        console.error(error);
      }
    } finally {
      setSwitchingNetwork(false);
    }
  }, []);

  /**
   * Prompt MetaMask to track UBI (EIP-747 wallet_watchAsset).
   * Uses the Ubiquito address for the wallet's current network.
   */
  const watchUbiToken = useCallback(async () => {
    const { ethereum } = window;
    if (!ethereum?.isMetaMask) {
      setIsMetaMaskInstalled(false);
      return false;
    }

    const networkId = networkIdRef.current;
    const address =
      Ubiquito.networks[networkId]?.address ??
      Ubiquito.networks[String(networkId)]?.address;
    if (!address || !isSupportedPlayNetwork(networkId, Ubiquito.networks)) {
      console.warn('Cannot watch UBI: no token address for current network', networkId);
      return false;
    }

    setWatchingToken(true);
    try {
      const wasAdded = await ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address,
            symbol: UBI_TOKEN.symbol,
            decimals: UBI_TOKEN.decimals,
          },
        },
      });
      return Boolean(wasAdded);
    } catch (error) {
      if (error?.code !== 4001) {
        console.error(error);
      }
      return false;
    } finally {
      setWatchingToken(false);
    }
  }, []);

  const installMetamask = useCallback(() => {
    const onboarding = new MetaMaskOnboarding(MetaMaskOnboarding.FORWARDER_MODE.OPEN_TAB);
    onboarding.startOnboarding();
  }, []);

  useEffect(() => {
    hydrate();

    const { ethereum } = window;
    if (!ethereum?.isMetaMask) return undefined;

    const handleAccountsChanged = (accounts) => {
      syncFromAccounts(accounts).catch(console.error);
    };

    const handleChainChanged = () => {
      // Silent re-sync; do not re-prompt.
      hydrate();
    };

    ethereum.on('accountsChanged', handleAccountsChanged);
    ethereum.on('chainChanged', handleChainChanged);

    return () => {
      ethereum.removeListener('accountsChanged', handleAccountsChanged);
      ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [hydrate, syncFromAccounts]);

  return {
    loaded,
    connecting,
    switchingNetwork,
    watchingToken,
    isMetaMaskInstalled,
    connected,
    rightNetwork,
    account,
    ubiBalance,
    connect,
    switchToSepolia,
    watchUbiToken,
    installMetamask,
    getProvider,
    getUbi: () => ubiRef.current,
    getNetworkId: () => networkIdRef.current,
    setUbiBalance,
  };
}
