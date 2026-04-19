import { formatDate, getExplorerUrl } from '../utils/formatters';
import { ExternalLink } from 'lucide-react';

const typeLabels = {
  escrow_create: 'Escrow Created',
  fund: 'Escrow Funded',
  release: 'Payment Released',
  refund: 'Escrow Refunded',
  path_payment: 'Path Payment',
};

const dotStyle = {
  escrow_create: 'active',
  fund: 'success',
  release: 'success',
  refund: 'error',
  path_payment: 'active',
};

export default function TransactionTimeline({ transactions }) {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="empty-state" style={{ padding: 32 }}>
        <p style={{ fontSize: '0.85rem' }}>No transactions yet</p>
      </div>
    );
  }

  return (
    <div className="timeline">
      {transactions.map((tx, idx) => (
        <div key={tx.id || idx} className="timeline-item animate-fade-in" style={{ animationDelay: `${idx * 80}ms` }}>
          <div className={`timeline-dot ${dotStyle[tx.type] || ''}`} />
          <div className="timeline-content">
            <div className="timeline-title">{typeLabels[tx.type] || tx.type}</div>
            {tx.amount && tx.amount !== '0' && (
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--accent-cyan)', margin: '4px 0' }}>
                {parseFloat(tx.amount).toFixed(4)} XLM
              </div>
            )}
            {tx.tx_hash && (
              <a
                href={getExplorerUrl(tx.tx_hash)}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: '0.76rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--accent-cyan)',
                  marginTop: 4,
                }}
              >
                {tx.tx_hash.substring(0, 12)}...
                <ExternalLink size={10} />
              </a>
            )}
            <div className="timeline-meta">{formatDate(tx.created_at)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
