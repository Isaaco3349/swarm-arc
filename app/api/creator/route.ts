import { NextRequest, NextResponse } from "next/server";
import { CREATOR_PROXY, executeCreatorTask } from "@/app/agents/creator-proxy";
import { sendUSDCPaymentWithMemo } from "@/app/agents/payment";

/**
 * api/creator/route.ts
 * Hires the creator-proxy agent (representing a real human creator) for a
 * task, then settles a real USDC payment directly to that creator's wallet
 * on Arc, memo-wrapped with the task id. This is the RFB-6 (creator/publisher
 * monetization) piece of Swarm — a real human getting paid, not just agents
 * paying agents.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const task: string =
      body.task ??
      "Write a 2-3 sentence explainer on how Arc enables sub-cent USDC payments for creators.";
    const amountUsdc: string = body.amountUsdc ?? "0.01";

    const result = await executeCreatorTask(CREATOR_PROXY, task);

    const taskId = crypto.randomUUID();
    const { txId, simulated } = await sendUSDCPaymentWithMemo(
      CREATOR_PROXY.address,
      amountUsdc,
      taskId
    );

    return NextResponse.json({
      creatorName: CREATOR_PROXY.creatorName,
      creatorAddress: CREATOR_PROXY.address,
      task,
      result,
      payment: amountUsdc,
      taskId,
      txId,
      simulated,
    });
  } catch (error) {
    console.error("Error in /api/creator:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
