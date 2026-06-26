import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import { config } from "dotenv";

config({ path: ".env.local" });

const client = initiateDeveloperControlledWalletsClient({
  apiKey: process.env.CIRCLE_API_KEY,
  entitySecret: process.env.CIRCLE_ENTITY_SECRET,
});

async function main() {
  console.log("--- Wallet Sets ---");
  try {
    const walletSets = await client.listWalletSets({});
    console.log(JSON.stringify(walletSets.data, null, 2));
  } catch (err) {
    console.error("listWalletSets error:", err.message ?? err);
  }

  console.log("\n--- Wallets ---");
  try {
    const wallets = await client.listWallets({});
    console.log(JSON.stringify(wallets.data, null, 2));
  } catch (err) {
    console.error("listWallets error:", err.message ?? err);
  }
}

main();
