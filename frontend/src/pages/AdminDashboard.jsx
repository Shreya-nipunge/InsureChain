import React, { useMemo, useState } from 'react';
import {
  Alert, Box, Button, Card, CardContent, Grid, Stack, TextField, Typography,
} from '@mui/material';
import { formatEther, isAddress, parseEther, ZeroAddress } from 'ethers';
import ClaimTable from '../components/ClaimTable';
import MetricCard from '../components/MetricCard';
import PolicyTable from '../components/PolicyTable';
import TransactionHistory from '../components/TransactionHistory';
import { CLAIM_STATUS } from '../services/insurance';
import { useWallet } from '../services/walletContextStore';

export default function AdminDashboard() {
  const { account, adminAddress, isLocalNetwork, workspace, transaction, executeTransaction, switchToLocalNetwork, refresh } = useWallet();
  const [holder, setHolder] = useState('');
  const [premium, setPremium] = useState('');
  const [coverage, setCoverage] = useState('');
  const [duration, setDuration] = useState('30');
  const [fundAmount, setFundAmount] = useState('');
  const [policyError, setPolicyError] = useState('');
  const [fundError, setFundError] = useState('');
  const busy = transaction?.status === 'pending';
  const counts = useMemo(() => ({
    submitted: workspace.claims.filter((claim) => claim.status === CLAIM_STATUS.SUBMITTED).length,
    approved: workspace.claims.filter((claim) => claim.status === CLAIM_STATUS.APPROVED).length,
    rejected: workspace.claims.filter((claim) => claim.status === CLAIM_STATUS.REJECTED).length,
    paid: workspace.claims.filter((claim) => claim.status === CLAIM_STATUS.PAID).length,
  }), [workspace.claims]);

  const createPolicy = async (event) => {
    event.preventDefault();
    setPolicyError('');
    if (!isAddress(holder) || holder.toLowerCase() === ZeroAddress.toLowerCase()) {
      setPolicyError('Enter a valid, non-zero customer wallet address.');
      return;
    }
    let premiumWei;
    let coverageWei;
    try {
      premiumWei = parseEther(premium);
      coverageWei = parseEther(coverage);
    } catch {
      setPolicyError('Enter premium and coverage as valid ETH amounts.');
      return;
    }
    const days = Number(duration);
    if (premiumWei <= 0n || coverageWei <= 0n) {
      setPolicyError('Premium and coverage must both be greater than zero.');
      return;
    }
    if (!Number.isInteger(days) || days < 1 || days > 3650) {
      setPolicyError('Policy validity must be a whole number between 1 and 3650 days.');
      return;
    }
    const receipt = await executeTransaction('Policy creation', (contract) => contract.createPolicy(holder, premiumWei, coverageWei, BigInt(days)));
    if (receipt) {
      setHolder('');
      setPremium('');
      setCoverage('');
      setDuration('30');
    }
  };

  const fundContract = async (event) => {
    event.preventDefault();
    setFundError('');
    let amountWei;
    try { amountWei = parseEther(fundAmount); } catch {
      setFundError('Enter a valid funding amount in ETH.');
      return;
    }
    if (amountWei <= 0n) {
      setFundError('Funding amount must be greater than zero.');
      return;
    }
    const receipt = await executeTransaction('Contract funding', (contract) => contract.fundContract({ value: amountWei }));
    if (receipt) setFundAmount('');
  };

  const review = (action, claim) => executeTransaction(
    action === 'approve' ? 'Claim approval' : 'Claim rejection',
    (contract) => action === 'approve' ? contract.approveClaim(claim.id) : contract.rejectClaim(claim.id),
  );
  const payClaim = (claim) => executeTransaction('Claim payout', (contract) => contract.payClaim(claim.id));
  const deactivatePolicy = (policy) => executeTransaction('Policy deactivation', (contract) => contract.deactivatePolicy(policy.id));

  return (
    <Box className="workspace-page">
      <Box className="page-heading">
        <Box><Typography className="eyebrow">ADMINISTRATION</Typography><Typography variant="h4">Operations dashboard</Typography><Typography color="text.secondary">Create policies, review claims and manage the local payout reserve.</Typography></Box>
        <Stack spacing={1} alignItems="flex-end"><Button variant="outlined" onClick={refresh} disabled={workspace.loading}>Refresh data</Button><Box className="admin-address"><Typography variant="caption">CONTRACT ADMIN</Typography><Typography className="mono-address">{adminAddress?.slice(0, 8)}…{adminAddress?.slice(-6)}</Typography></Box></Stack>
      </Box>
      {!isLocalNetwork && <Alert severity="warning" action={<Button onClick={switchToLocalNetwork}>Switch network</Button>} className="page-alert">Switch MetaMask to Hardhat Local (chain ID 31337) before making changes.</Alert>}
      {workspace.error && <Alert severity="error" className="page-alert">{workspace.error}</Alert>}
      {account?.toLowerCase() !== adminAddress?.toLowerCase() && <Alert severity="error" className="page-alert">The connected wallet is not the contract administrator. Reconnect the administrator account.</Alert>}

      <Grid container spacing={2} className="metrics-grid admin-metrics">
        <Grid size={{ xs: 6, md: 3 }}><MetricCard label="Policies" value={workspace.loading ? '—' : workspace.policies.length} detail="All created policies" /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><MetricCard label="Claims" value={workspace.loading ? '—' : workspace.claims.length} detail="All submitted claims" tone="blue" /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><MetricCard label="Pending claims" value={workspace.loading ? '—' : counts.submitted} detail="Awaiting decision" tone="gold" /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><MetricCard label="Approved" value={workspace.loading ? '—' : counts.approved} detail="Awaiting payout" tone="blue" /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><MetricCard label="Rejected" value={workspace.loading ? '—' : counts.rejected} detail="Decision recorded" tone="rose" /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><MetricCard label="Paid" value={workspace.loading ? '—' : counts.paid} detail="Payout completed" tone="violet" /></Grid>
        <Grid size={{ xs: 12, md: 6 }}><MetricCard label="Contract balance" value={workspace.loading ? '—' : `${formatEther(workspace.balanceWei)} ETH`} detail="Premiums received plus admin funding, less payouts" tone="green" /></Grid>
      </Grid>

      <Grid container spacing={2.5} className="admin-forms-grid">
        <Grid size={{ xs: 12, lg: 7 }}>
          <Card className="panel-card form-panel"><CardContent className="panel-content">
            <Typography className="eyebrow">NEW COVER</Typography><Typography variant="h6" className="panel-title">Create a policy</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>Amounts are entered in ETH and converted to wei before the transaction.</Typography>
            <Box component="form" onSubmit={createPolicy} className="form-grid">
              <TextField label="Customer wallet address" value={holder} onChange={(event) => setHolder(event.target.value)} fullWidth placeholder="0x…" className="form-span-two" />
              <TextField label="Premium (ETH)" value={premium} onChange={(event) => setPremium(event.target.value)} type="number" inputProps={{ min: '0', step: 'any' }} fullWidth />
              <TextField label="Maximum coverage (ETH)" value={coverage} onChange={(event) => setCoverage(event.target.value)} type="number" inputProps={{ min: '0', step: 'any' }} fullWidth />
              <TextField label="Validity (days)" value={duration} onChange={(event) => setDuration(event.target.value)} type="number" inputProps={{ min: 1, max: 3650, step: 1 }} fullWidth />
              <Box className="form-submit"><Button type="submit" variant="contained" disabled={busy || !isLocalNetwork}>{busy ? 'Waiting for confirmation…' : 'Create policy'}</Button></Box>
            </Box>
            {policyError && <Alert severity="error" sx={{ mt: 2 }}>{policyError}</Alert>}
          </CardContent></Card>
        </Grid>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Card className="panel-card form-panel funding-panel"><CardContent className="panel-content">
            <Typography className="eyebrow">PAYOUT RESERVE</Typography><Typography variant="h6" className="panel-title">Fund the contract</Typography>
            <Typography variant="body2" color="text.secondary">Local test ETH available for approved claim payouts.</Typography>
            <Box className="balance-large">{formatEther(workspace.balanceWei)} <span>ETH</span></Box>
            <Box component="form" onSubmit={fundContract} className="funding-form">
              <TextField label="Funding amount (ETH)" value={fundAmount} onChange={(event) => setFundAmount(event.target.value)} type="number" inputProps={{ min: '0', step: 'any' }} fullWidth />
              <Button type="submit" variant="outlined" disabled={busy || !isLocalNetwork}>{busy ? 'Confirming…' : 'Add test ETH'}</Button>
            </Box>
            {fundError && <Alert severity="error" sx={{ mt: 2 }}>{fundError}</Alert>}
          </CardContent></Card>
        </Grid>
      </Grid>

      {workspace.loading ? <Card className="loading-panel"><Typography>Reading contract records…</Typography></Card> : (
        <Stack spacing={2.5}>
          <PolicyTable policies={workspace.policies} admin busy={busy || !isLocalNetwork} onDeactivate={deactivatePolicy} />
          <ClaimTable claims={workspace.claims} admin busy={busy || !isLocalNetwork} onApprove={(claim) => review('approve', claim)} onReject={(claim) => review('reject', claim)} onPay={payClaim} />
          <TransactionHistory events={workspace.events} limit={12} />
        </Stack>
      )}
    </Box>
  );
}
