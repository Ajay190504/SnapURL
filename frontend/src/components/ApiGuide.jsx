import React, { useState } from 'react';
import { Terminal, Copy, Check, ChevronDown, ChevronRight, Lock, Unlock } from 'lucide-react';

export default function ApiGuide() {
  const [activeTab, setActiveTab] = useState('curl'); // 'curl', 'js', 'python'
  const [expandedEndpoint, setExpandedEndpoint] = useState('shorten'); // 'auth', 'shorten', 'redirect', 'stats'
  const [copiedText, setCopiedText] = useState(null);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const codeSnippets = {
    register: {
      curl: `curl -X POST http://localhost:8080/api/auth/register \\\n  -H "Content-Type: application/json" \\\n  -d '{"email": "user@example.com", "password": "securepassword"}'`,
      js: `fetch('http://localhost:8080/api/auth/register', {\n  method: 'POST',\n  headers: { 'Content-Type': 'application/json' },\n  body: JSON.stringify({ email: 'user@example.com', password: 'securepassword' })\n})\n.then(res => res.json())\n.then(data => console.log(data));`,
      python: `import requests\n\nurl = "http://localhost:8080/api/auth/register"\npayload = {"email": "user@example.com", "password": "securepassword"}\nresponse = requests.post(url, json=payload)\nprint(response.json())`
    },
    shorten: {
      curl: `curl -X POST http://localhost:8080/api/links \\\n  -H "Content-Type: application/json" \\\n  -H "Authorization: Bearer <your_jwt_token>" \\\n  -d '{"longUrl": "https://example.com/very-long-url", "customAlias": "my-alias"}'`,
      js: `fetch('http://localhost:8080/api/links', {\n  method: 'POST',\n  headers: {\n    'Content-Type': 'application/json',\n    'Authorization': 'Bearer ' + token\n  },\n  body: JSON.stringify({\n    longUrl: 'https://example.com/very-long-url',\n    customAlias: 'my-alias'\n  })\n})\n.then(res => res.json())\n.then(data => console.log(data));`,
      python: `import requests\n\nurl = "http://localhost:8080/api/links"\nheaders = {"Authorization": "Bearer " + token}\npayload = {\n    "longUrl": "https://example.com/very-long-url",\n    "customAlias": "my-alias"\n}\nresponse = requests.post(url, json=payload, headers=headers)\nprint(response.json())`
    },
    redirect: {
      curl: `curl -i http://localhost:8080/my-alias`,
      js: `// Perform a fetch and read headers or location redirect\nfetch('http://localhost:8080/my-alias', { method: 'GET', redirect: 'manual' })\n.then(res => console.log("Target Redirection Status:", res.status));`,
      python: `import requests\n\nresponse = requests.get("http://localhost:8080/my-alias", allow_redirects=False)\nprint("Status Code:", response.status_code)\nprint("Redirect Target:", response.headers.get('Location'))`
    },
    stats: {
      curl: `curl -X GET http://localhost:8080/api/links/my-alias/stats \\\n  -H "Authorization: Bearer <your_jwt_token>"`,
      js: `fetch('http://localhost:8080/api/links/my-alias/stats', {\n  method: 'GET',\n  headers: { 'Authorization': 'Bearer ' + token }\n})\n.then(res => res.json())\n.then(data => console.log(data));`,
      python: `import requests\n\nurl = "http://localhost:8080/api/links/my-alias/stats"\nheaders = {"Authorization": "Bearer " + token}\nresponse = requests.get(url, headers=headers)\nprint(response.json())`
    }
  };

  const toggleEndpoint = (id) => {
    setExpandedEndpoint(expandedEndpoint === id ? null : id);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
      {/* Endpoints List */}
      <div className="lg:col-span-1 space-y-4">
        <div className="glass-panel p-5 rounded-3xl shadow-glow space-y-2">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Terminal className="w-4 h-4 text-blue-400" />
            Developer API
          </h2>
          <p className="text-xs text-brand-textMuted leading-relaxed">
            SnapURL exposes full REST endpoints. Authenticated endpoints require JWT bearer tokens in the authorization header.
          </p>
        </div>

        <div className="space-y-2">
          {/* POST /register */}
          <div 
            onClick={() => toggleEndpoint('register')}
            className={`p-3 rounded-2xl glass-panel border cursor-pointer hover:bg-white/[0.02] transition-all flex items-center justify-between ${
              expandedEndpoint === 'register' ? 'border-blue-500/30' : 'border-brand-border'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded">POST</span>
              <span className="text-xs font-mono font-bold text-white">/api/auth/register</span>
            </div>
            <span className="text-brand-textMuted"><Unlock className="w-3.5 h-3.5 text-brand-textMuted" /></span>
          </div>

          {/* POST /links */}
          <div 
            onClick={() => toggleEndpoint('shorten')}
            className={`p-3 rounded-2xl glass-panel border cursor-pointer hover:bg-white/[0.02] transition-all flex items-center justify-between ${
              expandedEndpoint === 'shorten' ? 'border-blue-500/30' : 'border-brand-border'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded">POST</span>
              <span className="text-xs font-mono font-bold text-white">/api/links</span>
            </div>
            <span className="text-brand-textMuted"><Lock className="w-3.5 h-3.5 text-blue-400" /></span>
          </div>

          {/* GET /{code} */}
          <div 
            onClick={() => toggleEndpoint('redirect')}
            className={`p-3 rounded-2xl glass-panel border cursor-pointer hover:bg-white/[0.02] transition-all flex items-center justify-between ${
              expandedEndpoint === 'redirect' ? 'border-blue-500/30' : 'border-brand-border'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">GET</span>
              <span className="text-xs font-mono font-bold text-white">/{'{code}'}</span>
            </div>
            <span className="text-brand-textMuted"><Unlock className="w-3.5 h-3.5 text-brand-textMuted" /></span>
          </div>

          {/* GET /stats */}
          <div 
            onClick={() => toggleEndpoint('stats')}
            className={`p-3 rounded-2xl glass-panel border cursor-pointer hover:bg-white/[0.02] transition-all flex items-center justify-between ${
              expandedEndpoint === 'stats' ? 'border-blue-500/30' : 'border-brand-border'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">GET</span>
              <span className="text-xs font-mono font-bold text-white">/api/links/.../stats</span>
            </div>
            <span className="text-brand-textMuted"><Lock className="w-3.5 h-3.5 text-blue-400" /></span>
          </div>
        </div>
      </div>

      {/* Code Display Area */}
      <div className="lg:col-span-2 space-y-4">
        {expandedEndpoint ? (
          <div className="glass-panel rounded-3xl shadow-glow overflow-hidden border border-white/5">
            {/* Lang Tabs */}
            <div className="flex bg-black/30 border-b border-brand-border px-4 py-2 justify-between items-center">
              <div className="flex gap-2">
                {['curl', 'js', 'python'].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setActiveTab(lang)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                      activeTab === lang ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20' : 'text-brand-textMuted hover:text-white'
                    }`}
                  >
                    {lang === 'js' ? 'JavaScript' : lang === 'python' ? 'Python' : 'cURL'}
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => handleCopy(codeSnippets[expandedEndpoint][activeTab], expandedEndpoint)}
                className="p-1.5 hover:bg-white/5 rounded-lg text-brand-textMuted hover:text-white transition-all flex items-center gap-1.5 text-xs"
              >
                {copiedText === expandedEndpoint ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-teal-400" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy Code
                  </>
                )}
              </button>
            </div>

            {/* Code Blocks */}
            <div className="p-5 overflow-x-auto bg-black/40 font-mono text-xs text-brand-textActive leading-relaxed">
              <pre>{codeSnippets[expandedEndpoint][activeTab]}</pre>
            </div>

            {/* Info Footer */}
            <div className="p-4 bg-white/[0.01] border-t border-brand-border text-xs text-brand-textMuted leading-normal">
              {expandedEndpoint === 'register' && (
                <p><strong>Response Details:</strong> Returns a JSON payload containing the string JWT Bearer token inside `"token"` and the registered user email address inside `"email"`.</p>
              )}
              {expandedEndpoint === 'shorten' && (
                <p><strong>Security Requirements:</strong> Requires a Bearer JWT Token in the HTTP header `Authorization`. Exposing custom aliases checks uniqueness. An invalid URL structure returns a `400 Bad Request` validation check.</p>
              )}
              {expandedEndpoint === 'redirect' && (
                <p><strong>Operational Details:</strong> Performs a `302 Found` redirection. Enforces local IP-based rate limiting of 1000 requests per minute. Asynchronously registers referrer details and hashes the client IP address.</p>
              )}
              {expandedEndpoint === 'stats' && (
                <p><strong>Metrics Aggregation:</strong> Requires the owner's authorization token. Returns daily click volumes mapped over the last 30 days, referrers, and device breakdowns.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="glass-panel p-12 text-center rounded-3xl border-dashed border-2 border-brand-border text-brand-textMuted text-sm">
            Select an endpoint in the developer sidebar to inspect request configurations and run code snippets.
          </div>
        )}
      </div>
    </div>
  );
}
