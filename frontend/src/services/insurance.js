import { Contract, JsonRpcProvider, isAddress } from 'ethers';
import InsuranceArtifact from '../abis/InsuranceContract.json';

export const LOCAL_CHAIN_ID = 31337n;
export const LOCAL_CHAIN_ID_HEX = '0x7a69';
export const LOCAL_RPC_URL = 'http://127.0.0.1:8545';
export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '';
export const POLICY_STATUS = { INACTIVE: 0, ACTIVE: 1, EXPIRED: 2 };
export const CLAIM_STATUS = { NONE: 0, SUBMITTED: 1, APPROVED: 2, REJECTED: 3, PAID: 4 };

export function createReadProvider() {
  return new JsonRpcProvider(LOCAL_RPC_URL, {
    name: 'hardhat-local',
    chainId: Number(LOCAL_CHAIN_ID),
  });
}

export async function createReadContract(provider = createReadProvider()) {
  if (!CONTRACT_ADDRESS || !isAddress(CONTRACT_ADDRESS)) {
    throw new Error('No valid contract address was found. Deploy locally or set VITE_CONTRACT_ADDRESS, then restart Vite.');
  }

  const rpcChainId = BigInt(await provider.send('eth_chainId', []));
  if (rpcChainId !== LOCAL_CHAIN_ID) {
    throw new Error(`The configured RPC reports chain ${rpcChainId}. InsureChain requires Hardhat Local, chain ID ${LOCAL_CHAIN_ID}.`);
  }
  const code = await provider.getCode(CONTRACT_ADDRESS);
  if (code === '0x') {
    throw new Error('No contract is deployed at the configured address on Hardhat Local. Start the local chain and deploy InsuranceContract.');
  }

  return new Contract(CONTRACT_ADDRESS, InsuranceArtifact.abi, provider);
}

export function explainError(error) {
  const code = error?.code ?? error?.error?.code;
  const message = String(
    error?.shortMessage || error?.reason || error?.info?.error?.message || error?.message || 'The request could not be completed.',
  );

  if (code === 4001 || /user rejected|user denied|action_rejected/i.test(message)) {
    return 'You cancelled the wallet request. No transaction was sent.';
  }
  if (/Only admin/i.test(message)) return 'This action is available only to the contract administrator.';
  if (/Only policyholder/i.test(message)) return 'Connect the wallet that owns this policy to continue.';
  if (/Insufficient funds|insufficient funds/i.test(message)) return 'This local wallet does not have enough test ETH for the transaction and gas.';
  if (/Incorrect premium/i.test(message)) return 'The premium must match the exact amount shown for this policy.';
  if (/Claim exceeds coverage/i.test(message)) return 'The requested amount is higher than the policy coverage.';
  if (/Claim already submitted/i.test(message)) return 'This policy already has a claim. The contract allows one claim per policy.';
  if (/Premium must be paid first/i.test(message)) return 'Pay this policy’s premium before submitting a claim.';
  if (/Policy has expired/i.test(message)) return 'This policy has expired and can no longer accept payments or claims.';
  if (/Policy is not active/i.test(message)) return 'This policy is inactive and cannot be used for this action.';
  if (/Claim is not submitted/i.test(message)) return 'This claim has already been reviewed or is not awaiting a decision.';
  if (/Claim is not approved/i.test(message)) return 'Only approved claims can be paid.';
  if (/Insufficient contract balance/i.test(message)) return 'The contract balance is too low. The administrator must fund it before payout.';
  if (/Invalid policy ID/i.test(message)) return 'That policy ID does not exist.';
  if (/Invalid claim ID/i.test(message)) return 'That claim ID does not exist.';
  if (/network|chain/i.test(message) && /wrong|unsupported|mismatch/i.test(message)) return 'Switch MetaMask to Hardhat Local (chain ID 31337).';
  if (/could not coalesce|missing revert data|CALL_EXCEPTION/i.test(message)) {
    return 'The contract rejected this request. Check eligibility, status, and available test ETH, then try again.';
  }
  return message.length > 220 ? `${message.slice(0, 217)}…` : message;
}

export function policyStatusLabel(status) {
  return ['Inactive', 'Active', 'Expired'][Number(status)] || 'Unknown';
}

export function claimStatusLabel(status) {
  return ['None', 'Submitted', 'Approved', 'Rejected', 'Paid'][Number(status)] || 'Unknown';
}

export function eventDescription(event) {
  const args = event.args;
  const policyId = args.policyId?.toString();
  const claimId = args.claimId?.toString();
  switch (event.eventName) {
    case 'PolicyCreated': return { title: 'Policy created', reference: `Policy #${policyId}` };
    case 'PolicyDeactivated': return { title: 'Policy deactivated', reference: `Policy #${policyId}` };
    case 'PremiumPaid': return { title: 'Premium paid', reference: `Policy #${policyId}` };
    case 'ClaimSubmitted': return { title: 'Claim submitted', reference: `Claim #${claimId} · Policy #${policyId}` };
    case 'ClaimApproved': return { title: 'Claim approved', reference: `Claim #${claimId}` };
    case 'ClaimRejected': return { title: 'Claim rejected', reference: `Claim #${claimId}` };
    case 'ClaimPaid': return { title: 'Claim paid', reference: `Claim #${claimId}` };
    case 'ContractFunded': return { title: 'Contract funded', reference: 'Payout reserve' };
    default: return { title: event.eventName || 'Contract event', reference: 'Blockchain record' };
  }
}
