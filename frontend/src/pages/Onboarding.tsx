import React, { useState, useEffect } from 'react';
import { Sparkles, ShieldCheck, UserCheck, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import ApiService from '../services/api';
import { GlassPanel } from '../components/glass/GlassPanel';
import { GlassCard } from '../components/glass/GlassCard';
import { GlassButton } from '../components/glass/GlassButton';

interface OnboardingProps {
  onComplete: (user: any) => void;
  onBackToLanding: () => void;
}

const GHANAIAN_REGIONS = [
  "Greater Accra", "Ashanti", "Northern", "Western", "Volta", "Eastern", "Central"
];

const GHANAIAN_LOCATIONS = [
  "Greater Accra - Central Accra",
  "Greater Accra - Madina",
  "Ashanti - Kumasi Central",
  "Ashanti - Obuasi",
  "Northern - Tamale",
  "Western - Takoradi",
  "Volta - Ho",
  "Eastern - Koforidua",
  "Central - Cape Coast"
];

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete, onBackToLanding }) => {
  const [step, setStep] = useState<number>(1);

  // Dynamic scroll unlock hook for the wizard steps
  useEffect(() => {
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevHtmlHeight = document.documentElement.style.height;
    const prevBodyOverflow = document.body.style.overflow;
    const prevBodyHeight = document.body.style.height;

    document.documentElement.style.overflow = 'auto';
    document.documentElement.style.height = 'auto';
    document.body.style.overflow = 'auto';
    document.body.style.height = 'auto';

    const rootEl = document.getElementById('root');
    let prevRootOverflow = '';
    let prevRootHeight = '';
    if (rootEl) {
      prevRootOverflow = rootEl.style.overflow;
      prevRootHeight = rootEl.style.height;
      rootEl.style.overflow = 'visible';
      rootEl.style.height = 'auto';
    }

    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow || 'hidden';
      document.documentElement.style.height = prevHtmlHeight || '100%';
      document.body.style.overflow = prevBodyOverflow || 'hidden';
      document.body.style.height = prevBodyHeight || '100%';
      if (rootEl) {
        rootEl.style.overflow = prevRootOverflow || 'hidden';
        rootEl.style.height = prevRootHeight || '100%';
      }
    };
  }, []);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    business_name: '',
    phone: '',
    region: 'Greater Accra',
    city: '',
    location: '',
    agent_type: 'Retailer',
    starting_cash: 2500,
    starting_float: 5000
  });
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [onboardedUser, setOnboardedUser] = useState<any>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.startsWith('starting_') ? parseFloat(value) || 0 : value
    }));
  };

  const handleNext = () => {
    setErrorMsg(null);
    if (step === 1) {
      if (!formData.full_name.trim()) {
        setErrorMsg("Full Name is required.");
        return;
      }
      const phoneRegex = /^\+?[0-9\s-]{9,15}$/;
      if (!formData.phone.trim()) {
        setErrorMsg("Phone Number is required.");
        return;
      }
      if (!phoneRegex.test(formData.phone.trim())) {
        setErrorMsg("Please enter a valid Phone Number (e.g., +233 24 111 2222).");
        return;
      }
      if (!formData.password.trim()) {
        setErrorMsg("Password is required to secure your account.");
        return;
      }
    }
    if (step === 2) {
      if (!formData.business_name.trim()) {
        setErrorMsg("Business Name is required.");
        return;
      }
      if (!formData.region) {
        setErrorMsg("Region is required.");
        return;
      }
      if (!formData.city.trim()) {
        setErrorMsg("City is required.");
        return;
      }
      if (!formData.location.trim()) {
        setErrorMsg("Specific Location / Address is required.");
        return;
      }
      if (!formData.agent_type) {
        setErrorMsg("Agent Type is required.");
        return;
      }
    }
    if (step === 3) {
      if (formData.starting_cash < 0) {
        setErrorMsg("Starting Cash Balance must be non-negative.");
        return;
      }
      if (formData.starting_float < 0) {
        setErrorMsg("Starting E-Float Balance must be non-negative.");
        return;
      }
    }
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setErrorMsg(null);
    setStep(prev => Math.max(1, prev - 1));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const formattedPhone = formData.phone.trim();
      // 1. Post registration onboarding request
      await ApiService.registerAgent({
        username: formattedPhone,
        password: formData.password,
        full_name: formData.full_name,
        business_name: formData.business_name,
        phone: formattedPhone,
        region: formData.region,
        location: `${formData.region} - ${formData.city}`,
        agent_type: formData.agent_type,
        starting_cash: formData.starting_cash,
        starting_float: formData.starting_float
      });

      // 2. Perform automatic login to capture token session
      const loginRes = await ApiService.login(formattedPhone, formData.password);
      setOnboardedUser(loginRes);
      
      setStep(5);
    } catch (err: any) {
      setErrorMsg(err.message || "Registration failed. Please verify connection and retry.");
      setStep(3); // Kick back to step 3 to fix inputs
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessProceed = () => {
    if (onboardedUser) {
      onComplete(onboardedUser);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto p-4 select-none text-white">
      {/* Back button */}
      {step < 5 && (
        <button
          onClick={onBackToLanding}
          className="mb-6 flex items-center space-x-2 text-white/70 hover:text-white transition text-xs font-semibold cursor-pointer border-none bg-transparent"
        >
          <span>← Back to Home</span>
        </button>
      )}

      <GlassPanel className="p-6 md:p-8 space-y-6 animate-fadeIn border-white/10 bg-slate-900/65 backdrop-blur-xl">
        {/* Step Indicator Header */}
        {step <= 4 && (
          <div className="border-b border-white/10 pb-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="bg-emerald-600 text-white rounded-lg p-1.5 flex items-center justify-center font-bold text-sm h-6 w-6">
                  M
                </div>
                <span className="font-bold text-sm text-white uppercase tracking-wider">
                  Agent Onboarding
                </span>
              </div>
              <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest lg:hidden">
                Step {step} of 4: {step === 1 ? 'Business' : step === 2 ? 'Operations' : step === 3 ? 'Financial' : 'Review'}
              </span>
            </div>

            {/* Desktop Visual Steps Bar */}
            <div className="hidden lg:flex justify-between items-center text-[9px] font-extrabold uppercase tracking-wider text-white/60">
              <span className={step === 1 ? "text-emerald-400" : ""}>01 Business</span>
              <span>&rarr;</span>
              <span className={step === 2 ? "text-emerald-400" : ""}>02 Operations</span>
              <span>&rarr;</span>
              <span className={step === 3 ? "text-emerald-400" : ""}>03 Financial Setup</span>
              <span>&rarr;</span>
              <span className={step === 4 ? "text-emerald-400" : ""}>04 Review</span>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="bg-rose-500/20 border border-rose-500/30 text-rose-200 rounded-xl p-3.5 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {/* STEP 1: Account Information */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-base text-white">Account Information</h3>
              <p className="text-[11px] text-white/70">Create your secure agent account to get started.</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[9px] font-bold text-white/70 uppercase tracking-widest block mb-1">Full Name</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  placeholder="e.g. Kwame Mensah"
                  className="w-full text-xs bg-slate-950/40 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-emerald-450 text-white placeholder-white/30"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-white/70 uppercase tracking-widest block mb-1">Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="e.g. +233 24 111 2222"
                  className="w-full text-xs bg-slate-950/40 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-emerald-450 text-white placeholder-white/30"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-white/70 uppercase tracking-widest block mb-1">Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className="w-full text-xs bg-slate-950/40 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-emerald-450 text-white placeholder-white/30"
                />
              </div>
            </div>

            <GlassButton variant="primary" onClick={handleNext} className="w-full mt-4 font-bold flex items-center justify-center space-x-1.5 text-white bg-emerald-600 hover:bg-emerald-500 border-none">
              <span>Continue</span>
              <ArrowRight className="h-4 w-4" />
            </GlassButton>
          </div>
        )}

        {/* STEP 2: Business & Operations */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-base text-white">Business & Operations</h3>
              <p className="text-[11px] text-white/70">Specify your business name and primary branch coordinates.</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[9px] font-bold text-white/70 tracking-widest block mb-1">Business Name</label>
                <input
                  type="text"
                  name="business_name"
                  value={formData.business_name}
                  onChange={handleInputChange}
                  placeholder="e.g. Kwame's Mobile Money Centre"
                  className="w-full text-xs bg-slate-950/40 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-emerald-450 text-white placeholder-white/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold text-white/70 tracking-widest block mb-1">Region</label>
                  <select
                    name="region"
                    value={formData.region}
                    onChange={handleInputChange}
                    className="w-full text-xs bg-slate-900 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-emerald-450 text-white"
                  >
                    {GHANAIAN_REGIONS.map(r => (
                      <option key={r} value={r} className="bg-slate-900 text-white">{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-white/70 tracking-widest block mb-1">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="e.g. Kumasi"
                    className="w-full text-xs bg-slate-950/40 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-emerald-450 text-white placeholder-white/30"
                  />
                </div>
              </div>

              <div>
                <label className="text-[9px] font-bold text-white/70 tracking-widest block mb-1">Specific Location / Address</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="e.g. Adum Market Square, block C"
                  className="w-full text-xs bg-slate-950/40 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-emerald-450 text-white placeholder-white/30"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-white/70 tracking-widest block mb-1">Agent Type</label>
                <select
                  name="agent_type"
                  value={formData.agent_type}
                  onChange={handleInputChange}
                  className="w-full text-xs bg-slate-900 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-emerald-450 text-white"
                >
                  <option value="Retailer" className="bg-slate-900 text-white">Retailer (Direct customer transactions)</option>
                  <option value="Sub-Agent" className="bg-slate-900 text-white">Sub-Agent (Operates under super-agent)</option>
                  <option value="Super-Agent" className="bg-slate-900 text-white">Super-Agent (Liquidity supplier)</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-3 mt-4">
              <GlassButton onClick={handleBack} className="flex-1 flex items-center justify-center space-x-1 border-white/10 text-white hover:bg-white/10">
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </GlassButton>
              <GlassButton variant="primary" onClick={handleNext} className="flex-1 font-bold flex items-center justify-center space-x-1.5 text-white bg-emerald-600 hover:bg-emerald-500 border-none">
                <span>Continue</span>
                <ArrowRight className="h-4 w-4" />
              </GlassButton>
            </div>
          </div>
        )}

        {/* STEP 3: Financial Setup */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-base text-white">Financial Setup</h3>
              <p className="text-[11px] text-white/70">Input starting balances. These will populate your daily ledger and forecast baseline.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[9px] font-bold text-white/70 uppercase tracking-widest block mb-1">Starting Cash Balance (GH₵)</label>
                <input
                  type="number"
                  name="starting_cash"
                  value={formData.starting_cash}
                  onChange={handleInputChange}
                  placeholder="2500.00"
                  className="w-full text-xs bg-slate-950/40 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-emerald-450 text-white placeholder-white/30"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-white/70 uppercase tracking-widest block mb-1">Starting E-Float Balance (GH₵)</label>
                <input
                  type="number"
                  name="starting_float"
                  value={formData.starting_float}
                  onChange={handleInputChange}
                  placeholder="5000.00"
                  className="w-full text-xs bg-slate-950/40 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-emerald-450 text-white placeholder-white/30"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-4">
              <GlassButton onClick={handleBack} className="flex-1 flex items-center justify-center space-x-1 border-white/10 text-white hover:bg-white/10">
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </GlassButton>
              <GlassButton variant="primary" onClick={handleNext} className="flex-1 font-bold flex items-center justify-center space-x-1.5 text-white bg-emerald-600 hover:bg-emerald-500 border-none">
                <span>Review Profile</span>
                <ArrowRight className="h-4 w-4" />
              </GlassButton>
            </div>
          </div>
        )}

        {/* STEP 4: Review & Confirmation */}
        {step === 4 && (
          <div className="space-y-5">
            <div className="text-center space-y-2">
              <div className="bg-emerald-500/10 text-emerald-400 p-3.5 rounded-full w-fit mx-auto border border-emerald-500/20">
                <UserCheck className="h-8 w-8" />
              </div>
              <h3 className="font-extrabold text-xl text-white uppercase tracking-tight">Onboarding Profile Review</h3>
              <p className="text-xs text-white/70 leading-relaxed">
                Verify all entered information below. Click "Create Agent Profile" to commit.
              </p>
            </div>

            <GlassCard className="space-y-2.5 text-xs p-4 bg-white/5 border-white/10 text-white">
              <div className="flex justify-between">
                <span className="text-white/70">Agent Name:</span>
                <span className="font-bold text-white">{formData.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Shop Name:</span>
                <span className="font-bold text-white">{formData.business_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Phone Number:</span>
                <span className="font-bold text-white">{formData.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Agent Type:</span>
                <span className="font-bold text-white">{formData.agent_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Starting Cash:</span>
                <span className="font-bold text-white">GH₵{formData.starting_cash.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Starting Float:</span>
                <span className="font-bold text-white">GH₵{formData.starting_float.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Operating Location:</span>
                <span className="font-bold text-white">{formData.region} — {formData.city}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Address:</span>
                <span className="font-bold text-white">{formData.location}</span>
              </div>
            </GlassCard>

            <div className="space-y-2 text-white/80">
              <div className="flex items-center space-x-2 text-[11px]">
                <ShieldCheck className="h-4 w-4 text-emerald-450 flex-shrink-0" />
                <span>Business Health monitoring engine ready</span>
              </div>
              <div className="flex items-center space-x-2 text-[11px]">
                <ShieldCheck className="h-4 w-4 text-emerald-450 flex-shrink-0" />
                <span>Liquidity demand forecasting baseline active</span>
              </div>
            </div>

            <div className="flex space-x-3 mt-4">
              <GlassButton onClick={handleBack} className="flex-1 flex items-center justify-center space-x-1 border-white/10 text-white hover:bg-white/10" disabled={isSubmitting}>
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </GlassButton>
              <GlassButton 
                variant="primary" 
                onClick={handleSubmit} 
                className="flex-1 font-bold flex items-center justify-center space-x-1.5 text-white bg-emerald-600 hover:bg-emerald-500 border-none"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="animate-pulse">Creating...</span>
                ) : (
                  <>
                    <span>Create Agent Profile</span>
                    <Sparkles className="h-4 w-4" />
                  </>
                )}
              </GlassButton>
            </div>
          </div>
        )}

        {/* STEP 5: Success Confirmation Screen */}
        {step === 5 && (
          <div className="space-y-6 text-center animate-fadeIn">
            <div className="bg-emerald-500/10 text-emerald-400 p-4 rounded-full w-fit mx-auto border border-emerald-500/20">
              <CheckCircle2 className="h-10 w-10 text-emerald-400 animate-bounce" />
            </div>
            
            <div className="space-y-2">
              <h3 className="font-extrabold text-xl text-white">
                Agent Profile Created
              </h3>
              <p className="text-xs text-white/70 leading-relaxed">
                Your MobiFin workspace is ready.
              </p>
            </div>

            <GlassCard className="space-y-3 text-xs p-4 bg-white/5 border-white/10 text-white text-left">
              <div className="flex justify-between border-b border-white/10 pb-2 mb-2">
                <span className="text-white/70 font-semibold">Agent ID:</span>
                <span className="font-mono text-emerald-450 font-bold uppercase tracking-wider">
                  {onboardedUser?.agent_id ? `MOB-AG-${String(onboardedUser.agent_id).padStart(4, '0')}` : 'MOB-AG-XXXX'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Name:</span>
                <span className="font-bold text-white">{formData.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Business:</span>
                <span className="font-bold text-white">{formData.business_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Phone:</span>
                <span className="font-bold text-white">{formData.phone}</span>
              </div>
            </GlassCard>

            <GlassButton 
              variant="primary" 
              onClick={handleSuccessProceed} 
              className="w-full font-bold py-3 flex items-center justify-center space-x-1.5 uppercase tracking-wider text-xs text-white bg-emerald-600 hover:bg-emerald-500 border-none"
            >
              <span>Enter Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </GlassButton>
          </div>
        )}
      </GlassPanel>
    </div>
  );
};
