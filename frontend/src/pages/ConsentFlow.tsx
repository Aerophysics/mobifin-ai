import React, { useEffect, useState } from 'react';
import { ShieldCheck, ShieldAlert, KeyRound, CheckSquare, RefreshCw } from 'lucide-react';
import ApiService from '../services/api';
import { CustomerProfile } from '../types';

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
    <div className="space-y-6 max-w-5xl mx-auto animate-fadeIn">
      {/* Consent Explanation Info */}
      <div className="premium-card bg-slate-900 border-slate-800 text-slate-100 flex flex-col space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-2.5">
          <KeyRound className="h-4.5 w-4.5 text-teal-400" />
          <h3 className="font-bold text-xs uppercase tracking-wider text-white">Responsible Customer Credit Profiling</h3>
        </div>
        <p className="text-xs text-slate-350 leading-relaxed">
          MobiFin AI utilizes customer mobile-money transaction behavior as alternative financial data to construct financial profiles. 
          This profiling is <strong>strictly opt-in</strong>. Transaction records are only evaluated for credit maturity or scores 
          once explicit consent is actively recorded. Customers have the right to revoke consent at any time, instantly locking access 
          to their credit scoring intelligence.
        </p>
        <div className="flex items-center space-x-2 bg-slate-850 p-2.5 rounded-lg border border-slate-800 text-[10px] text-teal-400">
          <ShieldCheck className="h-4 w-4 flex-shrink-0" />
          <span>Opt-in consent enables alternative underwriting decision-support metrics for unbanked and underbanked users.</span>
        </div>
      </div>

      {/* Customer Consent Directory */}
      <div className="premium-card bg-white space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Customer Consent Directory</h3>
            <p className="text-[10px] text-slate-450">Verify or update customer profiling consent statuses</p>
          </div>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search Customer ID..."
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 w-full md:w-64 focus:outline-none focus:border-slate-800 transition"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-teal-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase">
                  <th className="py-3">Customer ID</th>
                  <th className="py-3">Display Name</th>
                  <th className="py-3">Created At</th>
                  <th className="py-3">Consent Status</th>
                  <th className="py-3">Timestamp</th>
                  <th className="py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.map(c => (
                  <tr key={c.customer_id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 font-mono text-slate-500">#{c.customer_id}</td>
                    <td className="py-3.5 font-semibold text-slate-800">{c.display_name}</td>
                    <td className="py-3.5 text-slate-400">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold uppercase text-[9px] ${
                        c.consent_status 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                          : 'bg-slate-50 text-slate-400 border border-slate-200'
                      }`}>
                        {c.consent_status ? 'Active Opt-in' : 'Declined/Unsigned'}
                      </span>
                    </td>
                    <td className="py-3.5 text-slate-400 font-mono text-[10px]">
                      {c.consent_timestamp ? new Date(c.consent_timestamp).toLocaleString() : '—'}
                    </td>
                    <td className="py-3.5 text-right">
                      <button
                        onClick={() => handleToggleConsent(c.customer_id, c.consent_status)}
                        className={`text-[9px] font-bold py-1.5 px-3 rounded-lg border transition ${
                          c.consent_status 
                            ? 'bg-red-50 hover:bg-red-100 border-red-200 text-red-700'
                            : 'bg-slate-900 hover:bg-slate-800 border-slate-950 text-white'
                        }`}
                      >
                        {c.consent_status ? 'Revoke Consent' : 'Grant Consent'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsentFlow;
