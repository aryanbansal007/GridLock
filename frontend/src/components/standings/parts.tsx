import type { ReactNode } from 'react';
import { driverInitials } from '../../lib/f1';
import { useDriverImage } from '../media/useDriverImage';

export function Kicker({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px w-8 bg-[#E10600]" aria-hidden />
      <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#C5C9D1]">{children}</span>
    </div>
  );
}

export function PageHeader({ kicker, title, sub, right }: { kicker: string; title: string; sub: string; right?: ReactNode }) {
  return (
    <header className="mb-10 flex flex-wrap items-end justify-between gap-6 border-b border-[#24262B] pb-8">
      <div>
        <Kicker>{kicker}</Kicker>
        <h1 className="mt-4 text-[clamp(2rem,4.2vw,3.25rem)] font-black leading-[0.95] tracking-[-0.04em] text-[#F5F5F5]">{title}</h1>
        <p className="mt-3 text-[13px] text-[#C5C9D1]">{sub}</p>
      </div>
      {right}
    </header>
  );
}

/** Points gained in the latest round, hidden when zero. */
export function PointsDelta({ value }: { value?: number }) {
  if (!value) return null;
  return (
    <span className="inline-flex items-center gap-0.5 font-mono text-[10px] font-bold text-[#2EB84B]">
      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
      {value}
    </span>
  );
}

export function Stat({ label, value, big = false }: { label: string; value: ReactNode; big?: boolean }) {
  return (
    <div className="flex flex-col">
      <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-[#A7ACB6]">{label}</span>
      <span className={`font-mono font-bold tabular-nums text-[#F5F5F5] ${big ? 'text-xl' : 'text-[15px]'}`}>{value}</span>
    </div>
  );
}

/** Points relative to the leader: a thin bar that grows in on mount. */
export function PointsBar({ value, max, color, mounted, delay = 0 }: { value: number; max: number; color: string; mounted: boolean; delay?: number }) {
  const pct = max > 0 ? Math.max(2, (value / max) * 100) : 0;
  return (
    <div className="h-[3px] w-full bg-[#15171B]" aria-hidden>
      <div
        className="h-full"
        style={{ width: mounted ? `${pct}%` : 0, background: color, transition: 'width 900ms cubic-bezier(0.2,0.7,0.2,1)', transitionDelay: `${delay}ms` }}
      />
    </div>
  );
}

/** "−45" behind the leader, "Leader" for P1. */
export function GapText({ gap }: { gap: number }) {
  if (gap <= 0) return <span className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#FFD700]">Leader</span>;
  return <span className="font-mono text-[12px] tabular-nums text-[#C5C9D1]">−{Number.isInteger(gap) ? gap : gap.toFixed(1)}</span>;
}

/** Large outlined number behind a card's content (racing number / rank). */
export function Watermark({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute select-none font-mono font-black leading-none tracking-[-0.06em] ${className}`}
      style={{ WebkitTextStroke: '1.5px rgba(255,255,255,0.09)', color: 'transparent' }}
    >
      {children}
    </span>
  );
}

/**
 * Driver portrait that fills its (relatively positioned) parent. A rectangular photo is
 * cropped to cover, anchored at the top so faces stay in frame; a transparent cut-out
 * stands on the bottom edge over the team-coloured backdrop. Without any photo it falls
 * back to big initials.
 */
export function DriverPhoto({ name, abbr, number, src, color }: { name: string; abbr?: string; number?: string | number; src?: string; color: string }) {
  const img = useDriverImage({ abbr, name, number, src });
  if (!img.url) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-black tracking-[-0.04em] text-white/90" style={{ fontSize: 'clamp(2.5rem, 7vw, 5rem)' }}>{driverInitials(name)}</span>
      </div>
    );
  }
  return (
    <img
      src={img.url}
      alt={name}
      loading="lazy"
      onError={img.onError}
      onLoad={img.onLoad}
      className="absolute inset-0 h-full w-full"
      style={
        img.cutout
          ? { objectFit: 'contain', objectPosition: 'bottom center', filter: `drop-shadow(0 12px 28px ${color}55)` }
          : { objectFit: 'cover', objectPosition: 'top center' }
      }
    />
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse border border-[#1A1C20] bg-[#0B0D10] ${className}`} />;
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 border border-[#24262B] bg-[#0B0D10] py-24">
      <div className="font-mono text-[12px] font-bold uppercase tracking-[0.16em] text-[#E10600]">Standings unavailable</div>
      <div className="font-mono text-[11px] text-[#A7ACB6]">{message}</div>
    </div>
  );
}
