import React, { useEffect, useState } from 'react';
import { 
  Search, ShieldCheck, ShieldAlert, XCircle, Users, Sparkles, 
  ArrowRight, FileText, Landmark, Clock, Coins, CheckCircle, HelpCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ApiService from '../services/api';
import { CustomerProfile, CreditAssessment } from '../types';
import { GlassPanel } from '../components/glass/GlassPanel';
import { GlassCard } from '../components/glass/GlassCard';
import { GlassMetric } from '../components/glass/GlassMetric';
import { GlassButton } from '../components/glass/GlassButton';
import { GlassBadge } from '../components/glass/GlassBadge';
import { GlassModal } from '../components/glass/GlassModal';

export const CustomerIntelligence: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);
  const [assessment, setAssessment] = useState<CreditAssessment | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDetailLoading, setIsDetailLoading] = useState<boolean>(false);
  const [chartData, setChartData] = useState<any[]>([]);
  const [viewState, setViewState] = useState<'list' | 'profile'>('list');
  
  // Left Sidebar Tab
  const [leftTab, setLeftTab] = useState<'profiles' | 'requests'>('profiles');
  
  // Financing Requests state
  const [financingRequests, setFinancingRequests] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [reqAmount, setReqAmount] = useState<number>(0);
  const [reqTerm, setReqTerm] = useState<number>(30);
  const [reqPurpose, setReqPurpose] = useState<string>('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState<boolean>(false);

  useEffect(() => {
    fetchCustomersAndData();
  }, []);

  const fetchCustomersAndData = async (search = '') => {
    setIsLoading(true);
    try {
      const [custs, reqs, prodCatalog] = await Promise.all([
        ApiService.listCustomers(search || undefined),
        ApiService.listFinancingRequests(),
        ApiService.getProductCatalog()
      ]);
      
      setCustomers(custs);
      setFinancingRequests(reqs);
      setProducts(prodCatalog);
      
      if (custs.length > 0 && !selectedCustomerId) {
        const hero = custs.find(c => c.customer_id === 1048) || custs[0];
        loadCustomerDetails(hero);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCustomerDetails = async (cust: CustomerProfile) => {
    setSelectedCustomerId(cust.customer_id);
    setSelectedCustomer(cust);
    setIsDetailLoading(true);
    try {
      const assessmentData = await ApiService.getCreditAssessment(cust.customer_id);
      setAssessment(assessmentData);
      
      const profile = assessmentData.profile;
      if (profile) {
        setChartData([
          { month: 'M - 3', 'Observed Inflows': profile.monthly_inflows * 0.9, 'Outflows': profile.monthly_outflows * 0.85 },
          { month: 'M - 2', 'Observed Inflows': profile.monthly_inflows * 1.05, 'Outflows': profile.monthly_outflows * 0.95 },
          { month: 'M - 1', 'Observed Inflows': profile.monthly_inflows * 0.95, 'Outflows': profile.monthly_outflows * 1.0 },
          { month: 'Current', 'Observed Inflows': profile.monthly_inflows, 'Outflows': profile.monthly_outflows }
        ]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleSelectCustomer = (cust: CustomerProfile) => {
    setViewState('profile');
    loadCustomerDetails(cust);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCustomersAndData(searchQuery);
  };

  const openRequestModal = (product: any) => {
    setSelectedProduct(product);
    setReqAmount(assessment?.indicative_credit_capacity || 2000);
    setReqTerm(30);
    setReqPurpose('');
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !selectedProduct) return;
    
    setIsSubmittingRequest(true);
    setModalError(null);
    try {
      await ApiService.submitFinancingRequest({
        customer_id: selectedCustomer.customer_id,
        product_name: selectedProduct.product_name,
        requested_amount: reqAmount,
        requested_term: reqTerm,
        purpose: reqPurpose
      });
      
      // Refresh requests list
      const updatedReqs = await ApiService.listFinancingRequests();
      setFinancingRequests(updatedReqs);
      
      setIsModalOpen(false);
    } catch (err: any) {
      setModalError(err.message || "Failed to submit financing request.");
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  // Status mapping helper
  const getCustomerStatus = (cust: CustomerProfile, assess: CreditAssessment | null) => {
    if (!cust.consent_status) return { text: "NOT CONSENTED", variant: "neutral" as const };
    if (!assess || !assess.eligible) return { text: "INSUFFICIENT HISTORY", variant: "warning" as const };
    
    const activeReq = financingRequests.find(r => r.customer_id === cust.customer_id);
    if (activeReq) {
      if (activeReq.status === "PENDING_INSTITUTIONAL_REVIEW") {
        return { text: "UNDER INSTITUTIONAL REVIEW", variant: "warning" as const };
      }
      return { text: "FINANCING REQUESTED", variant: "success" as const };
    }
    
    return { text: "ASSESSED", variant: "success" as const };
  };

  const activeRequest = financingRequests.find(r => r.customer_id === selectedCustomerId);
  const statusInfo = selectedCustomer ? getCustomerStatus(selectedCustomer, assessment) : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100dvh-95px)] lg:h-[calc(100vh-140px)] overflow-hidden animate-fadeIn max-w-6xl mx-auto pb-6">
      {/* Left Sidebar: Profiles & Requests */}
      <GlassPanel className={`lg:col-span-1 p-4 flex flex-col space-y-3 h-full overflow-hidden ${viewState === 'list' ? 'flex' : 'hidden lg:flex'}`}>
        {/* Tab switch header */}
        <div className="flex bg-white/5 border border-[var(--mf-border)] rounded-xl p-1 flex-shrink-0">
          <button
            onClick={() => setLeftTab('profiles')}
            className={`flex-1 text-[10px] font-bold uppercase py-2 rounded-lg cursor-pointer border-none ${
              leftTab === 'profiles' 
                ? 'bg-[var(--mf-accent)] text-white' 
                : 'text-[var(--mf-text-secondary)] hover:bg-white/5'
            }`}
          >
            Profiles
          </button>
          <button
            onClick={() => setLeftTab('requests')}
            className={`flex-1 text-[10px] font-bold uppercase py-2 rounded-lg cursor-pointer border-none flex items-center justify-center space-x-1 ${
              leftTab === 'requests' 
                ? 'bg-[var(--mf-accent)] text-white' 
                : 'text-[var(--mf-text-secondary)] hover:bg-white/5'
            }`}
          >
            <span>Requests</span>
            {financingRequests.length > 0 && (
              <span className="bg-rose-500 text-white font-bold text-[8px] px-1 rounded-full">
                {financingRequests.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content 1: Profiles */}
        {leftTab === 'profiles' ? (
          <>
            <form onSubmit={handleSearch} className="relative flex-shrink-0">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search Customer ID..."
                className="w-full text-xs bg-white/5 border border-[var(--mf-border)] rounded-xl pl-8 pr-3 py-2 focus:outline-none focus:border-[var(--mf-accent)] text-[var(--mf-text-primary)]"
              />
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[var(--mf-text-secondary)]" />
            </form>

            <div className="flex-1 overflow-y-auto space-y-1 pr-0.5">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-[var(--mf-accent)]"></div>
                </div>
              ) : customers.length === 0 ? (
                <p className="text-center text-[10px] text-[var(--mf-text-secondary)] py-8">No records</p>
              ) : (
                customers.map(c => {
                  const isSelected = selectedCustomerId === c.customer_id;
                  const cAssessment = selectedCustomerId === c.customer_id ? assessment : null;
                  const cStatus = getCustomerStatus(c, cAssessment);
                  return (
                    <button
                      key={c.customer_id}
                      onClick={() => handleSelectCustomer(c)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl border text-xs transition cursor-pointer ${
                        isSelected
                          ? 'bg-[var(--mf-accent)] text-white border-none font-semibold shadow-md'
                          : 'bg-white/5 border-[var(--mf-border)] hover:bg-white/10 text-[var(--mf-text-primary)]'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex flex-col">
                          <span className="font-semibold">{c.display_name}</span>
                          <span className={`text-[8px] font-bold uppercase mt-0.5 ${
                            isSelected ? 'text-white/80' : 'text-[var(--mf-text-secondary)]'
                          }`}>
                            {cStatus.text}
                          </span>
                        </div>
                        <span className={`h-1.5 w-1.5 rounded-full ${c.consent_status ? 'bg-emerald-500' : 'bg-slate-350 dark:bg-white/20'}`} />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </>
        ) : (
          /* Tab Content 2: Requests */
          <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
            {financingRequests.length === 0 ? (
              <div className="text-center py-8 text-[10px] text-[var(--mf-text-secondary)]">
                No active financing requests found in institutional review.
              </div>
            ) : (
              financingRequests.map(r => {
                const isSelected = selectedCustomerId === r.customer_id;
                return (
                  <GlassCard 
                    key={r.request_id} 
                    onClick={() => {
                      const targetCust = customers.find(c => c.customer_id === r.customer_id);
                      if (targetCust) handleSelectCustomer(targetCust);
                    }}
                    className={`p-3 text-xs text-left cursor-pointer transition ${
                      isSelected ? 'border-[var(--mf-accent)] bg-[var(--mf-accent)]/5' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-[var(--mf-text-primary)]">{r.customer_name}</span>
                      <GlassBadge variant="warning">Under Review</GlassBadge>
                    </div>
                    <p className="text-[10px] text-[var(--mf-text-secondary)] font-semibold mt-1">{r.product_name}</p>
                    <div className="flex justify-between items-center mt-2.5 pt-1.5 border-t border-[var(--mf-border)] text-[9px] text-[var(--mf-text-secondary)]">
                      <span>Term: {r.requested_term} Days</span>
                      <span className="font-bold text-[var(--mf-text-primary)]">GH₵{r.requested_amount.toLocaleString()}</span>
                    </div>
                  </GlassCard>
                );
              })
            )}
          </div>
        )}
      </GlassPanel>

      {/* Right Area: Profile Details - independent scroll */}
      <div className={`lg:col-span-3 h-full overflow-y-auto pr-1 space-y-6 pb-6 ${viewState === 'profile' ? 'block' : 'hidden lg:block'}`}>
        {/* Back to List button for mobile/tablet */}
        <div className="lg:hidden flex-shrink-0">
          <GlassButton
            onClick={() => setViewState('list')}
            className="flex items-center space-x-2 text-xs font-bold px-3.5 py-2.5 rounded-xl"
          >
            <span>← Back to List</span>
          </GlassButton>
        </div>
        
        {isDetailLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[var(--mf-accent)]"></div>
          </div>
        ) : selectedCustomer && assessment ? (
          <div className="space-y-6">
            
            {/* Header with detailed status */}
            <GlassPanel className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <span className="text-[9px] text-[var(--mf-text-secondary)] font-bold uppercase tracking-wider block">Consented Underwriting Console</span>
                <h3 className="text-base font-bold text-[var(--mf-text-primary)] mt-1">{selectedCustomer.display_name}</h3>
              </div>
              
              {statusInfo && (
                <div className="flex items-center space-x-2">
                  <span className="text-[9px] text-[var(--mf-text-secondary)] font-bold uppercase tracking-wider">Status:</span>
                  <GlassBadge variant={statusInfo.variant}>
                    {statusInfo.text}
                  </GlassBadge>
                </div>
              )}
            </GlassPanel>

            {/* Visual Workflow Progression Bar */}
            <GlassPanel className="p-4">
              <div className="flex items-center justify-between flex-wrap gap-2 text-[8px] md:text-[9px] font-extrabold uppercase tracking-wider text-[var(--mf-text-secondary)]">
                <span className="text-emerald-500 flex items-center">
                  Consent <CheckCircle className="h-3 w-3 ml-1" />
                </span>
                <span className="text-slate-400">&rarr;</span>
                
                <span className={`${assessment.financial_readiness_score >= 50 ? 'text-emerald-500' : 'text-slate-400'} flex items-center`}>
                  Readiness ({assessment.financial_readiness_score}%)
                  {assessment.financial_readiness_score >= 50 && <CheckCircle className="h-3 w-3 ml-1" />}
                </span>
                <span className="text-slate-400">&rarr;</span>

                <span className={`${assessment.eligible ? 'text-emerald-500' : 'text-slate-400'} flex items-center`}>
                  Scoring
                  {assessment.eligible && <CheckCircle className="h-3 w-3 ml-1" />}
                </span>
                <span className="text-slate-400">&rarr;</span>

                <span className={`${assessment.eligible ? 'text-emerald-500' : 'text-slate-400'} flex items-center`}>
                  Capacity
                  {assessment.eligible && <CheckCircle className="h-3 w-3 ml-1" />}
                </span>
                <span className="text-slate-400">&rarr;</span>

                <span className={`${activeRequest ? 'text-emerald-500' : 'text-slate-400'} flex items-center`}>
                  Financing
                  {activeRequest && <CheckCircle className="h-3 w-3 ml-1" />}
                </span>
                <span className="text-slate-400">&rarr;</span>

                <span className={`${activeRequest?.status === 'PENDING_INSTITUTIONAL_REVIEW' ? 'text-amber-500 animate-pulse' : 'text-slate-400'} flex items-center`}>
                  Review
                </span>
              </div>
            </GlassPanel>

            {/* Assessment Condition Check */}
            {!assessment.eligible ? (
              /* FINANCIAL READINESS PROGRESS GAUGE */
              <GlassPanel className="p-6 space-y-6">
                <div className="flex items-start space-x-3 text-amber-500 bg-amber-500/10 p-4 rounded-xl border border-amber-500/20">
                  <ShieldAlert className="h-4.5 w-4.5 mt-0.5 flex-shrink-0 text-amber-500" />
                  <div>
                    <h4 className="font-bold text-xs">Alternative Credit Score Gated</h4>
                    <p className="text-[10px] leading-normal mt-1 text-[var(--mf-text-secondary)]">
                      {assessment.reason || 'Customer has not yet met the history and activity thresholds.'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  {/* Circular Gauge */}
                  <GlassCard className="flex flex-col items-center justify-center p-5">
                    <span className="text-[9px] font-bold text-[var(--mf-text-secondary)] uppercase tracking-widest block mb-3">Financial Readiness Score</span>
                    <div className="relative h-24 w-24 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="48" cy="48" r="40" stroke="var(--mf-border)" strokeWidth="6" fill="transparent" />
                        <circle 
                          cx="48" 
                          cy="48" 
                          r="40" 
                          stroke="var(--mf-accent)" 
                          strokeWidth="6" 
                          fill="transparent" 
                          strokeDasharray="251"
                          strokeDashoffset={251 - (251 * assessment.financial_readiness_score) / 100}
                        />
                      </svg>
                      <span className="absolute text-lg font-extrabold text-[var(--mf-text-primary)]">{assessment.financial_readiness_score}%</span>
                    </div>
                    <p className="text-[9px] text-[var(--mf-text-secondary)] text-center leading-normal mt-4">
                      Measures data maturity before alternative underwriting can trigger.
                    </p>
                  </GlassCard>

                  {/* Checklist */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-[var(--mf-text-primary)] text-[10px] uppercase tracking-wider">Sufficiency Criteria Check</h4>
                    
                    <div className="space-y-2 text-xs">
                      <GlassCard className="flex justify-between p-3">
                        <span className="text-[var(--mf-text-secondary)]">Opt-in Consent Active</span>
                        <span className={selectedCustomer.consent_status ? 'text-emerald-500 font-bold' : 'text-[var(--mf-text-secondary)]'}>
                          {selectedCustomer.consent_status ? 'Signature Verified' : 'Pending'}
                        </span>
                      </GlassCard>
                      <GlassCard className="flex justify-between p-3">
                        <span className="text-[var(--mf-text-secondary)]">Active History Duration</span>
                        <span className={assessment.history_days >= 90 ? 'text-emerald-500 font-bold' : 'text-[var(--mf-text-primary)]'}>
                          {assessment.history_days} / 90 days
                        </span>
                      </GlassCard>
                      <GlassCard className="flex justify-between p-3">
                        <span className="text-[var(--mf-text-secondary)]">Transaction Volume</span>
                        <span className={assessment.transaction_count >= 30 ? 'text-emerald-500 font-bold' : 'text-[var(--mf-text-primary)]'}>
                          {assessment.transaction_count} / 30 txs
                        </span>
                      </GlassCard>
                    </div>
                    
                    <p className="text-[9px] text-[var(--mf-text-secondary)] leading-normal">
                      Financial Readiness is a measure of profile data maturity and transaction consistency, NOT an approval guarantee.
                    </p>
                  </div>
                </div>
              </GlassPanel>
            ) : (
              /* ALTERNATIVE CREDIT ASSESSMENT PANEL */
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Credit Score */}
                  <GlassPanel className="p-5 flex flex-col items-center justify-center text-center">
                    <span className="text-[9px] text-[var(--mf-text-secondary)] font-bold uppercase tracking-wider">Alternative Credit Score</span>
                    <span className="text-3xl font-extrabold text-[var(--mf-text-primary)] block mt-2">
                      {assessment.credit_score} <span className="text-xs text-[var(--mf-text-secondary)] font-medium">/ 850</span>
                    </span>
                    <span className="mt-2.5">
                      <GlassBadge variant={assessment.risk_category === 'Low' ? 'success' : 'warning'}>
                        {assessment.risk_category} Risk
                      </GlassBadge>
                    </span>
                  </GlassPanel>

                  {/* Underwriting ratios */}
                  <GlassPanel className="p-5 flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] text-[var(--mf-text-secondary)] font-bold uppercase tracking-wider block mb-3">Underwriting Ratios</span>
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-[var(--mf-text-secondary)]">Repayment Probability</span>
                          <span className="font-bold text-emerald-500">{(assessment.repayment_probability! * 100).toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-white/5 rounded-full h-1">
                          <div className="bg-emerald-500 h-1 rounded-full" style={{ width: `${assessment.repayment_probability! * 100}%` }}></div>
                        </div>

                        <div className="flex justify-between text-[10px]">
                          <span className="text-[var(--mf-text-secondary)]">Default Probability</span>
                          <span className="font-bold text-rose-500">{(assessment.default_probability! * 100).toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-white/5 rounded-full h-1">
                          <div className="bg-rose-500 h-1 rounded-full" style={{ width: `${assessment.default_probability! * 100}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </GlassPanel>

                  {/* Indicative borrowing capacity */}
                  <GlassPanel className="p-5 flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] text-[var(--mf-text-secondary)] font-bold uppercase tracking-wider">Indicative Capacity</span>
                      <span className="text-xl font-extrabold text-[var(--mf-text-primary)] block mt-2">
                        GH₵{assessment.indicative_credit_capacity?.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                      </span>
                      <p className="text-[9px] text-[var(--mf-text-secondary)] mt-3 leading-normal">
                        Estimated borrowing capacity based on observed inflows, inflow volatility, and default ratios.
                      </p>
                    </div>
                  </GlassPanel>
                </div>

                {/* Available Financial Services Catalog */}
                <GlassPanel className="p-5 space-y-4">
                  <div>
                    <h4 className="font-bold text-[var(--mf-text-primary)] text-xs uppercase tracking-wider flex items-center">
                      <Landmark className="h-4.5 w-4.5 text-[var(--mf-accent)] mr-1.5" />
                      Available Financial Services
                    </h4>
                    <p className="text-[10px] text-[var(--mf-text-secondary)] leading-normal mt-0.5">
                      Connect alternative credit intelligence to responsible access to finance. Products sponsored by Forms Capital.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                    {products.map(p => {
                      const isRequested = activeRequest && activeRequest.product_name === p.product_name;
                      return (
                        <GlassCard key={p.product_name} className="p-4 flex flex-col justify-between h-fit text-xs space-y-3">
                          <div className="space-y-1">
                            <span className="font-bold text-[var(--mf-text-primary)]">{p.product_name}</span>
                            <p className="text-[9.5px] text-[var(--mf-text-secondary)] leading-normal">{p.description}</p>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-[9px] text-[var(--mf-text-secondary)] border-t border-[var(--mf-border)] pt-2.5">
                              <span>Range:</span>
                              <span className="font-bold text-[var(--mf-text-primary)]">{p.range}</span>
                            </div>
                            
                            {isRequested ? (
                              <GlassBadge variant="warning" className="w-full text-center py-1.5 font-bold">
                                Under Review
                              </GlassBadge>
                            ) : (
                              <GlassButton 
                                variant="primary" 
                                className="w-full text-[9px] py-1.5 font-bold uppercase tracking-wider flex items-center justify-center space-x-1"
                                onClick={() => openRequestModal(p)}
                              >
                                <span>Request Financing</span>
                                <ArrowRight className="h-3.5 w-3.5" />
                              </GlassButton>
                            )}
                          </div>
                        </GlassCard>
                      );
                    })}
                  </div>
                </GlassPanel>

                {/* active pending request status panel */}
                {activeRequest && (
                  <GlassPanel className="p-5 border-amber-500/20 bg-amber-500/5 space-y-3">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4.5 w-4.5 text-amber-500 flex-shrink-0" />
                      <h4 className="font-bold text-xs text-[var(--mf-text-primary)] uppercase tracking-wider">
                        Institutional Underwriting Underway
                      </h4>
                    </div>
                    <p className="text-[10px] text-[var(--mf-text-secondary)] leading-relaxed">
                      Financing request for <strong>GH₵{activeRequest.requested_amount.toLocaleString()}</strong> ({activeRequest.product_name}) is currently in review. The alternative assessment generates indicative guidelines and does NOT guarantee immediate credit disbursement.
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white/5 p-3 rounded-xl border border-white/5 text-[10px]">
                      <div>
                        <span className="text-[9px] text-[var(--mf-text-secondary)] block">Product</span>
                        <span className="font-bold text-[var(--mf-text-primary)]">{activeRequest.product_name}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-[var(--mf-text-secondary)] block">Term</span>
                        <span className="font-bold text-[var(--mf-text-primary)]">{activeRequest.requested_term} Days</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-[var(--mf-text-secondary)] block">Submitted</span>
                        <span className="font-bold text-[var(--mf-text-primary)]">{new Date(activeRequest.created_at).toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-[var(--mf-text-secondary)] block">Workflow status</span>
                        <span className="font-bold text-amber-500">{activeRequest.status}</span>
                      </div>
                    </div>
                  </GlassPanel>
                )}

                {/* SHAP explainers */}
                <GlassPanel className="p-5">
                  <h4 className="font-bold text-[var(--mf-text-primary)] text-xs uppercase tracking-wider mb-4">Factors Influencing This Assessment</h4>
                  <div className="space-y-2.5">
                    {assessment.factors?.map((f, idx) => {
                      const isPositive = f.value > 0;
                      return (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <span className="text-[var(--mf-text-secondary)] font-medium">{f.feature}</span>
                          <div className="flex items-center space-x-2">
                            <span className="h-1.5 w-20 rounded-full bg-white/5 overflow-hidden relative block border border-[var(--mf-border)]">
                              <span className={`h-full absolute top-0 ${isPositive ? 'bg-emerald-500 right-0' : 'bg-rose-500 left-0'}`} style={{ 
                                width: `${Math.min(Math.abs(f.value) * 100, 100)}%` 
                              }} />
                            </span>
                            <span className={`font-bold ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {isPositive ? '+' : ''}{f.value.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </GlassPanel>

                {/* Historical Inflow/Outflow Timeline */}
                <GlassPanel className="p-5 flex flex-col space-y-4">
                  <div>
                    <h4 className="font-bold text-[var(--mf-text-primary)] text-xs uppercase tracking-wider">Observed Inflow vs Outflow History</h4>
                    <p className="text-[10px] text-[var(--mf-text-secondary)]">Monthly aggregated observed inflows vs outflows</p>
                  </div>
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--mf-border)" />
                        <XAxis dataKey="month" tick={{ fontSize: 9, fill: 'var(--mf-text-secondary)' }} stroke="var(--mf-border)" />
                        <YAxis tick={{ fontSize: 9, fill: 'var(--mf-text-secondary)' }} stroke="var(--mf-border)" />
                        <Tooltip contentStyle={{ backgroundColor: 'var(--mf-surface)', borderColor: 'var(--mf-border)', borderRadius: '10px' }} />
                        <Legend wrapperStyle={{ fontSize: 9 }} />
                        <Bar dataKey="Observed Inflows" fill="var(--mf-accent)" radius={[2, 2, 0, 0]} />
                        <Bar dataKey="Outflows" fill="rgba(255, 255, 255, 0.2)" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </GlassPanel>

                {/* Disclaimer */}
                <div className="bg-white/5 border border-[var(--mf-border)] rounded-2xl p-4 text-[9px] text-[var(--mf-text-secondary)] leading-normal flex items-start space-x-2.5 backdrop-blur-md">
                  <ShieldAlert className="h-4.5 w-4.5 text-[var(--mf-text-secondary)] flex-shrink-0 mt-0.5" />
                  <p>
                    <strong>Responsible AI Disclaimer:</strong> Alternative credit assessment is indicative and does not guarantee loan approval. 
                    Final lending decisions require appropriate institutional underwriting. Physical location coordinates are explicitly excluded from the alternative credit evaluation feature set.
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-[var(--mf-text-secondary)] space-y-2">
            <Users className="h-10 w-10 text-[var(--mf-text-secondary)]/50" />
            <p className="text-xs">Select a customer from the left sidebar to load their alternative credit assessment profile.</p>
          </div>
        )}
      </div>

      {/* Financing Request Modal */}
      {selectedProduct && (
        <GlassModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={`Request ${selectedProduct.product_name}`}
        >
          <form onSubmit={handleRequestSubmit} className="space-y-4 text-xs text-[var(--mf-text-primary)]">
            {modalError && (
              <div className="bg-rose-500/10 border border-rose-500/25 text-rose-500 p-3 rounded-xl font-medium leading-normal">
                {modalError}
              </div>
            )}

            <div>
              <label className="text-[9px] font-bold text-[var(--mf-text-secondary)] uppercase tracking-wider block mb-1">Applicant ID</label>
              <input
                type="text"
                readOnly
                value={selectedCustomer?.display_name || ''}
                className="w-full bg-white/5 border border-[var(--mf-border)] rounded-xl p-3 focus:outline-none opacity-60 font-semibold"
              />
            </div>

            <div>
              <label className="text-[9px] font-bold text-[var(--mf-text-secondary)] uppercase tracking-wider block mb-1">Product catalog item</label>
              <input
                type="text"
                readOnly
                value={selectedProduct.product_name}
                className="w-full bg-white/5 border border-[var(--mf-border)] rounded-xl p-3 focus:outline-none opacity-60 font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] font-bold text-[var(--mf-text-secondary)] uppercase tracking-wider block mb-1">Requested Amount (GH₵)</label>
                <input
                  type="number"
                  required
                  value={reqAmount}
                  onChange={e => setReqAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white/5 border border-[var(--mf-border)] rounded-xl p-3 focus:outline-none focus:border-[var(--mf-accent)] text-xs text-[var(--mf-text-primary)]"
                />
              </div>
              <div>
                <label className="text-[9px] font-bold text-[var(--mf-text-secondary)] uppercase tracking-wider block mb-1">Requested Term (Days)</label>
                <select
                  value={reqTerm}
                  onChange={e => setReqTerm(parseInt(e.target.value) || 30)}
                  className="w-full bg-white/5 border border-[var(--mf-border)] rounded-xl p-3 focus:outline-none focus:border-[var(--mf-accent)] text-xs text-[var(--mf-text-primary)] dark:text-white dark:bg-[#0c1c09]"
                >
                  <option value={30} className="dark:bg-[#0c1c09]">30 Days</option>
                  <option value={60} className="dark:bg-[#0c1c09]">60 Days</option>
                  <option value={90} className="dark:bg-[#0c1c09]">90 Days</option>
                </select>
              </div>
            </div>

            {/* alternative assessment capacity limit indicator */}
            <div className="bg-white/5 border border-[var(--mf-border)] rounded-xl p-3 text-[10px] space-y-1">
              <div className="flex justify-between">
                <span className="text-[var(--mf-text-secondary)]">Indicative Credit Capacity:</span>
                <span className="font-bold text-[var(--mf-text-primary)]">GH₵{assessment?.indicative_credit_capacity?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--mf-text-secondary)]">Repayment Probability:</span>
                <span className="font-bold text-emerald-500">{(assessment?.repayment_probability! * 100).toFixed(0)}%</span>
              </div>
              {reqAmount > (assessment?.indicative_credit_capacity || 0) && (
                <div className="text-rose-500 font-bold mt-1.5 flex items-center">
                  <ShieldAlert className="h-3 w-3 mr-1" /> Requested amount exceeds indicative credit capacity!
                </div>
              )}
            </div>

            <div>
              <label className="text-[9px] font-bold text-[var(--mf-text-secondary)] uppercase tracking-wider block mb-1">Purpose of Funds</label>
              <textarea
                required
                rows={3}
                value={reqPurpose}
                onChange={e => setReqPurpose(e.target.value)}
                placeholder="Describe how these funds will be deployed..."
                className="w-full bg-white/5 border border-[var(--mf-border)] rounded-xl p-3 focus:outline-none focus:border-[var(--mf-accent)] text-xs text-[var(--mf-text-primary)]"
              />
            </div>

            <div className="flex space-x-3 pt-2">
              <GlassButton type="button" onClick={() => setIsModalOpen(false)} className="flex-1 font-bold py-2.5">
                Cancel
              </GlassButton>
              <GlassButton 
                type="submit" 
                variant="primary" 
                className="flex-1 font-bold py-2.5"
                disabled={isSubmittingRequest}
              >
                {isSubmittingRequest ? 'Submitting...' : 'Submit Request'}
              </GlassButton>
            </div>
          </form>
        </GlassModal>
      )}
    </div>
  );
};

export default CustomerIntelligence;
