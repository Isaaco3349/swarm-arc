# MAINNET TODO

Shortcuts taken for hackathon speed. None of these are acceptable for a real
mainnet deployment with real funds — this file exists so they don't get
forgotten once the demo is working.

## Critical — security

- [ ] **Single trusted resolver address can slash anyone's bond unilaterally.**
      `ReputationBond.sol`'s `recordOutcome` is called by one `resolver` address
      with no dispute window, no multisig, no decentralized oracle. On testnet
      this is fine to demo the mechanic. On mainnet, a compromised or malicious
      resolver key could slash every provider's real USDC. Needs either a
      multisig resolver, a dispute/appeal window, or a real oracle/arbitration
      layer (e.g. UMA, Kleros) before any real funds touch this contract.

- [ ] **No access control review on `withdraw`/`stake` re-entrancy paths.**
      Current contract is unaudited. Get a real audit (or at minimum a
      thorough manual review + Slither/Mythril pass) before mainnet.

- [ ] **Deployer / resolver private keys must never be hardcoded or committed.**
      Confirm `.env.local` is gitignored and use a proper secrets manager
      (not plaintext env vars) for any mainnet deployment key.

## Data persistence

- [ ] **`reputation.ts` uses an in-memory array, not a real database.**
      All provider registrations and scores are lost on server restart.
      Needs a real persistent store (Postgres, etc.) plus an indexer that
      reads on-chain bond state from `ReputationBond.sol` as the source of
      truth, rather than trusting the in-memory off-chain copy.

## Payments

- [ ] **`app/api/endpoints/route.ts` does not actually verify payment proofs.**
      The `x-payment-proof` header is checked for presence only — it is not
      cryptographically verified against an actual Gateway settlement. This
      must be implemented before any endpoint is trusted to gate on payment.

- [ ] **`sendUSDCPayment` in `orchestrator.ts` falls back to a simulated
      transaction ID (`sim_...`) on error**, which would silently mask failed
      real payments in a production setting. On mainnet, a failed payment
      should hard-fail the task, not pretend to succeed.

## Operational

- [ ] **`WORKER_AGENTS` in `worker.ts` has placeholder empty wallet addresses.**
      Needs real, funded wallets before bonding/eligibility has any real
      effect.

- [ ] **No monitoring/alerting** on contract events (`Staked`, `Withdrawn`,
      `OutcomeRecorded`) — needed before trusting this unattended with real
      funds.

- [ ] **No rate limiting / abuse protection** on any API route.
