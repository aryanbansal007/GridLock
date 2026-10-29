import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LINKS = [
  { href: '#platform', label: 'Platform' },
  { href: '#telemetry', label: 'Telemetry' },
  { href: '#simulator', label: 'Race Simulator' },
  { href: '#features', label: 'Features' },
];

export function Wordmark() {
  return (
    <span className="flex items-center gap-2.5">
      <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden>
        <rect x="0.5" y="0.5" width="21" height="21" fill="none" stroke="#24262B" />
        <path d="M5 15 L9 7 L13 12 L17 5" fill="none" stroke="#E10600" strokeWidth="2" strokeLinecap="square" />
      </svg>
      <span className="font-mono text-[15px] font-black uppercase tracking-[-0.04em]">
        <span className="text-[#F5F5F5]">Grid</span><span className="text-[#E10600]">Lock</span>
      </span>
    </span>
  );
}

export function LandingNav() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-colors ${
        scrolled || open ? 'border-[#24262B] bg-[#050505]/90 backdrop-blur-md' : 'border-transparent bg-transparent'
      }`}
    >
      <nav className="mx-auto flex h-14 max-w-[1320px] items-center justify-between gap-6 px-5 sm:px-8" aria-label="Main">
        <a href="#top" className="focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FF2D24]" aria-label="GridLock home">
          <Wordmark />
        </a>

        <ul className="hidden items-center gap-7 lg:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#C5C9D1] transition-colors hover:text-[#F5F5F5] focus-visible:text-[#F5F5F5] focus-visible:outline-none focus-visible:underline focus-visible:underline-offset-8">
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2 lg:flex">
          <button type="button" onClick={() => navigate('/auth')} className="px-3 py-2 text-[12px] font-bold uppercase tracking-[0.12em] text-[#C5C9D1] transition-colors hover:text-[#F5F5F5] focus-visible:outline-2 focus-visible:outline-[#FF2D24]">
            Log in
          </button>
          <button type="button" onClick={() => navigate('/dashboard')} className="bg-[#E10600] px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#FF2D24] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF2D24]">
            Launch GridLock
          </button>
        </div>

        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center border border-[#24262B] text-[#F5F5F5] lg:hidden focus-visible:outline-2 focus-visible:outline-[#FF2D24]"
          aria-expanded={open}
          aria-controls="landing-mobile-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
            {open
              ? <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.6" />
              : <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.6" />}
          </svg>
        </button>
      </nav>

      {open && (
        <div id="landing-mobile-menu" className="border-t border-[#24262B] bg-[#050505] px-5 pb-6 pt-2 lg:hidden">
          <ul>
            {LINKS.map((l) => (
              <li key={l.href} className="border-b border-[#24262B]">
                <a href={l.href} onClick={() => setOpen(false)} className="block py-3.5 text-[13px] font-semibold uppercase tracking-[0.12em] text-[#F5F5F5]">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => navigate('/auth')} className="border border-[#24262B] py-3 text-[12px] font-bold uppercase tracking-[0.12em] text-[#F5F5F5]">Log in</button>
            <button type="button" onClick={() => navigate('/dashboard')} className="bg-[#E10600] py-3 text-[12px] font-black uppercase tracking-[0.12em] text-white">Launch</button>
          </div>
        </div>
      )}
    </header>
  );
}
