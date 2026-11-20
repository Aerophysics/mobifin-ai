import React, { useEffect, useMemo, useState } from 'react';
import {
  Wallet, Smartphone, HeartPulse, TrendingUp, BarChart3, AlertTriangle, PieChart,
  List, ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Receipt, Store, ShieldAlert,
  Users, Clock, BadgeCheck, Gauge, Landmark, FileCheck2, Hourglass, CheckCircle2, CalendarClock,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import ApiService, { VolumeByMonth } from '../services/api';
import { AgentProfile, BusinessHealth, LiquidityRecommendations, Transaction, Anomaly } from '../types';
import { GlassMetric } from '../components/glass/GlassMetric';
import {
  SectionCard, PillButton, AttentionRow, SuggestionCard, ProgressRow, ActivityRow,
  StackedMonthlyChart, ChartLegend, LoadingBlock, StackSeries, fmtGHS,
} from '../components/dash/DashKit';

interface DashboardProps {
  setActivePage?: (page: string) => void;
  currentUser?: any;
}

export const Dashboard: React.FC<DashboardProps> = ({ setActivePage, currentUser }) => {
  if (currentUser?.role === 'FINANCIAL_INSTITUTION') {
    return <InstitutionOverview setActivePage={setActivePage} />;
  }
  return <AgentOverview setActivePage={setActivePage} />;
};

// ===========================================================================
// Agent overview
// ===========================================================================
const VOLUME_SERIES: StackSeries[] = [
  { key: 'deposits', label: 'Deposits', color: 'var(--mf-chart-1)' },
  { key: 'withdrawals', label: 'Withdrawals', color: 'var(--mf-chart-2)' },
  { key: 'transfers', label: 'Transfers', color: 'var(--mf-chart-3)' },
  { key: 'payments', label: 'Bills, merchants & airtime', color: 'var(--mf-chart-4)' },
];

const TX_META: Record<string, { label: string; icon: React.ComponentType<any> }> = {
  deposit: { label: 'Cash deposit', icon: ArrowDownLeft },
  withdrawal: { label: 'Cash withdrawal', icon: ArrowUpRight },
  transfer: { label: 'Transfer', icon: ArrowLeftRight },
  bill_payment: { label: 'Bill payment', icon: Receipt },
  merchant_payment: { label: 'Merchant payment', icon: Store },
  airtime: { label: 'Airtime top-up', icon: Smartphone },
};

const healthTone = (v: number): 'success' | 'warning' | 'danger' => (v >= 85 ? 'success' : v >= 65 ? 'warning' : 'danger');

const AgentOverview: React.FC<{ setActivePage?: (p: string) => void }> = ({ setActivePage }) => {
  const [loading, setLoading] = useState(true);
  const [agent, setAgent] = useState<AgentProfile | null>(null);
  const [health, setHealth] = useState<BusinessHealth | null>(null);
  const [liq, setLiq] = useState<LiquidityRecommendations | null>(null);
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [volume, setVolume] = useState<VolumeByMonth | null>(null);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const settle = async <T,>(p: Promise<T>, fallback: T): Promise<T> => {
        try { return await p; } catch (e) { console.error(e); return fallback; }
      };
      const [a, h, l, t, an, v, r] = await Promise.all([
        settle(ApiService.getMe(), null as any),
        settle(ApiService.getBusinessHealth(), null as any),
        settle(ApiService.getLiquidityRecommendations(), null as any),
        settle(ApiService.listTransactions({ page_size: 5 }), { transactions: [] } as any),
        settle(ApiService.listAnomalies(), [] as Anomaly[]),
        settle(ApiService.getVolumeByMonth(6), null as any),
        settle(ApiService.getReferrals(), [] as any[]),
      ]);
      setAgent(a); setHealth(h); setLiq(l); setTxs(t?.transactions || []);
      setAnomalies(an || []); setVolume(v); setReferrals(r || []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <LoadingBlock />;

  const cash = liq?.current_cash ?? agent?.cash_balance ?? 0;
  const float = liq?.current_float ?? agent?.float_balance ?? 0;
  const reserve = liq?.minimum_cash_reserve ?? 1000;
  const demand = liq?.expected_float_demand ?? 0;
  const shortfall = liq?.predicted_shortfall ?? 0;
  const rec = liq?.recommendation;
  const score = Math.round(health?.business_health_score ?? 0);
  const m = health?.metrics;
  const awaitingConsent = referrals.filter(r => r.consent_status === 'AWAITING_CONSENT').length;
  const trusted = liq?.trusted_sources_count ?? 0;
  const latestMonth = volume?.months?.[volume.months.length - 1];
  const prevMonth = volume?.months?.[volume.months.length - 2];
  const monthDelta = latestMonth && prevMonth && prevMonth.total > 0 ? ((latestMonth.total - prevMonth.total) / prevMonth.total) * 100 : null;
  const go = (p: string) => setActivePage?.(p);

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        <GlassMetric
          title="Cash on hand"
          icon={Wallet}
          value={fmtGHS(cash)}
          trend={{ value: cash >= reserve ? 'Above reserve' : 'Below reserve', isPositive: cash >= reserve }}
          subtitle={`${fmtGHS(reserve)} minimum`}
        />
        <GlassMetric
          title="E-float balance"
          icon={Smartphone}
          value={fmtGHS(float)}
          trend={{ value: shortfall > 0 ? `−${fmtGHS(shortfall)}` : 'Covered', isPositive: shortfall <= 0 }}
          subtitle="vs tomorrow’s demand"
        />
        <GlassMetric
          title="Business health"
          icon={HeartPulse}
          value={`${score} / 100`}
          trend={{ value: score >= 80 ? 'Healthy' : score >= 60 ? 'Watch' : 'At risk', isPositive: score >= 60 }}
          subtitle="Last 14 days"
        />
        <GlassMetric
          title="E-float demand, tomorrow"
          icon={TrendingUp}
          value={fmtGHS(demand)}
          trend={liq?.forecast_confidence ? { value: liq.forecast_confidence, isPositive: !/limited/i.test(liq.forecast_confidence) } : undefined}
          subtitle="XGBoost forecast"
        />
      </div>

      {/* Chart + attention */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_420px] gap-5">
        <SectionCard
          title="Transaction value by month"
          icon={BarChart3}
          actions={
            monthDelta !== null ? (
              <span className={`text-[12px] font-semibold px-2 py-1 rounded-md ${monthDelta >= 0 ? 'bg-[var(--mf-success-soft)] text-[var(--mf-success-ink)]' : 'bg-[var(--mf-danger-soft)] text-[var(--mf-danger-ink)]'}`}>
                {monthDelta >= 0 ? '+' : ''}{monthDelta.toFixed(1)}% vs prior month
              </span>
            ) : undefined
          }
        >
          {volume && volume.months.length > 0 ? (
            <>
              <ChartLegend series={VOLUME_SERIES} showProjection={!!volume.projection} />
              <StackedMonthlyChart data={volume.months} series={VOLUME_SERIES} projection={volume.projection} height={420} />
            </>
          ) : (
            <div className="h-72 flex items-center justify-center text-[14px] text-[var(--mf-text-secondary)]">No transaction history yet.</div>
          )}
        </SectionCard>

        <SectionCard title="Needs attention" icon={AlertTriangle}>
          {rec && shortfall > 0 && !dismissed ? (
            <SuggestionCard
              badge={liq?.warning_level === 'High' ? 'Act before opening' : 'Recommended'}
              title={`Move ${fmtGHS(rec.recommended_amount)} from cash to e-float by ${rec.recommended_time}`}
              body={`Tomorrow’s e-float demand is forecast at ${fmtGHS(demand)}, ${fmtGHS(shortfall)} above your current float.${
                liq?.reserve_violated ? ` This dips below your ${fmtGHS(reserve)} cash reserve, so cover part of it from your liquidity network.` : ''
              }`}
              primaryLabel="Open liquidity plan"
              onPrimary={() => go('liquidity')}
              secondaryLabel="Not now"
              onSecondary={() => setDismissed(true)}
            />
          ) : (
            <SuggestionCard
              label="Liquidity check"
              badge="Covered"
              badgeTone="success"
              title="Your float covers tomorrow’s forecast demand"
              body={`Forecast e-float demand is ${fmtGHS(demand)} against ${fmtGHS(float)} on hand. No rebalancing needed.`}
            />
          )}
          <AttentionRow
            icon={ShieldAlert}
            title={anomalies.length ? `${anomalies.length} unusual transaction${anomalies.length > 1 ? 's' : ''}` : 'No unusual activity'}
            detail="Flagged by the anomaly model"
            status={anomalies.length ? 'To review' : 'Clear'}
            tone={anomalies.length ? 'warning' : 'success'}
            onClick={() => go('ai-insights')}
          />
          <AttentionRow
            icon={Clock}
            title={awaitingConsent ? `${awaitingConsent} referral${awaitingConsent > 1 ? 's' : ''} awaiting consent` : `${referrals.length} customer referral${referrals.length === 1 ? '' : 's'}`}
            detail={awaitingConsent ? 'Customer must approve on USSD' : 'No consent requests pending'}
            status={awaitingConsent ? 'Waiting' : 'Up to date'}
            tone={awaitingConsent ? 'warning' : 'success'}
            onClick={() => go('referrals')}
          />
          <AttentionRow
            icon={Users}
            title={`${trusted} trusted liquidity source${trusted === 1 ? '' : 's'}`}
            detail="Super agents and peers for emergency float"
            status={trusted ? 'Ready' : 'Add one'}
            tone={trusted ? 'success' : 'warning'}
            onClick={() => go('trusted-sources')}
          />
        </SectionCard>
      </div>

      {/* Health breakdown + recent transactions */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_420px] gap-5">
        <SectionCard title="Business health breakdown" icon={PieChart} actions={<PillButton onClick={() => go('analytics')}>Analytics</PillButton>}>
          {m ? (
            <div>
              <ProgressRow label="Commission consistency" value={m.commission_consistency} valueText={`${Math.round(m.commission_consistency)} of 100`} chipText={`${Math.round(m.commission_consistency)}%`} tone={healthTone(m.commission_consistency)} />
              <ProgressRow label="Volume growth" value={m.volume_growth} valueText={`${Math.round(m.volume_growth)} of 100`} chipText={`${Math.round(m.volume_growth)}%`} tone={healthTone(m.volume_growth)} />
              <ProgressRow label="Liquidity stability" value={m.liquidity_stability} valueText={`${Math.round(m.liquidity_stability)} of 100`} chipText={`${Math.round(m.liquidity_stability)}%`} tone={healthTone(m.liquidity_stability)} />
              <ProgressRow label="Anomaly penalty" value={m.anomaly_penalty} valueText={m.anomaly_penalty > 0 ? `−${Math.round(m.anomaly_penalty)} points` : 'No deductions'} chipText={m.anomaly_penalty > 0 ? `−${Math.round(m.anomaly_penalty)}` : '0'} tone={m.anomaly_penalty <= 10 ? 'success' : m.anomaly_penalty <= 20 ? 'warning' : 'danger'} />
              <ProgressRow label="14-day volume" value={100} valueText={fmtGHS(m.recent_volume)} chipText={fmtGHS(m.recent_commission)} tone="success" />
              {health?.insights?.[0] && (
                <p className="text-[13px] text-[var(--mf-text-secondary)] mt-3 pt-3 border-t border-[var(--mf-border)]">{health.insights[0]}</p>
              )}
            </div>
          ) : (
            <p className="text-[14px] text-[var(--mf-text-secondary)]">Not enough activity to score this branch yet.</p>
          )}
        </SectionCard>

        <SectionCard title="Recent transactions" icon={List} actions={<button onClick={() => go('transactions')} className="text-[13px] font-medium text-[var(--mf-text-primary)] hover:text-[var(--mf-accent-ink)] cursor-pointer">View all</button>}>
          {txs.length === 0 ? (
            <p className="text-[14px] text-[var(--mf-text-secondary)]">No transactions yet.</p>
          ) : txs.slice(0, 5).map(t => {
            const meta = TX_META[t.transaction_type] || { label: t.transaction_type, icon: Receipt };
            const inflow = t.direction === 'inflow';
            const when = new Date(t.timestamp);
            return (
              <ActivityRow
                key={t.transaction_id}
                icon={meta.icon}
                title={t.customer_id ? `${meta.label} · #${t.customer_id}` : meta.label}
                meta={`${when.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · ${when.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                amount={`${inflow ? '+' : '−'}${fmtGHS(t.amount, { decimals: 2 })}`}
                positive={inflow}
              />
            );
          })}
        </SectionCard>
      </div>
    </div>
  );
};

// ===========================================================================
// Financial institution overview
// ===========================================================================
const RISK_COLORS: Record<string, string> = {
  'Low': 'var(--mf-chart-1)',
  'Moderate-Low': 'var(--mf-chart-2)',
  'Moderate-High': 'var(--mf-chart-4)',
  'High': 'var(--mf-danger)',
};

const InstitutionOverview: React.FC<{ setActivePage?: (p: string) => void }> = ({ setActivePage }) => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [referrals, setReferrals] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [s, r] = await Promise.all([
        ApiService.getPortfolioSummary().catch(e => { console.error(e); return null; }),
        ApiService.getInstitutionReferrals().catch(e => { console.error(e); return []; }),
      ]);
      setSummary(s); setReferrals(r || []);
      setLoading(false);
    })();
  }, []);

  const derived = useMemo(() => {
    const now = Date.now();
    const awaitingDecision = referrals.filter(r =>
      r.consent_status === 'CONSENT_ACTIVE' && ['PENDING', 'UNDER_REVIEW', 'MANUAL_REVIEW'].includes(r.application_status)
    );
    const awaitingConsent = referrals.filter(r => r.consent_status === 'AWAITING_CONSENT');
    const expiringSoon = referrals.filter(r =>
      r.consent_status === 'CONSENT_ACTIVE' && r.consent_expiry && new Date(r.consent_expiry).getTime() - now < 14 * 864e5
    );
    const decided = referrals.filter(r => ['APPROVED', 'REJECTED'].includes(r.application_status));
    return { awaitingDecision, awaitingConsent, expiringSoon, decided };
  }, [referrals]);

  if (loading) return <LoadingBlock />;

  const consented = summary?.consented_customers ?? 0;
  const ready = summary?.credit_ready_customers ?? 0;
  const avgScore = summary?.average_credit_score ?? 0;
  const capacity = summary?.indicative_credit_capacity ?? 0;
  const pipeline = summary?.pipeline ?? { building_history: 0, consent_required: 0, credit_ready: 0, assessed: 0 };
  const pipelineTotal = Math.max(1, pipeline.building_history + pipeline.consent_required + pipeline.credit_ready + pipeline.assessed);
  const risk: any[] = summary?.risk_distribution ?? [];
  const events: any[] = summary?.recent_events ?? [];
  const next = derived.awaitingDecision[0];
  const go = (p: string) => setActivePage?.(p);
  const pct = (n: number) => Math.round((n / pipelineTotal) * 100);

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        <GlassMetric title="Consented customers" icon={Users} value={consented.toLocaleString()} subtitle="Opted in to alternative profiling" />
        <GlassMetric
          title="Credit-ready"
          icon={BadgeCheck}
          value={ready.toLocaleString()}
          trend={{ value: `${consented ? Math.round((ready / consented) * 100) : 0}%`, isPositive: true }}
          subtitle="of consented customers"
        />
        <GlassMetric
          title="Average alternative score"
          icon={Gauge}
          value={avgScore ? `${Math.round(avgScore)}` : '—'}
          trend={avgScore ? { value: avgScore >= 700 ? 'Low risk' : avgScore >= 600 ? 'Moderate' : 'Elevated', isPositive: avgScore >= 600 } : undefined}
          subtitle="Scale 300–850"
        />
        <GlassMetric title="Indicative capacity" icon={Landmark} value={fmtGHS(capacity)} subtitle="Guidance only, not an approval" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_420px] gap-5">
        <SectionCard title="Risk distribution of assessed customers" icon={BarChart3}>
          {risk.some(r => r.count > 0) ? (
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={risk} margin={{ top: 8, right: 4, left: 4, bottom: 0 }} barCategoryGap="30%">
                  <CartesianGrid vertical={false} stroke="var(--mf-chart-grid)" />
                  <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: 'var(--mf-text-secondary)' }} dy={8} />
                  <YAxis axisLine={false} tickLine={false} allowDecimals={false} width={40} tick={{ fontSize: 12, fill: 'var(--mf-text-muted)' }} />
                  <Tooltip cursor={{ fill: 'var(--mf-card-glass)' }} formatter={(v: any) => [`${v} customers`, 'Assessed']} />
                  <Bar dataKey="count" radius={[10, 10, 10, 10]} isAnimationActive={false}>
                    {risk.map((r, i) => <Cell key={i} fill={RISK_COLORS[r.category] || 'var(--mf-chart-2)'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex flex-col items-center justify-center text-center gap-2">
              <Hourglass className="h-6 w-6 text-[var(--mf-text-muted)]" />
              <p className="text-[14px] text-[var(--mf-text-secondary)] max-w-sm">No customers have been scored yet. Scores appear once a consenting customer has 90 days and 30 transactions of history.</p>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Needs attention" icon={AlertTriangle}>
          {next ? (
            <SuggestionCard
              badge="Needs decision"
              title={`Review ${next.customer_name} · ${fmtGHS(next.requested_amount)} requested`}
              body={`Referred by ${next.agent_name}. Consent is active${next.consent_expiry ? ` until ${new Date(next.consent_expiry).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` : ''}, so their explainable profile is available.`}
              primaryLabel="Open application"
              onPrimary={() => go('referrals')}
            />
          ) : (
            <SuggestionCard
              label="Applications"
              badge="Clear"
              badgeTone="success"
              title="No applications are waiting on a decision"
              body="New agent referrals appear here once the customer approves sharing on USSD."
            />
          )}
          <AttentionRow
            icon={FileCheck2}
            title={`${derived.awaitingDecision.length} application${derived.awaitingDecision.length === 1 ? '' : 's'} to decide`}
            detail="Consent active, decision pending"
            status={derived.awaitingDecision.length ? 'Waiting' : 'Clear'}
            tone={derived.awaitingDecision.length ? 'warning' : 'success'}
            onClick={() => go('referrals')}
          />
          <AttentionRow
            icon={Clock}
            title={`${derived.awaitingConsent.length} awaiting customer consent`}
            detail="USSD prompt sent by the agent"
            status={derived.awaitingConsent.length ? 'Pending' : 'None'}
            tone={derived.awaitingConsent.length ? 'info' : 'neutral'}
          />
          <AttentionRow
            icon={CalendarClock}
            title={`${derived.expiringSoon.length} consent${derived.expiringSoon.length === 1 ? '' : 's'} expiring soon`}
            detail="Within 14 days; access ends automatically"
            status={derived.expiringSoon.length ? 'Soon' : 'None'}
            tone={derived.expiringSoon.length ? 'danger' : 'neutral'}
          />
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_420px] gap-5">
        <SectionCard title="Credit readiness pipeline" icon={PieChart} actions={<PillButton onClick={() => go('credit')}>Customers</PillButton>}>
          <ProgressRow label="Building history" value={pct(pipeline.building_history)} valueText={`${pipeline.building_history} customers`} chipText={`${pct(pipeline.building_history)}%`} tone="warning" />
          <ProgressRow label="Consent required" value={pct(pipeline.consent_required)} valueText={`${pipeline.consent_required} customers`} chipText={`${pct(pipeline.consent_required)}%`} tone="danger" />
          <ProgressRow label="Credit-ready" value={pct(pipeline.credit_ready)} valueText={`${pipeline.credit_ready} customers`} chipText={`${pct(pipeline.credit_ready)}%`} tone="success" />
          <ProgressRow label="Assessed" value={pct(pipeline.assessed)} valueText={`${pipeline.assessed} customers`} chipText={`${pct(pipeline.assessed)}%`} tone="success" />
          <p className="text-[13px] text-[var(--mf-text-secondary)] mt-3 pt-3 border-t border-[var(--mf-border)]">
            Customers without 90 days and 30 transactions get a Financial Readiness Score instead of a credit score.
          </p>
        </SectionCard>

        <SectionCard title="Recent credit activity" icon={List} actions={<button onClick={() => go('referrals')} className="text-[13px] font-medium hover:text-[var(--mf-accent-ink)] cursor-pointer">View all</button>}>
          {events.length === 0 && derived.decided.length === 0 ? (
            <p className="text-[14px] text-[var(--mf-text-secondary)]">No assessments yet.</p>
          ) : (
            <>
              {events.slice(0, 4).map((ev, i) => (
                <ActivityRow
                  key={`e${i}`}
                  icon={ev.score !== null && ev.score !== undefined ? Gauge : Hourglass}
                  title={`Customer #${ev.customer_id}`}
                  meta={ev.event_type}
                  amount={ev.score !== null && ev.score !== undefined ? `${ev.score}` : 'Readiness'}
                  positive={ev.score >= 700}
                />
              ))}
              {derived.decided.slice(0, Math.max(0, 4 - events.length)).map(r => (
                <ActivityRow
                  key={`d${r.referral_id}`}
                  icon={CheckCircle2}
                  title={r.customer_name}
                  meta={`Decision · ${r.application_status.toLowerCase()}`}
                  amount={fmtGHS(r.requested_amount)}
                  positive={r.application_status === 'APPROVED'}
                />
              ))}
            </>
          )}
        </SectionCard>
      </div>
    </div>
  );
};

export default Dashboard;
