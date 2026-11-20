import React, { useState, useEffect } from 'react';
import ApiService from './services/api';
import { UserProfile } from './types';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import Transactions from './pages/Transactions';
import Ledger from './pages/Ledger';
import Liquidity from './pages/Liquidity';
import BusinessAnalytics from './pages/BusinessAnalytics';
import CustomerIntelligence from './pages/CustomerIntelligence';
import ConsentFlow from './pages/ConsentFlow';
import ModelPerformance from './pages/ModelPerformance';
import DataExplorer from './pages/DataExplorer';
import DemoManagement from './pages/DemoManagement';
import Settings from './pages/Settings';
import AIInsights from './pages/AIInsights';
import { Onboarding } from './pages/Onboarding';
import { TrustedSources } from './pages/TrustedSources';
import { AddBusinessLocation } from './pages/AddBusinessLocation';
import { Referrals } from './pages/Referrals';
import { InstitutionalReferrals } from './pages/InstitutionalReferrals';
import { UssdSimulator } from './components/UssdSimulator';
import { Sparkles, ShieldAlert, AlertCircle, Activity } from 'lucide-react';
// @ts-ignore
import BorderGlow from './components/BorderGlow';
import LandingPage from './pages/LandingPage';
import ErrorBoundary from './components/ErrorBoundary';



const Unauthorized: React.FC = () => (
  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 p-6 animate-fadeIn">
    <div className="premium-card bg-white max-w-sm text-center space-y-4">
      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto text-red-650">
        <ShieldAlert className="h-6 w-6" />
      </div>
      <div className="space-y-1">
        <h3 className="font-extrabold text-base text-slate-900">Access Denied</h3>
        <p className="text-xs text-slate-500">
          Your account does not possess the permissions required to view this module.
        </p>
      </div>
    </div>
  </div>
);

const PAGE_PERMISSIONS: Record<string, string[]> = {
  dashboard: ['AGENT', 'FINANCIAL_INSTITUTION'],
  'admin-dashboard': ['ADMIN'],
  transactions: ['AGENT'],
  ledger: ['AGENT'],
  liquidity: ['AGENT'],
  analytics: ['AGENT', 'FINANCIAL_INSTITUTION'],
  credit: ['FINANCIAL_INSTITUTION'],
  consent: ['AGENT', 'FINANCIAL_INSTITUTION', 'ADMIN'],
  performance: ['ADMIN'],
  explorer: ['ADMIN'],
  'demo-mgmt': ['ADMIN'],
  settings: ['AGENT', 'FINANCIAL_INSTITUTION', 'ADMIN'],
  'ai-insights': ['AGENT'],
  'add-business': ['AGENT', 'ADMIN'],
  'trusted-sources': ['AGENT'],
  referrals: ['AGENT', 'FINANCIAL_INSTITUTION']
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [activePage, setActivePage] = useState<string>('dashboard');
  const [usernameInput, setUsernameInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'landing' | 'login' | 'onboarding'>('landing');
  const [networkErrorMsg, setNetworkErrorMsg] = useState<string | null>(null);
  const [lastAttemptParams, setLastAttemptParams] = useState<any | null>(null);
  const [runtimeError, setRuntimeError] = useState<{ message: string; stack?: string; filename?: string; lineno?: number } | null>(null);

  // Catch any unhandled runtime exceptions or promise rejections globally
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const isExtension = 
        event.filename?.includes('chrome-extension') || 
        event.message?.includes('MetaMask') || 
        event.error?.stack?.includes('chrome-extension') ||
        (event.filename && !event.filename.includes(window.location.host) && !event.filename.includes('localhost') && !event.filename.includes('127.0.0.1'));
      
      if (isExtension) {
        console.warn("Ignored extension runtime error:", event.message);
        return;
      }

      setRuntimeError({
        message: event.message,
        stack: event.error?.stack,
        filename: event.filename,
        lineno: event.lineno
      });
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      const reasonStr = event.reason?.message || String(event.reason);
      const stackStr = event.reason?.stack || '';
      
      const isExtension = 
        reasonStr.includes('MetaMask') || 
        stackStr.includes('chrome-extension') ||
        reasonStr.includes('extensions');

      if (isExtension) {
        console.warn("Ignored extension promise rejection:", reasonStr);
        return;
      }

      setRuntimeError({
        message: reasonStr,
        stack: stackStr
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  // Unify history routing popstate and initial mounting checks
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const sessionUser = ApiService.getCurrentUser();

      if (path === '/onboarding/agent') {
        if (sessionUser) {
          const dashboardPath = sessionUser.role === 'AGENT' ? '/agent/dashboard' : sessionUser.role === 'FINANCIAL_INSTITUTION' ? '/institution/dashboard' : '/admin/dashboard';
          window.history.replaceState({}, '', dashboardPath);
          setCurrentUser(sessionUser);
          setActivePage(sessionUser.role === 'ADMIN' ? 'admin-dashboard' : 'dashboard');
        } else {
          setViewMode('onboarding');
          setCurrentUser(null);
        }
      } else if (path === '/login') {
        if (sessionUser) {
          const dashboardPath = sessionUser.role === 'AGENT' ? '/agent/dashboard' : sessionUser.role === 'FINANCIAL_INSTITUTION' ? '/institution/dashboard' : '/admin/dashboard';
          window.history.replaceState({}, '', dashboardPath);
          setCurrentUser(sessionUser);
          setActivePage(sessionUser.role === 'ADMIN' ? 'admin-dashboard' : 'dashboard');
        } else {
          setViewMode('login');
          setCurrentUser(null);
        }
      } else if (path === '/agent/dashboard' || path === '/institution/dashboard' || path === '/admin/dashboard') {
        if (sessionUser) {
          const isAgentPath = sessionUser.role === 'AGENT' && path === '/agent/dashboard';
          const isFiPath = sessionUser.role === 'FINANCIAL_INSTITUTION' && path === '/institution/dashboard';
          const isAdminPath = sessionUser.role === 'ADMIN' && path === '/admin/dashboard';

          if (isAgentPath || isFiPath || isAdminPath) {
            setCurrentUser(sessionUser);
            setActivePage(sessionUser.role === 'ADMIN' ? 'admin-dashboard' : 'dashboard');
          } else {
            // Mismatch, redirect to correct role path
            const dashboardPath = sessionUser.role === 'AGENT' ? '/agent/dashboard' : sessionUser.role === 'FINANCIAL_INSTITUTION' ? '/institution/dashboard' : '/admin/dashboard';
            window.history.replaceState({}, '', dashboardPath);
            setCurrentUser(sessionUser);
            setActivePage(sessionUser.role === 'ADMIN' ? 'admin-dashboard' : 'dashboard');
          }
        } else {
          // No session, redirect to login
          window.history.replaceState({}, '', '/login');
          setViewMode('login');
          setCurrentUser(null);
        }
      } else {
        // Root path "/" or unknown
        setViewMode('landing');
        setCurrentUser(null);
        
        // Remove AUTHENTICATION SESSION tokens from localStorage on root entry
        localStorage.removeItem('mobifin_token');
        localStorage.removeItem('mobifin_role');
        localStorage.removeItem('mobifin_username');
        localStorage.removeItem('mobifin_agent_id');
      }
    };

    window.addEventListener('popstate', handlePopState);
    handlePopState(); // Initial check on mount

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Sync route path to root "/" when user logging out or currentUser goes null on dashboard
  useEffect(() => {
    if (!currentUser) {
      const sessionUser = ApiService.getCurrentUser();
      if (!sessionUser) {
        const path = window.location.pathname;
        if (path === '/agent/dashboard' || path === '/institution/dashboard' || path === '/admin/dashboard') {
          window.history.pushState({}, '', '/');
          setViewMode('landing');
        }
      }
    }
  }, [currentUser]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput || !passwordInput) return;
    
    // Explicitly disable local demo mode for real manual login attempts
    ApiService.setDemoMode(false);
    
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      await ApiService.login(usernameInput, passwordInput);
      const user = ApiService.getCurrentUser();
      setCurrentUser(user);
      
      if (user) {
        if (user.role === 'AGENT') {
          window.history.pushState({}, '', '/agent/dashboard');
          setActivePage('dashboard');
        } else if (user.role === 'FINANCIAL_INSTITUTION') {
          window.history.pushState({}, '', '/institution/dashboard');
          setActivePage('dashboard');
        } else {
          window.history.pushState({}, '', '/admin/dashboard');
          setActivePage('admin-dashboard');
        }
      }
    } catch (err: any) {
      if (err.message && (err.message.includes('connect') || err.message.includes('reach') || err.message.includes('failed') || err.message.includes('Failed') || err.message.includes('Load failed'))) {
        setNetworkErrorMsg(err.message);
        setLastAttemptParams({ type: 'manual', u: usernameInput, p: passwordInput });
      } else {
        setLoginError(err.message || 'Incorrect username or password');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handlePresetLogin = async (userPreset: 'kwame' | 'forms' | 'admin') => {
    setIsLoggingIn(true);
    setLoginError(null);

    // 1. Instantly toggle client-side Demo Mode
    ApiService.setDemoMode(true);

    let role = 'AGENT';
    let username = 'kwame';
    let agent_id = '1';

    if (userPreset === 'forms') {
      role = 'FINANCIAL_INSTITUTION';
      username = 'forms_capital';
      agent_id = '';
    } else if (userPreset === 'admin') {
      role = 'ADMIN';
      username = 'admin';
      agent_id = '';
    }

    // 2. Initialize local storage registers
    localStorage.setItem('mobifin_token', `demo_token_${userPreset}`);
    localStorage.setItem('mobifin_role', role);
    localStorage.setItem('mobifin_username', username);
    if (agent_id) {
      localStorage.setItem('mobifin_agent_id', agent_id);
    } else {
      localStorage.removeItem('mobifin_agent_id');
    }

    // 3. Pre-seed offline referrals list if it does not exist
    let referrals = JSON.parse(localStorage.getItem('mobifin_demo_referrals') || '[]');
    if (referrals.length === 0) {
      referrals = [
        {
          referral_id: 101,
          agent_id: 1,
          customer_id: 1048,
          institution_id: 60,
          requested_amount: 5000.0,
          purpose: "Shop inventory restock",
          status: "CONSENT_REQUESTED",
          consent_status: "AWAITING_CONSENT",
          created_at: new Date().toISOString(),
          consent_requested_at: new Date().toISOString(),
          application_status: "PENDING",
          customer_name: "Customer #1048",
          agent_name: "Kwame's Mobile Money Centre"
        }
      ];
      localStorage.setItem('mobifin_demo_referrals', JSON.stringify(referrals));
    }

    // 4. Update session profile and redirect instantly
    const user = ApiService.getCurrentUser();
    setCurrentUser(user);
    
    if (user) {
      if (user.role === 'AGENT') {
        window.history.pushState({}, '', '/agent/dashboard');
        setActivePage('dashboard');
      } else if (user.role === 'FINANCIAL_INSTITUTION') {
        window.history.pushState({}, '', '/institution/dashboard');
        setActivePage('dashboard');
      } else {
        window.history.pushState({}, '', '/admin/dashboard');
        setActivePage('admin-dashboard');
      }
    }
    
    setIsLoggingIn(false);
  };

  const handleRoleSwitch = async (role: 'AGENT' | 'FINANCIAL_INSTITUTION' | 'ADMIN') => {
    // If in demo mode, execute role switch locally in 0ms without hitting APIs
    if (ApiService.isDemoMode()) {
      let username = 'admin';
      let agent_id = '';
      let preset = 'admin';

      if (role === 'AGENT') {
        username = 'kwame';
        agent_id = '1';
        preset = 'kwame';
      } else if (role === 'FINANCIAL_INSTITUTION') {
        username = 'forms_capital';
        agent_id = '';
        preset = 'forms';
      }

      localStorage.setItem('mobifin_token', `demo_token_${preset}`);
      localStorage.setItem('mobifin_role', role);
      localStorage.setItem('mobifin_username', username);
      if (agent_id) {
        localStorage.setItem('mobifin_agent_id', agent_id);
      } else {
        localStorage.removeItem('mobifin_agent_id');
      }

      const profile = ApiService.getCurrentUser();
      setCurrentUser(profile);

      if (role === 'AGENT') {
        window.history.pushState({}, '', '/agent/dashboard');
        setActivePage('dashboard');
      } else if (role === 'FINANCIAL_INSTITUTION') {
        window.history.pushState({}, '', '/institution/dashboard');
        setActivePage('dashboard');
      } else {
        window.history.pushState({}, '', '/admin/dashboard');
        setActivePage('admin-dashboard');
      }
      return;
    }

    // Online Mode role switcher (calls real backend api for authentication)
    let username = 'admin';
    let password = 'admin123';
    
    if (role === 'AGENT') {
      username = 'kwame';
      password = 'kwame123';
    } else if (role === 'FINANCIAL_INSTITUTION') {
      username = 'forms_capital';
      password = 'forms123';
    }
    
    try {
      await ApiService.login(username, password);
      const profile = ApiService.getCurrentUser();
      setCurrentUser(profile);
      
      if (role === 'AGENT') {
        window.history.pushState({}, '', '/agent/dashboard');
        setActivePage('dashboard');
      } else if (role === 'FINANCIAL_INSTITUTION') {
        window.history.pushState({}, '', '/institution/dashboard');
        setActivePage('dashboard');
      } else {
        window.history.pushState({}, '', '/admin/dashboard');
        setActivePage('admin-dashboard');
      }
    } catch (e: any) {
      if (e.message && (e.message.includes('connect') || e.message.includes('reach') || e.message.includes('failed') || e.message.includes('Failed') || e.message.includes('Load failed'))) {
        setNetworkErrorMsg(e.message);
        setLastAttemptParams({ type: 'switch', role });
      } else {
        alert(`Role switch login failed. Make sure database is seeded! Error: ${e.message}`);
      }
    }
  };

  // Render active page with permission gating
  const renderPage = () => {
    if (!currentUser) return null;

    const allowedRoles = PAGE_PERMISSIONS[activePage];
    if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
      return <Unauthorized />;
    }

    switch (activePage) {
      case 'dashboard':
        return <Dashboard setActivePage={setActivePage} currentUser={currentUser} />;
      case 'admin-dashboard':
        return <AdminDashboard />;
      case 'transactions':
        return <Transactions />;
      case 'ledger':
        return <Ledger />;
      case 'liquidity':
        return <Liquidity setActivePage={setActivePage} />;
      case 'analytics':
        return <BusinessAnalytics />;
      case 'credit':
        return <CustomerIntelligence />;
      case 'consent':
        return <ConsentFlow />;
      case 'referrals':
        return currentUser.role === 'FINANCIAL_INSTITUTION' ? <InstitutionalReferrals /> : <Referrals />;
      case 'performance':
        return <ModelPerformance />;
      case 'explorer':
        return <DataExplorer />;
      case 'demo-mgmt':
        return <DemoManagement />;
      case 'settings':
        return <Settings currentUser={currentUser} setActivePage={setActivePage} />;
      case 'trusted-sources':
        return <TrustedSources setActivePage={setActivePage} />;
      case 'ai-insights':
        return <AIInsights />;
      case 'add-business':
        return (
          <AddBusinessLocation 
            onComplete={() => setActivePage('dashboard')} 
            onBack={() => setActivePage('dashboard')} 
          />
        );
      default:
        return <Dashboard currentUser={currentUser} />;
    }
  };

  const renderAuthOrDashboard = () => {
    if (!currentUser) {
      if (viewMode === 'landing') {
        return (
          <LandingPage 
            onLoginClick={() => {
              window.history.pushState({}, '', '/login');
              setViewMode('login');
            }} 
            onSignUpClick={() => {
              window.history.pushState({}, '', '/onboarding/agent');
              setViewMode('onboarding');
            }} 
          />
        );
      }
      const backHome = () => {
        window.history.pushState({}, '', '/');
        setViewMode('landing');
      };

      if (viewMode === 'onboarding') {
        return (
          <div className="relative w-full min-h-screen min-h-[100dvh] flex items-center justify-center overflow-y-auto p-4 py-8" style={{ background: '#172a0e' }}>
            <div className="z-10 flex items-center justify-center p-4 w-full">
              <Onboarding
                onComplete={(user) => {
                  window.history.pushState({}, '', '/');
                  setCurrentUser(user);
                  setActivePage('dashboard');
                }}
                onBackToLanding={backHome}
              />
            </div>
          </div>
        );
      }

      const presets: [('kwame' | 'forms' | 'admin'), string, string][] = [
        ['kwame', 'Agent — Kwame Centre', 'Liquidity forecasts, rebalancing, referrals'],
        ['forms', 'Financial Institution — Forms Capital', 'Explainable credit profiles and applications'],
        ['admin', 'System Operator (Admin)', 'Model metrics and platform data'],
      ];

      return (
        <div className="w-full min-h-screen min-h-[100dvh] overflow-y-auto grid lg:grid-cols-[1.05fr_1fr] bg-white text-[#0b1407]">
          {/* Story panel */}
          <aside className="hidden lg:flex relative overflow-hidden flex-col justify-between p-12 xl:p-16" style={{ background: '#172a0e' }}>
            <button onClick={backHome} className="flex items-center gap-2 bg-transparent border-none cursor-pointer self-start">
              <span className="h-9 w-9 rounded-lg flex items-center justify-center bg-[#a6e06a]">
                <Activity className="h-[18px] w-[18px] text-[#172a0e]" strokeWidth={2.5} />
              </span>
              <span className="mf-display text-[22px] font-bold tracking-[-0.03em] text-white">MobiFin</span>
            </button>
            <div>
              <span className="mf-mono uppercase tracking-[0.14em] text-[11px] text-[#a6e06a]">► Liquidity & alternative credit</span>
              <h2 className="mf-display text-white font-semibold leading-[1.04] tracking-[-0.03em] text-[48px] xl:text-[56px] mt-5 max-w-[560px]">
                Turn transactions into intelligence. <span className="text-[#a6e06a]">Turn intelligence into opportunity.</span>
              </h2>
              <div className="mt-10 space-y-3 max-w-[420px]">
                {[['Tomorrow · E-float demand', 'FORECAST · XGBOOST', 'GH₵11,400', '#a6e06a'], ['Customer #1048 · Consent', 'USSD · APPROVED', 'Active', '#f2c94c']].map(([t, m, a, c]) => (
                  <div key={t} className="flex items-center gap-3 rounded-[6px] px-3.5 py-2.5 bg-[#0f1c08] border border-white/60 text-white">
                    <span className="h-8 w-8 rounded-md flex-shrink-0" style={{ background: c }} />
                    <div className="leading-tight flex-1">
                      <div className="text-[13px] font-medium">{t}</div>
                      <div className="mf-mono text-[11px] tracking-wider text-white/60">{m}</div>
                    </div>
                    <div className="mf-display text-[17px] font-semibold">{a}</div>
                  </div>
                ))}
              </div>
            </div>
            <span className="mf-mono text-[11px] tracking-[0.14em] uppercase text-white/40">No consent, no score</span>
          </aside>

          {/* Form */}
          <main className="flex flex-col px-5 sm:px-10 py-8 lg:py-12">
            <div className="flex items-center justify-between">
              <button onClick={backHome} className="mf-mono text-[13px] bg-transparent border-none cursor-pointer hover:opacity-60">← Back to home</button>
              <button onClick={() => { window.history.pushState({}, '', '/onboarding'); setViewMode('onboarding'); }} className="mf-mono text-[13px] h-9 px-3.5 rounded-[6px] bg-[#eef1ec] hover:bg-[#e3e8df] border-none cursor-pointer">Create account</button>
            </div>
            <div className="flex-1 flex items-center justify-center py-10">
              <div className="w-full max-w-[420px]">
                <div className="lg:hidden flex items-center gap-2 mb-8">
                  <span className="h-8 w-8 rounded-lg flex items-center justify-center bg-[#172a0e]"><Activity className="h-4 w-4 text-[#a6e06a]" strokeWidth={2.5} /></span>
                  <span className="mf-display text-[20px] font-bold tracking-[-0.03em] text-[#172a0e]">MobiFin</span>
                </div>
                <h1 className="mf-display text-[36px] font-semibold tracking-[-0.03em] leading-tight">Sign in</h1>
                <p className="text-[15px] text-[#4b5a46] mt-2">Agents, lenders and operators use the same sign-in.</p>

                <form onSubmit={handleLoginSubmit} className="mt-8 space-y-4">
                  {loginError && (
                    <div className="bg-[#fbe6e3] text-[#b42318] text-[13px] px-3.5 py-2.5 rounded-lg font-medium">{loginError}</div>
                  )}
                  <label className="block">
                    <span className="text-[13px] font-medium">Username</span>
                    <input
                      type="text"
                      value={usernameInput}
                      onChange={e => setUsernameInput(e.target.value)}
                      placeholder="e.g. kwame"
                      autoComplete="username"
                      className="mt-1.5 w-full h-12 px-4 rounded-xl border border-[#d7e0d2] bg-white text-[15px] placeholder-[#9aa79a] focus:outline-none focus:border-[#0b6b46] focus:ring-4 focus:ring-[#0b6b46]/10 transition"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[13px] font-medium">Password</span>
                    <input
                      type="password"
                      value={passwordInput}
                      onChange={e => setPasswordInput(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="mt-1.5 w-full h-12 px-4 rounded-xl border border-[#d7e0d2] bg-white text-[15px] placeholder-[#9aa79a] focus:outline-none focus:border-[#0b6b46] focus:ring-4 focus:ring-[#0b6b46]/10 transition"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="w-full h-12 rounded-xl bg-[#172a0e] hover:bg-[#21391a] text-white text-[15px] font-semibold cursor-pointer disabled:opacity-50 transition-colors"
                  >
                    {isLoggingIn ? 'Signing in…' : 'Sign In'}
                  </button>
                </form>

                <div className="mt-10">
                  <div className="flex items-center gap-3">
                    <span className="mf-mono uppercase tracking-[0.14em] text-[11px] text-[#4b5a46]">► Demo Quick Access</span>
                    <span className="flex-1 h-px bg-[#e5ebe1]" />
                  </div>
                  <div className="mt-4 space-y-2">
                    {presets.map(([key, label, hint]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handlePresetLogin(key)}
                        disabled={isLoggingIn}
                        aria-label={label}
                        className="w-full text-left px-4 py-3 rounded-xl border border-[#e2eadc] bg-[#f7faf5] hover:bg-[#f1f7ec] hover:border-[#cfdcc8] cursor-pointer transition-colors disabled:opacity-50 flex items-center justify-between gap-3"
                      >
                        <span>
                          <span className="block text-[14px] font-semibold">{label}</span>
                          <span className="block text-[12px] text-[#4b5a46] mt-0.5">{hint}</span>
                        </span>
                        <span className="mf-mono text-[13px] text-[#4b5a46]">→</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-[12px] text-[#7a8775] mt-3">Quick access uses offline sample data stored in your browser.</p>
                </div>
              </div>
            </div>
          </main>
        </div>
      );
    }

    return (
      <>
        <DashboardLayout
          activePage={activePage}
          setActivePage={setActivePage}
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
          handleRoleSwitch={handleRoleSwitch}
        >
          <ErrorBoundary>
            {renderPage()}
          </ErrorBoundary>
        </DashboardLayout>
        {currentUser?.role === 'AGENT' && activePage === 'referrals' && (
          <UssdSimulator handleRoleSwitch={handleRoleSwitch} />
        )}
      </>
    );
  };

  return (
    <ErrorBoundary>
      {runtimeError ? (
        <div className="w-full min-h-screen bg-slate-950 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-red-500/30 p-6 rounded-2xl font-sans text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center space-x-2.5 text-red-500 font-bold">
              <span className="text-xl">⚠</span>
              <span>MobiFin — Runtime Diagnostics Panel</span>
            </div>
            <div className="bg-red-950/40 p-4 rounded-xl border border-red-900/30 space-y-3">
              <div>
                <span className="text-[10px] text-red-400 font-bold uppercase block">Error Message</span>
                <p className="text-xs text-white font-semibold">{runtimeError.message}</p>
              </div>
              {runtimeError.filename && (
                <div>
                  <span className="text-[10px] text-red-400 font-bold uppercase block">File & Line</span>
                  <p className="text-xs text-white font-mono">{runtimeError.filename}:{runtimeError.lineno}</p>
                </div>
              )}
              <div>
                <span className="text-[10px] text-red-400 font-bold uppercase block">Current URL Path</span>
                <p className="text-xs text-white font-mono">{window.location.pathname}</p>
              </div>
              {runtimeError.stack && (
                <div>
                  <span className="text-[10px] text-red-400 font-bold uppercase block">Stack Trace</span>
                  <pre className="text-[10px] text-slate-350 overflow-x-auto whitespace-pre-wrap font-mono max-h-60 mt-1 bg-black/40 p-2 rounded">
                    {runtimeError.stack}
                  </pre>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setRuntimeError(null);
                  window.location.href = '/';
                }}
                className="bg-slate-800 hover:bg-slate-700 border-none text-white rounded-lg px-4 py-2 font-bold text-xs cursor-pointer transition-colors"
              >
                Reset Session
              </button>
            </div>
          </div>
        </div>
      ) : renderAuthOrDashboard()}
      
      {networkErrorMsg && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <BorderGlow
            className="w-full max-w-md"
            glowColor="200 40 40"
            borderRadius={20}
          >
            <div className="bg-slate-900 border border-white/5 p-6 rounded-[20px] text-center space-y-4 font-sans text-slate-100 select-none">
              <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/20">
                <AlertCircle className="h-6 w-6 animate-pulse" />
              </div>
              
              <div className="space-y-1.5">
                <h3 className="font-extrabold text-base text-white">CONNECTION UNSTABLE</h3>
                <p className="text-[12px] text-white/70 leading-relaxed">
                  {networkErrorMsg}
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  onClick={async () => {
                    setNetworkErrorMsg(null);
                    if (lastAttemptParams) {
                      if (lastAttemptParams.type === 'preset') {
                        await handlePresetLogin(lastAttemptParams.preset);
                      } else if (lastAttemptParams.type === 'manual') {
                        setIsLoggingIn(true);
                        setLoginError(null);
                        try {
                          await ApiService.login(lastAttemptParams.u, lastAttemptParams.p);
                          const user = ApiService.getCurrentUser();
                          setCurrentUser(user);
                          if (user) {
                            setActivePage(user.role === 'ADMIN' ? 'admin-dashboard' : 'dashboard');
                          }
                        } catch (err: any) {
                          if (err.message && (err.message.includes('connect') || err.message.includes('reach') || err.message.includes('failed') || err.message.includes('Failed') || err.message.includes('Load failed'))) {
                            setNetworkErrorMsg(err.message);
                          } else {
                            setLoginError(err.message || 'Login failed.');
                          }
                        } finally {
                          setIsLoggingIn(false);
                        }
                      } else if (lastAttemptParams.type === 'switch') {
                        await handleRoleSwitch(lastAttemptParams.role);
                      }
                    }
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 border-none text-white rounded-lg py-2.5 font-bold text-xs cursor-pointer shadow-md transition-colors w-full"
                >
                  Retry Connection
                </button>
                
                <button
                  type="button"
                  onClick={async () => {
                    setNetworkErrorMsg(null);
                    ApiService.setDemoMode(true);
                    const targetPreset = (lastAttemptParams && lastAttemptParams.preset) || 'kwame';
                    await handlePresetLogin(targetPreset);
                  }}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg py-2.5 font-bold text-xs cursor-pointer transition-colors w-full"
                >
                  Enter Demo Mode (Offline Fallback)
                </button>
                
                <button
                  onClick={() => setNetworkErrorMsg(null)}
                  className="text-white/45 hover:text-white text-[10.5px] underline pt-1 bg-transparent border-none cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </BorderGlow>
        </div>
      )}
    </ErrorBoundary>
  );
};

export default App;
