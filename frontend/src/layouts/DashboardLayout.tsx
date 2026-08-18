import React, { useEffect, useState } from 'react';
import { 
  LayoutDashboard, Receipt, Droplet, LineChart, Users, KeyRound, 
  BarChart2, Database, Settings as SettingsIcon, BrainCircuit, 
  LogOut, RefreshCw, ShieldCheck, Activity, User, ChevronDown, ShieldAlert,
  Server, Wrench, Sun, Moon, Menu
} from 'lucide-react';
import ApiService from '../services/api';
import { UserProfile } from '../types';

interface SidebarItem {
  name: string;
  icon: React.ComponentType<any>;
  page: string;
}

interface SidebarGroup {
  title: string;
  items: SidebarItem[];
}

interface DashboardLayoutProps {
  activePage: string;
  setActivePage: (page: string) => void;
  currentUser: UserProfile | null;
  setCurrentUser: (user: UserProfile | null) => void;
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  activePage,
  setActivePage,
  currentUser,
  setCurrentUser,
  children
}) => {
  const [dbStatus, setDbStatus] = useState<string>('Detecting DB...');
  const [isSqlite, setIsSqlite] = useState<boolean>(false);
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [isDark, setIsDark] = useState<boolean>(() => {
    return localStorage.getItem('mobifin_theme') === 'dark';
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('mobifin_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('mobifin_theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  useEffect(() => {
    fetchDbStatus();
  }, []);

  const fetchDbStatus = async () => {
    try {
      const res = await ApiService.getSystemStatus();
      setDbStatus(res.database);
      setIsSqlite(res.sqlite_active);
    } catch {
      setDbStatus('SQLite Fallback Active');
      setIsSqlite(true);
    }
  };

  const handleRoleSwitch = async (role: 'AGENT' | 'FINANCIAL_INSTITUTION' | 'ADMIN') => {
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
      setDropdownOpen(false);
      
      if (role === 'AGENT') {
        setActivePage('dashboard');
      } else if (role === 'FINANCIAL_INSTITUTION') {
        setActivePage('dashboard');
      } else {
        setActivePage('admin-dashboard');
      }
    } catch (e: any) {
      alert(`Role switch login failed. Make sure database is seeded! Error: ${e.message}`);
    }
  };

  const handleLogout = () => {
    ApiService.logout();
    setCurrentUser(null);
  };

  // 1. Get role-based sidebar groups
  const getSidebarGroups = (): SidebarGroup[] => {
    const role = currentUser?.role;

    if (role === 'AGENT') {
      return [
        {
          title: 'Overview',
          items: [
            { name: 'Dashboard', icon: LayoutDashboard, page: 'dashboard' }
          ]
        },
        {
          title: 'Operations',
          items: [
            { name: 'Transactions', icon: Receipt, page: 'transactions' },
            { name: 'Liquidity', icon: Droplet, page: 'liquidity' },
            { name: 'Business Analytics', icon: LineChart, page: 'analytics' }
          ]
        },
        {
          title: 'Intelligence',
          items: [
            { name: 'AI Insights', icon: BrainCircuit, page: 'ai-insights' }
          ]
        },
        {
          title: 'Account',
          items: [
            { name: 'Settings', icon: SettingsIcon, page: 'settings' }
          ]
        }
      ];
    }

    if (role === 'FINANCIAL_INSTITUTION') {
      return [
        {
          title: 'Overview',
          items: [
            { name: 'Dashboard', icon: LayoutDashboard, page: 'dashboard' }
          ]
        },
        {
          title: 'Customer Intelligence',
          items: [
            { name: 'Customers', icon: Users, page: 'credit' }
          ]
        },
        {
          title: 'Analytics',
          items: [
            { name: 'Portfolio Insights', icon: LineChart, page: 'analytics' }
          ]
        },
        {
          title: 'Account',
          items: [
            { name: 'Settings', icon: SettingsIcon, page: 'settings' }
          ]
        }
      ];
    }

    if (role === 'ADMIN') {
      return [
        {
          title: 'System Overview',
          items: [
            { name: 'Admin Dashboard', icon: LayoutDashboard, page: 'admin-dashboard' }
          ]
        },
        {
          title: 'Model & Data',
          items: [
            { name: 'Model Performance', icon: BarChart2, page: 'performance' },
            { name: 'Data Explorer', icon: Database, page: 'explorer' }
          ]
        },
        {
          title: 'System',
          items: [
            { name: 'Demo Management', icon: Wrench, page: 'demo-mgmt' },
            { name: 'Settings', icon: SettingsIcon, page: 'settings' }
          ]
        }
      ];
    }

    return [];
  };

  // 2. Page titles based on role
  const getPageTitle = (): string => {
    const role = currentUser?.role;

    if (role === 'AGENT') {
      switch (activePage) {
        case 'dashboard': return 'Dashboard';
        case 'transactions': return 'Transactions';
        case 'liquidity': return 'Liquidity Intelligence';
        case 'analytics': return 'Business Analytics';
        case 'ai-insights': return 'AI Insights';
        case 'settings': return 'Settings';
        default: return 'Operational Panel';
      }
    }

    if (role === 'FINANCIAL_INSTITUTION') {
      switch (activePage) {
        case 'dashboard': return 'Dashboard';
        case 'credit': return 'Customer Intelligence';
        case 'analytics': return 'Portfolio Insights';
        case 'settings': return 'Settings';
        default: return 'Institutional Console';
      }
    }

    if (role === 'ADMIN') {
      switch (activePage) {
        case 'admin-dashboard': return 'System Overview';
        case 'performance': return 'Model Performance';
        case 'explorer': return 'Data Explorer';
        case 'demo-mgmt': return 'Demo Management';
        case 'settings': return 'Settings';
        default: return 'Internal Control Console';
      }
    }

    return 'Operational Panel';
  };

  // 3. Page subtitles based on role
  const getPageSubtitle = (): string => {
    const role = currentUser?.role;

    if (role === 'AGENT') {
      switch (activePage) {
        case 'dashboard': return 'Monitor your agent operations and financial position.';
        case 'transactions': return 'Audit log of deposits, withdrawals, and merchant payments.';
        case 'liquidity': return 'Forecast demand and optimize your cash and e-float.';
        case 'analytics': return 'Understand your transaction activity and business performance.';
        case 'ai-insights': return 'Grounded AI audits and anomaly alerts.';
        case 'settings': return 'Configure your security keys, notifications, and profile details.';
        default: return '';
      }
    }

    if (role === 'FINANCIAL_INSTITUTION') {
      switch (activePage) {
        case 'dashboard': return 'Monitor aggregate platform credit metrics and consented history.';
        case 'credit': return 'Evaluate consented alternative financial profiles.';
        case 'analytics': return 'Understand customer financial behavior and readiness.';
        case 'settings': return 'Configure custom underwriting parameters and connection keys.';
        default: return '';
      }
    }

    if (role === 'ADMIN') {
      switch (activePage) {
        case 'admin-dashboard': return 'Monitor MobiFin AI platform health.';
        case 'performance': return 'Monitor predictive model performance and validation.';
        case 'explorer': return 'Inspect the underlying platform dataset.';
        case 'demo-mgmt': return 'Generative sandbox environment manager.';
        case 'settings': return 'System variables and environment controls.';
        default: return '';
      }
    }

    return '';
  };

  const sidebarGroups = getSidebarGroups();
  const currentRoleName = currentUser?.role === 'AGENT' 
    ? 'Agent — Kwame' 
    : currentUser?.role === 'FINANCIAL_INSTITUTION' 
      ? 'FI — Forms Capital' 
      : 'Admin';

  const isGreenSide = true;
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] h-screen w-screen overflow-hidden bg-white dark:bg-[#091406] font-sans text-slate-800 dark:text-slate-100">
      
      {/* Mobile Drawer Backdrop Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-30 bg-slate-950/60 backdrop-blur-sm lg:hidden animate-fadeIn" 
          onClick={() => setMobileMenuOpen(false)} 
        />
      )}

      {/* Sidebar - Fix height & scroll internally */}
      <aside className={`
        flex flex-col h-full overflow-hidden transition-all duration-300
        fixed inset-y-0 left-0 z-40 w-[260px] lg:static lg:h-full lg:w-auto lg:z-auto
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isGreenSide 
            ? 'bg-[#17280e] text-white border-r border-[#243e16]' 
            : 'bg-slate-950 text-slate-200 border-r border-slate-900'}
      `}>
        {/* Logo/Wordmark */}
        <div className={`h-[70px] px-6 flex items-center justify-between flex-shrink-0 border-b ${
          isGreenSide ? 'border-[#243e16]' : 'border-slate-900'
        }`}>
          <div className="flex items-center space-x-3">
            <div className="bg-teal-500 text-slate-950 p-2 rounded font-black text-base flex items-center justify-center h-8 w-8">
              M
            </div>
            <div>
              <h1 className="font-extrabold text-sm leading-tight tracking-wider text-white">MobiFin AI</h1>
              <p className={`text-[10px] font-semibold uppercase tracking-widest ${
                isGreenSide ? 'text-white/60' : 'text-slate-500'
              }`}>Financial Console</p>
            </div>
          </div>
          {/* Mobile close button inside sidebar drawer */}
          <button 
            onClick={() => setMobileMenuOpen(false)} 
            className="lg:hidden p-1 rounded hover:bg-white/10 text-white cursor-pointer border-none bg-transparent"
          >
            ✕
          </button>
        </div>

        {/* Dynamic Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-5 overflow-y-auto">
          {sidebarGroups.map(group => (
            <div key={group.title} className="space-y-1">
              <span className={`text-[9px] font-bold uppercase tracking-widest block px-3 mb-1.5 ${
                isGreenSide ? 'text-white' : 'text-slate-650'
              }`}>
                {group.title}
              </span>
              <div className="space-y-0.5">
                {group.items.map(item => {
                  const Icon = item.icon;
                  const isActive = activePage === item.page;
                  return (
                    <button
                      key={item.name}
                      onClick={() => {
                        setActivePage(item.page);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center space-x-2.5 px-3 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                        isActive 
                          ? 'bg-white/10 text-white font-semibold border border-white/20 sidebar-active-btn' 
                          : 'text-white/80 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <span className="glass-icon-wrapper">
                        <span className="glass-icon-back"></span>
                        <span className="glass-icon-front">
                          <Icon className="glass-icon-svg" />
                        </span>
                      </span>
                      <span>{item.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom Profile info */}
        <div className={`p-4 flex-shrink-0 border-t ${
          isGreenSide ? 'border-[#243e16]' : 'border-slate-900'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 overflow-hidden">
              <div className={`h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 border ${
                isGreenSide ? 'bg-white/5 border-white/10' : 'bg-slate-900 border-slate-800'
              }`}>
                <User className={`h-4 w-4 ${isGreenSide ? 'text-white' : 'text-slate-500'}`} />
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className={`text-[10px] font-bold leading-tight truncate ${
                  isGreenSide ? 'text-white' : 'text-slate-350'
                }`}>
                  {currentUser?.role === 'AGENT' ? 'Kwame Centre' : currentUser?.role === 'FINANCIAL_INSTITUTION' ? 'Forms Capital' : 'System Admin'}
                </span>
                <span className={`text-[9px] truncate max-w-[120px] ${
                  isGreenSide ? 'text-white/70' : 'text-slate-500'
                }`}>
                  {currentUser?.username}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className={`p-1.5 rounded transition cursor-pointer ${
                isGreenSide 
                  ? 'text-white hover:text-red-300 hover:bg-white/10' 
                  : 'text-slate-500 hover:text-red-400 hover:bg-slate-900'
              }`}
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container Workspace */}
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header - Height 70px */}
        <header className="h-[70px] bg-white dark:bg-[#0c1c09] border-b border-slate-250 dark:border-[#1e3a12] px-4 md:px-8 flex items-center justify-between flex-shrink-0 animate-fadeIn">
          <div className="flex items-center space-x-3 overflow-hidden">
            {/* Hamburger button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 border-none bg-transparent cursor-pointer"
              aria-label="Open sidebar menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="overflow-hidden">
              <h2 className="text-xs md:text-sm font-bold text-slate-950 dark:text-white tracking-tight leading-none truncate">
                {getPageTitle()}
              </h2>
              <p className="hidden md:block text-[10px] text-slate-450 dark:text-slate-400 font-medium mt-1 truncate">
                {getPageSubtitle()}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 md:space-x-4">
            {/* Database status tag - Hide on small mobile */}
            <span className={`hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide border ${
              isSqlite 
                ? 'bg-amber-50 text-amber-700 border-amber-200' 
                : 'bg-emerald-50 text-teal-700 border-emerald-200'
            }`}>
              <Server className="h-3 w-3 mr-1.5" />
              {isSqlite ? 'SQLite sandbox' : 'Postgres active'}
            </span>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 dark:text-slate-300 transition cursor-pointer border-none bg-transparent flex items-center justify-center"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Custom Dropdown environment role switcher */}
            <div className="relative">
              <div className="hidden sm:block text-[8px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5">
                Demo Mode
              </div>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-white/5 border border-slate-250 dark:border-slate-800 rounded-lg px-2 py-1 md:px-2.5 md:py-1.5 flex items-center justify-between space-x-1.5 md:space-x-2 text-[10px] md:text-[11px] font-bold text-slate-700 dark:text-slate-300 transition cursor-pointer"
              >
                <span className="truncate max-w-[80px] md:max-w-none">{currentRoleName}</span>
                <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {dropdownOpen && (
                <>
                  {/* Click outside backdrop overlay */}
                  <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                  <div className="absolute right-0 mt-1 w-52 bg-white dark:bg-[#0c1c09] border border-slate-250 dark:border-[#1e3a12] rounded-lg shadow-sm z-50 py-1 animate-fadeIn">
                    <button
                      onClick={() => handleRoleSwitch('AGENT')}
                      className="w-full text-left px-3 py-2 text-[10px] font-semibold text-slate-650 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition flex items-center space-x-1.5 cursor-pointer"
                    >
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      <span>Agent — Kwame</span>
                    </button>
                    <button
                      onClick={() => handleRoleSwitch('FINANCIAL_INSTITUTION')}
                      className="w-full text-left px-3 py-2 text-[10px] font-semibold text-slate-650 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition flex items-center space-x-1.5 cursor-pointer"
                    >
                      <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
                      <span>FI — Forms Capital</span>
                    </button>
                    <button
                      onClick={() => handleRoleSwitch('ADMIN')}
                      className="w-full text-left px-3 py-2 text-[10px] font-semibold text-slate-650 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Activity className="h-3.5 w-3.5 text-slate-400" />
                      <span>Admin Console</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content Box scrolling independently */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-white dark:bg-[#091406] text-slate-850 dark:text-slate-100">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
