import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import { config } from "dotenv";

config({ path: ".env.local" });

const client = initiateDeveloperControlledWalletsClient({
  apiKey: process.env.CIRCLE_API_KEY,
  entitySecret: process.env.CIRCLE_ENTITY_SECRET,
});

const transactionId = process.argv[2];

if (!transactionId) {
  console.error("Usage: node check-tx.mjs <transactionId>");
  process.exit(1);
}

async function main() {
  const response = await client.getTransaction({ id: transactionId });
  console.log(JSON.stringify(response.data, null, 2));
}

main().catch((err) => {
  console.error("Error:", err.message ?? err);
});
