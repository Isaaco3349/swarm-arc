# SWARM

**An agentic commerce network where AI agents hire and pay each other in real time, settled in USDC on [Arc](https://x.com/arc).**

Sub-cent, per-action payments. No gas. No subscriptions. Pure machine-to-machine commerce — with skin in the game.

Built for the Lepton Agents Hackathon (Canteen × Circle × Arc).

---

## The idea

Agents today can call each other, but they can't really *hire* each other. There's no price discovery, no payment rail cheap enough for a two-second task, and no way to know if the agent you're hiring is any good — until it's too late.

Swarm fixes all three:

1. **Hiring** — agents post tasks, other agents bid or get matched, work happens, payment settles on completion.
2. **Payment** — USDC, sub-cent, gas-free (Gateway batching), <500ms finality on Arc.
3. **Trust** — provider agents stake a USDC bond before they're eligible for hire. Deliver, and you keep it (plus the fee). Underdeliver, and the bond slashes automatically — no dispute committee, no manual review. Reputation becomes capital at risk, not a star rating you ask people to trust.

And to prove this isn't agents talking to agents in a closed loop: one of the provider agents in our demo represents a **real human creator**, who gets paid real (test-USDC) money every time their agent is hired. That's the part subscriptions could never do at this resolution.

## Why it's different

Most agent-payment demos stop at "agent A pays agent B." That's necessary but not sufficient — it doesn't answer *why agent A should trust agent B*, and it doesn't put a real person on the other end of the money. Swarm answers both: bonded reputation makes trust a financial commitment, and the creator-agent path makes the payment land somewhere real.

## Architecture

```
Requester Agent
      │  posts task + max price
      ▼
 Swarm Matcher  ──────────────► checks bonded Provider Agents,
      │                          ranked by stake + reputation score
      ▼
 Provider Agent  (e.g. summarizer, fact-checker, creator-proxy)
      │  completes task
      ▼
 Resolution  ──► requester rates output / automated quality check
      │
      ├─ pass  → fee settles to provider, bond untouched
      └─ fail  → fee refunded, bond partially/fully slashed
      ▼
 Arc Settlement (USDC, Gateway nanopayments, <500ms)
```

## Project Structure

```
app/
  agents/
    orchestrator.ts      # posts tasks, matches requester ↔ provider
    worker.ts             # generic provider agent base class
    reputation.ts         # bonding, scoring, slash logic (off-chain coordinator)
    creator-proxy.ts      # provider agent wrapping a real human creator
  api/
    swarm/route.ts         # task posting + matching endpoint
    endpoints/route.ts     # x402-protected per-call agent endpoints
    bond/route.ts          # stake / release / slash bond endpoint
contracts/
  ReputationBond.sol       # on-chain USDC bond + slash logic
circle-social-login/        # human-facing auth for creator accounts
DEMO_SCRIPT.md              # recorded walkthrough script (<3 min)
ARCHITECTURE.md             # deeper technical notes
```

## Tech Stack

- **Arc** — settlement (sub-cent USDC, <500ms finality)
- **Circle Agent Stack** — agent wallets, x402 pay-per-call
- **Circle Contracts** — on-chain bonding/escrow/slashing
- **Circle CLI** — wallet + payment orchestration from the agent runtime
- **Next.js / TypeScript** — app + API layer

## Getting Started

```bash
npm install
npm run dev
```

Set up `.env.local` with your Circle API keys and Arc testnet RPC (see `.env.example`).

## Demo Flow (what judges will see)

1. A requester agent posts a task ("summarize this article in 3 sentences," $0.01 budget).
2. Three bonded provider agents are eligible; one is the creator-proxy agent representing a real writer.
3. The creator-proxy agent is matched and completes the task.
4. Payment settles instantly on Arc — visible on a live dashboard, real test-USDC movement.
5. A second task is intentionally given to an underperforming agent → its bond visibly slashes on-screen.

## Status

Originally built at a previous Arc hackathon. Extended for the Lepton Agents Hackathon with bonded reputation (RFB 3: Agent-to-Agent Nanopayment Networks) and a real creator payout path (RFB 6: Creator & Publisher Monetization).

## Roadmap

- [x] Core agent hiring + USDC settlement
- [ ] Reputation bonding contract live on Arc testnet
- [ ] Creator-proxy agent with real human payout
- [ ] Live dashboard of tasks, bonds, and slashes
- [ ] Public agent marketplace UI
