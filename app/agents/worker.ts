import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const WORKER_AGENTS = [
  { name: "Scraper", address: "" },
  { name: "Summariser", address: "" },
  { name: "Validator", address: "" },
];

export async function executeWorkerTask(
  workerName: string,
  task: string
): Promise<string> {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const prompt = `You are a worker AI agent named ${workerName}. Complete this task in 2-3 sentences: "${task}"`;
  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}