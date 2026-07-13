import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import useAppStore from '../store/useAppStore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Loader2 } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { setUser, clearUser } = useAppStore();

  const [email, setEmail]     = useState('');
  const [name, setName]       = useState('');
  const [mode, setMode]       = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  useEffect(() => {
    localStorage.removeItem('token');
    clearUser();
  }, [clearUser]);

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
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            <span className="text-primary">Test</span>Pilot AI
          </h1>
          <p className="text-muted-foreground text-sm mt-2">Cross-browser visual testing platform</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold tracking-tight">
              {mode === 'login' ? 'Sign in to your account' : 'Create an account'}
            </CardTitle>
            <CardDescription>
              {mode === 'login' ? 'Enter your email to sign in' : 'Enter your details to get started'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {mode === 'register' && (
              <div className="space-y-2">
                <Label htmlFor="name-input">Name</Label>
                <Input
                  id="name-input"
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setError(''); }}
                  placeholder="Your name"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email-input">Email</Label>
              <Input
                id="email-input"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                placeholder="you@company.com"
                onKeyDown={(e) => e.key === 'Enter' && handleAction(mode)}
              />
            </div>

            {error && (
              <div className="text-xs text-destructive bg-destructive/10 rounded px-3 py-2">{error}</div>
            )}

            {mode === 'login' ? (
              <>
                <Button
                  id="signin-button"
                  onClick={() => handleAction('login')}
                  disabled={loading}
                  className="w-full"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Sign in
                </Button>
                <Button
                  id="show-register-button"
                  variant="outline"
                  onClick={() => { setMode('register'); setError(''); }}
                  className="w-full"
                >
                  Create account
                </Button>
              </>
            ) : (
              <>
                <Button
                  id="register-button"
                  onClick={() => handleAction('register')}
                  disabled={loading}
                  className="w-full"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create account
                </Button>
                <Button
                  id="back-to-login-button"
                  variant="outline"
                  onClick={() => { setMode('login'); setError(''); }}
                  className="w-full"
                >
                  Back to sign in
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          No password needed — email-only authentication
        </p>
      </div>
    </div>
  );
}
