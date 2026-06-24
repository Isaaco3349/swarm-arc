import { NextRequest, NextResponse } from "next/server";
import { registerProvider } from "@/app/agents/reputation";

/**
 * bond/route.ts
 * Stake endpoint: a provider agent calls this after locking USDC into
 * ReputationBond.sol to register itself as eligible for hire.
 */

export async function POST(req: NextRequest) {
  const { agentId, walletAddress, capability, priceUsdc, bondedAmountUsdc } =
    await req.json();

  registerProvider({
    agentId,
    walletAddress,
    capability,
    priceUsdc,
    bondedAmountUsdc,
    reputationScore: 0,
  });

  return NextResponse.json({ ok: true });
}
