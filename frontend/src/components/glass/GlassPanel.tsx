import React from 'react';

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  intensity?: 'primary' | 'secondary' | 'floating';
}

export const GlassPanel: React.FC<GlassPanelProps> = ({ 
  children, 
  className = '', 
  intensity = 'primary',
  ...props 
}) => {
  const getIntensityClass = () => {
    switch (intensity) {
      case 'secondary':
        return 'bg-[var(--mf-card-glass)] border-[var(--mf-border)] shadow-md';
      case 'floating':
        return 'bg-white/15 dark:bg-white/10 border-white/20 dark:border-white/15 shadow-2xl';
      case 'primary':
      default:
        return 'bg-[var(--mf-surface-glass)] border-[var(--mf-border)] shadow-lg';
    }
  };

  return (
    <div 
      className={`backdrop-blur-[20px] saturate-[140%] rounded-[20px] border ${getIntensityClass()} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default GlassPanel;
