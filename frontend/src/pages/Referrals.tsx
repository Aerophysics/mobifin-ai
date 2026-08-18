import React, { useEffect, useState } from 'react';
import { 
  Users, UserPlus, Phone, MapPin, Building, Info,
  Sparkles, CheckCircle2, X, FileText, Send, Clock, ShieldAlert
} from 'lucide-react';
import ApiService from '../services/api';
import { GlassPanel } from '../components/glass/GlassPanel';
import { GlassCard } from '../components/glass/GlassCard';
import { GlassButton } from '../components/glass/GlassButton';
import { GlassBadge } from '../components/glass/GlassBadge';

export const Referrals: React.FC = () => {
  const [referrals, setReferrals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Modal / Form state
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    phone: '',
    name: '',
    requested_amount: '',
    purpose: '',
    institution_id: 2 // default/mock Forms Capital user id
  });
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchReferrals();
  }, []);

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
      institution_id: 2 // Forms Capital
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

    try {
      await ApiService.createReferral({
        ...formData,
        requested_amount: amt
      });
      setSuccessMsg(`Consent request sent successfully to customer ${formData.name}.`);
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
    <div className="space-y-6 max-w-5xl mx-auto animate-fadeIn pb-12 select-none text-white">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-extrabold text-[var(--mf-text-primary)] tracking-tight">Customer Referrals</h3>
          <p className="text-xs text-[var(--mf-text-secondary)] mt-1">Connect your returning customers with participating financial institutions through consent-based referrals.</p>
        </div>
        <GlassButton 
          variant="primary" 
          onClick={handleOpenAdd}
          className="px-4 py-2 font-bold text-xs uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 border-none flex items-center space-x-1.5"
        >
          <UserPlus className="h-4 w-4" />
          <span>Refer Customer</span>
        </GlassButton>
      </div>

      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl p-3.5 text-xs font-semibold flex items-center space-x-2">
          <CheckCircle2 className="h-4.5 w-4.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <GlassCard className="p-4 border-white/5">
          <span className="text-[9px] text-[var(--mf-text-secondary)] font-bold uppercase tracking-wider block">Total Referred</span>
          <span className="text-lg font-bold text-white block mt-1.5">{totalReferred}</span>
        </GlassCard>
        <GlassCard className="p-4 border-white/5">
          <span className="text-[9px] text-[var(--mf-text-secondary)] font-bold uppercase tracking-wider block">Consent Granted</span>
          <span className="text-lg font-bold text-sky-400 block mt-1.5">{consentGranted}</span>
        </GlassCard>
        <GlassCard className="p-4 border-white/5">
          <span className="text-[9px] text-[var(--mf-text-secondary)] font-bold uppercase tracking-wider block">Assessments Done</span>
          <span className="text-lg font-bold text-white block mt-1.5">{assessmentsCompleted}</span>
        </GlassCard>
        <GlassCard className="p-4 border-white/5">
          <span className="text-[9px] text-[var(--mf-text-secondary)] font-bold uppercase tracking-wider block">Under Review</span>
          <span className="text-lg font-bold text-amber-400 block mt-1.5">{applicationsUnderReview}</span>
        </GlassCard>
        <GlassCard className="p-4 border-white/5 col-span-2 md:col-span-1">
          <span className="text-[9px] text-[var(--mf-text-secondary)] font-bold uppercase tracking-wider block">Successful Loans</span>
          <span className="text-lg font-bold text-emerald-400 block mt-1.5">{successfulApplications}</span>
        </GlassCard>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
        </div>
      ) : referrals.length === 0 ? (
        <GlassPanel className="p-8 text-center space-y-3">
          <FileText className="h-12 w-12 mx-auto text-white/30" />
          <h4 className="font-extrabold text-sm text-[var(--mf-text-primary)]">No Referrals Registered Yet</h4>
          <p className="text-xs text-[var(--mf-text-secondary)] max-w-md mx-auto leading-relaxed">
            Suggest a loan facility to returning customers and initiate a consent-based review request.
          </p>
          <GlassButton 
            variant="primary" 
            onClick={handleOpenAdd}
            className="px-4 py-2 font-bold text-xs uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 border-none mx-auto mt-2"
          >
            + Refer First Customer
          </GlassButton>
        </GlassPanel>
      ) : (
        <GlassPanel className="overflow-x-auto border border-white/5">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/10 text-white/50 uppercase tracking-widest text-[9px] font-bold">
                <th className="p-4">Customer</th>
                <th className="p-4">Requested Amount</th>
                <th className="p-4">Institution</th>
                <th className="p-4">Consent Status</th>
                <th className="p-4">Lending Decision</th>
                <th className="p-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {referrals.map((r) => (
                <tr key={r.referral_id} className="border-b border-white/5 hover:bg-white/2 transition">
                  <td className="p-4 font-bold text-white">{r.customer_name}</td>
                  <td className="p-4 font-bold text-emerald-400">GH₵{r.requested_amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="p-4 text-white/70">Forms Capital</td>
                  <td className="p-4">
                    <GlassBadge variant={
                      r.consent_status === 'CONSENT_ACTIVE' ? 'success' :
                      r.consent_status === 'CONSENT_DECLINED' ? 'danger' : 'warning'
                    }>
                      {r.consent_status?.replace('_', ' ')}
                    </GlassBadge>
                  </td>
                  <td className="p-4">
                    <GlassBadge variant={
                      r.application_status === 'APPROVED' ? 'success' :
                      r.application_status === 'REJECTED' ? 'danger' : 'warning'
                    }>
                      {r.application_status?.replace('_', ' ')}
                    </GlassBadge>
                  </td>
                  <td className="p-4 text-white/40">{new Date(r.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassPanel>
      )}

      {/* Add Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-md p-6 relative shadow-2xl animate-scaleIn text-white">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-5 right-5 text-white/50 hover:text-white transition border-none bg-transparent cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-4">
              <h4 className="font-extrabold text-base text-white flex items-center space-x-2">
                <Send className="h-5 w-5 text-emerald-400 animate-pulse" />
                <span>Refer Customer for Loan</span>
              </h4>
              <p className="text-[11px] text-white/50 mt-0.5">
                Suggest an underwriting assessment. The customer must approve transaction data sharing on their mobile device via USSD.
              </p>
            </div>

            {errorMsg && (
              <div className="mb-4 bg-rose-500/20 border border-rose-500/30 text-rose-200 rounded-xl p-3 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[9px] font-bold text-white/70 uppercase tracking-widest block mb-1">Customer Identifier / Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Customer #1048"
                  className="w-full text-xs bg-slate-950/40 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-emerald-450 text-white placeholder-white/30"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-white/70 uppercase tracking-widest block mb-1">Customer Phone Number</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="e.g. +233 24 111 2222"
                  className="w-full text-xs bg-slate-950/40 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-emerald-450 text-white placeholder-white/30"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-white/70 uppercase tracking-widest block mb-1">Requested Loan Amount (GH₵)</label>
                <input
                  type="number"
                  value={formData.requested_amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, requested_amount: e.target.value }))}
                  placeholder="e.g. 5000"
                  className="w-full text-xs bg-slate-950/40 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-emerald-450 text-white placeholder-white/30"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-white/70 uppercase tracking-widest block mb-1">Lending Institution</label>
                <select
                  value={formData.institution_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, institution_id: parseInt(e.target.value) }))}
                  className="w-full text-xs bg-slate-900 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-emerald-450 text-white"
                >
                  <option value={2} className="bg-slate-900 text-white">Forms Capital</option>
                </select>
              </div>

              <div>
                <label className="text-[9px] font-bold text-white/70 uppercase tracking-widest block mb-1">Purpose (Optional)</label>
                <textarea
                  value={formData.purpose}
                  onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
                  placeholder="e.g. Working Capital expansion"
                  rows={2}
                  className="w-full text-xs bg-slate-950/40 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-emerald-450 text-white placeholder-white/30 resize-none"
                />
              </div>

              <div className="pt-2 flex space-x-3">
                <GlassButton
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 py-2.5 font-bold text-xs uppercase tracking-wider border-white/10 hover:bg-white/5"
                >
                  Cancel
                </GlassButton>
                <GlassButton
                  type="submit"
                  variant="primary"
                  className="flex-1 py-2.5 font-bold text-xs uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 border-none"
                >
                  Request Consent
                </GlassButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
