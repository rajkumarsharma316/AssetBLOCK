import { useState, useEffect } from 'react';
import { transactionsApi } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import { formatAmount, formatDate, truncateAddress, getExplorerUrl } from '../utils/formatters';
import { ArrowLeftRight, ExternalLink, Filter } from 'lucide-react';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    loadTransactions();
  }, [filter]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const params = { limit: 50 };
      if (filter) params.type = filter;
      const { data } = await transactionsApi.list(params);
      setTransactions(data.transactions || []);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-content animate-fade-in">
      <div className="page-header">
        <h1>Transactions</h1>
        <p>Complete history of all blockchain transactions</p>
      </div>

      {/* Filters */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 24,
          flexWrap: 'wrap',
        }}
      >
        <Filter size={16} style={{ color: 'var(--text-tertiary)' }} />
        {['', 'escrow_create', 'fund', 'release', 'refund'].map((type) => (
          <button
            key={type}
            className={`btn btn-sm ${filter === type ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter(type)}
          >
            {type === '' ? 'All' : type.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-center">
          <div className="spinner spinner-lg" />
        </div>
      ) : transactions.length === 0 ? (
        <div className="glass-card no-hover">
          <div className="empty-state">
            <div className="empty-state-icon">
              <ArrowLeftRight size={48} />
            </div>
            <h3>No transactions found</h3>
            <p>Transactions will appear here once you create and fund contracts.</p>
          </div>
        </div>
      ) : (
        <div className="glass-card no-hover" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Contract</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>TX Hash</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, idx) => (
                  <tr key={tx.id} className="animate-fade-in" style={{ animationDelay: `${idx * 30}ms` }}>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {tx.type.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                      </span>
                    </td>
                    <td>
                      {tx.contract_title ? (
                        <span>{tx.contract_title}</span>
                      ) : (
                        <span className="mono">{truncateAddress(tx.contract_id, 4)}</span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent-cyan)' }}>
                        {tx.amount && tx.amount !== '0' ? formatAmount(tx.amount) : '—'}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={tx.status} />
                    </td>
                    <td style={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                      {formatDate(tx.created_at)}
                    </td>
                    <td>
                      {tx.tx_hash ? (
                        <a
                          href={getExplorerUrl(tx.tx_hash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.78rem',
                          }}
                        >
                          {tx.tx_hash.substring(0, 10)}...
                          <ExternalLink size={12} />
                        </a>
                      ) : (
                        <span style={{ color: 'var(--text-tertiary)' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
