import React from 'react';

const Card = ({ children, className = '', title, glass = false }) => {
  return (
    <div className={`${glass ? 'glass-card' : 'card'} ${className}`}>
      {title && <h3 className="card-title mb-4">{title}</h3>}
      {children}
    </div>
  );
};

export default Card;
