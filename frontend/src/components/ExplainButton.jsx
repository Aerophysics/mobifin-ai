import React, { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';

const ExplainButton = ({ title, explanation }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1 text-base font-medium hover:underline"
        style={{ color: '#ffffff', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        <HelpCircle size={16} /> Explain simply
      </button>

      {isOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(10, 15, 24, 0.8)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: '1rem'
        }} onClick={() => setIsOpen(false)}>
          <div 
            className="card fade-in" 
            style={{ maxWidth: '400px', width: '100%', position: 'relative' }}
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setIsOpen(false)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
            <div className="flex items-center gap-2 mb-4">
              <HelpCircle className="text-brand" size={24} />
              <h3 className="m-0 text-lg">Explain Like I'm New</h3>
            </div>
            <p className="text-sm text-secondary mb-4"><strong>{title}</strong></p>
            <p className="text-sm leading-relaxed">{explanation}</p>
            <button className="btn btn-primary w-full mt-6" onClick={() => setIsOpen(false)}>
              Got it, thanks!
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ExplainButton;
