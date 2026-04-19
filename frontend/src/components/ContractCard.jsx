import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import { truncateAddress, formatAmount, formatTimeRemaining, formatDate } from '../utils/formatters';
import { Clock, Users, ArrowRight } from 'lucide-react';

export default function ContractCard({ contract }) {
  const conditions = contract.conditions || [];
  const metCount = conditions.filter((c) => c.is_met).length;
  const totalConditions = conditions.length;
  const progress = totalConditions > 0 ? (metCount / totalConditions) * 100 : 0;

  // Find time-based condition for countdown
  const timeCondition = conditions.find((c) => c.type === 'time');
  const deadline = timeCondition
    ? JSON.parse(typeof timeCondition.params === 'string' ? timeCondition.params : JSON.stringify(timeCondition.params)).releaseAfter
    : null;

  return (
    <Link to={`/contract/${contract.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className="glass-card" style={{ cursor: 'pointer' }}>
        {/* Top row: title + status */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {contract.title}
            </h3>
            {contract.description && (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {contract.description}
              </p>
            )}
          </div>
          <StatusBadge status={contract.status} />
        </div>

        {/* Amount */}
        <div style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 16, background: 'var(--gradient-accent)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          {formatAmount(contract.amount, contract.asset_code || 'XLM')}
        </div>

        {/* Info row */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 16, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <ArrowRight size={14} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem' }}>
              {truncateAddress(contract.destination, 4)}
            </span>
          </div>
          {deadline && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={14} />
              {formatTimeRemaining(deadline)}
            </div>
          )}
          {contract.signers && contract.signers.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Users size={14} />
              {contract.signers.filter((s) => s.has_signed).length}/{contract.signers.length} signed
            </div>
          )}
        </div>

        {/* Condition progress */}
        {totalConditions > 0 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.76rem', color: 'var(--text-tertiary)' }}>
              <span>Conditions</span>
              <span>{metCount}/{totalConditions} met</span>
            </div>
            <div className="progress-bar">
              <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: 14, fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
          {formatDate(contract.created_at)}
        </div>
      </div>
    </Link>
  );
}
