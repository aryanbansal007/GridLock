import { useRef, useState, type PointerEvent } from 'react';
import { SNAP, COLOR_A, COLOR_B, COMPOUND, STATE_META, seriesD, pathD } from './data';

const C = SNAP.compare;
const N = C.dist.length;
const LAP_M = C.dist[N - 1];

interface Row { key: string; label: string; h: number }

/**
 * Speed / throttle / brake / gear / delta for the two snapshot laps on one shared
 * distance axis, with a crosshair readout. `rows` picks which channels to stack.
 */
export function TelemetryStack({
  rows = ['speed', 'throttle', 'brake', 'gear', 'delta'],
  width = 900, compact = false, className = '',
}: { rows?: string[]; width?: number; compact?: boolean; className?: string }) {
  const defs: Record<string, Row> = {
    speed: { key: 'speed', label: 'Speed km/h', h: compact ? 90 : 150 },
    throttle: { key: 'throttle', label: 'Throttle %', h: compact ? 34 : 54 },
    brake: { key: 'brake', label: 'Brake', h: compact ? 16 : 22 },
    gear: { key: 'gear', label: `Gear · ${C.a.code}`, h: compact ? 34 : 50 },
    delta: { key: 'delta', label: `Gap ${C.b.code}–${C.a.code} s`, h: compact ? 40 : 64 },
  };
  const stack = rows.map((r) => defs[r]).filter(Boolean);
  const labelW = compact ? 0 : 92;
  const plotW = width - labelW;
  const gap = compact ? 8 : 12;
  const axisH = 18;
  const tops = stack.map((_, i) => stack.slice(0, i).reduce((s, r) => s + r.h + gap, 0));
  const y = stack.reduce((s, r) => s + r.h + gap, 0);
  const total = y + axisH;

  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const r = svg.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * width - labelW;
    if (x < 0 || x > plotW) { setHover(null); return; }
    setHover(Math.round((x / plotW) * (N - 1)));
  };

  const dMax = Math.max(0.05, ...C.delta.map(Math.abs));

  return (
    <div className={`relative ${className}`}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${total}`}
        className="block h-auto w-full touch-none select-none"
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
        role="img"
        aria-label={`Telemetry comparison of ${C.a.name} and ${C.b.name}'s fastest laps, ${SNAP.session.year} ${SNAP.session.name}`}
      >
        {stack.map((row, i) => {
          const top = tops[i];
          return (
            <g key={row.key} transform={`translate(${labelW} ${top})`}>
              <rect width={plotW} height={row.h} fill="#08090B" stroke="#1A1C20" />
              {!compact && (
                <text x={-10} y={row.h / 2 + 3} textAnchor="end" fontSize="9.5" fill="#C5C9D1" fontFamily='"JetBrains Mono",Menlo,monospace' letterSpacing="0.06em">
                  {row.label.toUpperCase()}
                </text>
              )}
              {SNAP.compare.brakeZones.map((z, k) => (
                <g key={z.d}>
                  <line x1={(z.d / LAP_M) * plotW} x2={(z.d / LAP_M) * plotW} y1={0} y2={row.h} stroke="#E10600" strokeOpacity="0.18" strokeDasharray="2 3" />
                  {!compact && row.key === 'speed' && (
                    <text x={(z.d / LAP_M) * plotW + 4} y={row.h - 6} fontSize="9" fill="#FF2D24" fontFamily='"JetBrains Mono",Menlo,monospace'>B{k + 1}</text>
                  )}
                </g>
              ))}
              <RowPlot row={row.key} w={plotW} h={row.h} dMax={dMax} />
            </g>
          );
        })}

        {/* Distance axis */}
        <g transform={`translate(${labelW} ${y})`}>
          {[0, 1000, 2000, 3000, 4000, 5000].filter((m) => m < LAP_M).map((m) => (
            <text key={m} x={(m / LAP_M) * plotW} y={12} fontSize="9" fill="#A7ACB6" fontFamily='"JetBrains Mono",Menlo,monospace'>
              {m === 0 ? '0 m' : `${m / 1000} km`}
            </text>
          ))}
        </g>

        {hover != null && (
          <line x1={labelW + (hover / (N - 1)) * plotW} x2={labelW + (hover / (N - 1)) * plotW} y1={0} y2={y} stroke="#F5F5F5" strokeOpacity="0.5" />
        )}
      </svg>

      {hover != null && (
        <div
          className="pointer-events-none absolute top-1 z-10 border border-[#24262B] bg-[#050505]/95 px-2.5 py-2 font-mono text-[10px] tabular-nums text-[#F5F5F5] shadow-xl"
          style={{ left: `clamp(0px, calc(${((labelW + (hover / (N - 1)) * plotW) / width) * 100}% + 10px), calc(100% - 150px))` }}
        >
          <div className="mb-1 text-[#C5C9D1]">{(C.dist[hover] / 1000).toFixed(2)} km</div>
          <div style={{ color: COLOR_A }}>{C.a.code} {C.speedA[hover]} km/h · T{C.throttleA[hover]}% · G{C.gearA[hover]}{C.brakeA[hover] ? ' · BRK' : ''}</div>
          <div style={{ color: COLOR_B }}>{C.b.code} {C.speedB[hover]} km/h · T{C.throttleB[hover]}%{C.brakeB[hover] ? ' · BRK' : ''}</div>
          <div className="mt-1 text-[#FF2D24]">Δ {C.delta[hover] >= 0 ? '+' : ''}{C.delta[hover].toFixed(3)} s</div>
        </div>
      )}
    </div>
  );
}

function RowPlot({ row, w, h, dMax }: { row: string; w: number; h: number; dMax: number }) {
  const xs = C.dist;
  if (row === 'speed') {
    return (
      <>
        {[100, 200, 300].map((v) => (
          <line key={v} x1={0} x2={w} y1={h - ((v - 50) / 300) * h} y2={h - ((v - 50) / 300) * h} stroke="#ffffff" strokeOpacity="0.04" />
        ))}
        <path d={seriesD(C.speedB, w, h - 4, 50, 350, xs, LAP_M)} transform="translate(0 2)" fill="none" stroke={COLOR_B} strokeWidth="1.3" strokeDasharray="5 3" />
        <path className="gl-draw" pathLength={1} d={seriesD(C.speedA, w, h - 4, 50, 350, xs, LAP_M)} transform="translate(0 2)" fill="none" stroke={COLOR_A} strokeWidth="1.8" />
      </>
    );
  }
  if (row === 'throttle') {
    const area = `${seriesD(C.throttleA, w, h - 2, 0, 100, xs, LAP_M)}L${w} ${h}L0 ${h}Z`;
    return (
      <>
        <path d={area} transform="translate(0 1)" fill={COLOR_A} fillOpacity="0.16" />
        <path d={seriesD(C.throttleA, w, h - 2, 0, 100, xs, LAP_M)} transform="translate(0 1)" fill="none" stroke={COLOR_A} strokeWidth="1.2" />
        <path d={seriesD(C.throttleB, w, h - 2, 0, 100, xs, LAP_M)} transform="translate(0 1)" fill="none" stroke={COLOR_B} strokeWidth="1" strokeDasharray="4 3" />
      </>
    );
  }
  if (row === 'brake') {
    const bar = (arr: number[], y0: number, hh: number, color: string) =>
      arr.map((b, i) => (b ? <rect key={i} x={(xs[i] / LAP_M) * w} y={y0} width={Math.max(1.5, w / N)} height={hh} fill={color} /> : null));
    return (
      <>
        {bar(C.brakeA, 2, h / 2 - 3, '#E10600')}
        {bar(C.brakeB, h / 2 + 1, h / 2 - 3, '#7A1512')}
      </>
    );
  }
  if (row === 'gear') {
    const pts: [number, number][] = [];
    C.gearA.forEach((g, i) => {
      const x = (xs[i] / LAP_M) * w;
      const yy = h - 3 - ((g - 1) / 7) * (h - 6);
      if (pts.length) pts.push([x, pts[pts.length - 1][1]]);
      pts.push([x, yy]);
    });
    return <path d={pathD(pts)} fill="none" stroke={COLOR_A} strokeWidth="1.2" />;
  }
  if (row === 'delta') {
    const mid = h / 2;
    const d = seriesD(C.delta, w, h - 4, -dMax, dMax, xs, LAP_M);
    return (
      <>
        <line x1={0} x2={w} y1={mid} y2={mid} stroke="#ffffff" strokeOpacity="0.12" />
        <path d={d} transform="translate(0 2)" fill="none" stroke="#FF2D24" strokeWidth="1.4" />
        <text x={w - 4} y={10} textAnchor="end" fontSize="8.5" fill="#A7ACB6" fontFamily='"JetBrains Mono",Menlo,monospace'>{C.b.code} behind ↑</text>
      </>
    );
  }
  return null;
}

/** Tyre stints for the top-ten finishers, with the race's track-status bands behind. */
export function StintChart({ rows = 10, width = 760, className = '', showStatus = true }: { rows?: number; width?: number; className?: string; showStatus?: boolean }) {
  const total = SNAP.session.total_laps;
  const data = SNAP.strategy.slice(0, rows);
  const labelW = 64;
  const w = width;
  const rowH = 18;
  const gap = 7;
  const plotW = w - labelW - 8;
  const top = 20;
  const h = top + data.length * (rowH + gap) + 4;
  const x = (lap: number) => labelW + ((lap - 1) / total) * plotW;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={`block h-auto w-full ${className}`} role="img" aria-label={`Tyre stints of the top ${rows} finishers, ${SNAP.session.year} ${SNAP.session.name}`}>
      {showStatus && SNAP.lapStatus.map((s, i) =>
        s !== 'clear' ? (
          <rect key={i} x={x(i + 1)} y={top - 4} width={plotW / total} height={h - top} fill={s === 'red' ? '#E10600' : '#D97706'} fillOpacity={s === 'red' ? 0.16 : 0.12} />
        ) : null,
      )}
      {[1, 10, 20, 30, 40, 50].filter((l) => l <= total).map((l) => (
        <text key={l} x={x(l)} y={11} fontSize="9" fill="#A7ACB6" fontFamily='"JetBrains Mono",Menlo,monospace'>L{l}</text>
      ))}
      {data.map((r, i) => {
        const yy = top + i * (rowH + gap);
        return (
          <g key={r.code}>
            <text x={0} y={yy + 13} fontSize="10.5" fontWeight="700" fill="#F5F5F5" fontFamily='"JetBrains Mono",Menlo,monospace'>
              <tspan fill="#A7ACB6">{String(r.pos).padStart(2, '0')} </tspan>{r.code}
            </text>
            {r.stints.map((s, k) => {
              const c = COMPOUND[s.c]?.color ?? '#6B7280';
              return (
                <g key={k}>
                  <rect x={x(s.from) + 1} y={yy} width={Math.max(2, x(s.to + 1) - x(s.from) - 2)} height={rowH} fill={c} fillOpacity="0.16" stroke={c} strokeOpacity="0.7" />
                  {x(s.to + 1) - x(s.from) > 26 && (
                    <text x={x(s.from) + 6} y={yy + 12.5} fontSize="9" fontWeight="800" fill={c} fontFamily='"JetBrains Mono",Menlo,monospace'>
                      {COMPOUND[s.c]?.letter ?? '?'}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

/** Driving-state strip for driver A's fastest lap. */
export function StateStrip({ className = '' }: { className?: string }) {
  const w = 900;
  const h = 26;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={`block w-full ${className}`} role="img" aria-label={`Driving states over ${C.a.name}'s fastest lap`}>
      {SNAP.compare.states.map((s, i) => {
        const next = SNAP.compare.states[i + 1];
        const x0 = (s.from / LAP_M) * w;
        const x1 = ((next ? next.from : LAP_M) / LAP_M) * w;
        return <rect key={i} x={x0} y={0} width={Math.max(1, x1 - x0)} height={h} fill={STATE_META[s.s].color} fillOpacity={s.s === 'coast' ? 0.5 : 0.85} />;
      })}
    </svg>
  );
}

/** Driver A's fastest lap on the circuit, each stretch coloured by its driving state. */
export function StatePath() {
  const path = SNAP.compare.path;
  const states = SNAP.compare.states;
  return (
    <g>
      {states.map((s, i) => {
        const to = states[i + 1] ? states[i + 1].from : LAP_M;
        const i0 = Math.max(0, Math.round((s.from / LAP_M) * (N - 1)));
        const i1 = Math.min(N - 1, Math.round((to / LAP_M) * (N - 1)));
        const pts: [number, number][] = [];
        for (let k = i0; k <= i1; k++) pts.push([path[k * 2], path[k * 2 + 1]]);
        return pts.length > 1
          ? <path key={i} d={pathD(pts)} fill="none" stroke={STATE_META[s.s].color} strokeWidth={12} strokeOpacity={s.s === 'coast' ? 0.6 : 0.95} />
          : null;
      })}
    </g>
  );
}
