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
        return 'bg-[var(--mf-accent)] text-white hover:bg-[var(--mf-accent)]/85 shadow-md';
      case 'danger':
        return 'bg-rose-500/10 text-rose-500 border border-rose-500/25 hover:bg-rose-500/20';
      case 'secondary':
      default:
        return 'bg-white/5 dark:bg-white/5 border border-[var(--mf-border)] text-[var(--mf-text-primary)] hover:bg-white/10 dark:hover:bg-white/10 hover:border-white/20';
    }
  };

  return (
    <button
      className={`h-[42px] px-4 font-semibold text-xs rounded-xl transition-all duration-300 flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${getVariantClass()} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default GlassButton;
