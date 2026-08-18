import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

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

export const GlassMetric: React.FC<GlassMetricProps> = ({
  title,
  value,
  trend,
  icon: Icon,
  iconColorClass = 'text-[var(--mf-accent)]',
  className = '',
  subtitle,
  ...props
}) => {
  return (
    <div 
      className={`backdrop-blur-[20px] saturate-[140%] bg-[var(--mf-surface-glass)] border border-[var(--mf-border)] rounded-[20px] p-5 shadow-lg flex items-center justify-between transition-all duration-300 hover:shadow-xl hover:border-white/20 ${className}`}
      {...props}
    >
      <div className="space-y-1.5 overflow-hidden">
        <span className="text-[10px] text-[var(--mf-text-secondary)] font-bold uppercase tracking-wider block">
          {title}
        </span>
        <span className="text-2xl sm:text-3xl font-bold text-[var(--mf-text-primary)] block tracking-tight truncate">
          {value}
        </span>
        {(trend || subtitle) && (
          <div className="flex items-center space-x-1.5 mt-1 overflow-hidden">
            {trend && (
              <span className={`inline-flex items-center text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                trend.isPositive 
                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                  : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
              }`}>
                {trend.isPositive ? (
                  <ArrowUpRight className="h-2.5 w-2.5 mr-0.5" />
                ) : (
                  <ArrowDownRight className="h-2.5 w-2.5 mr-0.5" />
                )}
                {trend.value}
              </span>
            )}
            {subtitle && (
              <span className="text-[10px] text-[var(--mf-text-secondary)] truncate">
                {subtitle}
              </span>
            )}
          </div>
        )}
      </div>

      {Icon && (
        <div className={`h-[44px] w-[44px] rounded-xl flex items-center justify-center flex-shrink-0 bg-white/5 border border-white/10 ${iconColorClass}`}>
          <Icon className="h-5 w-5" />
        </div>
      )}
    </div>
  );
};

export default GlassMetric;
