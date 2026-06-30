import React, { useState } from 'react';
import { BarChart3, Edit2, Trash2, ExternalLink, RefreshCw, Copy, Check, X, Calendar, Link2 } from 'lucide-react';

export default function Dashboard({ links, onViewAnalytics, onRefresh }) {
  const [editingLink, setEditingLink] = useState(null); // Link object being edited
  const [editLongUrl, setEditLongUrl] = useState('');
  const [editExpiresAt, setEditExpiresAt] = useState('');
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);

  const handleCopy = (url, code) => {
    navigator.clipboard.writeText(url);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleToggleActive = async (code, currentStatus) => {
    try {
      const token = localStorage.getItem('snapurl_token');
      const response = await fetch(`/api/links/${code}/toggle?active=${!currentStatus}`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        }
      });
      if (response.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error("Failed to toggle link active state:", err);
    }
  };

  const handleDelete = async (code) => {
    if (!window.confirm("Are you sure you want to deactivate (delete) this short link? This will invalidate the cache.")) return;
    try {
      const token = localStorage.getItem('snapurl_token');
      const response = await fetch(`/api/links/${code}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        }
      });
      if (response.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error("Failed to delete link:", err);
    }
  };

  const startEdit = (link) => {
    setEditingLink(link);
    setEditLongUrl(link.longUrl);
    setEditExpiresAt(link.expiresAt ? link.expiresAt.substring(0, 16) : '');
    setEditError('');
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editLongUrl) return;

    setEditLoading(true);
    setEditError('');
    try {
      const token = localStorage.getItem('snapurl_token');
      const response = await fetch(`/api/links/${editingLink.shortCode}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          longUrl: editLongUrl,
          expiresAt: editExpiresAt ? new Date(editExpiresAt).toISOString() : null,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to update link');
      }

      setEditingLink(null);
      onRefresh();
    } catch (err) {
      setEditError(err.message || 'Failed to update link');
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Links Dashboard</h2>
          <p className="text-sm text-brand-textMuted mt-0.5">Manage link configurations and view redirect analytics.</p>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 p-2 hover:bg-white/5 active:scale-95 text-brand-textMuted hover:text-white rounded-xl border border-brand-border transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {links.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-3xl border-dashed border-2 border-brand-border">
          <p className="text-brand-textMuted">No links shortened yet. Go to the shorten tab to create your first link!</p>
        </div>
      ) : (
        <div className="glass-panel rounded-3xl overflow-hidden shadow-glow">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-brand-border text-xs font-semibold tracking-wider text-brand-textMuted uppercase bg-black/20">
                  <th className="px-6 py-4">Short Code & Link</th>
                  <th className="px-6 py-4">Destination Link</th>
                  <th className="px-6 py-4 text-center">Clicks</th>
                  <th className="px-6 py-4">Created At</th>
                  <th className="px-6 py-4">Expires At</th>
                  <th className="px-6 py-4 text-center">Active</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/40 text-sm">
                {links.map((link) => (
                  <tr key={link.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="font-semibold text-white flex items-center gap-1.5">
                          {link.shortCode}
                          {link.customAlias && (
                            <span className="text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded-md">Alias</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-brand-textMuted">
                          <span className="truncate max-w-[180px]">{link.shortUrl}</span>
                          <button
                            onClick={() => handleCopy(link.shortUrl, link.shortCode)}
                            className="p-1 hover:bg-white/5 rounded text-brand-textMuted hover:text-white"
                          >
                            {copiedCode === link.shortCode ? (
                              <Check className="w-3.5 h-3.5 text-teal-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-[200px]">
                      <div className="flex items-center gap-1.5 text-brand-textMuted hover:text-white">
                        <span className="truncate block" title={link.longUrl}>{link.longUrl}</span>
                        <a href={link.longUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 p-1 rounded hover:bg-white/5">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-block px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/10">
                        {link.clicks}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-brand-textMuted">
                      {new Date(link.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-brand-textMuted">
                      {link.expiresAt ? new Date(link.expiresAt).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleToggleActive(link.shortCode, link.active)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          link.active ? 'bg-blue-600' : 'bg-white/10'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            link.active ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onViewAnalytics(link.shortCode)}
                          className="p-2 hover:bg-blue-500/10 hover:text-blue-400 text-brand-textMuted rounded-lg transition-colors"
                          title="View Analytics"
                        >
                          <BarChart3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => startEdit(link)}
                          className="p-2 hover:bg-purple-500/10 hover:text-purple-400 text-brand-textMuted rounded-lg transition-colors"
                          title="Edit Link"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(link.shortCode)}
                          className="p-2 hover:bg-rose-500/10 hover:text-rose-400 text-brand-textMuted rounded-lg transition-colors"
                          title="Deactivate Link"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingLink && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg rounded-3xl shadow-glow overflow-hidden animate-fade-in border border-white/10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border">
              <h3 className="font-bold text-white text-lg">Modify Short Link ({editingLink.shortCode})</h3>
              <button
                onClick={() => setEditingLink(null)}
                className="p-1.5 hover:bg-white/5 text-brand-textMuted hover:text-white rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-brand-textMuted uppercase flex items-center gap-1">
                  <Link2 className="w-3.5 h-3.5" />
                  Target URL
                </label>
                <input
                  type="url"
                  required
                  value={editLongUrl}
                  onChange={(e) => setEditLongUrl(e.target.value)}
                  className="glass-input w-full px-4 py-2.5 rounded-xl text-white text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-brand-textMuted uppercase flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Expiration Time
                </label>
                <input
                  type="datetime-local"
                  value={editExpiresAt}
                  onChange={(e) => setEditExpiresAt(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="glass-input w-full px-4 py-2.5 rounded-xl text-white text-sm"
                />
              </div>

              {editError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400">
                  {editError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingLink(null)}
                  className="px-4 py-2 text-sm font-medium text-brand-textMuted hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-4 py-2 text-sm font-medium bg-gradient-primary hover:opacity-90 active:scale-95 text-white rounded-xl shadow-glow transition-all"
                >
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
