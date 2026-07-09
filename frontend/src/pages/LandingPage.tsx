import { useNavigate } from 'react-router-dom';
import { Footer } from '../components/Footer';

const FEATURES = [
  {
    title: 'Telemetry Comparison',
    desc: 'Overlay Speed, Throttle, Brake, Gear, RPM, and DRS for multiple drivers on a shared track-distance axis, with real corner markers.',
    icon: (
      <path d="M3 17l4-8 4 4 4-10 4 6 2-3" />
    ),
  },
  {
    title: 'Live Race Simulator',
    desc: 'A full race replay — every car\'s real position, tyre compound, and pit stops, reconstructed from telemetry and played back on a scrubbable timeline.',
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
  },
  {
    title: 'Race Engineer AI',
    desc: 'Ask anything about Formula 1 — strategy, rules, history, driver comparisons — and get answers grounded in real facts, not guesses.',
    icon: (
      <path d="M4 9h16M4 15h16M6 5l2 14M18 5l-2 14" />
    ),
  },
  {
    title: 'Driving State Analysis',
    desc: 'See exactly how a lap was driven — full throttle, braking, cornering, and lift-and-coast segments by track distance, not just how fast.',
    icon: (
      <path d="M3 12h4l3-8 4 16 3-8h4" />
    ),
  },
  {
    title: 'Season Standings & Calendar',
    desc: 'Live driver and constructor standings, full season calendar, and detailed race results — refreshed automatically.',
    icon: (
      <>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </>
    ),
  },
  {
    title: 'Tyre Strategy & Track Dominance',
    desc: 'Stint lengths, compounds, pit timing, and which driver was fastest through which sector of the lap.',
    icon: (
      <circle cx="12" cy="12" r="8" />
    ),
  },
];

const STEPS = [
  { n: '01', title: 'Real timing data', desc: 'FastF1 pulls official F1 timing data — the same feed used for broadcast graphics — not mocked or hand-authored numbers.' },
  { n: '02', title: 'Processed into telemetry', desc: 'Speed, throttle, brake, gear, RPM, DRS, and position are reconstructed onto a shared timeline for every driver.' },
  { n: '03', title: 'Explore, compare, replay', desc: 'Compare drivers lap-by-lap, replay the full race, or just ask the Race Engineer what happened and why.' },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-screen bg-[#050505] text-white overflow-x-hidden">
      {/* Nav */}
      <div className="sticky top-0 z-30 border-b border-white/5 bg-[#050505]/80 backdrop-blur-md">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="font-mono text-base font-black tracking-tight uppercase text-white">GRID</span>
            <span className="font-mono text-base font-black tracking-tight uppercase text-[#e10600]">LOCK</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/auth')}
              className="text-xs font-bold uppercase tracking-wide text-gray-400 hover:text-white transition-colors px-3 py-2"
            >
              Log In
            </button>
            <button
              onClick={() => navigate('/auth')}
              className="text-xs font-bold uppercase tracking-wide bg-[#e10600] hover:bg-[#c20500] transition-colors px-4 py-2.5 rounded-lg"
            >
              Get Started
            </button>
          </div>
        </div>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 1px, transparent 14px)' }}
        />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[40rem] h-[40rem] rounded-full bg-[#e10600]/10 blur-3xl pointer-events-none" />

        <div className="relative max-w-[1000px] mx-auto px-6 pt-24 pb-20 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono text-gray-400 mb-8">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#e10600] opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#e10600]" />
            </span>
            Built on real FastF1 telemetry
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.05] mb-6">
            Formula 1 analytics,<br />
            <span className="text-[#e10600]">engineered for real data.</span>
          </h1>

          <p className="text-base md:text-lg text-gray-400 max-w-xl mx-auto mb-10 leading-relaxed">
            Compare telemetry lap-by-lap, replay full races, and ask an AI race engineer anything —
            every number sourced from official F1 timing data.
          </p>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => navigate('/auth')}
              className="px-7 py-3.5 rounded-xl bg-[#e10600] hover:bg-[#c20500] transition-colors text-sm font-bold uppercase tracking-wide"
            >
              Get Started — It's Free
            </button>
            <a
              href="#features"
              className="px-7 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-sm font-bold uppercase tracking-wide"
            >
              See Features
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-[1200px] mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#e10600] mb-3">What you get</p>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight">Everything a race engineer sees — in your browser</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl bg-[#0d0e12] border border-white/5 p-6 hover:border-white/15 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-[#e10600]/10 border border-[#e10600]/20 flex items-center justify-center mb-4">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e10600" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {f.icon}
                </svg>
              </div>
              <h3 className="text-sm font-bold text-white mb-2">{f.title}</h3>
              <p className="text-[13px] text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-white/5 bg-[#080808]">
        <div className="max-w-[1000px] mx-auto px-6 py-20">
          <div className="text-center mb-14">
            <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#e10600] mb-3">How it works</p>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">From official timing feed to your dashboard</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((s) => (
              <div key={s.n}>
                <div className="text-4xl font-black text-white/10 mb-3 font-mono">{s.n}</div>
                <h3 className="text-sm font-bold text-white mb-2">{s.title}</h3>
                <p className="text-[13px] text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-[900px] mx-auto px-6 py-24 text-center">
        <h2 className="text-2xl md:text-4xl font-black tracking-tight mb-4">
          Ready to see the data behind the race?
        </h2>
        <p className="text-sm text-gray-500 mb-8 max-w-md mx-auto">
          Create a free account and start exploring telemetry, standings, and full race replays.
        </p>
        <button
          onClick={() => navigate('/auth')}
          className="px-8 py-4 rounded-xl bg-[#e10600] hover:bg-[#c20500] transition-colors text-sm font-bold uppercase tracking-wide"
        >
          Get Started
        </button>
      </section>

      <Footer />
    </div>
  );
}
