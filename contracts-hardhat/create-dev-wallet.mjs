import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import { config } from "dotenv";

config({ path: ".env.local" });

const client = initiateDeveloperControlledWalletsClient({
  apiKey: process.env.CIRCLE_API_KEY,
  entitySecret: process.env.CIRCLE_ENTITY_SECRET,
});

async function main() {
  console.log("Creating wallet set...");
  const walletSetResponse = await client.createWalletSet({
    name: "swarm-dev-wallets",
  });

  const walletSet = walletSetResponse.data?.walletSet;
  console.log("Wallet set created:", JSON.stringify(walletSet, null, 2));

  if (!walletSet?.id) {
    console.error("No wallet set id returned — stopping.");
    return;
  }

  console.log("\nCreating wallet on ARC-TESTNET...");
  const walletResponse = await client.createWallets({
    walletSetId: walletSet.id,
    blockchains: ["ARC-TESTNET"],
    count: 1,
    accountType: "EOA",
  });

  console.log("Wallet created:", JSON.stringify(walletResponse.data, null, 2));
  console.log("\n=== COPY THIS ===");
  console.log("walletSetId:", walletSet.id);
  const newWallet = walletResponse.data?.wallets?.[0];
  if (newWallet) {
    console.log("walletId (use as CIRCLE_WALLET_ID):", newWallet.id);
    console.log("address (fund this via faucet):", newWallet.address);
  }
}

main().catch((err) => {
  console.error("Error:", err.message ?? err);
});
