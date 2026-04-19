/**
 * Truncate a Stellar address for display: GABC...WXYZ
 */
export function truncateAddress(address, chars = 4) {
  if (!address) return '';
  return `${address.substring(0, chars)}...${address.substring(address.length - chars)}`;
}

/**
 * Format a date string to a readable format.
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format a relative time (e.g., "2 hours ago").
 */
export function formatRelativeTime(dateStr) {
  if (!dateStr) return '';
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

/**
 * Format amount with proper decimal places.
 */
export function formatAmount(amount, symbol = 'XLM') {
  if (!amount) return `0 ${symbol}`;
  const num = parseFloat(amount);
  if (isNaN(num)) return `0 ${symbol}`;
  return `${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 7 })} ${symbol}`;
}

/**
 * Format time remaining until a deadline.
 */
export function formatTimeRemaining(deadline) {
  if (!deadline) return '';
  const now = Date.now();
  const target = new Date(deadline).getTime();
  const diff = target - now;

  if (diff <= 0) return 'Expired';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  return `${hours}h ${minutes}m`;
}

/**
 * Get Stellar Explorer URL for a transaction hash.
 */
export function getExplorerUrl(txHash) {
  return `https://stellar.expert/explorer/testnet/tx/${txHash}`;
}

/**
 * Get the CSS class for a contract status.
 */
export function getStatusClass(status) {
  const map = {
    pending: 'badge-pending',
    funded: 'badge-funded',
    active: 'badge-active',
    completed: 'badge-completed',
    expired: 'badge-cancelled',
    cancelled: 'badge-cancelled',
  };
  return map[status] || 'badge-pending';
}
