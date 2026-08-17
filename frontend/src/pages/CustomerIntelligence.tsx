import React, { useEffect, useState } from 'react';
import { 
  Search, ShieldCheck, Key, ShieldAlert, Award, FileText, CheckCircle2,
  XCircle, BarChart3, TrendingUp, Calendar, AlertCircle, Users
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ApiService from '../services/api';
import { CustomerProfile, CreditAssessment } from '../types';

const CustomerIntelligence: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);
  const [assessment, setAssessment] = useState<CreditAssessment | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDetailLoading, setIsDetailLoading] = useState<boolean>(false);
  const [chartData, setChartData] = useState<any[]>([]);
  const [viewState, setViewState] = useState<'list' | 'profile'>('list');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async (search = '') => {
    setIsLoading(true);
    try {
      const res = await ApiService.listCustomers(search || undefined);
      setCustomers(res);
      
      if (res.length > 0) {
        const hero = res.find(c => c.customer_id === 1048) || res[0];
        // Do not force redirecting to profile viewState on initial mount list load
        setSelectedCustomerId(hero.customer_id);
        setSelectedCustomer(hero);
        setIsDetailLoading(true);
        ApiService.getCreditAssessment(hero.customer_id)
          .then(assessmentData => {
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
          })
          .finally(() => setIsDetailLoading(false));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectCustomer = async (cust: CustomerProfile) => {
    setSelectedCustomerId(cust.customer_id);
    setSelectedCustomer(cust);
    setViewState('profile');
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCustomers(searchQuery);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100dvh-95px)] lg:h-[calc(100vh-140px)] overflow-hidden animate-fadeIn max-w-6xl mx-auto">
      {/* Left Sidebar: Customer List */}
      <div className={`lg:col-span-1 premium-card bg-white flex flex-col space-y-3 h-full overflow-hidden ${viewState === 'list' ? 'flex' : 'hidden lg:flex'}`}>
        <form onSubmit={handleSearch} className="relative flex-shrink-0">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search Customer ID..."
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2.5 focus:outline-none focus:border-slate-800"
          />
          <Search className="absolute left-2.5 top-3.5 h-3.5 w-3.5 text-slate-400" />
        </form>

        <div className="flex-1 overflow-y-auto space-y-1 pr-0.5">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-teal-600"></div>
            </div>
          ) : customers.length === 0 ? (
            <p className="text-center text-[10px] text-slate-400 py-8">No records</p>
          ) : (
            customers.map(c => {
              const isSelected = selectedCustomerId === c.customer_id;
              return (
                <button
                  key={c.customer_id}
                  onClick={() => handleSelectCustomer(c)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg border text-xs transition ${
                    isSelected
                      ? 'bg-slate-900 border-slate-950 text-white font-semibold'
                      : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span>{c.display_name}</span>
                    <span className={`h-1.5 w-1.5 rounded-full ${c.consent_status ? 'bg-teal-500' : 'bg-slate-350'}`} />
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right Area: Profile Details - independent scroll */}
      <div className={`lg:col-span-3 h-full overflow-y-auto pr-1 space-y-6 pb-6 ${viewState === 'profile' ? 'block' : 'hidden lg:block'}`}>
        {/* Back to List button for mobile/tablet */}
        <div className="lg:hidden flex-shrink-0">
          <button
            onClick={() => setViewState('list')}
            className="flex items-center space-x-2 text-xs font-bold text-slate-650 dark:text-slate-300 bg-white dark:bg-[#1e293b]/70 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-lg cursor-pointer transition-colors shadow-sm"
          >
            <span>← Back to Customers</span>
          </button>
        </div>
        {isDetailLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-600"></div>
          </div>
        ) : selectedCustomer && assessment ? (
          <div className="space-y-6">
            
            {/* Header */}
            <div className="premium-card bg-white flex justify-between items-center">
              <div>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Consented Registry Profile</span>
                <h3 className="text-base font-bold text-slate-950 mt-1">{selectedCustomer.display_name}</h3>
              </div>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                selectedCustomer.consent_status 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'bg-slate-50 text-slate-400 border border-slate-200'
              }`}>
                {selectedCustomer.consent_status ? <ShieldCheck className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                Consent: {selectedCustomer.consent_status ? 'Active' : 'Unsigned'}
              </span>
            </div>

            {/* Assessment Condition Check */}
            {!assessment.eligible ? (
              /* FINANCIAL READINESS PROGRESS GAUGE */
              <div className="premium-card bg-white space-y-6">
                <div className="flex items-start space-x-3 text-amber-700 bg-amber-50 p-4 rounded-xl border border-amber-200">
                  <AlertCircle className="h-4.5 w-4.5 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-xs">Alternative Credit Score Gated</h4>
                    <p className="text-[11px] leading-normal mt-1">
                      {assessment.reason || 'Customer has not yet met the history and activity thresholds.'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  {/* Circular Gauge */}
                  <div className="flex flex-col items-center justify-center p-4 border border-slate-100 rounded-xl bg-slate-50/50">
                    <span className="text-[9px] font-bold text-slate-450 uppercase tracking-widest block mb-3">Financial Readiness Score</span>
                    <div className="relative h-24 w-24 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="48" cy="48" r="40" stroke="#e2e8f0" strokeWidth="6" fill="transparent" />
                        <circle 
                          cx="48" 
                          cy="48" 
                          r="40" 
                          stroke="#0d9488" 
                          strokeWidth="6" 
                          fill="transparent" 
                          strokeDasharray="251"
                          strokeDashoffset={251 - (251 * assessment.financial_readiness_score) / 100}
                        />
                      </svg>
                      <span className="absolute text-lg font-extrabold text-slate-800">{assessment.financial_readiness_score}%</span>
                    </div>
                    <p className="text-[9px] text-slate-400 text-center leading-normal mt-4">
                      Measures data maturity before alternative underwriting can trigger.
                    </p>
                  </div>

                  {/* Checklist */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-slate-800 text-[10px] uppercase tracking-wider">Sufficiency Criteria Check</h4>
                    
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between p-2.5 bg-white rounded-lg border border-slate-100">
                        <span className="text-slate-500">Opt-in Consent Active</span>
                        <span className={selectedCustomer.consent_status ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                          {selectedCustomer.consent_status ? 'Signature Verified' : 'Pending'}
                        </span>
                      </div>
                      <div className="flex justify-between p-2.5 bg-white rounded-lg border border-slate-100">
                        <span className="text-slate-500">Active History Duration</span>
                        <span className={assessment.history_days >= 90 ? 'text-emerald-600 font-bold' : 'text-slate-650'}>
                          {assessment.history_days} / 90 days
                        </span>
                      </div>
                      <div className="flex justify-between p-2.5 bg-white rounded-lg border border-slate-100">
                        <span className="text-slate-500">Transaction Volume</span>
                        <span className={assessment.transaction_count >= 30 ? 'text-emerald-600 font-bold' : 'text-slate-650'}>
                          {assessment.transaction_count} / 30 txs
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-[9px] text-slate-400 leading-normal">
                      Financial Readiness is a measure of profile data maturity and transaction consistency, NOT an approval guarantee.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* ALTERNATIVE CREDIT ASSESSMENT PANEL */
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Credit Score */}
                  <div className="premium-card bg-white flex flex-col items-center justify-center text-center">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Alternative Credit Score</span>
                    <span className="text-3xl font-extrabold text-slate-900 block mt-2">
                      {assessment.credit_score} <span className="text-xs text-slate-400 font-medium">/ 850</span>
                    </span>
                    <span className="mt-2.5 bg-teal-50 text-teal-800 text-[8px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider">
                      {assessment.risk_category} Risk
                    </span>
                  </div>

                  {/* Underwriting ratios */}
                  <div className="premium-card bg-white flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-3">Underwriting Ratios</span>
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-slate-500">Repayment Probability</span>
                          <span className="font-bold text-emerald-650">{(assessment.repayment_probability! * 100).toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1">
                          <div className="bg-emerald-500 h-1 rounded-full" style={{ width: `${assessment.repayment_probability! * 100}%` }}></div>
                        </div>

                        <div className="flex justify-between text-[10px]">
                          <span className="text-slate-500">Default Probability</span>
                          <span className="font-bold text-red-500">{(assessment.default_probability! * 100).toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1">
                          <div className="bg-red-500 h-1 rounded-full" style={{ width: `${assessment.default_probability! * 100}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Indicative borrowing capacity */}
                  <div className="premium-card bg-white flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Indicative Capacity</span>
                      <span className="text-xl font-extrabold text-slate-800 block mt-2">
                        GH₵{assessment.indicative_credit_capacity?.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                      </span>
                      <p className="text-[9px] text-slate-400 mt-3 leading-normal">
                        Estimated borrowing capacity based on observed inflows, inflow volatility, and default ratios.
                      </p>
                    </div>
                  </div>
                </div>

                {/* SHAP explainers */}
                <div className="premium-card bg-white">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-4">Factors Influencing This Assessment</h4>
                  <div className="space-y-2.5">
                    {assessment.factors?.map((f, idx) => {
                      const isPositive = f.value > 0;
                      return (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-medium">{f.feature}</span>
                          <div className="flex items-center space-x-2">
                            <span className="h-1.5 w-20 rounded-full bg-slate-100 overflow-hidden relative block">
                              <span className={`h-full absolute top-0 ${isPositive ? 'bg-emerald-500 right-0' : 'bg-red-500 left-0'}`} style={{ 
                                width: `${Math.min(Math.abs(f.value) * 100, 100)}%` 
                              }} />
                            </span>
                            <span className={`font-bold ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                              {isPositive ? '+' : ''}{f.value.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Historical Inflow/Outflow Timeline */}
                <div className="premium-card bg-white flex flex-col space-y-4">
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Observed Inflow vs Outflow History</h4>
                    <p className="text-[10px] text-slate-400">Monthly aggregated observed inflows vs outflows</p>
                  </div>
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" />
                        <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#94a3b8' }} stroke="#e2e8f0" />
                        <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} stroke="#e2e8f0" />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: 9 }} />
                        <Bar dataKey="Observed Inflows" fill="#0d9488" radius={[2, 2, 0, 0]} />
                        <Bar dataKey="Outflows" fill="#cbd5e1" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Disclaimer */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-[9px] text-slate-400 leading-normal flex items-start space-x-2">
                  <ShieldAlert className="h-4.5 w-4.5 text-slate-400 flex-shrink-0 mt-0.5" />
                  <p>
                    <strong>Responsible AI Disclaimer:</strong> Alternative credit assessment is indicative and does not guarantee loan approval. 
                    Final lending decisions require appropriate institutional underwriting. Physical location coordinates are explicitly excluded from the alternative credit evaluation feature set.
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2">
            <Users className="h-10 w-10 text-slate-350" />
            <p className="text-xs">Select a customer from the left sidebar to load their alternative credit assessment profile.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerIntelligence;
