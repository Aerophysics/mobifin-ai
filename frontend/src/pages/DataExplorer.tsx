import React, { useEffect, useState } from 'react';
import { 
  Database, Users, Activity, ToggleLeft, ShieldCheck, 
  HelpCircle, RefreshCw, AlertTriangle, CheckCircle2
} from 'lucide-react';
import ApiService from '../services/api';
import { DataExplorerMetrics } from '../types';

const DataExplorer: React.FC = () => {
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

  const customerCount = metrics?.customer_count || 1;
  const consentedCount = metrics?.consented_customer_count || 0;
  const consentRate = (consentedCount / customerCount) * 100;

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fadeIn">
      {/* DB Connection Meta Card */}
      <div className="premium-card bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center space-x-3">
          <Database className="h-5 w-5 text-teal-650" />
          <div>
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Database Explorer</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Database storage partitions, counts, and connection strings</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded-lg border border-slate-200 text-xs">
          <span className="text-slate-500 font-semibold text-[10px] uppercase">Active Connection:</span>
          <span className="font-mono font-bold text-teal-700">{metrics?.db_type}</span>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="premium-card bg-white">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Registered Agents</span>
          <span className="text-xl font-bold text-slate-800 block mt-1.5">{metrics?.agent_count}</span>
        </div>

        <div className="premium-card bg-white">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Total Customers</span>
          <span className="text-xl font-bold text-slate-800 block mt-1.5">{metrics?.customer_count}</span>
        </div>

        <div className="premium-card bg-white">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Transaction Ledger</span>
          <span className="text-xl font-bold text-slate-800 block mt-1.5">
            {metrics?.transaction_count.toLocaleString()}
          </span>
        </div>

        <div className="premium-card bg-white">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Matured credit profiles</span>
          <span className="text-xl font-bold text-teal-600 block mt-1.5">
            {metrics?.sufficient_history_count}
          </span>
        </div>
      </div>

      {/* Consent Statistics Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="premium-card bg-white lg:col-span-3 space-y-6">
          <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center">
            <ShieldCheck className="h-4.5 w-4.5 text-teal-655 mr-1.5" />
            Customer Consent Opt-in Metrics
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
            {/* Visual Indicator */}
            <div className="flex flex-col items-center">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block mb-3">Consent Opt-In Rate</span>
              <div className="relative h-20 w-20 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="40" cy="40" r="34" stroke="#f1f5f9" strokeWidth="5" fill="transparent" />
                  <circle 
                    cx="40" 
                    cy="40" 
                    r="34" 
                    stroke="#0d9488" 
                    strokeWidth="5" 
                    fill="transparent" 
                    strokeDasharray="213"
                    strokeDashoffset={213 - (213 * consentRate) / 100}
                  />
                </svg>
                <span className="absolute text-sm font-extrabold text-slate-700">{consentRate.toFixed(0)}%</span>
              </div>
            </div>

            {/* Metrics Checklist */}
            <div className="space-y-2 text-xs text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Consenting Profiles</span>
                <span className="font-bold">{metrics?.consented_customer_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Matured (90d/30tx)</span>
                <span className="font-bold text-teal-600">{metrics?.sufficient_history_count}</span>
              </div>
              <p className="text-[9px] text-slate-400 leading-normal pt-2 border-t border-slate-100 mt-2">
                Alternative Credit Score modeling is restricted to consenting profiles meeting the 90-day history and 30-transaction thresholds.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataExplorer;
