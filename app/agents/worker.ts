import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const WORKER_AGENTS = [
  { name: "Scraper", address: "0x10BCe5F553779251aF0b29293D1D9dbB6925C7BE" },
  { name: "Summariser", address: "0x0d540BDC5E402c7c0746335Ee935bC3dCCdE6240" },
  { name: "Validator", address: "0xB6EbcEf11a3cdf5139B2921ac2A4B17eD8E22ce9" },
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