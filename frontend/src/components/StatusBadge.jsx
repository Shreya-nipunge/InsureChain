import React from 'react';
import { Chip } from '@mui/material';

export default function StatusBadge({ label }) {
  const normalized = String(label).toLowerCase();
  const tone = normalized === 'active' || normalized === 'paid' || normalized === 'approved'
    ? 'good'
    : normalized === 'submitted'
      ? 'pending'
      : normalized === 'rejected' || normalized === 'expired' || normalized === 'inactive'
        ? 'bad'
        : 'neutral';
  return <Chip size="small" label={label} className={`status-chip status-${tone}`} />;
}
