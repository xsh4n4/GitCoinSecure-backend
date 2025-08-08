const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SecureHunt", function () {
  let bugBountyFactory;
  let githubRegistry;
  let owner;
  let hunter;
  let otherAccount;

  beforeEach(async function () {
    [owner, hunter, otherAccount] = await ethers.getSigners();

    // Deploy GitHubRegistry
    const GitHubRegistry = await ethers.getContractFactory("GitHubRegistry");
    githubRegistry = await GitHubRegistry.deploy();

    // Deploy BugBountyFactory
    const BugBountyFactory = await ethers.getContractFactory("BugBountyFactory");
    bugBountyFactory = await BugBountyFactory.deploy();
  });

  describe("GitHubRegistry", function () {
    it("Should register a developer", async function () {
      await githubRegistry.connect(hunter).registerDeveloper("testuser");
      
      const developer = await githubRegistry.getDeveloper(hunter.address);
      expect(developer.githubUsername).to.equal("testuser");
      expect(developer.walletAddress).to.equal(hunter.address);
      expect(developer.isVerified).to.be.false;
    });

    it("Should not allow duplicate GitHub usernames", async function () {
      await githubRegistry.connect(hunter).registerDeveloper("testuser");
      
      await expect(
        githubRegistry.connect(otherAccount).registerDeveloper("testuser")
      ).to.be.revertedWith("GitHub username already registered");
    });

    it("Should verify a developer", async function () {
      await githubRegistry.connect(hunter).registerDeveloper("testuser");
      await githubRegistry.verifyDeveloper(hunter.address);
      
      const developer = await githubRegistry.getDeveloper(hunter.address);
      expect(developer.isVerified).to.be.true;
    });
  });

  describe("BugBountyFactory", function () {
    it("Should create a bounty", async function () {
      const reward = ethers.parseEther("1.0");
      const deadline = Math.floor(Date.now() / 1000) + 86400; // 24 hours from now
      
      await expect(
        bugBountyFactory.createBounty(
          "Test Bounty",
          "Test Description",
          deadline,
          "High",
          { value: reward }
        )
      ).to.emit(bugBountyFactory, "BountyCreated");

      const bounties = await bugBountyFactory.getBounties();
      expect(bounties.length).to.equal(1);
    });

    it("Should not create bounty with zero reward", async function () {
      const deadline = Math.floor(Date.now() / 1000) + 86400;
      
      await expect(
        bugBountyFactory.createBounty(
          "Test Bounty",
          "Test Description",
          deadline,
          "High",
          { value: 0 }
        )
      ).to.be.revertedWith("Bounty reward must be greater than 0");
    });
  });

  describe("BugBounty", function () {
    let bountyAddress;
    let bugBounty;

    beforeEach(async function () {
      const reward = ethers.parseEther("1.0");
      const deadline = Math.floor(Date.now() / 1000) + 86400;
      
      const tx = await bugBountyFactory.createBounty(
        "Test Bounty",
        "Test Description",
        deadline,
        "High",
        { value: reward }
      );
      
      const receipt = await tx.wait();
      bountyAddress = receipt.logs[0].args[0];
      
      const BugBounty = await ethers.getContractFactory("BugBounty");
      bugBounty = BugBounty.attach(bountyAddress);
    });

    it("Should allow bug submission", async function () {
      await expect(
        bugBounty.connect(hunter).submitBug("QmTestHash123")
      ).to.emit(bugBounty, "SubmissionCreated");

      const submissions = await bugBounty.getSubmissions();
      expect(submissions.length).to.equal(1);
      expect(submissions[0].hunter).to.equal(hunter.address);
      expect(submissions[0].ipfsHash).to.equal("QmTestHash123");
    });

    it("Should allow owner to approve submission", async function () {
      await bugBounty.connect(hunter).submitBug("QmTestHash123");
      
      const initialBalance = await ethers.provider.getBalance(hunter.address);
      
      await expect(
        bugBounty.connect(owner).approveSubmission(0)
      ).to.emit(bugBounty, "SubmissionApproved");

      const finalBalance = await ethers.provider.getBalance(hunter.address);
      expect(finalBalance).to.be.gt(initialBalance);
    });

    it("Should allow owner to reject submission", async function () {
      await bugBounty.connect(hunter).submitBug("QmTestHash123");
      
      await expect(
        bugBounty.connect(owner).rejectSubmission(0, "Not a valid bug")
      ).to.emit(bugBounty, "SubmissionRejected");

      const submissions = await bugBounty.getSubmissions();
      expect(submissions[0].feedback).to.equal("Not a valid bug");
    });
  });
});

