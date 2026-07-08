// Types + pure helpers for the Analysis page. Mirrors the per-driver JSON files
// (drivers/{ABBR}.json), the manifest (drivers/index.json), and the session track
// file (track.json) produced by data_scripts/full_race_generator.py.

import { API_BASE } from './f1';

// Standard F1 compound colors (match the convention in Simulator/components/Leaderboard.tsx).
export const TYRE_COLORS: Record<string, string> = {
  SOFT: '#DA291C',
  MEDIUM: '#FFD12E',
  HARD: '#F0F0F0',
  INTERMEDIATE: '#43B02A',
  WET: '#0067AD',
  UNKNOWN: '#8b8b8b',
};

export interface FastestLap {
  lap_number: number | null;
  lap_time_s: number | null;
}

export interface ManifestEntry {
  full_name: string;
  team_color: string;
  status: string | null;
  num_samples: number;
  t_start: number;
  t_end: number;
  fastest_lap: FastestLap | null;
}

export type DriverManifest = Record<string, ManifestEntry>;

export interface LapSummary {
  lap: number | null;
  lap_time_s: number | null;
  compound: string;
  tyre_life: number | null;
  stint: number | null;
  is_accurate: boolean;
  // Classification position after this lap. Only populated for Race/Sprint
  // sessions (FastF1 live-timing data) — null for Quali/Practice.
  position: number | null;
  // Q1/Q2/Q3 segment (1/2/3) for quali sessions, else null.
  segment: number | null;
}

export interface QualiSegments { q1: string | null; q2: string | null; q3: string | null }

export interface SessionLapsEntry {
  full_name: string;
  team_color: string;
  laps: LapSummary[];
  fastest_lap: FastestLap | null;
  quali?: QualiSegments | null;
}
export type SessionLaps = Record<string, SessionLapsEntry>;

export interface DriverTelemetry {
  driver: string;
  full_name: string;
  team_color: string;
  status: string | null;
  sample_interval_ms: number;
  avg_lap_length: number;
  fastest_lap: FastestLap | null;
  laps: LapSummary[];
  t: number[];
  x: number[];
  y: number[];
  lap: number[];
  dist: number[];
  cumulative_distance: number[];
  compound: string[];
  tyre_life: number[];
  in_pit: boolean[];
  speed: number[];
  gear: number[];
  throttle: number[];
  brake: boolean[];
  rpm: number[];
  drs: boolean[];
}

export interface TrackPoint { x: number; y: number }
export interface Bounds { x_min: number; x_max: number; y_min: number; y_max: number }
export interface TrackCorner { number: number; distance: number }
export interface TrackData {
  session: string;
  track_outline: TrackPoint[];
  bounds: Bounds;
  avg_lap_length: number;
  total_laps: number | null;
  corners: TrackCorner[];
}

// ── endpoints ────────────────────────────────────────────────────────────────
const base = (year: string, gp: string, session: string) =>
  `${API_BASE}/api/races/data/${year}/${encodeURIComponent(gp)}/${session}`;

export const driversManifestUrl = (y: string, g: string, s: string) => `${base(y, g, s)}/drivers`;
export const driverDataUrl = (y: string, g: string, s: string, abbr: string) => `${base(y, g, s)}/drivers/${abbr}`;
export const trackUrl = (y: string, g: string, s: string) => `${base(y, g, s)}/track`;
export const lapsUrl = (y: string, g: string, s: string) => `${base(y, g, s)}/laps`;

// ── formatting ───────────────────────────────────────────────────────────────

/** m:ss.sss (or ss.sss under a minute). Use everywhere a lap time is displayed —
 * never show raw seconds. */
export function fmtLapTime(seconds?: number | null): string {
  if (seconds == null) return '—';
  const m = Math.floor(seconds / 60);
  const sec = (seconds - m * 60).toFixed(3);
  return m > 0 ? `${m}:${sec.padStart(6, '0')}` : sec;
}

// ── multi-driver color palette ───────────────────────────────────────────────

// Fallback palette for when two selected drivers share a team color (e.g.
// teammates) — assigned in order so each driver always renders as a distinct line.
const PALETTE = ['#e10600', '#00e1ff', '#ffd12e', '#43b02a', '#a855f7', '#fb923c', '#38bdf8', '#f472b6', '#84cc16', '#f87171'];

/** Guarantees every driver gets a visually distinct color, even teammates who
 * share a `team_color`. Use for track dots / dominance advantage colors, where
 * a dash pattern can't distinguish overlapping marks. `overrides` (driver code
 * -> hex color) takes precedence over the team color when the user has
 * manually picked a color for that driver. */
export function driverColors(drivers: { driver: string; team_color: string }[], overrides?: Record<string, string>): Record<string, string> {
  const used = new Set<string>();
  const colors: Record<string, string> = {};
  let paletteIdx = 0;
  for (const d of drivers) {
    let color = overrides?.[d.driver] ?? d.team_color;
    if (used.has(color.toLowerCase())) {
      while (used.has(PALETTE[paletteIdx % PALETTE.length].toLowerCase())) paletteIdx++;
      color = PALETTE[paletteIdx % PALETTE.length];
      paletteIdx++;
    }
    used.add(color.toLowerCase());
    colors[d.driver] = color;
  }
  return colors;
}

export interface DriverStyle { color: string; dash: string }
// Solid, dashed, dotted, dash-dot — enough to distinguish 4 same-team cars.
const DASH_PATTERNS = ['', '7 5', '2 4', '10 4 2 4'];

/** Keeps each driver's real TEAM color (or their manual `overrides` pick) but
 * gives teammates who still share a color a different line dash (solid vs
 * dashed vs dotted) — the F1Analytics convention, so overlapping same-color
 * lines stay distinguishable on the telemetry/lap-time/position charts.
 * Returns a `dash` string for SVG `strokeDasharray`. */
export function driverStyles(drivers: { driver: string; team_color: string }[], overrides?: Record<string, string>): Record<string, DriverStyle> {
  const seen: Record<string, number> = {};
  const out: Record<string, DriverStyle> = {};
  for (const d of drivers) {
    const color = overrides?.[d.driver] ?? d.team_color;
    const key = color.toLowerCase();
    const n = seen[key] ?? 0;
    seen[key] = n + 1;
    out[d.driver] = { color, dash: DASH_PATTERNS[n % DASH_PATTERNS.length] };
  }
  return out;
}

// ── slicing helpers ──────────────────────────────────────────────────────────

export interface LapRange { start: number; end: number }

// Real telemetry occasionally has a corrupted final sample right at a lap
// boundary — the Distance channel jumps backward by hundreds/thousands of
// meters on the very last sample of a lap (seen in real data: climbs cleanly
// to 99% of the lap, then the last point alone drops ~1400m). Every helper in
// this file assumes distance is non-decreasing within a lap range (binary
// search in `interp`, sector/gap math, etc.), so a single bad tail sample
// silently truncates comparisons to a fraction of the real lap. Small forward
// jitter (a sample or two of noise) is tolerated; a real drop stops the range.
const DIST_MONOTONIC_TOLERANCE_M = 2;

/** Index range [start, end) of a specific lap within a driver's sample arrays,
 * truncated at the first point (if any) where distance stops increasing. */
export function lapRange(d: DriverTelemetry, lapNumber: number): LapRange | null {
  let start = -1;
  let end = -1;
  let maxDist = -Infinity;
  for (let i = 0; i < d.lap.length; i++) {
    if (d.lap[i] === lapNumber) {
      if (start === -1) { start = i; maxDist = d.dist[i]; end = i + 1; continue; }
      if (d.dist[i] < maxDist - DIST_MONOTONIC_TOLERANCE_M) break; // corrupted tail — stop here
      maxDist = Math.max(maxDist, d.dist[i]);
      end = i + 1;
    } else if (start !== -1) {
      break; // lap samples are contiguous — stop at the first sample past the lap
    }
  }
  return start === -1 ? null : { start, end };
}

/** Index range of a driver's fastest lap overall. */
export function fastestLapRange(d: DriverTelemetry): LapRange | null {
  const lapNum = d.fastest_lap?.lap_number;
  return lapNum == null ? null : lapRange(d, lapNum);
}

/** The driver's fastest lap NUMBER within a given Q1/Q2/Q3 segment (or null). */
export function fastestLapInSegment(d: DriverTelemetry, segment: number): number | null {
  let best: LapSummary | null = null;
  for (const l of d.laps) {
    if (l.segment !== segment || l.lap_time_s == null || l.lap == null) continue;
    if (!best || l.lap_time_s < best.lap_time_s!) best = l;
  }
  return best?.lap ?? null;
}

// How a view should pick which lap of each driver to analyse:
//  - 'fastest'  → overall fastest lap (default)
//  - {segment}  → fastest lap within that Q1/Q2/Q3 segment
//  - {lap}      → that exact lap number (same lap for every driver, e.g. race lap 30)
export type LapSelection = 'fastest' | { segment: number } | { lap: number };

/** Resolve a LapSelection to a driver's telemetry index range (or null if that
 * driver has no such lap — e.g. knocked out in Q1 so has no Q3 lap). */
export function resolveLapRange(d: DriverTelemetry, sel: LapSelection): LapRange | null {
  if (sel === 'fastest') return fastestLapRange(d);
  if ('lap' in sel) return lapRange(d, sel.lap);
  const n = fastestLapInSegment(d, sel.segment);
  return n == null ? null : lapRange(d, n);
}

/** The actual lap number + official (FastF1) lap time for a given selection —
 * for display headers. Differs from `d.fastest_lap` whenever a Q1/Q2/Q3 segment
 * or explicit lap override is active (that field is always the session-wide
 * fastest lap, regardless of what's actually being visualized). */
export function selectedLapInfo(d: DriverTelemetry, sel: LapSelection): { lapNumber: number; timeS: number | null } | null {
  const r = resolveLapRange(d, sel);
  if (!r) return null;
  const lapNumber = d.lap[r.start];
  const timeS = d.laps.find(l => l.lap === lapNumber)?.lap_time_s ?? null;
  return { lapNumber, timeS };
}

/** Linear interpolation of `ys` (aligned to monotonic `xs`) at target x. Clamps to ends. */
export function lerpAt(xs: number[], ys: number[], x: number): number {
  return interp(xs, ys, x);
}

function interp(xs: number[], ys: number[], x: number): number {
  const n = xs.length;
  if (n === 0) return NaN;
  if (x <= xs[0]) return ys[0];
  if (x >= xs[n - 1]) return ys[n - 1];
  // binary search for the bracketing interval
  let lo = 0, hi = n - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (xs[mid] <= x) lo = mid; else hi = mid;
  }
  const span = xs[hi] - xs[lo];
  if (span === 0) return ys[lo];
  const frac = (x - xs[lo]) / span;
  return ys[lo] + frac * (ys[hi] - ys[lo]);
}

/** A driver's fastest-lap channel series as {dist, value} (dist reset to start at 0). */
function lapChannel(d: DriverTelemetry, range: { start: number; end: number }, channel: 'speed' | 'throttle' | 'brake' | 'gear' | 'rpm' | 'drs') {
  const dist0 = d.dist[range.start];
  const xs: number[] = [];
  const ys: number[] = [];
  const isBoolChannel = channel === 'brake' || channel === 'drs';
  for (let i = range.start; i < range.end; i++) {
    xs.push(d.dist[i] - dist0);
    const raw = d[channel][i];
    ys.push(isBoolChannel ? (raw ? 100 : 0) : (raw as number));
  }
  return { xs, ys, maxDist: xs[xs.length - 1] ?? 0 };
}

export interface ComparisonPoint {
  distance: number;
  a_speed: number; b_speed: number;
  a_throttle: number; b_throttle: number;
  a_brake: number; b_brake: number;
  speed_delta: number; // a - b (positive = driver A faster here)
}

/** Resample two drivers' selected laps onto a shared in-lap distance grid for charting. */
export function buildComparisonGrid(a: DriverTelemetry, b: DriverTelemetry, sel: LapSelection = 'fastest', stepMeters = 1): ComparisonPoint[] {
  const ra = resolveLapRange(a, sel);
  const rb = resolveLapRange(b, sel);
  if (!ra || !rb) return [];

  const aS = lapChannel(a, ra, 'speed'), bS = lapChannel(b, rb, 'speed');
  const aT = lapChannel(a, ra, 'throttle'), bT = lapChannel(b, rb, 'throttle');
  const aB = lapChannel(a, ra, 'brake'), bB = lapChannel(b, rb, 'brake');

  const maxDist = Math.min(aS.maxDist, bS.maxDist);
  const points: ComparisonPoint[] = [];
  for (let dcur = 0; dcur <= maxDist; dcur += stepMeters) {
    const a_speed = interp(aS.xs, aS.ys, dcur);
    const b_speed = interp(bS.xs, bS.ys, dcur);
    points.push({
      distance: Math.round(dcur),
      a_speed: Math.round(a_speed),
      b_speed: Math.round(b_speed),
      a_throttle: Math.round(interp(aT.xs, aT.ys, dcur)),
      b_throttle: Math.round(interp(bT.xs, bT.ys, dcur)),
      a_brake: Math.round(interp(aB.xs, aB.ys, dcur)),
      b_brake: Math.round(interp(bB.xs, bB.ys, dcur)),
      speed_delta: Math.round(a_speed - b_speed),
    });
  }
  return points;
}

export interface MultiSeriesPoint {
  distance: number;
  [key: string]: number; // `${driverCode}_speed` / `_throttle` / `_brake` / `_gear` / `_rpm`
}

/** Resample N drivers' fastest laps onto a shared in-lap distance grid, one row
 * per distance step with each driver's channels keyed by `${code}_speed` etc —
 * the shape Recharts needs to draw one line per driver from a single dataset. */
export function buildMultiSeriesGrid(drivers: DriverTelemetry[], sel: LapSelection = 'fastest', stepMeters = 1): MultiSeriesPoint[] {
  const channels = drivers
    .map(d => {
      const r = resolveLapRange(d, sel);
      if (!r) return null;
      return {
        code: d.driver,
        speed: lapChannel(d, r, 'speed'),
        throttle: lapChannel(d, r, 'throttle'),
        brake: lapChannel(d, r, 'brake'),
        gear: lapChannel(d, r, 'gear'),
        rpm: lapChannel(d, r, 'rpm'),
        drs: lapChannel(d, r, 'drs'),
      };
    })
    .filter((c): c is NonNullable<typeof c> => c !== null);

  if (channels.length === 0) return [];
  const maxDist = Math.min(...channels.map(c => c.speed.maxDist));

  const points: MultiSeriesPoint[] = [];
  for (let dcur = 0; dcur <= maxDist; dcur += stepMeters) {
    const point: MultiSeriesPoint = { distance: Math.round(dcur) };
    for (const c of channels) {
      point[`${c.code}_speed`] = Math.round(interp(c.speed.xs, c.speed.ys, dcur));
      point[`${c.code}_throttle`] = Math.round(interp(c.throttle.xs, c.throttle.ys, dcur));
      point[`${c.code}_brake`] = Math.round(interp(c.brake.xs, c.brake.ys, dcur));
      // Gear is a stepped/held value (no partial gears) — round to the nearest
      // whole gear instead of smoothing across the interpolation step.
      point[`${c.code}_gear`] = Math.round(interp(c.gear.xs, c.gear.ys, dcur));
      point[`${c.code}_rpm`] = Math.round(interp(c.rpm.xs, c.rpm.ys, dcur));
      point[`${c.code}_drs`] = Math.round(interp(c.drs.xs, c.drs.ys, dcur));
    }
    points.push(point);
  }
  return points;
}

export interface DominanceSector {
  index: number;          // 1-based mini-sector number, for display ("Sector 11")
  points: TrackPoint[];    // real x/y sub-points spanning this sector (for the path)
  winner: 'a' | 'b';       // always a strict winner — no "even" category
  timeA: number;           // seconds A took to cross this sector
  timeB: number;
  gap: number;             // |timeA - timeB|, seconds
}

export interface SectorDominance {
  lapA: number | null;     // actual lap number used for driver A (may differ if a Q1/Q2/Q3
  lapB: number | null;     // segment or explicit lap override was requested)
  sectors: DominanceSector[];
}

const SECTOR_SUBPOINTS = 8;    // interpolated points per sector, for a smooth curve

/** Track dominance as real F1 broadcasts show it: split the lap into N mini-sectors
 * and compare each driver's ELAPSED TIME across that sector (not instantaneous
 * speed) — this is what produces clean color bands instead of noisy point-level
 * flicker, and is exactly what a "Sector N: A 3.620s / B 3.705s +0.085s" tooltip
 * needs. Positions come from driver A's own real x/y telemetry (same coordinate
 * space as the track bounds), so no unit conversion is needed. */
export function buildSectorDominance(a: DriverTelemetry, b: DriverTelemetry, sel: LapSelection = 'fastest', numSectors = 24): SectorDominance {
  const ra = resolveLapRange(a, sel);
  const rb = resolveLapRange(b, sel);
  if (!ra || !rb) return { lapA: null, lapB: null, sectors: [] };

  const aDist0 = a.dist[ra.start], aT0 = a.t[ra.start];
  const bDist0 = b.dist[rb.start], bT0 = b.t[rb.start];

  const aDs: number[] = [], aTs: number[] = [], aXs: number[] = [], aYs: number[] = [];
  for (let i = ra.start; i < ra.end; i++) {
    aDs.push(a.dist[i] - aDist0); aTs.push(a.t[i] - aT0); aXs.push(a.x[i]); aYs.push(a.y[i]);
  }
  const bDs: number[] = [], bTs: number[] = [];
  for (let i = rb.start; i < rb.end; i++) { bDs.push(b.dist[i] - bDist0); bTs.push(b.t[i] - bT0); }

  const maxDist = Math.min(aDs[aDs.length - 1], bDs[bDs.length - 1]);
  const sectorLen = maxDist / numSectors;

  const sectors: DominanceSector[] = [];
  for (let s = 0; s < numSectors; s++) {
    const d0 = s * sectorLen, d1 = (s + 1) * sectorLen;
    const timeA = interp(aDs, aTs, d1) - interp(aDs, aTs, d0);
    const timeB = interp(bDs, bTs, d1) - interp(bDs, bTs, d0);
    const gap = Math.abs(timeA - timeB);
    // Always a strict winner — even a thousandth of a second (or less) dominates.
    const winner: DominanceSector['winner'] = timeA <= timeB ? 'a' : 'b';

    const points: TrackPoint[] = [];
    for (let k = 0; k <= SECTOR_SUBPOINTS; k++) {
      const d = d0 + (d1 - d0) * (k / SECTOR_SUBPOINTS);
      points.push({ x: interp(aDs, aXs, d), y: interp(aDs, aYs, d) });
    }
    sectors.push({ index: s + 1, points, winner, timeA, timeB, gap });
  }

  return { lapA: a.lap[ra.start], lapB: b.lap[rb.start], sectors };
}

/** Interpolated (x, y) of a driver at a given in-lap distance during their fastest lap. */
export function xyAtLapDistance(d: DriverTelemetry, range: { start: number; end: number }, lapDist: number): { x: number; y: number } {
  const dist0 = d.dist[range.start];
  const xs: number[] = [];
  const xv: number[] = [];
  const yv: number[] = [];
  for (let i = range.start; i < range.end; i++) {
    xs.push(d.dist[i] - dist0);
    xv.push(d.x[i]);
    yv.push(d.y[i]);
  }
  return { x: interp(xs, xv, lapDist), y: interp(xs, yv, lapDist) };
}

// ── driving-state strip (Full Throttle / Clipping / Lift & Coast / Brake / Cornering) ──

export type DrivingState = 'full_throttle' | 'clipping' | 'lift_coast' | 'brake' | 'cornering';

export interface DrivingStateSegment {
  state: DrivingState;
  startDist: number; // in-lap distance, meters, 0 = lap start
  endDist: number;
}

const FULL_THROTTLE_MIN_PCT = 99;  // >=99% throttle counts as wide-open
const OFF_THROTTLE_MAX_PCT = 5;    // <=5% throttle counts as fully lifted
// A brief partial-throttle blip shorter than this is a quick "clipping" lift at a
// fast kink/chicane apex; anything longer is sustained cornering. There's no
// steering-angle channel available to detect corners directly, so run-length on
// the throttle trace is the proxy — matches how these tools visually read anyway
// (a clip is a flick, cornering is a sustained partial-throttle phase).
const CLIPPING_MAX_RUN_M = 40;
// Telemetry samples every ~300ms, and the raw signal occasionally flickers for
// exactly one sample right at a threshold boundary (e.g. throttle reads 98% for
// a single 300ms tick between two long 100% runs) — confirmed on real data.
// Left alone, each of those becomes its own visible "tick" in the strip that a
// human wouldn't call a real driving-state change. Any run shorter than this
// gets absorbed into whichever state was already in progress rather than
// treated as a genuine transition.
const NOISE_FLOOR_M = 8;
// How far from a *known* corner (real FastF1 circuit-info position, not
// inferred) a partial-throttle run can be while still counting as
// corner-related at all. FastF1 doesn't expose a steering-angle channel, so
// there's no direct way to detect "the car is turning" — but real corner
// positions are known, so a partial-throttle lift can at least be checked
// against "is this near an actual corner" before deciding clip vs. cornering,
// instead of purely guessing off throttle-run duration. A lift found well
// away from any corner is far more likely a gearshift blip or a genuine
// lift-and-coast on a straight than real cornering.
const CORNER_PROXIMITY_M = 150;

function isNearCorner(distance: number, corners: TrackCorner[], avgLapLength: number): boolean {
  if (corners.length === 0 || avgLapLength <= 0) return true; // no corner data — don't over-filter, fall back to duration-only
  for (const c of corners) {
    const direct = Math.abs(c.distance - distance);
    if (Math.min(direct, avgLapLength - direct) <= CORNER_PROXIMITY_M) return true;
  }
  return false;
}

/** Classifies every sample of a driver's selected lap into a driving state, then
 * run-length-encodes into distance segments for a track-state strip chart (brake
 * always wins as the least ambiguous signal; among throttle states, a
 * partial-throttle run only counts as clipping/cornering if it's actually near
 * a real corner — otherwise it's treated as a lift-and-coast — and among
 * corner-adjacent runs, a short one is "clipping", a longer one "cornering"). */
export function buildDrivingStateStrip(
  d: DriverTelemetry, sel: LapSelection = 'fastest',
  corners: TrackCorner[] = [], avgLapLength = 0,
): DrivingStateSegment[] {
  const r = resolveLapRange(d, sel);
  if (!r) return [];

  type RawState = 'full' | 'partial' | 'off' | 'brake';
  const dist0 = d.dist[r.start];
  const raw: { state: RawState; dist: number }[] = [];
  for (let i = r.start; i < r.end; i++) {
    const dist = d.dist[i] - dist0;
    let state: RawState;
    if (d.brake[i]) state = 'brake';
    else if (d.throttle[i] >= FULL_THROTTLE_MIN_PCT) state = 'full';
    else if (d.throttle[i] <= OFF_THROTTLE_MAX_PCT) state = 'off';
    else state = 'partial';
    raw.push({ state, dist });
  }
  if (raw.length === 0) return [];

  interface Run { state: RawState; startDist: number; endDist: number }
  const rawRuns: Run[] = [];
  for (const p of raw) {
    const last = rawRuns[rawRuns.length - 1];
    if (last && last.state === p.state) last.endDist = p.dist;
    else rawRuns.push({ state: p.state, startDist: p.dist, endDist: p.dist });
  }

  // Noise floor: fold any run shorter than NOISE_FLOOR_M into whichever state
  // was already running — a single noisy sample doesn't get to start (or end)
  // a "real" segment. Building a fresh array (rather than mutating rawRuns
  // in place) keeps the merge logic a straightforward single pass.
  const runs: Run[] = [];
  for (const run of rawRuns) {
    const prev = runs[runs.length - 1];
    if (prev && run.endDist - run.startDist < NOISE_FLOOR_M) {
      prev.endDist = run.endDist;
      continue;
    }
    runs.push({ ...run });
  }

  const segments = runs.map((run): DrivingStateSegment => {
    let state: DrivingState;
    if (run.state === 'brake') state = 'brake';
    else if (run.state === 'full') state = 'full_throttle';
    else if (run.state === 'off') state = 'lift_coast';
    else {
      const midDist = (run.startDist + run.endDist) / 2;
      if (!isNearCorner(midDist, corners, avgLapLength)) {
        // A partial-throttle lift nowhere near a real corner isn't cornering —
        // most likely a gearshift blip or a genuine lift-and-coast on a straight.
        state = 'lift_coast';
      } else {
        // Classified on the run's own measured span, before the gap-closing pass
        // below stretches endDist for rendering — otherwise a genuinely brief
        // clip right at a state boundary could get miscounted as longer than
        // it was.
        state = (run.endDist - run.startDist) <= CLIPPING_MAX_RUN_M ? 'clipping' : 'cornering';
      }
    }
    return { state, startDist: run.startDist, endDist: run.endDist };
  });

  // Telemetry is sampled at discrete points (~every 15-25m at race speed), so a
  // run's own last sample always falls a bit short of where the state actually
  // changed — left as-is, every segment renders with a visible gap before the
  // next one starts. Stretch each segment's end to the next one's start so the
  // strip tiles with no gaps (the real transition point is somewhere in that
  // span; splitting it evenly would be more "correct" but visually identical
  // at this resolution, so this simpler rule is enough).
  for (let i = 0; i < segments.length - 1; i++) {
    segments[i].endDist = segments[i + 1].startDist;
  }

  return segments;
}

// ── stint / tyre helpers ─────────────────────────────────────────────────────

export interface Stint {
  stint: number;
  compound: string;
  startLap: number;
  endLap: number;
  laps: number;
}

/** Contiguous stints from a driver's lap table (grouped by the `stint` field).
 *  Takes the raw lap array directly (not a full DriverTelemetry) since this is
 *  the one field both DriverTelemetry and the lighter session-wide SessionLapsEntry share. */
export function deriveStints(laps: LapSummary[]): Stint[] {
  const out: Stint[] = [];
  for (const l of laps) {
    if (l.lap == null) continue;
    const last = out[out.length - 1];
    if (last && l.stint === last.stint) {
      last.endLap = l.lap;
      last.laps += 1;
    } else {
      out.push({ stint: l.stint ?? out.length + 1, compound: l.compound, startLap: l.lap, endLap: l.lap, laps: 1 });
    }
  }
  return out;
}

/** Degradation points (tyre age vs lap time) per driver, accurate laps only. */
export function degradationSeries(d: DriverTelemetry): { tyre_life: number; lap_time_s: number; compound: string; stint: number | null }[] {
  return d.laps
    .filter(l => l.is_accurate && l.lap_time_s != null && l.tyre_life != null)
    .map(l => ({ tyre_life: l.tyre_life!, lap_time_s: l.lap_time_s!, compound: l.compound, stint: l.stint }));
}
