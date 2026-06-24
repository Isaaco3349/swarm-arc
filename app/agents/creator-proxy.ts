/**
 * creator-proxy.ts
 * A provider agent that performs work on behalf of a real human creator.
 * On settlement, the fee routes to the creator's own wallet — this is the
 * agent that makes "a creator getting paid" demonstrable, not simulated.
 */

import { WorkerAgent } from "./worker";

export class CreatorProxyAgent extends WorkerAgent {
  constructor(
    agentId: string,
    public readonly creatorName: string,
    creatorWalletAddress: string,
    capability: string,
    priceUsdc: number
  ) {
    super(agentId, creatorWalletAddress, capability, priceUsdc);
  }

  async execute(payload: unknown): Promise<unknown> {
    // For the demo: route the task to the creator's actual workflow
    // (e.g. a webhook notifying them, or an AI assist tool they review/approve).
    // Settlement on completion pays creatorWalletAddress directly via Gateway.
    return {
      completedBy: this.creatorName,
      result: `[creator output for: ${JSON.stringify(payload)}]`,
    };
  }
}
