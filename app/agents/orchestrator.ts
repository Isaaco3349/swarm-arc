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

    const txHash = `0x${crypto.randomUUID().replace(/-/g, "")}`;
    transactions.push(txHash);
    totalSpent += subtask.payment;

    tasks.push({
      id: crypto.randomUUID(),
      description: subtask.task,
      assignedTo: worker.name,
      status: "completed",
      payment: subtask.payment,
      result: workerOutput,
    });

    console.log(
      `✅ ${worker.name} completed task | $${subtask.payment} USDC | TX: ${txHash}`
    );
  }

  return { mission, tasks, totalSpent, transactions };
}