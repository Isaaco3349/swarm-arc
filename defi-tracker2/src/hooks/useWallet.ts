"use client";

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";

export type WalletStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error"
  | "no-provider";

export interface ChainBalance {
  chainKey: string;
  chainId: number;
  balance: string;
  balanceRaw: bigint;
  decimals: number;
  symbol: string;
  loading: boolean;
  error: string | null;
}

export interface WalletState {
  status: WalletStatus;
  address: string | null;
  chainId: number | null;
  chainKey: string | null;
  balances: Record<string, ChainBalance>;
  error: string | null;
}

const CHAINS = {
  gravityMainnet:   { id: 1625,    rpc: "https://rpc.gravity.xyz",                   nativeCurrency: { symbol: "G",    decimals: 18 } },
  gravityLongevity: { id: 7771625, rpc: "https://rpc-testnet.gravity.xyz",            nativeCurrency: { symbol: "G",    decimals: 18 } },
  gravitySepolia:   { id: 13505,   rpc: "https://rpc-sepolia.gravity.xyz",            nativeCurrency: { symbol: "G",    decimals: 18 } },
  tempoTestnet:     { id: 42431,   rpc: "https://rpc.moderato.tempo.xyz",             nativeCurrency: { symbol: "USD",  decimals: 18 } },
  arcTestnet:       { id: 5042002, rpc: "https://rpc.testnet.arc.network",            nativeCurrency: { symbol: "USDC", decimals: 18 } },
  giwaTestnet:      { id: 91342,   rpc: "https://sepolia-rpc.giwa.io",                nativeCurrency: { symbol: "ETH",  decimals: 18 } },
  robinhoodTestnet: { id: 46630,   rpc: "https://rpc.testnet.chain.robinhood.com",    nativeCurrency: { symbol: "ETH",  decimals: 18 } },
  arbitrum:         { id: 42161,   rpc: "https://arb1.arbitrum.io/rpc",               nativeCurrency: { symbol: "ETH",  decimals: 18 } },
};

declare global {
  interface Window {
    ethereum?: ethers.Eip1193Provider & {
      on: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    };
  }
}

function getChainById(id: number) {
  return Object.entries(CHAINS).find(([, c]) => c.id === id);
}

function buildAddChainParams(chainKey: string, fullChains: any) {
  const chain = fullChains[chainKey];
  if (!chain) return null;
  return {
    chainId: `0x${chain.id.toString(16)}`,
    chainName: chain.name,
    nativeCurrency: chain.nativeCurrency,
    rpcUrls: [chain.rpc],
    blockExplorerUrls: [chain.explorer],
  };
}

function formatUnitsFixed(raw: bigint, decimals: number, fractionDigits = 4) {
  // Avoid converting to Number (prevents scientific notation / precision loss).
  const s = ethers.formatUnits(raw, decimals);
  const [intPart, fracPart = ""] = s.split(".");
  const frac = fracPart.padEnd(fractionDigits, "0").slice(0, fractionDigits);
  return fractionDigits > 0 ? `${intPart}.${frac}` : intPart;
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    status: "disconnected",
    address: null,
    chainId: null,
    chainKey: null,
    balances: {},
    error: null,
  });

  const fetchBalance = useCallback(async (address: string, chainKey: string): Promise<ChainBalance> => {
    const chain = CHAINS[chainKey as keyof typeof CHAINS];
    const decimals = chain.nativeCurrency.decimals;
    const base: ChainBalance = {
      chainKey, chainId: chain.id, balance: "0.0000",
      balanceRaw: BigInt(0), decimals, symbol: chain.nativeCurrency.symbol,
      loading: true, error: null,
    };
    try {
      const provider = new ethers.JsonRpcProvider(chain.rpc);
      const raw = await provider.getBalance(address);
      const formatted = formatUnitsFixed(raw, decimals, 4);
      return { ...base, balance: formatted, balanceRaw: raw, loading: false };
    } catch (err) {
      return { ...base, loading: false, error: err instanceof Error ? err.message : "RPC error" };
    }
  }, []);

  const fetchAllBalances = useCallback(async (address: string) => {
    const chainKeys = Object.keys(CHAINS);
    setState(prev => ({
      ...prev,
      balances: Object.fromEntries(chainKeys.map(k => [k, {
        chainKey: k, chainId: CHAINS[k as keyof typeof CHAINS].id,
        balance: "0.0000", balanceRaw: BigInt(0), decimals: CHAINS[k as keyof typeof CHAINS].nativeCurrency.decimals,
        symbol: CHAINS[k as keyof typeof CHAINS].nativeCurrency.symbol,
        loading: true, error: null,
      }])),
    }));
    const results = await Promise.allSettled(chainKeys.map(k => fetchBalance(address, k)));
    const balances: Record<string, ChainBalance> = {};
    results.forEach((result, i) => {
      const k = chainKeys[i];
      balances[k] = result.status === "fulfilled" ? result.value : {
        chainKey: k, chainId: CHAINS[k as keyof typeof CHAINS].id,
        balance: "0.0000", balanceRaw: BigInt(0), decimals: CHAINS[k as keyof typeof CHAINS].nativeCurrency.decimals,
        symbol: CHAINS[k as keyof typeof CHAINS].nativeCurrency.symbol,
        loading: false, error: "Failed to fetch",
      };
    });
    setState(prev => ({ ...prev, balances }));
  }, [fetchBalance]);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setState(prev => ({ ...prev, status: "no-provider", error: "No wallet detected." }));
      return;
    }
    setState(prev => ({ ...prev, status: "connecting", error: null }));
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const address = (accounts as string[])[0];
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);
      const chainEntry = getChainById(chainId);
      setState(prev => ({ ...prev, status: "connected", address, chainId, chainKey: chainEntry?.[0] ?? null, error: null }));
      fetchAllBalances(address);
    } catch (err) {
      setState(prev => ({ ...prev, status: "error", error: err instanceof Error ? err.message : "Connection failed" }));
    }
  }, [fetchAllBalances]);

  const disconnect = useCallback(() => {
    setState({ status: "disconnected", address: null, chainId: null, chainKey: null, balances: {}, error: null });
  }, []);

  const refreshBalances = useCallback(() => {
    if (state.address) fetchAllBalances(state.address);
  }, [state.address, fetchAllBalances]);

  const switchChain = useCallback(async (chainKey: string) => {
    if (!window.ethereum) return;
    const chain = CHAINS[chainKey as keyof typeof CHAINS];
    if (!chain) return;
    try {
      await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: `0x${chain.id.toString(16)}` }] });
    } catch (err: unknown) {
      if ((err as any)?.code === 4902) {
        await window.ethereum.request({ method: "wallet_addEthereumChain", params: [buildAddChainParams(chainKey, CHAINS)] });
      }
    }
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;
    const handleAccountsChanged = (accounts: unknown) => {
      const accs = accounts as string[];
      if (!accs.length) { disconnect(); return; }
      setState(prev => ({ ...prev, address: accs[0] }));
      fetchAllBalances(accs[0]);
    };
    const handleChainChanged = (chainIdHex: unknown) => {
      const chainId = parseInt(chainIdHex as string, 16);
      setState(prev => ({ ...prev, chainId, chainKey: getChainById(chainId)?.[0] ?? null }));
    };
    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);
    window.ethereum.on("disconnect", disconnect);
    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum?.removeListener("chainChanged", handleChainChanged);
      window.ethereum?.removeListener("disconnect", disconnect);
    };
  }, [disconnect, fetchAllBalances]);

  return { ...state, connect, disconnect, switchChain, refreshBalances, isConnected: state.status === "connected", isConnecting: state.status === "connecting" };
}