import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, Wallet, ShieldAlert, Award, ArrowUpRight, ArrowDownRight, 
  HelpCircle, Sparkles, AlertTriangle, Coins, Percent, Activity, ArrowRight
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ApiService from '../services/api';
import { AgentProfile, BusinessHealth, LiquidityRecommendations, Transaction, Anomaly } from '../types';
import { GlassPanel } from '../components/glass/GlassPanel';
import { GlassCard } from '../components/glass/GlassCard';
import { GlassMetric } from '../components/glass/GlassMetric';
import { GlassButton } from '../components/glass/GlassButton';
import { GlassBadge } from '../components/glass/GlassBadge';

const Dashboard: React.FC = () => {
  const [agent, setAgent] = useState<AgentProfile | null>(null);
  const [health, setHealth] = useState<BusinessHealth | null>(null);
  const [liquidity, setLiquidity] = useState<LiquidityRecommendations | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const user = ApiService.getCurrentUser();
      const targetAgentId = user && user.role === 'AGENT' ? undefined : 1;

      const [agentProfile, healthData, liqData, txPaged, anomalyData] = await Promise.all([
        targetAgentId ? ApiService.getAgentProfile(targetAgentId) : ApiService.getMe(),
        ApiService.getBusinessHealth(targetAgentId),
        ApiService.getLiquidityRecommendations(targetAgentId),
        ApiService.listTransactions({ agent_id: targetAgentId || undefined, page_size: 6 }),
        ApiService.listAnomalies(targetAgentId || 1)
      ]);

      setAgent(agentProfile);
      setHealth(healthData);
      setLiquidity(liqData);
      setTransactions(txPaged.transactions);
      setAnomalies(anomalyData.slice(0, 5));

      // Hourly volumes
      setChartData([
        { time: '08:00', volume: 1200 },
        { time: '10:00', volume: 2400 },
        { time: '12:00', volume: 4500 },
        { time: '14:00', volume: 3800 },
        { time: '16:00', volume: 6200 },
        { time: '18:00', volume: 2900 },
        { time: '20:00', volume: 1500 }
      ]);
    } catch (e) {
      console.error("Dashboard load failed", e);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[var(--mf-accent)]"></div>
      </div>
    );
  }

  const shortfall = liquidity?.predicted_shortfall || 0;
  const rec = liquidity?.recommendation;
  const hasAlert = shortfall > 0 && rec;

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn pb-8">
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
              <strong> Rebalance GH₵{rec.recommended_amount?.toLocaleString()}</strong> before <strong>{rec.recommended_time}</strong> to prevent stockouts.
            </p>
          </div>
        </div>
      )}

      {/* Hero overview panel */}
      <GlassPanel className="p-6 relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-2">
          <span className="text-[10px] text-[var(--mf-text-secondary)] font-bold uppercase tracking-widest block">
            Financial Command Center
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--mf-text-primary)] leading-tight tracking-tight uppercase">
            Good Morning, {agent?.name || 'Kwame'}
          </h2>
          <p className="text-xs text-[var(--mf-text-secondary)] max-w-xl leading-relaxed">
            Your platform is fully synchronized. Analytics engines indicate operational liquidity levels are stable and credit risks are low.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="flex flex-col bg-white/5 border border-white/5 rounded-2xl px-4 py-3 min-w-[110px]">
            <span className="text-[9px] text-[var(--mf-text-secondary)] font-bold uppercase tracking-wider">
              Business Health
            </span>
            <span className="text-xl font-bold text-[var(--mf-text-primary)] mt-1 flex items-center">
              {health?.business_health_score || 87}
              <span className="text-[10px] text-emerald-500 font-bold ml-1.5">Stable</span>
            </span>
          </div>

          <div className="flex flex-col bg-white/5 border border-white/5 rounded-2xl px-4 py-3 min-w-[110px]">
            <span className="text-[9px] text-[var(--mf-text-secondary)] font-bold uppercase tracking-wider">
              Liquidity Status
            </span>
            <span className="text-xl font-bold text-[var(--mf-text-primary)] mt-1 flex items-center">
              Stable
            </span>
          </div>

          <div className="flex flex-col bg-white/5 border border-white/5 rounded-2xl px-4 py-3 min-w-[110px]">
            <span className="text-[9px] text-[var(--mf-text-secondary)] font-bold uppercase tracking-wider">
              Next Demand Peak
            </span>
            <span className="text-xl font-bold text-[var(--mf-text-primary)] mt-1 flex items-center">
              GH₵{liquidity?.expected_float_demand ? liquidity.expected_float_demand.toLocaleString() : '11,400'}
            </span>
          </div>
        </div>
      </GlassPanel>

      {/* Primary KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <GlassMetric 
          title="Cash on Hand"
          value={`GH₵${agent?.cash_balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={Coins}
          iconColorClass="text-emerald-500"
          trend={{ value: 'Normal', isPositive: true }}
        />

        <GlassMetric 
          title="E-Float Balance"
          value={`GH₵${agent?.float_balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={Wallet}
          iconColorClass="text-sky-500"
          trend={{ value: 'Stable', isPositive: true }}
        />

        <GlassMetric 
          title="Commission Earned"
          value={`GH₵${(health?.metrics.recent_commission || 426).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={Percent}
          iconColorClass="text-amber-500"
          trend={{ value: '+4.2%', isPositive: true }}
        />

        <GlassMetric 
          title="Business Health"
          value={`${health?.business_health_score} / 100`}
          icon={Activity}
          iconColorClass="text-teal-500"
          trend={{ value: 'Top 10%', isPositive: true }}
        />
      </div>

      {/* Main Analytics Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transaction Volume Chart */}
        <GlassPanel className="lg:col-span-2 p-5 flex flex-col space-y-4">
          <div>
            <h3 className="font-bold text-[var(--mf-text-primary)] text-xs uppercase tracking-wider">Transaction Activity</h3>
            <p className="text-[10px] text-[var(--mf-text-secondary)]">Hourly aggregated value of operations</p>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--mf-accent)" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="var(--mf-accent)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--mf-border)" />
                <XAxis dataKey="time" tick={{ fontSize: 9, fill: 'var(--mf-text-secondary)' }} stroke="var(--mf-border)" />
                <YAxis tick={{ fontSize: 9, fill: 'var(--mf-text-secondary)' }} stroke="var(--mf-border)" />
                <Tooltip contentStyle={{ backgroundColor: 'var(--mf-surface)', borderColor: 'var(--mf-border)', borderRadius: '10px' }} />
                <Area type="monotone" dataKey="volume" stroke="var(--mf-accent)" strokeWidth={2} fill="url(#colorVolume)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassPanel>

        {/* AI Action / Insights Stack */}
        <div className="flex flex-col gap-6">
          {/* AI Action Recommended */}
          {rec && (
            <GlassPanel className="p-5 flex flex-col justify-between border-amber-500/20 bg-amber-500/5">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-amber-500 font-bold uppercase tracking-widest block">
                    AI Action Recommended
                  </span>
                  <GlassBadge variant="warning">Rebalance</GlassBadge>
                </div>
                <div className="space-y-1">
                  <h4 className="text-xl font-extrabold text-[var(--mf-text-primary)]">
                    Rebalance GH₵{rec.recommended_amount?.toLocaleString()}
                  </h4>
                  <p className="text-[11px] text-[var(--mf-text-secondary)]">
                    before <strong className="text-[var(--mf-text-primary)]">{rec.recommended_time}</strong>
                  </p>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-xl p-3 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-[var(--mf-text-secondary)]">Move:</span>
                    <span className="font-bold text-[var(--mf-text-primary)]">Cash → E-Float</span>
                  </div>
                  <div className="border-t border-white/5 my-1.5" />
                  <p className="text-[10px] text-[var(--mf-text-secondary)] leading-normal">
                    <strong>Reason:</strong> Expected e-float demand tomorrow morning exceeds current float by GH₵{shortfall.toLocaleString()}.
                  </p>
                </div>
              </div>
              <GlassButton variant="primary" className="w-full mt-4 bg-amber-500 text-slate-950 hover:bg-amber-600 border-none font-bold">
                Review Recommendation
              </GlassButton>
            </GlassPanel>
          )}

          {/* AI Insights Card */}
          <GlassPanel className="p-5 flex-1 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wider text-[var(--mf-accent)] mb-4 flex items-center">
                <Sparkles className="h-4.5 w-4.5 mr-1.5 text-[var(--mf-accent)]" />
                AI Insights Engine
              </h3>
              <div className="space-y-3.5">
                {health?.insights.map((insight, idx) => (
                  <div key={idx} className="flex items-start space-x-2 text-xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--mf-accent)] mt-1.5 flex-shrink-0" />
                    <p className="text-[var(--mf-text-secondary)] leading-normal">{insight}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-4 border-t border-[var(--mf-border)] text-[9px] text-[var(--mf-text-secondary)] font-bold uppercase tracking-wider mt-4">
              Updates automatically with ledger changes
            </div>
          </GlassPanel>
        </div>
      </div>

      {/* Secondary Information row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <GlassPanel className="p-5 lg:col-span-2 space-y-4">
          <h3 className="font-bold text-[var(--mf-text-primary)] text-xs uppercase tracking-wider">Recent Transactions</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--mf-border)] text-[var(--mf-text-secondary)] font-semibold uppercase">
                  <th className="py-2.5">Timestamp</th>
                  <th className="py-2.5">Type</th>
                  <th className="py-2.5">Direction</th>
                  <th className="py-2.5 text-right">Amount</th>
                  <th className="py-2.5 text-right">Commission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--mf-border)] text-[var(--mf-text-primary)]">
                {transactions.map(tx => (
                  <tr key={tx.transaction_id} className="hover:bg-white/5 transition-colors">
                    <td className="py-2.5 text-[var(--mf-text-secondary)] font-mono text-[10px]">
                      {new Date(tx.timestamp).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="py-2.5 font-semibold capitalize">{tx.transaction_type}</td>
                    <td className="py-2.5">
                      <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                        tx.direction === 'inflow' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                      }`}>
                        {tx.direction}
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-bold">
                      GH₵{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 text-right font-semibold text-emerald-500">
                      GH₵{tx.commission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassPanel>

        {/* Recent Anomalies Card */}
        <GlassPanel className="p-5 space-y-4">
          <h3 className="font-bold text-[var(--mf-text-primary)] text-xs uppercase tracking-wider flex items-center">
            <ShieldAlert className="h-4.5 w-4.5 text-amber-500 mr-1.5" />
            Unusual Activities
          </h3>
          <div className="space-y-3">
            {anomalies.map(a => (
              <GlassCard key={a.anomaly_id} className="text-xs space-y-1 p-3">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-[9px] text-[var(--mf-text-secondary)]">
                    {new Date(a.created_at).toLocaleDateString()}
                  </span>
                  <GlassBadge variant={a.severity === 'High' ? 'danger' : 'warning'}>
                    {a.severity}
                  </GlassBadge>
                </div>
                <p className="font-semibold text-[var(--mf-text-primary)]">{a.reason}</p>
                <div className="text-[10px] text-[var(--mf-text-secondary)]">Anomaly Index: {a.score.toFixed(4)}</div>
              </GlassCard>
            ))}
            {anomalies.length === 0 && (
              <p className="text-xs text-[var(--mf-text-secondary)] text-center py-8">No unusual activities logged.</p>
            )}
          </div>
        </GlassPanel>
      </div>
    </div>
  );
};

export default Dashboard;
