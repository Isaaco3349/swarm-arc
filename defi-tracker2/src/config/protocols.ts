export const PROTOCOLS = {
    longevity: {
      name: "Longevity", tag: "GRAVITY", color: "#00ffcc",
      chains: ["gravityMainnet"],
      type: "Gravity L1 Testnet",
      description: "Gravity's long-running L1 testnet. ~200ms block time, 9,500–11,000 TPS.",
      contracts: {
        gravityMainnet:   { staking: "", vault: "" },
      },
      status: "testnet",
      docsUrl: "https://docs.gravity.xyz/network/l1-longevity-testnet",
      faucet: "https://faucet.gravity.xyz",
    },
    tempo: {
      name: "Tempo", tag: "TEMPO", color: "#ff6b35",
      chains: ["tempoTestnet"],
      type: "Payments L1 · TIP-20 stablecoins",
      description: "Payments-optimised L1. Fees in TIP-20 stablecoins (pathUSD / AlphaUSD). No native ETH gas.",
      contracts: {
        tempoTestnet: { paymentRouter: "", stablecoinDex: "" },
      },
      status: "testnet",
      docsUrl: "https://docs.tempo.xyz",
      faucet: "https://docs.tempo.xyz/quickstart/faucet",
    },
    arc: {
      name: "Arc", tag: "ARC", color: "#f59e0b",
      chains: ["arcTestnet"],
      type: "Circle L1 · USDC gas · Deterministic finality",
      description: "Circle-backed L1. USDC is the native gas token. Deterministic finality. Opt-in privacy.",
      contracts: {
        arcTestnet: { usdc: "", eurc: "" },
      },
      status: "testnet",
      docsUrl: "https://docs.arc.network",
      faucet: "https://faucet.circle.com",
    },
    giwa: {
      name: "Giwa", tag: "GIWA", color: "#ec4899",
      chains: ["giwaTestnet"],
      type: "Upbit OP Stack L2 · 1s blocks",
      description: "Upbit-backed OP Stack L2. 1-second block time. ETH gas. Mainnet not yet launched.",
      contracts: {
        giwaTestnet: { dojang: "" },
      },
      status: "testnet",
      docsUrl: "https://docs.giwa.io",
      faucet: "https://faucet.giwa.io",
    },
    robinhood: {
      name: "Robinhood", tag: "RH", color: "#00c805",
      chains: ["robinhoodTestnet"],
      type: "Arbitrum L2 · ETH gas",
      description: "Robinhood Chain — Arbitrum L2. Standard EVM tooling. Deploy with Hardhat or Foundry.",
      contracts: {
        robinhoodTestnet: {},
      },
      status: "testnet",
      docsUrl: "https://docs.robinhood.com/chain/deploy-smart-contracts/",
      faucet: null,
    },
  };