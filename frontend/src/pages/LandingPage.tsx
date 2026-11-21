import React, { useEffect, useState } from 'react';
import Lenis from 'lenis';
import {
  Activity, Menu, X, Wallet, TrendingUp, Repeat, Landmark,
  Store, Building2, UserRound, Sparkles,
} from 'lucide-react';

interface LandingPageProps {
  onLoginClick: () => void;
  onSignUpClick: () => void;
}

// Palette for the marketing site (kept local; the app shell uses theme tokens)
const C = {
  ink: '#0b1407',
  mint: '#f1f7ec',
  forest: '#172a0e',
  lime: '#a6e06a',
  terracotta: '#c9713f',
  sub: '#4b5a46',
};

const chamfer = (n = 22) => ({
  clipPath: `polygon(${n}px 0, calc(100% - ${n}px) 0, 100% ${n}px, 100% 100%, 0 100%, 0 ${n}px)`,
});

const MonoLabel: React.FC<{ children: React.ReactNode; className?: string; arrow?: boolean }> = ({ children, className = '', arrow = true }) => (
  <span className={`mf-mono uppercase tracking-[0.14em] text-[11px] ${className}`}>
    {arrow && <span className="mr-1.5">►</span>}{children}
  </span>
);

/** Spade-style floating data chip. */
const Chip: React.FC<{ title: string; meta: string; amount?: string; tone?: 'light' | 'dark' | 'ghost'; className?: string; icon?: React.ReactNode }> = ({ title, meta, amount, tone = 'light', className = '', icon }) => {
  const styles = {
    light: 'bg-white border border-[#e2eadc] text-[#0b1407] shadow-[0_8px_24px_rgba(11,20,7,0.06)]',
    dark: 'bg-[#0f1c08] border border-white/70 text-white',
    ghost: 'bg-transparent border border-white/10 text-white/25',
  }[tone];
  return (
    <div className={`absolute flex items-center gap-3 rounded-[6px] px-3.5 py-2.5 ${styles} ${className}`}>
      {icon}
      <div className="leading-tight">
        <div className="text-[13px] font-medium whitespace-nowrap">{title}</div>
        <div className="mf-mono text-[11px] tracking-wider opacity-70 whitespace-nowrap">{meta}</div>
      </div>
      {amount && <div className="mf-display text-[17px] font-semibold ml-4 whitespace-nowrap">{amount}</div>}
    </div>
  );
};

const ChipIcon: React.FC<{ bg: string; children: React.ReactNode }> = ({ bg, children }) => (
  <span className="h-8 w-8 rounded-md flex items-center justify-center text-[#0b1407] flex-shrink-0" style={{ background: bg }}>{children}</span>
);

/** Contour-line phone illustration (layered outlines give an extruded look). */
const ContourPhone: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 360 420" className={className} fill="none" aria-hidden="true">
    {Array.from({ length: 16 }).map((_, i) => (
      <rect key={i} x={70 + i * 3.2} y={40 + i * 4.2} width={190} height={330} rx={34} stroke="#3c5a2c" strokeOpacity={0.22 + i * 0.04} strokeWidth={1.2} fill={i === 15 ? '#f7fbf3' : 'none'} />
    ))}
    <g transform="translate(118 103)">
      <rect x="0" y="0" width="190" height="330" rx="34" stroke="#2c4720" strokeWidth="1.6" />
      <rect x="70" y="16" width="50" height="8" rx="4" fill="#2c4720" opacity="0.5" />
      {Array.from({ length: 9 }).map((_, i) => (
        <line key={i} x1="22" x2={168 - (i % 3) * 30} y1={70 + i * 16} y2={70 + i * 16} stroke="#2c4720" strokeOpacity="0.35" />
      ))}
      <rect x="22" y="230" width="146" height="44" rx="10" stroke="#2c4720" strokeOpacity="0.6" />
      {Array.from({ length: 5 }).map((_, i) => (
        <rect key={i} x={30 + i * 27} y={250 - [10, 18, 14, 22, 26][i]} width="16" height={[10, 18, 14, 22, 26][i] + 16} rx="3" fill="#a6e06a" opacity={i === 4 ? 1 : 0.55} />
      ))}
    </g>
  </svg>
);

const Coin: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 120" className={className} fill="none" aria-hidden="true">
    {Array.from({ length: 10 }).map((_, i) => (
      <ellipse key={i} cx={60} cy={60 - i * 1.6} rx={48} ry={48} stroke="#a6e06a" strokeOpacity={0.15 + i * 0.07} />
    ))}
    <text x="60" y="58" textAnchor="middle" dominantBaseline="middle" fill="#a6e06a" fontSize="34" fontFamily="Inter Tight, Inter, sans-serif" fontWeight="600">₵</text>
  </svg>
);

const FEATURES = [
  {
    id: 'see', label: 'See', icon: Wallet, color: '#a6e06a',
    title: 'Know your position before the queue forms',
    body: 'Live cash and e-float balances, a 0–100 business health score and unusual-activity alerts, reconciled against a daily ledger.',
    stat: ['0–100', 'Business health score, refreshed from the last 14 days'],
  },
  {
    id: 'predict', label: 'Predict', icon: TrendingUp, color: '#f2c94c',
    title: 'Forecast tomorrow’s float before it runs out',
    body: 'An XGBoost demand model projects next-day cash and e-float needs, then stress-tests the plan against +10%, +20% and +35% demand surges.',
    stat: ['3', 'Surge scenarios stress-tested on every forecast'],
  },
  {
    id: 'act', label: 'Act', icon: Repeat, color: '#c9713f',
    title: 'Rebalance with a plan, not a guess',
    body: 'Deterministic recommendations say how much to move and by when, respect your minimum cash reserve, and route the rest to your trusted liquidity network.',
    stat: ['GH₵1,000', 'Minimum cash reserve protected in every plan'],
  },
  {
    id: 'access', label: 'Access', icon: Landmark, color: '#7fb79a',
    title: 'Turn transaction history into fair credit',
    body: 'With the customer’s consent, mobile money behaviour becomes an explainable 300–850 alternative credit score that lenders can actually underwrite.',
    stat: ['300–850', 'Explainable score with factor-level reasons'],
  },
];

/** Small product vignettes shown beside each feature row. */
const FeatureVisual: React.FC<{ id: string }> = ({ id }) => {
  const frame = 'relative w-full aspect-[4/3] bg-[#f1f7ec] overflow-hidden flex items-center justify-center p-6 sm:p-10';
  if (id === 'see') {
    return (
      <div className={frame} style={chamfer(26)}>
        <div className="grid grid-cols-2 gap-3 w-full max-w-md">
          {[['Cash on hand', 'GH₵4,850', 'Above reserve'], ['E-float', 'GH₵7,200', 'Watch'], ['Health score', '87 / 100', 'Healthy'], ['Anomalies', '0', 'Clear']].map(([k, v, c], i) => (
            <div key={k} className="bg-white rounded-2xl border border-[#e2eadc] p-4">
              <div className="text-[12px] text-[#4b5a46]">{k}</div>
              <div className="mf-display text-[22px] font-semibold mt-1">{v}</div>
              <span className={`inline-block mt-2 text-[11px] font-semibold px-1.5 py-0.5 rounded-md ${i === 1 ? 'bg-[#fdf1dc] text-[#9a5b00]' : 'bg-[#e3f3ea] text-[#0b6b46]'}`}>{c}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (id === 'predict') {
    const bars = [38, 52, 61, 66, 70, 74];
    return (
      <div className={frame} style={chamfer(26)}>
        <div className="bg-white rounded-2xl border border-[#e2eadc] p-5 w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[13px] font-semibold">E-float demand</span>
            <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-md bg-[#fbe6e3] text-[#b42318]">−GH₵4,200 tomorrow</span>
          </div>
          <div className="flex items-end gap-3 h-36">
            {bars.map((h, i) => (
              <div key={i} className="flex-1 rounded-lg" style={{ height: `${h}%`, background: i === bars.length - 1 ? '#0b5e3e' : '#7fb79a', opacity: i === bars.length - 1 ? 1 : 0.55 }} />
            ))}
            <div className="flex-1 rounded-lg border-2 border-dashed border-[#b9c7b4]" style={{ height: '92%' }} />
          </div>
          <div className="mf-mono text-[10px] tracking-widest text-[#4b5a46] mt-3 flex justify-between"><span>JUN</span><span>NOV</span><span>NEXT</span></div>
        </div>
      </div>
    );
  }
  if (id === 'act') {
    return (
      <div className={frame} style={chamfer(26)}>
        <div className="bg-[#e3f1e8] rounded-2xl border border-[#cfe5d7] p-5 w-full max-w-md">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[12px] font-semibold text-[#0b6b46] flex items-center gap-1"><Sparkles className="h-3.5 w-3.5" />MobiFin suggestion</span>
            <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-md bg-[#fdf1dc] text-[#9a5b00]">Act before opening</span>
          </div>
          <div className="text-[16px] font-semibold leading-snug">Move GH₵3,850 to e-float by 10:30 AM</div>
          <div className="text-[13px] text-[#4b5a46] mt-1.5">Keeps cash above your GH₵1,000 reserve. Ask Ama’s Super Agent for the remaining GH₵350.</div>
          <div className="flex gap-2 mt-4">
            <span className="h-8 px-3.5 rounded-full bg-[#0b6b46] text-white text-[12px] font-semibold flex items-center">Review plan</span>
            <span className="h-8 px-3.5 rounded-full bg-white border border-[#e2eadc] text-[12px] flex items-center">Not now</span>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className={`${frame} !bg-[#172a0e]`} style={chamfer(26)}>
      <div className="bg-[#0f1c08] rounded-2xl border border-white/15 p-5 w-full max-w-md text-white">
        <div className="flex justify-between items-start">
          <div>
            <MonoLabel className="text-white/50">Alternative score</MonoLabel>
            <div className="mf-display text-[44px] font-semibold leading-none mt-2">764<span className="text-[16px] text-white/40"> / 850</span></div>
          </div>
          <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-md bg-[#a6e06a] text-[#0b1407]">Low risk</span>
        </div>
        <div className="mt-5 space-y-2.5">
          {[['Savings behaviour', 82, true], ['Inflow / outflow ratio', 64, true], ['Transaction consistency', 48, true], ['Cash-flow volatility', 30, false]].map(([k, w, pos]) => (
            <div key={k as string} className="grid grid-cols-[1fr_120px] items-center gap-3 text-[12px]">
              <span className="text-white/70">{k as string}</span>
              <span className="h-1.5 rounded-full bg-white/10 overflow-hidden"><span className="block h-full rounded-full" style={{ width: `${w}%`, background: pos ? '#a6e06a' : '#f0705f' }} /></span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick, onSignUpClick }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  // Smooth scrolling + unlock the app's fixed-height body while on the marketing page
  useEffect(() => {
    const lenis = new Lenis({ duration: 1.1, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    let raf = 0;
    const loop = (time: number) => { lenis.raf(time); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);

    document.documentElement.classList.remove('dark');
    const rootEl = document.getElementById('root');
    const set = (v: { overflow: string; height: string }) => {
      [document.documentElement, document.body, rootEl].forEach(el => { if (el) { el.style.overflow = v.overflow; el.style.height = v.height; } });
    };
    set({ overflow: 'auto', height: 'auto' });
    if (rootEl) rootEl.style.overflow = 'visible';

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      set({ overflow: 'hidden', height: '100%' });
    };
  }, []);

  const scrollTo = (id: string) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const navLinks: [string, string][] = [['How it works', 'how'], ['For agents', 'see'], ['For lenders', 'access'], ['Trust & consent', 'trust']];

  return (
    <div className="bg-white min-h-screen w-full overflow-x-hidden" style={{ color: C.ink, fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-[#eef2ea]">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-8 h-[72px] flex items-center justify-between">
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-2 cursor-pointer bg-transparent border-none">
            <span className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: C.forest }}>
              <Activity className="h-4 w-4 text-[#a6e06a]" strokeWidth={2.5} />
            </span>
            <span className="mf-display text-[22px] font-bold tracking-[-0.03em]" style={{ color: C.forest }}>MobiFin</span>
          </button>
          <nav className="hidden lg:flex items-center gap-9">
            {navLinks.map(([label, id]) => (
              <button key={id} onClick={() => scrollTo(id)} className="mf-mono text-[14px] text-[#0b1407] hover:opacity-60 cursor-pointer bg-transparent border-none">{label}</button>
            ))}
          </nav>
          <div className="hidden sm:flex items-center gap-2">
            <button onClick={onLoginClick} className="mf-mono h-10 px-4 text-[14px] cursor-pointer bg-transparent border-none hover:opacity-60">Sign in</button>
            <button onClick={onSignUpClick} className="mf-mono h-10 px-4 rounded-[6px] text-[14px] bg-[#eef1ec] hover:bg-[#e3e8df] cursor-pointer border-none">Get started</button>
          </div>
          <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden h-10 w-10 flex items-center justify-center cursor-pointer bg-transparent border-none" aria-label="Menu">
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {menuOpen && (
          <div className="lg:hidden border-t border-[#eef2ea] px-4 py-3 flex flex-col">
            {navLinks.map(([label, id]) => (
              <button key={id} onClick={() => scrollTo(id)} className="mf-mono text-left py-3 text-[15px] bg-transparent border-none cursor-pointer">{label}</button>
            ))}
            <div className="flex gap-2 pt-3 sm:hidden">
              <button onClick={onLoginClick} className="mf-mono flex-1 h-11 rounded-[6px] border border-[#dfe5da] bg-white cursor-pointer">Sign in</button>
              <button onClick={onSignUpClick} className="mf-mono flex-1 h-11 rounded-[6px] bg-[#172a0e] text-white cursor-pointer border-none">Get started</button>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative px-3 sm:px-8 pt-4 sm:pt-6">
        {/* ruler ticks */}
        <div className="hidden md:block absolute left-0 top-0 bottom-0 w-4" style={{ backgroundImage: 'repeating-linear-gradient(to bottom, #0b1407 0 1px, transparent 1px 28px)', backgroundSize: '16px 28px', backgroundRepeat: 'repeat-y', opacity: 0.6 }} />
        <div className="hidden md:block absolute right-0 top-0 bottom-0 w-4" style={{ backgroundImage: 'repeating-linear-gradient(to bottom, #0b1407 0 1px, transparent 1px 28px)', backgroundSize: '16px 28px', backgroundRepeat: 'repeat-y', opacity: 0.6 }} />
        <div className="relative max-w-[1380px] mx-auto overflow-hidden pt-16 sm:pt-24 pb-14 sm:pb-20 px-4" style={{ background: C.mint, ...chamfer(28) }}>
          <h1 className="mf-display text-center font-semibold leading-[0.98] tracking-[-0.035em] text-[44px] sm:text-[68px] lg:text-[88px] max-w-[1100px] mx-auto">
            The intelligence layer for mobile money
          </h1>
          <div className="relative h-[340px] sm:h-[420px] max-w-[1000px] mx-auto mt-2">
            <ContourPhone className="absolute left-1/2 -translate-x-1/2 top-0 h-full" />
            <div className="absolute left-0 sm:left-[4%] top-[42%] hidden sm:block border border-[#0b1407] bg-[#f1f7ec] px-3.5 py-2.5 rounded-[2px]">
              <MonoLabel className="text-[#0b1407]">Transaction ID</MonoLabel>
              <div className="mf-mono text-[11px] tracking-[0.18em] mt-0.5">MOMO-26112008142</div>
            </div>
            <Chip
              className="right-0 sm:right-[2%] top-[30%] scale-90 sm:scale-100 origin-right"
              icon={<ChipIcon bg="#ffcc00"><Store className="h-4 w-4" /></ChipIcon>}
              title="Kwame’s Centre · Cash-in"
              meta="08:14 · ACCRA CENTRAL"
              amount="+GH₵150.00"
            />
            <Chip
              className="left-2 sm:left-[14%] bottom-[6%] scale-90 sm:scale-100 origin-left"
              icon={<ChipIcon bg="#a6e06a"><TrendingUp className="h-4 w-4" /></ChipIcon>}
              title="Tomorrow · E-float demand"
              meta="FORECAST · XGBOOST"
              amount="GH₵11,400"
            />
          </div>
          <p className="text-center text-[17px] sm:text-[19px] leading-relaxed max-w-[560px] mx-auto mt-6" style={{ color: C.sub }}>
            MobiFin turns everyday cash-in, cash-out and float activity into liquidity forecasts for agents and consent-based, explainable credit for the customers they serve.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
            <button onClick={onSignUpClick} className="mf-mono h-12 px-6 rounded-[6px] text-[14px] text-white cursor-pointer border-none hover:opacity-90" style={{ background: C.forest }}>
              Start as an agent
            </button>
            <button onClick={onLoginClick} className="mf-mono h-12 px-6 rounded-[6px] text-[14px] bg-white border border-[#d7e0d2] cursor-pointer hover:bg-[#f7faf5]">
              Explore the live demo
            </button>
          </div>
        </div>
      </section>

      {/* Dark statement band */}
      <section className="px-3 sm:px-8 py-14 sm:py-20">
        <div className="relative max-w-[1380px] mx-auto overflow-hidden min-h-[560px] sm:min-h-[680px] flex items-center justify-center px-6" style={{ background: C.forest, ...chamfer(30) }}>
          <Chip tone="ghost" className="left-[20%] top-[16%] hidden md:flex" title="► LOCATION" meta="KUMASI, ASHANTI" />
          <Chip tone="ghost" className="left-[6%] top-[38%] hidden md:flex" title="► CATEGORY" meta="AIRTIME · TOP-UP" />
          <Chip tone="ghost" className="right-[8%] top-[46%] hidden md:flex" title="► AGENT" meta="TAMALE CENTRAL" />
          <Chip tone="ghost" className="left-[36%] bottom-[9%] hidden md:flex" title="► CATEGORY" meta="BILL · ECG PREPAID" />
          <Chip tone="dark" className="left-[42%] top-[24%] hidden md:flex" icon={<ChipIcon bg="#a6e06a"><Wallet className="h-4 w-4" /></ChipIcon>} title="CASH-OUT 0244 •••• 391" meta="Withdrawal" amount="−GH₵200.00" />
          <Chip tone="dark" className="left-[6%] bottom-[16%] hidden md:flex" icon={<ChipIcon bg="#f2c94c"><Repeat className="h-4 w-4" /></ChipIcon>} title="FLOAT TOP-UP · SUPER AGENT" meta="Rebalance" amount="+GH₵3,850.00" />
          <Chip tone="dark" className="right-[14%] bottom-[16%] hidden md:flex" icon={<ChipIcon bg="#e8a27a"><Store className="h-4 w-4" /></ChipIcon>} title="MERCHANT PAY · MAKOLA" meta="Payment" amount="−GH₵48.50" />
          <h2 className="mf-display relative z-10 text-center text-white font-semibold leading-[1.04] tracking-[-0.03em] text-[34px] sm:text-[50px] lg:text-[58px] max-w-[760px]">
            Agents move millions every week, <span style={{ color: C.lime }}>but almost none of it becomes foresight or credit.</span>
          </h2>
        </div>
      </section>

      {/* Statement */}
      <section id="how" className="px-6 py-16 sm:py-24">
        <p className="mf-display text-center font-semibold leading-[1.1] tracking-[-0.03em] text-[30px] sm:text-[44px] lg:text-[52px] max-w-[900px] mx-auto">
          MobiFin follows one loop: see your position, predict demand, act on a plan, and open access to credit.
        </p>
      </section>

      {/* Feature rows */}
      <section className="max-w-[1320px] mx-auto px-4 sm:px-8 space-y-20 sm:space-y-28 pb-20 sm:pb-28">
        {FEATURES.map((f, i) => {
          const Icon = f.icon;
          return (
            <div key={f.id} id={f.id} className={`grid lg:grid-cols-2 gap-10 lg:gap-20 items-center ${i % 2 ? 'lg:[&>*:first-child]:order-2' : ''}`}>
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <span className="h-8 w-8 rounded-md flex items-center justify-center" style={{ background: f.color }}><Icon className="h-4 w-4 text-[#0b1407]" /></span>
                  <MonoLabel arrow={false} className="text-[#0b1407]">{`Stage ${i + 1} · ${f.label}`}</MonoLabel>
                </div>
                <h3 className="mf-display font-semibold leading-[1.05] tracking-[-0.03em] text-[34px] sm:text-[44px]">{f.title}</h3>
                <p className="text-[17px] leading-relaxed mt-5 max-w-[520px]" style={{ color: C.sub }}>{f.body}</p>
                <div className="mt-8 inline-flex items-end gap-4 border-l-2 pl-4" style={{ borderColor: f.color }}>
                  <span className="mf-display text-[40px] font-semibold leading-none tracking-[-0.03em]">{f.stat[0]}</span>
                  <span className="mf-mono text-[11px] uppercase tracking-[0.12em] max-w-[220px] pb-1" style={{ color: C.sub }}>{f.stat[1]}</span>
                </div>
              </div>
              <FeatureVisual id={f.id} />
            </div>
          );
        })}
      </section>

      {/* Audiences */}
      <section className="border-t border-[#eef2ea] py-20 sm:py-28 px-4 sm:px-8">
        <h2 className="mf-display text-center font-semibold leading-[1.02] tracking-[-0.035em] text-[38px] sm:text-[56px] max-w-[760px] mx-auto">
          Built for every side of mobile money
        </h2>
        <div className="max-w-[1180px] mx-auto grid md:grid-cols-3 gap-10 md:gap-8 mt-16">
          {[
            { tag: 'Agents', icon: Store, title: 'Never turn a customer away', body: 'Forecasts, rebalancing plans and a trusted liquidity network so float is there when the queue is.' },
            { tag: 'Lenders', icon: Building2, title: 'Underwrite the unbanked', body: 'Explainable alternative scores, readiness pipelines and agent referrals, accessible only with active consent.' },
            { tag: 'Customers', icon: UserRound, title: 'Your history, your credit', body: 'Approve or decline every data share on USSD, revoke any time, and see your readiness grow before a score exists.' },
          ].map(a => (
            <div key={a.tag} className="relative pt-8 border-t border-dashed border-[#0b1407]/40">
              <MonoLabel className="text-[#0b1407]">{`[${a.tag}]`}</MonoLabel>
              <a.icon className="h-10 w-10 mt-6 text-[#3c5a2c]" strokeWidth={1.1} />
              <h3 className="mf-display text-[24px] font-semibold tracking-[-0.02em] mt-5">{a.title}</h3>
              <p className="text-[16px] leading-relaxed mt-2" style={{ color: C.sub }}>{a.body}</p>
              <button onClick={onSignUpClick} className="mf-mono text-[14px] mt-5 bg-transparent border-none cursor-pointer hover:opacity-60">► Get started</button>
            </div>
          ))}
        </div>
      </section>

      {/* Trust & guarantees */}
      <section id="trust" className="py-16 sm:py-24 px-4 sm:px-8" style={{ background: C.mint }}>
        <div className="max-w-[1320px] mx-auto grid lg:grid-cols-[1.25fr_1fr_1fr] gap-6">
          <div className="rounded-[14px] p-8 sm:p-10 flex flex-col justify-between min-h-[340px]" style={{ background: C.forest }}>
            <div>
              <MonoLabel className="text-[#a6e06a]">Our rule</MonoLabel>
              <p className="mf-display text-white text-[26px] sm:text-[30px] leading-[1.15] tracking-[-0.02em] font-semibold mt-5">
                No consent, no score. Customers approve every share on USSD, and access ends the moment they revoke it.
              </p>
            </div>
            <div className="mf-mono text-[12px] tracking-[0.14em] text-white/50 uppercase mt-8">Demographic features excluded from scoring</div>
          </div>
          {[
            ['90 days', 'of mobile money history required before any credit score is produced'],
            ['30+', 'transactions required; below that, customers see a readiness score instead'],
          ].map(([big, cap]) => (
            <div key={big} className="relative p-7 flex flex-col justify-between min-h-[340px]">
              {['top-0 left-0 border-t-2 border-l-2', 'top-0 right-0 border-t-2 border-r-2', 'bottom-0 left-0 border-b-2 border-l-2', 'bottom-0 right-0 border-b-2 border-r-2'].map(pos => (
                <span key={pos} className={`absolute h-3.5 w-3.5 border-[#0b1407] ${pos}`} />
              ))}
              <div>
                <MonoLabel className="text-[#0b1407]">Guarantee</MonoLabel>
                <p className="mf-mono text-[12px] uppercase tracking-[0.1em] mt-2 max-w-[240px] leading-relaxed" style={{ color: C.sub }}>{cap}</p>
              </div>
              <div className="mf-display text-[64px] sm:text-[76px] font-semibold tracking-[-0.04em] leading-none">{big}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Under the hood */}
      <section className="py-20 sm:py-28 px-4 sm:px-8">
        <div className="max-w-[760px] mx-auto text-center flex flex-col items-center">
          <MonoLabel className="text-[#0b1407]">[Under the hood]</MonoLabel>
          <h2 className="mf-display font-semibold leading-[1.05] tracking-[-0.03em] text-[34px] sm:text-[44px] mt-5">Every score comes with its reasons</h2>
          <p className="text-[17px] leading-relaxed mt-5" style={{ color: C.sub }}>
            Machine-learning models show which behaviours moved a score, such as steady savings or volatile cash flow. Lenders see the reasons, not just a number, and location is never used in credit scoring.
          </p>
          <button onClick={onLoginClick} className="mf-mono h-12 px-6 rounded-[6px] text-[14px] text-white cursor-pointer border-none mt-8 hover:opacity-90" style={{ background: C.forest }}>
            Open the demo
          </button>
        </div>
      </section>

      {/* CTA band */}
      <section className="px-3 sm:px-8 pb-14">
        <div className="relative max-w-[1380px] mx-auto overflow-hidden py-20 sm:py-28 px-6 text-center" style={{ background: C.forest, ...chamfer(30) }}>
          <Coin className="absolute -left-6 top-10 h-32 w-32 sm:h-44 sm:w-44 opacity-80" />
          <Coin className="absolute right-4 sm:right-16 bottom-8 h-24 w-24 sm:h-32 sm:w-32 opacity-70 rotate-12" />
          <h2 className="mf-display relative text-white font-semibold leading-[1.04] tracking-[-0.03em] text-[34px] sm:text-[52px] max-w-[820px] mx-auto">
            Turn transactions into intelligence. <span style={{ color: C.lime }}>Turn intelligence into opportunity.</span>
          </h2>
          <div className="relative flex flex-col sm:flex-row gap-3 justify-center mt-10">
            <button onClick={onSignUpClick} className="mf-mono h-12 px-6 rounded-[6px] text-[14px] cursor-pointer border-none hover:opacity-90" style={{ background: C.lime, color: C.ink }}>Get started</button>
            <button onClick={onLoginClick} className="mf-mono h-12 px-6 rounded-[6px] text-[14px] text-white cursor-pointer bg-transparent border border-white/30 hover:bg-white/5">Sign in</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-[1320px] mx-auto px-4 sm:px-8 pt-10 pb-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] gap-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: C.forest }}><Activity className="h-4 w-4 text-[#a6e06a]" strokeWidth={2.5} /></span>
              <span className="mf-display text-[20px] font-bold tracking-[-0.03em]" style={{ color: C.forest }}>MobiFin</span>
            </div>
            <p className="text-[14px] leading-relaxed mt-4 max-w-[300px]" style={{ color: C.sub }}>Liquidity intelligence for mobile money agents and consent-based alternative credit for the underbanked.</p>
          </div>
          {[
            ['Platform', [['Liquidity forecasting', 'predict'], ['Rebalancing plans', 'act'], ['Alternative credit', 'access']]],
            ['For', [['Agents', 'see'], ['Lenders', 'access'], ['Customers', 'trust']]],
            ['Trust', [['Consent model', 'trust'], ['How it works', 'how']]],
          ].map(([title, links]) => (
            <div key={title as string}>
              <MonoLabel arrow={false} className="text-[#0b1407]">{title as string}</MonoLabel>
              <div className="flex flex-col gap-2.5 mt-4">
                {(links as string[][]).map(([l, id]) => (
                  <button key={l} onClick={() => scrollTo(id)} className="text-left text-[14px] bg-transparent border-none cursor-pointer hover:opacity-60" style={{ color: C.sub }}>{l}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mf-mono text-[12px] tracking-[0.1em] uppercase mt-14 pt-6 border-t border-[#eef2ea] flex flex-col sm:flex-row justify-between gap-2" style={{ color: C.sub }}>
          <span>© 2026 MobiFin</span>
          <span>Built for emerging-market finance</span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
