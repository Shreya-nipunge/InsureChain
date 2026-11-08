import React from 'react';
import { Card, CardContent, Typography } from '@mui/material';

export default function MetricCard({ label, value, detail, tone = 'green' }) {
  return (
    <Card className={`metric-card metric-${tone}`}>
      <CardContent>
        <Typography className="metric-label">{label}</Typography>
        <Typography variant="h4" className="metric-value">{value}</Typography>
        {detail && <Typography className="metric-detail">{detail}</Typography>}
      </CardContent>
    </Card>
  );
}
