import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Calendar, Compass, Monitor, Globe, BarChart2,
  TrendingUp, Eye, ShieldAlert, Loader2
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, BarChart, Bar, 
  XAxis, YAxis, Tooltip, CartesianGrid, Legend, Cell 
} from 'recharts';

export default function AnalyticsView({ code, onBack }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('snapurl_token');
        const response = await fetch(`/api/links/${code}/stats`, {
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
          }
        });
        if (!response.ok) {
          throw new Error('Failed to load link statistics');
        }
        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err.message || 'Error occurred while loading analytics');
      } finally {
        setLoading(false);
      }
    };

    if (code) {
      fetchStats();
    }
  }, [code]);

  if (loading) {
    return (
      <div className="glass-panel p-16 text-center rounded-3xl flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-brand-textMuted">Loading real-time redirection metrics...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="glass-panel p-12 text-center rounded-3xl space-y-4 border border-rose-500/20">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="text-xl font-bold text-white">Analytics Unavailable</h3>
        <p className="text-brand-textMuted max-w-md mx-auto">{error || 'Could not fetch data for this link.'}</p>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-medium text-white transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
      </div>
    );
  }

  // Derived metrics
  const topReferrer = stats.referrers.length > 0 ? stats.referrers[0].referrer : 'None';
  const topDevice = stats.devices.length > 0 ? stats.devices[0].device : 'None';

  // Palette for chart items
  const COLORS = ['#3B82F6', '#0D9488', '#8B5CF6', '#F43F5E', '#E2E8F0'];

  return (
    <div className="space-y-8">
      {/* Header and Back Link */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <button
            onClick={onBack}
            className="group flex items-center gap-1 text-sm text-brand-textMuted hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Dashboard
          </button>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Analytics for <span className="text-blue-400 font-mono text-xl">/{code}</span>
          </h2>
          <p className="text-xs text-brand-textMuted truncate max-w-xl">Destination URL: {stats.longUrl}</p>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Eye className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{stats.totalClicks}</div>
            <div className="text-xs text-brand-textMuted">Total Redirections</div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">30d</div>
            <div className="text-xs text-brand-textMuted">Analysis Window</div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <div className="text-md font-bold text-white truncate max-w-[150px]">{topReferrer}</div>
            <div className="text-xs text-brand-textMuted">Top Referrer Source</div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <Monitor className="w-6 h-6" />
          </div>
          <div>
            <div className="text-md font-bold text-white">{topDevice}</div>
            <div className="text-xs text-brand-textMuted">Top Device Category</div>
          </div>
        </div>
      </div>

      {/* Main Click Volume Chart (Line) */}
      <div className="glass-panel p-6 rounded-3xl shadow-glow">
        <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-blue-400" />
          Redirect Traffic volume (Last 30 Days)
        </h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.clicksOverTime} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="rgba(255,255,255,0.4)" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
              />
              <YAxis 
                stroke="rgba(255,255,255,0.4)" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip 
                contentStyle={{ 
                  background: '#161d30', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  borderRadius: '12px' 
                }} 
                labelStyle={{ color: '#fff' }}
              />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#3B82F6" 
                strokeWidth={3} 
                dot={{ r: 4, strokeWidth: 0, fill: '#3B82F6' }}
                activeDot={{ r: 6 }}
                name="Redirects"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Breakdowns Row (Referrers & Devices) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Referrer Breakdown Bar Chart */}
        <div className="glass-panel p-6 rounded-3xl shadow-glow">
          <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2">
            <Globe className="w-4 h-4 text-teal-400" />
            Referral Sources
          </h3>
          <div className="h-64 w-full">
            {stats.referrers.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-brand-textMuted">
                No referral data recorded.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.referrers} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis type="number" stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis 
                    dataKey="referrer" 
                    type="category" 
                    stroke="rgba(255,255,255,0.6)" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false}
                    width={80}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      background: '#161d30', 
                      border: '1px solid rgba(255,255,255,0.1)', 
                      borderRadius: '12px' 
                    }} 
                  />
                  <Bar dataKey="count" name="Clicks" radius={[0, 4, 4, 0]}>
                    {stats.referrers.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Device Breakdown Bar Chart */}
        <div className="glass-panel p-6 rounded-3xl shadow-glow">
          <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2">
            <Monitor className="w-4 h-4 text-purple-400" />
            Device Categories
          </h3>
          <div className="h-64 w-full">
            {stats.devices.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-brand-textMuted">
                No device data recorded.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.devices} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="device" stroke="rgba(255,255,255,0.6)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      background: '#161d30', 
                      border: '1px solid rgba(255,255,255,0.1)', 
                      borderRadius: '12px' 
                    }} 
                  />
                  <Bar dataKey="count" name="Clicks" radius={[4, 4, 0, 0]}>
                    {stats.devices.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
