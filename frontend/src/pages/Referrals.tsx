import React, { useEffect, useState } from 'react';
import { 
  Users, UserPlus, Phone, MapPin, Building, Info,
  Sparkles, CheckCircle2, X, FileText, Send, Clock, ShieldAlert
} from 'lucide-react';
import ApiService from '../services/api';
import { GlassMetric } from '../components/glass/GlassMetric';
import { GlassTable } from '../components/glass/GlassTable';
import { SectionCard } from '../components/dash/DashKit';
import { GlassPanel } from '../components/glass/GlassPanel';
import { GlassCard } from '../components/glass/GlassCard';
import { GlassButton } from '../components/glass/GlassButton';
import { GlassBadge } from '../components/glass/GlassBadge';

export const Referrals: React.FC = () => {
  const [referrals, setReferrals] = useState<any[]>([]);
  const [institutions, setInstitutions] = useState<{ user_id: number; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Modal / Form state
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    phone: '',
    name: '',
    requested_amount: '',
    purpose: '',
    institution_id: 0
  });
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Refresh when the customer answers on the USSD simulator
  useEffect(() => {
    const onUssd = () => fetchReferrals();
    window.addEventListener('ussd_update', onUssd);
    return () => window.removeEventListener('ussd_update', onUssd);
  }, []);

  useEffect(() => {
    fetchReferrals();
    fetchInstitutions();
  }, []);

  const fetchInstitutions = async () => {
    try {
      const res = await ApiService.getInstitutions();
      setInstitutions(res);
      setFormData(prev => prev.institution_id ? prev : { ...prev, institution_id: res[0]?.user_id ?? 0 });
    } catch (e) {
      console.error('Failed to load lending institutions', e);
    }
  };

  const fetchReferrals = async () => {
    setIsLoading(true);
    try {
      const res = await ApiService.getReferrals();
      setReferrals(res);
    } catch (e) {
      console.error('Failed to load referrals', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setFormData({
      phone: '',
      name: '',
      requested_amount: '',
      purpose: '',
      institution_id: institutions[0]?.user_id ?? 0
    });
    setErrorMsg(null);
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    
    if (!formData.name.trim()) {
      setErrorMsg('Customer name/identifier is required.');
      return;
    }
    if (!formData.phone.trim()) {
      setErrorMsg('Phone Number is required.');
      return;
    }
    const amt = parseFloat(formData.requested_amount);
    if (isNaN(amt) || amt <= 0) {
      setErrorMsg('Please enter a valid requested loan amount.');
      return;
    }
    if (!formData.institution_id) {
      setErrorMsg('Please select a lending institution.');
      return;
    }

    try {
      await ApiService.createReferral({
        ...formData,
        requested_amount: amt
      });
      setSuccessMsg(`Consent request sent to ${formData.name}. They can approve it on USSD.`);
      setIsOpen(false);
      setTimeout(() => setSuccessMsg(null), 4000);
      fetchReferrals();
      // Dispatch custom event to notify USSD simulator widget of updates
      window.dispatchEvent(new Event('ussd_update'));
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || 'Failed to submit referral.');
    }
  };

  // KPIs
  const totalReferred = referrals.length;
  const consentGranted = referrals.filter(r => r.consent_status === 'CONSENT_ACTIVE').length;
  const assessmentsCompleted = referrals.filter(r => r.consent_status === 'CONSENT_ACTIVE').length; // simple mapping
  const applicationsUnderReview = referrals.filter(r => r.application_status === 'PENDING' || r.application_status === 'UNDER_REVIEW').length;
  const successfulApplications = referrals.filter(r => r.application_status === 'APPROVED').length;

  return (
    <div className="space-y-6 animate-fadeIn pb-12 select-none text-white">
      {/* Header */}
      <div className="flex justify-end -mt-2">
        <GlassButton variant="primary" onClick={handleOpenAdd}>
          <UserPlus className="h-4 w-4" /> Refer customer
        </GlassButton>
      </div>

      {successMsg && (
        <div className="bg-[var(--mf-success-soft)] text-[var(--mf-success-ink)] rounded-2xl px-4 py-3 text-[14px] font-medium flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        <GlassMetric title="Total referred" icon={Users} value={totalReferred} subtitle={`${assessmentsCompleted} profile${assessmentsCompleted === 1 ? '' : 's'} reviewed`} />
        <GlassMetric title="Consent granted" icon={CheckCircle2} value={consentGranted} subtitle="Approved on USSD" />
        <GlassMetric title="Under review" icon={Clock} value={applicationsUnderReview} subtitle="Awaiting a lender decision" />
        <GlassMetric title="Successful loans" icon={Sparkles} value={successfulApplications} subtitle="Approved by lender" />
      </div>

      <SectionCard title="Your referrals" icon={FileText}>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 rounded-full border-2 border-[var(--mf-border-strong)] border-t-[var(--mf-accent)] animate-spin" />
          </div>
        ) : referrals.length === 0 ? (
          <div className="py-10 text-center space-y-3">
            <FileText className="h-8 w-8 mx-auto text-[var(--mf-text-muted)]" />
            <p className="text-[15px] font-semibold">No referrals yet</p>
            <p className="text-[14px] text-[var(--mf-text-secondary)] max-w-md mx-auto">Refer a returning customer to a partner lender. They approve sharing their history on USSD.</p>
            <GlassButton variant="primary" onClick={handleOpenAdd} className="mx-auto mt-2">Refer your first customer</GlassButton>
          </div>
        ) : (
          <GlassTable headers={['Customer', 'Requested', 'Lender', 'Consent', 'Decision', 'Date']} className="text-[14px]">
            {referrals.map(r => (
              <tr key={r.referral_id} className="hover:bg-[var(--mf-card-glass)] transition-colors">
                <td className="py-3.5 px-2 font-semibold">{r.customer_name}</td>
                <td className="py-3.5 px-2 mf-tabular">GH₵{r.requested_amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td className="py-3.5 px-2 text-[var(--mf-text-secondary)]">{r.institution_name || 'Forms Capital'}</td>
                <td className="py-3.5 px-2">
                  <GlassBadge variant={r.consent_status === 'CONSENT_ACTIVE' ? 'success' : r.consent_status === 'CONSENT_DECLINED' || r.consent_status === 'CONSENT_REVOKED' ? 'danger' : 'warning'}>
                    {String(r.consent_status || '').replace('CONSENT_', '').replace('_', ' ').toLowerCase()}
                  </GlassBadge>
                </td>
                <td className="py-3.5 px-2">
                  <GlassBadge variant={r.application_status === 'APPROVED' ? 'success' : r.application_status === 'REJECTED' ? 'danger' : 'warning'}>
                    {String(r.application_status || '').replace('_', ' ').toLowerCase()}
                  </GlassBadge>
                </td>
                <td className="py-3.5 px-2 text-[var(--mf-text-secondary)]">{new Date(r.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</td>
              </tr>
            ))}
          </GlassTable>
        )}
      </SectionCard>

      {/* Refer customer modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-[#0b1407]/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--mf-surface)] border border-[var(--mf-border)] rounded-[22px] w-full max-w-md p-6 relative shadow-[var(--mf-shadow-pop)] text-[var(--mf-text-primary)]">
            <button onClick={() => setIsOpen(false)} className="absolute top-5 right-5 text-[var(--mf-text-secondary)] hover:text-[var(--mf-text-primary)] cursor-pointer" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
            <h4 className="mf-display text-[20px] font-semibold flex items-center gap-2">
              <Send className="h-5 w-5 text-[var(--mf-accent-ink)]" /> Refer a customer
            </h4>
            <p className="text-[13px] text-[var(--mf-text-secondary)] mt-1">The customer approves sharing their transaction history on their phone via USSD.</p>

            {errorMsg && (
              <div className="mt-4 bg-[var(--mf-danger-soft)] text-[var(--mf-danger-ink)] rounded-xl px-3.5 py-2.5 text-[13px] font-medium">{errorMsg}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 mt-5">
              {([
                ['Customer name or ID', 'name', 'text', 'e.g. Customer #1048'],
                ['Phone number', 'phone', 'text', 'e.g. +233 24 111 2222'],
                ['Requested amount (GH₵)', 'requested_amount', 'number', 'e.g. 5000'],
              ] as const).map(([label, key, type, ph]) => (
                <label key={key} className="block">
                  <span className="text-[13px] font-medium">{label}</span>
                  <input
                    type={type}
                    value={(formData as any)[key]}
                    onChange={e => setFormData(prev => ({ ...prev, [key]: e.target.value }))}
                    placeholder={ph}
                    className="mt-1.5 w-full h-11 px-3.5 rounded-xl border border-[var(--mf-border-strong)] bg-[var(--mf-surface)] text-[14px] placeholder-[var(--mf-text-muted)] focus:outline-none focus:border-[var(--mf-accent)]"
                  />
                </label>
              ))}
              <label className="block">
                <span className="text-[13px] font-medium">Lender</span>
                <select
                  value={formData.institution_id}
                  onChange={e => setFormData(prev => ({ ...prev, institution_id: parseInt(e.target.value) }))}
                  className="mt-1.5 w-full h-11 px-3 rounded-xl border border-[var(--mf-border-strong)] bg-[var(--mf-surface)] text-[14px] focus:outline-none focus:border-[var(--mf-accent)]"
                >
                  {institutions.length === 0 && <option value={0}>No partner lenders available</option>}
                  {institutions.map(inst => <option key={inst.user_id} value={inst.user_id}>{inst.name}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-[13px] font-medium">Purpose (optional)</span>
                <textarea
                  value={formData.purpose}
                  onChange={e => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
                  placeholder="e.g. Working capital"
                  rows={2}
                  className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl border border-[var(--mf-border-strong)] bg-[var(--mf-surface)] text-[14px] placeholder-[var(--mf-text-muted)] focus:outline-none focus:border-[var(--mf-accent)] resize-none"
                />
              </label>
              <div className="pt-1 flex gap-3">
                <GlassButton type="button" onClick={() => setIsOpen(false)} className="flex-1">Cancel</GlassButton>
                <GlassButton type="submit" variant="primary" className="flex-1">Send consent request</GlassButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
