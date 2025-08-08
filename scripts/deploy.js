const hre = require("hardhat");

async function main() {
  console.log("Deploying SecureHunt contracts...");

  // Deploy GitHubRegistry first
  const GitHubRegistry = await hre.ethers.getContractFactory("GitHubRegistry");
  const githubRegistry = await GitHubRegistry.deploy();
  await githubRegistry.waitForDeployment();
  console.log("GitHubRegistry deployed to:", await githubRegistry.getAddress());

  // Deploy BugBountyFactory
  const BugBountyFactory = await hre.ethers.getContractFactory("BugBountyFactory");
  const bugBountyFactory = await BugBountyFactory.deploy();
  await bugBountyFactory.waitForDeployment();
  console.log("BugBountyFactory deployed to:", await bugBountyFactory.getAddress());

  // Save deployment addresses
  const deploymentInfo = {
    GitHubRegistry: await githubRegistry.getAddress(),
    BugBountyFactory: await bugBountyFactory.getAddress(),
    network: hre.network.name,
    timestamp: new Date().toISOString()
  };

  console.log("\nDeployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Save to file for frontend integration
  const fs = require('fs');
  fs.writeFileSync(
    './deployments.json',
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\nDeployment addresses saved to deployments.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

