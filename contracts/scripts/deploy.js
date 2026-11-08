const fs = require("node:fs");
const path = require("node:path");
const { ethers, network } = require("hardhat");

async function main() {
  if (network.name !== "localhost") {
    throw new Error("Refusing deployment: use --network localhost with a local Hardhat node.");
  }

  const outputDirectory = path.join(__dirname, "..", "deployments", "localhost");
  const outputFile = path.join(outputDirectory, "insurance-contract.json");
  if (fs.existsSync(outputFile)) {
    throw new Error(
      `Deployment file already exists at ${outputFile}. Back it up or remove that specific local deployment file before redeploying.`
    );
  }

  const [administrator] = await ethers.getSigners();
  const InsuranceContract = await ethers.getContractFactory("InsuranceContract");
  const insurance = await InsuranceContract.deploy();
  const deploymentTransaction = insurance.deploymentTransaction();
  await insurance.waitForDeployment();
  const deploymentReceipt = await deploymentTransaction.wait();
  const address = await insurance.getAddress();
  const block = await ethers.provider.getBlock(deploymentReceipt.blockNumber);

  const deployment = {
    contractName: "InsuranceContract",
    network: network.name,
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    address,
    administrator: administrator.address,
    transactionHash: deploymentReceipt.hash,
    deployedAt: block.timestamp,
  };

  fs.mkdirSync(outputDirectory, { recursive: true });
  // Exclusive create prevents accidentally replacing an existing deployment record.
  fs.writeFileSync(outputFile, `${JSON.stringify(deployment, null, 2)}\n`, { flag: "wx" });

  console.log(`InsuranceContract deployed to: ${address}`);
  console.log(`Administrator: ${administrator.address}`);
  console.log(`Deployment record: ${outputFile}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
