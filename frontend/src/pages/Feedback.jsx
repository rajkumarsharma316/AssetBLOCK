import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Star, Send, CheckCircle2, MessageSquareHeart } from 'lucide-react';
import client from '../api/client';

export default function Feedback() {
  const { user } = useAuth();

  const [form, setForm] = useState({
    name: '',
    email: '',
    walletAddress: user?.publicKey || '',
    rating: 0,
    lackingFeature: '',
    bugsFound: '',
    solvesIssue: '',
    generalFeedback: '',
  });

  const [hoverRating, setHoverRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!form.name.trim()) return setError('Please enter your name.');
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      return setError('Please enter a valid email address.');
    if (!form.walletAddress.trim())
      return setError('Please enter your wallet address.');
    if (form.rating === 0) return setError('Please select a star rating.');
    if (!form.lackingFeature.trim())
      return setError('Please tell us if any feature is lacking.');
    if (!form.bugsFound.trim())
      return setError('Please let us know if you found any bugs.');
    if (!form.solvesIssue.trim())
      return setError('Please let us know if you think this dApp is able to solve its targeted issue.');

    const combinedDescription = `
Missing Features: ${form.lackingFeature.trim()}
Bugs/Issues: ${form.bugsFound.trim()}
Solves Targeted Issue: ${form.solvesIssue.trim()}
General Feedback: ${form.generalFeedback.trim() || 'N/A'}
    `.trim();

    setLoading(true);
    try {
      await client.post('/feedback', {
        name: form.name.trim(),
        email: form.email.trim(),
        walletAddress: form.walletAddress.trim(),
        rating: form.rating,
        description: combinedDescription,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  // Success state
  if (submitted) {
    return (
      <div className="page-content animate-fade-in">
        <div
          style={{
            maxWidth: 560,
            margin: '80px auto 0',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '2px solid rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
            }}
          >
            <CheckCircle2 size={40} color="var(--status-success)" />
          </div>
          <h1
            style={{
              fontSize: '1.8rem',
              fontWeight: 800,
              background: 'var(--gradient-hero)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: 12,
            }}
          >
            Thank You!
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: 32 }}>
            Your feedback has been submitted successfully. We truly appreciate your time and input!
          </p>
          <button
            className="btn btn-primary btn-lg"
            onClick={() => {
              setSubmitted(false);
              setForm({
                name: '',
                email: '',
                walletAddress: user?.publicKey || '',
                rating: 0,
                lackingFeature: '',
                bugsFound: '',
                solvesIssue: '',
                generalFeedback: '',
              });
            }}
          >
            Submit Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content animate-fade-in">
      <div className="page-header">
        <h1>Feedback</h1>
        <p>We'd love to hear your thoughts — help us improve AssetBlock!</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="glass-card no-hover"
        style={{ maxWidth: 640, margin: '0 auto' }}
      >
        {/* Header illustration */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            marginBottom: 28,
            padding: '16px 20px',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, rgba(6,182,212,0.06) 0%, rgba(139,92,246,0.06) 100%)',
            border: '1px solid rgba(6, 182, 212, 0.12)',
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 'var(--radius-md)',
              background: 'var(--gradient-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <MessageSquareHeart size={24} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
              Share Your Experience
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', marginTop: 2 }}>
              Your feedback helps us build a better platform for everyone
            </div>
          </div>
        </div>

        {/* Error alert */}
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

        {/* Name */}
        <div className="form-group">
          <label className="form-label">Full Name *</label>
          <input
            type="text"
            className="form-input"
            placeholder="John Doe"
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
          />
        </div>

        {/* Email */}
        <div className="form-group">
          <label className="form-label">Email Address *</label>
          <input
            type="email"
            className="form-input"
            placeholder="john@example.com"
            value={form.email}
            onChange={(e) => updateField('email', e.target.value)}
          />
        </div>

        {/* Wallet Address */}
        <div className="form-group">
          <label className="form-label">Wallet Address *</label>
          <input
            type="text"
            className="form-input mono"
            placeholder="G..."
            value={form.walletAddress}
            onChange={(e) => updateField('walletAddress', e.target.value)}
          />
          <span className="form-hint">Your Stellar public key</span>
        </div>

        {/* Star Rating */}
        <div className="form-group">
          <label className="form-label">
            Rating * {form.rating > 0 && (
              <span
                style={{
                  marginLeft: 8,
                  fontSize: '0.78rem',
                  fontWeight: 500,
                  color: 'var(--accent-cyan)',
                }}
              >
                — {ratingLabels[form.rating]}
              </span>
            )}
          </label>
          <div
            style={{
              display: 'flex',
              gap: 6,
              padding: '12px 0',
            }}
          >
            {[1, 2, 3, 4, 5].map((star) => {
              const isFilled = star <= (hoverRating || form.rating);
              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => updateField('rating', star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 4,
                    transition: 'transform 0.15s ease, color 0.15s ease',
                    transform: isFilled ? 'scale(1.15)' : 'scale(1)',
                    color: isFilled ? '#f59e0b' : 'var(--text-tertiary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                >
                  <Star
                    size={32}
                    fill={isFilled ? '#f59e0b' : 'none'}
                    strokeWidth={1.5}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Specific Questions */}
        <div className="form-group">
          <label className="form-label">1. Is there any feature you think this product is lacking? *</label>
          <textarea
            className="form-textarea"
            placeholder="Let us know what features you'd like to see..."
            rows={3}
            value={form.lackingFeature}
            onChange={(e) => updateField('lackingFeature', e.target.value)}
            style={{ resize: 'vertical' }}
          />
        </div>

        <div className="form-group">
          <label className="form-label">2. Did you find any bugs/errors/issues while using this app? *</label>
          <textarea
            className="form-textarea"
            placeholder="Report any unexpected behavior or issues..."
            rows={3}
            value={form.bugsFound}
            onChange={(e) => updateField('bugsFound', e.target.value)}
            style={{ resize: 'vertical' }}
          />
        </div>

        <div className="form-group">
          <label className="form-label">3. Do you think this dApp is able to solve the issue it's targeting? *</label>
          <textarea
            className="form-textarea"
            placeholder="Share your thoughts on its real-world utility..."
            rows={3}
            value={form.solvesIssue}
            onChange={(e) => updateField('solvesIssue', e.target.value)}
            style={{ resize: 'vertical' }}
          />
        </div>

        {/* General Description */}
        <div className="form-group">
          <label className="form-label">Any other general feedback? (Optional)</label>
          <textarea
            className="form-textarea"
            placeholder="Tell us what you liked, what could be improved, or any other suggestions..."
            rows={3}
            value={form.generalFeedback}
            onChange={(e) => updateField('generalFeedback', e.target.value)}
            style={{ resize: 'vertical' }}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="btn btn-primary btn-lg"
          disabled={loading}
          style={{ width: '100%', marginTop: 8 }}
        >
          {loading ? (
            <>
              <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
              Submitting...
            </>
          ) : (
            <>
              <Send size={18} />
              Submit Feedback
            </>
          )}
        </button>
      </form>
    </div>
  );
}
