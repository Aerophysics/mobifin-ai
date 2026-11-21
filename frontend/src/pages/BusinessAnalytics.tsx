import React, { useEffect, useState } from 'react';
import {
  AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Activity, Coins, TrendingUp, Receipt, LineChart as LineIcon, PieChart as PieIcon, Globe2 } from 'lucide-react';
import ApiService, { VolumeByMonth } from '../services/api';
import { BusinessHealth } from '../types';
import { GlassMetric } from '../components/glass/GlassMetric';
import { SectionCard, ProgressRow, LoadingBlock, fmtGHS, fmtCompactGHS, monthLabel } from '../components/dash/DashKit';

// One fixed colour per transaction type (same family as the overview's monthly chart)
const TYPE_STYLE: Record<string, { label: string; color: string }> = {
  deposit: { label: 'Cash deposits', color: 'var(--mf-chart-1)' },
  withdrawal: { label: 'Cash withdrawals', color: 'var(--mf-chart-2)' },
  transfer: { label: 'Transfers', color: 'var(--mf-chart-3)' },
  bill_payment: { label: 'Bill payments', color: 'var(--mf-chart-4)' },
  merchant_payment: { label: 'Merchant payments', color: '#c9713f' },
  airtime: { label: 'Airtime top-ups', color: '#7c6fd6' },
};

type Region = { region: string; city: string | null; volume: number; transaction_count: number; agent_count: number; share: number };

const BusinessAnalytics: React.FC = () => {
  const [health, setHealth] = useState<BusinessHealth | null>(null);
  const [volume, setVolume] = useState<VolumeByMonth | null>(null);
  const [regions, setRegions] = useState<Region[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isAgent = ApiService.getCurrentUser()?.role === 'AGENT';

  useEffect(() => {
    (async () => {
      const [h, v, r] = await Promise.all([
        ApiService.getBusinessHealth().catch(() => null),
        ApiService.getVolumeByMonth(6).catch(() => null),
        ApiService.getRegionalActivity().catch(() => null),
      ]);
      setHealth(h); setVolume(v); setRegions(r?.regions || []);
      setIsLoading(false);
    })();
  }, []);

  if (isLoading) return <LoadingBlock />;

  const m = health?.metrics;
  const months = volume?.months || [];
  const mix = volume?.by_type || [];
  const mixTotal = mix.reduce((a, d) => a + d.value, 0);
  const txCount = months.reduce((a, x) => a + x.transaction_count, 0);
  const trend = months.map(x => ({ label: monthLabel(x.month), month: x.month, total: x.total, count: x.transaction_count }));
  const maxRegion = Math.max(1, ...regions.map(r => r.volume));

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        <GlassMetric title="Volume, last 14 days" icon={Activity} value={fmtGHS(m?.recent_volume ?? 0)} subtitle={isAgent ? 'Processed at this branch' : 'Reference branch'} />
        <GlassMetric title="Commission, last 14 days" icon={Coins} value={fmtGHS(m?.recent_commission ?? 0, { decimals: 2 })} subtitle="Earned on transactions" />
        <GlassMetric
          title="Volume growth score"
          icon={TrendingUp}
          value={`${Math.round(m?.volume_growth ?? 0)} / 100`}
          trend={{ value: (m?.volume_growth ?? 0) >= 60 ? 'Growing' : 'Slowing', isPositive: (m?.volume_growth ?? 0) >= 60 }}
          subtitle="Week over week"
        />
        <GlassMetric title="Transactions, 6 months" icon={Receipt} value={txCount.toLocaleString()} subtitle={isAgent ? 'At this branch' : 'Across the network'} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-5">
        <SectionCard title="Monthly transaction value" icon={LineIcon}>
          {trend.length ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
                  <defs>
                    <linearGradient id="mfArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--mf-chart-1)" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="var(--mf-chart-1)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="var(--mf-chart-grid)" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: 'var(--mf-text-secondary)' }} dy={8} />
                  <YAxis axisLine={false} tickLine={false} width={64} tick={{ fontSize: 12, fill: 'var(--mf-text-muted)' }} tickFormatter={fmtCompactGHS} />
                  <Tooltip
                    formatter={(v: any, _n: any, item: any) => [`${fmtGHS(Number(v))} · ${item.payload.count.toLocaleString()} transactions`, monthLabel(item.payload.month, true)]}
                    labelFormatter={() => ''}
                  />
                  <Area type="monotone" dataKey="total" stroke="var(--mf-chart-1)" strokeWidth={2.5} fill="url(#mfArea)" dot={{ r: 4, fill: 'var(--mf-surface)', stroke: 'var(--mf-chart-1)', strokeWidth: 2 }} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-[14px] text-[var(--mf-text-secondary)]">No transactions in the last 6 months.</p>
          )}
        </SectionCard>

        <SectionCard title="Transaction mix" icon={PieIcon}>
          {mix.length === 0 ? (
            <p className="text-[14px] text-[var(--mf-text-secondary)]">No transactions in the last 6 months.</p>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative h-56 w-56 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={mix} dataKey="value" nameKey="type" innerRadius={68} outerRadius={100} paddingAngle={2} stroke="var(--mf-surface)" strokeWidth={2} isAnimationActive={false}>
                      {mix.map(d => <Cell key={d.type} fill={TYPE_STYLE[d.type]?.color || 'var(--mf-text-muted)'} />)}
                    </Pie>
                    <Tooltip formatter={(v: any, _n: any, item: any) => [`${fmtGHS(Number(v))} · ${item.payload.share}%`, TYPE_STYLE[item.payload.type]?.label || item.payload.type]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[12px] text-[var(--mf-text-secondary)]">6-month total</span>
                  <span className="mf-display text-[20px] font-semibold">{fmtCompactGHS(mixTotal)}</span>
                </div>
              </div>
              <ul className="flex-1 w-full">
                {mix.map(d => (
                  <li key={d.type} className="flex items-center gap-3 text-[14px] py-2 border-t border-[var(--mf-border)] first:border-t-0">
                    <span className="h-3 w-3 rounded-[3px] flex-shrink-0" style={{ background: TYPE_STYLE[d.type]?.color || 'var(--mf-text-muted)' }} />
                    <span className="flex-1">{TYPE_STYLE[d.type]?.label || d.type}</span>
                    <span className="mf-tabular text-[var(--mf-text-secondary)] hidden sm:inline">{fmtGHS(d.value)}</span>
                    <span className="mf-tabular font-semibold w-14 text-right">{d.share}%</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </SectionCard>
      </div>

      <SectionCard title="Network activity by region" icon={Globe2}>
        {regions.length === 0 ? (
          <p className="text-[14px] text-[var(--mf-text-secondary)]">No regional activity yet.</p>
        ) : (
          <>
            {regions.map(r => (
              <ProgressRow
                key={`${r.region}-${r.city}`}
                label={r.city ? `${r.region} · ${r.city}` : r.region}
                value={(r.volume / maxRegion) * 100}
                valueText={`${fmtGHS(r.volume)} · ${r.transaction_count.toLocaleString()} txns`}
                chipText={`${r.share}%`}
                tone="success"
              />
            ))}
            <p className="text-[13px] text-[var(--mf-text-secondary)] mt-3 pt-3 border-t border-[var(--mf-border)]">
              Aggregated across all agent branches. Location is never used in credit scoring.
            </p>
          </>
        )}
      </SectionCard>
    </div>
  );
};

export default BusinessAnalytics;
