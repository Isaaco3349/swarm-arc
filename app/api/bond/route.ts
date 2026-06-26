import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import { registerProvider } from "@/app/agents/reputation";

/**
 * bond/route.ts
 * Stake endpoint: a provider agent calls this after locking USDC into
 * ReputationBond.sol to register itself as eligible for hire.
 *
 * Flow:
 *  1. Receive { agentId, walletAddress, capability, priceUsdc, bondedAmountUsdc }
 *  2. Use the agent's private key (from env) to call bond() on ReputationBond.sol
 *  3. Wait for tx confirmation
 *  4. Register in-memory so the orchestrator can match this provider
 */

const REPUTATION_BOND_ADDRESS = "0xc092716cd55Ff7992bafEFCe8b964D188d9F0D9B";
const ARC_TESTNET_RPC = "https://rpc.testnet.arc.fun"; // update if Arc's RPC URL differs

// Minimal ABI — only the functions we call from this route
const REPUTATION_BOND_ABI = [
  "function bond(uint256 amountUsdc) external",
  "function getBond(address agent) external view returns (uint256)",
  "event Bonded(address indexed agent, uint256 amount)",
];

// Map agentId → env key name for private keys
const AGENT_KEY_MAP: Record<string, string> = {
  Scraper: "WORKER_SCRAPER_PRIVATE_KEY",
  Summariser: "WORKER_SUMMARISER_PRIVATE_KEY",
  Validator: "WORKER_VALIDATOR_PRIVATE_KEY",
};

export async function POST(req: NextRequest) {
  const { agentId, walletAddress, capability, priceUsdc, bondedAmountUsdc } =
    await req.json();

  // --- 1. Resolve private key for this agent ---
  const envKey = AGENT_KEY_MAP[agentId];
  if (!envKey) {
    return NextResponse.json(
      { ok: false, error: `Unknown agentId: ${agentId}` },
      { status: 400 }
    );
  }

  const privateKey = process.env[envKey];
  if (!privateKey) {
    return NextResponse.json(
      { ok: false, error: `Missing env var: ${envKey}` },
      { status: 500 }
    );
  }

  // --- 2. Set up provider + signer ---
  const provider = new ethers.JsonRpcProvider(ARC_TESTNET_RPC);
  const signer = new ethers.Wallet(privateKey, provider);

  // --- 3. Encode amount (USDC has 6 decimals) ---
  const amountRaw = BigInt(Math.round(bondedAmountUsdc * 1_000_000)); // e.g. 1.5 USDC → 1500000n

  // --- 4. Call bond() on-chain ---
  let txHash: string;
  try {
    const contract = new ethers.Contract(
      REPUTATION_BOND_ADDRESS,
      REPUTATION_BOND_ABI,
      signer
    );

    const tx = await contract.bond(amountRaw);
    console.log(`[bond] tx sent: ${tx.hash} (agent: ${agentId})`);
    txHash = tx.hash;

    // Wait for 1 confirmation before registering
    await tx.wait(1);
    console.log(`[bond] confirmed: ${txHash}`);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[bond] on-chain call failed:`, message);
    return NextResponse.json(
      { ok: false, error: `On-chain bond() failed: ${message}` },
      { status: 500 }
    );
  }

  // --- 5. Register in-memory cache (used by orchestrator for matching) ---
  registerProvider({
    agentId,
    walletAddress,
    capability,
    priceUsdc,
    bondedAmountUsdc,
    reputationScore: 0,
  });

  return NextResponse.json({ ok: true, txHash });
}