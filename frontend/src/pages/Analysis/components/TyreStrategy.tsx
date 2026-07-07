import { useEffect, useMemo, useState } from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  deriveStints, degradationSeries, driverColors, fmtLapTime, lapsUrl, TYRE_COLORS,
  type DriverManifest, type DriverTelemetry, type LapSummary, type SessionLaps,
} from '../../../lib/telemetry';
import { useDriverSet } from '../useDriverSet';

interface Props {
  year: string; gp: string; session: string;
  drivers: string[]; manifest: DriverManifest;
  colorOverrides?: Record<string, string>;
}

const AXIS = { stroke: 'rgba(255,255,255,0.25)', fontSize: 10 };
const GRID = 'rgba(255,255,255,0.06)';
const TOOLTIP_STYLE = { background: 'rgba(10,10,12,0.95)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, fontSize: 12 };

type GridLapsState = SessionLaps | 'loading' | 'missing' | 'error';

// Last non-null classification position in a driver's lap table — the closest
// thing to "where they finished" for Race/Sprint sessions. Quali/Practice never
// populate `position`, so callers fall back to fastest-lap order for those.
function finalPosition(laps: LapSummary[]): number | null {
  for (let i = laps.length - 1; i >= 0; i--) {
    if (laps[i].position != null) return laps[i].position;
  }
  return null;
}

export default function TyreStrategy({ year, gp, session, drivers: codes, colorOverrides }: Props) {
  const { drivers, loading, error } = useDriverSet(year, gp, session, codes);
  const list = useMemo(() => codes.map(c => drivers[c]).filter((d): d is DriverTelemetry => !!d), [codes, drivers]);
  const colors = useMemo(() => driverColors(list.map(d => ({ driver: d.driver, team_color: d.team_color })), colorOverrides), [list, colorOverrides]);

  const degByDriver = useMemo(() => {
    const out: Record<string, ReturnType<typeof degradationSeries>> = {};
    for (const d of list) out[d.driver] = degradationSeries(d);
    return out;
  }, [list]);

  // Stint Timeline shows the WHOLE grid (not just the drivers selected for
  // comparison above), ordered by where they finished — this needs the
  // lightweight session-wide laps.json rather than each driver's full telemetry.
  const [gridLaps, setGridLaps] = useState<GridLapsState>('loading');
  useEffect(() => {
    let cancelled = false;
    setGridLaps('loading');
    fetch(lapsUrl(year, gp, session))
      .then(r => {
        if (r.status === 404) return 'missing' as const;
        if (!r.ok) return 'error' as const;
        return r.json();
      })
      .then((data) => { if (!cancelled) setGridLaps(data); })
      .catch(() => { if (!cancelled) setGridLaps('error'); });
    return () => { cancelled = true; };
  }, [year, gp, session]);

  const gridOrder = useMemo(() => {
    if (typeof gridLaps !== 'object') return [];
    const isRaceLike = session === 'R' || session === 'S';
    return Object.keys(gridLaps).sort((a, b) => {
      if (isRaceLike) {
        const pa = finalPosition(gridLaps[a].laps);
        const pb = finalPosition(gridLaps[b].laps);
        if (pa != null && pb != null) return pa - pb;
        if (pa != null) return -1;
        if (pb != null) return 1;
      }
      const fa = gridLaps[a].fastest_lap?.lap_time_s ?? Infinity;
      const fb = gridLaps[b].fastest_lap?.lap_time_s ?? Infinity;
      return fa - fb;
    });
  }, [gridLaps, session]);

  const gridMaxLaps = useMemo(() => {
    if (typeof gridLaps !== 'object') return 1;
    return Math.max(1, ...gridOrder.map(c => gridLaps[c].laps.length));
  }, [gridLaps, gridOrder]);

  if (loading) return <div className="rounded-2xl bg-[#0d0e12] border border-white/5 h-[520px] animate-pulse" />;
  if (error || list.length === 0) return <Panel msg={error ?? 'No data available'} />;

  const hasDeg = Object.values(degByDriver).some(s => s.length > 0);

  return (
    <div className="flex flex-col gap-4">
      {session !== 'R' && session !== 'S' && (
        <div className="rounded-xl bg-amber-500/8 border border-amber-500/25 px-4 py-2.5 text-[11px] text-amber-300/90 font-mono">
          Tyre strategy is most meaningful on a Race or Sprint session — switch the session above for full stint/degradation data.
        </div>
      )}

      {/* Stint timelines — whole grid, ordered by finishing position */}
      <div className="rounded-2xl bg-[#0d0e12] border border-white/5 p-5">
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-300 mb-4">Stint Timeline</h3>
        {gridLaps === 'loading' ? (
          <div className="h-64 animate-pulse rounded-xl bg-white/[0.02]" />
        ) : gridLaps === 'missing' || gridLaps === 'error' || gridOrder.length === 0 ? (
          <div className="py-10 text-center text-gray-500 text-xs font-mono">No lap data available for this session.</div>
        ) : (
          <div className="flex flex-col gap-2">
            {gridOrder.map((code, i) => (
              <StintRow key={code} code={code} laps={gridLaps[code].laps} position={session === 'R' || session === 'S' ? finalPosition(gridLaps[code].laps) : i + 1}
                maxLaps={gridMaxLaps} highlighted={codes.includes(code)} />
            ))}
          </div>
        )}
        <CompoundLegend />
      </div>

      {/* Degradation */}
      <div className="rounded-2xl bg-[#0d0e12] border border-white/5 p-4">
        <div className="flex items-baseline justify-between mb-2">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-300">Tyre Degradation</h3>
          <span className="text-[10px] font-mono text-gray-600">lap time vs tyre age · accurate laps only</span>
        </div>
        {hasDeg ? (
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart margin={{ top: 8, right: 16, left: 4, bottom: 4 }}>
              <CartesianGrid stroke={GRID} />
              <XAxis type="number" dataKey="tyre_life" name="Tyre age" unit=" laps" tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} />
              <YAxis type="number" dataKey="lap_time_s" name="Lap time" tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} width={48}
                domain={['dataMin - 0.5', 'dataMax + 0.5']} tickFormatter={fmtLapTime} />
              <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: '#aaa' }}
                formatter={(val, key) => key === 'lap_time_s' ? [fmtLapTime(typeof val === 'number' ? val : null), 'Lap'] : [String(val), String(key)]} />
              {list.map(d => (
                <Scatter key={d.driver} name={d.driver} data={degByDriver[d.driver]} fill={colors[d.driver]}
                  line={{ stroke: colors[d.driver], strokeWidth: 1 }} lineJointType="monotone" />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        ) : (
          <div className="py-14 text-center text-gray-500 text-xs font-mono">No accurate timed laps to plot for this session.</div>
        )}
        <div className="flex gap-4 justify-center flex-wrap pt-1 text-[11px] font-mono">
          {list.map(d => <span key={d.driver} style={{ color: colors[d.driver] }}>● {d.driver}</span>)}
        </div>
      </div>
    </div>
  );
}

function StintRow({ code, laps, position, maxLaps, highlighted }: {
  code: string; laps: LapSummary[]; position: number | null; maxLaps: number; highlighted: boolean;
}) {
  const stints = deriveStints(laps);
  return (
    <div className={`flex items-center gap-3 rounded-lg px-2 py-1 -mx-2 transition-colors ${highlighted ? 'bg-white/[0.06]' : ''}`}>
      <div className="w-14 shrink-0 flex items-center gap-1.5">
        <span className="text-[9px] font-mono text-gray-600 w-5 text-right shrink-0">{position != null ? `P${position}` : ''}</span>
        <span className="text-sm font-black text-white">{code}</span>
      </div>
      <div className="flex-1 flex gap-0.5 h-9">
        {stints.map((s, i) => {
          const color = TYRE_COLORS[s.compound] ?? TYRE_COLORS.UNKNOWN;
          const dark = s.compound === 'HARD' || s.compound === 'MEDIUM';
          return (
            // Custom CSS-fade tooltip instead of the native `title` attribute —
            // browser tooltips have an unstyled, laggy appear delay; this fades
            // in immediately on hover, styled to match the rest of the page.
            // NOTE: rounded-corner clipping lives on the inner absolute div below,
            // not on this outer relative container — overflow-hidden here would
            // clip the tooltip too, since it's positioned outside this box (bottom-full).
            <div key={i} className="group relative flex items-center justify-center cursor-default"
              style={{ width: `${(s.laps / maxLaps) * 100}%`, minWidth: 18 }}>
              <div className="absolute inset-0 rounded-[4px]" style={{ background: color }} />
              <span className="relative text-[10px] font-black" style={{ color: dark ? '#111' : '#fff' }}>
                {s.compound[0]}<span className="opacity-70 font-bold">{s.laps}</span>
              </span>
              <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 whitespace-nowrap opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-150 ease-out">
                <div className="rounded-lg bg-[#0a0a0c] border border-white/10 px-3 py-1.5 shadow-xl">
                  <div className="text-[11px] font-bold text-white">{s.compound}</div>
                  <div className="text-[10px] text-gray-400 font-mono">Laps {s.startLap}–{s.endLap} · {s.laps} lap{s.laps === 1 ? '' : 's'}</div>
                </div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 rotate-45 bg-[#0a0a0c] border-r border-b border-white/10" />
              </div>
            </div>
          );
        })}
        {stints.length === 0 && <div className="text-[11px] text-gray-600 font-mono self-center">No stint data</div>}
      </div>
    </div>
  );
}

function CompoundLegend() {
  const items = ['SOFT', 'MEDIUM', 'HARD', 'INTERMEDIATE', 'WET'];
  return (
    <div className="flex gap-3 mt-4 flex-wrap">
      {items.map(c => (
        <div key={c} className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ background: TYRE_COLORS[c] }} />
          <span className="text-[10px] font-mono text-gray-500">{c}</span>
        </div>
      ))}
    </div>
  );
}

function Panel({ msg }: { msg: string }) {
  return (
    <div className="rounded-2xl bg-[#0d0e12] border border-white/5 py-16 flex items-center justify-center">
      <div className="text-gray-500 text-xs font-mono text-center px-6">{msg}</div>
    </div>
  );
}
