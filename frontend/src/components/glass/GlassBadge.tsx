import React from 'react';

interface GlassBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  className?: string;
}

/** Soft status chip (tinted fill, no border). */
export const GlassBadge: React.FC<GlassBadgeProps> = ({
  children,
  variant = 'neutral',
  className = '',
  ...props
}) => {
  const getVariantClass = () => {
    switch (variant) {
      case 'success':
        return 'bg-[var(--mf-success-soft)] text-[var(--mf-success-ink)]';
      case 'warning':
        return 'bg-[var(--mf-warning-soft)] text-[var(--mf-warning-ink)]';
      case 'danger':
        return 'bg-[var(--mf-danger-soft)] text-[var(--mf-danger-ink)]';
      case 'info':
        return 'bg-[var(--mf-info-soft)] text-[var(--mf-info-ink)]';
      case 'neutral':
      default:
        return 'bg-[var(--mf-card-glass)] text-[var(--mf-text-secondary)] border border-[var(--mf-border)]';
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold whitespace-nowrap ${getVariantClass()} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

export default GlassBadge;
