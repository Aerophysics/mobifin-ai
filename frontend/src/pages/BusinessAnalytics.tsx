import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, Percent, ArrowUpRight, CheckSquare, 
  DollarSign, Globe2, Activity 
} from 'lucide-react';
import ApiService from '../services/api';
import { BusinessHealth } from '../types';
import { GlassPanel } from '../components/glass/GlassPanel';
import { GlassCard } from '../components/glass/GlassCard';
import { GlassMetric } from '../components/glass/GlassMetric';
import { GlassTable } from '../components/glass/GlassTable';

// High-contrast color palette for visual readability
// One fixed colour per transaction type (same family as the overview's monthly chart)
const TYPE_STYLE: Record<string, { label: string; color: string }> = {
  deposit: { label: 'Cash deposits', color: 'var(--mf-chart-1)' },
  withdrawal: { label: 'Cash withdrawals', color: 'var(--mf-chart-2)' },
  transfer: { label: 'Transfers', color: 'var(--mf-chart-3)' },
  bill_payment: { label: 'Bill payments', color: 'var(--mf-chart-4)' },
  merchant_payment: { label: 'Merchant payments', color: '#c9713f' },
  airtime: { label: 'Airtime top-ups', color: '#7c6fd6' },
};

const BusinessAnalytics: React.FC = () => {
  const [health, setHealth] = useState<BusinessHealth | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Seeded graphical metrics
  const commissionTrend = [
    { name: 'Mon', Commission: 120 },
    { name: 'Tue', Commission: 150 },
    { name: 'Wed', Commission: 180 },
    { name: 'Thu', Commission: 140 },
    { name: 'Fri', Commission: 280 },
    { name: 'Sat', Commission: 210 },
    { name: 'Sun', Commission: 95 }
  ];

  const [typeDistribution, setTypeDistribution] = useState<{ type: string; value: number; count: number; share: number }[]>([]);

  const regionalActivity = [
    { location: 'Greater Accra', 'Tx Volume': 185000, 'Tx Count': 1240 },
    { location: 'Ashanti Region', 'Tx Volume': 142000, 'Tx Count': 980 },
    { location: 'Western Region', 'Tx Volume': 68000, 'Tx Count': 450 },
    { location: 'Northern Region', 'Tx Volume': 42000, 'Tx Count': 290 },
    { location: 'Volta Region', 'Tx Volume': 35000, 'Tx Count': 210 }
  ];

  useEffect(() => {
    fetchHealthData();
  }, []);

  const fetchHealthData = async () => {
    try {
      const [res, vol] = await Promise.all([
        ApiService.getBusinessHealth(),
        ApiService.getVolumeByMonth(6).catch(() => null),
      ]);
      setHealth(res);
      setTypeDistribution(vol?.by_type || []);
    } catch (e) {
      console.error(e);
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

  const metrics = health?.metrics;

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <GlassMetric 
          title="Total 14d Volume"
          value={`GH₵${metrics?.recent_volume.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          icon={Activity}
          iconColorClass="text-sky-500"
          subtitle="Aggregate cashflow processed"
        />

        <GlassMetric 
          title="Commission Earned"
          value={`GH₵${metrics?.recent_commission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={DollarSign}
          iconColorClass="text-emerald-500"
          subtitle="Total platform net earnings"
        />

        <GlassMetric 
          title="Weekly Growth Score"
          value={`${metrics?.volume_growth || 0} / 100`}
          icon={Percent}
          iconColorClass="text-purple-500"
          subtitle="Relative week-over-week growth rate"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Commission Growth Line Chart */}
        <GlassPanel className="p-5 flex flex-col space-y-4">
          <div>
            <h3 className="font-bold text-[var(--mf-text-primary)] text-xs uppercase tracking-wider">Weekly Commission Growth</h3>
            <p className="text-[10px] text-[var(--mf-text-secondary)]">Daily commission values earned over the week</p>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={commissionTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--mf-border)" />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'var(--mf-text-secondary)' }} stroke="var(--mf-border)" />
                <YAxis tick={{ fontSize: 9, fill: 'var(--mf-text-secondary)' }} stroke="var(--mf-border)" />
                <Tooltip contentStyle={{ backgroundColor: 'var(--mf-surface)', borderColor: 'var(--mf-border)', borderRadius: '10px' }} />
                <Line type="monotone" dataKey="Commission" stroke="var(--mf-accent)" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassPanel>

        {/* Transaction Type Pie Chart */}
        <GlassPanel className="p-5 flex flex-col space-y-4">
          <div>
            <h3 className="font-bold text-[var(--mf-text-primary)] text-xs uppercase tracking-wider">Transaction mix</h3>
            <p className="text-[10px] text-[var(--mf-text-secondary)]">Share of transaction value by type, last 6 months</p>
          </div>
          {typeDistribution.length === 0 ? (
            <div className="h-60 flex items-center justify-center text-[13px] text-[var(--mf-text-secondary)]">No transactions in the last 6 months.</div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative h-56 w-56 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={typeDistribution} dataKey="value" nameKey="type" innerRadius={68} outerRadius={100} paddingAngle={2} stroke="var(--mf-surface)" strokeWidth={2} isAnimationActive={false}>
                      {typeDistribution.map(d => (
                        <Cell key={d.type} fill={TYPE_STYLE[d.type]?.color || 'var(--mf-text-muted)'} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: any, _n: any, item: any) => [`GH₵${Number(v).toLocaleString()} · ${item.payload.share}%`, TYPE_STYLE[item.payload.type]?.label || item.payload.type]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[12px] text-[var(--mf-text-secondary)]">6-month total</span>
                  <span className="mf-display text-[20px] font-semibold">
                    GH₵{Math.round(typeDistribution.reduce((a, d) => a + d.value, 0) / 1000).toLocaleString()}K
                  </span>
                </div>
              </div>
              <ul className="flex-1 w-full space-y-2.5">
                {typeDistribution.map(d => (
                  <li key={d.type} className="flex items-center gap-3 text-[13px]">
                    <span className="h-3 w-3 rounded-[3px] flex-shrink-0" style={{ background: TYPE_STYLE[d.type]?.color || 'var(--mf-text-muted)' }} />
                    <span className="flex-1 text-[var(--mf-text-primary)]">{TYPE_STYLE[d.type]?.label || d.type}</span>
                    <span className="mf-tabular text-[var(--mf-text-secondary)]">GH₵{Math.round(d.value).toLocaleString()}</span>
                    <span className="mf-tabular font-semibold w-12 text-right">{d.share}%</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </GlassPanel>

        {/* Ghanaian Regional Activity Bar Chart */}
        <GlassPanel className="p-5 flex flex-col space-y-4 lg:col-span-2">
          <div>
            <h3 className="font-bold text-[var(--mf-text-primary)] text-xs uppercase tracking-wider flex items-center">
              <Globe2 className="h-4.5 w-4.5 text-[var(--mf-accent)] mr-1.5" />
              Ghanaian Regional Operational Analytics
            </h3>
            <p className="text-[10px] text-[var(--mf-text-secondary)]">
              Network demand across locales. Location is never used in credit scoring.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
            {/* Table */}
            <div className="lg:col-span-1">
              <GlassTable 
                headers={["Region", "Volume", "Count"]}
                alignRightIndexes={[1, 2]}
              >
                {regionalActivity.map(reg => (
                  <tr key={reg.location} className="hover:bg-white/5 transition-colors">
                    <td className="py-2.5 px-2 font-medium">{reg.location}</td>
                    <td className="py-2.5 px-2 text-right font-semibold">GH₵{reg['Tx Volume'].toLocaleString()}</td>
                    <td className="py-2.5 px-2 text-right font-mono text-[var(--mf-text-secondary)]">{reg['Tx Count']}</td>
                  </tr>
                ))}
              </GlassTable>
            </div>

            {/* Chart */}
            <div className="lg:col-span-2 h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={regionalActivity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--mf-border)" />
                  <XAxis dataKey="location" tick={{ fontSize: 9, fill: 'var(--mf-text-secondary)' }} stroke="var(--mf-border)" />
                  <YAxis tick={{ fontSize: 9, fill: 'var(--mf-text-secondary)' }} stroke="var(--mf-border)" />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--mf-surface)', borderColor: 'var(--mf-border)', borderRadius: '10px' }} />
                  <Bar dataKey="Tx Volume" fill="var(--mf-accent)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
};

export default BusinessAnalytics;
