import React from 'react';
import { Compass, BookOpen, HardDrive, Key, GitFork } from 'lucide-react';

export default function AboutView() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-extrabold tracking-tight text-white">System Architecture & Design</h2>
        <p className="text-brand-textMuted text-sm">An in-depth review of the engineering decisions and mathematical logic inside SnapURL.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Caching Architecture */}
        <div className="glass-panel p-6 rounded-3xl space-y-4 shadow-glow">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
              <HardDrive className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">Distributed Cache-Aside</h3>
          </div>
          <p className="text-sm text-brand-textMuted leading-relaxed">
            Redirections are the critical hot path of the system. To avoid overloading MySQL, SnapURL reads from a Redis in-memory cache first (lazy-loading). 
            If a key is missing, it loads from MySQL and populates Redis with a 24-hour TTL (or the link's remaining lifetime). If Redis experiences a network disconnect or crash, the service catches the Lettuce connection exception and falls back to MySQL directly to prevent downtime.
          </p>
        </div>

        {/* Distributed Rate Limiting */}
        <div className="glass-panel p-6 rounded-3xl space-y-4 shadow-glow">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-teal-500/10 text-teal-400 rounded-xl border border-teal-500/20">
              <GitFork className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">Token Bucket Rate Limiting</h3>
          </div>
          <p className="text-sm text-brand-textMuted leading-relaxed">
            API endpoints are protected by distributed token buckets via Bucket4j and a Lettuce CAS (Compare-And-Swap) Redis connector. 
            This ensures that rate-limiting states are shared atomically across multiple application clusters. If Redis is down, the filters fallback automatically to local memory thread-safe caches, ensuring API protection continues locally.
          </p>
        </div>
      </div>

      {/* Base62 Mathematics Section */}
      <div className="glass-panel p-6 md:p-8 rounded-3xl shadow-glow space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
            <Key className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-base">Base62 Short Code Math</h3>
        </div>
        <p className="text-sm text-brand-textMuted leading-relaxed">
          Instead of generating random strings (which can collide and require expensive database checks), SnapURL converts the database auto-increment primary key ID into a Base62 string representation. 
          The alphabet consists of 62 alpha-numeric characters:
        </p>
        <div className="p-4 bg-black/40 border border-white/5 rounded-2xl font-mono text-xs text-center text-teal-400 tracking-wider">
          0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ
        </div>
        <p className="text-sm text-brand-textMuted leading-relaxed">
          To convert an ID (e.g. <code>125</code>) to Base62, we repeatedly divide by <code>62</code> and append the remainder indices:
        </p>
        <div className="p-4 bg-black/20 rounded-2xl text-xs space-y-2 font-mono text-brand-textMuted">
          <div>- 125 % 62 = 1 (Alphabet character index 1 is <span className="text-white">'1'</span>)</div>
          <div>- 125 / 62 = 2</div>
          <div>- 2 % 62 = 2 (Alphabet character index 2 is <span className="text-white">'2'</span>)</div>
          <div>- Reversing the remainders yields the short code: <span className="text-blue-400 font-bold">"21"</span></div>
        </div>
        <p className="text-sm text-brand-textMuted leading-relaxed">
          This bidirectional encoding ensures that codes map directly back to their primary keys in $O(1)$ time, eliminating index lookups for random string aliases.
        </p>
      </div>
    </div>
  );
}
