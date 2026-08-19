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
import { Sparkles, ShieldAlert, AlertCircle } from 'lucide-react';
// @ts-ignore
import Grainient from './components/Grainient';
// @ts-ignore
import BorderGlow from './components/BorderGlow';
import LandingPage from './pages/LandingPage';



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
  'add-business': ['AGENT', 'ADMIN']
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
      const path = window.location.pathname;
      if (path === '/agent/dashboard' || path === '/institution/dashboard' || path === '/admin/dashboard' || path === '/login') {
        window.history.pushState({}, '', '/');
        setViewMode('landing');
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
      return (
        <div className="relative w-full min-h-screen min-h-[100dvh] flex items-center justify-center overflow-y-auto font-sans p-4 py-8">
          {/* Back to Home floating action button */}
          {viewMode !== 'onboarding' && (
            <button
              type="button"
              onClick={() => {
                window.history.pushState({}, '', '/');
                setViewMode('landing');
              }}
              className="absolute top-6 left-6 z-20 flex items-center space-x-2 text-white bg-slate-900/40 hover:bg-slate-900/60 px-4 py-2.5 rounded-full border border-white/5 transition-all text-xs font-semibold cursor-pointer shadow-sm backdrop-blur-sm animate-fadeIn"
            >
              <span>← Back to Home</span>
            </button>
          )}
          {/* Grainient WebGL Background */}
          <div className="absolute inset-0 z-0">
            <Grainient 
              color1="#8ea978"
              color2="#223814"
              color3="#8ea978"
              timeSpeed={0.15}
              colorBalance={0}
              warpStrength={1}
              warpFrequency={5}
              warpSpeed={2}
              warpAmplitude={50}
              blendAngle={0}
              blendSoftness={0.05}
              rotationAmount={500}
              noiseScale={2}
              grainAmount={0}
              grainScale={0.2}
              grainAnimated={false}
              contrast={1.5}
              gamma={1}
              saturation={1}
              centerX={0}
              centerY={0}
              zoom={0.9}
            />
          </div>

          {/* Content render selection: Onboarding or Login */}
          <div className="z-10 flex items-center justify-center p-4 w-full">
            {viewMode === 'onboarding' ? (
              <Onboarding 
                onComplete={(user) => {
                  window.history.pushState({}, '', '/');
                  setCurrentUser(user);
                  setActivePage('dashboard');
                }}
                onBackToLanding={() => {
                  window.history.pushState({}, '', '/');
                  setViewMode('landing');
                }}
              />
            ) : (
              <BorderGlow
                className="w-[calc(100vw-32px)] sm:w-[410px] lg:w-[440px] h-auto"
                backgroundColor="rgba(10, 15, 24, 0.65)"
                borderRadius={20}
                glowColor="160 80 50"
                colors={['#0d9488', '#0f172a', '#064e3b']}
                glowIntensity={1.0}
                edgeSensitivity={20}
              >
                <div className="w-full h-auto backdrop-blur-xl flex flex-col text-slate-100 login-inner-card select-none rounded-[20px] border border-white/5">
                  {/* Logo & Brand Mark */}
                  <div className="flex flex-col items-center text-center">
                    <div className="bg-teal-400 text-slate-950 rounded-xl font-black flex items-center justify-center transition-transform hover:scale-105 duration-300 login-logo">
                      M
                    </div>
                    <h1 className="text-white tracking-wide leading-none login-title">MobiFin AI</h1>
                    <p className="font-normal text-white/85 leading-normal login-subtitle">
                      AI Financial Intelligence & Alternative Credit Intelligence
                    </p>
                  </div>

                  {/* Form Area */}
                  <form onSubmit={handleLoginSubmit} className="login-form">
                    {loginError && (
                      <div className="bg-red-500/10 text-red-300 text-[12px] p-2.5 rounded-lg border border-red-500/20 font-medium mb-3">
                        {loginError}
                      </div>
                    )}
                    
                    <div>
                      <label className="text-white/80 login-label">
                        Username
                      </label>
                      <input
                        type="text"
                        value={usernameInput}
                        onChange={e => setUsernameInput(e.target.value)}
                        placeholder="Enter your username"
                        className="bg-slate-900/40 border border-[#8ea978] text-white placeholder-slate-500 focus:outline-none focus:border-[#8ea978] focus:ring-1 focus:ring-[#8ea978]/50 transition-all duration-200 login-input login-label-spacing"
                      />
                    </div>

                    <div className="login-input-group">
                      <label className="text-white/80 login-label">
                        Password
                      </label>
                      <input
                        type="password"
                        value={passwordInput}
                        onChange={e => setPasswordInput(e.target.value)}
                        placeholder="••••••••"
                        className="bg-slate-900/40 border border-white/5 text-white placeholder-slate-500 focus:outline-none focus:border-[#8ea978] focus:ring-1 focus:ring-[#8ea978]/50 transition-all duration-200 login-input login-label-spacing"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoggingIn}
                      className="bg-[#8ea978] hover:bg-[#7d9868] text-slate-950 transition-all duration-200 disabled:opacity-50 cursor-pointer shadow-md shadow-[#8ea978]/10 flex items-center justify-center login-btn"
                    >
                      {isLoggingIn ? 'Authenticating...' : 'Sign In'}
                    </button>
                  </form>

                  {/* Quick Demo Switcher Presets */}
                  <div className="border-t border-white/5 login-divider-group">
                    <span className="text-white login-demo-label">
                      Demo Quick Access
                    </span>
                    <div className="login-demo-list">
                      <button
                        type="button"
                        onClick={() => handlePresetLogin('kwame')}
                        disabled={isLoggingIn}
                        className="bg-white/5 hover:bg-white/10 hover:border-white/10 text-white transition-all duration-200 text-center cursor-pointer flex items-center justify-center login-demo-btn"
                      >
                        Agent — Kwame Centre
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePresetLogin('forms')}
                        disabled={isLoggingIn}
                        className="bg-white/5 hover:bg-white/10 hover:border-white/10 text-white transition-all duration-200 text-center cursor-pointer flex items-center justify-center login-demo-btn"
                      >
                        Financial Institution — Forms Capital
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePresetLogin('admin')}
                        disabled={isLoggingIn}
                        className="bg-white/5 hover:bg-white/10 hover:border-white/10 text-white transition-all duration-200 text-center cursor-pointer flex items-center justify-center login-demo-btn"
                      >
                        System Operator (Admin)
                      </button>
                    </div>
                  </div>
                </div>
              </BorderGlow>
            )}
          </div>
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
          {renderPage()}
        </DashboardLayout>
        <UssdSimulator handleRoleSwitch={handleRoleSwitch} />
      </>
    );
  };

  return (
    <>
      {renderAuthOrDashboard()}
      
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
    </>
  );
};

export default App;
