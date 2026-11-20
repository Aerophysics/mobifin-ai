import React, { useEffect, useMemo, useState } from 'react';
import {
  LayoutDashboard, Receipt, Droplet, LineChart, Users, KeyRound,
  BarChart2, Database, Settings as SettingsIcon, Sparkles,
  LogOut, ShieldCheck, Activity, User, ChevronDown, Sun, Moon, Menu, X,
  BookOpen, Bell, Check, Landmark, MoreHorizontal, FileCheck2, FlaskConical, MapPin
} from 'lucide-react';
import ApiService from '../services/api';
import { UserProfile } from '../types';
import { GlassBadge } from '../components/glass/GlassBadge';

interface NavItem {
  name: string;
  icon: React.ComponentType<any>;
  page: string;
}

interface DashboardLayoutProps {
  activePage: string;
  setActivePage: (page: string) => void;
  currentUser: UserProfile | null;
  setCurrentUser: (user: UserProfile | null) => void;
  handleRoleSwitch: (role: 'AGENT' | 'FINANCIAL_INSTITUTION' | 'ADMIN') => Promise<void>;
  children: React.ReactNode;
}

// Primary items render as pills; the rest go under "More".
const NAV: Record<string, { primary: NavItem[]; more: NavItem[] }> = {
  AGENT: {
    primary: [
      { name: 'Overview', icon: LayoutDashboard, page: 'dashboard' },
      { name: 'Liquidity', icon: Droplet, page: 'liquidity' },
      { name: 'Transactions', icon: Receipt, page: 'transactions' },
      { name: 'Ledger', icon: BookOpen, page: 'ledger' },
      { name: 'Analytics', icon: LineChart, page: 'analytics' },
      { name: 'Referrals', icon: Landmark, page: 'referrals' },
    ],
    more: [
      { name: 'Liquidity network', icon: Users, page: 'trusted-sources' },
      { name: 'AI insights', icon: Sparkles, page: 'ai-insights' },
      { name: 'Customer consent', icon: KeyRound, page: 'consent' },
      { name: 'Settings', icon: SettingsIcon, page: 'settings' },
    ],
  },
  FINANCIAL_INSTITUTION: {
    primary: [
      { name: 'Overview', icon: LayoutDashboard, page: 'dashboard' },
      { name: 'Customers', icon: Users, page: 'credit' },
      { name: 'Applications', icon: FileCheck2, page: 'referrals' },
      { name: 'Portfolio', icon: LineChart, page: 'analytics' },
    ],
    more: [
      { name: 'Consent registry', icon: KeyRound, page: 'consent' },
      { name: 'Settings', icon: SettingsIcon, page: 'settings' },
    ],
  },
  ADMIN: {
    primary: [
      { name: 'Overview', icon: LayoutDashboard, page: 'admin-dashboard' },
      { name: 'Models', icon: BarChart2, page: 'performance' },
      { name: 'Data explorer', icon: Database, page: 'explorer' },
      { name: 'Demo data', icon: FlaskConical, page: 'demo-mgmt' },
    ],
    more: [
      { name: 'Customer consent', icon: KeyRound, page: 'consent' },
      { name: 'Settings', icon: SettingsIcon, page: 'settings' },
    ],
  },
};

const PAGE_COPY: Record<string, Record<string, [string, string]>> = {
  AGENT: {
    dashboard: ['Overview', 'Your cash, e-float and what needs attention today.'],
    transactions: ['Transactions', 'Deposits, withdrawals, transfers and payments at this branch.'],
    ledger: ['Daily ledger', 'Opening and closing balances, reconciled day by day.'],
    liquidity: ['Liquidity', 'Tomorrow’s demand forecast, shortfall risk and rebalancing plan.'],
    analytics: ['Business analytics', 'Volume, commission and operating trends.'],
    'ai-insights': ['AI insights', 'Grounded insights and unusual-activity alerts.'],
    referrals: ['Customer referrals', 'Refer customers to partner lenders with their consent.'],
    'trusted-sources': ['Liquidity network', 'Super agents, partner institutions and trusted peers for rebalancing.'],
    consent: ['Customer consent', 'Record opt-in for alternative credit profiling.'],
    'add-business': ['Add a location', 'Register another branch under your account.'],
    settings: ['Settings', 'Profile, security and notification preferences.'],
  },
  FINANCIAL_INSTITUTION: {
    dashboard: ['Overview', 'Portfolio readiness, risk and applications awaiting a decision.'],
    credit: ['Customer intelligence', 'Explainable alternative credit profiles for consenting customers.'],
    referrals: ['Credit applications', 'Agent referrals, consent status and lending decisions.'],
    analytics: ['Portfolio insights', 'Customer financial behaviour and readiness trends.'],
    consent: ['Consent registry', 'Read-only view of customer profiling consent.'],
    settings: ['Settings', 'Underwriting parameters and connection keys.'],
  },
  ADMIN: {
    'admin-dashboard': ['Platform overview', 'Data volumes, consent coverage and model status.'],
    performance: ['Model performance', 'Offline validation metrics for every production model.'],
    explorer: ['Data explorer', 'Inspect the underlying platform dataset.'],
    'demo-mgmt': ['Demo data', 'Reset and reseed the demo environment.'],
    consent: ['Customer consent', 'Manage customer profiling consent.'],
    settings: ['Settings', 'System variables and environment controls.'],
  },
};

const ROLE_LABEL: Record<string, { name: string; org: string; initials: string }> = {
  AGENT: { name: 'Kwame Mensah', org: 'Agent · Kwame’s Centre', initials: 'KM' },
  FINANCIAL_INSTITUTION: { name: 'Forms Capital', org: 'Financial institution', initials: 'FC' },
  ADMIN: { name: 'System Admin', org: 'Platform operator', initials: 'SA' },
};

const iconBtn = 'h-10 w-10 rounded-full border border-[var(--mf-border)] bg-[var(--mf-surface)] flex items-center justify-center text-[var(--mf-text-secondary)] hover:text-[var(--mf-text-primary)] hover:bg-[var(--mf-card-glass)] transition-colors cursor-pointer relative';
const menuPanel = 'absolute mt-2 bg-[var(--mf-surface)] border border-[var(--mf-border)] rounded-2xl shadow-[var(--mf-shadow-pop)] z-50 py-2 text-[13px] text-[var(--mf-text-primary)]';

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  activePage,
  setActivePage,
  currentUser,
  setCurrentUser,
  handleRoleSwitch,
  children
}) => {
  const role = currentUser?.role || 'AGENT';
  const nav = NAV[role] || NAV.AGENT;
  const [moreOpen, setMoreOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [isDark, setIsDark] = useState<boolean>(() => localStorage.getItem('mobifin_theme') === 'dark');

  const [locations, setLocations] = useState<any[]>([]);
  const [activeLocation, setActiveLocation] = useState<any>(null);
  const [switcherOpen, setSwitcherOpen] = useState(false);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [activeNotifTab, setActiveNotifTab] = useState<string>('all');
  const unreadCount = notifications.filter((n: any) => !n.read).length;

  useEffect(() => {
    if (currentUser?.role === 'AGENT') {
      ApiService.request<any[]>('/onboarding/businesses')
        .then(res => {
          setLocations(res);
          const active = res.find((l: any) => l.agent_id === currentUser.agent_id);
          if (active) setActiveLocation(active);
        })
        .catch(err => console.error('Error loading locations:', err));
    }
  }, [currentUser]);

  const fetchNotifications = async () => {
    try {
      setNotifications(await ApiService.getNotifications());
    } catch (err) {
      console.error('Failed to fetch alerts', err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 10000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('mobifin_theme', isDark ? 'dark' : 'light');
  }, [isDark]);

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

  const filteredNotifications = useMemo(() => {
    switch (activeNotifTab) {
      case 'unread': return notifications.filter(n => !n.read);
      case 'critical': return notifications.filter(n => n.severity === 'High' || n.severity === 'Critical');
      case 'liquidity': return notifications.filter(n => n.type === 'LIQUIDITY');
      case 'credit': return notifications.filter(n => n.type === 'CREDIT');
      default: return notifications;
    }
  }, [notifications, activeNotifTab]);

  const handleLogout = () => {
    ApiService.logout();
    setCurrentUser(null);
  };

  const go = (page: string) => {
    setActivePage(page);
    setMoreOpen(false);
    setMobileOpen(false);
  };

  const [title, subtitle] = PAGE_COPY[role]?.[activePage] || ['MobiFin', ''];
  const moreActive = nav.more.some(i => i.page === activePage);
  const who = ROLE_LABEL[role] || ROLE_LABEL.AGENT;
  const isDemo = ApiService.isDemoMode();

  return (
    <div className="mf-app h-screen w-screen overflow-hidden bg-[var(--mf-background)] text-[var(--mf-text-primary)]">
      <div className="h-full overflow-y-auto">
        <div className="max-w-[1480px] mx-auto px-3 sm:px-5 lg:px-6 pt-3 sm:pt-4 pb-10">
          {/* ── Top navigation bar ─────────────────────────────────────── */}
          <header className="sticky top-3 sm:top-4 z-40 bg-[var(--mf-surface)]/95 backdrop-blur border border-[var(--mf-border)] rounded-[28px] shadow-[var(--mf-shadow-card)] pl-3 pr-2 sm:pl-4 py-2 flex items-center gap-2 sm:gap-3">
            <button onClick={() => go(nav.primary[0].page)} className="flex items-center gap-2.5 pr-2 cursor-pointer bg-transparent border-none">
              <span className="mf-solid h-9 w-9 rounded-xl bg-[var(--mf-accent)] text-white flex items-center justify-center">
                <Activity className="h-[18px] w-[18px]" strokeWidth={2.25} />
              </span>
              <span className="mf-display text-[19px] font-semibold tracking-tight hidden sm:block">MobiFin</span>
            </button>

            <nav className="hidden lg:flex items-center gap-0.5 bg-[var(--mf-card-glass)]/60 rounded-full p-1">
              {nav.primary.map(item => {
                const Icon = item.icon;
                const active = activePage === item.page;
                return (
                  <button
                    key={item.page}
                    onClick={() => go(item.page)}
                    className={`h-10 px-4 rounded-full flex items-center gap-2 text-[14px] font-medium transition-colors cursor-pointer ${
                      active
                        ? 'mf-solid bg-[var(--mf-accent)] text-white shadow-sm'
                        : 'text-[var(--mf-text-primary)] hover:bg-[var(--mf-surface)]'
                    }`}
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.9} />
                    {item.name}
                  </button>
                );
              })}
              <div className="relative">
                <button
                  onClick={() => setMoreOpen(!moreOpen)}
                  className={`h-10 px-4 rounded-full flex items-center gap-2 text-[14px] font-medium cursor-pointer transition-colors ${
                    moreActive ? 'mf-solid bg-[var(--mf-accent)] text-white' : 'text-[var(--mf-text-primary)] hover:bg-[var(--mf-surface)]'
                  }`}
                >
                  <MoreHorizontal className="h-4 w-4" />
                  More
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
                </button>
                {moreOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMoreOpen(false)} />
                    <div className={`${menuPanel} left-0 w-56`}>
                      {nav.more.map(item => {
                        const Icon = item.icon;
                        return (
                          <button key={item.page} onClick={() => go(item.page)} className="w-full px-3.5 py-2.5 flex items-center gap-2.5 hover:bg-[var(--mf-card-glass)] cursor-pointer text-left">
                            <Icon className="h-4 w-4 text-[var(--mf-text-secondary)]" strokeWidth={1.8} />
                            <span className="flex-1">{item.name}</span>
                            {activePage === item.page && <Check className="h-4 w-4 text-[var(--mf-accent-ink)]" />}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </nav>

            <div className="flex-1" />

            <span
              className={`hidden md:inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[12px] font-medium border ${
                isDemo
                  ? 'bg-[var(--mf-warning-soft)] text-[var(--mf-warning-ink)] border-transparent'
                  : 'bg-[var(--mf-success-soft)] text-[var(--mf-success-ink)] border-transparent'
              }`}
              title={isDemo ? 'Using offline demo data stored in this browser.' : 'Connected to the MobiFin API.'}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${isDemo ? 'bg-[var(--mf-warning)]' : 'bg-[var(--mf-success)]'}`} />
              {isDemo ? 'Offline demo' : 'Live API'}
            </span>

            <button onClick={() => setIsDark(!isDark)} className={iconBtn} title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
              {isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
            </button>

            {/* Notifications */}
            <div className="relative">
              <button onClick={() => setNotifOpen(!notifOpen)} className={iconBtn} title="Notifications">
                <Bell className="h-[18px] w-[18px]" />
                {unreadCount > 0 && <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-[var(--mf-success)] ring-2 ring-[var(--mf-surface)]" />}
              </button>
              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                  <div className={`${menuPanel} right-0 w-[min(92vw,380px)] py-0 overflow-hidden`}>
                    <div className="px-4 py-3 flex items-center justify-between border-b border-[var(--mf-border)]">
                      <span className="font-semibold text-[14px]">Notifications</span>
                      {unreadCount > 0 && <GlassBadge variant="success">{unreadCount} unread</GlassBadge>}
                    </div>
                    <div className="px-3 py-2 flex flex-wrap gap-1 border-b border-[var(--mf-border)]">
                      {['all', 'unread', 'critical', 'liquidity', 'credit'].map(tab => (
                        <button
                          key={tab}
                          onClick={() => setActiveNotifTab(tab)}
                          className={`px-2.5 py-1 rounded-full text-[12px] capitalize cursor-pointer transition-colors ${
                            activeNotifTab === tab ? 'mf-solid bg-[var(--mf-accent)] text-white' : 'text-[var(--mf-text-secondary)] hover:bg-[var(--mf-card-glass)]'
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-[var(--mf-border)]">
                      {filteredNotifications.length === 0 ? (
                        <div className="px-4 py-8 text-center text-[var(--mf-text-secondary)]">You’re all caught up.</div>
                      ) : filteredNotifications.map((n: any) => {
                        const high = n.severity === 'High' || n.severity === 'Critical';
                        return (
                          <button
                            key={n.notification_id}
                            onClick={() => handleMarkRead(n.notification_id, n.action_url)}
                            className={`w-full text-left p-3.5 flex gap-3 hover:bg-[var(--mf-card-glass)] cursor-pointer ${!n.read ? 'bg-[var(--mf-accent-soft)]/40' : ''}`}
                          >
                            <span className={`h-2 w-2 rounded-full mt-1.5 flex-shrink-0 ${high ? 'bg-[var(--mf-danger)]' : !n.read ? 'bg-[var(--mf-success)]' : 'bg-[var(--mf-border-strong)]'}`} />
                            <span className="flex-1 min-w-0">
                              <span className="flex justify-between gap-2">
                                <span className="font-semibold text-[13px]">{n.title}</span>
                                <span className="text-[11px] text-[var(--mf-text-muted)] flex-shrink-0">
                                  {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </span>
                              <span className="block text-[12px] text-[var(--mf-text-secondary)] mt-0.5 leading-relaxed">{n.message}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Account + demo role switcher */}
            <div className="relative">
              <button
                onClick={() => setAccountOpen(!accountOpen)}
                className="mf-solid h-10 w-10 rounded-full bg-[var(--mf-accent)] text-white text-[13px] font-semibold flex items-center justify-center cursor-pointer ring-2 ring-[var(--mf-surface)] shadow-sm"
                title={who.name}
              >
                {who.initials}
              </button>
              {accountOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setAccountOpen(false)} />
                  <div className={`${menuPanel} right-0 w-64`}>
                    <div className="px-4 py-2.5 border-b border-[var(--mf-border)]">
                      <div className="font-semibold text-[14px]">{who.name}</div>
                      <div className="text-[12px] text-[var(--mf-text-secondary)]">{who.org} · {currentUser?.username}</div>
                    </div>
                    <div className="px-4 pt-2.5 pb-1 text-[11px] font-medium text-[var(--mf-text-muted)] uppercase tracking-wider">Switch demo view</div>
                    {([
                      ['AGENT', 'Agent — Kwame’s Centre', User],
                      ['FINANCIAL_INSTITUTION', 'Lender — Forms Capital', ShieldCheck],
                      ['ADMIN', 'Platform admin', Activity],
                    ] as const).map(([r, label, Icon]) => (
                      <button
                        key={r}
                        onClick={() => { setAccountOpen(false); handleRoleSwitch(r); }}
                        className="w-full px-4 py-2 flex items-center gap-2.5 hover:bg-[var(--mf-card-glass)] cursor-pointer text-left"
                      >
                        <Icon className="h-4 w-4 text-[var(--mf-text-secondary)]" />
                        <span className="flex-1">{label}</span>
                        {role === r && <Check className="h-4 w-4 text-[var(--mf-accent-ink)]" />}
                      </button>
                    ))}
                    <div className="border-t border-[var(--mf-border)] mt-1.5 pt-1.5">
                      <button onClick={handleLogout} className="w-full px-4 py-2 flex items-center gap-2.5 hover:bg-[var(--mf-card-glass)] cursor-pointer text-left text-[var(--mf-danger-ink)]">
                        <LogOut className="h-4 w-4" /> Sign out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <button onClick={() => setMobileOpen(!mobileOpen)} className={`${iconBtn} lg:hidden`} aria-label="Open navigation">
              {mobileOpen ? <X className="h-[18px] w-[18px]" /> : <Menu className="h-[18px] w-[18px]" />}
            </button>
          </header>

          {/* Mobile navigation sheet */}
          {mobileOpen && (
            <div className="lg:hidden mt-2 bg-[var(--mf-surface)] border border-[var(--mf-border)] rounded-[22px] shadow-[var(--mf-shadow-pop)] p-2 grid grid-cols-2 gap-1 relative z-30">
              {[...nav.primary, ...nav.more].map(item => {
                const Icon = item.icon;
                const active = activePage === item.page;
                return (
                  <button
                    key={item.page}
                    onClick={() => go(item.page)}
                    className={`h-11 px-3 rounded-xl flex items-center gap-2 text-[14px] cursor-pointer ${
                      active ? 'mf-solid bg-[var(--mf-accent)] text-white' : 'hover:bg-[var(--mf-card-glass)]'
                    }`}
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.9} />{item.name}
                  </button>
                );
              })}
            </div>
          )}

          {/* ── Page heading ───────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mt-6 mb-5 px-1">
            <div className="min-w-0">
              <h1 className="mf-display text-[26px] sm:text-[30px] font-semibold leading-tight">{title}</h1>
              {subtitle && <p className="text-[14px] text-[var(--mf-text-secondary)] mt-1">{subtitle}</p>}
            </div>

            {role === 'AGENT' && (
              <div className="relative self-start sm:self-auto">
                <button
                  onClick={() => setSwitcherOpen(!switcherOpen)}
                  className="h-10 pl-3 pr-3.5 rounded-full border border-[var(--mf-border-strong)] bg-[var(--mf-surface)] flex items-center gap-2 text-[13px] font-medium cursor-pointer hover:bg-[var(--mf-card-glass)]"
                >
                  <MapPin className="h-4 w-4 text-[var(--mf-accent-ink)]" />
                  <span className="truncate max-w-[240px]">
                    {activeLocation ? `${activeLocation.name} · ${activeLocation.city || activeLocation.location || 'Accra'}` : 'Kwame’s Centre · Accra'}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-[var(--mf-text-secondary)]" />
                </button>
                {switcherOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setSwitcherOpen(false)} />
                    <div className={`${menuPanel} right-0 w-72`}>
                      <div className="px-4 pt-1 pb-2 text-[11px] font-medium text-[var(--mf-text-muted)] uppercase tracking-wider">Your locations</div>
                      <div className="max-h-60 overflow-y-auto">
                        {locations.map(loc => (
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
                            className="w-full text-left px-4 py-2.5 hover:bg-[var(--mf-card-glass)] flex items-center justify-between cursor-pointer"
                          >
                            <span>
                              <span className="block font-semibold">{loc.name}</span>
                              <span className="block text-[12px] text-[var(--mf-text-secondary)]">{loc.city || loc.location}</span>
                            </span>
                            {loc.agent_id === currentUser?.agent_id && <Check className="h-4 w-4 text-[var(--mf-accent-ink)]" />}
                          </button>
                        ))}
                      </div>
                      <div className="border-t border-[var(--mf-border)] mt-1 pt-1 px-1.5">
                        <button
                          onClick={() => { setSwitcherOpen(false); setActivePage('add-business'); }}
                          className="w-full py-2.5 rounded-xl text-[var(--mf-accent-ink)] font-semibold hover:bg-[var(--mf-card-glass)] cursor-pointer"
                        >
                          + Add a location
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <main className="mf-main">{children}</main>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
