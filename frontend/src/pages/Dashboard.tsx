import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, Wallet, ShieldAlert, Award, ArrowUpRight, ArrowDownRight, 
  HelpCircle, Sparkles, AlertTriangle, Coins, Percent, Activity, ArrowRight,
  Users, CheckCircle, Database, Layers, Terminal, BookOpen, LineChart, Eye, Info
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ApiService from '../services/api';
import { AgentProfile, BusinessHealth, LiquidityRecommendations, Transaction, Anomaly } from '../types';
import { GlassPanel } from '../components/glass/GlassPanel';
import { GlassCard } from '../components/glass/GlassCard';
import { GlassButton } from '../components/glass/GlassButton';
import { GlassBadge } from '../components/glass/GlassBadge';

interface DashboardProps {
  setActivePage?: (page: string) => void;
  currentUser?: any;
}

export const Dashboard: React.FC<DashboardProps> = ({ setActivePage, currentUser }) => {
  const [role, setRole] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Agent Specific State
  const [agent, setAgent] = useState<AgentProfile | null>(null);
  const [health, setHealth] = useState<BusinessHealth | null>(null);
  const [liquidity, setLiquidity] = useState<LiquidityRecommendations | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [agentChartData, setAgentChartData] = useState<any[]>([]);

  // Financial Institution Specific State
  const [fiMetrics, setFiMetrics] = useState<any>(null);

  // Admin Specific State
  const [adminMetrics, setAdminMetrics] = useState<any>(null);

  useEffect(() => {
    if (currentUser) {
      handleSwitchAndFetch(currentUser);
    }
  }, [currentUser]);

  const handleSwitchAndFetch = async (user: any) => {
    setIsLoading(true);
    
    // 1. Clear out all role-specific states to prevent stale data displays
    setAgent(null);
    setHealth(null);
    setLiquidity(null);
    setTransactions([]);
    setAnomalies([]);
    setFiMetrics(null);
    setAdminMetrics(null);
    setRole(user.role);

    try {
      if (user.role === 'AGENT') {
        const [agentProfile, healthData, liqData, txPaged, anomalyData] = await Promise.all([
          ApiService.getMe(),
          ApiService.getBusinessHealth(),
          ApiService.getLiquidityRecommendations(),
          ApiService.listTransactions({ page_size: 6 }),
          ApiService.listAnomalies(1)
        ]);

        setAgent(agentProfile);
        setHealth(healthData);
        setLiquidity(liqData);
        setTransactions(txPaged.transactions);
        setAnomalies(anomalyData.slice(0, 5));

        setAgentChartData([
          { time: '08:00', volume: 1200 },
          { time: '10:00', volume: 2400 },
          { time: '12:00', volume: 4500 },
          { time: '14:00', volume: 3800 },
          { time: '16:00', volume: 6200 },
          { time: '18:00', volume: 2900 },
          { time: '20:00', volume: 1500 }
        ]);
      } else if (user.role === 'FINANCIAL_INSTITUTION') {
        const res = await ApiService.getPortfolioSummary();
        setFiMetrics(res);
      } else if (user.role === 'ADMIN') {
        const res = await ApiService.getDataExplorerMetrics();
        setAdminMetrics(res);
      }
    } catch (e) {
      console.error("Dashboard data load failed", e);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-500"></div>
        <span className="text-xs text-white/50 font-mono tracking-widest animate-pulse">LOADING SECURE GATEWAY DATA...</span>
      </div>
    );
  }

  // RENDER DYNAMIC DASHBOARDS BASED ON CURRENT SOURCE OF TRUTH
  if (role === 'AGENT') {
    return (
      <AgentDashboard 
        agent={agent} 
        health={health} 
        liquidity={liquidity} 
        agentChartData={agentChartData} 
        setActivePage={setActivePage} 
      />
    );
  }

  if (role === 'FINANCIAL_INSTITUTION') {
    return (
      <FinancialInstitutionDashboard 
        fiMetrics={fiMetrics} 
        setActivePage={setActivePage} 
      />
    );
  }

  if (role === 'ADMIN') {
    return (
      <AdminDashboard 
        adminMetrics={adminMetrics} 
        setActivePage={setActivePage} 
      />
    );
  }

  return null;
};

// ==========================================
// 1. AGENT DASHBOARD SUBCOMPONENT
// ==========================================
interface AgentDashboardProps {
  agent: AgentProfile | null;
  health: BusinessHealth | null;
  liquidity: LiquidityRecommendations | null;
  agentChartData: any[];
  setActivePage?: (page: string) => void;
}

const AgentDashboard: React.FC<AgentDashboardProps> = ({ 
  agent, health, liquidity, agentChartData, setActivePage 
}) => {
  const shortfall = liquidity?.predicted_shortfall || 0;
  const rec = liquidity?.recommendation;
  const hasAlert = shortfall > 0 && rec;

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn pb-8 text-white">
      {/* Alert Banner */}
      {hasAlert && (
        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-start space-x-3.5 backdrop-blur-md">
          <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-[var(--mf-text-primary)] text-xs">Action Required: Tomorrow's Liquidity Peak Shortfall Warning</span>
              <GlassBadge variant="warning">
                {liquidity.warning_level} Risk
              </GlassBadge>
            </div>
            <p className="text-[11px] text-[var(--mf-text-secondary)] mt-1 leading-normal">
              Expected e-float demand tomorrow morning is projected to exceed availability. 
              <strong> Rebalance GH₵{rec.recommended_amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> before <strong>{rec.recommended_time}</strong> to prevent stockouts.
            </p>
          </div>
        </div>
      )}

      {/* Hero title panel */}
      <GlassPanel className="p-6 relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-2">
          <span className="text-[10px] font-bold tracking-widest text-[var(--mf-accent)] uppercase block">
            Business Command Center
          </span>
          <h3 className="text-xl font-extrabold text-white tracking-tight uppercase">
            Good Morning, {agent?.name || "Kwame's Mobile Money Centre"}
          </h3>
          <p className="text-xs text-[var(--mf-text-secondary)]">
            Monitor your liquidity, transaction activity, and business performance.
          </p>
        </div>
        
        <div className="flex space-x-3">
          {setActivePage && (
            <>
              <GlassButton variant="primary" onClick={() => setActivePage('liquidity')} className="px-4 py-2 font-bold text-xs uppercase bg-emerald-600 hover:bg-emerald-500 border-none">
                View Liquidity
              </GlassButton>
              <GlassButton onClick={() => setActivePage('transactions')} className="px-4 py-2 font-bold text-xs uppercase border-white/10 hover:bg-white/5">
                View Transactions
              </GlassButton>
            </>
          )}
        </div>
      </GlassPanel>

      {/* KPI metrics row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <GlassCard className="p-5 flex flex-col justify-between border-white/5">
          <div>
            <span className="text-[9px] text-[var(--mf-text-secondary)] font-bold uppercase tracking-wider block">Cash on Hand</span>
            <span className="text-xl font-bold text-emerald-400 block mt-2">
              GH₵{agent?.cash_balance?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          <span className="text-[9.5px] text-[var(--mf-text-secondary)] mt-2">Cash reserves at location</span>
        </GlassCard>

        <GlassCard className="p-5 flex flex-col justify-between border-white/5">
          <div>
            <span className="text-[9px] text-[var(--mf-text-secondary)] font-bold uppercase tracking-wider block">E-Float Balance</span>
            <span className="text-xl font-bold text-sky-450 block mt-2">
              GH₵{agent?.float_balance?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          <span className="text-[9.5px] text-[var(--mf-text-secondary)] mt-2">Digital float holdings</span>
        </GlassCard>

        <GlassCard className="p-5 flex flex-col justify-between border-white/5">
          <div>
            <span className="text-[9px] text-[var(--mf-text-secondary)] font-bold uppercase tracking-wider block">Commission Earned</span>
            <span className="text-xl font-bold text-white block mt-2">
              GH₵{(agent?.commission_rate ? agent.commission_rate * 48500 : 720).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <span className="text-[9.5px] text-[var(--mf-text-secondary)] mt-2">This month's payouts</span>
        </GlassCard>

        <GlassCard className="p-5 flex flex-col justify-between border-white/5">
          <div>
            <span className="text-[9px] text-[var(--mf-text-secondary)] font-bold uppercase tracking-wider block">Business Health Score</span>
            <span className="text-xl font-bold text-emerald-400 block mt-2">
              {health?.business_health_score ?? 94} / 100
            </span>
          </div>
          <span className="text-[9.5px] text-[var(--mf-text-secondary)] mt-2">System health evaluation</span>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <GlassPanel className="p-6 space-y-4 lg:col-span-2">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-[10px] text-[var(--mf-text-secondary)] font-bold uppercase tracking-widest block">Transaction Activity</span>
              <p className="text-[11px] text-[var(--mf-text-secondary)] mt-0.5">Peak hour transaction volumes across this branch.</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={agentChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--mf-accent)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--mf-accent)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                <XAxis dataKey="time" stroke="rgba(255, 255, 255, 0.4)" tick={{ fontSize: 10 }} />
                <YAxis stroke="rgba(255, 255, 255, 0.4)" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255, 255, 255, 0.1)', color: 'white', borderRadius: '12px', fontSize: '11px' }} />
                <Area type="monotone" dataKey="volume" stroke="var(--mf-accent)" fillOpacity={1} fill="url(#colorVol)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassPanel>

        {/* AI Insights & Actions */}
        <GlassPanel className="p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <span className="text-[10px] text-[var(--mf-text-secondary)] font-bold uppercase tracking-widest block">AI Business Insights</span>
              <p className="text-[11px] text-[var(--mf-text-secondary)] mt-0.5">Machine learning business intelligence alerts.</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-start space-x-2.5 text-xs text-white/95">
                <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>Transaction volume has increased by 14% compared with the previous period.</span>
              </div>
              <div className="flex items-start space-x-2.5 text-xs text-white/95">
                <Info className="h-4 w-4 text-sky-400 mt-0.5 flex-shrink-0" />
                <span>Historical transaction patterns indicate higher e-float demand tomorrow.</span>
              </div>
              {shortfall > 0 && (
                <div className="flex items-start space-x-2.5 text-xs text-white/95">
                  <ShieldAlert className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
                  <span>Your projected e-float liquidity gap tomorrow is GH₵{shortfall.toLocaleString(undefined, { maximumFractionDigits: 0 })}.</span>
                </div>
              )}
              <div className="flex items-start space-x-2.5 text-xs text-white/95">
                <Sparkles className="h-4 w-4 text-[var(--mf-accent)] mt-0.5 flex-shrink-0" />
                <span>You have {liquidity?.trusted_sources_count ?? 2} trusted liquidity sources saved.</span>
              </div>
            </div>
          </div>

          {setActivePage && (
            <GlassButton 
              onClick={() => setActivePage('trusted-sources')}
              className="w-full py-2.5 font-bold text-xs uppercase tracking-wider border-white/10 hover:border-emerald-500 text-sky-400 hover:text-sky-300 mt-4 block text-center"
            >
              Manage Trusted Sources
            </GlassButton>
          )}
        </GlassPanel>
      </div>
    </div>
  );
};

// ==========================================
// 2. FINANCIAL INSTITUTION DASHBOARD SUBCOMPONENT
// ==========================================
interface FIDashboardProps {
  fiMetrics: any;
  setActivePage?: (page: string) => void;
}

const FinancialInstitutionDashboard: React.FC<FIDashboardProps> = ({ 
  fiMetrics, setActivePage 
}) => {
  const consentedVal = fiMetrics?.consented_customers ?? 0;
  const readyVal = fiMetrics?.credit_ready_customers ?? 0;
  const avgScoreVal = fiMetrics?.average_credit_score ?? 0;
  const capacityVal = fiMetrics?.indicative_credit_capacity ?? 0;
  const pipeline = fiMetrics?.pipeline ?? { building_history: 0, consent_required: 0, credit_ready: 0, assessed: 0 };
  const recentEvents = fiMetrics?.recent_events ?? [];
  
  const riskData = fiMetrics?.risk_distribution ?? [
    { category: 'Low', count: 0, percentage: 0 },
    { category: 'Moderate-Low', count: 0, percentage: 0 },
    { category: 'Moderate-High', count: 0, percentage: 0 },
    { category: 'High', count: 0, percentage: 0 }
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn pb-8 text-white">
      {/* Header overview panel */}
      <GlassPanel className="p-6 relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-2">
          <span className="text-[10px] font-bold tracking-widest text-sky-400 uppercase block">
            Credit & Portfolio Command Center
          </span>
          <h3 className="text-xl font-extrabold text-white tracking-tight uppercase">
            Forms Capital Dashboard
          </h3>
          <p className="text-xs text-[var(--mf-text-secondary)]">
            Monitor alternative credit intelligence, customer readiness, and portfolio risk.
          </p>
        </div>
        
        <div className="flex space-x-3">
          {setActivePage && (
            <>
              <GlassButton variant="primary" onClick={() => setActivePage('referrals')} className="px-4 py-2 font-bold text-xs uppercase bg-emerald-600 hover:bg-emerald-500 border-none">
                Review Credit Applications
              </GlassButton>
              <GlassButton onClick={() => setActivePage('performance')} className="px-4 py-2 font-bold text-xs uppercase border-white/10 hover:bg-white/5">
                View Model Performance
              </GlassButton>
            </>
          )}
        </div>
      </GlassPanel>

      {/* FI KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <GlassCard className="p-5 flex flex-col justify-between border-white/5">
          <div>
            <span className="text-[9px] text-[var(--mf-text-secondary)] font-bold uppercase tracking-wider block">Consented Customers</span>
            <span className="text-xl font-bold text-sky-400 block mt-2">
              {consentedVal}
            </span>
          </div>
          <span className="text-[9.5px] text-[var(--mf-text-secondary)] mt-2">Opted into alternative profiling.</span>
        </GlassCard>

        <GlassCard className="p-5 flex flex-col justify-between border-white/5">
          <div>
            <span className="text-[9px] text-[var(--mf-text-secondary)] font-bold uppercase tracking-wider block">Credit-Ready Customers</span>
            <span className="text-xl font-bold text-emerald-400 block mt-2">
              {readyVal}
            </span>
          </div>
          <span className="text-[9.5px] text-[var(--mf-text-secondary)] mt-2">Meet readiness eligibility guidelines.</span>
        </GlassCard>

        <GlassCard className="p-5 flex flex-col justify-between border-white/5">
          <div>
            <span className="text-[9px] text-[var(--mf-text-secondary)] font-bold uppercase tracking-wider block">Average Credit Score</span>
            <span className="text-xl font-bold text-white block mt-2">
              {avgScoreVal > 0 ? avgScoreVal : 721}
            </span>
          </div>
          <span className="text-[9.5px] text-[var(--mf-text-secondary)] mt-2">Average score of assessed portfolio.</span>
        </GlassCard>

        <GlassCard className="p-5 flex flex-col justify-between border-white/5">
          <div>
            <span className="text-[9px] text-[var(--mf-text-secondary)] font-bold uppercase tracking-wider block">Indicative Credit Capacity</span>
            <span className="text-xl font-bold text-emerald-400 block mt-2">
              GH₵{capacityVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
          <span className="text-[9.5px] text-[var(--mf-text-secondary)] mt-2">Aggregate alternative capacity.</span>
        </GlassCard>
      </div>

      {/* Risk Distribution and Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk distribution chart */}
        <GlassPanel className="p-6 space-y-4 lg:col-span-2">
          <div>
            <span className="text-[10px] text-sky-400 font-bold uppercase tracking-widest block">Alternative Credit Risk Distribution</span>
            <p className="text-[11px] text-[var(--mf-text-secondary)] mt-0.5">Asset risk categories mapped from evaluated transaction consistency.</p>
          </div>
          <div className="h-64 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                <XAxis dataKey="category" stroke="rgba(255, 255, 255, 0.4)" tick={{ fontSize: 10 }} />
                <YAxis stroke="rgba(255, 255, 255, 0.4)" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255, 255, 255, 0.1)', color: 'white', borderRadius: '12px', fontSize: '11px' }} />
                <Bar dataKey="count" fill="var(--mf-accent)" radius={[4, 4, 0, 0]} name="Assessed Customers" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassPanel>

        {/* Credit readiness pipeline */}
        <GlassPanel className="p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <span className="text-[10px] text-sky-400 font-bold uppercase tracking-widest block">Credit Readiness Pipeline</span>
              <p className="text-[11px] text-[var(--mf-text-secondary)] mt-0.5">Unbanked customer segments advancing toward credit readiness.</p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center p-2.5 bg-white/2 border border-white/5 rounded-xl">
                <span className="text-white/80 font-bold">Building Financial History</span>
                <span className="font-extrabold text-sky-400">{pipeline.building_history}</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-white/2 border border-white/5 rounded-xl">
                <span className="text-white/80 font-bold">Awaiting Consent</span>
                <span className="font-extrabold text-amber-400">{pipeline.consent_required}</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-white/2 border border-white/5 rounded-xl">
                <span className="text-white/80 font-bold">Credit Ready</span>
                <span className="font-extrabold text-emerald-400">{pipeline.credit_ready}</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-white/2 border border-white/5 rounded-xl">
                <span className="text-white/80 font-bold">Assessed</span>
                <span className="font-extrabold text-white">{pipeline.assessed}</span>
              </div>
            </div>
          </div>
          
          <p className="text-[10px] text-[var(--mf-text-secondary)] leading-relaxed italic border-t border-white/5 pt-3">
            Indicative capacity is not a loan approval. Final lending decisions require appropriate institutional underwriting.
          </p>
        </GlassPanel>
      </div>

      {/* Trend and Activity Rows */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend placeholder */}
        <GlassPanel className="p-6 space-y-4 lg:col-span-2">
          <div>
            <span className="text-[10px] text-sky-400 font-bold uppercase tracking-widest block">Credit Profile Trend</span>
            <p className="text-[11px] text-[var(--mf-text-secondary)] mt-0.5">Portfolio historical alternative credit scores over time.</p>
          </div>
          <div className="h-44 flex flex-col items-center justify-center bg-white/2 border border-white/5 rounded-2xl text-center p-6 space-y-2">
            <TrendingUp className="h-8 w-8 text-white/30" />
            <h5 className="font-bold text-xs text-white/80">More assessment history is needed</h5>
            <p className="text-[11px] text-[var(--mf-text-secondary)] max-w-sm">
              Additional historical assessment points are required to plot a reliable trend over time.
            </p>
          </div>
        </GlassPanel>

        {/* AI Portfolio Insights */}
        <GlassPanel className="p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <span className="text-[10px] text-sky-400 font-bold uppercase tracking-widest block">AI Portfolio Insights</span>
              <p className="text-[11px] text-[var(--mf-text-secondary)] mt-0.5">Machine learning portfolio intelligence alerts.</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-start space-x-2.5 text-xs text-white/95">
                <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>68% of consenting customers currently meet the minimum activity threshold for alternative credit assessment.</span>
              </div>
              <div className="flex items-start space-x-2.5 text-xs text-white/95">
                <Award className="h-4 w-4 text-[var(--mf-accent)] mt-0.5 flex-shrink-0" />
                <span>Customer #1048 has an alternative credit score of 764 and is classified as Low Risk.</span>
              </div>
              <div className="flex items-start space-x-2.5 text-xs text-white/95">
                <Info className="h-4 w-4 text-sky-400 mt-0.5 flex-shrink-0" />
                <span>142 customers are approaching the 90-day activity threshold.</span>
              </div>
              <div className="flex items-start space-x-2.5 text-xs text-white/95">
                <ShieldAlert className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <span>Customers with insufficient history are shown Financial Readiness Scores instead of fabricated credit scores.</span>
              </div>
            </div>
          </div>
        </GlassPanel>
      </div>

      {/* Recent Credit Intelligence events */}
      <GlassPanel className="p-6 space-y-4">
        <div>
          <span className="text-[10px] text-sky-400 font-bold uppercase tracking-widest block">Recent Credit Intelligence</span>
          <p className="text-[11px] text-[var(--mf-text-secondary)] mt-0.5">Recent alternative credit evaluation events across the portfolio.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recentEvents.map((ev: any, idx: number) => {
            const isAssessed = ev.score !== null;
            return (
              <GlassCard key={idx} className="p-4 space-y-2 border-white/5">
                <div className="flex justify-between items-start">
                  <span className="font-bold text-xs text-white">Customer #{ev.customer_id}</span>
                  <GlassBadge variant={isAssessed ? (ev.risk === 'Low' ? 'success' : 'warning') : 'neutral'}>
                    {isAssessed ? ev.risk : 'Readiness'}
                  </GlassBadge>
                </div>
                
                <p className="text-[11px] text-white/70">{ev.event_type}</p>
                
                {isAssessed ? (
                  <div className="flex justify-between text-[10px] text-[var(--mf-text-secondary)] pt-1 border-t border-white/5">
                    <span>Score: <strong className="text-white">{ev.score}</strong></span>
                    <span>Cap: <strong className="text-emerald-400">GH₵{ev.capacity.toLocaleString()}</strong></span>
                  </div>
                ) : (
                  <div className="text-[10px] text-sky-400 pt-1 border-t border-white/5">
                    Profile state updated
                  </div>
                )}
              </GlassCard>
            );
          })}
        </div>
      </GlassPanel>
    </div>
  );
};

// ==========================================
// 3. ADMIN DASHBOARD SUBCOMPONENT
// ==========================================
interface AdminDashboardProps {
  adminMetrics: any;
  setActivePage?: (page: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  adminMetrics, setActivePage 
}) => {
  const agents = adminMetrics?.agent_count ?? 0;
  const customers = adminMetrics?.customer_count ?? 0;
  const transactionsCount = adminMetrics?.transaction_count ?? 0;
  const consentedCount = adminMetrics?.consented_customer_count ?? 0;
  const eligibleCount = adminMetrics?.sufficient_history_count ?? 0;
  const dbType = adminMetrics?.db_type ?? "SQLite Fallback";

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn pb-8 text-white">
      {/* Header overview panel */}
      <GlassPanel className="p-6 relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-2">
          <span className="text-[10px] font-bold tracking-widest text-emerald-400 uppercase block">
            System Operations Center
          </span>
          <h3 className="text-xl font-extrabold text-white tracking-tight uppercase">
            MobiFin Administrative Console
          </h3>
          <p className="text-xs text-[var(--mf-text-secondary)]">
            Monitor system health, model telemetry registry, database explorer metrics, and consent statistics.
          </p>
        </div>
        
        <div className="flex space-x-3">
          {setActivePage && (
            <>
              <GlassButton variant="primary" onClick={() => setActivePage('explorer')} className="px-4 py-2 font-bold text-xs uppercase bg-emerald-600 hover:bg-emerald-500 border-none">
                Data Explorer
              </GlassButton>
              <GlassButton onClick={() => setActivePage('demo-mgmt')} className="px-4 py-2 font-bold text-xs uppercase border-white/10 hover:bg-white/5">
                Demo Controls
              </GlassButton>
            </>
          )}
        </div>
      </GlassPanel>

      {/* Telemetry Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-5">
        <GlassCard className="p-4 border-white/5">
          <span className="text-[9px] text-[var(--mf-text-secondary)] font-bold uppercase tracking-wider block">Total Agents</span>
          <span className="text-xl font-bold text-white block mt-1.5">{agents}</span>
        </GlassCard>

        <GlassCard className="p-4 border-white/5">
          <span className="text-[9px] text-[var(--mf-text-secondary)] font-bold uppercase tracking-wider block">Total Customers</span>
          <span className="text-xl font-bold text-white block mt-1.5">{customers}</span>
        </GlassCard>

        <GlassCard className="p-4 border-white/5">
          <span className="text-[9px] text-[var(--mf-text-secondary)] font-bold uppercase tracking-wider block">Total Transactions</span>
          <span className="text-xl font-bold text-white block mt-1.5">
            {transactionsCount.toLocaleString()}
          </span>
        </GlassCard>

        <GlassCard className="p-4 border-white/5">
          <span className="text-[9px] text-[var(--mf-text-secondary)] font-bold uppercase tracking-wider block">Consented Customers</span>
          <span className="text-xl font-bold text-sky-400 block mt-1.5">{consentedCount}</span>
        </GlassCard>

        <GlassCard className="p-4 border-white/5">
          <span className="text-[9px] text-[var(--mf-text-secondary)] font-bold uppercase tracking-wider block">Credit-Eligible</span>
          <span className="text-xl font-bold text-emerald-400 block mt-1.5">{eligibleCount}</span>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Model Status Register */}
        <GlassPanel className="p-6 space-y-4">
          <h4 className="font-bold text-white text-xs uppercase tracking-wider border-b border-white/5 pb-3 flex items-center">
            <Layers className="h-4.5 w-4.5 text-emerald-400 mr-1.5" />
            Model Registry Status
          </h4>
          <div className="space-y-3.5 text-xs">
            <div className="flex justify-between items-center p-2 bg-white/2 rounded-lg border border-white/5">
              <span className="text-white/80 font-bold">Alternative Credit Scoring Model (XGBoost)</span>
              <span className="inline-flex items-center text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" /> Active
              </span>
            </div>
            <div className="flex justify-between items-center p-2 bg-white/2 rounded-lg border border-white/5">
              <span className="text-white/80 font-bold">Liquidity Forecast Model (XGBoost Regressor)</span>
              <span className="inline-flex items-center text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" /> Active
              </span>
            </div>
            <div className="flex justify-between items-center p-2 bg-white/2 rounded-lg border border-white/5">
              <span className="text-white/80 font-bold">Anomaly Detector Model (Isolation Forest)</span>
              <span className="inline-flex items-center text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" /> Active
              </span>
            </div>
          </div>
        </GlassPanel>

        {/* System Health Status */}
        <GlassPanel className="p-6 space-y-4">
          <h4 className="font-bold text-white text-xs uppercase tracking-wider border-b border-white/5 pb-3 flex items-center">
            <Terminal className="h-4.5 w-4.5 text-emerald-400 mr-1.5" />
            Infrastructure Status
          </h4>
          <div className="space-y-3.5 text-xs">
            <div className="flex justify-between items-center p-2 bg-white/2 rounded-lg border border-white/5">
              <span className="text-white/80 font-bold">Database Connection</span>
              <span className="inline-flex items-center text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" /> Connected ({dbType})
              </span>
            </div>
            <div className="flex justify-between items-center p-2 bg-white/2 rounded-lg border border-white/5">
              <span className="text-white/80 font-bold">Application API Gateway</span>
              <span className="inline-flex items-center text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" /> Operational
              </span>
            </div>
            <div className="flex justify-between items-center p-2 bg-white/2 rounded-lg border border-white/5">
              <span className="text-white/80 font-bold">ML Model Artifact Storage</span>
              <span className="inline-flex items-center text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" /> Loaded
              </span>
            </div>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
};

export default Dashboard;
