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
import { Sparkles, ShieldAlert } from 'lucide-react';
// @ts-ignore
import Grainient from './components/Grainient';
// @ts-ignore
import BorderGlow from './components/BorderGlow';
import LandingPage from './pages/LandingPage';



const Unauthorized: React.FC = () => (
  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 p-6 animate-fadeIn">
    <div className="premium-card bg-white max-w-sm text-center space-y-4">
      <div className="bg-red-50 text-red-700 p-3 rounded-full w-fit mx-auto border border-red-150">
        <ShieldAlert className="h-6 w-6" />
      </div>
      <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Access Denied</h3>
      <p className="text-xs text-slate-550 leading-normal">
        Your security profile does not have permission to view this resource. Direct access has been gated.
      </p>
    </div>
  </div>
);

const PAGE_PERMISSIONS: Record<string, ('AGENT' | 'FINANCIAL_INSTITUTION' | 'ADMIN')[]> = {
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

  // Synchronize browser history and views (router-less navigation mapping)
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/onboarding/agent') {
        if (!currentUser) {
          setViewMode('onboarding');
        }
      } else if (path === '/login') {
        if (!currentUser) {
          setViewMode('login');
        }
      } else {
        if (!currentUser) {
          setViewMode('landing');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    handlePopState(); // Initial check on mount

    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentUser]);

  useEffect(() => {
    const user = ApiService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      if (user.role === 'AGENT') {
        setActivePage('dashboard');
      } else if (user.role === 'FINANCIAL_INSTITUTION') {
        setActivePage('dashboard');
      } else {
        setActivePage('admin-dashboard');
      }
    }
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput || !passwordInput) return;
    
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      await ApiService.login(usernameInput, passwordInput);
      const user = ApiService.getCurrentUser();
      setCurrentUser(user);
      
      if (user) {
        if (user.role === 'AGENT') {
          setActivePage('dashboard');
        } else if (user.role === 'FINANCIAL_INSTITUTION') {
          setActivePage('dashboard');
        } else {
          setActivePage('admin-dashboard');
        }
      }
    } catch (err: any) {
      setLoginError(err.message || 'Incorrect username or password');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handlePresetLogin = async (userPreset: 'kwame' | 'forms' | 'admin') => {
    let u = 'kwame';
    let p = 'kwame123';
    if (userPreset === 'forms') {
      u = 'forms_capital';
      p = 'forms123';
    } else if (userPreset === 'admin') {
      u = 'admin';
      p = 'admin123';
    }

    setIsLoggingIn(true);
    setLoginError(null);
    try {
      await ApiService.login(u, p);
      const user = ApiService.getCurrentUser();
      setCurrentUser(user);
      
      if (user) {
        if (user.role === 'AGENT') {
          setActivePage('dashboard');
        } else if (user.role === 'FINANCIAL_INSTITUTION') {
          setActivePage('dashboard');
        } else {
          setActivePage('admin-dashboard');
        }
      }
    } catch (err: any) {
      setLoginError(err.message || 'Login failed. Seed database first.');
    } finally {
      setIsLoggingIn(false);
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
        return <Dashboard setActivePage={setActivePage} />;
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
        return <Dashboard />;
    }
  };

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
                      onClick={() => handlePresetLogin('kwame')}
                      disabled={isLoggingIn}
                      className="bg-white/5 hover:bg-white/10 hover:border-white/10 text-white transition-all duration-200 text-center cursor-pointer flex items-center justify-center login-demo-btn"
                    >
                      Agent — Kwame Centre
                    </button>
                    <button
                      onClick={() => handlePresetLogin('forms')}
                      disabled={isLoggingIn}
                      className="bg-white/5 hover:bg-white/10 hover:border-white/10 text-white transition-all duration-200 text-center cursor-pointer flex items-center justify-center login-demo-btn"
                    >
                      Financial Institution — Forms Capital
                    </button>
                    <button
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
      >
        {renderPage()}
      </DashboardLayout>
      <UssdSimulator />
    </>
  );
};

export default App;
