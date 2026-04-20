import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { contractsApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import TransactionTimeline from '../components/TransactionTimeline';
import {
  formatAmount,
  formatDate,
  truncateAddress,
  formatTimeRemaining,
  getExplorerUrl,
} from '../utils/formatters';
import {
  ArrowLeft,
  ExternalLink,
  DollarSign,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Shield,
  Zap,
  Copy,
} from 'lucide-react';

export default function ContractDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, refreshBalance } = useAuth();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState(false);

  const loadContract = useCallback(async () => {
    try {
      const { data } = await contractsApi.get(id);
      setContract(data.contract);
    } catch (err) {
      setError('Failed to load contract');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadContract();
    // Poll for updates
    const interval = setInterval(loadContract, 10000);
    return () => clearInterval(interval);
  }, [loadContract]);

  const handleFund = async () => {
    setActionLoading('fund');
    setError('');
    setSuccess('');
    try {
      // Get the fund XDR
      const { data: xdrData } = await contractsApi.getFundXdr(id);

      if (xdrData.xdr) {
        // For testnet demo: sign with stored secret
        const secretKey = sessionStorage.getItem('cpe_secret');
        if (!secretKey) {
          setError('No signing key found. Please re-login with your secret key.');
          return;
        }

        const { Keypair, TransactionBuilder, Networks } = await import('@stellar/stellar-sdk');
        const keypair = Keypair.fromSecret(secretKey);
        const tx = TransactionBuilder.fromXDR(xdrData.xdr, Networks.TESTNET);
        tx.sign(keypair);

        // Submit via Horizon
        const response = await fetch('https://horizon-testnet.stellar.org/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `tx=${encodeURIComponent(tx.toXDR())}`,
        });

        const result = await response.json();
        if (!response.ok) throw new Error(JSON.stringify(result.extras?.result_codes || result));

        // Mark as funded in backend
        await contractsApi.fund(id, result.hash);
        setSuccess(`Contract funded! TX: ${result.hash.substring(0, 12)}...`);
        await loadContract();
        await refreshBalance();
      }
    } catch (err) {
      setError(err.message || 'Failed to fund contract');
    } finally {
      setActionLoading('');
    }
  };

  const handleApprove = async () => {
    setActionLoading('approve');
    setError('');
    try {
      await contractsApi.approve(id);
      setSuccess('Your approval has been recorded');
      await loadContract();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to approve');
    } finally {
      setActionLoading('');
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this contract? Funds will be refunded.')) return;
    setActionLoading('cancel');
    setError('');
    try {
      await contractsApi.cancel(id);
      setSuccess('Contract cancelled and funds refunded');
      await loadContract();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to cancel');
    } finally {
      setActionLoading('');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="page-content">
        <div className="loading-center"><div className="spinner spinner-lg" /></div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="page-content">
        <div className="empty-state">
          <h3>Contract not found</h3>
          <button className="btn btn-primary" onClick={() => navigate('/')}>Back to Dashboard</button>
        </div>
      </div>
    );
  }

  const conditions = contract.conditions || [];
  const signers = contract.signers || [];
  const transactions = contract.transactions || [];
  const isCreator = contract.creator_public_key === user?.publicKey;
  const isSigner = signers.some((s) => s.public_key === user?.publicKey);
  const hasSigned = signers.find((s) => s.public_key === user?.publicKey)?.has_signed;
  const metCount = conditions.filter((c) => c.is_met).length;

  return (
    <div className="page-content animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
        <button className="btn btn-ghost btn-icon" onClick={() => navigate('/')}>
          <ArrowLeft size={20} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, background: 'var(--gradient-hero)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', wordBreak: 'break-word' }}>
              {contract.title}
            </h1>
            <StatusBadge status={contract.status} />
          </div>
          {contract.description && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 4 }}>{contract.description}</p>
          )}
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div style={{ padding: '12px 16px', borderRadius: 'var(--radius-md)', background: 'var(--status-error-bg)', color: 'var(--status-error)', fontSize: '0.84rem', marginBottom: 20, border: '1px solid rgba(239,68,68,0.2)' }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ padding: '12px 16px', borderRadius: 'var(--radius-md)', background: 'var(--status-success-bg)', color: 'var(--status-success)', fontSize: '0.84rem', marginBottom: 20, border: '1px solid rgba(16,185,129,0.2)' }}>
          {success}
        </div>
      )}

      <div className="contract-detail-grid">
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Contract Info */}
          <div className="glass-card no-hover">
            <h3 className="section-title">
              <Shield size={18} style={{ color: 'var(--accent-cyan)' }} />
              Contract Details
            </h3>
            <div className="contract-info-grid">
              <div className="info-item">
                <div className="info-item-label">Amount</div>
                <div className="info-item-value large">
                  {formatAmount(contract.amount, contract.asset_code || 'XLM')}
                </div>
              </div>
              <div className="info-item">
                <div className="info-item-label">Status</div>
                <div className="info-item-value"><StatusBadge status={contract.status} /></div>
              </div>
              <div className="info-item">
                <div className="info-item-label">Creator</div>
                <div className="info-item-value mono" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {truncateAddress(contract.creator_public_key, 6)}
                  {isCreator && <span className="badge badge-active" style={{ fontSize: '0.65rem' }}>You</span>}
                </div>
              </div>
              <div className="info-item">
                <div className="info-item-label">Destination</div>
                <div className="info-item-value mono">
                  {truncateAddress(contract.destination, 6)}
                </div>
              </div>
              {contract.escrow_public_key && (
                <div className="info-item" style={{ gridColumn: '1 / -1' }}>
                  <div className="info-item-label">Escrow Account</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="info-item-value mono" style={{ fontSize: '0.78rem', wordBreak: 'break-all' }}>
                      {contract.escrow_public_key}
                    </span>
                    <button className="btn btn-ghost btn-sm" onClick={() => copyToClipboard(contract.escrow_public_key)} title="Copy">
                      <Copy size={12} />
                    </button>
                    <a href={`https://stellar.expert/explorer/testnet/account/${contract.escrow_public_key}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
                      <ExternalLink size={12} />
                    </a>
                  </div>
                  {copied && <span style={{ fontSize: '0.72rem', color: 'var(--status-success)' }}>Copied!</span>}
                </div>
              )}
              <div className="info-item">
                <div className="info-item-label">Created</div>
                <div className="info-item-value">{formatDate(contract.created_at)}</div>
              </div>
              <div className="info-item">
                <div className="info-item-label">Updated</div>
                <div className="info-item-value">{formatDate(contract.updated_at)}</div>
              </div>
            </div>
          </div>

          {/* Conditions */}
          <div className="glass-card no-hover">
            <h3 className="section-title">
              <Clock size={18} style={{ color: 'var(--accent-cyan)' }} />
              Conditions
              <span style={{ marginLeft: 'auto', fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                {metCount}/{conditions.length} met
              </span>
            </h3>

            {conditions.length === 0 ? (
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.88rem' }}>No conditions — manual release only</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {conditions.map((cond, idx) => {
                  const params = typeof cond.params === 'string' ? JSON.parse(cond.params) : cond.params;
                  return (
                    <div
                      key={cond.id || idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '14px 16px',
                        background: cond.is_met ? 'rgba(16,185,129,0.06)' : 'var(--bg-glass)',
                        border: `1px solid ${cond.is_met ? 'rgba(16,185,129,0.2)' : 'var(--border-primary)'}`,
                        borderRadius: 'var(--radius-md)',
                      }}
                    >
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: cond.is_met ? 'rgba(16,185,129,0.15)' : 'var(--bg-tertiary)',
                        color: cond.is_met ? 'var(--status-success)' : 'var(--text-tertiary)',
                        flexShrink: 0,
                      }}>
                        {cond.is_met ? <CheckCircle2 size={18} /> : <Clock size={18} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.88rem', fontWeight: 600, textTransform: 'capitalize' }}>
                          {cond.type} condition
                          <span className={`logic-operator-badge ${cond.logic_operator?.toLowerCase() || 'and'}`} style={{ marginLeft: 8, fontSize: '0.65rem' }}>
                            {cond.logic_operator || 'AND'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginTop: 2 }}>
                          {cond.type === 'time' && params.releaseAfter && (
                            <>Release after: {formatDate(params.releaseAfter)} ({formatTimeRemaining(params.releaseAfter)})</>
                          )}
                          {cond.type === 'approval' && (
                            <>Approvals: {params.currentApprovals || 0}/{params.requiredApprovals || 1}</>
                          )}
                          {cond.type === 'oracle' && (
                            <>Target: {params.targetValue} | Current: {params.currentValue || 'N/A'}</>
                          )}
                        </div>
                        {cond.is_met && cond.met_at && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--status-success)', marginTop: 2 }}>
                            ✓ Met at {formatDate(cond.met_at)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {conditions.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div className="progress-bar" style={{ height: 8 }}>
                  <div className="progress-bar-fill" style={{ width: `${(metCount / conditions.length) * 100}%` }} />
                </div>
              </div>
            )}
          </div>

          {/* Signers */}
          {signers.length > 0 && (
            <div className="glass-card no-hover">
              <h3 className="section-title">
                <Users size={18} style={{ color: 'var(--accent-purple)' }} />
                Signers
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {signers.map((s, idx) => (
                  <div
                    key={s.id || idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: 'var(--bg-glass)',
                      border: '1px solid var(--border-primary)',
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {truncateAddress(s.public_key, 8)}
                      {s.public_key === user?.publicKey && (
                        <span className="badge badge-active" style={{ marginLeft: 8, fontSize: '0.65rem' }}>You</span>
                      )}
                    </span>
                    {s.has_signed ? (
                      <span style={{ fontSize: '0.78rem', color: 'var(--status-success)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle2 size={14} /> Approved
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>Pending</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Actions */}
          <div className="glass-card no-hover">
            <h3 className="section-title">
              <Zap size={18} style={{ color: 'var(--accent-amber)' }} />
              Actions
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {contract.status === 'pending' && isCreator && (
                <button
                  className="btn btn-primary"
                  onClick={handleFund}
                  disabled={actionLoading === 'fund'}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {actionLoading === 'fund' ? (
                    <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Funding...</>
                  ) : (
                    <><DollarSign size={16} /> Fund Escrow</>
                  )}
                </button>
              )}

              {(contract.status === 'funded' || contract.status === 'active') && isSigner && !hasSigned && (
                <button
                  className="btn btn-success"
                  onClick={handleApprove}
                  disabled={actionLoading === 'approve'}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {actionLoading === 'approve' ? (
                    <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Approving...</>
                  ) : (
                    <><CheckCircle2 size={16} /> Approve Payment</>
                  )}
                </button>
              )}

              {isCreator && !['completed', 'cancelled'].includes(contract.status) && (
                <button
                  className="btn btn-danger"
                  onClick={handleCancel}
                  disabled={actionLoading === 'cancel'}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {actionLoading === 'cancel' ? (
                    <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Cancelling...</>
                  ) : (
                    <><XCircle size={16} /> Cancel & Refund</>
                  )}
                </button>
              )}

              {contract.status === 'completed' && (
                <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--status-success)' }}>
                  <CheckCircle2 size={32} style={{ marginBottom: 8 }} />
                  <div style={{ fontWeight: 600 }}>Payment Completed</div>
                </div>
              )}

              {contract.status === 'cancelled' && (
                <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--status-error)' }}>
                  <XCircle size={32} style={{ marginBottom: 8 }} />
                  <div style={{ fontWeight: 600 }}>Contract Cancelled</div>
                </div>
              )}
            </div>
          </div>

          {/* Transaction History */}
          <div className="glass-card no-hover">
            <h3 className="section-title">
              <Clock size={18} style={{ color: 'var(--accent-cyan)' }} />
              Transaction History
            </h3>
            <TransactionTimeline transactions={transactions} />
          </div>
        </div>
      </div>
    </div>
  );
}
