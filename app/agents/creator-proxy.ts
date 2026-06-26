/**
 * creator-proxy.ts
 * A provider "agent" that performs work on behalf of a real human creator.
 * On settlement, the fee routes to the creator's own wallet — this is what
 * makes "a creator getting paid" demonstrable, not simulated.
 */

import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY!,
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:3000",
    "X-Title": "Swarm Arc",
  },
});

export interface CreatorProxyAgent {
  name: string;
  address: string;
  creatorName: string;
}

// The real human creator for the demo — Swarm settles task fees directly
// to this wallet on Arc, with a memo tying each payment to the task it paid for.
export const CREATOR_PROXY: CreatorProxyAgent = {
  name: "ContentCreator",
  address: "0x8B62F7656c32990DC1e3781945640C74CD70317b",
  creatorName: "Havertz",
};

export function createCreatorProxy(
  name: string,
  address: string,
  creatorName: string
): CreatorProxyAgent {
  return { name, address, creatorName };
}

async function callModel(prompt: string): Promise<string | undefined> {
  const result = await client.chat.completions.create({
    model: "openrouter/free", // free model router — $0 cost
    messages: [{ role: "user", content: prompt }],
    max_tokens: 200,
  });

  // Log the raw response whenever content is missing/empty, so we can see
  // exactly what the free router returned instead of guessing.
  const content = result.choices?.[0]?.message?.content?.trim();
  if (!content) {
    console.warn(
      "executeCreatorTask: empty content from model, raw response:",
      JSON.stringify(result, null, 2)
    );
  }
  return content || undefined;
}

export async function executeCreatorTask(
  proxy: CreatorProxyAgent,
  task: string
): Promise<string> {
  const prompt = `You are an AI assistant working on behalf of a human creator named ${proxy.creatorName}. Draft a short response (2-3 sentences) to this task, as work ${proxy.creatorName} will review and publish: "${task}"`;

  try {
    // First attempt
    const firstTry = await callModel(prompt);
    if (firstTry) return firstTry;

    // One retry — empty content from the free router is often transient
    console.warn("executeCreatorTask: retrying once after empty response...");
    const secondTry = await callModel(prompt);
    if (secondTry) return secondTry;

    console.warn("executeCreatorTask: both attempts returned empty, using fallback text.");
    return `Completed by ${proxy.creatorName} for task: ${task}`;
  } catch (err) {
    console.error("Creator task error:", err);
    return `Completed by ${proxy.creatorName} for task: ${task}`;
  }
}
