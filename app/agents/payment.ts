/**
 * payment.ts
 * Memo-wrapped USDC payments via Circle's Developer-Controlled Wallets SDK.
 *
 * Every payment is wrapped through Arc's Memo contract so the on-chain
 * transfer carries the taskId as structured context — traceable to the
 * specific job it settled, not just "money moved."
 *
 * Uses the official Circle SDK instead of raw fetch, because it handles
 * generating a fresh entitySecretCiphertext on every call automatically —
 * that's RSA encryption against Circle's public key, not something worth
 * re-implementing by hand.
 */

import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import { ethers } from "ethers";

const CIRCLE_API_KEY = process.env.CIRCLE_API_KEY as string;
const CIRCLE_ENTITY_SECRET = process.env.CIRCLE_ENTITY_SECRET as string;
const CIRCLE_WALLET_ID = process.env.CIRCLE_WALLET_ID as string;

const circleClient = initiateDeveloperControlledWalletsClient({
  apiKey: CIRCLE_API_KEY,
  entitySecret: CIRCLE_ENTITY_SECRET,
});

// Arc testnet USDC system contract (native gas token on Arc)
const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";
// Arc testnet Memo contract
const MEMO_CONTRACT_ADDRESS = "0x5294E9927c3306DcBaDb03fe70b92e01cCede505";

const ERC20_TRANSFER_ABI = ["function transfer(address to, uint256 amount)"];

function encodeTransferCalldata(toAddress: string, amountUnits: number): string {
  const iface = new ethers.Interface(ERC20_TRANSFER_ABI);
  return iface.encodeFunctionData("transfer", [toAddress, amountUnits]);
}

function keccak256Hex(input: string): string {
  return ethers.keccak256(ethers.toUtf8Bytes(input));
}

function toHexBytes(input: string): string {
  return ethers.hexlify(ethers.toUtf8Bytes(input));
}

export interface MemoPaymentResult {
  txId: string;
  simulated: boolean;
}

/**
 * Sends a USDC payment wrapped with an on-chain memo tying it to taskId.
 * Falls back to a simulated tx id (sim_...) if the SDK call throws, so the
 * orchestrator flow never crashes mid-demo over a transient API issue —
 * check `simulated` to know whether it actually landed on-chain.
 */
export async function sendUSDCPaymentWithMemo(
  toAddress: string,
  amountUsdc: string,
  taskId: string
): Promise<MemoPaymentResult> {
  const amountUnits = Math.round(parseFloat(amountUsdc) * 1_000_000); // USDC = 6 decimals

  try {
    const response = await circleClient.createContractExecutionTransaction({
      walletId: CIRCLE_WALLET_ID,
      contractAddress: MEMO_CONTRACT_ADDRESS,
      abiFunctionSignature: "memo(address,bytes,bytes32,bytes)",
      abiParameters: [
        USDC_ADDRESS,
        encodeTransferCalldata(toAddress, amountUnits),
        keccak256Hex(`task-${taskId}`),
        toHexBytes(`task=${taskId}`),
      ],
      fee: {
        type: "level",
        config: {
          feeLevel: "LOW",
        },
      },
    });

    const realTxId = response?.data?.id;
    return {
      txId: realTxId ?? `sim_${crypto.randomUUID().replace(/-/g, "")}`,
      simulated: !realTxId,
    };
  } catch (err) {
    console.error("Circle contractExecution error:", err);
    return {
      txId: `sim_${crypto.randomUUID().replace(/-/g, "")}`,
      simulated: true,
    };
  }
}
