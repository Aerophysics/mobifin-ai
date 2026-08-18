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
const COLORS = ['#0d9488', '#3b82f6', '#8b5cf6', '#f97316', '#10b981', '#6366f1'];

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

  const typeDistribution = [
    { name: 'Deposit', value: 45000 },
    { name: 'Withdrawal', value: 38000 },
    { name: 'Transfer', value: 15000 },
    { name: 'Bill Payment', value: 12000 },
    { name: 'Airtime', value: 8000 },
    { name: 'Merchant Pay', value: 7000 }
  ];

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
      const res = await ApiService.getBusinessHealth();
      setHealth(res);
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
    <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn pb-8">
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
            <h3 className="font-bold text-[var(--mf-text-primary)] text-xs uppercase tracking-wider">Transaction Type Distribution</h3>
            <p className="text-[10px] text-[var(--mf-text-secondary)]">Volumetric share of mobile money services</p>
          </div>
          <div className="h-60 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {typeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'var(--mf-surface)', borderColor: 'var(--mf-border)', borderRadius: '10px' }} />
                <Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ fontSize: 9 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </GlassPanel>

        {/* Ghanaian Regional Activity Bar Chart */}
        <GlassPanel className="p-5 flex flex-col space-y-4 lg:col-span-2">
          <div>
            <h3 className="font-bold text-[var(--mf-text-primary)] text-xs uppercase tracking-wider flex items-center">
              <Globe2 className="h-4.5 w-4.5 text-[var(--mf-accent)] mr-1.5" />
              Ghanaian Regional Operational Analytics
            </h3>
            <p className="text-[10px] text-[var(--mf-text-secondary)]">
              Network demand across locales. Not utilized in ML customer credit scoring model.
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
