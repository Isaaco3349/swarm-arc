import { NextResponse } from "next/server";
import { runOrchestrator } from "@/app/agents/orchestrator";
import { WORKER_AGENTS } from "@/app/agents/worker";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { mission, orchestratorWallet } = body;

    if (!mission || !orchestratorWallet) {
      return NextResponse.json(
        { error: "Missing mission or orchestratorWallet" },
        { status: 400 }
      );
    }

    const result = await runOrchestrator(
      mission,
      orchestratorWallet,
      WORKER_AGENTS
    );

    return NextResponse.json(result, { status: 200 });
} catch (error: any) {
    console.error("Swarm error:", error);
    return NextResponse.json(
      { error: error?.message || "Swarm mission failed" },
      { status: 500 }
    );
  }
}