import React from 'react';

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'danger';
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  children,
  className = '',
  variant = 'secondary',
  ...props
}) => {
  const getVariantClass = () => {
    switch (variant) {
      case 'primary':
        return 'mf-solid bg-[var(--mf-accent)] text-white border border-transparent hover:bg-[var(--mf-accent-hover)]';
      case 'danger':
        return 'bg-[var(--mf-danger-soft)] text-[var(--mf-danger-ink)] border border-transparent hover:brightness-95';
      case 'secondary':
      default:
        return 'bg-[var(--mf-surface)] border border-[var(--mf-border-strong)] text-[var(--mf-text-primary)] hover:bg-[var(--mf-card-glass)]';
    }
  };

  return (
    <button
      className={`h-[40px] px-4 font-semibold text-[13px] rounded-full transition-colors duration-200 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${getVariantClass()} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default GlassButton;
