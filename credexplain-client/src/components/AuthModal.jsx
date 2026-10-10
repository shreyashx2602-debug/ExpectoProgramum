import React, { useState, useEffect } from 'react';
import { User, Lock, Mail, CheckCircle2, ArrowRight, X } from 'lucide-react';
import { api } from '../services/api';

// Official Google G Logo SVG
const GoogleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" style={{ marginRight: '10px' }}>
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.27 21.41 7.34 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.27 2.59 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
    />
  </svg>
);

export default function AuthModal({ isOpen, onClose, onLoginSuccess }) {
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('LOAN_OFFICER');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Google Sign-in flow state
  const [showGoogleView, setShowGoogleView] = useState(false);
  const [googleName, setGoogleName] = useState('');
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleRole, setGoogleRole] = useState('LOAN_OFFICER');

  useEffect(() => {
    if (isOpen) {
      setError('');
      setSuccessMsg('');
      setShowGoogleView(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Standard Email/Password Sign-In or Sign-Up
  const handleStandardAuth = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (tab === 'login') {
        const user = await api.login(email, password);
        setSuccessMsg(`Welcome, ${user.fullName}!`);
        setTimeout(() => {
          onLoginSuccess(user);
          onClose();
        }, 400);
      } else {
        const user = await api.register(email, password, fullName, role);
        setSuccessMsg(`Account created for ${user.fullName}!`);
        setTimeout(() => {
          onLoginSuccess(user);
          onClose();
        }, 500);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Google Authentication handler
  const handleGoogleSubmit = async (e) => {
    e.preventDefault();
    if (!googleEmail || !googleEmail.includes('@')) {
      setError('Please provide a valid Google / Gmail address.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const user = await api.googleAuth({
        email: googleEmail,
        fullName: googleName || googleEmail.split('@')[0],
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(googleName || 'User')}&background=0d9488&color=fff`,
        googleId: "goog_" + Math.random().toString(36).substring(5),
        role: googleRole
      });
      setSuccessMsg(`Signed in with Google as ${user.fullName}!`);
      setTimeout(() => {
        onLoginSuccess(user);
        onClose();
      }, 400);
    } catch (err) {
      setError(err.message || 'Google sign-in encountered an error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px', padding: '1.75rem' }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '1rem', right: '1rem',
            background: 'none', border: 'none', color: '#94a3b8',
            cursor: 'pointer', padding: '4px'
          }}
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            width: '46px', height: '46px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #0d9488 0%, #0284c7 100%)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 800, fontSize: '1.4rem', marginBottom: '0.6rem',
            boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)'
          }}>
            CS
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
            {showGoogleView ? 'Sign In with Google' : 'CreditSetu Account Access'}
          </h2>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
            {showGoogleView
              ? 'Enter your Google profile information to continue'
              : 'Secure access for credit scoring and income synthesis'}
          </p>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div style={{
            padding: '0.75rem 0.9rem', backgroundColor: '#ecfdf5',
            border: '1px solid #a7f3d0', borderRadius: '8px',
            color: '#065f46', fontSize: '0.825rem', marginBottom: '1rem',
            display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600
          }}>
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div style={{
            padding: '0.75rem 0.9rem', backgroundColor: '#fef2f2',
            border: '1px solid #fecaca', borderRadius: '8px',
            color: '#991b1b', fontSize: '0.825rem', marginBottom: '1rem'
          }}>
            {error}
          </div>
        )}

        {!showGoogleView ? (
          <>
            {/* Primary Google-style Button */}
            <div style={{ marginBottom: '1.25rem' }}>
              <button
                type="button"
                onClick={() => setShowGoogleView(true)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0.7rem 1rem',
                  backgroundColor: '#ffffff',
                  color: '#3c4043',
                  border: '1px solid #dadce0',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(60,64,67, 0.08)',
                  transition: 'background-color 0.15s, box-shadow 0.15s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8fafd';
                  e.currentTarget.style.borderColor = '#c2e7ff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ffffff';
                  e.currentTarget.style.borderColor = '#dadce0';
                }}
              >
                <GoogleLogo />
                <span>Continue with Google</span>
              </button>
            </div>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.2rem' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }}></div>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                or with email & password
              </span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }}></div>
            </div>

            {/* Tabs for Standard Email Sign-In / Register */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
              <button
                onClick={() => setTab('login')}
                style={{
                  flex: 1, padding: '0.6rem', border: 'none', background: 'none',
                  fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                  borderBottom: tab === 'login' ? '2.5px solid #0d9488' : 'none',
                  color: tab === 'login' ? '#0d9488' : '#64748b'
                }}
              >
                Sign In
              </button>
              <button
                onClick={() => setTab('register')}
                style={{
                  flex: 1, padding: '0.6rem', border: 'none', background: 'none',
                  fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                  borderBottom: tab === 'register' ? '2.5px solid #0d9488' : 'none',
                  color: tab === 'register' ? '#0d9488' : '#64748b'
                }}
              >
                Create Account
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleStandardAuth}>
              {tab === 'register' && (
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700 }}>Full Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700 }}>Email Address</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700 }}>Password</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {tab === 'register' && (
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700 }}>Assigned Role</label>
                  <select
                    className="form-control"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="LOAN_OFFICER">Loan Officer (Underwriter)</option>
                    <option value="APPLICANT">Borrower / Applicant</option>
                    <option value="ADMIN">System & Model Auditor</option>
                  </select>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '0.5rem', padding: '0.7rem' }}
                disabled={loading}
              >
                {loading
                  ? 'Processing...'
                  : (tab === 'login' ? 'Sign In' : 'Create Account')}
              </button>
            </form>
          </>
        ) : (
          /* GOOGLE SIGN IN FORM */
          <form onSubmit={handleGoogleSubmit}>
            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '1.25rem',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <GoogleLogo />
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>
                  Google Identity
                </span>
              </div>

              <div className="form-group" style={{ marginBottom: '0.85rem' }}>
                <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>Full Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Your Name"
                  value={googleName}
                  onChange={(e) => setGoogleName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '0.85rem' }}>
                <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>Google Email Address</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="username@gmail.com"
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>Role</label>
                <select
                  className="form-control"
                  value={googleRole}
                  onChange={(e) => setGoogleRole(e.target.value)}
                >
                  <option value="LOAN_OFFICER">Loan Officer (Underwriter)</option>
                  <option value="APPLICANT">Borrower / Applicant</option>
                  <option value="ADMIN">System Auditor</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.7rem' }}
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In with Google'}
              </button>
              <button
                type="button"
                onClick={() => setShowGoogleView(false)}
                className="btn btn-secondary"
                style={{ width: '100%' }}
              >
                Back to Email Login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
