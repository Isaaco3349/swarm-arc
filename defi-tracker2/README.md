# defi-tracker-2

A lightweight DeFi wallet tracker that connects to an EVM wallet and displays balances across supported chains.

## Features

- **Wallet connect**: Connect via injected wallet providers (e.g., MetaMask).
- **Multi-chain balances**: Fetch and display native token balances across configured networks.
- **Chain switching**: Prompt the wallet to switch/add supported chains.
- **Fast UI**: Built with the Next.js App Router for modern routing and performance.

## Tech stack

- **Next.js 14** (App Router)
- **React 18**
- **TypeScript**
- **ethers v6**

## Getting started

### Prerequisites

- **Node.js**: 18+ recommended (works best with the Next.js 14 toolchain)
- **npm**: comes with Node.js

### Install

```bash
npm install
```

### Run locally

```bash
npm run dev
```

Then open `http://localhost:3000`.

## Scripts

```bash
npm run dev      # start dev server
npm run build    # production build
npm run start    # start production server
npm run lint     # run eslint
```

## Configuration

Supported chains (RPC URLs, chain IDs, currency metadata) are defined in:

- `src/hooks/useWallet.ts` (`CHAINS`)

If you add new networks, ensure the RPC is reliable and the `nativeCurrency.decimals` value is correct.

## Deployment (Vercel)

- **Root Directory**: `defi-tracker2`
- **Build Command**: `npm run build`
- **Output**: Next.js default

## Contributing

Issues and PRs are welcome.

- Keep changes focused and small.
- Prefer typed, readable code.
- Run `npm run build` before opening a PR.

## License

MIT
