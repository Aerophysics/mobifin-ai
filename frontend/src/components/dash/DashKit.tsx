import React from 'react';
import { Sparkles } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------
export const fmtGHS = (n: number | null | undefined, opts: { decimals?: number } = {}) => {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  const d = opts.decimals ?? 0;
  return `GH₵${n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d })}`;
};

export const fmtCompactGHS = (n: number) => {
  if (Math.abs(n) >= 1_000_000) return `GH₵${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (Math.abs(n) >= 1_000) return `GH₵${Math.round(n / 1_000)}K`;
  return `GH₵${Math.round(n)}`;
};

export const monthLabel = (ym: string, withYear = false) => {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, (m || 1) - 1, 1);
  return d.toLocaleString(undefined, withYear ? { month: 'long', year: 'numeric' } : { month: 'short' });
};

// ---------------------------------------------------------------------------
// Section card with Ebbline-style header (icon tile + title + actions)
// ---------------------------------------------------------------------------
interface SectionCardProps {
  title: string;
  icon?: React.ComponentType<any>;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}

export const SectionCard: React.FC<SectionCardProps> = ({ title, icon: Icon, actions, children, className = '', bodyClassName = '' }) => (
  <section className={`bg-[var(--mf-surface)] border border-[var(--mf-border)] rounded-[22px] shadow-[var(--mf-shadow-card)] p-5 sm:p-6 flex flex-col ${className}`}>
    <header className="flex items-center justify-between gap-3 mb-5">
      <div className="flex items-center gap-3 min-w-0">
        {Icon && (
          <span className="h-10 w-10 rounded-xl border border-[var(--mf-border)] flex items-center justify-center text-[var(--mf-text-secondary)] flex-shrink-0">
            <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </span>
        )}
        <h3 className="mf-display text-lg sm:text-[20px] font-semibold text-[var(--mf-text-primary)] truncate">{title}</h3>
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </header>
    <div className={`flex-1 ${bodyClassName}`}>{children}</div>
  </section>
);

export const PillButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { icon?: React.ComponentType<any> }> = ({ icon: Icon, children, className = '', ...props }) => (
  <button
    className={`h-9 px-3.5 rounded-full border border-[var(--mf-border-strong)] bg-[var(--mf-surface)] text-[13px] font-medium text-[var(--mf-text-primary)] flex items-center gap-1.5 hover:bg-[var(--mf-card-glass)] transition-colors cursor-pointer ${className}`}
    {...props}
  >
    {Icon && <Icon className="h-4 w-4 text-[var(--mf-text-secondary)]" strokeWidth={1.75} />}
    {children}
  </button>
);

// ---------------------------------------------------------------------------
// "Needs attention" rows and the analyst suggestion card
// ---------------------------------------------------------------------------
type Tone = 'danger' | 'warning' | 'success' | 'info' | 'neutral';
const toneDot: Record<Tone, string> = {
  danger: 'bg-[var(--mf-danger)]',
  warning: 'bg-[var(--mf-warning)]',
  success: 'bg-[var(--mf-success)]',
  info: 'bg-[var(--mf-info-ink)]',
  neutral: 'bg-[var(--mf-text-muted)]',
};

interface AttentionRowProps {
  icon: React.ComponentType<any>;
  title: string;
  detail: string;
  status: string;
  tone?: Tone;
  onClick?: () => void;
}

export const AttentionRow: React.FC<AttentionRowProps> = ({ icon: Icon, title, detail, status, tone = 'neutral', onClick }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={!onClick}
    className="w-full flex items-center gap-3.5 py-3.5 text-left border-t border-[var(--mf-border)] first:border-t-0 bg-transparent cursor-pointer disabled:cursor-default group"
  >
    <span className="h-10 w-10 rounded-xl border border-[var(--mf-border)] flex items-center justify-center text-[var(--mf-text-secondary)] flex-shrink-0">
      <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
    </span>
    <span className="flex-1 min-w-0">
      <span className="block text-[14px] font-semibold text-[var(--mf-text-primary)] truncate group-enabled:group-hover:text-[var(--mf-accent-ink)]">{title}</span>
      <span className="block text-[13px] text-[var(--mf-text-secondary)] truncate">{detail}</span>
    </span>
    <span className="flex items-center gap-1.5 text-[13px] text-[var(--mf-text-primary)] flex-shrink-0">
      <span className={`h-1.5 w-1.5 rounded-full ${toneDot[tone]}`} />
      {status}
    </span>
  </button>
);

interface SuggestionCardProps {
  label?: string;
  badge?: string;
  badgeTone?: 'warning' | 'success';
  title: string;
  body: string;
  primaryLabel?: string;
  onPrimary?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}

export const SuggestionCard: React.FC<SuggestionCardProps> = ({
  label = 'MobiFin suggestion', badge, badgeTone = 'warning', title, body,
  primaryLabel, onPrimary, secondaryLabel, onSecondary,
}) => (
  <div className="rounded-2xl bg-[var(--mf-accent-soft)] border border-[color-mix(in_srgb,var(--mf-accent)_14%,transparent)] p-4 sm:p-5 mb-2">
    <div className="flex items-center justify-between gap-2 mb-2">
      <span className="flex items-center gap-1.5 text-[13px] font-semibold text-[var(--mf-accent-ink)]">
        <Sparkles className="h-3.5 w-3.5" /> {label}
      </span>
      {badge && (
        <span className={`text-[12px] font-semibold px-2 py-0.5 rounded-md ${
          badgeTone === 'warning'
            ? 'bg-[var(--mf-warning-soft)] text-[var(--mf-warning-ink)]'
            : 'bg-[var(--mf-success-soft)] text-[var(--mf-success-ink)]'
        }`}>{badge}</span>
      )}
    </div>
    <p className="text-[16px] font-semibold text-[var(--mf-text-primary)] leading-snug">{title}</p>
    <p className="text-[13px] text-[var(--mf-text-secondary)] mt-1.5 leading-relaxed">{body}</p>
    {(primaryLabel || secondaryLabel) && (
      <div className="flex flex-wrap gap-2 mt-4">
        {primaryLabel && (
          <button onClick={onPrimary} className="mf-solid h-9 px-4 rounded-full bg-[var(--mf-accent)] hover:bg-[var(--mf-accent-hover)] text-white text-[13px] font-semibold cursor-pointer transition-colors">
            {primaryLabel}
          </button>
        )}
        {secondaryLabel && (
          <button onClick={onSecondary} className="h-9 px-4 rounded-full bg-[var(--mf-surface)] border border-[var(--mf-border)] text-[var(--mf-text-primary)] text-[13px] font-medium cursor-pointer hover:bg-[var(--mf-card-glass)] transition-colors">
            {secondaryLabel}
          </button>
        )}
      </div>
    )}
  </div>
);

// ---------------------------------------------------------------------------
// Progress row (budget-style bar with value text and percentage chip)
// ---------------------------------------------------------------------------
interface ProgressRowProps {
  label: string;
  value: number; // 0-100+
  valueText: string;
  chipText?: string;
  tone?: 'success' | 'warning' | 'danger';
}

const barTone = { success: 'bg-[var(--mf-success)]', warning: 'bg-[#c9700a]', danger: 'bg-[var(--mf-danger)]' };
const chipTone = {
  success: 'bg-[var(--mf-success-soft)] text-[var(--mf-success-ink)]',
  warning: 'bg-[var(--mf-warning-soft)] text-[var(--mf-warning-ink)]',
  danger: 'bg-[var(--mf-danger-soft)] text-[var(--mf-danger-ink)]',
};

export const ProgressRow: React.FC<ProgressRowProps> = ({ label, value, valueText, chipText, tone = 'success' }) => (
  <div className="grid grid-cols-[minmax(110px,180px)_1fr_auto] sm:grid-cols-[190px_1fr_minmax(130px,auto)_56px] items-center gap-x-4 gap-y-1 py-2.5">
    <span className="text-[14px] text-[var(--mf-text-primary)] truncate">{label}</span>
    <span className="h-2 rounded-full bg-[var(--mf-card-glass)] overflow-hidden">
      <span className={`block h-full rounded-full ${barTone[tone]}`} style={{ width: `${Math.max(2, Math.min(100, value))}%` }} />
    </span>
    <span className="hidden sm:block text-[13px] text-[var(--mf-text-secondary)] text-right mf-tabular">{valueText}</span>
    {chipText && (
      <span className={`justify-self-end text-[11px] font-semibold px-1.5 py-0.5 rounded-md mf-tabular ${chipTone[tone]}`}>{chipText}</span>
    )}
  </div>
);

// ---------------------------------------------------------------------------
// Transaction / activity list row
// ---------------------------------------------------------------------------
interface ActivityRowProps {
  icon: React.ComponentType<any>;
  title: string;
  meta: string;
  amount: string;
  positive?: boolean;
}

export const ActivityRow: React.FC<ActivityRowProps> = ({ icon: Icon, title, meta, amount, positive }) => (
  <div className="flex items-center gap-3.5 py-3 border-t border-[var(--mf-border)] first:border-t-0">
    <span className="h-10 w-10 rounded-xl border border-[var(--mf-border)] flex items-center justify-center text-[var(--mf-text-secondary)] flex-shrink-0">
      <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
    </span>
    <span className="flex-1 min-w-0">
      <span className="block text-[14px] font-semibold text-[var(--mf-text-primary)] truncate">{title}</span>
      <span className="block text-[13px] text-[var(--mf-text-secondary)] truncate">{meta}</span>
    </span>
    <span className={`text-[14px] font-semibold mf-tabular flex-shrink-0 ${positive ? 'text-[var(--mf-success-ink)]' : 'text-[var(--mf-text-primary)]'}`}>{amount}</span>
  </div>
);

// ---------------------------------------------------------------------------
// Stacked monthly bar chart with muted history, highlighted latest month and a
// dashed projection bar
// ---------------------------------------------------------------------------
export interface StackSeries {
  key: string;
  label: string;
  color: string;
}

interface StackedMonthlyChartProps {
  data: Array<Record<string, any> & { month: string }>;
  series: StackSeries[];
  projection?: { total: number; basis: string } | null;
  height?: number;
}

const ChartTooltip: React.FC<any> = ({ active, payload, series }) => {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  if (row.__projection) {
    return (
      <div className="bg-[var(--mf-surface)] border border-[var(--mf-border)] rounded-xl shadow-[var(--mf-shadow-pop)] px-4 py-3 text-[13px] min-w-[220px]">
        <div className="text-[12px] text-[var(--mf-text-secondary)] mb-1.5">{row.label} · Projected</div>
        <div className="flex justify-between font-semibold text-[var(--mf-text-primary)]"><span>Total</span><span className="mf-tabular">{fmtGHS(row.__projection)}</span></div>
        <div className="text-[11px] text-[var(--mf-text-muted)] mt-1">{row.__basis}</div>
      </div>
    );
  }
  const total = series.reduce((a: number, s: StackSeries) => a + (row[s.key] || 0), 0);
  return (
    <div className="bg-[var(--mf-surface)] border border-[var(--mf-border)] rounded-xl shadow-[var(--mf-shadow-pop)] px-4 py-3 text-[13px] min-w-[240px]">
      <div className="text-[12px] text-[var(--mf-text-secondary)] mb-2">{monthLabel(row.month, true)} · Actual</div>
      <div className="space-y-1.5">
        {[...series].reverse().map((s: StackSeries) => (
          <div key={s.key} className="flex items-center justify-between gap-6">
            <span className="flex items-center gap-2 text-[var(--mf-text-secondary)]">
              <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: s.color }} />{s.label}
            </span>
            <span className="mf-tabular text-[var(--mf-text-primary)]">{fmtGHS(row[s.key])}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-between font-semibold text-[var(--mf-text-primary)] border-t border-[var(--mf-border)] mt-2.5 pt-2.5">
        <span>Total</span><span className="mf-tabular">{fmtGHS(total)}</span>
      </div>
    </div>
  );
};

export const StackedMonthlyChart: React.FC<StackedMonthlyChartProps> = ({ data, series, projection, height = 320 }) => {
  const rows: any[] = data.map(d => ({ ...d, label: monthLabel(d.month) }));
  if (projection && data.length) {
    const [y, m] = data[data.length - 1].month.split('-').map(Number);
    const next = new Date(y, m, 1);
    const ym = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;
    rows.push({ month: ym, label: monthLabel(ym), __projection: projection.total, __basis: projection.basis });
  }
  const latestIdx = data.length - 1;
  const lastKey = series[series.length - 1].key;

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 4, left: 4, bottom: 0 }} barCategoryGap="28%">
          <CartesianGrid vertical={false} stroke="var(--mf-chart-grid)" />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: 'var(--mf-text-secondary)' }} dy={8} />
          <YAxis axisLine={false} tickLine={false} width={64} tick={{ fontSize: 12, fill: 'var(--mf-text-muted)' }} tickFormatter={fmtCompactGHS} />
          <Tooltip cursor={{ fill: 'var(--mf-card-glass)', radius: 12 } as any} content={<ChartTooltip series={series} />} />
          {series.map(s => (
            <Bar
              key={s.key}
              dataKey={s.key}
              stackId="v"
              fill={s.color}
              stroke="var(--mf-surface)"
              strokeWidth={3}
              radius={[10, 10, 10, 10]}
              isAnimationActive={false}
            >
              {rows.map((_, i) => (
                <Cell key={i} fillOpacity={i === latestIdx ? 1 : 0.5} />
              ))}
            </Bar>
          ))}
          <Bar
            dataKey="__projection"
            stackId="v"
            fill="transparent"
            stroke="var(--mf-border-strong)"
            strokeDasharray="5 4"
            strokeWidth={1.5}
            radius={[10, 10, 10, 10]}
            isAnimationActive={false}
            name={lastKey}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const ChartLegend: React.FC<{ series: StackSeries[]; showProjection?: boolean }> = ({ series, showProjection }) => (
  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-4">
    {series.map(s => (
      <span key={s.key} className="flex items-center gap-2 text-[13px] text-[var(--mf-text-primary)]">
        <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: s.color }} />{s.label}
      </span>
    ))}
    {showProjection && (
      <span className="flex items-center gap-2 text-[13px] text-[var(--mf-text-primary)]">
        <span className="h-2.5 w-2.5 rounded-[3px] border border-dashed border-[var(--mf-text-muted)]" />Projected
      </span>
    )}
  </div>
);

export const LoadingBlock: React.FC = () => (
  <div className="flex items-center justify-center h-80">
    <div className="h-8 w-8 rounded-full border-2 border-[var(--mf-border-strong)] border-t-[var(--mf-accent)] animate-spin" />
  </div>
);
