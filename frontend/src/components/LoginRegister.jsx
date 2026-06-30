import React, { useState } from 'react';
import { Lock, Mail, Loader2, LogOut, CheckCircle, AlertTriangle } from 'lucide-react';

export default function LoginRegister({ userEmail, onAuthSuccess, onLogout }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError('');
    setSuccessMsg('');

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Authentication failed');
      }

      const data = await response.json();
      localStorage.setItem('snapurl_token', data.token);
      localStorage.setItem('snapurl_email', data.email);
      localStorage.setItem('snapurl_admin', data.admin ? 'true' : 'false');
      
      setSuccessMsg(isLogin ? 'Login successful!' : 'Registration successful!');
      setTimeout(() => {
        onAuthSuccess(data.token, data.email, data.admin);
        setEmail('');
        setPassword('');
        setSuccessMsg('');
      }, 1000);
    } catch (err) {
      setError(err.message || 'Server connection failed');
    } finally {
      setLoading(false);
    }
  };

  if (userEmail) {
    return (
      <div className="glass-panel p-6 rounded-3xl text-center space-y-4 shadow-glow max-w-sm mx-auto">
        <CheckCircle className="w-12 h-12 text-teal-400 mx-auto" />
        <div>
          <h3 className="font-bold text-white text-lg">Authenticated</h3>
          <p className="text-xs text-brand-textMuted mt-1 truncate">Logged in as {userEmail}</p>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 rounded-xl text-sm font-semibold transition-all border border-rose-500/10"
        >
          <LogOut className="w-4 h-4" />
          Log Out
        </button>
      </div>
    );
  }

  return (
    <div className="glass-panel p-6 md:p-8 rounded-3xl shadow-glow max-w-md mx-auto space-y-6">
      <div className="flex border-b border-brand-border">
        <button
          onClick={() => { setIsLogin(true); setError(''); }}
          className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-all ${
            isLogin ? 'text-blue-400 border-blue-500' : 'text-brand-textMuted border-transparent hover:text-white'
          }`}
        >
          Log In
        </button>
        <button
          onClick={() => { setIsLogin(false); setError(''); }}
          className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-all ${
            !isLogin ? 'text-blue-400 border-blue-500' : 'text-brand-textMuted border-transparent hover:text-white'
          }`}
        >
          Register
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-brand-textMuted uppercase">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 w-4 h-4 text-brand-textMuted" />
            <input
              type="email"
              required
              placeholder="developer@snapurl.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-white text-sm"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-brand-textMuted uppercase">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 w-4 h-4 text-brand-textMuted" />
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-white text-sm"
            />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-teal-500/10 border border-teal-500/20 rounded-xl text-xs text-teal-400">
            {successMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-primary hover:opacity-90 active:scale-95 text-white py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-glow transition-all"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            isLogin ? 'Sign In' : 'Create Account'
          )}
        </button>
      </form>
    </div>
  );
}
