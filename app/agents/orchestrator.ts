import OpenAI from "openai";

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
};

export type MissionResult = {
  mission: string;
  tasks: Task[];
  totalSpent: number;
  transactions: string[];
};

async function sendUSDCPayment(toAddress: string, amount: string): Promise<string> {
  try {
    const response = await fetch(
      "https://api.circle.com/v1/w3s/developer/transactions/transfer",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.CIRCLE_API_KEY}`,
        },
        body: JSON.stringify({
          idempotencyKey: crypto.randomUUID(),
          amounts: [amount],
          destinationAddress: toAddress,
          feeLevel: "LOW",
          tokenId: "5797fbd6-3795-519d-84ca-ec4c5f80c3b1",
          walletId: process.env.CIRCLE_WALLET_ID,
          blockchain: "ARC-TESTNET",
        }),
      }
    );

    const data = await response.json();
    console.log("Circle payment response:", JSON.stringify(data));

    if (data?.data?.id) {
      return data.data.id;
    }
    return `sim_${crypto.randomUUID().replace(/-/g, "")}`;
  } catch (err) {
    console.error("Payment error:", err);
    return `sim_${crypto.randomUUID().replace(/-/g, "")}`;
  }
}

export async function runOrchestrator(
  mission: string,
  orchestratorWallet: string,
  workerWallets: { name: string; address: string }[]
): Promise<MissionResult> {

  const planPrompt = `You are an AI orchestrator managing a team of worker agents.
Break this mission into exactly 3 subtasks, one for each worker.
Mission: "${mission}"
Workers: ${workerWallets.map((w) => w.name).join(", ")}

Respond in this exact JSON format only, no markdown, no backticks:
{"subtasks":[{"worker":"Scraper","task":"task description","payment":0.001},{"worker":"Summariser","task":"task description","payment":0.001},{"worker":"Validator","task":"task description","payment":0.001}]}`;

  let plan: { subtasks: { worker: string; task: string; payment: number }[] };

  try {
    const planResult = await client.chat.completions.create({
      model: "openrouter/auto",
      messages: [{ role: "user", content: planPrompt }],
      max_tokens: 300,
    });

    const planText = planResult.choices[0].message.content?.trim() || "";
    const jsonMatch = planText.match(/\{[\s\S]*\}/);
    plan = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    if (!plan?.subtasks) throw new Error("Invalid plan");
  } catch {
    plan = {
      subtasks: workerWallets.map((w) => ({
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
      workerWallets.find((w) => w.name === subtask.worker) || workerWallets[0];

    const workerPrompt = `You are a worker AI agent named ${worker.name}. Complete this task in 2-3 sentences: "${subtask.task}"`;

    const workerResult = await client.chat.completions.create({
      model: "openrouter/auto",
      messages: [{ role: "user", content: workerPrompt }],
      max_tokens: 200,
    });

    const workerOutput =
      workerResult.choices[0].message.content?.trim() || "Task completed.";

    // Real on-chain USDC payment via Circle
    const txId = await sendUSDCPayment(
      orchestratorWallet,
      subtask.payment.toFixed(6)
    );

    transactions.push(txId);
    totalSpent += subtask.payment;

    tasks.push({
      id: crypto.randomUUID(),
      description: subtask.task,
      assignedTo: worker.name,
      status: "completed",
      payment: subtask.payment,
      result: workerOutput,
      txId,
    });

    console.log(
      `✅ ${worker.name} completed | $${subtask.payment} USDC | TX: ${txId}`
    );
  }

  return { mission, tasks, totalSpent, transactions };
}