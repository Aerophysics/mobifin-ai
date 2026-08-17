import React, { useEffect } from 'react';
import Lenis from 'lenis';
// @ts-ignore
import WireframeTerrain from '../components/WireframeTerrain';
// @ts-ignore
import { StaggeredMenu } from '../components/StaggeredMenu';

interface LandingPageProps {
  onLoginClick: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick }) => {
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

  const scrollToImpact = () => {
    const el = document.getElementById('impact-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="font-sans text-slate-900 bg-white min-h-screen relative w-full overflow-x-hidden">
      
      {/* 3D WebGL Mesh Background */}
      <div className="absolute inset-0 z-0 overflow-hidden" style={{ height: '100vh', pointerEvents: 'none' }}>
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
            { label: 'About', link: '#', onClick: scrollToImpact },
            { label: 'Log In', link: '#', onClick: onLoginClick },
            { label: 'Start', link: '#', onClick: onLoginClick }
          ]}
        />
      </div>

      {/* Floating Centered Nav Bar (Desktop Only) */}
      <div className="hidden lg:flex sticky top-6 z-50 w-full px-4 justify-center pointer-events-none">
        <header className="h-[72px] w-full max-w-[1100px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-200/50 rounded-full transition-all pointer-events-auto" style={{ background: 'rgba(255, 255, 255, 0.75)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
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
                    <button onClick={scrollToImpact} className="inline-block text-[15px] font-medium text-forest/80 hover:text-forest cursor-pointer transition-colors border-none bg-transparent">
                      <span>About</span>
                    </button>
                  </li>
                </ul>
              </nav>
              
              <div className="flex gap-x-4 flex-1 justify-end items-center">
                <button onClick={onLoginClick} className="group relative inline-flex appearance-none items-center py-2.5 select-none transition-colors justify-center text-forest min-h-[39px] px-5 border-none bg-transparent cursor-pointer">
                  <span className="absolute inset-0 rounded-full transition-all group-hover:scale-[0.98] origin-center bg-forest/5 group-hover:bg-forest/10"></span>
                  <span className="text-[15px] font-semibold relative z-10">Log in</span>
                </button>
                <button onClick={onLoginClick} className="group relative inline-flex appearance-none items-center py-2.5 select-none transition-colors justify-center text-white min-h-[39px] px-5 border-none bg-transparent cursor-pointer">
                  <span className="absolute inset-0 rounded-full transition-all group-hover:scale-[0.98] origin-center bg-forest group-hover:bg-[#203415]"></span>
                  <span className="text-[15px] font-semibold relative z-10">Start Platform</span>
                </button>
              </div>
            </div>
          </div>
        </header>
      </div>

      <main className="relative z-10">
        <section className="relative overflow-hidden pt-0 pb-0 px-5 lg:px-8">
          <div className="lg:-mt-[1.375rem]">
            <div className="relative bg-transparent py-14 max-md:-mx-5 md:py-20 lg:pt-26 lg:pb-26 xl:pb-32">
              <div className="mx-auto flex w-full max-w-[66.75rem] flex-col items-center px-5 text-center lg:px-12 mt-20">
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-forest leading-tight mb-6">
                  AI Credit Infrastructure for Mobile Money Agents & SMEs
                </h1>
                
                <div className="prose mt-6 w-full max-w-[42rem] opacity-80 text-xl md:text-2xl leading-relaxed text-slate-800">
                  <p>MobiFin AI decodes transactional data in real-time, delivering predictive insights, alternative credit underwriting, and automated liquidity recommendations for emerging markets.</p>
                </div>
                
                <div className="flex items-center gap-x-5 mt-10 sm:mt-12">
                  <button onClick={onLoginClick} className="group relative inline-flex appearance-none items-center py-3 select-none transition-colors justify-center text-white min-h-[44px] px-8 border-none bg-transparent cursor-pointer">
                    <span className="absolute inset-0 rounded-full transition-all group-hover:scale-[0.98] origin-center bg-forest group-hover:bg-[#203415]"></span>
                    <span className="text-[16px] font-semibold relative z-10">Get Started</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-white text-slate-900 pt-12 md:pt-16 lg:pt-20 pb-12 md:pb-16 lg:pb-20 border-t border-slate-100">
          <div className="container mx-auto px-5 lg:px-8 space-y-18 lg:space-y-24">
            <div className="flex flex-col items-center gap-10">
              <p className="text-base md:text-lg uppercase tracking-wider font-semibold w-full text-center text-forest">Empowering merchants and financial institutions in Ghana & emerging markets</p>
              
              <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-85">
                <span className="font-semibold text-lg text-forest tracking-tight bg-slate-50 border border-slate-100 px-4.5 py-2.5 rounded-full">Real-Time E-Float Forecasts</span>
                <span className="font-semibold text-lg text-forest tracking-tight bg-slate-50 border border-slate-100 px-4.5 py-2.5 rounded-full">Alternative Credit Scores</span>
                <span className="font-semibold text-lg text-forest tracking-tight bg-slate-50 border border-slate-100 px-4.5 py-2.5 rounded-full">Automated Liquidity Rebalancing</span>
                <span className="font-semibold text-lg text-forest tracking-tight bg-slate-50 border border-slate-100 px-4.5 py-2.5 rounded-full">Risk Metrics & Underwriting</span>
              </div>
            </div>
          </div>
        </section>
        
        {/* Scroll Impact Section */}
        <section id="impact-section" className="relative min-h-[80vh] flex flex-col justify-center items-center px-5 py-24 bg-[#e6ebd9]">
          <div className="max-w-[900px] text-center">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight tracking-tight text-forest mb-8">
              Micro-merchants lack formal credit, <span className="text-forest">leaving them unable to build capital.</span>
            </h2>
            <h3 className="text-2xl md:text-3xl text-slate-700 font-medium leading-relaxed">
              MobiFin AI bridges the credit gap, translating informal transaction velocity into structured credit registry data and smart rebalancing recommendations.
            </h3>
          </div>
        </section>
      </main>
    </div>
  );
};

export default LandingPage;
