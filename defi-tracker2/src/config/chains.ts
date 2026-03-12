export const CHAINS = {
    // Gravity Longevity L1 Testnet (replaces old Gravity mainnet entry)
    gravityMainnet:   { id: 7771625, name: "Gravity Longevity", shortName: "G-L1",  color: "#00ffcc", rpc: "https://rpc-testnet.gravity.xyz",               explorer: "https://explorer-testnet.gravity.xyz", faucet: "https://faucet.gravity.xyz",              nativeCurrency: { symbol: "G",    decimals: 18 }, type: "testnet", stack: "Gravity L1",    logo: "🔬", note: "L1 Longevity Testnet · ~200ms blocks · no planned resets", tps: "9,500–11,000 TPS" },
    gravitySepolia:   { id: 13505,   name: "Gravity Sepolia",   shortName: "G-SEP", color: "#00cc88", rpc: "https://rpc-sepolia.gravity.xyz",               explorer: "https://explorer-sepolia.gravity.xyz", bridge: "https://bridge-sepolia.gravity.xyz",      nativeCurrency: { symbol: "G",    decimals: 18 }, type: "testnet", stack: "Arbitrum Nitro", logo: "🧪", note: "L2 Sepolia Testnet · Celestia DA" },
    tempoTestnet:     { id: 42431,   name: "Tempo Moderato",    shortName: "TEMPO", color: "#ff6b35", rpc: "https://rpc.moderato.tempo.xyz",                explorer: "https://scout.tempo.xyz",              faucet: "https://docs.tempo.xyz/quickstart/faucet", nativeCurrency: { symbol: "USD",  decimals: 18 }, type: "testnet", stack: "Tempo L1",      logo: "💳", note: "Payments L1 · no native gas · fees in TIP-20 stablecoins" },
    arcTestnet:       { id: 5042002, name: "Arc Testnet",       shortName: "ARC",   color: "#f59e0b", rpc: "https://rpc.testnet.arc.network",               explorer: "https://testnet.arcscan.app",          faucet: "https://faucet.circle.com",               nativeCurrency: { symbol: "USDC", decimals: 18 }, type: "testnet", stack: "Arc L1",        logo: "🏛️", note: "Circle-backed L1 · USDC as native gas · deterministic finality" },
    giwaTestnet:      { id: 91342,   name: "GIWA Sepolia",      shortName: "GIWA",  color: "#ec4899", rpc: "https://sepolia-rpc.giwa.io",                   explorer: "https://sepolia-explorer.giwa.io",     faucet: "https://faucet.giwa.io",                  nativeCurrency: { symbol: "ETH",  decimals: 18 }, type: "testnet", stack: "OP Stack L2",   logo: "🏯", note: "Upbit-backed OP Stack L2 · 1s blocks · mainnet TBD" },
    robinhoodTestnet: { id: 46630,   name: "Robinhood Testnet", shortName: "RH",    color: "#00c805", rpc: "https://rpc.testnet.chain.robinhood.com",        explorer: "https://explorer.testnet.chain.robinhood.com",                                           nativeCurrency: { symbol: "ETH",  decimals: 18 }, type: "testnet", stack: "Arbitrum L2",   logo: "🪶", note: "Robinhood Chain · Arbitrum L2 · ETH gas" },
    arbitrum:         { id: 42161,   name: "Arbitrum One",      shortName: "ARB",   color: "#28a0f0", rpc: "https://arb1.arbitrum.io/rpc",                  explorer: "https://arbiscan.io",                                                                    nativeCurrency: { symbol: "ETH",  decimals: 18 }, type: "mainnet", stack: "Arbitrum",      logo: "🔷", note: "Arbitrum One mainnet" },
  };
  
  export const HEADER_CHAINS = [
    "gravityMainnet",
    "tempoTestnet",
    "arcTestnet",
    "giwaTestnet",
    "robinhoodTestnet",
  ] as const;