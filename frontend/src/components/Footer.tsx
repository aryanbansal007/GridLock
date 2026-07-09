import { useState } from 'react';

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: 'What is GridLock?',
    a: 'GridLock is a fan-built Formula 1 analytics platform — season standings, race results, lap-by-lap telemetry comparison, a driving-state breakdown, a full race replay simulator, and an AI assistant for F1 questions. Every number comes from real timing data, not mocked or hand-authored.',
  },
  {
    q: 'Is this an official Formula 1 product?',
    a: 'No. GridLock is an independent, unofficial fan project. See the disclaimer below for details.',
  },
  {
    q: 'Where does the data come from?',
    a: 'All telemetry, lap times, results, and circuit data are sourced via FastF1, an open-source Python library that reads the same official F1 timing feed used for broadcast graphics.',
  },
  {
    q: 'Why is a race missing, or not generating instantly?',
    a: "Telemetry for a race/session is generated on first request and cached from then on — the very first person to open a given race's Analysis or Simulator pays a short one-time wait while it's processed; every view after that is instant.",
  },
  {
    q: 'Can I use this for my own analysis?',
    a: "This project is for personal/portfolio use. The underlying data comes from FastF1's public library — refer to FastF1's own license and F1's terms if you're building something with the same data yourself.",
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/5 last:border-b-0">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-4 py-3 text-left text-xs font-semibold text-gray-300 hover:text-white transition-colors"
      >
        {q}
        <svg
          width="10" height="10" viewBox="0 0 10 10" fill="none"
          className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path d="M2 3.5 5 6.5 8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <p className="pb-3 text-[11px] leading-relaxed text-gray-500 pr-6">{a}</p>
      )}
    </div>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-[#080808]">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Brand + blurb */}
          <div>
            <div className="flex items-center gap-0.5 mb-3">
              <span className="font-mono text-sm font-black tracking-tight uppercase text-white">GRID</span>
              <span className="font-mono text-sm font-black tracking-tight uppercase text-[#e10600]">LOCK</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed max-w-sm">
              A fan-built Formula 1 analytics platform — standings, race results, telemetry
              comparison, and a full race replay simulator, built on real timing data via FastF1.
            </p>
          </div>

          {/* FAQ */}
          <div>
            <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-500 mb-2">FAQ</h3>
            <div>
              {FAQ_ITEMS.map((item) => (
                <FAQItem key={item.q} q={item.q} a={item.a} />
              ))}
            </div>
          </div>
        </div>

        {/* Legal disclaimer */}
        <div className="mt-8 pt-6 border-t border-white/5">
          <p className="text-[10px] leading-relaxed text-gray-600 max-w-3xl">
            GridLock is an unofficial, fan-made project and is not associated with, endorsed by,
            or affiliated with Formula 1, the FIA, or any Formula 1 team. F1, FORMULA ONE,
            FORMULA 1, FIA FORMULA ONE WORLD CHAMPIONSHIP, GRAND PRIX, and related marks are
            trademarks of Formula One Licensing B.V. All telemetry and results data is sourced
            from the public FastF1 library.
          </p>
        </div>
      </div>
    </footer>
  );
}
