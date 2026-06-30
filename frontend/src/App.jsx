import React, { useState, useEffect } from 'react';
import ShortenForm from './components/ShortenForm.jsx';
import Dashboard from './components/Dashboard.jsx';
import AnalyticsView from './components/AnalyticsView.jsx';
import SystemMonitor from './components/SystemMonitor.jsx';
import ApiGuide from './components/ApiGuide.jsx';
import AboutView from './components/AboutView.jsx';
import ContactUs from './components/ContactUs.jsx';
import LoginRegister from './components/LoginRegister.jsx';
import AdminPanel from './components/AdminPanel.jsx';
import { 
  Link2, LayoutDashboard, Zap, Activity, BookOpen, 
  HelpCircle, UserCheck, Key, LogIn, HeartHandshake, Shield
} from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState('landing'); 
  const [selectedCode, setSelectedCode] = useState(null);
  const [links, setLinks] = useState([]);
  const [statsUpdated, setStatsUpdated] = useState(0);
  
  // Auth state
  const [token, setToken] = useState(localStorage.getItem('snapurl_token') || null);
  const [userEmail, setUserEmail] = useState(localStorage.getItem('snapurl_email') || null);
  const [isAdmin, setIsAdmin] = useState(localStorage.getItem('snapurl_admin') === 'true');

  const fetchLinks = async () => {
    try {
      const response = await fetch('/api/links?page=0&size=50', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        }
      });
      if (response.ok) {
        const data = await response.json();
        setLinks(data.content || []);
      } else if (response.status === 401 || response.status === 403) {
        // clear invalid session
        handleLogout();
      }
    } catch (err) {
      console.error("Failed to load links:", err);
    }
  };

  useEffect(() => {
    if (currentView === 'dashboard') {
      if (!token) {
        setCurrentView('login');
      } else {
        fetchLinks();
      }
    }
  }, [currentView, statsUpdated, token]);

  const handleAuthSuccess = (newToken, email, admin) => {
    setToken(newToken);
    setUserEmail(email);
    setIsAdmin(admin);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('snapurl_token');
    localStorage.removeItem('snapurl_email');
    localStorage.removeItem('snapurl_admin');
    setToken(null);
    setUserEmail(null);
    setIsAdmin(false);
    setCurrentView('landing');
  };

  const handleViewAnalytics = (code) => {
    setSelectedCode(code);
    setCurrentView('analytics');
  };

  return (
    <div className="min-h-screen flex flex-col justify-between">
      {/* Navigation Header */}
      <header className="glass-panel sticky top-0 z-50 border-b border-brand-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          
          <div 
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => setCurrentView('landing')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow transition-transform group-hover:scale-105">
              <Zap className="w-5 h-5 text-white fill-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white">Snap<span className="text-blue-400">URL</span></span>
              <span className="block text-[10px] text-brand-textMuted tracking-wider uppercase font-semibold">High Performance</span>
            </div>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-1">
            <button
              onClick={() => setCurrentView('landing')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide uppercase transition-all ${
                currentView === 'landing' 
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' 
                  : 'text-brand-textMuted hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Link2 className="w-3.5 h-3.5" />
              Shorten
            </button>
            <button
              onClick={() => setCurrentView(token ? 'dashboard' : 'login')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide uppercase transition-all ${
                currentView === 'dashboard' || currentView === 'analytics' || currentView === 'login'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' 
                  : 'text-brand-textMuted hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              My Links
            </button>
            
            {isAdmin && (
              <button
                onClick={() => setCurrentView('admin-portal')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide uppercase transition-all ${
                  currentView === 'admin-portal' 
                    ? 'bg-rose-600/20 text-rose-400 border border-rose-500/30' 
                    : 'text-brand-textMuted hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                Admin Panel
              </button>
            )}

            <button
              onClick={() => setCurrentView('monitor')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide uppercase transition-all ${
                currentView === 'monitor' 
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' 
                  : 'text-brand-textMuted hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              Monitor
            </button>
            <button
              onClick={() => setCurrentView('api-guide')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide uppercase transition-all ${
                currentView === 'api-guide' 
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' 
                  : 'text-brand-textMuted hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Developer API
            </button>
            <button
              onClick={() => setCurrentView('about')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide uppercase transition-all ${
                currentView === 'about' 
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' 
                  : 'text-brand-textMuted hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              About
            </button>
            <button
              onClick={() => setCurrentView('contact')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide uppercase transition-all ${
                currentView === 'contact' 
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' 
                  : 'text-brand-textMuted hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <HeartHandshake className="w-3.5 h-3.5" />
              Contact
            </button>
          </nav>

          <div className="flex items-center gap-3">
            {userEmail ? (
              <div className="flex items-center gap-3 bg-white/[0.02] border border-brand-border px-3.5 py-1.5 rounded-2xl">
                <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-brand-textActive">
                  <UserCheck className="w-4 h-4 text-teal-400" />
                  <span className="truncate max-w-[120px]" title={userEmail}>{userEmail}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-xs text-rose-400 hover:text-rose-300 font-semibold uppercase tracking-wider pl-2 border-l border-brand-border"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => setCurrentView('login')}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-primary hover:opacity-90 active:scale-95 text-white text-xs font-semibold uppercase tracking-wide rounded-xl shadow-glow transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign In
              </button>
            )}
          </div>

        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow max-w-6xl w-full mx-auto px-4 py-8 md:py-12">
        {currentView === 'landing' && (
          <div className="space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight">
                Shorten Links. <br/>
                <span className="text-gradient-primary">Measure Performance.</span>
              </h1>
              <p className="text-brand-textMuted md:text-lg">
                SnapURL is built with a distributed Redis caching layer and async analytics logging to deliver sub-millisecond redirections under heavy load.
              </p>
            </div>

            <div className="max-w-xl mx-auto">
              <ShortenForm onSuccess={() => setStatsUpdated(prev => prev + 1)} />
            </div>

            {/* Micro details displaying technology stack capabilities */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto pt-8 border-t border-brand-border">
              <div className="p-4 rounded-2xl glass-panel text-center">
                <div className="text-xl font-bold text-blue-400">Cache-Aside</div>
                <div className="text-xs text-brand-textMuted mt-1">Sub-ms Redis Reads</div>
              </div>
              <div className="p-4 rounded-2xl glass-panel text-center">
                <div className="text-xl font-bold text-teal-400">Token Bucket</div>
                <div className="text-xs text-brand-textMuted mt-1">Distributed Limits</div>
              </div>
              <div className="p-4 rounded-2xl glass-panel text-center">
                <div className="text-xl font-bold text-purple-400">Async Workers</div>
                <div className="text-xs text-brand-textMuted mt-1">Non-blocking Analytics</div>
              </div>
              <div className="p-4 rounded-2xl glass-panel text-center">
                <div className="text-xl font-bold text-rose-400">JPA + MySQL</div>
                <div className="text-xs text-brand-textMuted mt-1">Durable Fallback Store</div>
              </div>
            </div>
          </div>
        )}

        {currentView === 'login' && (
          <LoginRegister 
            userEmail={userEmail}
            onAuthSuccess={handleAuthSuccess}
            onLogout={handleLogout}
          />
        )}

        {currentView === 'dashboard' && (
          <Dashboard 
            links={links} 
            onViewAnalytics={handleViewAnalytics} 
            onRefresh={fetchLinks}
          />
        )}

        {currentView === 'analytics' && (
          <AnalyticsView 
            code={selectedCode} 
            onBack={() => setCurrentView('dashboard')} 
          />
        )}

        {currentView === 'monitor' && (
          <SystemMonitor />
        )}

        {currentView === 'api-guide' && (
          <ApiGuide />
        )}

        {currentView === 'about' && (
          <AboutView />
        )}

        {currentView === 'contact' && (
          <ContactUs />
        )}

        {currentView === 'admin-portal' && (
          <AdminPanel />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-brand-border py-6 bg-brand-bg/80">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-brand-textMuted">
          <div>
            &copy; 2026 SnapURL. Built to demonstrate high-concurrency backend engineering.
          </div>
          <div className="flex items-center gap-6">
            <span>Java 21</span>
            <span>Spring Boot 3.3</span>
            <span>Redis Cache</span>
            <span>k6 Load Tested</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
