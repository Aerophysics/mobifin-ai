import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle2, Info, Database } from 'lucide-react';
import ApiService from '../services/api';
import { GlassPanel } from '../components/glass/GlassPanel';
import { GlassCard } from '../components/glass/GlassCard';
import { GlassButton } from '../components/glass/GlassButton';
import { GlassBadge } from '../components/glass/GlassBadge';

const DemoManagement: React.FC = () => {
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

      <div className="grid grid-cols-1 gap-6">
        {/* Informational Guidelines & Platform Diagnostics */}
        <GlassPanel className="p-5 space-y-4">
          <h4 className="font-bold text-[var(--mf-accent)] text-xs uppercase tracking-wider flex items-center">
            <Info className="h-4.5 w-4.5 text-[var(--mf-accent)] mr-1.5" />
            Sandbox Diagnostics & Guidelines
          </h4>
          <div className="text-xs text-[var(--mf-text-secondary)] space-y-3 leading-relaxed">
            <p>
              The MobiFin AI sandbox is running in self-contained demonstration mode. Model parameters, inference results (XGBoost forecasting and alternative credit scoring), and baseline transaction tables are pre-populated.
            </p>
            <p>
              Underlying database tables are partitioned dynamically. Security boundaries are actively enforced, preventing credit scoring leakage to agents while allowing underwriters access to alternative financial profiles.
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
