import { useEffect, useMemo, useRef, useState } from 'react';
import type { DriverTelemetry } from '../../../lib/telemetry';

// Lap numbers available to analyse across a driver set. When a Q1/Q2/Q3 segment
// is active, only laps within that segment are offered; otherwise all accurate
// laps. `null` in the selector means "each driver's fastest lap" (the default).
export function useLapOptions(drivers: DriverTelemetry[], segment: number | null): number[] {
  return useMemo(() => {
    const set = new Set<number>();
    for (const d of drivers) {
      for (const l of d.laps) {
        if (l.lap == null || l.lap_time_s == null) continue;
        if (segment != null && l.segment !== segment) continue;
        if (segment == null && !l.is_accurate) continue;
        set.add(l.lap);
      }
    }
    return [...set].sort((a, b) => a - b);
  }, [drivers, segment]);
}

export function LapSelector({ value, onChange, options, segment }: {
  value: number | null;
  onChange: (v: number | null) => void;
  options: number[];
  segment: number | null;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const fastestLabel = segment ? `Q${segment} Fastest` : 'Fastest Lap';
  const label = value == null ? fastestLabel : `Lap ${value}`;

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 h-9 px-3.5 rounded-lg bg-[#0d0e12] border border-white/10 hover:border-white/25 text-xs font-mono font-bold text-gray-200 transition-colors">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
        {label}
        <svg width="9" height="9" viewBox="0 0 10 10" fill="none" className={`transition-transform ${open ? 'rotate-180' : ''}`}><path d="M2 3.5 5 6.5 8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-40 max-h-72 overflow-y-auto rounded-lg bg-[#0d0e12] border border-white/10 shadow-2xl z-30 py-1">
          <Opt active={value == null} onClick={() => { onChange(null); setOpen(false); }}>{fastestLabel}</Opt>
          {options.map(n => (
            <Opt key={n} active={value === n} onClick={() => { onChange(n); setOpen(false); }}>Lap {n}</Opt>
          ))}
        </div>
      )}
    </div>
  );
}

function Opt({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className="w-full text-left px-3.5 py-2 text-xs font-mono transition-colors hover:bg-white/5"
      style={{ color: active ? '#e10600' : 'rgba(255,255,255,0.65)', background: active ? 'rgba(225,6,0,0.06)' : 'transparent' }}>
      {children}
    </button>
  );
}
