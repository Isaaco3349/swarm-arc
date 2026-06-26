import OpenAI from "openai";
import { getEligibleProviders, recordTaskOutcome } from "./reputation";
import { sendUSDCPaymentWithMemo } from "./payment";

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY!,
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:3000",
    "X-Title": "Swarm Arc",
  },
});

export type Task = {
  id: string;
  description: string;
  assignedTo: string;
  status: "pending" | "completed" | "failed";
  payment: number;
  result?: string;
  txId?: string;
  simulated?: boolean;
};

export type MissionResult = {
  mission: string;
  tasks: Task[];
  totalSpent: number;
  transactions: string[];
};

export async function runOrchestrator(
  mission: string,
  orchestratorWallet: string,
  workerWallets: { name: string; address: string }[]
): Promise<MissionResult> {

  // Filter down to only bonded/eligible workers before planning.
  // Falls back to all workers if reputation data isn't set up yet (e.g. local dev).
  let eligibleWorkers = workerWallets;
  try {
    const eligible = await getEligibleProviders("general", 0.01);
    if (eligible.length > 0) {
      eligibleWorkers = workerWallets.filter((w) =>
        eligible.some((e) => e.walletAddress === w.address)
      );
      if (eligibleWorkers.length === 0) eligibleWorkers = workerWallets; // fallback
    }
  } catch {
    // reputation system not wired up yet — proceed with all workers
  }

  const planPrompt = `You are an AI orchestrator managing a team of worker agents.
Break this mission into exactly 3 subtasks, one for each worker.
Mission: "${mission}"
Workers: ${eligibleWorkers.map((w) => w.name).join(", ")}

Respond in this exact JSON format only, no markdown, no backticks:
{"subtasks":[{"worker":"Scraper","task":"task description","payment":0.001},{"worker":"Summariser","task":"task description","payment":0.001},{"worker":"Validator","task":"task description","payment":0.001}]}`;

  let plan: { subtasks: { worker: string; task: string; payment: number }[] };

  try {
    const planResult = await client.chat.completions.create({
      model: "openrouter/free", // free model router — $0 cost, 50 req/day cap
      messages: [{ role: "user", content: planPrompt }],
      max_tokens: 300,
    });

    const planText = planResult.choices[0].message.content?.trim() || "";
    const jsonMatch = planText.match(/\{[\s\S]*\}/);
    plan = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    if (!plan?.subtasks) throw new Error("Invalid plan");
  } catch {
    plan = {
      subtasks: eligibleWorkers.map((w) => ({
        worker: w.name,
        task: `Handle part of: ${mission}`,
        payment: 0.001,
      })),
    };
  }

  const tasks: Task[] = [];
  const transactions: string[] = [];
  let totalSpent = 0;

  for (const subtask of plan.subtasks) {
    const worker =
      eligibleWorkers.find((w) => w.name === subtask.worker) || eligibleWorkers[0];

    const workerPrompt = `You are a worker AI agent named ${worker.name}. Complete this task in 2-3 sentences: "${subtask.task}"`;

    const workerResult = await client.chat.completions.create({
      model: "openrouter/free", // free model router — $0 cost, 50 req/day cap
      messages: [{ role: "user", content: workerPrompt }],
      max_tokens: 200,
    });

    const workerOutput =
      workerResult.choices[0].message.content?.trim() || "Task completed.";

    // Generate the task id up front so it can be embedded in the on-chain memo.
    const taskId = crypto.randomUUID();

    // Real on-chain USDC payment via Circle, wrapped with a memo tying it to taskId.
    // Pays the WORKER who did the task (not the orchestrator) — this is the
    // core "agents hire & pay each other" mechanic Swarm is built around.
    const { txId, simulated } = await sendUSDCPaymentWithMemo(
      worker.address,
      subtask.payment.toFixed(6),
      taskId
    );

    transactions.push(txId);
    totalSpent += subtask.payment;

    tasks.push({
      id: taskId,
      description: subtask.task,
      assignedTo: worker.name,
      status: "completed",
      payment: subtask.payment,
      result: workerOutput,
      txId,
      simulated,
    });

    console.log(
      `✅ ${worker.name} completed | $${subtask.payment} USDC | TX: ${txId}${simulated ? " (simulated)" : ""}`
    );

    try {
      await recordTaskOutcome(subtask.task, worker.address, true, 0);
    } catch {
      // reputation system not wired up yet
    }
  }

  return { mission, tasks, totalSpent, transactions };
}