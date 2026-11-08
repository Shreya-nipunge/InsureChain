// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title A small, local-demo insurance policy and claim manager.
/// @notice Store only dummy claim reasons here. Blockchain data is public and permanent.
contract InsuranceContract {
    enum PolicyStatus {
        Inactive,
        Active,
        Expired
    }

    // None is used internally before a claim is created.
    enum ClaimStatus {
        None,
        Submitted,
        Approved,
        Rejected,
        Paid
    }

    struct Policy {
        uint256 policyId;
        address policyHolder;
        uint256 premiumWei;
        uint256 coverageWei;
        uint256 createdAt;
        uint256 expiryAt;
        PolicyStatus status;
        bool premiumPaid;
        bool claimSubmitted;
    }

    struct Claim {
        uint256 claimId;
        uint256 policyId;
        address claimant;
        uint256 amountWei;
        string reason;
        uint256 submittedAt;
        ClaimStatus status;
    }

    address public immutable admin;
    uint256 public policyCounter;
    uint256 public claimCounter;

    mapping(uint256 => Policy) public policies;
    mapping(uint256 => Claim) public claims;
    mapping(address => uint256[]) private _holderPolicyIds;

    // A simple reentrancy lock. It protects the external payout call below.
    uint256 private _reentrancyState = 1;

    event PolicyCreated(
        uint256 indexed policyId,
        address indexed policyHolder,
        uint256 premiumWei,
        uint256 coverageWei,
        uint256 createdAt,
        uint256 expiryAt
    );
    event PremiumPaid(uint256 indexed policyId, address indexed policyHolder, uint256 amountWei, uint256 paidAt);
    event ClaimSubmitted(
        uint256 indexed claimId,
        uint256 indexed policyId,
        address indexed claimant,
        uint256 amountWei,
        string reason,
        uint256 submittedAt
    );
    event ClaimApproved(uint256 indexed claimId, uint256 indexed policyId, address indexed admin, uint256 approvedAt);
    event ClaimRejected(uint256 indexed claimId, uint256 indexed policyId, address indexed admin, uint256 rejectedAt);
    event ClaimPaid(
        uint256 indexed claimId,
        uint256 indexed policyId,
        address indexed claimant,
        uint256 amountWei,
        uint256 paidAt
    );
    event ContractFunded(address indexed admin, uint256 amountWei, uint256 fundedAt);
    event PolicyDeactivated(uint256 indexed policyId, address indexed admin, uint256 deactivatedAt);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    modifier nonReentrant() {
        require(_reentrancyState == 1, "Reentrant call");
        _reentrancyState = 2;
        _;
        _reentrancyState = 1;
    }

    constructor() {
        admin = msg.sender;
    }

    /// @notice Admin creates a policy; duration is measured in whole days.
    function createPolicy(
        address policyHolder,
        uint256 premiumWei,
        uint256 coverageWei,
        uint256 durationDays
    ) external onlyAdmin returns (uint256 policyId) {
        require(policyHolder != address(0), "Invalid policyholder");
        require(premiumWei > 0, "Premium must be greater than zero");
        require(coverageWei > 0, "Coverage must be greater than zero");
        require(durationDays > 0, "Duration must be greater than zero");

        policyId = ++policyCounter;
        uint256 createdAt = block.timestamp;
        uint256 expiryAt = createdAt + (durationDays * 1 days);

        policies[policyId] = Policy({
            policyId: policyId,
            policyHolder: policyHolder,
            premiumWei: premiumWei,
            coverageWei: coverageWei,
            createdAt: createdAt,
            expiryAt: expiryAt,
            status: PolicyStatus.Active,
            premiumPaid: false,
            claimSubmitted: false
        });
        _holderPolicyIds[policyHolder].push(policyId);

        emit PolicyCreated(policyId, policyHolder, premiumWei, coverageWei, createdAt, expiryAt);
    }

    /// @notice Customer pays the exact premium once for their active policy.
    function payPremium(uint256 policyId) external payable {
        Policy storage policy = _getPolicy(policyId);
        require(msg.sender == policy.policyHolder, "Only policyholder");
        require(policy.status == PolicyStatus.Active, "Policy is not active");
        require(block.timestamp <= policy.expiryAt, "Policy has expired");
        require(!policy.premiumPaid, "Premium already paid");
        require(msg.value == policy.premiumWei, "Incorrect premium amount");

        policy.premiumPaid = true;
        emit PremiumPaid(policyId, msg.sender, msg.value, block.timestamp);
    }

    /// @notice Admin can deactivate an active policy before its expiry.
    function deactivatePolicy(uint256 policyId) external onlyAdmin {
        Policy storage policy = _getPolicy(policyId);
        require(policy.status == PolicyStatus.Active, "Policy is not active");
        policy.status = PolicyStatus.Inactive;
        emit PolicyDeactivated(policyId, msg.sender, block.timestamp);
    }

    /// @notice Customer submits one claim for their own paid, unexpired policy.
    function submitClaim(uint256 policyId, uint256 amountWei, string calldata reason)
        external
        returns (uint256 claimId)
    {
        Policy storage policy = _getPolicy(policyId);
        require(msg.sender == policy.policyHolder, "Only policyholder");
        require(policy.status == PolicyStatus.Active, "Policy is not active");
        require(block.timestamp <= policy.expiryAt, "Policy has expired");
        require(policy.premiumPaid, "Premium must be paid first");
        require(!policy.claimSubmitted, "Claim already submitted");
        require(amountWei > 0, "Claim amount must be greater than zero");
        require(amountWei <= policy.coverageWei, "Claim exceeds coverage");
        require(bytes(reason).length > 0, "Claim reason is required");

        claimId = ++claimCounter;
        policy.claimSubmitted = true;
        claims[claimId] = Claim({
            claimId: claimId,
            policyId: policyId,
            claimant: msg.sender,
            amountWei: amountWei,
            reason: reason,
            submittedAt: block.timestamp,
            status: ClaimStatus.Submitted
        });

        emit ClaimSubmitted(claimId, policyId, msg.sender, amountWei, reason, block.timestamp);
    }

    /// @notice Admin approves a submitted claim.
    function approveClaim(uint256 claimId) external onlyAdmin {
        Claim storage claim = _getClaim(claimId);
        require(claim.status == ClaimStatus.Submitted, "Claim is not submitted");
        claim.status = ClaimStatus.Approved;
        emit ClaimApproved(claimId, claim.policyId, msg.sender, block.timestamp);
    }

    /// @notice Admin rejects a submitted claim. Rejected claims cannot be reopened.
    function rejectClaim(uint256 claimId) external onlyAdmin {
        Claim storage claim = _getClaim(claimId);
        require(claim.status == ClaimStatus.Submitted, "Claim is not submitted");
        claim.status = ClaimStatus.Rejected;
        emit ClaimRejected(claimId, claim.policyId, msg.sender, block.timestamp);
    }

    /// @notice Admin pays an approved claim using checks-effects-interactions.
    function payClaim(uint256 claimId) external onlyAdmin nonReentrant {
        Claim storage claim = _getClaim(claimId);
        require(claim.status == ClaimStatus.Approved, "Claim is not approved");
        require(address(this).balance >= claim.amountWei, "Insufficient contract balance");

        // Record the completed state before transferring funds. A failed transfer reverts both.
        claim.status = ClaimStatus.Paid;
        (bool success, ) = payable(claim.claimant).call{value: claim.amountWei}("");
        require(success, "Payout transfer failed");

        emit ClaimPaid(claimId, claim.policyId, claim.claimant, claim.amountWei, block.timestamp);
    }

    /// @notice Admin deposits demo funds for claim payouts.
    function fundContract() external payable onlyAdmin {
        require(msg.value > 0, "Funding amount must be greater than zero");
        emit ContractFunded(msg.sender, msg.value, block.timestamp);
    }

    /// @notice Current effective status, including expiry based on the chain clock.
    function getPolicyStatus(uint256 policyId) external view returns (PolicyStatus) {
        Policy storage policy = _getPolicy(policyId);
        if (policy.status == PolicyStatus.Active && block.timestamp > policy.expiryAt) {
            return PolicyStatus.Expired;
        }
        return policy.status;
    }

    function getHolderPolicyIds(address policyHolder) external view returns (uint256[] memory) {
        return _holderPolicyIds[policyHolder];
    }

    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function _getPolicy(uint256 policyId) private view returns (Policy storage policy) {
        require(policyId > 0 && policyId <= policyCounter, "Invalid policy ID");
        policy = policies[policyId];
    }

    function _getClaim(uint256 claimId) private view returns (Claim storage claim) {
        require(claimId > 0 && claimId <= claimCounter, "Invalid claim ID");
        claim = claims[claimId];
    }
}
