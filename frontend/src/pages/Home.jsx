import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, Card, CardContent, Chip, Container, Grid, Stack, Typography } from '@mui/material';
import { useWallet } from '../services/walletContextStore';

const steps = [
  { number: '01', title: 'A policy is issued', copy: 'An administrator creates a policy with clear premium, coverage and expiry terms.' },
  { number: '02', title: 'The customer is covered', copy: 'The policyholder pays the exact premium from their connected local wallet.' },
  { number: '03', title: 'A claim is reviewed', copy: 'The customer submits one eligible claim; the administrator records a decision on-chain.' },
];

const features = [
  { mark: '01', title: 'Rules you can inspect', copy: 'Policy and claim permissions are enforced by the Solidity contract, not just by this interface.' },
  { mark: '02', title: 'A visible audit trail', copy: 'Confirmed contract events include transaction hashes and block information for review.' },
  { mark: '03', title: 'Local by design', copy: 'This demonstration uses the Hardhat Local network and test ETH. It never needs a public chain.' },
];

export default function Home() {
  const { account, isAdmin, connectWallet, workspace } = useWallet();
  const destination = isAdmin ? '/admin' : '/dashboard';
  return (
    <>
      <Box className="hero-wrap">
        <Container maxWidth="xl">
          <Grid container spacing={{ xs: 5, md: 8 }} alignItems="center" className="hero-grid">
            <Grid size={{ xs: 12, md: 7 }}>
              <Chip label="LOCAL BLOCKCHAIN DEMONSTRATION" className="hero-kicker" />
              <Typography variant="h1" className="hero-title">Insurance that makes every step <span>visible.</span></Typography>
              <Typography className="hero-description">
                InsureChain brings policy details, claim decisions and payout records into one clear workflow, backed by smart-contract rules you can inspect.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} className="hero-actions">
                {account ? (
                  <Button component={RouterLink} to={destination} variant="contained" size="large">Open {isAdmin ? 'admin workspace' : 'my dashboard'}</Button>
                ) : (
                  <Button onClick={connectWallet} variant="contained" size="large">Connect wallet</Button>
                )}
                <Button component={RouterLink} to={account ? destination : '#how-it-works'} size="large" className="secondary-hero-button">
                  {account ? 'View workspace' : 'See how it works'}
                </Button>
              </Stack>
              <Stack direction="row" spacing={1} className="hero-trust-row">
                <span className="trust-dot" />
                <Typography variant="body2">Hardhat Local · Chain ID 31337 · Test ETH only</Typography>
              </Stack>
              {workspace.error && <Typography className="hero-setup-note">{workspace.error}</Typography>}
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <Card className="hero-visual-card">
                <CardContent>
                  <Box className="visual-topline"><span>CONTRACT EVENTS</span><span className="visual-live"><i /> LOCAL CHAIN</span></Box>
                  <Box className="visual-policy-card">
                    <Typography variant="caption">INSURECHAIN WORKFLOW</Typography>
                    <Box className="visual-policy-main"><Typography variant="h5">Policy → Claim</Typography><Chip label="Test network" size="small" /></Box>
                    <Typography variant="body2" className="visual-workflow-note">Every real transaction is recorded by the local contract.</Typography>
                  </Box>
                  <Stack spacing={1.25} className="visual-event-list">
                    {['PolicyCreated · coverage issued', 'ClaimSubmitted · review requested', 'ClaimPaid · payout recorded'].map((item, index) => (
                      <Box className="visual-event" key={item}>
                          <span className="visual-check">0{index + 1}</span>
                        <Typography variant="body2">{item}</Typography>
                        <span className="visual-event-index">0{index + 1}</span>
                      </Box>
                    ))}
                  </Stack>
                  <Typography className="visual-footnote">Event names describe contract capabilities, not live activity.</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="xl" className="landing-sections">
        <Box id="how-it-works" className="section-block">
          <Box className="section-intro">
            <Typography className="eyebrow">HOW IT WORKS</Typography>
            <Typography variant="h3">One policy. A clear path from premium to decision.</Typography>
          </Box>
          <Grid container spacing={2.5}>
            {steps.map((step) => (
              <Grid size={{ xs: 12, md: 4 }} key={step.number}>
                <Card className="step-card"><CardContent>
                  <Typography className="step-number">{step.number}</Typography>
                  <Typography variant="h6">{step.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{step.copy}</Typography>
                </CardContent></Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        <Box className="section-block feature-section">
          <Box className="section-intro">
            <Typography className="eyebrow">BUILT FOR CLARITY</Typography>
            <Typography variant="h3">A practical view of blockchain insurance.</Typography>
          </Box>
          <Grid container spacing={2.5}>
            {features.map((feature) => (
              <Grid size={{ xs: 12, md: 4 }} key={feature.mark}>
                <Box className="feature-item"><span className="feature-mark">{feature.mark}</span><Typography variant="h6">{feature.title}</Typography><Typography variant="body2" color="text.secondary">{feature.copy}</Typography></Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
      <Box component="footer" className="site-footer"><Container maxWidth="xl"><Typography variant="body2">InsureChain · A local educational demonstration. Do not enter sensitive or real customer information.</Typography></Container></Box>
    </>
  );
}
