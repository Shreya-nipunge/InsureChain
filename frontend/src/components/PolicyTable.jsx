import React from 'react';
import { Box, Button, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { POLICY_STATUS } from '../services/insurance';
import { formatDate, formatEth } from '../services/formatters';
import StatusBadge from './StatusBadge';

export default function PolicyTable({ policies, admin = false, onPayPremium, onSubmitClaim, onDeactivate, onDetails, busy = false }) {
  return (
    <Card className="panel-card">
      <CardContent className="panel-content">
        <Box className="section-heading-row">
          <Box><Typography variant="h6" className="panel-title">{admin ? 'All policies' : 'My policies'}</Typography><Typography variant="body2" color="text.secondary">Policy records from the local contract.</Typography></Box>
          <Typography variant="caption" color="text.secondary">{policies.length} total</Typography>
        </Box>
        {policies.length === 0 ? (
          <Box className="empty-state"><span className="empty-icon">▤</span><Typography variant="subtitle1">No policies yet</Typography><Typography variant="body2" color="text.secondary">{admin ? 'Create a policy to begin the demonstration.' : 'Policies issued to this wallet will appear here.'}</Typography></Box>
        ) : (
          <TableContainer className="responsive-table-wrap">
            <Table size="small" className="data-table">
              <TableHead><TableRow>
                <TableCell>Policy</TableCell>{admin && <TableCell>Policyholder</TableCell>}
                <TableCell>Coverage</TableCell><TableCell>Premium</TableCell><TableCell>Expires</TableCell>
                <TableCell>Policy status</TableCell><TableCell>Premium</TableCell><TableCell>Claim</TableCell><TableCell align="right">Action</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {policies.map((policy) => {
                  const active = policy.status === POLICY_STATUS.ACTIVE;
                  const canClaim = active && policy.premiumPaid && !policy.claimSubmitted;
                  return (
                    <TableRow key={policy.id} hover>
                      <TableCell><Typography className="table-primary">#{policy.id}</Typography><Typography variant="caption" color="text.secondary">Created {formatDate(policy.createdAt)}</Typography></TableCell>
                      {admin && <TableCell><Typography className="mono-address">{policy.holder.slice(0, 8)}…{policy.holder.slice(-6)}</Typography></TableCell>}
                      <TableCell>{formatEth(policy.coverageWei)}</TableCell><TableCell>{formatEth(policy.premiumWei)}</TableCell><TableCell>{formatDate(policy.expiryAt)}</TableCell>
                      <TableCell><StatusBadge label={['Inactive', 'Active', 'Expired'][policy.status] || 'Unknown'} /></TableCell>
                      <TableCell><StatusBadge label={policy.premiumPaid ? 'Paid' : 'Unpaid'} /></TableCell>
                      <TableCell>{policy.claimSubmitted ? <StatusBadge label={policy.claimStatusLabel || 'Submitted'} /> : <Typography variant="body2" color="text.secondary">None</Typography>}</TableCell>
                      <TableCell align="right" className="table-actions">
                        {onDetails && <Button size="small" onClick={() => onDetails(policy)}>Details</Button>}
                        {onPayPremium && active && !policy.premiumPaid && <Button size="small" variant="contained" onClick={() => onPayPremium(policy)} disabled={busy}>Pay premium</Button>}
                        {onSubmitClaim && canClaim && <Button size="small" onClick={() => onSubmitClaim(policy)} disabled={busy}>Submit claim</Button>}
                        {admin && onDeactivate && active && <Button size="small" color="error" onClick={() => onDeactivate(policy)} disabled={busy}>Deactivate</Button>}
                        {admin && !active && <Typography variant="caption" color="text.secondary">No action</Typography>}
                        {!admin && policy.premiumPaid && policy.claimSubmitted && !onDetails && <Typography variant="caption" color="text.secondary">No action</Typography>}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
}
