import React from 'react';

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  intensity?: 'primary' | 'secondary' | 'floating';
}

/** Primary surface: a white rounded card on the off-white canvas. */
export const GlassPanel: React.FC<GlassPanelProps> = ({
  children,
  className = '',
  intensity = 'primary',
  ...props
}) => {
  const getIntensityClass = () => {
    switch (intensity) {
      case 'secondary':
        return 'bg-[var(--mf-card-glass)] border-[var(--mf-border)]';
      case 'floating':
        return 'bg-[var(--mf-surface)] border-[var(--mf-border)] shadow-[var(--mf-shadow-pop)]';
      case 'primary':
      default:
        return 'bg-[var(--mf-surface)] border-[var(--mf-border)] shadow-[var(--mf-shadow-card)]';
    }
  };

  return (
    <div
      className={`rounded-[22px] border text-[var(--mf-text-primary)] ${getIntensityClass()} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default GlassPanel;
