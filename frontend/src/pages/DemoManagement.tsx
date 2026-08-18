import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle2, Info, Database } from 'lucide-react';
import ApiService from '../services/api';
import { GlassPanel } from '../components/glass/GlassPanel';
import { GlassCard } from '../components/glass/GlassCard';
import { GlassButton } from '../components/glass/GlassButton';
import { GlassBadge } from '../components/glass/GlassBadge';

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
      setIsSqlite(res.sqlite_active);
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
    <div className="space-y-6 max-w-4xl mx-auto animate-fadeIn pb-8">
      {/* Intro and status info */}
      <GlassPanel className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h3 className="font-bold text-[var(--mf-text-primary)] text-xs uppercase tracking-wider">Demo Sandbox Management</h3>
          <p className="text-[10px] text-[var(--mf-text-secondary)]">Reset or seed the longitudinal financial transaction database for testing</p>
        </div>
        <GlassBadge variant={isSqlite ? 'warning' : 'success'}>
          <Database className="h-3 w-3 mr-1.5 inline-block" />
          Active Engine: {isSqlite ? 'SQLite Fallback' : 'PostgreSQL Server'}
        </GlassBadge>
      </GlassPanel>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Seeder Action Control */}
        <GlassPanel className="p-5 flex flex-col justify-between lg:col-span-2 space-y-4">
          <div className="space-y-3">
            <h4 className="font-bold text-[var(--mf-text-primary)] text-xs uppercase tracking-wider">Sandbox Database Seeder</h4>
            <p className="text-xs text-[var(--mf-text-secondary)] leading-relaxed">
              Triggers the generation of the synthetic financial ecosystem. Seeding creates:
            </p>
            <ul className="list-disc pl-5 text-xs text-[var(--mf-text-secondary)] space-y-1.5">
              <li><strong>Mobile Money Agents:</strong> Kwame's Centre with transaction and float ledger rows.</li>
              <li><strong>Consenting Customers:</strong> Profile records with active historical transactions (e.g. Customer #1048).</li>
              <li><strong>Ineligible / Consented:</strong> Short-term profiling records for readiness checks (e.g. Customer #2001).</li>
              <li><strong>Opted-out Profiles:</strong> Non-consented mock records to verify governance limits (e.g. Customer #2000).</li>
            </ul>
          </div>

          <div className="pt-4 space-y-2">
            <GlassButton
              onClick={triggerSeed}
              disabled={isSeeding}
              variant="primary"
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 font-bold text-xs uppercase tracking-wider"
            >
              <RefreshCw className={`h-4 w-4 ${isSeeding ? 'animate-spin' : ''}`} />
              <span>{isSeeding ? 'Generative Seeding Active...' : 'Re-Seed Demo Dataset'}</span>
            </GlassButton>
            
            {seedSuccess && (
              <div className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] p-2.5 rounded-lg flex items-center space-x-1.5 animate-pulse">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                <span>Demo environment loaded successfully. Sandbox registers reset.</span>
              </div>
            )}
          </div>
        </GlassPanel>

        {/* Informational Guidelines */}
        <GlassPanel className="p-5 flex flex-col justify-between">
          <div className="space-y-4">
            <h4 className="font-bold text-[var(--mf-accent)] text-xs uppercase tracking-wider flex items-center">
              <Info className="h-4.5 w-4.5 text-[var(--mf-accent)] mr-1.5" />
              Guidelines for Judges
            </h4>
            <p className="text-[10px] text-[var(--mf-text-secondary)] leading-relaxed">
              To test the platform's response to liquidity warnings or alternative credit scores, run the seed generator first. 
              The backend automatically partitions data and populates XGBoost model registry variables on the fly.
            </p>
          </div>
          <div className="text-[9px] text-[var(--mf-text-secondary)] pt-4 border-t border-[var(--mf-border)] uppercase tracking-widest font-bold">
            MobiFin AI operator utility
          </div>
        </GlassPanel>
      </div>
    </div>
  );
};

export default DemoManagement;
