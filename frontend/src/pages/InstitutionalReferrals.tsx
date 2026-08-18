import React, { useEffect, useState } from 'react';
import { 
  Users, CheckCircle2, X, FileText, Clock, ShieldAlert, KeyRound,
  Percent, Coins, BarChart3, HelpCircle, Award, Eye, Copy, Check
} from 'lucide-react';
import ApiService from '../services/api';
import { GlassPanel } from '../components/glass/GlassPanel';
import { GlassCard } from '../components/glass/GlassCard';
import { GlassButton } from '../components/glass/GlassButton';
import { GlassBadge } from '../components/glass/GlassBadge';

export const InstitutionalReferrals: React.FC = () => {
  const [referrals, setReferrals] = useState<any[]>([]);
  const [selectedRef, setSelectedRef] = useState<any | null>(null);
  const [profileData, setProfileData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isProfileLoading, setIsProfileLoading] = useState<boolean>(false);
  const [decisionSuccess, setDecisionSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchReferrals();
  }, []);

  const fetchReferrals = async () => {
    setIsLoading(true);
    try {
      const res = await ApiService.getInstitutionReferrals();
      setReferrals(res);
    } catch (e) {
      console.error('Failed to load referrals', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectReferral = async (ref: any) => {
    setSelectedRef(ref);
    setProfileData(null);
    if (ref.consent_status === 'CONSENT_ACTIVE') {
      setIsProfileLoading(true);
      try {
        const data = await ApiService.getReferredCustomerProfile(ref.referral_id);
        setProfileData(data);
      } catch (e) {
        console.error(e);
      } finally {
        setIsProfileLoading(false);
      }
    }
  };

  const handleLendingDecision = async (decision: string) => {
    if (!selectedRef) return;
    try {
      await ApiService.postLendingDecision(selectedRef.referral_id, decision);
      setDecisionSuccess(`Lending decision registered successfully: ${decision}`);
      setTimeout(() => setDecisionSuccess(null), 4000);
      
      // Refresh list and select the updated referral
      const res = await ApiService.getInstitutionReferrals();
      setReferrals(res);
      const updated = res.find(r => r.referral_id === selectedRef.referral_id);
      if (updated) {
        setSelectedRef(updated);
        handleSelectReferral(updated);
      }
    } catch (e: any) {
      console.error(e);
      alert('Failed to register lending decision.');
    }
  };

  // KPIs
  const pendingConsent = referrals.filter(r => r.consent_status === 'AWAITING_CONSENT').length;
  const consentGranted = referrals.filter(r => r.consent_status === 'CONSENT_ACTIVE').length;
  const underReview = referrals.filter(r => r.application_status === 'PENDING' || r.application_status === 'UNDER_REVIEW').length;
  const approved = referrals.filter(r => r.application_status === 'APPROVED').length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn pb-12 select-none text-white">
      {/* Header */}
      <div>
        <h3 className="text-xl font-extrabold text-[var(--mf-text-primary)] tracking-tight">Credit Underwriting Portfolio</h3>
        <p className="text-xs text-[var(--mf-text-secondary)] mt-1">Review customer credit referrals, evaluate alternative credit scores, and log lending decisions.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4 border-white/5">
          <span className="text-[9px] text-[var(--mf-text-secondary)] font-bold uppercase tracking-wider block">Pending Consent</span>
          <span className="text-lg font-bold text-amber-400 block mt-1.5">{pendingConsent}</span>
        </GlassCard>
        <GlassCard className="p-4 border-white/5">
          <span className="text-[9px] text-[var(--mf-text-secondary)] font-bold uppercase tracking-wider block">Consent Granted</span>
          <span className="text-lg font-bold text-sky-400 block mt-1.5">{consentGranted}</span>
        </GlassCard>
        <GlassCard className="p-4 border-white/5">
          <span className="text-[9px] text-[var(--mf-text-secondary)] font-bold uppercase tracking-wider block">Under Review</span>
          <span className="text-lg font-bold text-white block mt-1.5">{underReview}</span>
        </GlassCard>
        <GlassCard className="p-4 border-white/5">
          <span className="text-[9px] text-[var(--mf-text-secondary)] font-bold uppercase tracking-wider block">Approved Loans</span>
          <span className="text-lg font-bold text-emerald-400 block mt-1.5">{approved}</span>
        </GlassCard>
      </div>

      {decisionSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl p-3.5 text-xs font-semibold flex items-center space-x-2">
          <CheckCircle2 className="h-4.5 w-4.5" />
          <span>{decisionSuccess}</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[var(--mf-accent)]"></div>
        </div>
      ) : referrals.length === 0 ? (
        <GlassPanel className="p-8 text-center space-y-3">
          <FileText className="h-12 w-12 mx-auto text-white/30" />
          <h4 className="font-extrabold text-sm text-[var(--mf-text-primary)]">No incoming referrals</h4>
          <p className="text-xs text-[var(--mf-text-secondary)] max-w-md mx-auto leading-relaxed">
            There are currently no credit referrals submitted to your institution.
          </p>
        </GlassPanel>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Incoming Referrals List */}
          <GlassPanel className="lg:col-span-2 p-5 space-y-4 h-[550px] overflow-y-auto">
            <span className="text-[10px] text-sky-400 font-bold uppercase tracking-widest block">Credit Applications</span>
            <div className="space-y-3">
              {referrals.map(r => {
                const isSelected = selectedRef?.referral_id === r.referral_id;
                return (
                  <div 
                    key={r.referral_id}
                    onClick={() => handleSelectReferral(r)}
                    className={`p-3.5 rounded-xl border transition cursor-pointer text-left ${
                      isSelected 
                        ? 'bg-[var(--mf-accent)]/10 border-[var(--mf-accent)] text-white' 
                        : 'bg-white/2 border-white/5 hover:bg-white/5 text-white/80'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-xs">{r.customer_name}</span>
                      <GlassBadge variant={
                        r.consent_status === 'CONSENT_ACTIVE' ? 'success' :
                        r.consent_status === 'CONSENT_DECLINED' ? 'danger' : 'warning'
                      }>
                        {r.consent_status?.replace('_', ' ')}
                      </GlassBadge>
                    </div>

                    <div className="flex justify-between items-center mt-2.5 text-[10px] text-white/40">
                      <span>Source: {r.agent_name}</span>
                      <span className="font-bold text-white">GH₵{r.requested_amount?.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassPanel>

          {/* Underwriting Evaluation Workspace */}
          <GlassPanel className="lg:col-span-3 p-5 h-[550px] overflow-y-auto flex flex-col justify-between">
            {!selectedRef ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-2.5 text-white/40">
                <FileText className="h-10 w-10 text-white/20" />
                <span className="text-xs">Select a referral application to begin underwriting review.</span>
              </div>
            ) : isProfileLoading ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
              </div>
            ) : selectedRef.consent_status !== 'CONSENT_ACTIVE' ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-4">
                <KeyRound className="h-12 w-12 text-rose-500 animate-pulse" />
                <h4 className="font-extrabold text-sm text-white">Consent Access Required</h4>
                <p className="text-xs text-[var(--mf-text-secondary)] max-w-sm leading-relaxed">
                  Customer consent is required before financial information can be accessed.
                </p>
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-200 text-[10.5px] p-3 rounded-xl max-w-sm">
                  {selectedRef.consent_status === 'CONSENT_DECLINED' 
                    ? "The customer explicitly declined permission to share records via USSD simulator."
                    : "Awaiting customer approval via the USSD simulation interface."
                  }
                </div>
              </div>
            ) : profileData ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <div>
                    <h4 className="font-extrabold text-sm text-white">{profileData.display_name} Profile</h4>
                    <span className="text-[10px] text-white/50">Consent active until: {new Date(profileData.consent_expiry).toLocaleDateString()}</span>
                  </div>
                  <GlassBadge variant="success">Consent Active</GlassBadge>
                </div>

                {/* Consent Audit Trail Section */}
                <div className="bg-white/2 border border-white/5 p-4 rounded-2xl space-y-2.5">
                  <span className="text-[9px] font-bold text-sky-400 uppercase tracking-widest block border-b border-white/5 pb-1.5 font-mono">
                    Consent Audit Trail
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-[10.5px]">
                    <div className="flex justify-between border-b border-white/2 pb-1">
                      <span className="text-white/40">Customer:</span>
                      <span className="font-bold text-white">{profileData.display_name}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/2 pb-1">
                      <span className="text-white/40">Referrer Agent:</span>
                      <span className="font-bold text-white">{selectedRef.agent_name}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/2 pb-1">
                      <span className="text-white/40">Institution:</span>
                      <span className="font-bold text-white">Forms Capital</span>
                    </div>
                    <div className="flex justify-between border-b border-white/2 pb-1">
                      <span className="text-white/40">Requested Amount:</span>
                      <span className="font-bold text-emerald-400">GH₵{selectedRef.requested_amount?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/2 pb-1">
                      <span className="text-white/40">Consent Status:</span>
                      <span className="font-bold text-emerald-400">{selectedRef.consent_status}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/2 pb-1">
                      <span className="text-white/40">Consent Method:</span>
                      <span className="font-bold text-white">USSD</span>
                    </div>
                    <div className="flex justify-between border-b border-white/2 pb-1 md:col-span-2">
                      <span className="text-white/40">Consent Expiry:</span>
                      <span className="font-bold text-white">{new Date(profileData.consent_expiry).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between md:col-span-2">
                      <span className="text-white/40">Assessment:</span>
                      <span className={`font-bold ${profileData.is_ready_for_credit ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {profileData.is_ready_for_credit ? 'READY' : 'NOT YET AVAILABLE'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Eligibility Gate checks */}
                <div className="space-y-2 bg-white/2 border border-white/5 p-3 rounded-2xl">
                  <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest block mb-1">Credit Eligibility Parameters</span>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-slate-950/40 p-2.5 rounded-xl">
                      <span className="text-white/40 text-[9px] block">History days</span>
                      <span className="font-extrabold block mt-0.5">{profileData.history_days} / 90</span>
                    </div>
                    <div className="bg-slate-950/40 p-2.5 rounded-xl">
                      <span className="text-white/40 text-[9px] block">Transactions</span>
                      <span className="font-extrabold block mt-0.5">{profileData.transaction_count} / 30</span>
                    </div>
                    <div className="bg-slate-950/40 p-2.5 rounded-xl">
                      <span className="text-white/40 text-[9px] block">USSD Consent</span>
                      <span className="font-extrabold block mt-0.5 text-emerald-400">ACTIVE</span>
                    </div>
                  </div>
                </div>

                {profileData.is_ready_for_credit && profileData.assessment ? (
                  // RENDER ALTERNATIVE ASSESSMENT (ELIGIBLE)
                  <div className="space-y-3.5 animate-fadeIn">
                    <div className="grid grid-cols-2 gap-3.5">
                      <GlassCard className="p-3.5 flex flex-col justify-between border-white/5">
                        <div>
                          <span className="text-[9px] text-[var(--mf-text-secondary)] font-bold uppercase tracking-wider block">Alternative Credit Score</span>
                          <span className="text-lg font-bold text-white block mt-1.5">
                            {profileData.assessment.credit_score} / 850
                          </span>
                        </div>
                      </GlassCard>
                      <GlassCard className="p-3.5 flex flex-col justify-between border-white/5">
                        <div>
                          <span className="text-[9px] text-[var(--mf-text-secondary)] font-bold uppercase tracking-wider block">Risk Rating</span>
                          <span className="text-lg font-bold text-emerald-400 block mt-1.5">
                            {profileData.assessment.risk_category}
                          </span>
                        </div>
                      </GlassCard>
                    </div>

                    <div className="grid grid-cols-2 gap-3.5">
                      <GlassCard className="p-3.5 flex flex-col justify-between border-white/5">
                        <div>
                          <span className="text-[9px] text-[var(--mf-text-secondary)] font-bold uppercase tracking-wider block">Repayment Probability</span>
                          <span className="text-base font-bold text-white block mt-1">
                            {Math.round(profileData.assessment.repayment_probability * 100)}%
                          </span>
                        </div>
                      </GlassCard>
                      <GlassCard className="p-3.5 flex flex-col justify-between border-white/5">
                        <div>
                          <span className="text-[9px] text-[var(--mf-text-secondary)] font-bold uppercase tracking-wider block">Indicative Capacity</span>
                          <span className="text-base font-bold text-emerald-400 block mt-1">
                            GH₵{profileData.assessment.indicative_credit_capacity?.toLocaleString()}
                          </span>
                        </div>
                      </GlassCard>
                    </div>

                    {/* SHAP explanation */}
                    <div className="space-y-2 bg-white/2 border border-white/5 p-3 rounded-2xl">
                      <span className="text-[9.5px] font-bold text-white/50 uppercase tracking-widest block">Assessment Influencers (SHAP)</span>
                      <div className="space-y-1.5 text-[10.5px]">
                        {profileData.assessment.factors?.map((exp: any, idx: number) => {
                          const val = exp.value;
                          const isPos = val > 0;
                          return (
                            <div key={idx} className="flex justify-between items-center">
                              <span className="text-white/80">{exp.feature?.replace(/_/g, ' ')}</span>
                              <span className={isPos ? 'text-emerald-400' : 'text-rose-400'}>
                                {isPos ? '+' : ''}{val.toFixed(2)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  // RENDER READINESS SUFFICIENCY METER (INELIGIBLE)
                  <div className="bg-white/5 border border-white/5 rounded-2xl p-5 text-center space-y-4 animate-fadeIn">
                    <Award className="h-10 w-10 mx-auto text-amber-500 animate-bounce" />
                    <div className="space-y-1.5">
                      <h5 className="font-bold text-xs text-white">Alternative Credit Assessment Not Yet Available</h5>
                      <p className="text-[10.5px] text-[var(--mf-text-secondary)] leading-relaxed max-w-sm mx-auto">
                        Continue building your financial history to become eligible for an alternative credit assessment.
                      </p>
                    </div>
                    <div className="bg-slate-950/40 p-3.5 rounded-xl border border-white/5 text-xs flex justify-between items-center max-w-sm mx-auto">
                      <span className="text-white/60">Financial Readiness Score:</span>
                      <span className="font-extrabold text-sky-400 text-sm">{profileData.financial_readiness_score} / 100</span>
                    </div>
                  </div>
                )}

                {/* Underwriting loan decision buttons */}
                <div className="space-y-3.5 border-t border-white/5 pt-4">
                  <p className="text-[10.5px] text-white/40 text-center italic">
                    Alternative credit assessment is indicative and does not guarantee loan approval. Final lending decisions require appropriate institutional underwriting.
                  </p>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <GlassButton 
                      variant="primary" 
                      onClick={() => handleLendingDecision('APPROVED')}
                      className="py-2.5 font-bold text-[10px] bg-emerald-600 hover:bg-emerald-500 border-none uppercase tracking-wider text-white"
                    >
                      Approve Application
                    </GlassButton>
                    <GlassButton 
                      onClick={() => handleLendingDecision('REJECTED')}
                      className="py-2.5 font-bold text-[10px] bg-rose-950/50 hover:bg-rose-900 border-rose-500/20 text-rose-200 uppercase tracking-wider"
                    >
                      Reject Application
                    </GlassButton>
                    <GlassButton 
                      onClick={() => handleLendingDecision('MANUAL_REVIEW')}
                      className="py-2.5 font-bold text-[10px] border-white/10 hover:bg-white/5 uppercase tracking-wider"
                    >
                      Request Manual Review
                    </GlassButton>
                  </div>

                  <div className="flex justify-between items-center pt-2 text-[10.5px] text-white/50 bg-white/2 p-2.5 rounded-xl border border-white/5">
                    <span>Application Underwriting status:</span>
                    <GlassBadge variant={
                      selectedRef.application_status === 'APPROVED' ? 'success' :
                      selectedRef.application_status === 'REJECTED' ? 'danger' : 'warning'
                    }>
                      {selectedRef.application_status}
                    </GlassBadge>
                  </div>
                </div>
              </div>
            ) : null}
          </GlassPanel>
        </div>
      )}
    </div>
  );
};
