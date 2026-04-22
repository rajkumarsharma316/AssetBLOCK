import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/client';
import { generateKeypair, isValidSecretKey, publicKeyFromSecret } from '../utils/stellar';
import { Key, RefreshCw, Wallet, ArrowRight, ShieldCheck } from 'lucide-react';
import ABLogo from '../components/ABLogo';
import { isConnected, getAddress, signTransaction, setAllowed } from '@stellar/freighter-api';

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

  const handleFreighterLogin = async () => {
    setLoading(true);
    setError('');
    setStatus('Connecting to Freighter...');
    try {
      if (!(await isConnected())) {
        throw new Error('Freighter extension not detected. Please install it.');
      }
      await setAllowed();
      const addrRes = await getAddress();
      if (addrRes.error) throw new Error(addrRes.error);
      const publicKey = addrRes.address;
      
      setStatus('Requesting auth challenge...');
      const { data } = await authApi.getChallenge(publicKey);
      
      setStatus('Please sign the challenge in Freighter...');
      // Pass the exact Passphrase so Freighter v6 knows it is Testnet
      const signRes = await signTransaction(data.challenge || data.transaction, { 
        networkPassphrase: 'Test SDF Network ; September 2015' 
      });
      
      if (signRes.error) {
        throw new Error(signRes.error);
      }
      const signedChallenge = signRes.signedTxXdr;
      
      setStatus('Authenticating...');
      await login({ publicKey, signedChallenge });
      navigate('/');
    } catch (err) {
      console.error(err);
      setError(err.message || err.response?.data?.error || 'Freighter login failed.');
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  return (
    <div className="login-page">
      {/* Ambient glow effects */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '30%',
          width: 'min(400px, 80vw)',
          height: 'min(400px, 80vw)',
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
          width: 'min(350px, 70vw)',
          height: 'min(350px, 70vw)',
          background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }}
      />

      <div className="login-container">
        <div className="login-logo">
          <ABLogo
            size={80}
            style={{
              margin: '0 auto 20px',
              display: 'block',
              filter: 'drop-shadow(0 0 30px rgba(6, 182, 212, 0.25))',
            }}
          />
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
              style={{ flex: 1, padding: '10px 4px', fontSize: '0.85rem' }}
            >
              <RefreshCw size={16} style={{ flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>New</span>
            </button>
            <button
              type="button"
              className={`btn ${mode === 'import' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => { setMode('import'); setError(''); }}
              style={{ flex: 1, padding: '10px 4px', fontSize: '0.85rem' }}
            >
              <Key size={16} style={{ flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>Import</span>
            </button>
            <button
              type="button"
              className={`btn ${mode === 'freighter' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => { setMode('freighter'); setError(''); }}
              style={{ flex: 1, padding: '10px 4px', fontSize: '0.85rem' }}
            >
              <ShieldCheck size={16} style={{ flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>Freighter</span>
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
                    <label className="form-label">Secret Key</label>
                    <input
                      type="text"
                      className="form-input mono"
                      value={keyPair.secretKey}
                      readOnly
                      style={{ fontSize: '0.65rem', overflow: 'hidden', textOverflow: 'ellipsis' }}
                    />
                  </div>
                  {keyPair.mnemonic && (
                     <div className="form-group" style={{ marginBottom: 28 }}>
                       <label className="form-label" style={{ color: 'var(--accent-cyan)' }}>Secret Recovery Phrase (For Freighter)</label>
                       <textarea
                         className="form-textarea mono"
                         value={keyPair.mnemonic}
                         readOnly
                         rows={3}
                         style={{ fontSize: '0.75rem', resize: 'none', background: 'rgba(0, 240, 255, 0.05)', borderColor: 'var(--accent-cyan)' }}
                       />
                       <span className="form-hint" style={{ color: 'var(--accent-amber)', marginTop: 4 }}>
                         ⚠ Save your secret key or phrase! You'll need it to log back in.
                       </span>
                     </div>
                  )}

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
          ) : mode === 'import' ? (
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
          ) : (
            <div>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{
                  width: 64, height: 64, margin: '0 auto 16px', background: 'var(--bg-card)', 
                  border: '1px solid var(--border-primary)', borderRadius: '50%', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <ShieldCheck size={32} color="var(--accent-cyan)" />
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Connect your Freighter wallet to sign in securely. We will request a cryptographic signature to verify your identity.
                </p>
              </div>

              <button
                className="btn btn-primary btn-lg"
                onClick={handleFreighterLogin}
                disabled={loading}
                style={{ width: '100%' }}
              >
                {loading ? (
                  <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> {status || 'Connecting...'}</>
                ) : (
                  <>
                    <ShieldCheck size={18} />
                    Connect Freighter Wallet
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
