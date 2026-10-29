import { useEffect, useMemo, useState } from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  deriveStints, degradationSeries, driverColors, fmtLapTime, lapsUrl, TYRE_COLORS,
  type DriverManifest, type DriverTelemetry, type LapSummary, type SessionLaps,
} from '../../../lib/telemetry';
import { useDriverSet } from '../useDriverSet';
import { sessionResultsUrl } from '../../../lib/f1';

interface Props {
  year: string; gp: string; session: string;
  /** Championship round, to look up the official classification. */
  round?: number | string;
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

export default function TyreStrategy({ year, gp, session, round, drivers: codes, colorOverrides }: Props) {
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

  // The official classification decides the order and the numbers. The last lap's running
  // position is not it: a car can be shuffled after the flag (penalties, a lapped car
  // crossing the line), which gave two drivers the same number.
  const [official, setOfficial] = useState<Record<string, number> | null>(null);
  useEffect(() => {
    if (round == null || (session !== 'R' && session !== 'S')) return;
    let cancelled = false;
    fetch(sessionResultsUrl(year, round, session))
      .then(r => (r.ok ? r.json() : null))
      .then((data: { results?: { abbreviation: string; position: number | null }[] } | null) => {
        if (cancelled || !data?.results) return;
        const map: Record<string, number> = {};
        for (const row of data.results) if (row.position != null) map[row.abbreviation] = row.position;
        setOfficial(Object.keys(map).length ? map : null);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [year, round, session]);

  const gridOrder = useMemo(() => {
    if (typeof gridLaps !== 'object') return [];
    const isRaceLike = session === 'R' || session === 'S';
    return Object.keys(gridLaps).sort((a, b) => {
      if (isRaceLike) {
        const pa = official?.[a] ?? finalPosition(gridLaps[a].laps);
        const pb = official?.[b] ?? finalPosition(gridLaps[b].laps);
        if (pa != null && pb != null) return pa - pb;
        if (pa != null) return -1;
        if (pb != null) return 1;
      }
      const fa = gridLaps[a].fastest_lap?.lap_time_s ?? Infinity;
      const fb = gridLaps[b].fastest_lap?.lap_time_s ?? Infinity;
      return fa - fb;
    });
  }, [gridLaps, session, official]);

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
        <div className="mb-3 flex items-baseline justify-between">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-300">Stint Timeline</h3>
          <span className="font-mono text-[10px] text-gray-400">number = laps on that set · hover for detail</span>
        </div>
        {gridLaps === 'loading' ? (
          <div className="h-64 animate-pulse rounded-xl bg-white/[0.02]" />
        ) : gridLaps === 'missing' || gridLaps === 'error' || gridOrder.length === 0 ? (
          <div className="py-10 text-center text-gray-500 text-xs font-mono">No lap data available for this session.</div>
        ) : (
          <div className="flex flex-col">
            <LapAxis maxLaps={gridMaxLaps} />
            {gridOrder.map((code, i) => (
              <StintRow key={code} code={code} laps={gridLaps[code].laps} position={session === 'R' || session === 'S' ? (official?.[code] ?? finalPosition(gridLaps[code].laps)) : i + 1}
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

// Fixed columns shared by the axis and every row so the lap scale lines up.
const ROW_COLS = '68px 1fr 44px';
const AXIS_STEP = 10;

/** Gridlines every 10 laps, drawn as a background so they line up with the axis ticks. */
const gridlines = (maxLaps: number): React.CSSProperties => ({
  backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.07) 1px, transparent 1px)',
  backgroundSize: `${(AXIS_STEP / maxLaps) * 100}% 100%`,
});

function LapAxis({ maxLaps }: { maxLaps: number }) {
  const ticks: number[] = [];
  for (let l = 0; l <= maxLaps; l += AXIS_STEP) ticks.push(l);
  return (
    <div className="grid items-end pb-1" style={{ gridTemplateColumns: ROW_COLS }} aria-hidden>
      <span />
      <div className="relative h-4">
        {ticks.map((l) => (
          <span key={l} className="absolute top-0 -translate-x-1/2 font-mono text-[9px] text-gray-400" style={{ left: `${(l / maxLaps) * 100}%` }}>
            {l === 0 ? '' : l}
          </span>
        ))}
      </div>
      <span className="text-right font-mono text-[9px] uppercase tracking-wider text-gray-500">Stops</span>
    </div>
  );
}

function StintRow({ code, laps, position, maxLaps, highlighted }: {
  code: string; laps: LapSummary[]; position: number | null; maxLaps: number; highlighted: boolean;
}) {
  const stints = deriveStints(laps);
  const stops = Math.max(0, stints.length - 1);
  return (
    <div className={`grid items-center rounded-sm transition-colors ${highlighted ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'}`}
      style={{ gridTemplateColumns: ROW_COLS, height: 22 }}>
      <div className="flex items-center gap-1.5 pl-1">
        <span className="w-5 shrink-0 text-right font-mono text-[9px] text-gray-400">{position != null ? position : ''}</span>
        <span className="text-[11px] font-black tracking-wide text-white">{code}</span>
      </div>
      <div className="flex h-[14px] items-center gap-px" style={gridlines(maxLaps)}>
        {stints.map((s, i) => {
          const color = TYRE_COLORS[s.compound] ?? TYRE_COLORS.UNKNOWN;
          const dark = s.compound === 'HARD' || s.compound === 'MEDIUM';
          return (
            // Custom CSS-fade tooltip instead of the native `title` attribute —
            // browser tooltips have an unstyled, laggy appear delay. Clipping to the
            // rounded corners sits on the inner div: overflow-hidden on this outer
            // box would clip the tooltip, which is positioned outside it.
            <div key={i} className="group relative h-full cursor-default" style={{ width: `${(s.laps / maxLaps) * 100}%` }}>
              <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-[3px]" style={{ background: color }}>
                <span className="px-0.5 font-mono text-[9px] font-bold leading-none tabular-nums" style={{ color: dark ? '#111' : '#fff' }}>
                  {s.laps}
                </span>
              </div>
              <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 -translate-x-1/2 scale-95 whitespace-nowrap opacity-0 transition-all duration-150 ease-out group-hover:scale-100 group-hover:opacity-100">
                <div className="rounded-lg border border-white/10 bg-[#0a0a0c] px-3 py-1.5 shadow-xl">
                  <div className="text-[11px] font-bold text-white">{s.compound}</div>
                  <div className="font-mono text-[10px] text-gray-300">Laps {s.startLap}–{s.endLap} · {s.laps} lap{s.laps === 1 ? '' : 's'}</div>
                </div>
                <div className="absolute left-1/2 top-full -mt-1 h-2 w-2 -translate-x-1/2 rotate-45 border-b border-r border-white/10 bg-[#0a0a0c]" />
              </div>
            </div>
          );
        })}
        {stints.length === 0 && <div className="font-mono text-[10px] text-gray-500">No stint data</div>}
      </div>
      <div className="pr-1 text-right font-mono text-[10px] text-gray-300 tabular-nums">{stints.length ? `${stops}` : ''}</div>
    </div>
  );
}

function CompoundLegend() {
  const items = ['SOFT', 'MEDIUM', 'HARD', 'INTERMEDIATE', 'WET'];
  return (
    <div className="flex gap-3 mt-3 flex-wrap">
      {items.map(c => (
        <div key={c} className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ background: TYRE_COLORS[c] }} />
          <span className="text-[10px] font-mono text-gray-300">{c}</span>
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
