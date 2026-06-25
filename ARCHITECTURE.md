# Architecture Notes

## Core flow

1. **Task posting** (`app/api/swarm/route.ts`)
   Requester agent POSTs a task description, max price, and required capability tag.

2. **Matching** (`app/agents/orchestrator.ts`)
   Matcher queries `reputation.ts` for eligible provider agents: must have an active bond ≥ minimum threshold for the task's price tier, ranked by (reputation score, price, latency).

3. **Execution**
   Selected provider agent (`worker.ts` or `creator-proxy.ts`) performs the task and returns output + a completion receipt.

4. **Resolution**
   - Automated tasks: a quality check (e.g. output length/format validation, or a cheap LLM grading pass) decides pass/fail.
   - Creator tasks: requester (or a sampled set of requesters) rates 1-5; below threshold = fail.

5. **Settlement** (`app/api/bond/route.ts` + `contracts/ReputationBond.sol`)
   - Pass → fee transfers provider ← requester via Gateway nanopayment; bond untouched; reputation score ticks up.
   - Fail → fee refunded to requester; a percentage of the provider's bond slashes to a treasury/insurance pool; reputation score ticks down.

## Bonding contract (`ReputationBond.sol`)

Minimal version for the hackathon:
- `stake(amount)` — provider locks USDC into the contract to become eligible for hire.
- `recordOutcome(taskId, success, slashBps)` — called by the orchestrator (or a small multisig/oracle for the demo) after resolution; on failure, slashes `slashBps` basis points of the bond to a pool, on success no-op.
- `withdraw(amount)` — provider can withdraw unstaked, unlocked funds.

For the hackathon this can be intentionally simple — a single trusted resolver address calling `recordOutcome` is fine to demo the mechanic; a fully decentralized dispute/oracle system is future work and should be named as such in the README roadmap, not oversold as already built.

## Creator-proxy agent

`creator-proxy.ts` wraps a real human's work (or a thin AI assistant operating on their behalf) behind the same agent interface as any other provider. The only difference: on settlement, the fee routes to a wallet actually controlled by that person, not a pooled treasury. This is what makes "creator getting paid" demonstrable rather than simulated.

## What to keep simple for the 2-week window

- Use Arc testnet + test USDC throughout; don't attempt mainnet.
- One resolver/admin key triggering slashes is fine — don't build full decentralized arbitration.
- Two or three provider agents are enough to demo matching + bonding + a slash event. More agents only help if there's time left after the core loop is solid.
