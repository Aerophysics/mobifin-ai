import React from 'react';

interface GlassTableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  headers: string[];
  children: React.ReactNode;
  className?: string;
  alignRightIndexes?: number[];
}

export const GlassTable: React.FC<GlassTableProps> = ({
  headers,
  children,
  className = '',
  alignRightIndexes = [],
  ...props
}) => {
  return (
    <div className="overflow-x-auto w-full">
      <table className={`w-full text-left text-xs border-collapse ${className}`} {...props}>
        <thead>
          <tr className="border-b border-[var(--mf-border)] text-[var(--mf-text-secondary)] font-semibold uppercase">
            {headers.map((h, i) => (
              <th 
                key={i} 
                className={`py-3 px-2 ${alignRightIndexes.includes(i) ? 'text-right' : ''}`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--mf-border)] text-[var(--mf-text-primary)]">
          {children}
        </tbody>
      </table>
    </div>
  );
};

export default GlassTable;
