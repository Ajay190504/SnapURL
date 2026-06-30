import React, { useState, useEffect } from 'react';
import { Database, HardDrive, Cpu, Activity, ShieldCheck, RefreshCw, Loader2, ArrowRight } from 'lucide-react';

export default function SystemMonitor() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pollingActive, setPollingActive] = useState(true);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/monitor/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch system stats');
      }
      const data = await response.json();
      setStats(data);
      setError('');
    } catch (err) {
      setError('Failed to load monitor stats from API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    let interval;
    if (pollingActive) {
      interval = setInterval(fetchStats, 3000);
    }
    return () => clearInterval(interval);
  }, [pollingActive]);

  if (loading) {
    return (
      <div className="glass-panel p-16 text-center rounded-3xl flex flex-col items-center justify-center gap-4 max-w-2xl mx-auto">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-brand-textMuted">Querying Actuator and system stats...</p>
      </div>
    );
  }

  const memoryPercent = stats ? Math.min(100, Math.round((stats.usedMemoryMb / stats.totalMemoryMb) * 100)) : 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" />
            Live System Performance Monitor
          </h2>
          <p className="text-sm text-brand-textMuted mt-0.5">Real-time JVM runtime statistics, cache hit counters, and database state.</p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-xs text-brand-textMuted cursor-pointer">
            <input
              type="checkbox"
              checked={pollingActive}
              onChange={(e) => setPollingActive(e.target.checked)}
              className="rounded bg-black/40 border-brand-border text-blue-500"
            />
            Auto-poll (3s)
          </label>
          <button
            onClick={fetchStats}
            className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all"
            title="Force refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-sm text-rose-400">
          {error}
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Services Dependency Cards */}
          <div className="md:col-span-1 space-y-4">
            <div className="glass-panel p-5 rounded-3xl space-y-4 shadow-glow">
              <h3 className="text-xs font-semibold text-brand-textMuted uppercase tracking-wider">Dependency Health</h3>
              
              <div className="flex items-center justify-between p-3 bg-black/20 rounded-2xl border border-white/5">
                <div className="flex items-center gap-2.5">
                  <Database className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium text-white">MySQL Database</span>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                  stats.databaseStatus === 'UP' ? 'bg-teal-500/15 text-teal-400 border border-teal-500/20' : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${stats.databaseStatus === 'UP' ? 'bg-teal-400 animate-pulse' : 'bg-rose-400'}`}></span>
                  {stats.databaseStatus}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-black/20 rounded-2xl border border-white/5">
                <div className="flex items-center gap-2.5">
                  <HardDrive className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-medium text-white">Redis Cache</span>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                  stats.redisStatus === 'UP' ? 'bg-teal-500/15 text-teal-400 border border-teal-500/20' : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${stats.redisStatus === 'UP' ? 'bg-teal-400 animate-pulse' : 'bg-rose-400'}`}></span>
                  {stats.redisStatus}
                </span>
              </div>

              {stats.redisStatus === 'DOWN' && (
                <div className="p-3 bg-rose-500/5 rounded-2xl border border-rose-500/10 text-[11px] text-rose-400/80 leading-relaxed">
                  <strong>Notice:</strong> Redis is offline. Rate limiting and URL redirects are running gracefully on database fallback and in-memory caches.
                </div>
              )}
            </div>
          </div>

          {/* JVM RAM Utilization */}
          <div className="md:col-span-2 space-y-4">
            <div className="glass-panel p-6 rounded-3xl shadow-glow space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-brand-textMuted uppercase tracking-wider flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-teal-400" />
                  JVM RAM Allocation
                </h3>
                <span className="text-xs text-brand-textMuted">Max Size: {stats.maxMemoryMb} MB</span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white font-medium">Memory Usage</span>
                  <span className="text-brand-textMuted font-mono">{stats.usedMemoryMb} MB / {stats.totalMemoryMb} MB ({memoryPercent}%)</span>
                </div>
                <div className="w-full bg-black/40 h-3 rounded-full overflow-hidden border border-white/5">
                  <div
                    style={{ width: `${memoryPercent}%` }}
                    className="h-full bg-gradient-to-r from-blue-500 to-teal-500 rounded-full transition-all duration-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-2 border-t border-brand-border">
                <div className="text-center">
                  <div className="text-xs text-brand-textMuted">Free Alloc</div>
                  <div className="text-sm font-semibold text-white mt-0.5">{stats.freeMemoryMb} MB</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-brand-textMuted">Total Allocated</div>
                  <div className="text-sm font-semibold text-white mt-0.5">{stats.totalMemoryMb} MB</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-brand-textMuted">Max Cap</div>
                  <div className="text-sm font-semibold text-white mt-0.5">{stats.maxMemoryMb} MB</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Caching Metrics */}
          <div className="glass-panel p-6 rounded-3xl shadow-glow space-y-4">
            <h3 className="text-xs font-semibold text-brand-textMuted uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              Caching Performance
            </h3>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-black/20 rounded-2xl border border-white/5">
                <div className="text-xs text-brand-textMuted">Hits</div>
                <div className="text-lg font-bold text-white mt-0.5">{stats.cacheHits}</div>
              </div>
              <div className="p-3 bg-black/20 rounded-2xl border border-white/5">
                <div className="text-xs text-brand-textMuted">Misses</div>
                <div className="text-lg font-bold text-white mt-0.5">{stats.cacheMisses}</div>
              </div>
              <div className="p-3 bg-black/20 rounded-2xl border border-white/5">
                <div className="text-xs text-brand-textMuted">Hit Ratio</div>
                <div className="text-lg font-bold text-teal-400 mt-0.5">{Math.round(stats.cacheHitRatio)}%</div>
              </div>
            </div>

            <div className="space-y-1 pt-2">
              <div className="flex justify-between text-xs text-brand-textMuted">
                <span>Hit Efficiency</span>
                <span>{Math.round(stats.cacheHitRatio)}%</span>
              </div>
              <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden border border-white/5">
                <div
                  style={{ width: `${stats.cacheHitRatio}%` }}
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                />
              </div>
            </div>
          </div>

          {/* Thread Pool Queues */}
          <div className="glass-panel p-6 rounded-3xl shadow-glow space-y-4">
            <h3 className="text-xs font-semibold text-brand-textMuted uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-purple-400" />
              ThreadPoolTaskExecutor (`clickExecutor`)
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-black/20 rounded-2xl border border-white/5">
                <div>
                  <div className="text-sm font-semibold text-white">{stats.activeThreads}</div>
                  <div className="text-xs text-brand-textMuted">Active Worker Threads</div>
                </div>
                <div className="text-xs text-brand-textMuted bg-white/5 px-2.5 py-1 rounded-lg">Limit: 50</div>
              </div>

              <div className="flex items-center justify-between p-3 bg-black/20 rounded-2xl border border-white/5">
                <div>
                  <div className="text-sm font-semibold text-white">{stats.queueSize}</div>
                  <div className="text-xs text-brand-textMuted">In-Queue Backlogged Click Tasks</div>
                </div>
                <div className="text-xs text-brand-textMuted bg-white/5 px-2.5 py-1 rounded-lg">Cap: 500</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
