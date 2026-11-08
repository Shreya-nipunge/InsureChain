import { formatEther } from 'ethers';

export function formatEth(wei) {
  return `${formatEther(wei)} ETH`;
}

export function formatDate(timestamp) {
  return timestamp ? new Date(timestamp * 1000).toLocaleDateString() : '—';
}
