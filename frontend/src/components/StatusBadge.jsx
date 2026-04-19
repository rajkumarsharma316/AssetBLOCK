import { getStatusClass } from '../utils/formatters';

export default function StatusBadge({ status }) {
  const dotColors = {
    pending: '#f59e0b',
    funded: '#8b5cf6',
    active: '#06b6d4',
    completed: '#10b981',
    expired: '#ef4444',
    cancelled: '#ef4444',
    confirmed: '#10b981',
    submitted: '#3b82f6',
    failed: '#ef4444',
  };

  return (
    <span className={`badge ${getStatusClass(status)}`}>
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          backgroundColor: dotColors[status] || '#64748b',
          display: 'inline-block',
        }}
      />
      {status}
    </span>
  );
}
