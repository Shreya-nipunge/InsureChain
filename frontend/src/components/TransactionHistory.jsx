import React from 'react';
import { Box, Button, Card, CardContent, Chip, Divider, Stack, Typography } from '@mui/material';

function dateLabel(timestamp) {
  if (!timestamp) return 'Timestamp unavailable';
  return new Date(timestamp * 1000).toLocaleString();
}

export default function TransactionHistory({ events = [], limit = 8, ownerAddress = '', policyIds = [], claimIds = [] }) {
  const visibleEvents = (ownerAddress
    ? events.filter((event) => (
      event.actor?.toLowerCase() === ownerAddress.toLowerCase()
      || (event.policyId && policyIds.includes(event.policyId))
      || (event.claimId && claimIds.includes(event.claimId))
    ))
    : events).slice(0, limit);
  return (
    <Card className="panel-card">
      <CardContent className="panel-content">
        <Box className="section-heading-row">
          <Box>
            <Typography variant="h6" className="panel-title">On-chain activity</Typography>
            <Typography variant="body2" color="text.secondary">Read directly from InsureChain contract events.</Typography>
          </Box>
          <Chip size="small" label={`${events.length} events`} variant="outlined" />
        </Box>
        <Divider sx={{ my: 2 }} />
        {visibleEvents.length === 0 ? (
          <Box className="empty-state compact-empty">
            <span className="empty-icon">↗</span>
            <Typography variant="subtitle2">No contract activity yet</Typography>
            <Typography variant="body2" color="text.secondary">Confirmed policy, claim and funding events will appear here.</Typography>
          </Box>
        ) : (
          <Stack divider={<Divider flexItem />}>
            {visibleEvents.map((event, index) => (
              <Box className="event-row" key={`${event.transactionHash}-${event.eventName}-${index}`}>
                <span className={`event-marker event-${event.eventName?.toLowerCase()}`} />
                <Box className="event-copy">
                  <Typography variant="subtitle2">{event.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{event.reference} · Block {event.blockNumber}</Typography>
                  <Typography variant="caption" color="text.secondary">{dateLabel(event.timestamp)}</Typography>
                </Box>
                <Button
                  size="small"
                  component="a"
                  href={`#${event.transactionHash}`}
                  onClick={async (clickEvent) => {
                    clickEvent.preventDefault();
                    try { await navigator.clipboard.writeText(event.transactionHash); } catch { /* Clipboard may be unavailable. */ }
                  }}
                  className="hash-button"
                  title="Copy transaction hash"
                >
                  {`${event.transactionHash.slice(0, 8)}…${event.transactionHash.slice(-6)}`}
                </Button>
              </Box>
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
