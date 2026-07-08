import { useEffect, useMemo, useState, useTransition } from 'react';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import {
  buildComparisonGrid, buildMultiSeriesGrid, driverStyles, fmtLapTime, resolveLapRange, selectedLapInfo, trackUrl,
  type DriverManifest, type DriverTelemetry, type LapSelection, type TrackCorner, type TrackData,
} from '../../../lib/telemetry';
import { useDriverSet } from '../useDriverSet';
import DrivingStateStrip from './DrivingStateStrip';
import { LapSelector, useLapOptions } from './LapSelector';

interface Props {
  year: string; gp: string; session: string;
  segment?: number | null;
  drivers: string[]; manifest: DriverManifest;
  colorOverrides?: Record<string, string>;
}

const AXIS = { stroke: 'rgba(255,255,255,0.25)', fontSize: 10 };
const GRID = 'rgba(255,255,255,0.06)';
const TOOLTIP_STYLE = { background: 'rgba(10,10,12,0.95)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, fontSize: 12 };
const CORNER_LINE_COLOR = 'rgba(163,230,53,0.55)';
const CORNER_LABEL = { position: 'top' as const, fill: '#a3e635', fontSize: 10, fontWeight: 700, fontFamily: 'monospace' };
const ANIM_MS = 700;
// Every chart shares the same Y-axis width/left-margin so the plot areas line up
// across the grid — RPM used to need extra room for its 5-digit values, which is
// why it looked out of step; a compact tick formatter (see rpmTick) lets it fit
// the same width as every other chart instead.
const AXIS_WIDTH = 40;
const CHART_MARGIN = { top: 18, right: 12, left: -6, bottom: 0 };
const rpmTick = (v: number) => (v === 0 ? '0' : `${Number.isInteger(v / 1000) ? v / 1000 : (v / 1000).toFixed(1)}k`);

// Corners closer together than this fraction of the lap tend to have their number
// labels collide (very tight sequences like Monaco's — see the corner-overlap bug
// report). Stack colliding labels at increasing heights instead of letting them
// overlap; corners far enough apart all land back on the same baseline (level 0).
function cornerLabelLevels(corners: TrackCorner[], avgLapLength: number): Map<number, number> {
  const levels = new Map<number, number>();
  if (corners.length === 0 || avgLapLength <= 0) return levels;
  const threshold = avgLapLength * 0.03;
  const lastDistAtLevel: number[] = [];
  for (const c of [...corners].sort((a, b) => a.distance - b.distance)) {
    let level = 0;
    while (level < lastDistAtLevel.length && c.distance - lastDistAtLevel[level] < threshold) level++;
    if (level === lastDistAtLevel.length) lastDistAtLevel.push(c.distance);
    else lastDistAtLevel[level] = c.distance;
    levels.set(c.number, level);
  }
  return levels;
}

export default function TelemetryComparison({ year, gp, session, segment, drivers: codes, colorOverrides }: Props) {
  const { drivers, loading, error } = useDriverSet(year, gp, session, codes);
  const [lapOverride, setLapOverride] = useState<number | null>(null);
  useEffect(() => { setLapOverride(null); }, [segment, session, codes.join(',')]);

  const sel = useMemo<LapSelection>(
    () => (lapOverride != null ? { lap: lapOverride } : segment ? { segment } : 'fastest'),
    [lapOverride, segment],
  );
  // Unfiltered-by-sel list, purely for the lap dropdown's options — so switching
  // laps isn't constrained by whichever lap happens to be currently selected.
  const rawList = useMemo(
    () => codes.map(c => drivers[c]).filter((d): d is DriverTelemetry => !!d),
    [codes, drivers],
  );
  const lapOptions = useLapOptions(rawList, segment ?? null);
  // Only drivers who actually have a lap in the chosen context (e.g. a driver
  // knocked out in Q1 has no Q3 lap) — filter them out so the charts stay clean.
  const list = useMemo(
    () => codes.map(c => drivers[c]).filter((d): d is DriverTelemetry => !!d && resolveLapRange(d, sel) !== null),
    [codes, drivers, sel],
  );

  // Only needed for corner-number markers + the driving-state strip's shared
  // distance scale — fetched independently so a slow/failed track load doesn't
  // block the rest of the telemetry charts above it.
  const [track, setTrack] = useState<TrackData | null>(null);
  useEffect(() => {
    let cancelled = false;
    setTrack(null);
    fetch(trackUrl(year, gp, session))
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then((t: TrackData) => { if (!cancelled) setTrack(t); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [year, gp, session]);
  const corners: TrackCorner[] = track?.corners ?? [];
  const cornerLevels = useMemo(() => cornerLabelLevels(corners, track?.avg_lap_length ?? 0), [corners, track]);
  const maxCornerLevel = corners.length ? Math.max(0, ...corners.map(c => cornerLevels.get(c.number) ?? 0)) : 0;
  const chartMargin = { ...CHART_MARGIN, top: CHART_MARGIN.top + maxCornerLevel * 11 };
  const cornerLabel = (c: TrackCorner) => ({ ...CORNER_LABEL, value: String(c.number), dy: -(cornerLevels.get(c.number) ?? 0) * 11 });

  const styles = useMemo(() => driverStyles(list.map(d => ({ driver: d.driver, team_color: d.team_color })), colorOverrides), [list, colorOverrides]);
  // stepMeters=2 (vs. the 1m default) halves the point count per line — still
  // far denser than the chart can visually distinguish, but meaningfully less
  // SVG path/DOM work for recharts to lay out — combined with each chart now
  // only mounting on an explicit "Load Chart" click (see LazyChart below),
  // this keeps even the animated draw-in smooth instead of janky.
  const multiData = useMemo(() => buildMultiSeriesGrid(list, sel, 2), [list, sel]);
  const isPair = list.length === 2;
  const deltaData = useMemo(() => (isPair ? buildComparisonGrid(list[0], list[1], sel, 2) : []), [isPair, list, sel]);

  // Every chart below is gated behind its own "Load Chart" button (LazyChart)
  // instead of rendering all 6-7 heavy recharts instances at once on every
  // lap/driver change — that simultaneous render was what actually froze the
  // page. Changing the lap/driver/segment selection should make every chart
  // go back to its "not loaded" placeholder rather than silently keep
  // rendering stale data — remounting the whole gated section via `key` is
  // the simplest correct way to reset every LazyChart's internal state together.
  const chartsKey = `${sel === 'fastest' ? 'fastest' : 'segment' in sel ? `seg${sel.segment}` : `lap${sel.lap}`}|${list.map(d => d.driver).join(',')}`;

  if (loading) return <BufferingPanel label="Buffering telemetry…" />;
  if (error || list.length === 0) return <Panel><Empty msg={error ?? (segment ? `No driver has a Q${segment} lap in this selection.` : 'No telemetry available')} /></Panel>;
  if (multiData.length === 0) return <Panel><Empty msg="Could not resolve a lap for the selected driver(s) in this session." /></Panel>;

  return (
    <div className="flex flex-col gap-4">
      {/* Fastest-lap header */}
      <div className="flex flex-wrap items-center gap-6 rounded-2xl bg-[#0d0e12] border border-white/5 px-5 py-4">
        {list.map(d => {
          // The actual lap being visualized — NOT d.fastest_lap, which is always the
          // session-wide fastest and would show the same number/time regardless of
          // which Q1/Q2/Q3 segment (or explicit lap) is currently selected.
          const info = selectedLapInfo(d, sel);
          return (
            <LapPill key={d.driver} code={d.driver} name={d.full_name} color={styles[d.driver].color} dash={styles[d.driver].dash}
              time={fmtLapTime(info?.timeS ?? d.fastest_lap?.lap_time_s)} lap={info?.lapNumber ?? d.fastest_lap?.lap_number} />
          );
        })}
        <div className="ml-auto flex items-center gap-4">
          <span className="text-[10px] text-gray-500 font-mono">aligned by track distance</span>
          <LapSelector value={lapOverride} onChange={setLapOverride} options={lapOptions} segment={segment ?? null} />
        </div>
      </div>

      <div key={chartsKey} className="flex flex-col gap-4">
        {isPair && (
          <LazyChart title="Speed Delta" unit={`km/h · ${list[0].driver} − ${list[1].driver}`} height={140} render={() => (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <AreaChart data={deltaData} margin={chartMargin}>
                  <defs>
                    <linearGradient id="deltaFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={styles[list[0].driver].color} stopOpacity={0.5} />
                      <stop offset="50%" stopColor={styles[list[0].driver].color} stopOpacity={0.05} />
                      <stop offset="50%" stopColor={styles[list[1].driver].color} stopOpacity={0.05} />
                      <stop offset="100%" stopColor={styles[list[1].driver].color} stopOpacity={0.5} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={GRID} />
                  <XAxis dataKey="distance" type="number" domain={["dataMin", "dataMax"]} tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} unit="m" />
                  <YAxis tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} width={AXIS_WIDTH} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: '#aaa' }} labelFormatter={(v) => `${v} m`} />
                  <ReferenceLine y={0} stroke="rgba(255,255,255,0.3)" />
                  {corners.map(c => (
                    <ReferenceLine key={c.number} x={c.distance} stroke={CORNER_LINE_COLOR} strokeDasharray="3 3" label={cornerLabel(c)} />
                  ))}
                  <Area type="monotone" dataKey="speed_delta" name={`${list[0].driver} − ${list[1].driver}`} stroke="rgba(255,255,255,0.35)" fill="url(#deltaFill)" strokeWidth={1} isAnimationActive animationDuration={ANIM_MS} />
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex justify-between px-2 pt-1 text-[10px] font-mono text-gray-500">
                <span style={{ color: styles[list[0].driver].color }}>▲ {list[0].driver} faster</span>
                <span style={{ color: styles[list[1].driver].color }}>▼ {list[1].driver} faster</span>
              </div>
            </>
          )} />
        )}
        {!isPair && (
          <div className="rounded-xl bg-white/[0.02] border border-white/5 px-4 py-2.5 text-[11px] text-gray-500 font-mono">
            Speed delta is only shown when exactly 2 drivers are selected.
          </div>
        )}

        {/* 2x3 grid — 6 charts of equal weight, evenly balanced instead of Speed
            sitting full-width above an odd-numbered 2-column block. */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <LazyChart title="Speed" unit="km/h" height={180} render={() => (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={multiData} margin={chartMargin}>
                <CartesianGrid stroke={GRID} />
                <XAxis dataKey="distance" type="number" domain={["dataMin", "dataMax"]} tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} unit="m" />
                <YAxis tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} width={AXIS_WIDTH} />
                <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: '#aaa' }} labelFormatter={(v) => `${v} m`} />
                {corners.map(c => (
                  <ReferenceLine key={c.number} x={c.distance} stroke={CORNER_LINE_COLOR} strokeDasharray="3 3" label={cornerLabel(c)} />
                ))}
                {list.map(d => (
                  <Line key={d.driver} type="monotone" dataKey={`${d.driver}_speed`} name={d.driver} stroke={styles[d.driver].color} strokeDasharray={styles[d.driver].dash || undefined} dot={false} strokeWidth={1.8} isAnimationActive animationDuration={ANIM_MS} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )} />

          <LazyChart title="Throttle" unit="%" height={180} render={() => (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={multiData} margin={chartMargin}>
                <CartesianGrid stroke={GRID} />
                <XAxis dataKey="distance" type="number" domain={["dataMin", "dataMax"]} tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} unit="m" />
                <YAxis tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} width={AXIS_WIDTH} domain={[0, 100]} />
                <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: '#aaa' }} labelFormatter={(v) => `${v} m`} />
                {corners.map(c => (
                  <ReferenceLine key={c.number} x={c.distance} stroke={CORNER_LINE_COLOR} strokeDasharray="3 3" label={cornerLabel(c)} />
                ))}
                {list.map(d => (
                  <Line key={d.driver} type="monotone" dataKey={`${d.driver}_throttle`} name={d.driver} stroke={styles[d.driver].color} strokeDasharray={styles[d.driver].dash || undefined} dot={false} strokeWidth={1.6} isAnimationActive animationDuration={ANIM_MS} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )} />

          <LazyChart title="Brake" unit="%" height={180} render={() => (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={multiData} margin={chartMargin}>
                <CartesianGrid stroke={GRID} />
                <XAxis dataKey="distance" type="number" domain={["dataMin", "dataMax"]} tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} unit="m" />
                <YAxis tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} width={AXIS_WIDTH} domain={[0, 100]} />
                <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: '#aaa' }} labelFormatter={(v) => `${v} m`} />
                {corners.map(c => (
                  <ReferenceLine key={c.number} x={c.distance} stroke={CORNER_LINE_COLOR} strokeDasharray="3 3" label={cornerLabel(c)} />
                ))}
                {list.map(d => (
                  <Line key={d.driver} type="stepAfter" dataKey={`${d.driver}_brake`} name={d.driver} stroke={styles[d.driver].color} strokeDasharray={styles[d.driver].dash || undefined} dot={false} strokeWidth={1.6} isAnimationActive animationDuration={ANIM_MS} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )} />

          <LazyChart title="Gear" unit="" height={180} render={() => (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={multiData} margin={chartMargin}>
                <CartesianGrid stroke={GRID} />
                <XAxis dataKey="distance" type="number" domain={["dataMin", "dataMax"]} tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} unit="m" />
                <YAxis tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} width={AXIS_WIDTH} domain={[0, 8]} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: '#aaa' }} labelFormatter={(v) => `${v} m`} />
                {corners.map(c => (
                  <ReferenceLine key={c.number} x={c.distance} stroke={CORNER_LINE_COLOR} strokeDasharray="3 3" label={cornerLabel(c)} />
                ))}
                {list.map(d => (
                  <Line key={d.driver} type="stepAfter" dataKey={`${d.driver}_gear`} name={d.driver} stroke={styles[d.driver].color} strokeDasharray={styles[d.driver].dash || undefined} dot={false} strokeWidth={1.6} isAnimationActive animationDuration={ANIM_MS} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )} />

          <LazyChart title="RPM" unit="rpm" height={180} render={() => (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={multiData} margin={chartMargin}>
                <CartesianGrid stroke={GRID} />
                <XAxis dataKey="distance" type="number" domain={["dataMin", "dataMax"]} tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} unit="m" />
                <YAxis tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} width={AXIS_WIDTH} domain={[0, 'dataMax + 500']} tickFormatter={rpmTick} />
                <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: '#aaa' }} labelFormatter={(v) => `${v} m`} />
                {corners.map(c => (
                  <ReferenceLine key={c.number} x={c.distance} stroke={CORNER_LINE_COLOR} strokeDasharray="3 3" label={cornerLabel(c)} />
                ))}
                {list.map(d => (
                  <Line key={d.driver} type="monotone" dataKey={`${d.driver}_rpm`} name={d.driver} stroke={styles[d.driver].color} strokeDasharray={styles[d.driver].dash || undefined} dot={false} strokeWidth={1.6} isAnimationActive animationDuration={ANIM_MS} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )} />

          <LazyChart title="DRS" unit="" height={180} render={() => (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={multiData} margin={chartMargin}>
                <CartesianGrid stroke={GRID} />
                <XAxis dataKey="distance" type="number" domain={["dataMin", "dataMax"]} tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} unit="m" />
                <YAxis tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} width={AXIS_WIDTH} domain={[0, 100]} />
                <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: '#aaa' }} labelFormatter={(v) => `${v} m`} />
                {corners.map(c => (
                  <ReferenceLine key={c.number} x={c.distance} stroke={CORNER_LINE_COLOR} strokeDasharray="3 3" label={cornerLabel(c)} />
                ))}
                {list.map(d => (
                  <Line key={d.driver} type="stepAfter" dataKey={`${d.driver}_drs`} name={d.driver} stroke={styles[d.driver].color} strokeDasharray={styles[d.driver].dash || undefined} dot={false} strokeWidth={1.6} isAnimationActive animationDuration={ANIM_MS} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )} />
        </div>

        <LazyChart title="Driving State" unit="by distance" height={140} render={() => (
          <DrivingStateStrip list={list} sel={sel} corners={corners} avgLapLength={track?.avg_lap_length ?? 0} styles={styles} bare />
        )} />
      </div>
    </div>
  );
}

// Gates one chart behind an explicit "Load Chart" click instead of mounting
// the (expensive) recharts instance immediately — rendering all 6-7 charts
// simultaneously on every lap/driver change was what actually froze the page,
// not any one chart individually. `render` is a function (not raw children)
// so the actual chart JSX is only ever constructed once actually needed.
// Clicking Load is wrapped in a transition so the click itself never blocks —
// React mounts the (still relatively heavy) chart in the background and this
// button shows a brief spinner state until it's ready.
function LazyChart({ title, unit, height, render }: { title: string; unit?: string; height: number; render: () => React.ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="rounded-2xl bg-[#0d0e12] border border-white/5 p-4">
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-300">{title}</h3>
        {unit && <span className="text-[10px] font-mono text-gray-600">{unit}</span>}
      </div>
      {loaded ? render() : (
        <div className="flex flex-col items-center justify-center gap-3" style={{ height }}>
          <span className="text-[11px] font-mono text-gray-500">Select a lap/driver(s) and load to view this chart</span>
          <button
            onClick={() => startTransition(() => setLoaded(true))}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-60 border border-white/10 text-xs font-mono font-bold text-gray-200 transition-colors"
          >
            {isPending ? (
              <span className="w-3.5 h-3.5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18M7 15l4-4 4 4 5-6" /></svg>
            )}
            {isPending ? 'Loading…' : 'Load Chart'}
          </button>
        </div>
      )}
    </div>
  );
}

function LapPill({ code, name, color, dash, time, lap }: { code: string; name: string; color: string; dash?: string; time: string; lap?: number | null }) {
  return (
    <div className="flex items-center gap-3">
      {/* solid bar for solid lines; dashed bar when this driver's chart line is dashed (same-team differentiation) */}
      <span className="w-1.5 h-9 rounded-full" style={dash ? { background: `repeating-linear-gradient(${color} 0 4px, transparent 4px 7px)` } : { background: color }} />
      <div>
        <div className="text-sm font-black text-white leading-tight">{code} <span className="text-gray-500 font-medium">· {name}</span></div>
        <div className="font-mono text-lg font-bold" style={{ color }}>{time}{lap != null && <span className="text-[10px] text-gray-500 ml-2">Lap {lap}</span>}</div>
      </div>
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl bg-[#0d0e12] border border-white/5 py-16 flex items-center justify-center">{children}</div>;
}
function Empty({ msg }: { msg: string }) {
  return <div className="text-gray-500 text-xs font-mono text-center px-6">{msg}</div>;
}
function BufferingPanel({ label }: { label: string }) {
  return (
    <div className="rounded-2xl bg-[#0d0e12] border border-white/5 h-[520px] flex flex-col items-center justify-center gap-3">
      <span className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      <span className="text-[11px] font-mono text-gray-500">{label}</span>
    </div>
  );
}
