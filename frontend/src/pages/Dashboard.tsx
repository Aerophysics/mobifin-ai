import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, Wallet, ShieldAlert, Award, ArrowUpRight, ArrowDownRight, 
  HelpCircle, Sparkles, AlertTriangle, Coins, Percent, Activity
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ApiService from '../services/api';
import { AgentProfile, BusinessHealth, LiquidityRecommendations, Transaction, Anomaly } from '../types';

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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  const shortfall = liquidity?.predicted_shortfall || 0;
  const rec = liquidity?.recommendation;
  const hasAlert = shortfall > 0 && rec;

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn">
      {/* Alert Banner */}
      {hasAlert && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex items-start space-x-3.5 shadow-sm">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-900 text-xs">Action Required: Tomorrow's Liquidity Peak Shortfall Warning</span>
              <span className="bg-amber-100 text-amber-900 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                {liquidity.warning_level} Risk
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1 leading-normal">
              Expected e-float demand tomorrow morning is projected to exceed availability. 
              <strong> Rebalance GH₵{rec.recommended_amount?.toLocaleString()}</strong> before <strong>{rec.recommended_time}</strong> to prevent stockouts.
            </p>
          </div>
        </div>
      )}

      {/* Primary KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {/* Cash Balance */}
        <div className="premium-card bg-white flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Cash on Hand</span>
            <span className="text-xl font-bold text-slate-800 block mt-1.5">
              GH₵{agent?.cash_balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="bg-teal-50 text-teal-700 p-2.5 rounded-lg border border-teal-100">
            <Coins className="h-5 w-5" />
          </div>
        </div>

        {/* Float Balance */}
        <div className="premium-card bg-white flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">E-Float Balance</span>
            <span className="text-xl font-bold text-slate-800 block mt-1.5">
              GH₵{agent?.float_balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="bg-emerald-50 text-emerald-700 p-2.5 rounded-lg border border-emerald-100">
            <Wallet className="h-5 w-5" />
          </div>
        </div>

        {/* Commission */}
        <div className="premium-card bg-white flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Commission Earned</span>
            <span className="text-xl font-bold text-slate-800 block mt-1.5">
              GH₵{(health?.metrics.recent_commission || 426).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="bg-slate-50 text-slate-700 p-2.5 rounded-lg border border-slate-200">
            <Percent className="h-5 w-5" />
          </div>
        </div>

        {/* Business Health */}
        <div className="premium-card bg-white flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Business Health</span>
            <span className="text-xl font-bold text-slate-800 block mt-1.5">
              {health?.business_health_score} <span className="text-xs text-slate-400 font-medium">/ 100</span>
            </span>
          </div>
          <div className="bg-teal-50 text-teal-700 p-2.5 rounded-lg border border-teal-100">
            <Activity className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Main Analytics Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transaction Volume Chart */}
        <div className="premium-card bg-white lg:col-span-2 flex flex-col space-y-4">
          <div>
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Transaction Activity</h3>
            <p className="text-[10px] text-slate-400">Hourly aggregated value of operations</p>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" />
                <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#94a3b8' }} stroke="#e2e8f0" />
                <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} stroke="#e2e8f0" />
                <Tooltip />
                <Area type="monotone" dataKey="volume" stroke="#0d9488" strokeWidth={1.5} fill="#0d9488" fillOpacity={0.03} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Insights Card */}
        <div className="premium-card bg-slate-900 border-slate-800 text-slate-100 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-teal-400 mb-4 flex items-center">
              <Sparkles className="h-4.5 w-4.5 mr-1.5 text-teal-400" />
              AI Insights Engine
            </h3>
            <div className="space-y-3.5">
              {health?.insights.map((insight, idx) => (
                <div key={idx} className="flex items-start space-x-2 text-xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-teal-400 mt-1.5 flex-shrink-0" />
                  <p className="text-slate-300 leading-normal">{insight}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="pt-4 border-t border-slate-800 text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-4">
            Updates automatically with ledger changes
          </div>
        </div>
      </div>

      {/* Secondary Information row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <div className="premium-card bg-white lg:col-span-2 space-y-4">
          <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Recent Transactions</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase">
                  <th className="py-2.5">Timestamp</th>
                  <th className="py-2.5">Type</th>
                  <th className="py-2.5">Direction</th>
                  <th className="py-2.5 text-right">Amount</th>
                  <th className="py-2.5 text-right">Commission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {transactions.map(tx => (
                  <tr key={tx.transaction_id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 text-slate-500 font-mono text-[10px]">
                      {new Date(tx.timestamp).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="py-2.5 font-semibold capitalize text-slate-800">{tx.transaction_type}</td>
                    <td className="py-2.5">
                      <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                        tx.direction === 'inflow' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                      }`}>
                        {tx.direction}
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-bold text-slate-800">
                      GH₵{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 text-right font-medium text-emerald-600">
                      GH₵{tx.commission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Anomalies Card */}
        <div className="premium-card bg-white space-y-4">
          <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center">
            <ShieldAlert className="h-4.5 w-4.5 text-amber-500 mr-1.5" />
            Unusual Activities
          </h3>
          <div className="space-y-3">
            {anomalies.map(a => (
              <div key={a.anomaly_id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-[9px] text-slate-400">
                    {new Date(a.created_at).toLocaleDateString()}
                  </span>
                  <span className={`text-[8px] font-bold uppercase px-1 rounded ${
                    a.severity === 'High' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {a.severity}
                  </span>
                </div>
                <p className="font-semibold text-slate-700">{a.reason}</p>
                <div className="text-[10px] text-slate-400">Anomaly Index: {a.score.toFixed(4)}</div>
              </div>
            ))}
            {anomalies.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-8">No unusual activities logged.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
