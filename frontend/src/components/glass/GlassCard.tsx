import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', ...props }) => {
  return (
    <div 
      className={`bg-[var(--mf-card-glass)] border border-[var(--mf-border)] rounded-xl p-4 transition-all duration-300 hover:border-white/20 hover:bg-white/5 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default GlassCard;
