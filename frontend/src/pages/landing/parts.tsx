import type { ReactNode } from 'react';
import { SNAP, COMPOUND, pathD } from './data';
import { carAt } from './hooks';

const OUTLINE_D = pathD(SNAP.outline, true);

/** Small uppercase technical label. */
export function Tag({ children, tone = 'muted', className = '' }: { children: ReactNode; tone?: 'muted' | 'red' | 'text'; className?: string }) {
  const color = tone === 'red' ? 'text-[#FF2D24]' : tone === 'text' ? 'text-[#F5F5F5]' : 'text-[#C5C9D1]';
  return (
    <span className={`font-mono text-[10px] font-semibold uppercase tracking-[0.18em] ${color} ${className}`}>
      {children}
    </span>
  );
}

/** Honest provenance marker for every preview: what session, and that it is a recording. */
export function HistoricalBadge({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-sm border border-[#24262B] bg-[#0B0D10]/80 px-2 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-[#C5C9D1] ${className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-[#C5C9D1]" aria-hidden />
      Historical · {SNAP.session.year} {SNAP.session.name.replace(' Grand Prix', ' GP')}
    </span>
  );
}

/** Instrument-panel frame shared by the workstation previews. */
export function Panel({ title, meta, children, className = '' }: { title: string; meta?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={`relative flex flex-col border border-[#24262B] bg-[#0B0D10] ${className}`}>
      <div className="flex items-center justify-between gap-3 border-b border-[#24262B] px-3 py-2">
        <Tag>{title}</Tag>
        {meta && <div className="font-mono text-[10px] text-[#C5C9D1] tabular-nums">{meta}</div>}
      </div>
      <div className="relative flex-1 min-h-0">{children}</div>
    </div>
  );
}

export function CompoundDot({ compound, size = 16 }: { compound: string; size?: number }) {
  const c = COMPOUND[compound] ?? { color: '#6B7280', letter: '?' };
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-mono font-black"
      style={{ width: size, height: size, border: `2px solid ${c.color}`, color: c.color, fontSize: size * 0.5 }}
      title={compound.toLowerCase()}
    >
      {c.letter}
    </span>
  );
}

/**
 * The snapshot circuit (already rotated to its standard orientation) with the replay's
 * cars placed at `frame`. Stroke widths are in view units of a 1000-wide outline.
 */
export function TrackMap({
  frame, showLabels = true, className = '', trackColor = '#2A2D33', highlight,
}: {
  frame?: number; showLabels?: boolean; className?: string; trackColor?: string;
  highlight?: ReactNode;
}) {
  const { w, h } = SNAP.view;
  const pad = 40;
  return (
    <svg
      viewBox={`${-pad} ${-pad} ${w + pad * 2} ${h + pad * 2}`}
      className={className}
      role="img"
      aria-label={`${SNAP.session.name} circuit${frame != null ? ` with car positions on lap ${SNAP.replay.lap}` : ''}`}
    >
      <path d={OUTLINE_D} fill="none" stroke="#000" strokeWidth={30} strokeLinejoin="round" opacity={0.6} />
      <path d={OUTLINE_D} fill="none" stroke={trackColor} strokeWidth={20} strokeLinejoin="round" />
      <path d={OUTLINE_D} fill="none" stroke="#ffffff" strokeWidth={1.2} strokeLinejoin="round" opacity={0.18} />
      {highlight}
      <StartLine />
      {frame != null &&
        SNAP.replay.cars.map((c) => {
          const [x, y] = carAt(c.xy, frame);
          return (
            <g key={c.code}>
              <circle cx={x} cy={y} r={11} fill={c.color} stroke="#050505" strokeWidth={3} />
              {showLabels && (
                <text
                  x={x + 16} y={y + 5} fontSize={18} fontWeight={800} fill="#F5F5F5"
                  stroke="#050505" strokeWidth={5} paintOrder="stroke"
                  fontFamily='"JetBrains Mono","SFMono-Regular",Menlo,monospace'
                >
                  {c.code}
                </text>
              )}
            </g>
          );
        })}
    </svg>
  );
}

function StartLine() {
  const [x0, y0] = SNAP.outline[0];
  const [x1, y1] = SNAP.outline[2];
  const len = Math.hypot(x1 - x0, y1 - y0) || 1;
  const nx = -(y1 - y0) / len, ny = (x1 - x0) / len;
  return (
    <g>
      <line x1={x0 + nx * 18} y1={y0 + ny * 18} x2={x0 - nx * 18} y2={y0 - ny * 18} stroke="#F5F5F5" strokeWidth={6} />
      <line x1={x0 + nx * 18} y1={y0 + ny * 18} x2={x0 - nx * 18} y2={y0 - ny * 18} stroke="#050505" strokeWidth={6} strokeDasharray="4 4" />
    </g>
  );
}

/** Section heading block used down the page. */
export function SectionHead({ index, kicker, title, children, align = 'left' }: {
  index: string; kicker: string; title: ReactNode; children?: ReactNode; align?: 'left' | 'center';
}) {
  return (
    <div className={align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-xl'}>
      <div className={`mb-4 flex items-center gap-3 ${align === 'center' ? 'justify-center' : ''}`}>
        <span className="font-mono text-[11px] font-semibold text-[#FF2D24] tabular-nums">{index}</span>
        <span className="h-px w-8 bg-[#24262B]" aria-hidden />
        <Tag>{kicker}</Tag>
      </div>
      <h2 className="text-[clamp(1.75rem,3.2vw,2.75rem)] font-black leading-[1.05] tracking-[-0.03em] text-[#F5F5F5]">
        {title}
      </h2>
      {children && <p className="mt-4 text-[15px] leading-relaxed text-[#C5C9D1]">{children}</p>}
    </div>
  );
}
