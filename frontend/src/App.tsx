import React, { useState, useEffect } from 'react';
import ApiService from './services/api';
import { UserProfile } from './types';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import Transactions from './pages/Transactions';
import Liquidity from './pages/Liquidity';
import BusinessAnalytics from './pages/BusinessAnalytics';
import CustomerIntelligence from './pages/CustomerIntelligence';
import ConsentFlow from './pages/ConsentFlow';
import ModelPerformance from './pages/ModelPerformance';
import DataExplorer from './pages/DataExplorer';
import DemoManagement from './pages/DemoManagement';
import Settings from './pages/Settings';
import AIInsights from './pages/AIInsights';
import { Sparkles, ShieldAlert } from 'lucide-react';

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
  liquidity: ['AGENT'],
  analytics: ['AGENT', 'FINANCIAL_INSTITUTION'],
  credit: ['FINANCIAL_INSTITUTION'],
  consent: ['AGENT', 'FINANCIAL_INSTITUTION', 'ADMIN'],
  performance: ['ADMIN'],
  explorer: ['ADMIN'],
  'demo-mgmt': ['ADMIN'],
  settings: ['AGENT', 'FINANCIAL_INSTITUTION', 'ADMIN'],
  'ai-insights': ['AGENT']
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [activePage, setActivePage] = useState<string>('dashboard');
  const [usernameInput, setUsernameInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

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
        return <Dashboard />;
      case 'admin-dashboard':
        return <AdminDashboard />;
      case 'transactions':
        return <Transactions />;
      case 'liquidity':
        return <Liquidity />;
      case 'analytics':
        return <BusinessAnalytics />;
      case 'credit':
        return <CustomerIntelligence />;
      case 'consent':
        return <ConsentFlow />;
      case 'performance':
        return <ModelPerformance />;
      case 'explorer':
        return <DataExplorer />;
      case 'demo-mgmt':
        return <DemoManagement />;
      case 'settings':
        return <Settings />;
      case 'ai-insights':
        return <AIInsights />;
      default:
        return <Dashboard />;
    }
  };

  if (!currentUser) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-50 font-sans p-4">
        <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-6 bg-slate-950 text-slate-100 flex flex-col items-center text-center">
            <div className="bg-teal-500 text-slate-950 p-2 rounded-lg font-black text-lg flex items-center justify-center h-9 w-9">
              M
            </div>
            <h1 className="font-extrabold text-sm tracking-wider text-white mt-3">MobiFin AI</h1>
            <p className="text-[10px] text-slate-400 mt-1 max-w-[280px]">
              AI Financial Intelligence & Alternative Credit Registry
            </p>
          </div>

          {/* Form Area */}
          <div className="p-6 space-y-5 flex-1">
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              {loginError && (
                <div className="bg-red-50 text-red-800 text-[10px] p-2.5 rounded-lg border border-red-200 font-medium">
                  {loginError}
                </div>
              )}
              
              <div>
                <label className="text-[9px] font-bold text-slate-450 uppercase tracking-widest block mb-1">Username</label>
                <input
                  type="text"
                  value={usernameInput}
                  onChange={e => setUsernameInput(e.target.value)}
                  placeholder="Username"
                  className="w-full text-xs bg-slate-50 border border-slate-250 rounded-lg p-2.5 focus:outline-none focus:border-slate-800 transition"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-450 uppercase tracking-widest block mb-1">Password</label>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs bg-slate-50 border border-slate-250 rounded-lg p-2.5 focus:outline-none focus:border-slate-800 transition"
                />
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-lg text-xs transition disabled:opacity-50 cursor-pointer"
              >
                {isLoggingIn ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>

            {/* Quick Demo Switcher Presets */}
            <div className="space-y-2 pt-4 border-t border-slate-100">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block text-center mb-2">
                Demo Quick Access
              </span>
              <div className="flex flex-col space-y-1.5">
                <button
                  onClick={() => handlePresetLogin('kwame')}
                  disabled={isLoggingIn}
                  className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-[10px] py-2 px-3 rounded-lg border border-slate-200 transition text-center cursor-pointer"
                >
                  Agent — Kwame
                </button>
                <button
                  onClick={() => handlePresetLogin('forms')}
                  disabled={isLoggingIn}
                  className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-[10px] py-2 px-3 rounded-lg border border-slate-200 transition text-center cursor-pointer"
                >
                  Financial Institution — Forms Capital
                </button>
                <button
                  onClick={() => handlePresetLogin('admin')}
                  disabled={isLoggingIn}
                  className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-[10px] py-2 px-3 rounded-lg border border-slate-200 transition text-center cursor-pointer"
                >
                  Admin
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout
      activePage={activePage}
      setActivePage={setActivePage}
      currentUser={currentUser}
      setCurrentUser={setCurrentUser}
    >
      {renderPage()}
    </DashboardLayout>
  );
};

export default App;
