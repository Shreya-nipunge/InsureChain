const { expect } = require("chai");
const { ethers, network } = require("hardhat");

describe("InsuranceContract", function () {
  const PREMIUM = 100n;
  const COVERAGE = 1_000n;
  const CLAIM_AMOUNT = 600n;
  const DURATION_DAYS = 30n;

  async function deployFixture() {
    const [admin, customer, other] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("InsuranceContract");
    const contract = await Factory.deploy();
    await contract.waitForDeployment();
    return { contract, admin, customer, other };
  }

  async function createPolicy(contract, customer, overrides = {}) {
    const values = {
      premium: overrides.premium ?? PREMIUM,
      coverage: overrides.coverage ?? COVERAGE,
      duration: overrides.duration ?? DURATION_DAYS,
    };
    await contract.createPolicy(customer.address, values.premium, values.coverage, values.duration);
    return { policyId: await contract.policyCounter(), ...values };
  }

  async function createPaidClaim(contract, customer, amount = CLAIM_AMOUNT) {
    const { policyId } = await createPolicy(contract, customer);
    await contract.connect(customer).payPremium(policyId, { value: PREMIUM });
    await contract.connect(customer).submitClaim(policyId, amount, "Demo incident");
    return { policyId, claimId: await contract.claimCounter() };
  }

  it("sets the deployer as admin", async function () {
    const { contract, admin } = await deployFixture();
    expect(await contract.admin()).to.equal(admin.address);
  });

  it("allows the admin to create a policy with unique ID and timestamps", async function () {
    const { contract, customer } = await deployFixture();
    await expect(contract.createPolicy(customer.address, PREMIUM, COVERAGE, DURATION_DAYS))
      .to.emit(contract, "PolicyCreated");
    const policy = await contract.policies(1);
    expect(policy.policyId).to.equal(1n);
    expect(policy.policyHolder).to.equal(customer.address);
    expect(policy.premiumWei).to.equal(PREMIUM);
    expect(policy.coverageWei).to.equal(COVERAGE);
    expect(policy.expiryAt).to.be.greaterThan(policy.createdAt);
    expect(policy.premiumPaid).to.equal(false);
    expect(policy.claimSubmitted).to.equal(false);
  });

  it("rejects policy creation by a non-admin", async function () {
    const { contract, customer, other } = await deployFixture();
    await expect(contract.connect(other).createPolicy(customer.address, PREMIUM, COVERAGE, DURATION_DAYS))
      .to.be.revertedWith("Only admin");
  });

  it("allows the policyholder to pay the exact premium", async function () {
    const { contract, customer } = await deployFixture();
    await createPolicy(contract, customer);
    await expect(contract.connect(customer).payPremium(1, { value: PREMIUM }))
      .to.emit(contract, "PremiumPaid");
    expect((await contract.policies(1)).premiumPaid).to.equal(true);
  });

  it("rejects an incorrect premium and a second premium payment", async function () {
    const { contract, customer } = await deployFixture();
    await createPolicy(contract, customer);
    await expect(contract.connect(customer).payPremium(1, { value: PREMIUM - 1n }))
      .to.be.revertedWith("Incorrect premium amount");
    await contract.connect(customer).payPremium(1, { value: PREMIUM });
    await expect(contract.connect(customer).payPremium(1, { value: PREMIUM }))
      .to.be.revertedWith("Premium already paid");
  });

  it("allows a paid policyholder to submit a valid claim", async function () {
    const { contract, customer } = await deployFixture();
    const { claimId } = await createPaidClaim(contract, customer);
    const claim = await contract.claims(claimId);
    expect(claim.claimant).to.equal(customer.address);
    expect(claim.amountWei).to.equal(CLAIM_AMOUNT);
    expect(claim.status).to.equal(1n); // Submitted
  });

  it("rejects a claim before premium payment", async function () {
    const { contract, customer } = await deployFixture();
    await createPolicy(contract, customer);
    await expect(contract.connect(customer).submitClaim(1, CLAIM_AMOUNT, "Demo incident"))
      .to.be.revertedWith("Premium must be paid first");
  });

  it("rejects duplicate claims for one policy", async function () {
    const { contract, customer } = await deployFixture();
    await createPaidClaim(contract, customer);
    await expect(contract.connect(customer).submitClaim(1, 10, "Another demo incident"))
      .to.be.revertedWith("Claim already submitted");
  });

  it("rejects zero-value claims and claims above coverage", async function () {
    const { contract, customer } = await deployFixture();
    await createPolicy(contract, customer);
    await contract.connect(customer).payPremium(1, { value: PREMIUM });
    await expect(contract.connect(customer).submitClaim(1, 0, "Demo incident"))
      .to.be.revertedWith("Claim amount must be greater than zero");
    await expect(contract.connect(customer).submitClaim(1, COVERAGE + 1n, "Demo incident"))
      .to.be.revertedWith("Claim exceeds coverage");
  });

  it("rejects approval by a non-admin and allows admin approval", async function () {
    const { contract, customer, other } = await deployFixture();
    const { claimId } = await createPaidClaim(contract, customer);
    await expect(contract.connect(other).approveClaim(claimId)).to.be.revertedWith("Only admin");
    await expect(contract.approveClaim(claimId)).to.emit(contract, "ClaimApproved");
    expect((await contract.claims(claimId)).status).to.equal(2n); // Approved
  });

  it("allows the admin to reject a submitted claim", async function () {
    const { contract, customer } = await deployFixture();
    const { claimId } = await createPaidClaim(contract, customer);
    await expect(contract.rejectClaim(claimId)).to.emit(contract, "ClaimRejected");
    expect((await contract.claims(claimId)).status).to.equal(3n); // Rejected
  });

  it("does not pay a rejected claim", async function () {
    const { contract, customer } = await deployFixture();
    const { claimId } = await createPaidClaim(contract, customer);
    await contract.rejectClaim(claimId);
    await expect(contract.payClaim(claimId)).to.be.revertedWith("Claim is not approved");
  });

  it("pays an approved claim to the policyholder", async function () {
    const { contract, customer } = await deployFixture();
    const { claimId } = await createPaidClaim(contract, customer);
    await contract.fundContract({ value: CLAIM_AMOUNT });
    await contract.approveClaim(claimId);
    const customerBefore = await ethers.provider.getBalance(customer.address);
    await expect(contract.payClaim(claimId)).to.emit(contract, "ClaimPaid");
    const customerAfter = await ethers.provider.getBalance(customer.address);
    expect(customerAfter - customerBefore).to.equal(CLAIM_AMOUNT);
    expect((await contract.claims(claimId)).status).to.equal(4n); // Paid
  });

  it("rejects payout processing by a non-admin", async function () {
    const { contract, customer, other } = await deployFixture();
    const { claimId } = await createPaidClaim(contract, customer);
    await contract.approveClaim(claimId);
    await expect(contract.connect(other).payClaim(claimId)).to.be.revertedWith("Only admin");
  });

  it("fails safely when the contract has insufficient payout funds", async function () {
    const { contract, customer } = await deployFixture();
    const { claimId } = await createPaidClaim(contract, customer, COVERAGE);
    await contract.approveClaim(claimId);
    await expect(contract.payClaim(claimId)).to.be.revertedWith("Insufficient contract balance");
    expect((await contract.claims(claimId)).status).to.equal(2n); // Still Approved
  });

  it("enforces expiry for premium payment and claim submission", async function () {
    const { contract, customer } = await deployFixture();
    const { duration } = await createPolicy(contract, customer, { duration: 1n });
    await contract.connect(customer).payPremium(1, { value: PREMIUM });
    const policy = await contract.policies(1);
    await network.provider.send("evm_setNextBlockTimestamp", [Number(policy.expiryAt) + 1]);
    await network.provider.send("evm_mine");
    expect(await contract.getPolicyStatus(1)).to.equal(2n); // Expired
    await expect(contract.connect(customer).payPremium(1, { value: PREMIUM }))
      .to.be.revertedWith("Policy has expired");
    await expect(contract.connect(customer).submitClaim(1, CLAIM_AMOUNT, "Demo incident"))
      .to.be.revertedWith("Policy has expired");
    expect(duration).to.equal(1n);
  });

  it("prevents claims on a policy deactivated by the admin", async function () {
    const { contract, customer } = await deployFixture();
    await createPolicy(contract, customer);
    await contract.connect(customer).payPremium(1, { value: PREMIUM });
    await expect(contract.deactivatePolicy(1)).to.emit(contract, "PolicyDeactivated");
    await expect(contract.connect(customer).submitClaim(1, CLAIM_AMOUNT, "Demo incident"))
      .to.be.revertedWith("Policy is not active");
  });

  it("validates zero addresses and unknown policy or claim IDs", async function () {
    const { contract, customer } = await deployFixture();
    await expect(contract.createPolicy(ethers.ZeroAddress, PREMIUM, COVERAGE, DURATION_DAYS))
      .to.be.revertedWith("Invalid policyholder");
    await expect(contract.connect(customer).payPremium(0, { value: PREMIUM }))
      .to.be.revertedWith("Invalid policy ID");
    await expect(contract.approveClaim(0)).to.be.revertedWith("Invalid claim ID");
  });
});
