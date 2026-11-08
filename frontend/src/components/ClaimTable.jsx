import React from 'react';
import { Box, Button, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { formatEther } from 'ethers';
import { claimStatusLabel } from '../services/insurance';
import { formatDate } from '../services/formatters';
import StatusBadge from './StatusBadge';

export default function ClaimTable({ claims, admin = false, busy = false, onApprove, onReject, onPay, customerAddress = '' }) {
  return (
    <Card className="panel-card">
      <CardContent className="panel-content">
        <Box className="section-heading-row">
          <Box><Typography variant="h6" className="panel-title">{admin ? 'Claim review queue' : 'My claims'}</Typography><Typography variant="body2" color="text.secondary">Statuses update from confirmed contract state.</Typography></Box>
          <Typography variant="caption" color="text.secondary">{claims.length} total</Typography>
        </Box>
        {claims.length === 0 ? (
          <Box className="empty-state"><span className="empty-icon">◇</span><Typography variant="subtitle1">No claims yet</Typography><Typography variant="body2" color="text.secondary">{admin ? 'Submitted customer claims will appear in this queue.' : 'Claims submitted for your policies will appear here.'}</Typography></Box>
        ) : (
          <TableContainer className="responsive-table-wrap">
            <Table size="small" className="data-table">
              <TableHead><TableRow>
                <TableCell>Claim</TableCell><TableCell>Policy</TableCell>{admin && <TableCell>Claimant</TableCell>}
                <TableCell>Requested amount</TableCell><TableCell>Reason</TableCell><TableCell>Submitted</TableCell><TableCell>Status</TableCell><TableCell align="right">Action</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {claims.map((claim) => {
                  const status = claimStatusLabel(claim.status);
                  return (
                    <TableRow key={claim.id} hover>
                      <TableCell><Typography className="table-primary">#{claim.id}</Typography></TableCell>
                      <TableCell>#{claim.policyId}</TableCell>
                      {admin && <TableCell><Typography className="mono-address">{claim.claimant.slice(0, 8)}…{claim.claimant.slice(-6)}</Typography></TableCell>}
                      <TableCell>{formatEther(claim.amountWei)} ETH</TableCell>
                      <TableCell className="reason-cell">{claim.reason}</TableCell>
                      <TableCell>{formatDate(claim.submittedAt)}</TableCell>
                      <TableCell><StatusBadge label={status} /></TableCell>
                      <TableCell align="right" className="table-actions">
                        {admin && status === 'Submitted' && <><Button size="small" onClick={() => onReject(claim)} disabled={busy}>Reject</Button><Button size="small" variant="contained" onClick={() => onApprove(claim)} disabled={busy}>Approve</Button></>}
                        {admin && status === 'Approved' && <Button size="small" variant="contained" onClick={() => onPay(claim)} disabled={busy}>Pay claim</Button>}
                        {admin && ['Paid', 'Rejected'].includes(status) && <Typography variant="caption" color="text.secondary">Complete</Typography>}
                        {!admin && customerAddress && claim.claimant.toLowerCase() !== customerAddress.toLowerCase() && <Typography variant="caption" color="text.secondary">—</Typography>}
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
