import React from 'react';

const RiskIndicator = ({ level, score, showScore = false, className = '' }) => {
  let colorClass = 'badge-success'; // Low
  
  if (level === 'Medium') colorClass = 'badge-warning';
  else if (level === 'High') colorClass = 'badge-danger';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className={`badge ${colorClass}`}>
        {level} Risk
      </span>
      {showScore && <span className="text-sm text-secondary font-medium">{score}/100</span>}
    </div>
  );
};

export default RiskIndicator;
