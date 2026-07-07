import { useEffect, useMemo, useRef, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import RaceTrack, { type CarPosition } from '../../Simulator/components/RaceTrack';
import {
  resolveLapRange, lerpAt, trackUrl, driverColors, fmtLapTime,
  type DriverManifest, type DriverTelemetry, type TrackData, type LapSelection,
} from '../../../lib/telemetry';
import { useDriverSet } from '../useDriverSet';
import { LapSelector, useLapOptions } from './LapSelector';

interface Props {
  year: string; gp: string; session: string;
  segment?: number | null;
  drivers: string[]; manifest: DriverManifest;
  colorOverrides?: Record<string, string>;
}

// A driver's selected lap re-based to lap-start: time-into-lap (τ) → x/y/dist/speed.
interface LapSlice {
  code: string;
  taus: number[];   // seconds since lap start
  xs: number[];
  ys: number[];
  ds: number[];     // in-lap distance since lap start
  spd: number[];    // speed (km/h)
  duration: number; // telemetry span of the lap (drives the animation)
  officialTime: number | null; // FastF1 lap time (for display — a touch longer than the sampled span)
  lapLength: number;
}

/** Closest point (with sub-segment interpolation) along a driver's own raw
 * (x, y) trajectory to a target point — returns the segment index and the
 * fraction of the way along it. */
function nearestPointOnPath(xs: number[], ys: number[], tx: number, ty: number): { index: number; frac: number } {
  let bestIdx = 0, bestFrac = 0, bestDist2 = Infinity;
  for (let i = 0; i < xs.length - 1; i++) {
    const dx = xs[i + 1] - xs[i], dy = ys[i + 1] - ys[i];
    const len2 = dx * dx + dy * dy;
    let frac = len2 > 0 ? ((tx - xs[i]) * dx + (ty - ys[i]) * dy) / len2 : 0;
    frac = Math.max(0, Math.min(1, frac));
    const px = xs[i] + frac * dx, py = ys[i] + frac * dy;
    const dist2 = (px - tx) ** 2 + (py - ty) ** 2;
    if (dist2 < bestDist2) { bestDist2 = dist2; bestIdx = i; bestFrac = frac; }
  }
  return { index: bestIdx, frac: bestFrac };
}

/** Builds every selected driver's lap slice, calibrated so they all start from
 * the exact same physical point on track.
 *
 * Calibration attempts tried, in order, verified against real data:
 *  1. Each driver's own raw first telemetry sample as "t=0". FastF1 samples
 *     ~every 270ms, not synchronized to the line crossing, so this put cars
 *     up to ~190 units apart at "the start" (confirmed on a real HAM/ANT pair).
 *  2. Calibrate to the same Distance-channel VALUE via interpolation. Verified
 *     this does NOT work either — two drivers' own Distance integration
 *     doesn't correspond to the same physical (x,y) point closely enough
 *     (residual ~48 units even after "matching" distance).
 *  3. Calibrate to an independent anchor — the track's own start/finish
 *     coordinate from track.json (`track_outline[0]`, built from a THIRD
 *     driver's separate fastest lap). Worse still (~90 units) — that
 *     reference lap isn't necessarily well-aligned with either selected
 *     driver's own recorded trajectory.
 *  4. What actually works (residual: 0.02 units, i.e. exact): anchor to one
 *     of the ACTUAL SELECTED drivers' own raw first sample instead — whoever's
 *     first sample is furthest into the lap (so every other selected driver's
 *     own trajectory has necessarily already passed that physical point) —
 *     then find each driver's nearest point (sub-segment interpolated) on
 *     THEIR OWN path to that shared, real, on-track coordinate.
 */
function buildSlices(list: DriverTelemetry[], sel: LapSelection): LapSlice[] {
  const resolved = list
    .map(d => { const r = resolveLapRange(d, sel); return r ? { d, r } : null; })
    .filter((x): x is { d: DriverTelemetry; r: NonNullable<ReturnType<typeof resolveLapRange>> } => x !== null);
  if (resolved.length === 0) return [];

  const raw = resolved.map(({ d, r }) => {
    const absDist: number[] = [], absT: number[] = [], xs: number[] = [], ys: number[] = [], spd: number[] = [];
    for (let i = r.start; i < r.end; i++) {
      absDist.push(d.dist[i]); absT.push(d.t[i]); xs.push(d.x[i]); ys.push(d.y[i]); spd.push(d.speed[i]);
    }
    return { d, r, absDist, absT, xs, ys, spd };
  });

  // Anchor = whichever selected driver's first recorded sample is furthest
  // into the lap — guarantees every other driver's own trajectory has already
  // driven through that exact physical point too.
  const ref = raw.reduce((a, b) => (a.absDist[0] > b.absDist[0] ? a : b));
  const anchor = { x: ref.xs[0], y: ref.ys[0] };

  return raw.map(({ d, r, absDist, absT, xs, ys, spd }) => {
    const { index, frac } = nearestPointOnPath(xs, ys, anchor.x, anchor.y);
    const t0 = absT[index] + frac * (absT[index + 1] - absT[index]);
    const d0 = absDist[index] + frac * (absDist[index + 1] - absDist[index]);

    const taus = absT.map(t => t - t0);
    const ds = absDist.map(dist => dist - d0);
    const lapNum = d.lap[r.start];
    const officialTime = d.laps.find(l => l.lap === lapNum)?.lap_time_s ?? null;
    return { code: d.driver, taus, xs, ys, ds, spd, duration: taus[taus.length - 1] ?? 0, officialTime, lapLength: ds[ds.length - 1] ?? 0 };
  });
}

const TICK_MS = 60;
const GRID_S = 0.1; // sim-frame resolution for the live charts

// Elapsed-time clock as m:ss.sss (e.g. 1:14.612), never raw seconds.
function fmtClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = (seconds - m * 60).toFixed(3);
  return `${m}:${s.padStart(6, '0')}`;
}

interface SimFrame { t: number; [key: string]: number | null }

/** Precompute the whole live series: for every 0.1 s of elapsed lap time, each
 * driver's speed and their gap (time + distance) to whoever is currently ahead.
 * The charts render the slice with t ≤ cursor, so they "draw" as the sim plays. */
function buildSimFrames(slices: LapSlice[], maxDur: number): SimFrame[] {
  const frames: SimFrame[] = [];
  for (let t = 0; t <= maxDur + 1e-6; t += GRID_S) {
    const dists = slices.map(s => (t <= s.duration ? lerpAt(s.taus, s.ds, t) : s.lapLength));
    const leadDist = Math.max(...dists);
    const row: SimFrame = { t: Math.round(t * 100) / 100 };
    slices.forEach((s, i) => {
      row[`${s.code}_speed`] = t <= s.duration ? Math.round(lerpAt(s.taus, s.spd, t)) : null;
      // Time to reach the leader's current distance minus now (0 for the leader).
      const tAtLead = lerpAt(s.ds, s.taus, leadDist);
      row[`${s.code}_gap`] = Math.max(0, Math.round((tAtLead - t) * 1000) / 1000);
      row[`${s.code}_dist`] = Math.round(leadDist - dists[i]);
    });
    frames.push(row);
  }
  return frames;
}

export default function LapSimulation({ year, gp, session, segment, drivers: codes, colorOverrides }: Props) {
  const { drivers, loading, error } = useDriverSet(year, gp, session, codes);
  const list = useMemo(() => codes.map(c => drivers[c]).filter((d): d is DriverTelemetry => !!d), [codes, drivers]);

  const [track, setTrack] = useState<TrackData | null>(null);
  const [trackErr, setTrackErr] = useState(false);
  const [lapOverride, setLapOverride] = useState<number | null>(null);

  const [tau, setTau] = useState(0);       // elapsed seconds since all laps started together
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const tauRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    setTrack(null); setTrackErr(false);
    fetch(trackUrl(year, gp, session))
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((t: TrackData) => { if (!cancelled) setTrack(t); })
      .catch(() => { if (!cancelled) setTrackErr(true); });
    return () => { cancelled = true; };
  }, [year, gp, session]);

  const sel = useMemo<LapSelection>(() => (lapOverride != null ? { lap: lapOverride } : segment ? { segment } : 'fastest'), [lapOverride, segment]);
  const lapOptions = useLapOptions(list, segment ?? null);

  const slices = useMemo(() => buildSlices(list, sel), [list, sel]);
  const maxDur = Math.max(0, ...slices.map(s => s.duration));
  const colors = useMemo(() => driverColors(list.map(d => ({ driver: d.driver, team_color: d.team_color })), colorOverrides), [list, colorOverrides]);
  const simFrames = useMemo(() => (slices.length ? buildSimFrames(slices, maxDur) : []), [slices, maxDur]);
  const visibleFrames = useMemo(() => simFrames.filter(f => f.t <= tau + 1e-6), [simFrames, tau]);

  useEffect(() => { tauRef.current = 0; setTau(0); setPlaying(false); }, [codes.join(','), session, sel]);
  useEffect(() => { setLapOverride(null); }, [segment, session, codes.join(',')]);

  // Playback loop — advance elapsed time; the faster lap(s) visibly pull ahead.
  useEffect(() => {
    if (!playing || maxDur === 0) return;
    const id = setInterval(() => {
      tauRef.current += (TICK_MS / 1000) * speed;
      if (tauRef.current >= maxDur) { tauRef.current = maxDur; setTau(maxDur); setPlaying(false); return; }
      setTau(tauRef.current);
    }, TICK_MS);
    return () => clearInterval(id);
  }, [playing, speed, maxDur]);

  const positions: Record<string, CarPosition> = useMemo(() => {
    const out: Record<string, CarPosition> = {};
    for (const s of slices) {
      const t = Math.min(tau, s.duration);
      out[s.code] = { x: lerpAt(s.taus, s.xs, t), y: lerpAt(s.taus, s.ys, t), in_pit: false, lap: 1, distance: lerpAt(s.taus, s.ds, t) };
    }
    return out;
  }, [tau, slices]);

  const raceTrackDrivers = useMemo(() => list.map(d => ({ code: d.driver, color: colors[d.driver] })), [list, colors]);

  if (loading) return <div className="rounded-2xl bg-[#0d0e12] border border-white/5 h-[520px] animate-pulse" />;
  if (error || list.length === 0) return <Panel msg={error ?? 'No data available'} />;
  if (slices.length === 0) return <Panel msg={segment ? `No selected driver has a Q${segment} lap.` : 'Could not resolve a lap for the selected driver(s) in this session.'} />;
  if (trackErr) return <Panel msg="Track outline unavailable — regenerate this session's analysis data." />;

  return (
    <div className="rounded-2xl bg-[#0d0e12] border border-white/5 overflow-hidden">
      {/* header */}
      <div className="flex items-center gap-4 px-5 py-3 border-b border-white/5 flex-wrap">
        {slices.map(s => <Chip key={s.code} color={colors[s.code]} code={s.code} sub={fmtLapTime(s.officialTime ?? s.duration)} />)}
        <div className="ml-auto flex items-center gap-4">
          <div className="text-[11px] font-mono text-gray-400">t <span className="text-white font-bold">{fmtClock(tau)}</span></div>
          <LapSelector value={lapOverride} onChange={setLapOverride} options={lapOptions} segment={segment ?? null} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
        {/* LEFT — track + controls */}
        <div className="flex flex-col">
          <div className="relative aspect-square w-full max-w-[440px] mx-auto bg-[#080808] rounded-xl">
            {track ? (
              <RaceTrack drivers={raceTrackDrivers} positions={positions} trackOutline={track.track_outline} bounds={track.bounds} transitionMs={TICK_MS} showNames />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-600 text-xs font-mono">Loading track…</div>
            )}
          </div>

          <div className="flex items-center gap-4 mt-4">
            <button
              onClick={() => { if (tauRef.current >= maxDur) { tauRef.current = 0; setTau(0); } setPlaying(p => !p); }}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-[#e10600] hover:bg-[#ff1a12] text-white transition-colors shrink-0"
            >
              {playing ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
              )}
            </button>
            <button onClick={() => { tauRef.current = 0; setTau(0); setPlaying(false); }} className="text-xs text-gray-400 hover:text-white font-mono transition-colors shrink-0">restart</button>
            <input type="range" min={0} max={maxDur} step={0.01} value={tau}
              onChange={(e) => { const v = parseFloat(e.target.value); tauRef.current = v; setTau(v); }}
              className="flex-1 accent-[#e10600]" />
            <div className="flex gap-1 shrink-0">
              {[0.5, 1, 2].map(sp => (
                <button key={sp} onClick={() => setSpeed(sp)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold transition-colors ${speed === sp ? 'bg-white/15 text-white' : 'text-gray-500 hover:text-white'}`}>
                  {sp}×
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — live charts that build as the sim plays */}
        <div className="flex flex-col gap-4">
          <ChartCard title="Speed Trace" unit="km/h">
            <ResponsiveContainer width="100%" height={170}>
              <LineChart data={visibleFrames} margin={{ top: 6, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid stroke={GRID} />
                <XAxis dataKey="t" type="number" domain={[0, Math.ceil(maxDur)]} tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} unit="s" allowDataOverflow />
                <YAxis tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} width={38} domain={[0, 'dataMax + 10']} />
                <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: '#aaa' }} labelFormatter={(v) => `${v}s`} />
                {slices.map(s => (
                  <Line key={s.code} type="monotone" dataKey={`${s.code}_speed`} name={s.code} stroke={colors[s.code]} dot={false} strokeWidth={1.8} isAnimationActive={false} connectNulls />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Gap to Leader" unit="seconds behind">
            <ResponsiveContainer width="100%" height={170}>
              <LineChart data={visibleFrames} margin={{ top: 6, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid stroke={GRID} />
                <XAxis dataKey="t" type="number" domain={[0, Math.ceil(maxDur)]} tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} unit="s" allowDataOverflow />
                <YAxis tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} width={38} reversed domain={[0, 'dataMax + 0.2']} tickFormatter={(v) => `${v.toFixed(1)}`} />
                <Tooltip content={<GapTooltip slices={slices} colors={colors} />} />
                <ReferenceLine y={0} stroke="rgba(255,255,255,0.25)" />
                {slices.map(s => (
                  <Line key={s.code} type="monotone" dataKey={`${s.code}_gap`} name={s.code} stroke={colors[s.code]} dot={false} strokeWidth={1.8} isAnimationActive={false} connectNulls />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
    </div>
  );
}

const AXIS = { fill: 'rgba(255,255,255,0.25)', fontSize: 10 } as const;
const GRID = 'rgba(255,255,255,0.06)';
const TOOLTIP_STYLE = { background: 'rgba(10,10,12,0.95)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, fontSize: 12 };

// Gap tooltip shows both the time gap (3 dp) and the distance gap for each driver.
function GapTooltip({ active, payload, label, slices, colors }: any) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload as SimFrame;
  return (
    <div style={TOOLTIP_STYLE as React.CSSProperties} className="px-3 py-2">
      <div className="text-[10px] text-gray-400 font-mono mb-1">{label}s</div>
      {slices.map((s: LapSlice) => {
        const gap = row[`${s.code}_gap`] as number | null;
        const dist = row[`${s.code}_dist`] as number | null;
        if (gap == null) return null;
        return (
          <div key={s.code} className="flex items-center gap-2 text-[11px] font-mono">
            <span className="w-2 h-2 rounded-full" style={{ background: colors[s.code] }} />
            <span className="text-white font-bold w-9">{s.code}</span>
            <span className="text-gray-300">+{gap.toFixed(3)}s</span>
            <span className="text-gray-500">({dist} m)</span>
          </div>
        );
      })}
    </div>
  );
}

function ChartCard({ title, unit, children }: { title: string; unit?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-[#0a0a0c] border border-white/5 p-3">
      <div className="flex items-baseline justify-between mb-1.5">
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-300">{title}</h3>
        {unit && <span className="text-[10px] font-mono text-gray-600">{unit}</span>}
      </div>
      {children}
    </div>
  );
}

function Chip({ color, code, sub }: { color: string; code: string; sub: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
      <span className="text-sm font-black text-white">{code}</span>
      <span className="text-[11px] font-mono text-gray-500">{sub}</span>
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
