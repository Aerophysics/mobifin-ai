import React, { useEffect, useState } from 'react';
import {
  Target, ShieldCheck, TrendingDown, ScanSearch, BrainCircuit, TrendingUp, ShieldAlert,
  Lock, Smartphone, CalendarClock, MessageSquareText, MapPinOff, Scale, Route, Sparkles,
} from 'lucide-react';
import ApiService from '../services/api';
import { DataExplorerMetrics, ModelPerformance } from '../types';
import { GlassMetric } from '../components/glass/GlassMetric';
import { SectionCard, AttentionRow, ProgressRow, LoadingBlock } from '../components/dash/DashKit';

const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0);
const ghsK = (v: number) => `GH₵${(v / 1000).toFixed(1)}k`;

// One plain-English card per model: who it helps, what it does, and the proof.
const ModelCard: React.FC<{
  icon: React.ComponentType<any>;
  user: string;
  name: string;
  what: string;
  result: string;
  resultLabel: string;
  technique: string;
  children?: React.ReactNode;
}> = ({ icon: Icon, user, name, what, result, resultLabel, technique, children }) => (
  <div className="rounded-2xl border border-[var(--mf-border)] p-4 sm:p-5 flex flex-col gap-3 min-w-0">
    <div className="flex items-center justify-between gap-2">
      <span className="h-10 w-10 rounded-xl bg-[var(--mf-accent-soft)] text-[var(--mf-accent-ink)] flex items-center justify-center flex-shrink-0">
        <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
      </span>
      <span className="text-[12px] font-semibold px-2 py-0.5 rounded-md bg-[var(--mf-card-glass)] border border-[var(--mf-border)] text-[var(--mf-text-secondary)]">
        For {user}
      </span>
    </div>
    <div>
      <div className="text-[16px] font-semibold text-[var(--mf-text-primary)]">{name}</div>
      <p className="text-[13px] text-[var(--mf-text-secondary)] mt-1 leading-relaxed">{what}</p>
    </div>
    <div className="flex-1" />
    <div className="pt-1">
      <div className="mf-display text-[30px] leading-none font-semibold text-[var(--mf-text-primary)] mf-tabular">{result}</div>
      <div className="text-[13px] text-[var(--mf-text-secondary)] mt-1.5">{resultLabel}</div>
    </div>
    <div className="md:min-h-[96px]">{children}</div>
    <div className="text-[11px] uppercase tracking-[0.12em] text-[var(--mf-text-muted)] pt-2 border-t border-[var(--mf-border)]">{technique}</div>
  </div>
);

// Two-bar comparison used on the forecast card.
const CompareBars: React.FC<{ rows: [string, number, string, boolean][] }> = ({ rows }) => {
  const max = Math.max(...rows.map(r => r[1]), 1);
  return (
    <div className="space-y-2">
      {rows.map(([label, v, text, good]) => (
        <div key={label}>
          <div className="flex justify-between text-[12px] mb-1">
            <span className="text-[var(--mf-text-secondary)]">{label}</span>
            <span className="font-semibold mf-tabular text-[var(--mf-text-primary)]">{text}</span>
          </div>
          <div className="h-2 rounded-full bg-[var(--mf-card-glass)] overflow-hidden">
            <div className={`h-full rounded-full ${good ? 'bg-[var(--mf-success)]' : 'bg-[var(--mf-text-muted)]'}`} style={{ width: `${(v / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
};

const AdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DataExplorerMetrics | null>(null);
  const [models, setModels] = useState<ModelPerformance | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [m, p] = await Promise.all([
        ApiService.getDataExplorerMetrics().catch(() => null),
        ApiService.getModelPerformance().catch(() => null),
      ]);
      setMetrics(m); setModels(p);
      setIsLoading(false);
    })();
  }, []);

  if (isLoading) return <LoadingBlock />;

  // Credit model: held-out validation results. Positive class = default.
  const cm: any = models?.credit_model?.metrics || {};
  const [[tn, fp], [fn, tp]] = (cm.confusion_matrix as number[][]) || [[0, 0], [0, 0]];
  const tested = tn + fp + fn + tp;
  const correctPct = pct(tn + tp, tested);
  const goodPayers = tn + fp;
  const clearedPct = pct(tn, goodPayers);
  const auc = typeof cm.roc_auc === 'number' ? cm.roc_auc.toFixed(2) : '—';

  // Demand forecaster vs the "same day last week" baseline.
  const dm: any = models?.demand_model?.metrics || {};
  const mae = typeof dm.mae === 'number' ? dm.mae : 0;
  const base = typeof dm.baseline_mae === 'number' ? dm.baseline_mae : 0;
  const errorCut = base ? Math.round((1 - mae / base) * 100) : 0;

  // Anomaly detector.
  const am: any = models?.anomaly_model?.metrics || {};
  const flagged = am.total_anomalies_detected ?? 0;
  const share = typeof am.anomaly_contamination === 'number' ? Math.round(am.anomaly_contamination * 100) : 0;

  // Live journey in this environment.
  const referred = metrics?.customer_count || 0;
  const consented = metrics?.consented_customer_count || 0;
  const ready = metrics?.sufficient_history_count || 0;

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        <GlassMetric title="Credit calls correct" icon={Target} value={tested ? `${correctPct}%` : '—'} subtitle={`${tn + tp} of ${tested} test customers`} />
        <GlassMetric title="Good payers cleared" icon={ShieldCheck} value={goodPayers ? `${clearedPct}%` : '—'} subtitle={`Only ${fp} of ${goodPayers} wrongly flagged`} />
        <GlassMetric title="Forecast error cut" icon={TrendingDown} value={base ? `${errorCut}%` : '—'} trend={{ value: 'vs last week’s figure', isPositive: true }} />
        <GlassMetric title="Unusual transactions" icon={ScanSearch} value={flagged.toLocaleString()} subtitle={`Top ${share}% flagged for review`} />
      </div>

      <SectionCard title="Three AI models, one platform" icon={Sparkles}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ModelCard
              icon={TrendingUp}
              user="agents"
              name="Float forecast"
              what="Predicts tomorrow’s cash and e-float demand from the last week of trading and the calendar, so agents rebalance before the queue forms."
              result={base ? `${errorCut}% less error` : '—'}
              resultLabel="than assuming the same as last week"
              technique="XGBoost regression"
            >
              {base > 0 && (
                <CompareBars rows={[
                  ['Same as last week', base, `${ghsK(base)} off / day`, false],
                  ['MobiFin forecast', mae, `${ghsK(mae)} off / day`, true],
                ]} />
              )}
            </ModelCard>
            <ModelCard
              icon={BrainCircuit}
              user="lenders"
              name="Alternative credit score"
              what="Scores customers with no bank history from 13 mobile-money behaviours, such as savings habits and cash-flow stability, and shows the reasons behind every score."
              result={tested ? `${correctPct}% correct` : '—'}
              resultLabel={`on ${tested} customers the model never saw`}
              technique={`XGBoost + SHAP explanations · AUC ${auc}`}
            >
              {tested > 0 && (
                <div className="space-y-2">
                  <ProgressRowCompact label="Good payers cleared" value={clearedPct} text={`${tn} / ${goodPayers}`} />
                  <ProgressRowCompact label="Defaults caught" value={pct(tp, fn + tp)} text={`${tp} / ${fn + tp}`} />
                </div>
              )}
            </ModelCard>
            <ModelCard
              icon={ShieldAlert}
              user="the platform"
              name="Fraud & anomaly watch"
              what="Learns what normal trading looks like at each agent and flags transactions that break the pattern, so a person can check them."
              result={flagged.toLocaleString()}
              resultLabel={`transactions flagged (the most unusual ${share}%)`}
              technique="Isolation Forest"
            >
              {share > 0 && (
                <div className="space-y-2">
                  <ProgressRowCompact label="Look normal" value={100 - share} text={`${100 - share}%`} />
                  <ProgressRowCompact label="Sent for a human check" value={share} text={`${share}%`} warn />
                </div>
              )}
            </ModelCard>
          </div>
      </SectionCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SectionCard title="Trust built in" icon={Lock}>
          <AttentionRow icon={Smartphone} title="Customer consent on USSD" detail="Nothing is shared until the customer presses 1" status="Required" tone="success" />
          <AttentionRow icon={CalendarClock} title="Consent expires in 90 days" detail="Customers can revoke it any time" status="Enforced" tone="success" />
          <AttentionRow icon={MessageSquareText} title="Every score is explained" detail="Lenders see what raised or lowered it" status="Always" tone="success" />
          <AttentionRow icon={MapPinOff} title="Location is never scored" detail="Excluded from the credit model’s inputs" status="Excluded" tone="success" />
          <AttentionRow icon={Scale} title="Guidance, not an approval" detail="The lender makes the final decision" status="By design" tone="info" />
        </SectionCard>

        <SectionCard title="Customer journey in this demo" icon={Route}>
        <ProgressRow label="Referred by an agent" value={referred ? 100 : 0} valueText={`${referred} customer${referred === 1 ? '' : 's'}`} chipText={referred ? '100%' : '0%'} tone="success" />
        <ProgressRow label="Consented on USSD" value={pct(consented, referred)} valueText={`${consented} of ${referred}`} chipText={`${pct(consented, referred)}%`} tone={consented ? 'success' : 'warning'} />
        <ProgressRow label="Credit-ready" value={pct(ready, referred)} valueText={`${ready} of ${referred}`} chipText={`${pct(ready, referred)}%`} tone={ready ? 'success' : 'warning'} />
          <p className="text-[13px] text-[var(--mf-text-secondary)] mt-4 leading-relaxed">
            Agent refers a customer → the customer approves on USSD → the lender sees an explainable score and decides. Updates live as you run the demo.
          </p>
        </SectionCard>
      </div>
    </div>
  );
};

// Small labelled bar for inside a model card.
const ProgressRowCompact: React.FC<{ label: string; value: number; text: string; warn?: boolean }> = ({ label, value, text, warn }) => (
  <div>
    <div className="flex justify-between text-[12px] mb-1">
      <span className="text-[var(--mf-text-secondary)]">{label}</span>
      <span className="font-semibold mf-tabular text-[var(--mf-text-primary)]">{text}</span>
    </div>
    <div className="h-2 rounded-full bg-[var(--mf-card-glass)] overflow-hidden">
      <div className={`h-full rounded-full ${warn ? 'bg-[#c9700a]' : 'bg-[var(--mf-success)]'}`} style={{ width: `${Math.max(2, Math.min(100, value))}%` }} />
    </div>
  </div>
);

export default AdminDashboard;
