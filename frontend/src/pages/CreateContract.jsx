import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { contractsApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import ConditionBuilder from '../components/ConditionBuilder';
import { isValidPublicKey } from '../utils/stellar';
import { truncateAddress, formatAmount } from '../utils/formatters';
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Info,
  Users,
  Shield,
  Clock,
  Plus,
  Trash2,
  Send,
} from 'lucide-react';

const STEPS = [
  { label: 'Basic Info', icon: Info },
  { label: 'Conditions', icon: Clock },
  { label: 'Signers', icon: Users },
  { label: 'Review', icon: Shield },
];

export default function CreateContract() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    amount: '',
    assetCode: 'XLM',
    destination: '',
    conditions: [],
    signers: [],
    threshold: 2,
  });

  const [xlmPrice, setXlmPrice] = useState(0.12); // Fallback price
  const [newSigner, setNewSigner] = useState('');

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=stellar&vs_currencies=usd');
        const data = await res.json();
        if (data.stellar?.usd) {
          setXlmPrice(data.stellar.usd);
        }
      } catch (err) {
        console.error('Failed to fetch XLM price:', err);
      }
    };
    fetchPrice();
  }, []);

  const updateForm = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const addSigner = () => {
    if (!newSigner || !isValidPublicKey(newSigner)) {
      setError('Please enter a valid Stellar public key');
      return;
    }
    if (form.signers.includes(newSigner)) {
      setError('Signer already added');
      return;
    }
    updateForm('signers', [...form.signers, newSigner]);
    setNewSigner('');
    setError('');
  };

  const removeSigner = (idx) => {
    updateForm('signers', form.signers.filter((_, i) => i !== idx));
  };

  const canProceed = () => {
    switch (step) {
      case 0:
        return form.title && form.amount && parseFloat(form.amount) > 0 && form.destination && isValidPublicKey(form.destination);
      case 1:
        return true; // Conditions are optional
      case 2:
        return true; // Signers are optional
      case 3:
        return true;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const payload = {
        title: form.title,
        description: form.description,
        amount: form.amount,
        assetCode: form.assetCode,
        destination: form.destination,
        conditions: form.conditions.map(cond => {
          if (cond.type === 'time' && cond.params.releaseAfter) {
            return {
              ...cond,
              params: {
                ...cond.params,
                releaseAfter: new Date(cond.params.releaseAfter).toISOString()
              }
            };
          }
          return cond;
        }),
        signers: form.signers.map((s) => ({ publicKey: s })),
        threshold: form.threshold,
      };

      const { data } = await contractsApi.create(payload);
      navigate(`/contract/${data.contract.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create contract');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-content animate-fade-in">
      <div className="page-header">
        <h1>Create Payment Contract</h1>
        <p>Set up a new escrow-based conditional payment</p>
      </div>

      {/* Wizard Steps */}
      <div className="wizard-steps">
        {STEPS.map((s, idx) => (
          <button
            key={idx}
            className={`wizard-step ${idx === step ? 'active' : ''} ${idx < step ? 'completed' : ''}`}
            onClick={() => idx <= step && setStep(idx)}
            type="button"
          >
            <span className="wizard-step-number">
              {idx < step ? <Check size={14} /> : idx + 1}
            </span>
            <span className="wizard-step-label">{s.label}</span>
          </button>
        ))}
      </div>

      {error && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--status-error-bg)',
          color: 'var(--status-error)',
          fontSize: '0.84rem',
          marginBottom: 24,
          border: '1px solid rgba(239, 68, 68, 0.2)',
        }}>
          {error}
        </div>
      )}

      <div className="glass-card no-hover" style={{ maxWidth: 720, margin: '0 auto' }}>
        {/* Step 0: Basic Info */}
        {step === 0 && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 24 }}>
              <Info size={20} style={{ marginRight: 8, color: 'var(--accent-cyan)' }} />
              Basic Information
            </h2>

            <div className="form-group">
              <label className="form-label">Contract Title *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., Freelance Payment - Website Design"
                value={form.title}
                onChange={(e) => updateForm('title', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-textarea"
                placeholder="Describe the payment terms..."
                value={form.description}
                onChange={(e) => updateForm('description', e.target.value)}
              />
            </div>

            <div className="form-group prominent-amount">
              <label className="form-label">Escrow Amount *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  className="form-input amount-input"
                  placeholder="0.00"
                  min="0.0000001"
                  step="any"
                  value={form.amount}
                  onChange={(e) => updateForm('amount', e.target.value)}
                  style={{
                    fontSize: '1.8rem',
                    fontWeight: 800,
                    padding: '20px 80px 20px 20px',
                    width: '100%',
                    height: 'auto',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '2px solid var(--border-primary)'
                  }}
                />
                <div style={{
                  position: 'absolute',
                  right: '20px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontWeight: 800,
                  fontSize: '1.2rem',
                  color: 'var(--accent-cyan)',
                  pointerEvents: 'none'
                }}>
                  XLM
                </div>
              </div>
              {form.amount && parseFloat(form.amount) > 0 && (
                <div style={{
                  marginTop: '12px',
                  padding: '10px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(57, 255, 20, 0.06)',
                  border: '1px solid rgba(57, 255, 20, 0.15)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Estimated Value:</span>
                  <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--status-success)' }}>
                    ${(parseFloat(form.amount) * xlmPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                  </span>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Destination Address *</label>
              <input
                type="text"
                className="form-input mono"
                placeholder="G..."
                value={form.destination}
                onChange={(e) => updateForm('destination', e.target.value)}
              />
              <span className="form-hint">Stellar public key of the payment recipient</span>
            </div>
          </div>
        )}

        {/* Step 1: Conditions */}
        {step === 1 && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 8 }}>
              <Clock size={20} style={{ marginRight: 8, color: 'var(--accent-cyan)' }} />
              Payment Conditions
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: 24 }}>
              Define when the escrowed funds should be released. Leave empty for manual-only release.
            </p>

            <ConditionBuilder
              conditions={form.conditions}
              onChange={(c) => updateForm('conditions', c)}
            />
          </div>
        )}

        {/* Step 2: Signers */}
        {step === 2 && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 8 }}>
              <Users size={20} style={{ marginRight: 8, color: 'var(--accent-cyan)' }} />
              Multi-Signature Signers
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: 24 }}>
              Add additional signers who must authorize the payment release. Your account is automatically included.
            </p>

            {/* Add signer */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
              <input
                type="text"
                className="form-input mono"
                placeholder="Signer public key (G...)"
                value={newSigner}
                onChange={(e) => setNewSigner(e.target.value)}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={addSigner}
              >
                <Plus size={16} />
                Add
              </button>
            </div>

            {/* Signer list */}
            {form.signers.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                {form.signers.map((s, idx) => (
                  <div
                    key={idx}
                    className="animate-fade-in"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: 'var(--bg-glass)',
                      border: '1px solid var(--border-primary)',
                      borderRadius: 'var(--radius-md)',
                      marginBottom: 8,
                    }}
                  >
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {truncateAddress(s, 8)}
                    </span>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => removeSigner(idx)}
                      style={{ color: 'var(--status-error)' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {form.signers.length > 0 && (
              <div className="form-group">
                <label className="form-label">Approval Threshold</label>
                <input
                  type="number"
                  className="form-input"
                  min="1"
                  max={form.signers.length + 1}
                  value={form.threshold}
                  onChange={(e) => updateForm('threshold', parseInt(e.target.value))}
                />
                <span className="form-hint">
                  Number of signatures required to release funds (out of {form.signers.length + 1} total signers)
                </span>
              </div>
            )}

            <div style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--status-info-bg)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              fontSize: '0.82rem',
              color: 'var(--status-info)',
            }}>
              💡 Your account ({truncateAddress(user?.publicKey, 6)}) is automatically added as a signer.
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 24 }}>
              <Shield size={20} style={{ marginRight: 8, color: 'var(--accent-cyan)' }} />
              Review & Create
            </h2>

            <div style={{ display: 'grid', gap: 16 }}>
              <div className="info-item">
                <div className="info-item-label">Title</div>
                <div className="info-item-value">{form.title}</div>
              </div>
              {form.description && (
                <div className="info-item">
                  <div className="info-item-label">Description</div>
                  <div className="info-item-value">{form.description}</div>
                </div>
              )}
              <div className="contract-info-grid">
                <div className="info-item">
                  <div className="info-item-label">Amount</div>
                  <div className="info-item-value large">{formatAmount(form.amount, form.assetCode)}</div>
                </div>
                <div className="info-item">
                  <div className="info-item-label">Destination</div>
                  <div className="info-item-value mono">{truncateAddress(form.destination, 8)}</div>
                </div>
              </div>
              <div className="info-item">
                <div className="info-item-label">Conditions ({form.conditions.length})</div>
                <div className="info-item-value">
                  {form.conditions.length === 0
                    ? 'No conditions — manual release only'
                    : form.conditions.map((c, i) => (
                        <span key={i} className="badge badge-active" style={{ marginRight: 6, marginBottom: 4 }}>
                          {c.type}
                        </span>
                      ))}
                </div>
              </div>
              <div className="info-item">
                <div className="info-item-label">Signers ({form.signers.length + 1})</div>
                <div className="info-item-value">
                  You + {form.signers.length} additional {form.signers.length === 1 ? 'signer' : 'signers'}
                  {form.signers.length > 0 && ` (threshold: ${form.threshold})`}
                </div>
              </div>
            </div>

            <div style={{
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(6, 182, 212, 0.06)',
              border: '1px solid rgba(6, 182, 212, 0.15)',
              marginTop: 24,
              fontSize: '0.84rem',
              color: 'var(--text-secondary)',
            }}>
              <strong style={{ color: 'var(--accent-cyan)' }}>What happens next:</strong>
              <ol style={{ marginTop: 8, paddingLeft: 18, lineHeight: 1.8 }}>
                <li>A new escrow account will be created on Stellar Testnet</li>
                <li>Multi-sig will be configured with your signers</li>
                <li>You'll need to fund the escrow with {formatAmount(form.amount, form.assetCode)}</li>
                <li>The condition monitor will watch for trigger events</li>
              </ol>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border-primary)' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setStep(step - 1)}
            disabled={step === 0}
          >
            <ArrowLeft size={16} />
            Back
          </button>

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => { setStep(step + 1); setError(''); }}
              disabled={!canProceed()}
            >
              Next
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Creating...</>
              ) : (
                <>
                  <Send size={18} />
                  Create Contract
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
