import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobsApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Briefcase,
  FileText,
  DollarSign,
  Tag,
  Calendar,
  ArrowLeft,
  Send,
  Plus,
  X,
  Info,
} from 'lucide-react';

export default function PostJob() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [skillInput, setSkillInput] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    budget: '',
    assetCode: 'XLM',
    skills: [],
    deadline: '',
  });

  const updateForm = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const addSkill = () => {
    const skill = skillInput.trim();
    if (!skill) return;
    if (form.skills.includes(skill)) {
      setSkillInput('');
      return;
    }
    updateForm('skills', [...form.skills, skill]);
    setSkillInput('');
  };

  const removeSkill = (idx) => {
    updateForm('skills', form.skills.filter((_, i) => i !== idx));
  };

  const handleSkillKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.budget || parseFloat(form.budget) <= 0) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const { data } = await jobsApi.create({
        title: form.title,
        description: form.description,
        budget: form.budget,
        assetCode: form.assetCode,
        skills: form.skills,
        deadline: form.deadline || undefined,
      });
      navigate(`/jobs/${data.job.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to post job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-content animate-fade-in">
      <div className="page-header">
        <button
          className="btn btn-ghost"
          onClick={() => navigate('/jobs')}
          style={{ marginBottom: 16 }}
        >
          <ArrowLeft size={16} />
          Back to Jobs
        </button>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Briefcase size={28} style={{ color: 'var(--accent-cyan)' }} />
          Post a New Job
        </h1>
        <p>Create a job listing with an escrow-backed payment guarantee</p>
      </div>

      <div className="glass-card no-hover" style={{ maxWidth: 720, margin: '0 auto' }}>
        {error && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--status-error-bg)',
              color: 'var(--status-error)',
              fontSize: '0.84rem',
              marginBottom: 20,
              border: '1px solid rgba(239, 68, 68, 0.2)',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Title */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <FileText size={16} style={{ color: 'var(--accent-cyan)' }} />
              Job Title *
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g., Build a React Dashboard for DeFi Analytics"
              value={form.title}
              onChange={(e) => updateForm('title', e.target.value)}
              id="job-title-input"
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Info size={16} style={{ color: 'var(--accent-cyan)' }} />
              Description *
            </label>
            <textarea
              className="form-textarea"
              placeholder="Describe the work scope, deliverables, and any special requirements..."
              rows={6}
              value={form.description}
              onChange={(e) => updateForm('description', e.target.value)}
              id="job-description-input"
            />
          </div>

          {/* Budget */}
          <div className="form-group prominent-amount">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <DollarSign size={16} style={{ color: 'var(--accent-cyan)' }} />
              Budget *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                className="form-input amount-input"
                placeholder="0.00"
                min="0.0000001"
                step="any"
                value={form.budget}
                onChange={(e) => updateForm('budget', e.target.value)}
                style={{
                  fontSize: '1.6rem',
                  fontWeight: 800,
                  padding: '18px 80px 18px 20px',
                  width: '100%',
                  height: 'auto',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '2px solid var(--border-primary)',
                }}
                id="job-budget-input"
              />
              <div style={{
                position: 'absolute',
                right: '20px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontWeight: 800,
                fontSize: '1.1rem',
                color: 'var(--accent-cyan)',
                pointerEvents: 'none',
              }}>
                XLM
              </div>
            </div>
            <span className="form-hint">
              This amount will be locked in a Stellar escrow when a freelancer is hired.
            </span>
          </div>

          {/* Skills */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Tag size={16} style={{ color: 'var(--accent-cyan)' }} />
              Required Skills
            </label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., React, Solidity, Figma"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleSkillKeyDown}
                style={{ flex: 1, marginBottom: 0 }}
                id="job-skill-input"
              />
              <button type="button" className="btn btn-secondary" onClick={addSkill} style={{ flexShrink: 0 }}>
                <Plus size={16} />
              </button>
            </div>
            {form.skills.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {form.skills.map((skill, i) => (
                  <span
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-pill)',
                      background: 'rgba(139, 92, 246, 0.1)',
                      color: 'var(--accent-purple)',
                      border: '1px solid rgba(139, 92, 246, 0.2)',
                      fontSize: '0.8rem',
                      fontWeight: 500,
                    }}
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(i)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'inherit',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Deadline */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calendar size={16} style={{ color: 'var(--accent-cyan)' }} />
              Deadline (Optional)
            </label>
            <input
              type="datetime-local"
              className="form-input"
              value={form.deadline}
              onChange={(e) => updateForm('deadline', e.target.value)}
              id="job-deadline-input"
            />
            <span className="form-hint">Set a deadline for when work should be completed.</span>
          </div>

          {/* Info Box */}
          <div style={{
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(6, 182, 212, 0.06)',
            border: '1px solid rgba(6, 182, 212, 0.15)',
            marginTop: 8,
            marginBottom: 28,
            fontSize: '0.84rem',
            color: 'var(--text-secondary)',
          }}>
            <strong style={{ color: 'var(--accent-cyan)' }}>How it works:</strong>
            <ol style={{ marginTop: 8, paddingLeft: 18, lineHeight: 1.8 }}>
              <li>Your job listing will be visible to all freelancers</li>
              <li>Freelancers submit proposals with their bids</li>
              <li>You choose the best candidate and accept their bid</li>
              <li>An escrow contract is automatically created on the Stellar network</li>
              <li>You fund the escrow with the agreed amount</li>
              <li>Once the freelancer completes the work, you approve and release the payment</li>
            </ol>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
            style={{ width: '100%' }}
            id="post-job-submit"
          >
            {loading ? (
              <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Posting...</>
            ) : (
              <>
                <Send size={18} />
                Post Job
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
