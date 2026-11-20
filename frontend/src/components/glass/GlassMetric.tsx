import React from 'react';

interface GlassMetricProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  trend?: {
    value: string | number;
    isPositive: boolean;
  };
  icon?: React.ComponentType<any>;
  iconColorClass?: string;
  className?: string;
  subtitle?: string;
}

/** KPI card: icon tile + label, large value, then a delta chip and caption. */
export const GlassMetric: React.FC<GlassMetricProps> = ({
  title,
  value,
  trend,
  icon: Icon,
  iconColorClass = 'text-[var(--mf-text-secondary)]',
  className = '',
  subtitle,
  ...props
}) => {
  return (
    <div
      className={`bg-[var(--mf-surface)] border border-[var(--mf-border)] rounded-[22px] p-5 shadow-[var(--mf-shadow-card)] flex flex-col gap-4 ${className}`}
      {...props}
    >
      <div className="flex items-center gap-3">
        {Icon && (
          <span className={`h-10 w-10 rounded-xl border border-[var(--mf-border)] flex items-center justify-center flex-shrink-0 ${iconColorClass}`}>
            <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </span>
        )}
        <span className="text-[13px] text-[var(--mf-text-secondary)] truncate">{title}</span>
      </div>
      <span className="mf-display mf-tabular text-[28px] leading-none font-semibold text-[var(--mf-text-primary)] truncate">
        {value}
      </span>
      {(trend || subtitle) && (
        <div className="flex items-center gap-2 min-w-0">
          {trend && (
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[11px] font-semibold ${
              trend.isPositive
                ? 'bg-[var(--mf-success-soft)] text-[var(--mf-success-ink)]'
                : 'bg-[var(--mf-danger-soft)] text-[var(--mf-danger-ink)]'
            }`}>
              {trend.value}
            </span>
          )}
          {subtitle && (
            <span className="text-xs text-[var(--mf-text-secondary)] truncate">{subtitle}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default GlassMetric;
