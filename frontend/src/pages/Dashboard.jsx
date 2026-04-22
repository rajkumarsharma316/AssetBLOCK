import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { contractsApi, transactionsApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import ContractCard from '../components/ContractCard';
import StatusBadge from '../components/StatusBadge';
import { formatAmount, formatDate, truncateAddress, getExplorerUrl } from '../utils/formatters';
import { Plus, FileText, Activity, CheckCircle2, Clock, ExternalLink } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [contracts, setContracts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [contractsRes, txRes] = await Promise.all([
        contractsApi.list(),
        transactionsApi.list({ limit: 5 }),
      ]);
      setContracts(contractsRes.data.contracts || []);
      setTransactions(txRes.data.transactions || []);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: contracts.length,
    active: contracts.filter((c) => ['funded', 'active'].includes(c.status)).length,
    completed: contracts.filter((c) => c.status === 'completed').length,
    totalValue: contracts
      .filter((c) => ['funded', 'active'].includes(c.status))
      .reduce((sum, c) => sum + parseFloat(c.amount || 0), 0),
  };

  if (loading) {
    return (
      <div className="page-content">
        <div className="loading-center">
          <div className="spinner spinner-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-content animate-fade-in">
      <div className="page-header page-header-row">
        <div>
          <h1>Dashboard</h1>
          <p>Overview of your conditional payment contracts</p>
        </div>
        <Link to="/create" className="btn btn-primary">
          <Plus size={18} />
          New Contract
        </Link>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => document.getElementById('active-contracts')?.scrollIntoView({ behavior: 'smooth' })}>
          <div className="stat-card-icon cyan">
            <FileText size={22} />
          </div>
          <div className="stat-card-value">{stats.total}</div>
          <div className="stat-card-label">Total Contracts</div>
        </div>
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => document.getElementById('active-contracts')?.scrollIntoView({ behavior: 'smooth' })}>
          <div className="stat-card-icon purple">
            <Activity size={22} />
          </div>
          <div className="stat-card-value">{stats.active}</div>
          <div className="stat-card-label">Active Contracts</div>
        </div>
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => document.getElementById('completed-contracts')?.scrollIntoView({ behavior: 'smooth' })}>
          <div className="stat-card-icon green">
            <CheckCircle2 size={22} />
          </div>
          <div className="stat-card-value">{stats.completed}</div>
          <div className="stat-card-label">Completed</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon amber">
            <Clock size={22} />
          </div>
          <div className="stat-card-value">{formatAmount(stats.totalValue.toFixed(2))}</div>
          <div className="stat-card-label">Total Value Locked</div>
        </div>
      </div>

      {/* Active Contracts */}
      <div style={{ marginBottom: 40 }} id="active-contracts">
        <h2 className="section-title">
          <Activity size={20} style={{ color: 'var(--accent-cyan)' }} />
          Active Contracts
        </h2>
        {contracts.filter((c) => ['pending', 'funded', 'active'].includes(c.status)).length === 0 ? (
          <Link to="/create" style={{ textDecoration: 'none', display: 'block' }}>
            <div className="glass-card" style={{ cursor: 'pointer', transition: 'all var(--transition-fast)' }}>
              <div className="empty-state">
                <div className="empty-state-icon">📝</div>
                <h3>No active contracts</h3>
                <p>Create your first conditional payment contract to get started.</p>
                <div className="btn btn-primary" style={{ marginTop: 16 }}>
                  <Plus size={16} />
                  Create Contract
                </div>
              </div>
            </div>
          </Link>
        ) : (
          <div className="contracts-grid">
            {contracts
              .filter((c) => ['pending', 'funded', 'active'].includes(c.status))
              .map((contract) => (
                <ContractCard key={contract.id} contract={contract} />
              ))}
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div>
        <h2 className="section-title">
          <Clock size={20} style={{ color: 'var(--accent-purple)' }} />
          Recent Transactions
        </h2>
        {transactions.length === 0 ? (
          <div className="glass-card no-hover">
            <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '24px 0', fontSize: '0.88rem' }}>
              No transactions yet
            </p>
          </div>
        ) : (
          <div className="glass-card no-hover" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-responsive">
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
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {tx.type.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                    </td>
                    <td>{tx.contract_title || truncateAddress(tx.contract_id, 4)}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      {tx.amount && tx.amount !== '0' ? formatAmount(tx.amount) : '—'}
                    </td>
                    <td><StatusBadge status={tx.status} /></td>
                    <td style={{ fontSize: '0.82rem' }}>{formatDate(tx.created_at)}</td>
                    <td>
                      {tx.tx_hash ? (
                        <a
                          href={getExplorerUrl(tx.tx_hash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mono"
                          style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          {tx.tx_hash.substring(0, 8)}...
                          <ExternalLink size={12} />
                        </a>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </div>

      {/* Completed Contracts */}
      {contracts.filter((c) => c.status === 'completed').length > 0 && (
        <div style={{ marginTop: 40 }} id="completed-contracts">
          <h2 className="section-title">
            <CheckCircle2 size={20} style={{ color: 'var(--status-success)' }} />
            Completed Contracts
          </h2>
          <div className="contracts-grid">
            {contracts
              .filter((c) => c.status === 'completed')
              .map((contract) => (
                <ContractCard key={contract.id} contract={contract} />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
