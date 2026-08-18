import React, { useEffect } from 'react';
import Lenis from 'lenis';
import { 
  Activity, ShieldCheck, ArrowRight, CheckCircle2, 
  ChevronRight, Info, ShieldAlert
} from 'lucide-react';
// @ts-ignore
import WireframeTerrain from '../components/WireframeTerrain';
// @ts-ignore
import { StaggeredMenu } from '../components/StaggeredMenu';

interface LandingPageProps {
  onLoginClick: () => void;
  onSignUpClick: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick, onSignUpClick }) => {
  // Lenis smooth scrolling setup
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Ensure dark mode is disabled on the landing page
    document.documentElement.classList.remove('dark');

    // Unlock body overflow and height for smooth scrolling
    document.documentElement.style.overflow = 'auto';
    document.documentElement.style.height = 'auto';
    document.body.style.overflow = 'auto';
    document.body.style.height = 'auto';
    
    const rootEl = document.getElementById('root');
    if (rootEl) {
      rootEl.style.overflow = 'visible';
      rootEl.style.height = 'auto';
    }

    return () => {
      lenis.destroy();
      // Lock overflow and height back for dashboard layouts
      document.documentElement.style.overflow = 'hidden';
      document.documentElement.style.height = '100%';
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100%';
      if (rootEl) {
        rootEl.style.overflow = 'hidden';
        rootEl.style.height = '100%';
      }
    };
  }, []);

  const scrollToHowItWorks = () => {
    const el = document.getElementById('how-it-works');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="font-sans text-slate-900 bg-white min-h-screen relative w-full overflow-x-hidden selection:bg-forest/10 selection:text-forest">
      
      {/* 3D WebGL Mesh Background (Refined Translucent Flow) */}
      <div className="absolute inset-0 z-0 overflow-hidden" style={{ height: '100vh', pointerEvents: 'none', opacity: 0.85 }}>
        <WireframeTerrain />
      </div>

      {/* Mobile Nav - Staggered Menu */}
      <div className="block lg:hidden relative z-50">
        <StaggeredMenu 
          isFixed={true}
          position="right"
          colors={['#baebc2', '#17280e']}
          accentColor="#17280e"
          menuButtonColor="#17280e"
          openMenuButtonColor="#000"
          displaySocials={false}
          logoUrl="/logo.png"
          items={[
            { label: 'How It Works', link: '#', onClick: scrollToHowItWorks },
            { label: 'Sign In', link: '#', onClick: onLoginClick },
            { label: 'Get Started', link: '#', onClick: onSignUpClick }
          ]}
        />
      </div>

      {/* Floating Centered Nav Bar (Desktop Only) */}
      <div className="hidden lg:block fixed top-6 left-0 right-0 z-40 mx-auto px-5 w-full max-w-[66.75rem]">
        <header className="h-[64px] w-full rounded-full border border-forest/10 bg-white/75 backdrop-blur-md shadow-sm transition-all duration-300">
          <div className="px-6 lg:px-8 h-full">
            <div className="flex h-full items-center justify-between w-full">
              <div className="flex-1 flex items-center space-x-3.5">
                <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} aria-label="MobiFin AI Home" className="flex items-center space-x-2.5 text-forest cursor-pointer pl-2">
                  <div className="bg-forest text-white p-1.5 rounded font-black text-sm flex items-center justify-center h-7 w-7">
                    M
                  </div>
                  <span className="font-bold text-2xl tracking-tighter text-forest">
                    MobiFin AI
                  </span>
                </a>
              </div>
            
              <nav aria-label="Main navigation">
                <ul className="flex gap-x-10">
                  <li className="relative">
                    <button onClick={scrollToHowItWorks} className="inline-block text-[14px] font-semibold text-forest/80 hover:text-forest cursor-pointer transition-colors border-none bg-transparent">
                      <span>How It Works</span>
                    </button>
                  </li>
                </ul>
              </nav>
              
              <div className="flex gap-x-3 flex-1 justify-end items-center">
                <button onClick={onLoginClick} className="group relative inline-flex appearance-none items-center py-2 select-none transition-colors justify-center text-forest min-h-[35px] px-4 border-none bg-transparent cursor-pointer">
                  <span className="absolute inset-0 rounded-full transition-all group-hover:scale-[0.98] origin-center bg-forest/5 group-hover:bg-forest/10"></span>
                  <span className="text-[13.5px] font-bold relative z-10">Sign In</span>
                </button>
                <button onClick={onSignUpClick} className="group relative inline-flex appearance-none items-center py-2 select-none transition-colors justify-center text-white min-h-[35px] px-5 border-none bg-transparent cursor-pointer">
                  <span className="absolute inset-0 rounded-full transition-all group-hover:scale-[0.98] origin-center bg-forest group-hover:bg-[#203415]"></span>
                  <span className="text-[13.5px] font-bold relative z-10">Get Started</span>
                </button>
              </div>
            </div>
          </div>
        </header>
      </div>

      <main className="relative z-10">
        
        {/* HERO SECTION */}
        <section className="relative overflow-hidden pt-12 pb-16 px-5 lg:px-8">
          <div className="lg:mt-4">
            <div className="relative bg-transparent py-14 max-md:-mx-5 md:py-20 lg:pt-28 lg:pb-24">
              <div className="mx-auto flex w-full max-w-[66.75rem] flex-col items-center px-5 text-center lg:px-12 mt-16 md:mt-24">
                
                {/* Refined Headline with tightened line-height */}
                <h1 className="text-4xl md:text-5xl lg:text-[56px] font-extrabold tracking-tight text-forest leading-[1.08] max-w-[48rem] mb-6">
                  Turn Financial Activity<br className="hidden sm:inline" /> Into Financial Access.
                </h1>
                
                {/* Corrected Subtitle detailing both layers without SME mention */}
                <p className="mt-4 w-full max-w-[42rem] opacity-90 text-base md:text-lg lg:text-[19px] leading-relaxed text-slate-800 font-medium">
                  MobiFin connects Mobile Money Agents, underserved customers, and financial institutions through consent-based financial intelligence. Agents can refer customers to participating financial institutions. Customers control access through secure consent, while institutions receive additional financial intelligence to support responsible underwriting.
                </p>
                
                {/* Hero CTA Structure with Hierarchy Gating */}
                <div className="flex flex-col items-center justify-center gap-4 mt-10 w-full max-w-lg">
                  {/* Primary CTA */}
                  <button onClick={onSignUpClick} className="group relative inline-flex appearance-none items-center py-3.5 select-none transition-colors justify-center text-white min-h-[46px] px-10 border-none bg-transparent cursor-pointer w-full sm:w-80 shadow-md">
                    <span className="absolute inset-0 rounded-full transition-all group-hover:scale-[0.98] origin-center bg-forest group-hover:bg-[#203415]"></span>
                    <span className="text-[15px] font-bold relative z-10 flex items-center justify-center space-x-1.5">
                      <span>Get Started as an Agent</span>
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </button>
                  
                  {/* Secondary & Tertiary CTAs */}
                  <div className="flex items-center gap-x-6 mt-1.5">
                    <button onClick={onLoginClick} className="group relative inline-flex appearance-none items-center py-2 select-none transition-colors justify-center text-forest min-h-[36px] px-4 border-none bg-transparent cursor-pointer text-[14.5px] font-bold">
                      <span className="absolute inset-0 rounded-full transition-all group-hover:scale-[0.98] origin-center bg-forest/5 group-hover:bg-forest/10"></span>
                      <span className="relative z-10">Sign In</span>
                    </button>
                    <span className="text-slate-300">|</span>
                    <button onClick={onLoginClick} className="group relative inline-flex appearance-none items-center py-2 select-none transition-colors justify-center text-slate-600 hover:text-forest min-h-[36px] px-4 border-none bg-transparent cursor-pointer text-[14.5px] font-semibold">
                      <span className="relative z-10">Institutional Access</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* OVERLAPPING STICKY CARDS CONTAINER (Inspired by lenis.dev) */}
        <div className="mx-auto w-full max-w-[66.75rem] px-5 lg:px-8 space-y-16 py-12 relative flex flex-col items-center">
          
          {/* Card 1: One platform. Two layers. */}
          <section 
            id="how-it-works" 
            className="sticky top-[96px] z-10 w-full bg-white border border-forest/10 rounded-[32px] p-6 sm:p-10 md:p-12 shadow-[0_10px_35px_rgba(23,40,14,0.03)] min-h-[60vh] flex flex-col justify-center"
          >
            <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
              <span className="text-xs uppercase tracking-widest font-extrabold text-lemongrass">Architecture</span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-forest tracking-tight">One platform. Two intelligence layers.</h2>
              <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">Connected intelligence that helps agents run operations seamlessly while bridging alternative financial profile visibility.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              {/* Card 1.1: Agent Intelligence */}
              <div className="bg-slate-50/50 border border-forest/5 rounded-[24px] p-6 sm:p-8 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="space-y-4">
                  <div className="bg-forest/5 p-3 rounded-2xl w-fit text-forest">
                    <Activity className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-[11px] uppercase tracking-widest font-bold text-lemongrass block mb-1">Layer 01</span>
                    <h3 className="text-xl font-bold text-forest">Agent Intelligence</h3>
                  </div>
                  <h4 className="text-[14px] font-semibold text-slate-700">"Run your business with foresight."</h4>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Monitor transactions, manage cash and e-float, forecast demand, and receive actionable recommendations before liquidity problems occur.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {["Cash & E-Float", "Demand Forecasting", "Business Analytics", "Digital Ledger", "AI Recommendations"].map(l => (
                      <span key={l} className="bg-forest/5 border border-forest/10 text-forest text-[9.5px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">{l}</span>
                    ))}
                  </div>
                </div>
                <button onClick={scrollToHowItWorks} className="mt-8 text-left text-xs font-bold text-forest hover:text-[#203415] flex items-center space-x-1 border-none bg-transparent cursor-pointer">
                  <span>Explore Agent Intelligence</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Card 1.2: Alternative Credit Intelligence */}
              <div className="bg-slate-50/50 border border-forest/5 rounded-[24px] p-6 sm:p-8 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="space-y-4">
                  <div className="bg-forest/5 p-3 rounded-2xl w-fit text-forest">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-[11px] uppercase tracking-widest font-bold text-lemongrass block mb-1">Layer 02</span>
                    <h3 className="text-xl font-bold text-forest">Alternative Credit Intelligence</h3>
                  </div>
                  <h4 className="text-[14px] font-semibold text-slate-700">"Make financial behavior visible."</h4>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    With explicit customer consent, MobiFin turns behavioral financial data into explainable alternative credit profiles for customers who may lack traditional credit histories.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {["Financial Readiness", "Alternative Credit Score", "Explainable AI", "Risk Assessment", "Financial Access"].map(l => (
                      <span key={l} className="bg-forest/5 border border-forest/10 text-forest text-[9.5px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">{l}</span>
                    ))}
                  </div>
                </div>
                <button onClick={scrollToHowItWorks} className="mt-8 text-left text-xs font-bold text-forest hover:text-[#203415] flex items-center space-x-1 border-none bg-transparent cursor-pointer">
                  <span>Explore Credit Intelligence</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </section>

          {/* Card 2: SEE → PREDICT → ACT → ACCESS STAGES */}
          <section 
            className="sticky top-[108px] z-20 w-full bg-[#f4f7f0] border border-forest/10 rounded-[32px] p-6 sm:p-10 md:p-12 shadow-[0_12px_40px_rgba(23,40,14,0.04)] min-h-[60vh] flex flex-col justify-center"
          >
            <div className="text-center max-w-xl mx-auto mb-12 space-y-2">
              <span className="text-xs uppercase tracking-widest font-extrabold text-lemongrass">Operational Cycle</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-forest tracking-tight">From financial activity to intelligent action.</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 relative">
              {/* Connecting lines for desktop */}
              <div className="hidden lg:block absolute top-[44px] left-[15%] right-[15%] h-[1px] bg-forest/10 z-0 pointer-events-none" />

              {/* Stage 01: SEE */}
              <div className="space-y-4 relative z-10 bg-[#f4f7f0] p-2 rounded-2xl">
                <div className="bg-forest text-white rounded-full h-10 w-10 flex items-center justify-center font-bold text-sm shadow-sm border border-forest/15">
                  01
                </div>
                <div className="space-y-1">
                  <h3 className="font-extrabold text-[10px] text-lemongrass uppercase tracking-wider">Stage — See</h3>
                  <h4 className="font-bold text-base text-forest">"Understand the business."</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">Continuous data ingestion representing active shop ledgers.</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {["Transactions", "Cash", "E-Float", "Revenue", "Business Health"].map(i => (
                    <span key={i} className="text-[9px] bg-white border border-forest/5 px-2 py-0.5 rounded text-slate-600 font-semibold">{i}</span>
                  ))}
                </div>
              </div>

              {/* Stage 02: PREDICT */}
              <div className="space-y-4 relative z-10 bg-[#f4f7f0] p-2 rounded-2xl">
                <div className="bg-forest text-white rounded-full h-10 w-10 flex items-center justify-center font-bold text-sm shadow-sm border border-forest/15">
                  02
                </div>
                <div className="space-y-1">
                  <h3 className="font-extrabold text-[10px] text-lemongrass uppercase tracking-wider">Stage — Predict</h3>
                  <h4 className="font-bold text-base text-forest">"Know what's coming."</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">ML engine forecasting demands and cash outfalls.</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {["AI demand forecasting", "Liquidity forecasting", "Risk signals"].map(i => (
                    <span key={i} className="text-[9px] bg-white border border-forest/5 px-2 py-0.5 rounded text-slate-600 font-semibold">{i}</span>
                  ))}
                </div>
              </div>

              {/* Stage 03: ACT */}
              <div className="space-y-4 relative z-10 bg-[#f4f7f0] p-2 rounded-2xl">
                <div className="bg-forest text-white rounded-full h-10 w-10 flex items-center justify-center font-bold text-sm shadow-sm border border-forest/15">
                  03
                </div>
                <div className="space-y-1">
                  <h3 className="font-extrabold text-[10px] text-lemongrass uppercase tracking-wider">Stage — Act</h3>
                  <h4 className="font-bold text-base text-forest">"Take action."</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">Dynamic recommendations helping merchants secure margins.</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {["Rebalancing recommendations", "AI insights", "Operational alerts"].map(i => (
                    <span key={i} className="text-[9px] bg-white border border-forest/5 px-2 py-0.5 rounded text-slate-600 font-semibold">{i}</span>
                  ))}
                </div>
              </div>

              {/* Stage 04: ACCESS */}
              <div className="space-y-4 relative z-10 bg-[#f4f7f0] p-2 rounded-2xl">
                <div className="bg-forest text-white rounded-full h-10 w-10 flex items-center justify-center font-bold text-sm shadow-sm border border-forest/15">
                  04
                </div>
                <div className="space-y-1">
                  <h3 className="font-extrabold text-[10px] text-lemongrass uppercase tracking-wider">Stage — Access</h3>
                  <h4 className="font-bold text-base text-forest">"Turn behavior into opportunity."</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">Bridging indicative score metrics to institutional partners.</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {["Financial profiles", "Alternative credit", "Explainable assessments", "Financial services"].map(i => (
                    <span key={i} className="text-[9px] bg-white border border-forest/5 px-2 py-0.5 rounded text-slate-600 font-semibold">{i}</span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Card 3: For Mobile Money Agents */}
          <section 
            className="sticky top-[120px] z-30 w-full bg-white border border-forest/10 rounded-[32px] p-6 sm:p-10 md:p-12 shadow-[0_14px_45px_rgba(23,40,14,0.05)] min-h-[60vh] flex flex-col justify-center"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center">
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <span className="text-xs uppercase tracking-widest font-extrabold text-lemongrass">For Mobile Money Agents</span>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-forest tracking-tight">Your transactions are more than records.</h2>
                </div>
                <p className="text-xs sm:text-sm md:text-base text-slate-700 leading-relaxed">
                  MobiFin transforms everyday transaction activity into business intelligence that helps agents understand performance, anticipate liquidity needs, and make better operational decisions.
                </p>
                
                <div className="space-y-3 pt-1">
                  {[
                    "Keep ledgers reconciled dynamically with daily cashbook balance tracking.",
                    "Anticipate cashouts and float requirements using 7-day predictive models.",
                    "Mitigate operational blockages with timely float rebalancing alerts."
                  ].map((text, idx) => (
                    <div key={idx} className="flex items-start space-x-3 text-xs text-slate-600">
                      <CheckCircle2 className="h-5 w-5 text-lemongrass shrink-0 mt-0.5" />
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Metric Demonstration Card */}
              <div className="bg-[#17280e] rounded-[24px] p-5 sm:p-8 text-white space-y-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-[5%] right-[5%] w-[180px] h-[180px] rounded-full bg-emerald-500/5 blur-[50px] pointer-events-none" />
                
                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                  <span className="text-xs font-bold text-white/70 uppercase tracking-widest">Active Demo Scenario</span>
                  <span className="text-[9px] bg-emerald-500/10 text-emerald-300 font-extrabold px-2 py-0.5 rounded uppercase tracking-wider">Live Feed</span>
                </div>

                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 sm:p-4 flex flex-col justify-between">
                    <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest">Cash Balance</span>
                    <span className="text-xs sm:text-sm md:text-base font-extrabold text-white mt-1">GH₵7,200</span>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 sm:p-4 flex flex-col justify-between">
                    <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest">Expected Demand</span>
                    <span className="text-xs sm:text-sm md:text-base font-extrabold text-emerald-400 mt-1">GH₵11,400</span>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 sm:p-4 flex flex-col justify-between">
                    <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest">Proj. Shortfall</span>
                    <span className="text-xs sm:text-sm md:text-base font-extrabold text-rose-400 mt-1">GH₵4,200</span>
                  </div>
                </div>

                <div className="bg-amber-500/15 border border-amber-500/25 rounded-xl p-3.5 flex items-center space-x-3 text-xs text-amber-200">
                  <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0" />
                  <div>
                    <span className="font-extrabold block uppercase tracking-wider text-[9px]">Action Recommendation</span>
                    <span className="font-semibold block mt-0.5 text-white">Rebalance GH₵4,000 before 10:30 AM.</span>
                  </div>
                </div>
              </div>

            </div>
          </section>

          {/* Card 4: From Mobile Money Activity to Financial Access */}
          <section 
            className="sticky top-[132px] z-40 w-full bg-[#edf3e8] border border-forest/10 rounded-[32px] p-6 sm:p-10 md:p-12 shadow-[0_16px_50px_rgba(23,40,14,0.06)] min-h-[60vh] flex flex-col justify-center"
          >
            <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
              <span className="text-xs uppercase tracking-widest font-extrabold text-lemongrass">Financial Inclusion</span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-forest tracking-tight">From Mobile Money Activity to Financial Access.</h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-2">
                Millions of financially active customers remain underserved because traditional credit systems cannot see enough of their financial history. With explicit consent, MobiFin uses behavioral financial data to build an explainable alternative credit profile.
              </p>
            </div>

            {/* Horizontal flow progression */}
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4 max-w-4xl mx-auto py-6">
              {["Consent", "Financial Behavior", "Financial Profile", "Alternative Credit Score", "Institutional Underwriting"].map((stage, idx, arr) => (
                <React.Fragment key={stage}>
                  <div className="bg-white border border-forest/5 rounded-2xl p-4 flex-1 text-center shadow-sm w-full lg:w-auto">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">0{idx + 1}</span>
                    <span className="text-xs font-bold text-forest uppercase tracking-wider">{stage}</span>
                  </div>
                  {idx < arr.length - 1 && (
                    <ChevronRight className="h-5 w-5 text-slate-400 rotate-90 lg:rotate-0" />
                  )}
                </React.Fragment>
              ))}
            </div>

            <div className="mt-8 flex items-center justify-center space-x-2 text-[10.5px] text-slate-400 font-medium max-w-lg mx-auto text-center">
              <Info className="h-4 w-4 text-slate-350 shrink-0" />
              <span>Alternative credit assessment is indicative and does not guarantee loan approval. Final lending decisions require underwriting by our financial partners.</span>
            </div>
          </section>

          {/* Card 5: For Financial Institutions */}
          <section 
            className="sticky top-[144px] z-50 w-full bg-white border border-forest/10 rounded-[32px] p-6 sm:p-10 md:p-12 shadow-[0_18px_55px_rgba(23,40,14,0.07)] min-h-[60vh] flex flex-col justify-center"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center">
              
              <div className="bg-slate-50 border border-slate-200 rounded-[24px] p-5 sm:p-8 space-y-6 shadow-sm order-2 lg:order-1">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <span className="text-[10px] font-extrabold text-slate-450 uppercase tracking-widest">Illustrative demo assessment</span>
                  <span className="text-[9px] bg-slate-200 text-slate-700 font-extrabold px-2 py-0.5 rounded uppercase tracking-wider">Consent Active</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white border border-slate-100 rounded-xl p-3 sm:p-4">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">Alternative Credit Score</span>
                    <span className="text-lg sm:text-xl font-black text-forest block mt-1">764 <span className="text-slate-350 text-xs font-medium">/ 850</span></span>
                  </div>
                  <div className="bg-white border border-slate-100 rounded-xl p-3 sm:p-4">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">Repayment Prob.</span>
                    <span className="text-lg sm:text-xl font-black text-emerald-600 block mt-1">91%</span>
                  </div>
                  <div className="bg-white border border-slate-100 rounded-xl p-3 sm:p-4">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">Assessed Risk</span>
                    <span className="text-lg sm:text-xl font-black text-emerald-600 block mt-1">Low</span>
                  </div>
                  <div className="bg-white border border-slate-100 rounded-xl p-3 sm:p-4">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">Indicative Capacity</span>
                    <span className="text-lg sm:text-xl font-black text-forest block mt-1">GH₵7,500</span>
                  </div>
                </div>

                <p className="text-[9px] text-slate-400 leading-relaxed">
                  * INDICATIVE ONLY: Assessment values derive from consensual transactional ledgers. Final lending decisions remain subject to the underwriting requirements of the financial institution.
                </p>
              </div>

              <div className="space-y-6 order-1 lg:order-2">
                <div className="space-y-2">
                  <span className="text-xs uppercase tracking-widest font-extrabold text-lemongrass">For Financial Institutions</span>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-forest tracking-tight">See beyond traditional credit histories.</h2>
                </div>
                <p className="text-xs sm:text-sm md:text-base text-slate-700 leading-relaxed">
                  Give lending teams additional insight into financially active customers who may lack conventional banking records.
                </p>
                <div className="space-y-3 pt-1">
                  {[
                    "Audit explainable AI SHAP maps indicating positive and negative contributors.",
                    "Verify registered business locations, agent types, and ledger histories.",
                    "Underwrite loan requests with clean digital ledger metrics rather than self-reported statements."
                  ].map((text, idx) => (
                    <div key={idx} className="flex items-start space-x-3 text-xs text-slate-600">
                      <CheckCircle2 className="h-5 w-5 text-lemongrass shrink-0 mt-0.5" />
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </section>

        </div>

        {/* 6. ORIGINAL SCROLL IMPACT SECTION (PRESERVED) */}
        <section className="relative min-h-[60vh] flex flex-col justify-center items-center px-5 py-24 bg-[#e6ebd9]">
          <div className="max-w-[900px] text-center space-y-6">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight tracking-tight text-forest">
              Bridging the gap between activity and capital.
            </h2>
            <p className="text-lg md:text-xl text-slate-700 font-medium leading-relaxed max-w-2xl mx-auto">
              MobiFin AI decodes transactional data in real-time, delivering predictive insights, alternative credit scoring, and automated liquidity recommendations.
            </p>
          </div>
        </section>
        
      </main>
    </div>
  );
};

export default LandingPage;
