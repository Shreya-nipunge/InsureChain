import React, { useMemo, useState } from 'react';
import {
  Alert, Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent,
  DialogTitle, Grid, Stack, TextField, Typography,
} from '@mui/material';
import { formatEther, parseEther } from 'ethers';
import { Link as RouterLink } from 'react-router-dom';
import ClaimTable from '../components/ClaimTable';
import MetricCard from '../components/MetricCard';
import PolicyTable from '../components/PolicyTable';
import TransactionHistory from '../components/TransactionHistory';
import { claimStatusLabel, CLAIM_STATUS, POLICY_STATUS } from '../services/insurance';
import { useWallet } from '../services/walletContextStore';

export default function Dashboard() {
  const {
    account, isAdmin, isLocalNetwork, connectWallet, switchToLocalNetwork, workspace,
    executeTransaction, transaction, refresh,
  } = useWallet();
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [detailsPolicy, setDetailsPolicy] = useState(null);
  const [claimAmount, setClaimAmount] = useState('');
  const [claimReason, setClaimReason] = useState('');
  const [formError, setFormError] = useState('');
  const busy = transaction?.status === 'pending';

  const policies = useMemo(() => workspace.policies
    .filter((policy) => account && policy.holder.toLowerCase() === account.toLowerCase())
    .map((policy) => {
      const claim = workspace.claims.find((item) => item.policyId === policy.id);
      return { ...policy, claimStatusLabel: claim ? claimStatusLabel(claim.status) : 'None' };
    }), [workspace.policies, workspace.claims, account]);
  const claims = useMemo(() => workspace.claims.filter((claim) => account && claim.claimant.toLowerCase() === account.toLowerCase()), [workspace.claims, account]);
  const activePolicies = policies.filter((policy) => policy.status === POLICY_STATUS.ACTIVE).length;
  const awaitingDecision = claims.filter((claim) => claim.status === CLAIM_STATUS.SUBMITTED).length;
  const paidClaims = claims.filter((claim) => claim.status === CLAIM_STATUS.PAID).length;

  const payPremium = (policy) => executeTransaction('Premium payment', (contract) => contract.payPremium(policy.id, { value: policy.premiumWei }));
  const openClaim = (policy) => {
    setSelectedPolicy(policy);
    setClaimAmount('');
    setClaimReason('');
    setFormError('');
  };

  const submitClaim = async () => {
    setFormError('');
    if (!selectedPolicy || !claimReason.trim()) {
      setFormError('Add a short dummy reason. Do not enter personal or sensitive information.');
      return;
    }
    let amountWei;
    try { amountWei = parseEther(claimAmount); } catch {
      setFormError('Enter a valid claim amount in ETH.');
      return;
    }
    if (amountWei <= 0n) {
      setFormError('Claim amount must be greater than zero.');
      return;
    }
    if (amountWei > selectedPolicy.coverageWei) {
      setFormError('Claim amount cannot exceed this policy’s coverage.');
      return;
    }
    const receipt = await executeTransaction('Claim submission', (contract) => contract.submitClaim(selectedPolicy.id, amountWei, claimReason.trim()));
    if (receipt) setSelectedPolicy(null);
  };

  if (!account) {
    return <Box className="workspace-page"><Box className="connect-panel"><span className="connect-symbol">↗</span><Typography className="eyebrow">CUSTOMER DASHBOARD</Typography><Typography variant="h4">Connect your wallet to continue</Typography><Typography color="text.secondary">InsureChain uses your wallet address to find policies and claims assigned to you. No private key is requested or stored.</Typography><Button variant="contained" onClick={connectWallet}>Connect MetaMask</Button>{workspace.error && <Alert severity="warning">{workspace.error}</Alert>}</Box></Box>;
  }

  return (
    <Box className="workspace-page">
      <Box className="page-heading">
        <Box><Typography className="eyebrow">CUSTOMER SPACE</Typography><Typography variant="h4">Your coverage, at a glance</Typography><Typography color="text.secondary">Manage policy payments and keep track of each claim decision.</Typography></Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1}>
          <Chip label={`Wallet ${account.slice(0, 6)}…${account.slice(-4)}`} variant="outlined" />
          <Button variant="outlined" onClick={refresh} disabled={workspace.loading}>Refresh data</Button>
        </Stack>
      </Box>
      {!isLocalNetwork && <Alert severity="warning" action={<Button onClick={switchToLocalNetwork}>Switch network</Button>} className="page-alert">Transactions require Hardhat Local (chain ID 31337).</Alert>}
      {workspace.error && <Alert severity="error" className="page-alert">{workspace.error}</Alert>}
      {isAdmin && <Alert severity="info" className="page-alert" action={<Button component={RouterLink} to="/admin">Open admin</Button>}>This wallet is the contract administrator. You can still view policies held by this address.</Alert>}
      <Grid container spacing={2} className="metrics-grid">
        <Grid size={{ xs: 6, md: 2.4 }}><MetricCard label="My policies" value={workspace.loading ? '—' : policies.length} detail="Assigned to this wallet" /></Grid>
        <Grid size={{ xs: 6, md: 2.4 }}><MetricCard label="Active policies" value={workspace.loading ? '—' : activePolicies} detail="Not expired or deactivated" tone="blue" /></Grid>
        <Grid size={{ xs: 6, md: 2.4 }}><MetricCard label="Claims submitted" value={workspace.loading ? '—' : claims.length} detail="Recorded on-chain" tone="violet" /></Grid>
        <Grid size={{ xs: 6, md: 2.4 }}><MetricCard label="Awaiting decision" value={workspace.loading ? '—' : awaitingDecision} detail="Pending admin review" tone="gold" /></Grid>
        <Grid size={{ xs: 6, md: 2.4 }}><MetricCard label="Claims paid" value={workspace.loading ? '—' : paidClaims} detail="Confirmed contract status" tone="green" /></Grid>
      </Grid>

      {workspace.loading ? <Card className="loading-panel"><Typography>Reading your records from Hardhat Local…</Typography></Card> : (
        <>
          <PolicyTable
            policies={policies}
            busy={busy || !isLocalNetwork}
            onPayPremium={payPremium}
            onSubmitClaim={openClaim}
            onDetails={setDetailsPolicy}
          />
          <ClaimTable claims={claims} customerAddress={account} />
          <TransactionHistory events={workspace.events} ownerAddress={account} policyIds={policies.map((policy) => policy.id)} claimIds={claims.map((claim) => claim.id)} />
        </>
      )}

      <Dialog open={Boolean(selectedPolicy)} onClose={() => !busy && setSelectedPolicy(null)} fullWidth maxWidth="sm">
        <DialogTitle>Submit a claim</DialogTitle>
        <DialogContent>
          {selectedPolicy && <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Policy #{selectedPolicy.id} · Coverage {formatEther(selectedPolicy.coverageWei)} ETH</Typography>}
          <TextField autoFocus fullWidth margin="normal" label="Requested amount (ETH)" type="number" value={claimAmount} onChange={(event) => setClaimAmount(event.target.value)} inputProps={{ min: '0', step: 'any' }} />
          <TextField fullWidth margin="normal" label="Dummy claim reason" value={claimReason} onChange={(event) => setClaimReason(event.target.value)} multiline minRows={3} helperText="Claim reasons are public and permanent on-chain. Use dummy text only." />
          {formError && <Alert severity="error" sx={{ mt: 1 }}>{formError}</Alert>}
        </DialogContent>
        <DialogActions><Button onClick={() => setSelectedPolicy(null)} disabled={busy}>Cancel</Button><Button variant="contained" onClick={submitClaim} disabled={busy || !isLocalNetwork}>{busy ? 'Waiting for confirmation…' : 'Submit claim'}</Button></DialogActions>
      </Dialog>

      <Dialog open={Boolean(detailsPolicy)} onClose={() => setDetailsPolicy(null)} fullWidth maxWidth="xs">
        <DialogTitle>Policy details</DialogTitle>
        <DialogContent>
          {detailsPolicy && <Stack spacing={1.5} className="details-list">
            <Detail label="Policy ID" value={`#${detailsPolicy.id}`} />
            <Detail label="Coverage" value={formatEther(detailsPolicy.coverageWei) + ' ETH'} />
            <Detail label="Premium" value={formatEther(detailsPolicy.premiumWei) + ' ETH'} />
            <Detail label="Created" value={new Date(detailsPolicy.createdAt * 1000).toLocaleString()} />
            <Detail label="Expires" value={new Date(detailsPolicy.expiryAt * 1000).toLocaleString()} />
            <Detail label="Premium payment" value={detailsPolicy.premiumPaid ? 'Paid' : 'Unpaid'} />
            <Detail label="Claim status" value={detailsPolicy.claimStatusLabel} />
          </Stack>}
        </DialogContent>
        <DialogActions><Button onClick={() => setDetailsPolicy(null)}>Close</Button></DialogActions>
      </Dialog>
    </Box>
  );
}

function Detail({ label, value }) {
  return <Box className="detail-row"><Typography variant="body2" color="text.secondary">{label}</Typography><Typography variant="body2" className="detail-value">{value}</Typography></Box>;
}
