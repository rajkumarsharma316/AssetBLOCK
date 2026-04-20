import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/client';
import { generateKeypair, isValidSecretKey, publicKeyFromSecret } from '../utils/stellar';
import { Zap, Key, RefreshCw, Wallet, ArrowRight } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('generate'); // 'generate' | 'import'
  const [keyPair, setKeyPair] = useState(null);
  const [secretInput, setSecretInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  const handleGenerate = () => {
    const kp = generateKeypair();
    setKeyPair(kp);
    setError('');
  };

  const handleLogin = async (publicKey, secretKey, isNewAccount = false) => {
    setLoading(true);
    setError('');
    try {
      if (isNewAccount) {
        setStatus('Funding account on testnet...');
        // Fund via Friendbot first for new accounts
        try {
          await fetch(`https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`);
        } catch {
          // Friendbot may fail silently, continue anyway
        }
      }
      setStatus('Authenticating...');
      await login({ publicKey, secretKey });
      if (isNewAccount) {
        // Also call backend fund endpoint as backup
        try {
          await authApi.fundTestnet();
        } catch {
          // ignore
        }
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Make sure your account is funded on testnet.');
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  const handleImportLogin = () => {
    if (!isValidSecretKey(secretInput)) {
      setError('Invalid secret key. Must start with "S" and be 56 characters.');
      return;
    }
    const pubKey = publicKeyFromSecret(secretInput);
    handleLogin(pubKey, secretInput);
  };

  const handleGeneratedLogin = () => {
    if (!keyPair) return;
    handleLogin(keyPair.publicKey, keyPair.secretKey, true);
  };

  return (
    <div className="login-page" style={{ overflow: 'hidden' }}>
      {/* Ambient glow effects */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '30%',
          width: 400,
          height: 400,
          background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '20%',
          right: '25%',
          width: 350,
          height: 350,
          background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }}
      />

      <div className="login-container">
        <div className="login-logo">
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 'var(--radius-lg)',
              background: 'var(--gradient-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              boxShadow: '0 0 40px rgba(6, 182, 212, 0.2)',
            }}
          >
            <Zap size={32} color="white" />
          </div>
          <h1>AssetBlock</h1>
          <p>Programmable conditional payments on Stellar</p>
        </div>

        <div className="login-card">
          {/* Mode tabs */}
          <div
            style={{
              display: 'flex',
              gap: 4,
              padding: 4,
              background: 'var(--bg-primary)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 28,
            }}
          >
            <button
              type="button"
              className={`btn ${mode === 'generate' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => { setMode('generate'); setError(''); }}
              style={{ flex: 1 }}
            >
              <RefreshCw size={16} />
              New Wallet
            </button>
            <button
              type="button"
              className={`btn ${mode === 'import' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => { setMode('import'); setError(''); }}
              style={{ flex: 1 }}
            >
              <Key size={16} />
              Import Key
            </button>
          </div>

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

          {mode === 'generate' ? (
            <div>
              {!keyPair ? (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: 24 }}>
                    Generate a new Stellar testnet keypair to get started. Your account will be automatically funded.
                  </p>
                  <button className="btn btn-primary btn-lg" onClick={handleGenerate} style={{ width: '100%' }}>
                    <Wallet size={20} />
                    Generate New Keypair
                  </button>
                </div>
              ) : (
                <div className="animate-fade-in">
                  <div className="form-group">
                    <label className="form-label">Public Key</label>
                    <input
                      type="text"
                      className="form-input mono"
                      value={keyPair.publicKey}
                      readOnly
                      style={{ fontSize: '0.65rem', overflow: 'hidden', textOverflow: 'ellipsis' }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Secret Key (save this!)</label>
                    <input
                      type="text"
                      className="form-input mono"
                      value={keyPair.secretKey}
                      readOnly
                      style={{ fontSize: '0.65rem', overflow: 'hidden', textOverflow: 'ellipsis' }}
                    />
                    <span className="form-hint" style={{ color: 'var(--accent-amber)' }}>
                      ⚠ Save your secret key! You'll need it to log back in.
                    </span>
                  </div>

                  <button
                    className="btn btn-primary btn-lg"
                    onClick={handleGeneratedLogin}
                    disabled={loading}
                    style={{ width: '100%' }}
                  >
                    {loading ? (
                      <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> {status || 'Connecting...'}</>
                    ) : (
                      <>
                        Continue to Dashboard
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="form-group">
                <label className="form-label">Secret Key</label>
                <input
                  type="password"
                  className="form-input mono"
                  placeholder="S..."
                  value={secretInput}
                  onChange={(e) => setSecretInput(e.target.value)}
                />
                <span className="form-hint">Enter your Stellar testnet secret key to sign in</span>
              </div>

              <button
                className="btn btn-primary btn-lg"
                onClick={handleImportLogin}
                disabled={loading || !secretInput}
                style={{ width: '100%' }}
              >
                {loading ? (
                  <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Signing in...</>
                ) : (
                  <>
                    <Key size={18} />
                    Sign In
                  </>
                )}
              </button>
            </div>
          )}

          <div style={{ marginTop: 24, textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
            Stellar Testnet • No real funds required
          </div>
        </div>
      </div>
    </div>
  );
}
