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

const COLORS = ['#0d9488', '#0f766e', '#14b8a6', '#5eead4', '#2dd4bf', '#06b6d4'];

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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  const metrics = health?.metrics;

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Total volume */}
        <div className="premium-card bg-white flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total 14d Volume</span>
            <span className="text-xl font-bold text-slate-800 block">
              GH₵{metrics?.recent_volume.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className="bg-slate-50 text-slate-700 p-2 rounded border border-slate-200">
            <Activity className="h-4.5 w-4.5" />
          </div>
        </div>

        {/* Total Commission */}
        <div className="premium-card bg-white flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Commission Earned</span>
            <span className="text-xl font-bold text-slate-800 block">
              GH₵{metrics?.recent_commission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="bg-teal-50 text-teal-700 p-2 rounded border border-teal-100">
            <DollarSign className="h-4.5 w-4.5" />
          </div>
        </div>

        {/* Growth index */}
        <div className="premium-card bg-white flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Weekly Growth Score</span>
            <span className="text-xl font-bold text-slate-800 block">
              {metrics?.volume_growth} <span className="text-xs text-slate-400 font-medium">/ 100</span>
            </span>
          </div>
          <div className="bg-emerald-50 text-emerald-700 p-2 rounded border border-emerald-100">
            <Percent className="h-4.5 w-4.5" />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Commission Growth Line Chart */}
        <div className="premium-card bg-white flex flex-col space-y-4">
          <div>
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Weekly Commission Growth</h3>
            <p className="text-[10px] text-slate-400">Daily commission values earned over the week</p>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={commissionTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8' }} stroke="#e2e8f0" />
                <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} stroke="#e2e8f0" />
                <Tooltip />
                <Line type="monotone" dataKey="Commission" stroke="#0d9488" strokeWidth={1.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Transaction Type Pie Chart */}
        <div className="premium-card bg-white flex flex-col space-y-4">
          <div>
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Transaction Type Distribution</h3>
            <p className="text-[10px] text-slate-400">Volumetric share of mobile money services</p>
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
                <Tooltip />
                <Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ fontSize: 9 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Purely Operational Ghanaian Regional Activity Bar Chart */}
        <div className="premium-card bg-white flex flex-col space-y-4 lg:col-span-2">
          <div>
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center">
              <Globe2 className="h-4.5 w-4.5 text-teal-600 mr-1.5" />
              Ghanaian Regional Operational Analytics
            </h3>
            <p className="text-[10px] text-slate-400">
              Network demand across locales. Not utilized in ML customer credit scoring model.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
            {/* Table */}
            <div className="lg:col-span-1 overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase">
                    <th className="py-2.5">Region</th>
                    <th className="py-2.5 text-right">Volume</th>
                    <th className="py-2.5 text-right font-normal text-slate-400">Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {regionalActivity.map(reg => (
                    <tr key={reg.location}>
                      <td className="py-2.5 font-medium">{reg.location}</td>
                      <td className="py-2.5 text-right font-semibold">GH₵{reg['Tx Volume'].toLocaleString()}</td>
                      <td className="py-2.5 text-right font-mono text-slate-400">{reg['Tx Count']}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Chart */}
            <div className="lg:col-span-2 h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={regionalActivity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" />
                  <XAxis dataKey="location" tick={{ fontSize: 9, fill: '#94a3b8' }} stroke="#e2e8f0" />
                  <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} stroke="#e2e8f0" />
                  <Tooltip />
                  <Bar dataKey="Tx Volume" fill="#0d9488" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessAnalytics;
