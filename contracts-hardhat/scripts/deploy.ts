import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { config as loadEnv } from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

loadEnv({ path: ".env" });

async function main() {
  const RPC_URL = "https://rpc.testnet.arc.network";
  const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";
  const RESOLVER_ADDRESS = "0x10BCe5F553779251aF0b29293D1D9dbB6925C7BE";
  const SLASH_POOL_ADDRESS = "0x10BCe5F553779251aF0b29293D1D9dbB6925C7BE";

  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("DEPLOYER_PRIVATE_KEY not found in .env");
  }

  // Load the compiled artifact Hardhat already produced
  const artifactPath = path.join(
    __dirname,
    "..",
    "artifacts",
    "contracts",
    "ReputationBond.sol",
    "ReputationBond.json"
  );

  if (!fs.existsSync(artifactPath)) {
    throw new Error(
      `Artifact not found at ${artifactPath}. Run "npx hardhat compile" first.`
    );
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log("Deploying ReputationBond...");
  console.log("Deployer address:", wallet.address);

  const balance = await provider.getBalance(wallet.address);
  console.log("Deployer balance (native):", ethers.formatEther(balance));

  const factory = new ethers.ContractFactory(
    artifact.abi,
    artifact.bytecode,
    wallet
  );

  const contract = await factory.deploy(
    USDC_ADDRESS,
    RESOLVER_ADDRESS,
    SLASH_POOL_ADDRESS
  );

  console.log("Deploy tx sent:", contract.deploymentTransaction()?.hash);
  await contract.waitForDeployment();

  const deployedAddress = await contract.getAddress();
  console.log("ReputationBond deployed at:", deployedAddress);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
