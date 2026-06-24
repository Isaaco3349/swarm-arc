/**
 * reputation.ts
 * Off-chain coordinator for the on-chain ReputationBond contract.
 * Tracks which agents are eligible to be hired, and records outcomes
 * that trigger settlement or slashing on Arc.
 */

import type { ProviderMatch } from "./orchestrator";

interface ProviderRecord extends ProviderMatch {
  capability: string;
}

// In-memory for the hackathon demo — swap for a real DB/indexer post-hackathon.
const providers: ProviderRecord[] = [];

export function registerProvider(record: ProviderRecord) {
  providers.push(record);
}

export async function getEligibleProviders(
  capability: string,
  maxPriceUsdc: number
): Promise<ProviderMatch[]> {
  const MIN_BOND_USDC = 0.5; // minimum stake required to be hireable

  return providers.filter(
    (p) =>
      p.capability === capability &&
      p.priceUsdc <= maxPriceUsdc &&
      p.bondedAmountUsdc >= MIN_BOND_USDC
  );
}

export async function recordTaskOutcome(
  taskId: string,
  providerId: string,
  success: boolean,
  slashBps: number
): Promise<void> {
  const provider = providers.find((p) => p.agentId === providerId);
  if (!provider) throw new Error(`Unknown provider: ${providerId}`);

  if (success) {
    provider.reputationScore += 1;
    // Fee settlement happens via Gateway nanopayment call here.
  } else {
    provider.reputationScore = Math.max(0, provider.reputationScore - 2);
    const slashAmount = (provider.bondedAmountUsdc * slashBps) / 10_000;
    provider.bondedAmountUsdc -= slashAmount;
    // On-chain call to ReputationBond.recordOutcome(taskId, false, slashBps) here.
  }
}
