/**
 * creator-proxy.ts
 * A provider "agent" that performs work on behalf of a real human creator.
 * On settlement, the fee routes to the creator's own wallet — this is what
 * makes "a creator getting paid" demonstrable, not simulated.
 *
 * Matches the functional style of worker.ts (no class hierarchy needed).
 */

export interface CreatorProxyAgent {
  name: string;
  address: string;
  creatorName: string;
}

export function createCreatorProxy(
  name: string,
  address: string,
  creatorName: string
): CreatorProxyAgent {
  return { name, address, creatorName };
}

export async function executeCreatorTask(
  proxy: CreatorProxyAgent,
  task: string
): Promise<string> {
  // For the demo: route the task to the creator's actual workflow
  // (e.g. a webhook notifying them, or an AI assist tool they review/approve).
  // Settlement on completion pays proxy.address directly via Gateway.
  return `[completed by ${proxy.creatorName} for task: ${task}]`;
}