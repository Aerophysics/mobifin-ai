import React, { useEffect, useState } from 'react';
import { 
  Droplet, AlertTriangle, CheckCircle, BarChart3, TrendingUp, ShieldAlert,
  Flame, Sparkles, Coins, Wallet
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ApiService from '../services/api';
import { Forecast, LiquidityRecommendations, StressTestScenario, AgentProfile } from '../types';
import { GlassPanel } from '../components/glass/GlassPanel';
import { GlassCard } from '../components/glass/GlassCard';
import { GlassMetric } from '../components/glass/GlassMetric';
import { GlassButton } from '../components/glass/GlassButton';
import { GlassBadge } from '../components/glass/GlassBadge';

const Liquidity: React.FC = () => {
  const [agent, setAgent] = useState<AgentProfile | null>(null);
  const [liquidity, setLiquidity] = useState<LiquidityRecommendations | null>(null);
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [stressTests, setStressTests] = useState<StressTestScenario[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchLiquidityData();
  }, []);

  const fetchLiquidityData = async () => {
    setIsLoading(true);
    try {
      const [agentProfile, liqData, forecastData, stressData] = await Promise.all([
        ApiService.getMe(),
        ApiService.getLiquidityRecommendations(),
        ApiService.getForecast(),
        ApiService.getStressTest()
      ]);
      setAgent(agentProfile);
      setLiquidity(liqData);
      setForecast(forecastData);
      setStressTests(stressData);
    } catch (e) {
      console.error("Failed to load liquidity analytics", e);
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
  const hasShortfall = shortfall > 0;
  const rec = liquidity?.recommendation;

  const chartData = [
    { name: 'Today', 'Projected Demand': forecast ? forecast.predicted_float_demand * 0.85 : 8500, 'Holdings Limit': liquidity?.current_float || 7200 },
    { name: 'Tomorrow (Peak)', 'Projected Demand': forecast?.predicted_float_demand || 11400, 'Holdings Limit': liquidity?.current_float || 7200 },
    { name: 'Day +2', 'Projected Demand': forecast ? forecast.predicted_float_demand * 0.9 : 9200, 'Holdings Limit': liquidity?.current_float || 7200 },
    { name: 'Day +3', 'Projected Demand': forecast ? forecast.predicted_float_demand * 0.95 : 9800, 'Holdings Limit': liquidity?.current_float || 7200 }
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn pb-8">
      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <GlassMetric 
          title="Current Cash"
          value={`GH₵${agent?.cash_balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={Coins}
          iconColorClass="text-emerald-500"
          subtitle="Available for Rebalance"
        />

        <GlassMetric 
          title="Current E-Float"
          value={`GH₵${liquidity?.current_float.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={Wallet}
          iconColorClass="text-sky-500"
          subtitle="Digital Reserves"
        />

        <GlassMetric 
          title="Expected Demand"
          value={`GH₵${forecast?.predicted_float_demand.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={TrendingUp}
          iconColorClass="text-teal-500"
          subtitle="Predicted Tomorrow"
        />

        {/* Projected Shortfall */}
        <GlassPanel className={`p-5 flex items-center justify-between ${
          hasShortfall ? 'border-amber-500/20 bg-amber-500/5' : 'border-emerald-500/20 bg-emerald-500/5'
        }`}>
          <div>
            <span className="text-[10px] text-[var(--mf-text-secondary)] font-bold uppercase tracking-wider block">Projected Shortfall</span>
            <span className={`text-2xl font-bold block mt-1.5 ${
              hasShortfall ? 'text-amber-500' : 'text-emerald-500'
            }`}>
              GH₵{shortfall.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex-shrink-0">
            <GlassBadge variant={hasShortfall ? 'warning' : 'success'}>
              {hasShortfall ? 'Action Required' : 'Sufficient'}
            </GlassBadge>
          </div>
        </GlassPanel>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recommendation & Chart */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI recommendations panel */}
          <GlassPanel className="p-5 space-y-4">
            <div className="flex items-center space-x-2 pb-2.5 border-b border-[var(--mf-border)]">
              <Sparkles className="h-4.5 w-4.5 text-[var(--mf-accent)]" />
              <span className="text-[10px] font-bold text-[var(--mf-accent)] uppercase tracking-widest">Calculated Rebalancing Actions</span>
            </div>
            
            {hasShortfall && rec ? (
              <div className="space-y-4">
                <p className="text-xs text-[var(--mf-text-primary)] leading-relaxed font-semibold">
                  {rec.description}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                  <GlassCard className="p-3">
                    <span className="text-[9px] text-[var(--mf-text-secondary)] font-bold uppercase tracking-wider block">Recommended Amount</span>
                    <span className="text-sm font-extrabold text-[var(--mf-text-primary)] mt-1 block">
                      GH₵{rec.recommended_amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </GlassCard>
                  <GlassCard className="p-3">
                    <span className="text-[9px] text-[var(--mf-text-secondary)] font-bold uppercase tracking-wider block">Operation flow</span>
                    <span className="text-sm font-extrabold text-[var(--mf-text-primary)] mt-1 block">
                      Cash → E-Float
                    </span>
                  </GlassCard>
                  <GlassCard className="p-3">
                    <span className="text-[9px] text-[var(--mf-text-secondary)] font-bold uppercase tracking-wider block">Time threshold</span>
                    <span className="text-sm font-extrabold text-[var(--mf-text-primary)] mt-1 block">
                      Before {rec.recommended_time}
                    </span>
                  </GlassCard>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 space-y-1.5">
                <CheckCircle className="h-8 w-8 text-emerald-500" />
                <p className="font-bold text-sm text-[var(--mf-text-primary)]">Holdings Balanced</p>
                <p className="text-xs text-[var(--mf-text-secondary)]">Current electronic reserves cover all predicted peaks.</p>
              </div>
            )}
          </GlassPanel>

          {/* Forecasting Bar Chart */}
          <GlassPanel className="p-5 space-y-4">
            <h4 className="font-bold text-[var(--mf-text-primary)] text-xs uppercase tracking-wider">Demand vs Holdings Forecast</h4>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--mf-border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'var(--mf-text-secondary)' }} stroke="var(--mf-border)" />
                  <YAxis tick={{ fontSize: 9, fill: 'var(--mf-text-secondary)' }} stroke="var(--mf-border)" />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--mf-surface)', borderColor: 'var(--mf-border)', borderRadius: '10px' }} />
                  <Legend wrapperStyle={{ fontSize: 9 }} />
                  <Bar dataKey="Projected Demand" fill="var(--mf-accent)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Holdings Limit" fill="rgba(255, 255, 255, 0.2)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassPanel>
        </div>

        {/* Right Column: Stress Test */}
        <GlassPanel className="p-5 flex flex-col justify-between">
          <div className="space-y-4">
            <h4 className="font-bold text-[var(--mf-text-primary)] text-xs uppercase tracking-wider flex items-center">
              <Flame className="h-4.5 w-4.5 text-amber-500 mr-1.5" />
              Liquidity Stress-Test Simulator
            </h4>
            <p className="text-xs text-[var(--mf-text-secondary)] leading-relaxed">
              Assess your cash flow boundaries against transaction multipliers.
            </p>
            <div className="space-y-3">
              {stressTests.map(sc => {
                const isCritical = sc.risk_status === 'Critical';
                return (
                  <GlassCard key={sc.stress_level} className="text-xs space-y-1.5 p-3">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[var(--mf-text-primary)]">{sc.stress_level}</span>
                      <GlassBadge variant={isCritical ? 'danger' : 'success'}>
                        {sc.risk_status} Risk
                      </GlassBadge>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-[var(--mf-text-secondary)]">Projected Demand</span>
                      <span className="font-bold text-[var(--mf-text-primary)]">GH₵{sc.stressed_demand.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-[var(--mf-text-secondary)]">Shortfall Gaps</span>
                      <span className={`font-bold ${isCritical ? 'text-rose-500' : 'text-[var(--mf-text-primary)]'}`}>
                        GH₵{sc.projected_shortfall.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
};

export default Liquidity;
