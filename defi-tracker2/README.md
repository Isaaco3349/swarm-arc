# defi-tracker-2

DeFi wallet tracker built with Next.js that connects to an EVM wallet and shows native token balances across configured chains.

## What it does

- Connects to an injected EVM wallet (e.g., MetaMask)
- Fetches native balances over RPC using `ethers`
- Lets users switch/add supported networks in their wallet

## Tech stack

- Next.js 14 (App Router)
- React 18
- TypeScript
- ethers v6

## Quickstart

### Prerequisites

- Node.js 18+ recommended
- npm

### Install

```bash
npm install
```

### Run locally

```bash
npm run dev
```

Open `http://localhost:3000`.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Configuration

Supported networks are configured in:

- `src/hooks/useWallet.ts` (`CHAINS`)

When adding a chain, make sure the `rpc` URL is reliable and the `nativeCurrency.decimals` value is correct.

## Deployment (Vercel)

If this repo contains the app in a subdirectory, set the Vercel project **Root Directory** accordingly.

- Build command: `npm run build`
- Output: Next.js default

## License

MIT
