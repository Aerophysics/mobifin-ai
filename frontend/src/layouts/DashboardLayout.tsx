import React, { useEffect, useState } from 'react';
import { 
  LayoutDashboard, Receipt, Droplet, LineChart, Users, KeyRound, 
  BarChart2, Database, Settings as SettingsIcon, BrainCircuit, 
  LogOut, RefreshCw, ShieldCheck, Activity, User, ChevronDown, ShieldAlert,
  Server, Wrench, Sun, Moon, Menu, BookOpen, Bell, Check, Landmark
} from 'lucide-react';
import ApiService from '../services/api';
import { UserProfile } from '../types';
import { GlassBadge } from '../components/glass/GlassBadge';
// @ts-ignore
import Grainient from '../components/Grainient';

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
  handleRoleSwitch: (role: 'AGENT' | 'FINANCIAL_INSTITUTION' | 'ADMIN') => Promise<void>;
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  activePage,
  setActivePage,
  currentUser,
  setCurrentUser,
  handleRoleSwitch,
  children
}) => {
  const [dbStatus, setDbStatus] = useState<string>('Detecting DB...');
  const [isSqlite, setIsSqlite] = useState<boolean>(false);
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [isDark, setIsDark] = useState<boolean>(() => {
    return localStorage.getItem('mobifin_theme') === 'dark';
  });

  const [locations, setLocations] = useState<any[]>([]);
  const [activeLocation, setActiveLocation] = useState<any>(null);
  const [switcherOpen, setSwitcherOpen] = useState<boolean>(false);

  useEffect(() => {
    if (currentUser?.role === 'AGENT') {
      ApiService.request<any[]>('/onboarding/businesses')
        .then(res => {
          setLocations(res);
          const active = res.find((l: any) => l.agent_id === currentUser.agent_id);
          if (active) {
            setActiveLocation(active);
          }
        })
        .catch(err => console.error("Error loading locations:", err));
    }
  }, [currentUser]);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifOpen, setNotifOpen] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [activeNotifTab, setActiveNotifTab] = useState<string>('all');

  const fetchNotifications = async () => {
    try {
      const data = await ApiService.getNotifications();
      setNotifications(data);
      setUnreadCount(data.filter((n: any) => !n.read).length);
    } catch (err) {
      console.error("Failed to fetch alerts", err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 10000); // 10s poll
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  const handleMarkRead = async (id: number, actionUrl?: string) => {
    try {
      await ApiService.markNotificationAsRead(id);
      fetchNotifications();
      if (actionUrl) {
        setNotifOpen(false);
        if (actionUrl.includes('liquidity')) setActivePage('liquidity');
        else if (actionUrl.includes('credit')) setActivePage('credit');
        else if (actionUrl.includes('analytics')) setActivePage('analytics');
        else if (actionUrl.includes('dashboard')) setActivePage('dashboard');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getFilteredNotifications = () => {
    if (activeNotifTab === 'unread') return notifications.filter(n => !n.read);
    if (activeNotifTab === 'critical') return notifications.filter(n => n.severity === 'High' || n.severity === 'Critical');
    if (activeNotifTab === 'liquidity') return notifications.filter(n => n.type === 'LIQUIDITY');
    if (activeNotifTab === 'credit') return notifications.filter(n => n.type === 'CREDIT');
    if (activeNotifTab === 'business') return notifications.filter(n => n.type === 'BUSINESS');
    return notifications;
  };

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
            { name: 'Ledger', icon: BookOpen, page: 'ledger' },
            { name: 'Liquidity', icon: Droplet, page: 'liquidity' },
            { name: 'Liquidity Network', icon: Users, page: 'trusted-sources' },
            { name: 'Business Analytics', icon: LineChart, page: 'analytics' }
          ]
        },
        {
          title: 'Financial Services',
          items: [
            { name: 'Customer Referrals', icon: Landmark, page: 'referrals' }
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
            { name: 'Customers', icon: Users, page: 'credit' },
            { name: 'Customer Referrals', icon: Landmark, page: 'referrals' }
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
        case 'ledger': return 'Bookkeeping Ledger';
        case 'liquidity': return 'Liquidity Intelligence';
        case 'analytics': return 'Business Analytics';
        case 'ai-insights': return 'AI Insights';
        case 'referrals': return 'Customer Referrals';
        case 'settings': return 'Settings';
        default: return 'Operational Panel';
      }
    }

    if (role === 'FINANCIAL_INSTITUTION') {
      switch (activePage) {
        case 'dashboard': return 'Dashboard';
        case 'credit': return 'Customer Intelligence';
        case 'referrals': return 'Credit Applications';
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
        case 'ledger': return 'Track daily opening cash, float flows, and reconcile balances.';
        case 'liquidity': return 'Forecast demand and optimize your cash and e-float.';
        case 'analytics': return 'Understand your transaction activity and business performance.';
        case 'ai-insights': return 'Grounded AI audits and anomaly alerts.';
        case 'referrals': return 'Initiate credit referrals for your Mobile Money customers.';
        case 'settings': return 'Configure your security keys, notifications, and profile details.';
        default: return '';
      }
    }

    if (role === 'FINANCIAL_INSTITUTION') {
      switch (activePage) {
        case 'dashboard': return 'Monitor aggregate platform credit metrics and consented history.';
        case 'credit': return 'Evaluate consented alternative financial profiles.';
        case 'referrals': return 'Perform underwriting review and make lending decisions.';
        case 'analytics': return 'Understand customer financial behavior and readiness.';
        case 'settings': return 'Configure custom underwriting parameters and connection keys.';
        default: return '';
      }
    }

    if (role === 'ADMIN') {
      switch (activePage) {
        case 'admin-dashboard': return 'Monitor MobiFin platform health.';
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
    <div className="relative flex h-screen w-screen overflow-hidden bg-white dark:bg-[#070d05] font-sans text-slate-800 dark:text-slate-100 lg:p-4 lg:gap-4">
      {/* Dynamic Grainient WebGL Background Mesh */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {isDark ? (
          <Grainient
            color1="#283f0b"
            color2="#485741"
            color3="#263b18"
            timeSpeed={0.25}
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
            grainScale={0.3}
            grainAnimated={false}
            contrast={1.5}
            gamma={1}
            saturation={1}
            centerX={0}
            centerY={0}
            zoom={0.9}
          />
        ) : (
          <Grainient
            color1="#8aa770"
            color2="#92a38a"
            color3="#84a56c"
            timeSpeed={0.25}
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
            grainScale={0.3}
            grainAnimated={false}
            contrast={1.5}
            gamma={1}
            saturation={1}
            centerX={0}
            centerY={0}
            zoom={0.9}
          />
        )}
      </div>

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
        fixed inset-y-0 left-0 z-40 w-[260px] lg:static lg:h-full lg:w-[260px] lg:z-auto
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        bg-[#17280e]/95 text-white border-r border-[#243e16] lg:border-white/10 lg:rounded-[24px] lg:shadow-xl lg:backdrop-blur-xl
      `}>
        {/* Logo/Wordmark */}
        <div className={`h-[70px] px-6 flex items-center justify-between flex-shrink-0 border-b ${
          isGreenSide ? 'border-[#243e16]' : 'border-slate-900'
        }`}>
          <div className="flex items-center space-x-2.5 pl-1">
            <div className="bg-white text-[#17280e] p-1.5 rounded font-black text-sm flex items-center justify-center h-7 w-7">
              M
            </div>
            <span className="font-bold text-xl tracking-tighter text-white">
              MobiFin
            </span>
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
      <div className="flex flex-col h-full overflow-hidden flex-1 z-10 lg:gap-4">
        {/* Header - Height 70px */}
        <header className="relative z-30 h-[70px] bg-white dark:bg-[#0c1c09]/85 border-b border-slate-250 dark:border-[#1e3a12] lg:border lg:border-[var(--mf-border)] lg:rounded-[20px] px-4 md:px-8 flex items-center justify-between flex-shrink-0 lg:shadow-md lg:backdrop-blur-md animate-fadeIn">
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

          {/* Location switcher */}
          {currentUser?.role === 'AGENT' && (
            <div className="relative">
              <button
                onClick={() => setSwitcherOpen(!switcherOpen)}
                className="flex items-center space-x-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full px-3 py-1.5 text-xs text-slate-950 dark:text-white font-bold cursor-pointer hover:bg-slate-200 dark:hover:bg-white/10 transition-all select-none"
              >
                <span>{activeLocation ? `${activeLocation.name} — ${activeLocation.city || activeLocation.region || 'Accra'}` : 'Kwame Centre — Accra'}</span>
                <ChevronDown className="h-3 w-3" />
              </button>
              
              {switcherOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setSwitcherOpen(false)} />
                  <div className="absolute left-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl z-55 py-2 animate-fadeIn text-xs text-slate-950 dark:text-white backdrop-blur-xl">
                    <div className="px-3 py-1.5 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-white/5 mb-1">
                      Switch Location
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {locations.map((loc) => {
                        const isActive = loc.agent_id === currentUser.agent_id;
                        return (
                          <button
                            key={loc.agent_id}
                            onClick={async () => {
                              try {
                                await ApiService.request(`/onboarding/active-location/${loc.agent_id}`, { method: 'POST' });
                                setSwitcherOpen(false);
                                window.location.reload();
                              } catch (err) {
                                console.error(err);
                              }
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-white/5 flex items-center justify-between transition cursor-pointer border-none bg-transparent"
                          >
                            <div className="flex flex-col text-slate-950 dark:text-white">
                              <span className="font-bold">{loc.name}</span>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400">{loc.city || loc.location}</span>
                            </div>
                            {isActive && <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                    <div className="border-t border-slate-200 dark:border-white/5 mt-1 pt-1 px-1">
                      <button
                        onClick={() => {
                          setSwitcherOpen(false);
                          setActivePage('add-business');
                        }}
                        className="w-full text-center py-2 px-3 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl text-emerald-600 dark:text-emerald-400 font-bold transition cursor-pointer border-none bg-transparent"
                      >
                        + Add Business Location
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="flex items-center space-x-2 md:space-x-4">
            {ApiService.isDemoMode() ? (
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase bg-amber-550/10 border border-amber-500/20 text-amber-400 select-none" title="Using offline local synthetic data due to unstable backend connection.">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span>DEMO MODE</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 select-none" title="Successfully connected to MobiFin FastAPI backend services.">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>CONNECTED</span>
              </span>
            )}
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 dark:text-slate-300 transition cursor-pointer border-none bg-transparent flex items-center justify-center"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* AI notifications center */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 dark:text-slate-300 transition cursor-pointer border-none bg-transparent flex items-center justify-center relative"
                title="AI Notifications Center"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 bg-rose-550 text-white font-bold text-[7px] h-3.5 w-3.5 rounded-full flex items-center justify-center scale-95 border border-white dark:border-[#0c1c09]">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#0c1c09]/95 border border-slate-250 dark:border-[#1e3a12] rounded-2xl shadow-xl z-55 py-3 animate-fadeIn backdrop-blur-xl text-xs text-[var(--mf-text-primary)]">
                    {/* Header */}
                    <div className="px-4 pb-2 border-b border-[var(--mf-border)] flex items-center justify-between">
                      <span className="font-bold text-[10px] uppercase tracking-wider text-[var(--mf-text-primary)]">AI Alerts & Insights</span>
                      <GlassBadge variant="danger">{unreadCount} Unread</GlassBadge>
                    </div>

                    {/* Filter Tabs */}
                    <div className="px-3 py-2 flex flex-wrap gap-1 border-b border-[var(--mf-border)]">
                      {['all', 'unread', 'critical', 'liquidity', 'credit', 'business'].map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setActiveNotifTab(tab)}
                          className={`px-2 py-1 rounded text-[8px] font-bold uppercase transition cursor-pointer border-none ${
                            activeNotifTab === tab
                              ? 'bg-[var(--mf-accent)] text-white'
                              : 'bg-white/5 text-[var(--mf-text-secondary)] hover:bg-white/10'
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>

                    {/* Notification list */}
                    <div className="max-h-64 overflow-y-auto divide-y divide-[var(--mf-border)]">
                      {getFilteredNotifications().length === 0 ? (
                        <div className="px-4 py-6 text-center text-[var(--mf-text-secondary)]">
                          No notifications found matching filter.
                        </div>
                      ) : (
                        getFilteredNotifications().map((n) => {
                          const isUnread = !n.read;
                          const isHigh = n.severity === 'High' || n.severity === 'Critical';
                          return (
                            <div 
                              key={n.notification_id} 
                              onClick={() => handleMarkRead(n.notification_id, n.action_url)}
                              className={`p-3 text-left transition hover:bg-white/5 cursor-pointer flex items-start space-x-2.5 ${
                                isUnread ? 'bg-[var(--mf-accent)]/5' : ''
                              }`}
                            >
                              <div className={`h-2 w-2 rounded-full mt-1.5 flex-shrink-0 ${
                                isHigh ? 'bg-rose-500 animate-pulse' : isUnread ? 'bg-sky-500' : 'bg-slate-300 dark:bg-slate-700'
                              }`} />
                              <div className="flex-1 space-y-1">
                                <div className="flex justify-between items-start">
                                  <span className="font-bold text-[10px] uppercase text-[var(--mf-text-primary)]">
                                    {n.title}
                                  </span>
                                  <span className="text-[8px] text-[var(--mf-text-secondary)] font-medium">
                                    {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <p className="text-[10px] text-[var(--mf-text-secondary)] leading-normal">{n.message}</p>
                                {n.action_url && (
                                  <span className="text-[8px] font-bold text-[var(--mf-accent)] flex items-center mt-1">
                                    Take Action &rarr;
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

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
                      onClick={() => { setDropdownOpen(false); handleRoleSwitch('AGENT'); }}
                      className="w-full text-left px-3 py-2 text-[10px] font-semibold text-slate-650 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition flex items-center space-x-1.5 cursor-pointer"
                    >
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      <span>Agent — Kwame</span>
                    </button>
                    <button
                      onClick={() => { setDropdownOpen(false); handleRoleSwitch('FINANCIAL_INSTITUTION'); }}
                      className="w-full text-left px-3 py-2 text-[10px] font-semibold text-slate-650 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition flex items-center space-x-1.5 cursor-pointer"
                    >
                      <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
                      <span>FI — Forms Capital</span>
                    </button>
                    <button
                      onClick={() => { setDropdownOpen(false); handleRoleSwitch('ADMIN'); }}
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
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-white dark:bg-[#091406] text-slate-850 dark:text-slate-100 lg:bg-transparent lg:dark:bg-transparent lg:p-0">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
