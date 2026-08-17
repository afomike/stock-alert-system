import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Check your credentials.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen login-page flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <Link to="/" className="login-back">&larr; Back to home</Link>
        {/* Brand Header */}
        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-amber/20 rounded-xl mb-4">
            <svg className="w-6 h-6 text-amber" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.5 1.5H3.75A2.25 2.25 0 001.5 3.75v12.5A2.25 2.25 0 003.75 18.5h12.5a2.25 2.25 0 002.25-2.25V9.5M10.5 1.5v8m0 0H2m8.5 0h8.5M10.5 9.5v8.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="font-display text-3xl font-bold text-paper tracking-tight">
            STOCKWATCH
          </h1>
          <p className="font-mono text-sm text-paper/60">
            Your inventory, in focus
          </p>
        </div>

        {/* Login Card */}
        <div className="card-elevated bg-paper shadow-2xl overflow-hidden">
          <form onSubmit={handleSubmit} className="section space-y-5">
            {/* Email Input */}
            <div className="space-y-2">
              <label htmlFor="email" className="font-medium text-sm text-ink">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full px-4 py-3 text-base border border-line bg-paper-dim text-ink rounded-lg placeholder-ink/30"
                disabled={submitting}
              />
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label htmlFor="password" className="font-medium text-sm text-ink">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 text-base border border-line bg-paper-dim text-ink rounded-lg placeholder-ink/30"
                disabled={submitting}
              />
            </div>

            {/* Error Alert */}
            {error && (
              <div className="alert alert-error">
                <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-semibold">Authentication Failed</p>
                  <p className="text-sm opacity-90">{error}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={submitting}
              disabled={submitting}
              className="mt-6"
            >
              {submitting ? 'Signing in...' : 'Sign In'}
            </Button>

            {/* Demo Credentials */}
            {/* <div className="pt-4 border-t border-line">
              <p className="text-xs text-ink/50 font-mono mb-2">Demo Credentials:</p>
              <div className="space-y-1 text-xs font-mono text-ink/60">
                <p>
                  <span className="text-ink/80 font-semibold">Email:</span> admin@stockalert.com
                </p>
                <p>
                  <span className="text-ink/80 font-semibold">Password:</span> admin123
                </p>
              </div>
            </div> */}
          </form>
        </div>

        {/* Footer */}
        <p className="text-center mt-6 text-sm text-paper/50 font-mono">
          © 2024 StockWatch. All rights reserved.
        </p>
      </div>
    </div>
  );
}
