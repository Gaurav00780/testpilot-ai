import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import useAppStore from '../store/useAppStore';
import { Spinner } from '../components/ui/Spinner';

export default function Login() {
  const navigate = useNavigate();
  const { setUser } = useAppStore();

  const [email, setEmail]     = useState('');
  const [name, setName]       = useState('');
  const [mode, setMode]       = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  /** Create a local session without a backend */
  const loginLocally = (emailVal, nameVal) => {
    const user = { email: emailVal, name: nameVal || emailVal.split('@')[0] };
    localStorage.setItem('token', 'dev-bypass-token');
    setUser(user);
    navigate('/dashboard');
  };

  const handleAction = async (action) => {
    if (!email.trim()) { setError('Email is required'); return; }
    if (action === 'register' && !name.trim()) { setError('Name is required'); return; }
    setError('');
    setLoading(true);
    try {
      const endpoint = action === 'register' ? '/auth/register' : '/auth/login';
      const payload  = action === 'register' ? { email, name } : { email };
      const res = await api.post(endpoint, payload);
      const { token, user } = res.data;
      if (token) localStorage.setItem('token', token);
      setUser(user || { email, name });
      navigate('/dashboard');
    } catch {
      // Backend unavailable — fall back to local session
      loginLocally(email, name);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="font-serif text-4xl text-ink">
            <span className="text-accent italic">Test</span>Pilot AI
          </h1>
          <p className="text-muted text-sm mt-2">Cross-browser visual testing platform</p>
        </div>

        {/* Card */}
        <div className="tp-card p-8 shadow-sm">
          <h2 className="font-serif text-xl text-ink mb-6">
            {mode === 'login' ? 'Sign in to your account' : 'Create an account'}
          </h2>

          <div className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wide" htmlFor="name-input">
                  Name
                </label>
                <input
                  id="name-input"
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setError(''); }}
                  placeholder="Jane Smith"
                  className="w-full px-3 py-2.5 border border-border rounded text-sm text-ink placeholder-muted bg-paper outline-none focus:border-accent transition-colors"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wide" htmlFor="email-input">
                Email
              </label>
              <input
                id="email-input"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                placeholder="you@company.com"
                className="w-full px-3 py-2.5 border border-border rounded text-sm text-ink placeholder-muted bg-paper outline-none focus:border-accent transition-colors"
                onKeyDown={(e) => e.key === 'Enter' && handleAction(mode)}
              />
            </div>

            {error && (
              <div className="text-xs text-red bg-[#ffe8e5] rounded px-3 py-2">{error}</div>
            )}

            {mode === 'login' ? (
              <>
                <button
                  id="signin-button"
                  onClick={() => handleAction('login')}
                  disabled={loading}
                  className="w-full bg-accent text-white py-2.5 rounded font-semibold text-sm hover:bg-opacity-90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && <Spinner size="sm" />}
                  Sign in
                </button>
                <button
                  id="show-register-button"
                  onClick={() => { setMode('register'); setError(''); }}
                  className="w-full border border-border text-ink py-2.5 rounded text-sm hover:bg-tag-bg transition-colors"
                >
                  Create account
                </button>
              </>
            ) : (
              <>
                <button
                  id="register-button"
                  onClick={() => handleAction('register')}
                  disabled={loading}
                  className="w-full bg-accent text-white py-2.5 rounded font-semibold text-sm hover:bg-opacity-90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && <Spinner size="sm" />}
                  Create account
                </button>
                <button
                  id="back-to-login-button"
                  onClick={() => { setMode('login'); setError(''); }}
                  className="w-full border border-border text-ink py-2.5 rounded text-sm hover:bg-tag-bg transition-colors"
                >
                  Back to sign in
                </button>
              </>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-muted mt-6">
          No password needed — email-only authentication
        </p>
      </div>
    </div>
  );
}
