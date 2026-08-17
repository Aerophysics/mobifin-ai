import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle2, AlertTriangle, Info, Database } from 'lucide-react';
import ApiService from '../services/api';

const DemoManagement: React.FC = () => {
  const [isSeeding, setIsSeeding] = useState<boolean>(false);
  const [seedSuccess, setSeedSuccess] = useState<boolean>(false);
  const [dbStatus, setDbStatus] = useState<string>('Detecting DB...');
  const [isSqlite, setIsSqlite] = useState<boolean>(false);

  useEffect(() => {
    fetchDbStatus();
  }, []);

  const fetchDbStatus = async () => {
    try {
      const res = await ApiService.getSystemStatus();
      setDbStatus(res.database);
      isSqlite ? setIsSqlite(true) : setIsSqlite(res.sqlite_active);
    } catch {
      setDbStatus('SQLite Fallback Active');
      setIsSqlite(true);
    }
  };

  const triggerSeed = async () => {
    setIsSeeding(true);
    setSeedSuccess(false);
    try {
      await ApiService.seedDemoData();
      setSeedSuccess(true);
      setTimeout(() => setSeedSuccess(false), 4000);
      await fetchDbStatus();
    } catch (err: any) {
      alert(`Database seeding failed: ${err.message}`);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fadeIn">
      {/* Intro and status info */}
      <div className="premium-card bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Demo Sandbox Management</h3>
          <p className="text-[10px] text-slate-400">Reset or seed the longitudinal financial transaction database for testing</p>
        </div>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
          isSqlite 
            ? 'bg-amber-50 text-amber-700 border-amber-200' 
            : 'bg-emerald-50 text-teal-700 border-emerald-200'
        }`}>
          <Database className="h-3 w-3 mr-1.5" />
          Active Engine: {isSqlite ? 'SQLite Fallback' : 'PostgreSQL Server'}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Seeder Action Control */}
        <div className="premium-card bg-white flex flex-col justify-between lg:col-span-2">
          <div className="space-y-3">
            <h4 className="font-bold text-slate-850 text-xs uppercase tracking-wider">Sandbox Database Seeder</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Triggers the generation of the synthetic financial ecosystem. Seeding creates:
            </p>
            <ul className="list-disc pl-5 text-xs text-slate-500 space-y-1.5">
              <li><strong>Mobile Money Agents:</strong> Kwame's Centre with transaction and float ledger rows.</li>
              <li><strong>Consenting Customers:</strong> Profile records with active historical transactions (e.g. Customer #1048).</li>
              <li><strong>Ineligible / Consented:</strong> Short-term profiling records for readiness checks (e.g. Customer #4).</li>
              <li><strong>Opted-out Profiles:</strong> Non-consented mock records to verify governance limits.</li>
            </ul>
          </div>

          <div className="pt-6 space-y-2">
            <button
              onClick={triggerSeed}
              disabled={isSeeding}
              className="w-full flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-lg text-xs transition disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`h-4 w-4 ${isSeeding ? 'animate-spin' : ''}`} />
              <span>{isSeeding ? 'Generative Seeding Active...' : 'Re-Seed Demo Dataset'}</span>
            </button>
            
            {seedSuccess && (
              <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 text-[10px] p-2.5 rounded-lg flex items-center space-x-1.5 animate-pulse">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <span>Demo environment loaded successfully. Sandbox registers reset.</span>
              </div>
            )}
          </div>
        </div>

        {/* Informational Guidelines */}
        <div className="premium-card bg-slate-900 border-slate-800 text-slate-100 flex flex-col justify-between">
          <div className="space-y-4">
            <h4 className="font-bold text-teal-400 text-xs uppercase tracking-wider flex items-center">
              <Info className="h-4.5 w-4.5 text-teal-400 mr-1.5" />
              Guidelines for Judges
            </h4>
            <p className="text-[10px] text-slate-350 leading-relaxed">
              To test the platform's response to liquidity warnings or alternative credit scores, run the seed generator first. 
              The backend automatically partitions data and populates XGBoost model registry variables on the fly.
            </p>
          </div>
          <div className="text-[9px] text-slate-500 pt-4 border-t border-slate-800 uppercase tracking-widest font-bold">
            MobiFin AI operator utility
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoManagement;
