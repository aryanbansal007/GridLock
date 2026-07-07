import { useEffect, useRef, useState } from 'react';
import { AVAILABLE_SEASONS } from '../lib/f1';

export function SeasonSelector({ currentYear, onChange }: { currentYear: number; onChange: (y: number) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const selected = AVAILABLE_SEASONS.find(s => s.year === currentYear) ?? AVAILABLE_SEASONS[0];
  return (
    <div ref={ref} className="relative shrink-0">
      <button onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 h-10 px-4 rounded-xl bg-[#0d0e12] border border-white/10 hover:border-white/20 text-sm font-mono font-bold text-gray-200 transition-colors">
        <span className="inline-flex items-center justify-center w-4 h-4 rounded-sm bg-[#e10600] text-[9px] font-black text-white">F1</span>
        {selected.label}
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className={`transition-transform ${open ? 'rotate-180' : ''}`}><path d="M2 3.5 5 6.5 8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-44 max-h-80 overflow-y-auto rounded-xl bg-[#0d0e12] border border-white/10 shadow-2xl z-20">
          {AVAILABLE_SEASONS.map(s => (
            <button key={s.year} onClick={() => { onChange(s.year); setOpen(false); }}
              className="w-full text-left px-4 py-2.5 text-sm font-mono flex items-center justify-between transition-colors"
              style={{ color: s.year === currentYear ? '#e10600' : 'rgba(255,255,255,0.6)', background: s.year === currentYear ? 'rgba(225,6,0,0.06)' : 'transparent' }}>
              {s.label}{s.year === currentYear && <span className="text-[8px]">●</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
