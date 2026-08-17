import React, { useEffect, useState } from 'react';
import { 
  Droplet, AlertTriangle, CheckCircle, BarChart3, TrendingUp, ShieldAlert,
  Calendar, Flame, Sparkles, Coins, Wallet
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import ApiService from '../services/api';
import { Forecast, LiquidityRecommendations, StressTestScenario, AgentProfile } from '../types';

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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600"></div>
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
    <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn">
      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {/* Cash Balance */}
        <div className="premium-card bg-white flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Current Cash</span>
            <span className="text-xl font-bold text-slate-800 block mt-1.5">
              GH₵{agent?.cash_balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider pt-2.5 border-t border-slate-100 mt-3 flex items-center">
            <Coins className="h-3.5 w-3.5 text-slate-400 mr-1 flex-shrink-0" /> Available for Rebalance
          </div>
        </div>

        {/* E-Float Balance */}
        <div className="premium-card bg-white flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Current E-Float</span>
            <span className="text-xl font-bold text-slate-800 block mt-1.5">
              GH₵{liquidity?.current_float.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider pt-2.5 border-t border-slate-100 mt-3 flex items-center">
            <Wallet className="h-3.5 w-3.5 text-slate-400 mr-1 flex-shrink-0" /> Digital Reserves
          </div>
        </div>

        {/* Expected Demand */}
        <div className="premium-card bg-white flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Expected Demand</span>
            <span className="text-xl font-bold text-slate-800 block mt-1.5">
              GH₵{forecast?.predicted_float_demand.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider pt-2.5 border-t border-slate-100 mt-3 flex items-center">
            <TrendingUp className="h-3.5 w-3.5 text-teal-600 mr-1 flex-shrink-0" /> Predicted Tomorrow
          </div>
        </div>

        {/* Projected Shortfall */}
        <div className={`premium-card flex flex-col justify-between ${
          hasShortfall ? 'bg-amber-50 border-amber-250' : 'bg-emerald-50 border-emerald-250'
        }`}>
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Projected Shortfall</span>
            <span className={`text-xl font-extrabold block mt-1.5 ${
              hasShortfall ? 'text-amber-700' : 'text-emerald-700'
            }`}>
              GH₵{shortfall.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="text-[9px] font-bold uppercase tracking-wider pt-2.5 border-t mt-3 flex items-center border-slate-200">
            {hasShortfall ? (
              <span className="text-amber-700">Actions required</span>
            ) : (
              <span className="text-emerald-700">Holdings sufficient</span>
            )}
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recommendation & Chart */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI recommendations panel */}
          <div className="premium-card bg-slate-900 border-slate-800 text-slate-100 space-y-4">
            <div className="flex items-center space-x-2 pb-2.5 border-b border-slate-800">
              <Sparkles className="h-4.5 w-4.5 text-teal-400" />
              <span className="text-[10px] font-bold text-teal-400 uppercase tracking-widest">Calculated Rebalancing Actions</span>
            </div>
            
            {hasShortfall && rec ? (
              <div className="space-y-4">
                <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                  {rec.description}
                </p>
                <div className="grid grid-cols-3 gap-4 pt-1">
                  <div className="bg-slate-850 p-3 rounded-lg border border-slate-800">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Recommended Amount</span>
                    <span className="text-sm font-extrabold text-white mt-1 block">
                      GH₵{rec.recommended_amount?.toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-slate-850 p-3 rounded-lg border border-slate-800">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Operation flow</span>
                    <span className="text-sm font-extrabold text-white mt-1 block">
                      Cash → E-Float
                    </span>
                  </div>
                  <div className="bg-slate-850 p-3 rounded-lg border border-slate-800">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Time threshold</span>
                    <span className="text-sm font-extrabold text-white mt-1 block">
                      Before {rec.recommended_time}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 space-y-1.5">
                <CheckCircle className="h-8 w-8 text-teal-400" />
                <p className="font-bold text-sm text-white">Holdings Balanced</p>
                <p className="text-xs text-slate-400">Current electronic reserves cover all predicted transaction peaks.</p>
              </div>
            )}
          </div>

          {/* Forecasting Bar Chart */}
          <div className="premium-card bg-white space-y-4">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Demand vs Holdings Forecast</h4>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8' }} stroke="#e2e8f0" />
                  <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} stroke="#e2e8f0" />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 9 }} />
                  <Bar dataKey="Projected Demand" fill="#0d9488" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Holdings Limit" fill="#cbd5e1" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column: Stress Test */}
        <div className="premium-card bg-white flex flex-col justify-between">
          <div className="space-y-4">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center">
              <Flame className="h-4.5 w-4.5 text-amber-500 mr-1.5" />
              Liquidity Stress-Test Simulator
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Assess your cash flow boundaries against transaction multipliers.
            </p>
            <div className="space-y-3">
              {stressTests.map(sc => {
                const isCritical = sc.risk_status === 'Critical';
                return (
                  <div key={sc.stress_level} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-700">{sc.stress_level}</span>
                      <span className={`text-[8px] font-extrabold uppercase px-1.5 rounded ${
                        isCritical ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {sc.risk_status} Risk
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-400">Projected Demand</span>
                      <span className="font-bold text-slate-700">GH₵{sc.stressed_demand.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-400">Shortfall Gaps</span>
                      <span className={`font-bold ${isCritical ? 'text-red-600' : 'text-slate-700'}`}>
                        GH₵{sc.projected_shortfall.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Liquidity;
