import React, { useState, useEffect } from 'react';
import { Users, Link, HeartHandshake, Shield, Trash2, Calendar, Mail, Loader2, AlertCircle } from 'lucide-react';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('users'); // 'users', 'links', 'contacts'
  const [users, setUsers] = useState([]);
  const [links, setLinks] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const token = localStorage.getItem('snapurl_token');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const headers = { 'Authorization': token ? `Bearer ${token}` : '' };
      
      if (activeTab === 'users') {
        const res = await fetch('/api/admin/users', { headers });
        if (!res.ok) throw new Error('Failed to load user accounts');
        const data = await res.json();
        setUsers(data);
      } else if (activeTab === 'links') {
        const res = await fetch('/api/admin/links?page=0&size=100', { headers });
        if (!res.ok) throw new Error('Failed to load global links');
        const data = await res.json();
        setLinks(data.content || []);
      } else if (activeTab === 'contacts') {
        const res = await fetch('/api/admin/contacts', { headers });
        if (!res.ok) throw new Error('Failed to load contact messages');
        const data = await res.json();
        setContacts(data);
      }
    } catch (err) {
      setError(err.message || 'Access denied or server error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleDeactivateLink = async (code) => {
    if (!window.confirm(`Are you sure you want to globally deactivate short link code: ${code}?`)) return;
    
    try {
      const response = await fetch(`/api/admin/links/${code}`, {
        method: 'DELETE',
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      
      if (!response.ok) {
        throw new Error('Failed to deactivate link');
      }
      
      // refresh list
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-2.5">
        <div className="p-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Global Moderation Console</h2>
          <p className="text-xs text-brand-textMuted mt-0.5">Moderate links, audit users, and view feedback submissions.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-brand-border gap-1">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 pb-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'users' ? 'text-rose-400 border-rose-500' : 'text-brand-textMuted border-transparent hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          User Accounts ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('links')}
          className={`flex items-center gap-2 pb-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'links' ? 'text-rose-400 border-rose-500' : 'text-brand-textMuted border-transparent hover:text-white'
          }`}
        >
          <Link className="w-4 h-4" />
          All Short Links ({links.length})
        </button>
        <button
          onClick={() => setActiveTab('contacts')}
          className={`flex items-center gap-2 pb-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'contacts' ? 'text-rose-400 border-rose-500' : 'text-brand-textMuted border-transparent hover:text-white'
          }`}
        >
          <HeartHandshake className="w-4 h-4" />
          Feedback Submissions ({contacts.length})
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-sm text-rose-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="glass-panel p-16 text-center rounded-3xl flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
          <p className="text-brand-textMuted text-xs">Querying database records...</p>
        </div>
      ) : (
        <div className="animate-fade-in">
          {/* USER TAB CONTENT */}
          {activeTab === 'users' && (
            <div className="glass-panel rounded-3xl overflow-hidden shadow-glow">
              {users.length === 0 ? (
                <div className="p-8 text-center text-brand-textMuted text-sm">No registered user profiles found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-black/35 border-b border-brand-border text-brand-textMuted text-xs uppercase tracking-wider">
                        <th className="p-4 font-semibold">User ID</th>
                        <th className="p-4 font-semibold">Email Address</th>
                        <th className="p-4 font-semibold">Registered On</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border text-sm text-brand-textActive">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-white/[0.01]">
                          <td className="p-4 font-mono text-xs text-brand-textMuted">#{u.id}</td>
                          <td className="p-4 font-semibold text-white">{u.email}</td>
                          <td className="p-4 text-brand-textMuted flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(u.createdAt).toLocaleDateString()} {new Date(u.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* LINKS TAB CONTENT */}
          {activeTab === 'links' && (
            <div className="glass-panel rounded-3xl overflow-hidden shadow-glow">
              {links.length === 0 ? (
                <div className="p-8 text-center text-brand-textMuted text-sm">No short links exist in the system.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-black/35 border-b border-brand-border text-brand-textMuted text-xs uppercase tracking-wider">
                        <th className="p-4 font-semibold">Short URL</th>
                        <th className="p-4 font-semibold">Target URL</th>
                        <th className="p-4 font-semibold text-center">Clicks</th>
                        <th className="p-4 font-semibold">Created By</th>
                        <th className="p-4 font-semibold text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border text-sm text-brand-textActive">
                      {links.map((l) => (
                        <tr key={l.id} className={`hover:bg-white/[0.01] ${!l.active ? 'opacity-40' : ''}`}>
                          <td className="p-4 font-bold text-white">/{l.shortCode}</td>
                          <td className="p-4 max-w-xs truncate text-brand-textMuted" title={l.longUrl}>{l.longUrl}</td>
                          <td className="p-4 text-center font-bold text-blue-400 font-mono">{l.clicks !== undefined ? l.clicks : 0}</td>
                          <td className="p-4 font-medium text-purple-400">{l.createdBy || 'Anonymous'}</td>
                          <td className="p-4 text-center">
                            {l.active ? (
                              <button
                                onClick={() => handleDeactivateLink(l.shortCode)}
                                className="p-1.5 bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/20 hover:border-rose-500/30 text-rose-400 hover:text-rose-300 rounded-xl transition-all"
                                title="Deactivate link globally"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            ) : (
                              <span className="text-xs text-brand-textMuted italic font-semibold">Deactivated</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* CONTACTS TAB CONTENT */}
          {activeTab === 'contacts' && (
            <div className="space-y-4">
              {contacts.length === 0 ? (
                <div className="glass-panel p-8 text-center rounded-3xl text-brand-textMuted text-sm shadow-glow">No contact inquiries found.</div>
              ) : (
                contacts.map((c) => (
                  <div key={c.id} className="glass-panel p-5 rounded-3xl space-y-3 border border-white/5 shadow-glow hover:border-white/10 transition-all">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{c.name}</span>
                        <span className="text-xs text-brand-textMuted flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          ({c.email})
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-brand-textMuted bg-white/5 px-2.5 py-0.5 rounded-lg">
                        {new Date(c.createdAt).toLocaleDateString()} {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-blue-400 uppercase tracking-wide">
                      Subject: {c.subject}
                    </div>
                    <div className="p-3 bg-black/35 rounded-2xl border border-white/5 text-xs text-brand-textActive leading-relaxed whitespace-pre-line font-medium">
                      {c.message}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
