import React, { useEffect, useState } from 'react';
import { Database, ShieldCheck, Activity, Terminal, Layers } from 'lucide-react';
import ApiService from '../services/api';
import { DataExplorerMetrics } from '../types';

const AdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DataExplorerMetrics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    setIsLoading(true);
    try {
      const res = await ApiService.getDataExplorerMetrics();
      setMetrics(res);
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

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fadeIn">
      {/* Telemetry Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
        <div className="premium-card bg-white">
          <span className="text-[9px] text-slate-450 font-bold uppercase tracking-wider block">Total Agents</span>
          <span className="text-xl font-bold text-slate-800 block mt-1.5">{metrics?.agent_count || 0}</span>
        </div>

        <div className="premium-card bg-white">
          <span className="text-[9px] text-slate-450 font-bold uppercase tracking-wider block">Total Customers</span>
          <span className="text-xl font-bold text-slate-800 block mt-1.5">{metrics?.customer_count || 0}</span>
        </div>

        <div className="premium-card bg-white">
          <span className="text-[9px] text-slate-450 font-bold uppercase tracking-wider block">Total Transactions</span>
          <span className="text-xl font-bold text-slate-800 block mt-1.5">
            {metrics?.transaction_count.toLocaleString() || 0}
          </span>
        </div>

        <div className="premium-card bg-white">
          <span className="text-[9px] text-slate-450 font-bold uppercase tracking-wider block">Consented Customers</span>
          <span className="text-xl font-bold text-slate-800 block mt-1.5">{metrics?.consented_customer_count || 0}</span>
        </div>

        <div className="premium-card bg-white">
          <span className="text-[9px] text-slate-450 font-bold uppercase tracking-wider block">Credit-Eligible</span>
          <span className="text-xl font-bold text-teal-600 block mt-1.5">{metrics?.sufficient_history_count || 0}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Model Status Register */}
        <div className="premium-card bg-white space-y-4">
          <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center">
            <Layers className="h-4.5 w-4.5 text-teal-605 mr-1.5" />
            Model Registry Status
          </h4>
          <div className="space-y-3.5 text-xs">
            <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-600 font-semibold">Alternative Credit scoring Model (XGBoost)</span>
              <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5" /> Active
              </span>
            </div>
            <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-600 font-semibold">Liquidity Forecast Model (XGBoost Regressor)</span>
              <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5" /> Active
              </span>
            </div>
            <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-600 font-semibold">Anomaly Detector Model (Isolation Forest)</span>
              <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5" /> Active
              </span>
            </div>
          </div>
        </div>

        {/* System Health Status */}
        <div className="premium-card bg-white space-y-4">
          <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center">
            <Terminal className="h-4.5 w-4.5 text-teal-605 mr-1.5" />
            Infrastructure Status
          </h4>
          <div className="space-y-3.5 text-xs">
            <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-600 font-semibold">Database Connection</span>
              <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5" /> Connected ({metrics?.db_type})
              </span>
            </div>
            <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-600 font-semibold">Application API Gateway</span>
              <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5" /> Operational
              </span>
            </div>
            <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-600 font-semibold">ML Model Artifact Storage</span>
              <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5" /> Loaded
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
