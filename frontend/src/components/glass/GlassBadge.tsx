import React from 'react';

interface GlassBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  className?: string;
}

export const GlassBadge: React.FC<GlassBadgeProps> = ({
  children,
  variant = 'neutral',
  className = '',
  ...props
}) => {
  const getVariantClass = () => {
    switch (variant) {
      case 'success':
        return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
      case 'warning':
        return 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
      case 'danger':
        return 'bg-rose-500/10 text-rose-500 border border-rose-500/20';
      case 'info':
        return 'bg-sky-500/10 text-sky-500 border border-sky-500/20';
      case 'neutral':
      default:
        return 'bg-white/5 border border-[var(--mf-border)] text-[var(--mf-text-secondary)]';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${getVariantClass()} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

export default GlassBadge;
