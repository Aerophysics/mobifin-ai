import React, { useEffect, useState } from 'react';
import { ShieldCheck, ShieldAlert, KeyRound, CheckSquare, Search } from 'lucide-react';
import ApiService from '../services/api';
import { CustomerProfile } from '../types';
import { GlassPanel } from '../components/glass/GlassPanel';
import { GlassCard } from '../components/glass/GlassCard';
import { GlassButton } from '../components/glass/GlassButton';
import { GlassBadge } from '../components/glass/GlassBadge';
import { GlassTable } from '../components/glass/GlassTable';

const ConsentFlow: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const res = await ApiService.listCustomers();
      setCustomers(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleConsent = async (customerId: number, currentStatus: boolean) => {
    try {
      await ApiService.updateConsent(customerId, !currentStatus);
      setCustomers(prev => 
        prev.map(c => 
          c.customer_id === customerId 
            ? { ...c, consent_status: !currentStatus, consent_timestamp: !currentStatus ? new Date().toISOString() : null } 
            : c
        )
      );
    } catch (e: any) {
      alert(`Failed to update consent status: ${e.message}`);
    }
  };

  const filtered = customers.filter(c => 
    c.display_name.toLowerCase().includes(search.toLowerCase()) || 
    c.customer_id.toString().includes(search)
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fadeIn pb-8">
      {/* Consent Explanation Info */}
      <GlassPanel className="p-5 flex flex-col space-y-4">
        <div className="flex items-center space-x-2 border-b border-[var(--mf-border)] pb-2.5">
          <KeyRound className="h-4.5 w-4.5 text-[var(--mf-accent)]" />
          <h3 className="font-bold text-xs uppercase tracking-wider text-[var(--mf-text-primary)]">Responsible Customer Credit Profiling</h3>
        </div>
        <p className="text-xs text-[var(--mf-text-secondary)] leading-relaxed">
          MobiFin AI utilizes customer mobile-money transaction behavior as alternative financial data to construct financial profiles. 
          This profiling is <strong>strictly opt-in</strong>. Transaction records are only evaluated for credit maturity or scores 
          once explicit consent is actively recorded. Customers have the right to revoke consent at any time, instantly locking access 
          to their credit scoring intelligence.
        </p>
        <div className="flex items-center space-x-2 bg-white/5 p-2.5 rounded-lg border border-[var(--mf-border)] text-[10px] text-[var(--mf-accent)] font-semibold">
          <ShieldCheck className="h-4 w-4 flex-shrink-0" />
          <span>Opt-in consent enables alternative underwriting decision-support metrics for unbanked and underbanked users.</span>
        </div>
      </GlassPanel>

      {/* Customer Consent Directory */}
      <GlassPanel className="p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-[var(--mf-text-primary)] text-xs uppercase tracking-wider">Customer Consent Directory</h3>
            <p className="text-[10px] text-[var(--mf-text-secondary)]">Verify or update customer profiling consent statuses</p>
          </div>
          <div className="relative w-full md:w-64">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search Customer ID..."
              className="text-xs bg-white/5 border border-[var(--mf-border)] rounded-xl pl-8 pr-3 py-2 w-full focus:outline-none focus:border-[var(--mf-accent)] transition text-[var(--mf-text-primary)]"
            />
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[var(--mf-text-secondary)]" />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[var(--mf-accent)]"></div>
          </div>
        ) : (
          <GlassTable 
            headers={["Customer ID", "Display Name", "Created At", "Consent Status", "Timestamp", "Actions"]}
            alignRightIndexes={[5]}
          >
            {filtered.map(c => (
              <tr key={c.customer_id} className="hover:bg-white/5 transition-colors">
                <td className="py-3 px-2 font-mono text-[var(--mf-text-secondary)]">#{c.customer_id}</td>
                <td className="py-3 px-2 font-semibold text-[var(--mf-text-primary)]">{c.display_name}</td>
                <td className="py-3 px-2 text-[var(--mf-text-secondary)]">
                  {new Date(c.created_at).toLocaleDateString()}
                </td>
                <td className="py-3 px-2">
                  <GlassBadge variant={c.consent_status ? 'success' : 'neutral'}>
                    {c.consent_status ? 'Active Opt-in' : 'Declined/Unsigned'}
                  </GlassBadge>
                </td>
                <td className="py-3 px-2 text-[var(--mf-text-secondary)] font-mono text-[10px]">
                  {c.consent_timestamp ? new Date(c.consent_timestamp).toLocaleString() : '—'}
                </td>
                <td className="py-3 px-2 text-right">
                  <GlassButton
                    onClick={() => handleToggleConsent(c.customer_id, c.consent_status)}
                    className="text-[9px] font-extrabold uppercase py-1.5 px-3 tracking-wider"
                    variant={c.consent_status ? 'secondary' : 'primary'}
                  >
                    {c.consent_status ? 'Revoke Consent' : 'Grant Consent'}
                  </GlassButton>
                </td>
              </tr>
            ))}
          </GlassTable>
        )}
      </GlassPanel>
    </div>
  );
};

export default ConsentFlow;
