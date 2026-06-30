import React, { useState } from 'react';
import { Copy, Check, Link2, Calendar, Key, Loader2, ArrowRight } from 'lucide-react';

export default function ShortenForm({ onSuccess }) {
  const [longUrl, setLongUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!longUrl) return;

    setLoading(true);
    setError('');
    setResult(null);
    setCopied(false);

    try {
      const payload = {
        longUrl,
        customAlias: customAlias.trim() || null,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      };

      const token = localStorage.getItem('snapurl_token');
      const response = await fetch('/api/links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to shorten URL');
      }

      const data = await response.json();
      setResult(data);
      setLongUrl('');
      setCustomAlias('');
      setExpiresAt('');
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to connect to the server');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="glass-panel p-6 md:p-8 rounded-3xl space-y-6 shadow-glow">
        <div className="space-y-2">
          <label className="text-sm font-semibold tracking-wide text-brand-textMuted uppercase">Destination URL</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-brand-textMuted">
              <Link2 className="w-5 h-5" />
            </div>
            <input
              type="url"
              placeholder="https://example.com/very-long-link-path-to-shorten"
              value={longUrl}
              onChange={(e) => setLongUrl(e.target.value)}
              required
              className="glass-input w-full pl-12 pr-4 py-3.5 rounded-2xl text-white placeholder-brand-textMuted focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold tracking-wide text-brand-textMuted uppercase flex items-center gap-1.5">
              <Key className="w-4 h-4 text-blue-400" />
              Custom Alias <span className="text-[10px] text-brand-textMuted">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. promo2026"
              value={customAlias}
              onChange={(e) => setCustomAlias(e.target.value)}
              className="glass-input w-full px-4 py-3 rounded-xl text-white placeholder-brand-textMuted"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold tracking-wide text-brand-textMuted uppercase flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-purple-400" />
              Expiry Date <span className="text-[10px] text-brand-textMuted">(Optional)</span>
            </label>
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className="glass-input w-full px-4 py-2.5 rounded-xl text-white text-sm"
            />
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-sm text-rose-400">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-primary hover:opacity-90 active:scale-[0.99] text-white py-3.5 px-6 rounded-2xl font-semibold flex items-center justify-center gap-2 shadow-glow transition-all disabled:opacity-50 disabled:pointer-events-none"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Creating Link...
            </>
          ) : (
            <>
              Shorten URL
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {result && (
        <div className="glass-panel p-6 rounded-3xl border border-teal-500/20 bg-teal-950/10 animate-fade-in shadow-glow shadow-teal-500/5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-teal-400 bg-teal-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
              Success
            </span>
            {result.expiresAt && (
              <span className="text-xs text-brand-textMuted">
                Expires: {new Date(result.expiresAt).toLocaleDateString()}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <div className="text-sm text-brand-textMuted truncate">Original URL: {result.longUrl}</div>
            <div className="flex items-center gap-2 bg-black/30 p-3 rounded-2xl border border-white/5">
              <input
                type="text"
                readOnly
                value={result.shortUrl}
                className="bg-transparent border-none text-white w-full font-medium text-sm md:text-base outline-none focus:ring-0"
              />
              <button
                onClick={handleCopy}
                className="p-2 hover:bg-white/5 active:scale-95 rounded-lg text-brand-textMuted hover:text-white transition-all"
                title="Copy to Clipboard"
              >
                {copied ? <Check className="w-5 h-5 text-teal-400" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
