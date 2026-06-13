import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { jobsApi, applicationsApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { truncateAddress, formatAmount, formatDate, formatRelativeTime } from '../utils/formatters';
import {
  Briefcase,
  ArrowLeft,
  Clock,
  DollarSign,
  Users,
  Send,
  Check,
  X,
  AlertCircle,
  ExternalLink,
  FileText,
  User,
  CheckCircle2,
  XCircle,
  Loader2,
  Calendar,
} from 'lucide-react';

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [isOwner, setIsOwner] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Application form state
  const [proposal, setProposal] = useState('');
  const [bidAmount, setBidAmount] = useState('');

  const fetchJob = async () => {
    setLoading(true);
    try {
      const { data } = await jobsApi.get(id);
      setJob(data.job);
      setApplications(data.applications || []);
      setIsOwner(data.isOwner);
      setHasApplied(data.hasApplied);
      if (data.userApplication) {
        setBidAmount(data.userApplication.bid_amount);
        setProposal(data.userApplication.proposal);
      }
    } catch (err) {
      setError('Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJob();
  }, [id]);

  const handleApply = async (e) => {
    e.preventDefault();
    if (!proposal.trim()) {
      setError('Please write a proposal');
      return;
    }
    if (!bidAmount || parseFloat(bidAmount) <= 0) {
      setError('Please enter a valid bid amount');
      return;
    }

    setActionLoading(true);
    setError('');
    try {
      await applicationsApi.apply({
        jobId: id,
        proposal: proposal.trim(),
        bidAmount,
      });
      setSuccess('Application submitted successfully!');
      setHasApplied(true);
      fetchJob();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit application');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAccept = async (applicationId) => {
    if (!confirm('Accept this freelancer? This will create an escrow contract and reject all other applicants.')) return;

    setActionLoading(true);
    setError('');
    try {
      const { data } = await applicationsApi.accept(applicationId);
      setSuccess(`Freelancer accepted! Escrow contract created.`);
      // Redirect to the contract detail page after a short delay
      setTimeout(() => {
        navigate(`/contract/${data.contractId}`);
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to accept application');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (applicationId) => {
    if (!confirm('Reject this application?')) return;

    setActionLoading(true);
    setError('');
    try {
      await applicationsApi.reject(applicationId);
      setSuccess('Application rejected.');
      fetchJob();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reject application');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelJob = async () => {
    if (!confirm('Cancel this job listing? All pending applications will be rejected.')) return;

    setActionLoading(true);
    setError('');
    try {
      await jobsApi.cancel(id);
      setSuccess('Job cancelled.');
      fetchJob();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to cancel job');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return { bg: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: 'rgba(34, 197, 94, 0.25)' };
      case 'assigned': return { bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: 'rgba(59, 130, 246, 0.25)' };
      case 'completed': return { bg: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', border: 'rgba(139, 92, 246, 0.25)' };
      case 'cancelled': return { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.25)' };
      case 'pending': return { bg: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24', border: 'rgba(251, 191, 36, 0.25)' };
      case 'accepted': return { bg: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: 'rgba(34, 197, 94, 0.25)' };
      case 'rejected': return { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.25)' };
      default: return { bg: 'rgba(148, 163, 184, 0.1)', color: '#94a3b8', border: 'rgba(148, 163, 184, 0.25)' };
    }
  };

  if (loading) {
    return (
      <div className="page-content" style={{ textAlign: 'center', paddingTop: 80 }}>
        <Loader2 size={36} className="spinner" style={{ margin: '0 auto 16px' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Loading job details...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="page-content" style={{ textAlign: 'center', paddingTop: 80 }}>
        <AlertCircle size={48} style={{ color: 'var(--status-error)', margin: '0 auto 16px' }} />
        <h2>Job Not Found</h2>
        <Link to="/jobs" className="btn btn-primary" style={{ marginTop: 16 }}>
          <ArrowLeft size={16} /> Back to Jobs
        </Link>
      </div>
    );
  }

  const statusStyle = getStatusColor(job.status);
  const skills = job.skills || [];

  return (
    <div className="page-content animate-fade-in">
      <button className="btn btn-ghost" onClick={() => navigate('/jobs')} style={{ marginBottom: 16 }}>
        <ArrowLeft size={16} />
        Back to Jobs
      </button>

      {/* Messages */}
      {error && (
        <div style={{ padding: '12px 16px', borderRadius: 'var(--radius-md)', background: 'var(--status-error-bg)', color: 'var(--status-error)', fontSize: '0.84rem', marginBottom: 20, border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ padding: '12px 16px', borderRadius: 'var(--radius-md)', background: 'rgba(34, 197, 94, 0.08)', color: '#22c55e', fontSize: '0.84rem', marginBottom: 20, border: '1px solid rgba(34, 197, 94, 0.2)' }}>
          <CheckCircle2 size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
          {success}
        </div>
      )}

      {/* Job Header */}
      <div className="glass-card no-hover" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
              <Briefcase size={24} style={{ color: 'var(--accent-cyan)' }} />
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>{job.title}</h1>
              <span style={{
                padding: '4px 12px',
                borderRadius: 'var(--radius-pill)',
                background: statusStyle.bg,
                color: statusStyle.color,
                border: `1px solid ${statusStyle.border}`,
                fontSize: '0.76rem',
                fontWeight: 600,
                textTransform: 'uppercase',
              }}>
                {job.status}
              </span>
            </div>

            {/* Meta */}
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: '0.85rem', color: 'var(--text-tertiary)', marginBottom: 20 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <User size={14} />
                Posted by {truncateAddress(job.client_public_key, 6)}
                {isOwner && <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>(You)</span>}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Clock size={14} />
                {formatRelativeTime(job.created_at)}
              </span>
              {job.deadline && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Calendar size={14} />
                  Deadline: {formatDate(job.deadline)}
                </span>
              )}
            </div>

            {/* Budget highlight */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 20px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(34, 197, 94, 0.08)',
              border: '1px solid rgba(34, 197, 94, 0.2)',
              marginBottom: 20,
            }}>
              <DollarSign size={20} style={{ color: 'var(--status-success)' }} />
              <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--status-success)' }}>
                {formatAmount(job.budget, job.asset_code)}
              </span>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>Budget</span>
            </div>

            {/* Skills */}
            {skills.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
                {skills.map((skill, i) => (
                  <span key={i} style={{
                    padding: '3px 12px',
                    borderRadius: 'var(--radius-pill)',
                    background: 'rgba(139, 92, 246, 0.08)',
                    color: 'var(--accent-purple)',
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                    fontSize: '0.78rem',
                    fontWeight: 500,
                  }}>
                    {skill}
                  </span>
                ))}
              </div>
            )}

            {/* Description */}
            <div style={{
              padding: '20px',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-primary)',
            }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <FileText size={16} />
                Job Description
              </h3>
              <p style={{ color: 'var(--text-primary)', fontSize: '0.92rem', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                {job.description}
              </p>
            </div>
          </div>

          {/* Actions sidebar */}
          {isOwner && job.status === 'open' && (
            <div style={{ flexShrink: 0 }}>
              <button className="btn btn-danger btn-sm" onClick={handleCancelJob} disabled={actionLoading}>
                <X size={14} /> Cancel Job
              </button>
            </div>
          )}
        </div>

        {/* Link to escrow contract if assigned */}
        {job.contract_id && (
          <div style={{
            marginTop: 20,
            padding: '14px 20px',
            background: 'rgba(6, 182, 212, 0.06)',
            border: '1px solid rgba(6, 182, 212, 0.15)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}>
            <div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <CheckCircle2 size={16} style={{ verticalAlign: 'middle', marginRight: 6, color: 'var(--accent-cyan)' }} />
                Escrow contract linked to this job
              </span>
            </div>
            <Link to={`/contract/${job.contract_id}`} className="btn btn-primary btn-sm">
              <ExternalLink size={14} />
              View Escrow Contract
            </Link>
          </div>
        )}
      </div>

      {/* ===== FREELANCER VIEW: Application Form ===== */}
      {!isOwner && job.status === 'open' && !hasApplied && (
        <div className="glass-card no-hover" style={{ maxWidth: 720 }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Send size={20} style={{ color: 'var(--accent-cyan)' }} />
            Submit Your Proposal
          </h2>

          <form onSubmit={handleApply}>
            <div className="form-group">
              <label className="form-label">Your Proposal *</label>
              <textarea
                className="form-textarea"
                placeholder="Explain why you're the best fit for this job, your relevant experience, and your approach..."
                rows={5}
                value={proposal}
                onChange={(e) => setProposal(e.target.value)}
                id="application-proposal-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Your Bid Amount ({job.asset_code}) *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  className="form-input"
                  placeholder="0.00"
                  min="0.0000001"
                  step="any"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  style={{ paddingRight: 60 }}
                  id="application-bid-input"
                />
                <div style={{
                  position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                  fontWeight: 700, fontSize: '0.9rem', color: 'var(--accent-cyan)', pointerEvents: 'none',
                }}>
                  {job.asset_code}
                </div>
              </div>
              <span className="form-hint">Client's budget: {formatAmount(job.budget, job.asset_code)}</span>
            </div>

            <button type="submit" className="btn btn-primary btn-lg" disabled={actionLoading} style={{ width: '100%' }} id="submit-application-btn">
              {actionLoading ? (
                <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Submitting...</>
              ) : (
                <><Send size={18} /> Submit Application</>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Freelancer: Already applied */}
      {!isOwner && hasApplied && (
        <div className="glass-card no-hover" style={{ maxWidth: 720 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px',
            background: 'rgba(6, 182, 212, 0.06)', border: '1px solid rgba(6, 182, 212, 0.15)',
            borderRadius: 'var(--radius-md)',
          }}>
            <CheckCircle2 size={20} style={{ color: 'var(--accent-cyan)' }} />
            <div>
              <strong style={{ color: 'var(--text-primary)' }}>You've already applied to this job</strong>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                Your bid: {formatAmount(bidAmount, job.asset_code)}. The client will review your proposal.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ===== CLIENT VIEW: Applications List ===== */}
      {isOwner && applications.length > 0 && (
        <div className="glass-card no-hover">
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={20} style={{ color: 'var(--accent-cyan)' }} />
            Applications ({applications.length})
          </h2>

          <div style={{ display: 'grid', gap: 12 }}>
            {applications.map((app) => {
              const appStatusStyle = getStatusColor(app.status);
              return (
                <div
                  key={app.id}
                  style={{
                    padding: '20px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: 'var(--radius-md)',
                  }}
                  id={`application-card-${app.id}`}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(139, 92, 246, 0.2))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '1px solid var(--border-primary)',
                      }}>
                        <User size={16} style={{ color: 'var(--text-secondary)' }} />
                      </div>
                      <div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                          {truncateAddress(app.freelancer_public_key, 8)}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                          Applied {formatRelativeTime(app.created_at)}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: 'var(--radius-pill)',
                        background: appStatusStyle.bg, color: appStatusStyle.color,
                        border: `1px solid ${appStatusStyle.border}`,
                        fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase',
                      }}>
                        {app.status}
                      </span>
                      <span style={{
                        padding: '4px 12px', borderRadius: 'var(--radius-md)',
                        background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.2)',
                        color: 'var(--status-success)', fontWeight: 700, fontSize: '0.9rem',
                      }}>
                        {formatAmount(app.bid_amount, job.asset_code)}
                      </span>
                    </div>
                  </div>

                  {/* Proposal */}
                  <div style={{
                    padding: '12px 16px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-primary)', marginBottom: 16,
                  }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                      {app.proposal}
                    </p>
                  </div>

                  {/* Accept / Reject buttons */}
                  {app.status === 'pending' && job.status === 'open' && (
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleReject(app.id)}
                        disabled={actionLoading}
                      >
                        <XCircle size={14} /> Reject
                      </button>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleAccept(app.id)}
                        disabled={actionLoading}
                      >
                        <CheckCircle2 size={14} /> Accept & Create Escrow
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Client: No applications yet */}
      {isOwner && applications.length === 0 && job.status === 'open' && (
        <div className="glass-card no-hover" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <Users size={40} style={{ color: 'var(--text-tertiary)', margin: '0 auto 12px' }} />
          <h3 style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>No Applications Yet</h3>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.88rem' }}>
            Freelancers will be able to apply to your job listing. Check back later.
          </p>
        </div>
      )}
    </div>
  );
}
