import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

/** Inner tile, used inside panels for grouped stats and list items. */
export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`bg-[var(--mf-card-glass)] border border-[var(--mf-border)] rounded-2xl p-4 transition-colors duration-200 hover:border-[var(--mf-border-strong)] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default GlassCard;
