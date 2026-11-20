import React, { useEffect, useState } from 'react';
import { Users, Store, Receipt, KeyRound, Layers, Server, Database, Wifi, BadgeCheck, PieChart, BrainCircuit, TrendingUp, ShieldAlert } from 'lucide-react';
import ApiService from '../services/api';
import { DataExplorerMetrics, ModelPerformance } from '../types';
import { GlassMetric } from '../components/glass/GlassMetric';
import { SectionCard, AttentionRow, ProgressRow, LoadingBlock } from '../components/dash/DashKit';

const fmt = (v: any, digits = 3) => (typeof v === 'number' ? v.toFixed(digits) : '—');

const ModelRow: React.FC<{ icon: React.ComponentType<any>; name: string; model: any; chips: [string, string][] }> = ({ icon: Icon, name, model, chips }) => (
  <div className="flex flex-col sm:flex-row sm:items-center gap-3 py-4 border-t border-[var(--mf-border)] first:border-t-0">
    <div className="flex items-center gap-3.5 flex-1 min-w-0">
      <span className="h-10 w-10 rounded-xl border border-[var(--mf-border)] flex items-center justify-center text-[var(--mf-text-secondary)] flex-shrink-0">
        <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
      </span>
      <span className="min-w-0">
        <span className="block text-[14px] font-semibold truncate">{name}</span>
        <span className="block text-[13px] text-[var(--mf-text-secondary)] truncate">
          {model ? `${model.version || 'v1'}${model.timestamp ? ` · trained ${new Date(model.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}` : 'Not trained'}
        </span>
      </span>
    </div>
    <div className="flex flex-wrap gap-1.5 sm:justify-end">
      {model ? chips.map(([k, v]) => (
        <span key={k} className="text-[12px] px-2 py-1 rounded-md bg-[var(--mf-card-glass)] border border-[var(--mf-border)]">
          <span className="text-[var(--mf-text-secondary)]">{k}</span> <span className="font-semibold mf-tabular">{v}</span>
        </span>
      )) : <span className="text-[12px] px-2 py-1 rounded-md bg-[var(--mf-warning-soft)] text-[var(--mf-warning-ink)] font-semibold">Missing</span>}
    </div>
  </div>
);

const AdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DataExplorerMetrics | null>(null);
  const [models, setModels] = useState<ModelPerformance | null>(null);
  const [status, setStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [m, p, s] = await Promise.all([
        ApiService.getDataExplorerMetrics().catch(() => null),
        ApiService.getModelPerformance().catch(() => null),
        ApiService.getSystemStatus().catch(() => null),
      ]);
      setMetrics(m); setModels(p); setStatus(s);
      setIsLoading(false);
    })();
  }, []);

  if (isLoading) return <LoadingBlock />;

  const customers = metrics?.customer_count || 0;
  const consented = metrics?.consented_customer_count || 0;
  const eligible = metrics?.sufficient_history_count || 0;
  const consentPct = customers ? Math.round((consented / customers) * 100) : 0;
  const eligiblePct = customers ? Math.round((eligible / customers) * 100) : 0;
  const cm = models?.credit_model?.metrics || {};
  const dm = models?.demand_model?.metrics || {};
  const am = models?.anomaly_model?.metrics || {};
  const isDemo = ApiService.isDemoMode();

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        <GlassMetric title="Agent branches" icon={Store} value={(metrics?.agent_count || 0).toLocaleString()} subtitle="Registered locations" />
        <GlassMetric title="Customers" icon={Users} value={customers.toLocaleString()} subtitle="Anonymised profiles" />
        <GlassMetric title="Transactions" icon={Receipt} value={(metrics?.transaction_count || 0).toLocaleString()} subtitle="Ingested records" />
        <GlassMetric title="Consent coverage" icon={KeyRound} value={`${consentPct}%`} trend={{ value: `${consented.toLocaleString()} opted in`, isPositive: true }} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_420px] gap-5">
        <SectionCard title="Model registry" icon={Layers}>
          <ModelRow
            icon={BrainCircuit}
            name="Alternative credit classifier · XGBoost"
            model={models?.credit_model}
            chips={[['ROC-AUC', fmt(cm.roc_auc)], ['F1', fmt(cm.f1)], ['Precision', fmt(cm.precision)], ['Recall', fmt(cm.recall)]]}
          />
          <ModelRow
            icon={TrendingUp}
            name="Liquidity demand forecaster · XGBoost"
            model={models?.demand_model}
            chips={[['MAE', typeof dm.mae === 'number' ? `GH₵${Math.round(dm.mae)}` : '—'], ['RMSE', typeof dm.rmse === 'number' ? `GH₵${Math.round(dm.rmse)}` : '—'], ['MAPE', typeof dm.mape === 'number' ? `${dm.mape.toFixed(1)}%` : '—']]}
          />
          <ModelRow
            icon={ShieldAlert}
            name="Transaction anomaly detector · Isolation Forest"
            model={models?.anomaly_model}
            chips={[['Contamination', typeof am.anomaly_contamination === 'number' ? `${Math.round(am.anomaly_contamination * 100)}%` : '—'], ['Flagged', `${am.total_anomalies_detected ?? '—'}`]]}
          />
        </SectionCard>

        <SectionCard title="Platform status" icon={Server}>
          <AttentionRow icon={Wifi} title={isDemo ? 'Offline demo data' : 'Live API'} detail={isDemo ? 'Browser-stored sample data' : 'FastAPI backend reachable'} status={isDemo ? 'Demo' : 'Online'} tone={isDemo ? 'warning' : 'success'} />
          <AttentionRow icon={Database} title={status?.database || metrics?.db_type || 'Database'} detail={status?.sqlite_active ? 'Local fallback database' : 'Primary database'} status={status?.sqlite_active ? 'Fallback' : 'Connected'} tone={status?.sqlite_active ? 'warning' : 'success'} />
          <AttentionRow icon={BadgeCheck} title={`${eligible.toLocaleString()} credit-eligible customers`} detail="Consent, 90+ days and 30+ transactions" status={`${eligiblePct}%`} tone="info" />
        </SectionCard>
      </div>

      <SectionCard title="Data coverage" icon={PieChart}>
        <ProgressRow label="Consented" value={consentPct} valueText={`${consented.toLocaleString()} of ${customers.toLocaleString()}`} chipText={`${consentPct}%`} tone={consentPct >= 50 ? 'success' : 'warning'} />
        <ProgressRow label="Credit-eligible" value={eligiblePct} valueText={`${eligible.toLocaleString()} of ${customers.toLocaleString()}`} chipText={`${eligiblePct}%`} tone={eligiblePct >= 30 ? 'success' : 'warning'} />
      </SectionCard>
    </div>
  );
};

export default AdminDashboard;
