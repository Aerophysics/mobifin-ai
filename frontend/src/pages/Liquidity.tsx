import React, { useEffect, useState } from 'react';
import { 
  CheckCircle, BarChart3, TrendingUp, ShieldAlert,
  Flame, Sparkles, Coins, Wallet, ArrowRight, Info, Users, Phone, Copy, Check, ExternalLink
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ApiService from '../services/api';
import { Forecast, LiquidityRecommendations, StressTestScenario, AgentProfile } from '../types';
import { GlassPanel } from '../components/glass/GlassPanel';
import { GlassCard } from '../components/glass/GlassCard';
import { GlassButton } from '../components/glass/GlassButton';
import { GlassBadge } from '../components/glass/GlassBadge';

interface LiquidityProps {
  setActivePage?: (page: string) => void;
}

const Liquidity: React.FC<LiquidityProps> = ({ setActivePage }) => {
  const [agent, setAgent] = useState<AgentProfile | null>(null);
  const [liquidity, setLiquidity] = useState<LiquidityRecommendations | null>(null);
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [stressTests, setStressTests] = useState<StressTestScenario[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  
  // Interactive Trusted Sources state
  const [revealedContacts, setRevealedContacts] = useState<Record<string, boolean>>({});
  const [copiedName, setCopiedName] = useState<string | null>(null);

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

  const handleRevealContact = (name: string) => {
    setRevealedContacts(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const handleCopyNumber = (phone: string, name: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedName(name);
    setTimeout(() => setCopiedName(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[var(--mf-accent)]"></div>
      </div>
    );
  }

  // Current Position
  const cashOnHand = liquidity?.current_cash ?? agent?.cash_balance ?? 0;
  const floatBalance = liquidity?.current_float ?? agent?.float_balance ?? 0;
  const totalLiquidity = cashOnHand + floatBalance;

  // Forecast values
  const expectedFloatDemand = liquidity?.expected_float_demand ?? 0;
  const expectedCashDemand = liquidity?.expected_cash_demand ?? 0;
  const confidence = liquidity?.forecast_confidence || "Strong historical pattern";
  const isBuildingHistory = confidence === "Building forecast history";

  // Gap / Risk values
  const floatShortfall = liquidity?.predicted_shortfall ?? 0;
  const cashShortfall = liquidity?.predicted_cash_shortfall ?? 0;
  const hasShortfall = floatShortfall > 0 || cashShortfall > 0;
  const rec = liquidity?.recommendation;

  // Liquidity Options
  const MIN_CASH_RESERVE = liquidity?.minimum_cash_reserve ?? 1000.0;
  const internalCashAvailable = Math.max(0, cashOnHand - MIN_CASH_RESERVE);
  const trustedSourcesCount = liquidity?.trusted_sources_count ?? 0;
  // @ts-ignore
  const trustedSources = liquidity?.trusted_sources ?? [];

  const chartData = [
    { 
      name: 'Cash', 
      'Current Holdings': cashOnHand, 
      'Expected Demand': isBuildingHistory ? 0 : expectedCashDemand 
    },
    { 
      name: 'E-Float', 
      'Current Holdings': floatBalance, 
      'Expected Demand': isBuildingHistory ? 0 : expectedFloatDemand 
    }
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fadeIn pb-12 select-none text-white">
      {/* Page Header */}
      <div>
        <h3 className="text-xl font-extrabold text-[var(--mf-text-primary)] tracking-tight">Liquidity Command Center</h3>
        <p className="text-xs text-[var(--mf-text-secondary)] mt-1">Know your position. Predict your needs. Prepare before shortages disrupt your business.</p>
      </div>

      {/* 1. CURRENT POSITION */}
      <GlassPanel className="p-6 space-y-4">
        <div>
          <span className="text-[10px] text-[var(--mf-text-secondary)] font-bold uppercase tracking-widest block">Current Position</span>
          <p className="text-[11px] text-[var(--mf-text-secondary)] mt-0.5">Your cash and digital token positions across this branch.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <GlassCard className="p-4 flex flex-col justify-between space-y-2 border-white/5">
            <div>
              <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest block">Cash on Hand</span>
              <span className="text-xl font-bold text-emerald-400 block mt-1">
                GH₵{cashOnHand.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <span className="text-[9.5px] text-[var(--mf-text-secondary)]">Cash available for customer withdrawals.</span>
          </GlassCard>

          <GlassCard className="p-4 flex flex-col justify-between space-y-2 border-white/5">
            <div>
              <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest block">E-Float Balance</span>
              <span className="text-xl font-bold text-sky-400 block mt-1">
                GH₵{floatBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <span className="text-[9.5px] text-[var(--mf-text-secondary)]">E-float available for digital transactions.</span>
          </GlassCard>

          <GlassCard className="p-4 flex flex-col justify-between space-y-2 bg-white/2 border-dashed border-white/10">
            <div>
              <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest block">Total Available Liquidity</span>
              <span className="text-lg font-bold text-white/70 block mt-1">
                GH₵{totalLiquidity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <span className="text-[9.5px] text-[var(--mf-text-secondary)] text-white/40">Combined branch holdings.</span>
          </GlassCard>
        </div>
      </GlassPanel>

      {/* 2. DEMAND FORECAST & 3. LIQUIDITY RISK */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* DEMAND FORECAST */}
        <GlassPanel className="p-6 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] text-[var(--mf-text-secondary)] font-bold uppercase tracking-widest block">Tomorrow's Forecast</span>
              <p className="text-[11px] text-[var(--mf-text-secondary)] mt-0.5">Predicted demand for tomorrow's operating hours.</p>
            </div>
            <GlassBadge variant={isBuildingHistory ? 'neutral' : 'info'}>
              {confidence}
            </GlassBadge>
          </div>

          {isBuildingHistory ? (
            <div className="bg-white/5 border border-white/5 rounded-2xl p-5 text-center space-y-2">
              <BarChart3 className="h-8 w-8 mx-auto text-sky-400/50" />
              <h5 className="font-bold text-xs text-white">Building forecast history</h5>
              <p className="text-[11px] text-[var(--mf-text-secondary)] leading-relaxed">
                More transaction history is needed before MobiFin can generate a reliable demand forecast.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              <div className="flex justify-between items-center bg-white/5 p-3.5 rounded-xl border border-white/5">
                <div>
                  <span className="text-[9px] font-bold text-white/50 uppercase tracking-wider block">Expected Cash Demand</span>
                  <span className="text-base font-bold text-white mt-1 block">
                    GH₵{expectedCashDemand.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <Coins className="h-5 w-5 text-emerald-500/50" />
              </div>
              
              <div className="flex justify-between items-center bg-white/5 p-3.5 rounded-xl border border-white/5">
                <div>
                  <span className="text-[9px] font-bold text-white/50 uppercase tracking-wider block">Expected E-Float Demand</span>
                  <span className="text-base font-bold text-white mt-1 block">
                    GH₵{expectedFloatDemand.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <Wallet className="h-5 w-5 text-sky-500/50" />
              </div>

              <div className="text-[10.5px] text-[var(--mf-text-secondary)] flex items-start space-x-1.5 pt-1">
                <Info className="h-3.5 w-3.5 text-sky-400 flex-shrink-0 mt-0.5" />
                <span>
                  Based on your recent transaction patterns.
                </span>
              </div>
            </div>
          )}
        </GlassPanel>

        {/* LIQUIDITY RISK / GAP */}
        <GlassPanel className="p-6 space-y-4">
          <div>
            <span className="text-[10px] text-[var(--mf-text-secondary)] font-bold uppercase tracking-widest block">Liquidity Risk</span>
            <p className="text-[11px] text-[var(--mf-text-secondary)] mt-0.5">Potential shortfalls based on predicted demand gaps.</p>
          </div>

          {isBuildingHistory ? (
            <div className="bg-white/5 border border-white/5 rounded-2xl p-5 text-center space-y-2">
              <ShieldAlert className="h-8 w-8 mx-auto text-emerald-400/50" />
              <h5 className="font-bold text-xs text-white">No active liquidity risks</h5>
              <p className="text-[11px] text-[var(--mf-text-secondary)] leading-relaxed">
                Branch operates under default liquidity tracking until forecast history is built.
              </p>
            </div>
          ) : (
            <div className="space-y-4.5">
              {/* E-Float Gap */}
              <div className={`p-4 rounded-xl border ${
                floatShortfall > 0 
                  ? 'border-amber-500/20 bg-amber-500/5 text-amber-200' 
                  : 'border-emerald-500/10 bg-emerald-500/5 text-emerald-200'
              }`}>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider block opacity-70">
                      {floatShortfall > 0 ? '⚠ Potential E-Float Gap' : '✓ E-Float Balance Sufficient'}
                    </span>
                    <span className="text-lg font-bold block mt-1">
                      GH₵{floatShortfall.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <GlassBadge variant={floatShortfall > 0 ? 'warning' : 'success'}>
                    {floatShortfall > 0 ? 'Elevated Risk' : 'Low Risk'}
                  </GlassBadge>
                </div>
                {floatShortfall > 0 && (
                  <p className="text-[10.5px] mt-1.5 opacity-90 leading-relaxed">
                    Expected demand exceeds your current e-float balance.
                  </p>
                )}
              </div>

              {/* Cash Gap */}
              <div className={`p-4 rounded-xl border ${
                cashShortfall > 0 
                  ? 'border-rose-500/20 bg-rose-500/5 text-rose-200' 
                  : 'border-emerald-500/10 bg-emerald-500/5 text-emerald-200'
              }`}>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider block opacity-70">
                      {cashShortfall > 0 ? '⚠ Potential Cash Gap' : '✓ Cash Holdings Sufficient'}
                    </span>
                    <span className="text-lg font-bold block mt-1">
                      GH₵{cashShortfall.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <GlassBadge variant={cashShortfall > 0 ? 'danger' : 'success'}>
                    {cashShortfall > 0 ? 'Elevated Risk' : 'Low Risk'}
                  </GlassBadge>
                </div>
                {cashShortfall > 0 && (
                  <p className="text-[10.5px] mt-1.5 opacity-90 leading-relaxed">
                    Expected cash withdrawals tomorrow exceed your cash holdings.
                  </p>
                )}
              </div>
            </div>
          )}
        </GlassPanel>
      </div>

      {/* LIQUIDITY OPTIONS */}
      <GlassPanel className="p-6 space-y-4">
        <div>
          <span className="text-[10px] text-[var(--mf-text-secondary)] font-bold uppercase tracking-widest block">Liquidity Options</span>
          <p className="text-[11px] text-[var(--mf-text-secondary)] mt-0.5">Your registered internal reserves and trusted network availability.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <GlassCard className="p-4 flex items-center justify-between border-white/5">
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest block">Internal cash available</span>
              <span className="text-base font-extrabold text-white">
                GH₵{internalCashAvailable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <p className="text-[9.5px] text-[var(--mf-text-secondary)]">Available cash above the GH₵{MIN_CASH_RESERVE.toLocaleString()} reserve boundary.</p>
            </div>
            <Coins className="h-7 w-7 text-emerald-400 opacity-60" />
          </GlassCard>

          <GlassCard className="p-4 flex items-center justify-between border-white/5">
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest block">Trusted sources</span>
              <span className="text-base font-extrabold text-white">
                {trustedSourcesCount} saved sources
              </span>
              <p className="text-[9.5px] text-[var(--mf-text-secondary)]">Private network relationships available for rebalancing.</p>
            </div>
            <Users className="h-7 w-7 text-sky-400 opacity-60" />
          </GlassCard>
        </div>
      </GlassPanel>

      {/* 4. AI ACTION / REBALANCING */}
      <GlassPanel className="p-6 relative border-[var(--mf-accent)] bg-[var(--mf-accent)]/5 shadow-[var(--mf-accent)]/5 shadow-2xl">
        <div className="absolute top-4 right-6 flex items-center space-x-2">
          <Sparkles className="h-4.5 w-4.5 text-[var(--mf-accent)] animate-pulse" />
          <span className="text-[9px] font-bold text-[var(--mf-accent)] uppercase tracking-widest">AI Action recommendation</span>
        </div>

        <div className="space-y-4 max-w-xl">
          <div>
            <h4 className="text-base font-extrabold text-white tracking-tight">AI Recommendation</h4>
            <p className="text-xs text-[var(--mf-text-secondary)] mt-0.5">Optimized asset rebalancing based on predicted peak transactional hours.</p>
          </div>

          {isBuildingHistory ? (
            <div className="py-4 text-xs text-[var(--mf-text-secondary)] leading-relaxed">
              MobiFin is waiting for sufficient history. No automatic rebalancing actions can be generated yet.
            </div>
          ) : hasShortfall && rec ? (
            <div className="space-y-4">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-3 py-1.5 rounded-full font-bold uppercase tracking-wider">
                    Rebalance GH₵{rec.recommended_amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <ArrowRight className="h-4 w-4 text-white/50" />
                  <div className="bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs px-3 py-1.5 rounded-full font-bold uppercase tracking-wider">
                    Cash → E-Float
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest block">Timing Boundary</span>
                    <span className="font-bold text-white mt-1 block">Recommended before {rec.recommended_time}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest block">Reasoning Trigger</span>
                    <span className="font-semibold text-white/85 mt-1 block leading-relaxed">
                      Expected demand exceeds current e-float balance.
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-[var(--mf-text-secondary)] leading-relaxed border-t border-white/5 pt-3">
                  {rec.description}
                </p>
              </div>

              {/* Surface specific trusted sources contact cards if available */}
              {trustedSources.length > 0 && (
                <div className="space-y-2 border-t border-white/5 pt-3">
                  <span className="text-[9.5px] font-bold text-white/50 uppercase tracking-widest block mb-1">Your saved trusted contacts:</span>
                  <div className="space-y-2">
                    {trustedSources.map((src: any) => {
                      const isRevealed = revealedContacts[src.name];
                      const isCopied = copiedName === src.name;
                      return (
                        <div key={src.name} className="flex justify-between items-center bg-white/2 border border-white/5 p-3 rounded-xl text-xs">
                          <div>
                            <span className="font-bold text-white block">{src.name}</span>
                            <span className="text-[10px] text-white/50">{src.location} • {src.type}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            {isRevealed && (
                              <span className="font-mono text-emerald-400 mr-2">{src.phone}</span>
                            )}
                            
                            <GlassButton 
                              onClick={() => handleRevealContact(src.name)}
                              className="px-2.5 py-1 text-[10px] uppercase font-bold"
                            >
                              {isRevealed ? 'Hide' : 'View Contact'}
                            </GlassButton>
                            
                            {isRevealed && (
                              <GlassButton
                                onClick={() => handleCopyNumber(src.phone, src.name)}
                                className={`px-2 py-1 text-[10px] flex items-center space-x-1 ${
                                  isCopied ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20' : ''
                                }`}
                              >
                                {isCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                <span>{isCopied ? 'Copied' : 'Copy'}</span>
                              </GlassButton>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-3.5 pt-2">
                <GlassButton 
                  onClick={() => setShowExplanation(!showExplanation)}
                  className="px-4 py-2 font-bold text-xs uppercase tracking-wider border-white/10"
                >
                  <span>{showExplanation ? "Hide Explanation" : "Why am I seeing this?"}</span>
                </GlassButton>

                {setActivePage && (
                  <GlassButton 
                    onClick={() => setActivePage('trusted-sources')}
                    className="px-4 py-2 font-bold text-xs uppercase tracking-wider border-white/10 hover:border-emerald-500 text-sky-400 hover:text-sky-300"
                  >
                    <span>Manage Trusted Sources</span>
                  </GlassButton>
                )}
              </div>

              {showExplanation && (
                <div className="bg-white/5 border border-white/5 rounded-2xl p-4 text-[11px] text-[var(--mf-text-secondary)] leading-relaxed space-y-2">
                  <span className="font-bold text-white block">Explanation Analysis:</span>
                  <p>
                    Based on your recent transaction patterns on similar days of the week, e-float digital cash-out transactions typically spike during the morning hours.
                  </p>
                  <p>
                    MobiFin calculates this rebalancing target dynamically to ensure you maintain a cash holding above your minimum operational reserve boundary of GH₵{MIN_CASH_RESERVE.toLocaleString()}.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 flex items-start space-x-3 text-xs text-emerald-200">
              <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">No rebalancing required</span>
                <span className="opacity-90 block mt-0.5 leading-relaxed">
                  Your current holdings are perfectly aligned to meet predicted transaction patterns for tomorrow.
                </span>
              </div>
            </div>
          )}
        </div>
      </GlassPanel>

      {/* 5. VISUALIZATION & 6. STRESS TEST */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Chart */}
        <GlassPanel className="p-6 space-y-4 md:col-span-2">
          <div>
            <span className="text-[10px] text-[var(--mf-text-secondary)] font-bold uppercase tracking-widest block">Demand vs Holdings</span>
            <p className="text-[11px] text-[var(--mf-text-secondary)] mt-0.5">Comparison of current assets against forecasted requirements.</p>
          </div>

          <div className="h-64 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                <XAxis dataKey="name" stroke="rgba(255, 255, 255, 0.4)" tick={{ fontSize: 10 }} />
                <YAxis stroke="rgba(255, 255, 255, 0.4)" tick={{ fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255, 255, 255, 0.1)', color: 'white', borderRadius: '12px', fontSize: '11px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
                <Bar dataKey="Current Holdings" fill="var(--mf-accent)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Expected Demand" fill="rgba(255, 255, 255, 0.2)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassPanel>

        {/* Stress test */}
        <GlassPanel className="p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <span className="text-[10px] text-[var(--mf-text-secondary)] font-bold uppercase tracking-widest block">Stress-Test Simulator</span>
              <p className="text-[11px] text-[var(--mf-text-secondary)] mt-0.5">Asset gap analysis under simulated transaction surges.</p>
            </div>

            {isBuildingHistory ? (
              <div className="bg-white/5 border border-white/5 rounded-2xl p-4 text-center text-[10px] text-[var(--mf-text-secondary)] leading-relaxed">
                Simulator waiting for baseline forecast data.
              </div>
            ) : (
              <div className="space-y-2.5">
                {stressTests.map(sc => {
                  const isCritical = sc.risk_status === 'Critical';
                  return (
                    <GlassCard key={sc.stress_level} className="text-xs space-y-1.5 p-3 text-white border-white/5">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-white/90">{sc.stress_level}</span>
                        <GlassBadge variant={isCritical ? 'danger' : 'success'}>
                          {sc.risk_status}
                        </GlassBadge>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-[var(--mf-text-secondary)]">Demand Target</span>
                        <span className="font-bold text-white">GH₵{sc.stressed_demand.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-[var(--mf-text-secondary)]">Potential Gap</span>
                        <span className={`font-bold ${isCritical ? 'text-rose-400' : 'text-white'}`}>
                          GH₵{sc.projected_shortfall.toLocaleString()}
                        </span>
                      </div>
                    </GlassCard>
                  );
                })}
              </div>
            )}
          </div>
        </GlassPanel>
      </div>
    </div>
  );
};

export default Liquidity;
