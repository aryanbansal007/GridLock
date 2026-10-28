// The landing page's product previews render a real, historical session rather than
// invented numbers. snapshot.json is extracted from the generated race files by
// data_scripts/landing_snapshot.py (2026 Italian Grand Prix, Race): a rotated track
// outline, two drivers' fastest laps on a shared distance axis, one lap of real car
// positions, tyre stints, lap times and per-lap track status. ~40 KB, bundled, so the
// page never depends on a network request to show what the product does.
import raw from './snapshot.json';

export interface Snapshot {
  session: {
    year: number; round: number; name: string; session: string; total_laps: number;
    lap_length_m: number; winner: string;
    fastest_lap: { abbreviation: string; lap_time: string; lap_number: number };
  };
  view: { w: number; h: number };
  outline: [number, number][];
  compare: {
    a: CompareDriver; b: CompareDriver;
    dist: number[];
    speedA: number[]; speedB: number[];
    throttleA: number[]; throttleB: number[];
    brakeA: number[]; brakeB: number[];
    gearA: number[];
    delta: number[];
    brakeZones: { d: number; v: number }[];
    states: { s: DrivingState; from: number; to: number }[];
    path: number[];
    dominance: { from: number; to: number; faster: string; gain: number }[];
  };
  replay: {
    t0: number; step: number; lap: number;
    cars: { code: string; color: string; compound: string; xy: number[]; cd: number[] }[];
  };
  weather: { air_temp: number; track_temp: number; humidity: number; wind_speed: number };
  strategy: {
    code: string; pos: number; grid: number | null; color: string;
    stints: { c: string; from: number; to: number }[];
  }[];
  lapTimes: Record<string, [number, number | null][]>;
  lapStatus: string[];
}

export interface CompareDriver {
  code: string; lap: number; lap_time: number; color: string; name: string;
}

export type DrivingState = 'full' | 'partial' | 'coast' | 'brake';

export const SNAP = raw as unknown as Snapshot;

export const SESSION_LABEL = `${SNAP.session.year} ${SNAP.session.name} · ${SNAP.session.session}`;

// Two Mercedes drivers share a team colour, so driver B is told apart by line style and a
// neutral tone rather than a second team colour.
export const COLOR_A = SNAP.compare.a.color;
export const COLOR_B = '#E8E8EA';

export const PALETTE = {
  bg: '#050505',
  surface: '#0B0D10',
  surface2: '#111318',
  red: '#E10600',
  redBright: '#FF2D24',
  text: '#F5F5F5',
  muted: '#969BA5',
  border: '#24262B',
};

export const COMPOUND: Record<string, { color: string; letter: string }> = {
  SOFT: { color: '#E10600', letter: 'S' },
  MEDIUM: { color: '#F5C400', letter: 'M' },
  HARD: { color: '#E8E8EA', letter: 'H' },
  INTERMEDIATE: { color: '#2EB84B', letter: 'I' },
  WET: { color: '#2F7FD6', letter: 'W' },
};

export const STATE_META: Record<DrivingState, { label: string; color: string }> = {
  full: { label: 'Full throttle', color: '#2EB84B' },
  partial: { label: 'Partial throttle', color: '#F5C400' },
  coast: { label: 'Lift / coast', color: '#6B7280' },
  brake: { label: 'Braking', color: '#E10600' },
};

export const STATUS_META: Record<string, { label: string; color: string }> = {
  clear: { label: 'Green', color: '#1F2937' },
  yellow: { label: 'Yellow', color: '#CA8A04' },
  vsc: { label: 'VSC', color: '#D97706' },
  vsc_ending: { label: 'VSC', color: '#D97706' },
  safety_car: { label: 'Safety car', color: '#F59E0B' },
  red: { label: 'Red flag', color: '#E10600' },
};

export const fmtLap = (s: number) => {
  const m = Math.floor(s / 60);
  return `${m}:${(s - m * 60).toFixed(3).padStart(6, '0')}`;
};

/** Polyline "d" for points already in view space. */
export const pathD = (pts: [number, number][], close = false) =>
  pts.length
    ? `M${pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L')}${close ? 'Z' : ''}`
    : '';

/** Map a series onto a chart box: x by index (or given xs), y scaled to [min, max]. */
export const seriesD = (
  ys: number[], w: number, h: number, min: number, max: number, xs?: number[], xMax?: number,
) => {
  const n = ys.length;
  const span = max - min || 1;
  const pts: [number, number][] = ys.map((y, i) => [
    xs && xMax ? (xs[i] / xMax) * w : (i / (n - 1)) * w,
    h - ((Math.min(Math.max(y, min), max) - min) / span) * h,
  ]);
  return pathD(pts);
};

/** Share of driver A's fastest-lap distance spent in each driving state. */
export function stateShares() {
  const states = SNAP.compare.states;
  const lap = SNAP.compare.dist[SNAP.compare.dist.length - 1];
  const totals: Record<DrivingState, number> = { full: 0, partial: 0, coast: 0, brake: 0 };
  states.forEach((s, i) => {
    totals[s.s] += (states[i + 1] ? states[i + 1].from : lap) - s.from;
  });
  return Object.fromEntries(Object.entries(totals).map(([k, v]) => [k, v / lap])) as Record<DrivingState, number>;
}
