import React from 'react';
import { X } from 'lucide-react';
import { GlassPanel } from './GlassPanel';

interface GlassModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const GlassModal: React.FC<GlassModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className = ''
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal Card */}
      <GlassPanel 
        intensity="floating" 
        className={`w-full max-w-lg z-10 p-6 relative flex flex-col max-h-[90vh] overflow-hidden ${className}`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-[var(--mf-border)]">
          <h3 className="text-sm font-bold text-[var(--mf-text-primary)] uppercase tracking-wider">
            {title}
          </h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/5 text-[var(--mf-text-secondary)] hover:text-[var(--mf-text-primary)] border-none bg-transparent cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto pt-4">
          {children}
        </div>
      </GlassPanel>
    </div>
  );
};

export default GlassModal;
