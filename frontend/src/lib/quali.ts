export interface QualiLap {
  segment: number;
  start: number;
  end: number;
  time: number;
  deleted: boolean;
  in_lap: boolean;
  /** S1/S2/S3 durations; null when OpenF1 has no full set for the lap. */
  sectors: number[] | null;
}
export interface QualiSegment {
  name: string;
  start: number;
  clock_end: number;
  end: number;
}
export interface QualiData {
  session: string;
  segments: QualiSegment[];
  /** Track coordinates where sectors 1 and 2 end. */
  sector_marks?: { x: number; y: number }[];
  drivers: Record<string, { laps: QualiLap[]; official: (number | null)[]; out_in: number | null; position: number | null }>;
}

export type QualiPhase = "before" | "running" | "break" | "done";

export interface QualiRow {
  code: string;
  rank: number;
  time: number | null;
  gap: number | null;
  /** ok: safe or not decided yet · danger: currently in the drop zone · out: knocked out in this segment · gone: knocked out earlier */
  state: "ok" | "danger" | "out" | "gone";
  outIn: number | null;
}
export interface QualiState {
  segIdx: number;
  phase: QualiPhase;
  rows: QualiRow[];
  /** Seconds left on the segment clock (running) or until the next segment starts (break). */
  countdown: number | null;
  advancing: number;
}

export const formatLap = (s: number) => {
  const m = Math.floor(s / 60);
  return m ? `${m}:${(s - m * 60).toFixed(3).padStart(6, "0")}` : s.toFixed(3);
};

export const formatClock = (s: number) => {
  const t = Math.max(0, Math.round(s));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
};

/** The running order at session time `t`: each driver's best valid lap so far in the
 *  current segment, with the cars that are about to drop (or already have) marked. */
export function qualiStateAt(q: QualiData, t: number): QualiState {
  const segs = q.segments;
  let segIdx = 0;
  segs.forEach((s, i) => { if (t >= s.start - 5) segIdx = i; });
  const seg = segs[segIdx];
  const phase: QualiPhase =
    t < seg.start - 5 ? "before"
    : t <= seg.end ? "running"
    : segIdx < segs.length - 1 ? "break" : "done";
  const settled = phase === "break" || phase === "done";
  const last = segIdx === segs.length - 1;

  const entries = Object.entries(q.drivers);
  // Slow laps (warm-ups, in-laps through traffic) aren't timed attempts: only laps inside
  // the 107% window count while the order builds up.
  const fastest = Math.min(...entries.flatMap(([, d]) => d.official.filter((x): x is number => x != null)));
  const timeOf = (code: string, i: number, at: number | null) => {
    const d = q.drivers[code];
    // Once a segment is over the official time is the truth (it also accounts for laps
    // the stewards deleted); while it runs, the best valid lap completed so far.
    if (at === null) return d.official[i] ?? null;
    let best: number | null = null;
    for (const lap of d.laps) {
      if (lap.segment === i + 1 && !lap.deleted && lap.time <= fastest * 1.07 && lap.end <= at && (best === null || lap.time < best)) best = lap.time;
    }
    return best;
  };
  const taken = (code: string, i: number) =>
    q.drivers[code].official[i] != null || q.drivers[code].laps.some((l) => l.segment === i + 1);

  const inSeg = entries.map(([c]) => c).filter((c) => {
    const d = q.drivers[c];
    return d.position != null ? d.out_in == null || d.out_in >= segIdx + 1 : taken(c, segIdx);
  });
  const timed = (c: string) => (settled ? timeOf(c, segIdx, null) ?? timeOf(c, segIdx, t) : timeOf(c, segIdx, t));
  const times = new Map(inSeg.map((c) => [c, timed(c)]));
  const prevTime = (c: string) => (segIdx > 0 ? q.drivers[c].official[segIdx - 1] ?? 1e9 : 0);

  const ranked = [...inSeg].sort((a, b) => {
    const ta = times.get(a), tb = times.get(b);
    if (ta != null && tb != null) return ta - tb;
    if (ta != null) return -1;
    if (tb != null) return 1;
    return prevTime(a) - prevTime(b) || a.localeCompare(b);
  });
  const gone = entries
    .map(([c]) => c)
    .filter((c) => !inSeg.includes(c))
    .sort((a, b) => (q.drivers[a].position ?? 99) - (q.drivers[b].position ?? 99));

  const advancing = last ? 0 : inSeg.filter((c) => q.drivers[c].out_in == null || q.drivers[c].out_in! > segIdx + 1).length;
  const lead = times.get(ranked[0]) ?? null;

  const rows: QualiRow[] = ranked.map((code, i) => {
    const time = times.get(code) ?? null;
    const dropping = advancing > 0 && i >= advancing;
    return {
      code,
      rank: i + 1,
      time,
      gap: time != null && lead != null && i > 0 ? time - lead : null,
      state: dropping ? (settled ? "out" : "danger") : "ok",
      outIn: q.drivers[code].out_in,
    };
  });
  gone.forEach((code, i) => rows.push({
    code, rank: ranked.length + i + 1, time: null, gap: null, state: "gone", outIn: q.drivers[code].out_in,
  }));

  const countdown =
    phase === "running" ? seg.clock_end - t
    : phase === "break" ? segs[segIdx + 1].start - t
    : null;
  return { segIdx, phase, rows, countdown, advancing };
}

export type SectorTone = "purple" | "green" | "yellow" | "pending";

/** Colour of each sector on a driver's current push lap, as on the timing screens:
 *  purple = fastest anyone has set so far, green = the driver's own best, yellow = slower. */
export function sectorChipsAt(q: QualiData, t: number): Record<string, SectorTone[]> {
  const SHOW_AFTER_S = 6;
  const all = Object.values(q.drivers);
  const fastest = Math.min(...all.flatMap((d) => d.official.filter((x): x is number => x != null)));
  const isPush = (l: QualiLap) => !!l.sectors && l.time <= fastest * 1.05;
  const cum = (l: QualiLap) => {
    const c: number[] = [];
    let a = l.start;
    for (const s of l.sectors ?? []) { a += s; c.push(a); }
    return c;
  };

  const best = [Infinity, Infinity, Infinity];
  const personal: Record<string, number[]> = {};
  for (const [code, d] of Object.entries(q.drivers)) {
    personal[code] = [Infinity, Infinity, Infinity];
    for (const l of d.laps) {
      if (!isPush(l)) continue;
      cum(l).forEach((end, i) => {
        if (end > t) return;
        const s = l.sectors![i];
        if (s < best[i]) best[i] = s;
        if (s < personal[code][i]) personal[code][i] = s;
      });
    }
  }

  const out: Record<string, SectorTone[]> = {};
  for (const [code, d] of Object.entries(q.drivers)) {
    const lap = d.laps.find((l) => isPush(l) && t >= l.start && t <= l.end + SHOW_AFTER_S);
    if (!lap) continue;
    const ends = cum(lap);
    out[code] = ends.map((end, i) => {
      if (end > t) return "pending";
      const s = lap.sectors![i];
      return s <= best[i] + 1e-9 ? "purple" : s <= personal[code][i] + 1e-9 ? "green" : "yellow";
    });
  }
  return out;
}

export interface SectorReading {
  /** null while the car is still in the sector. */
  time: number | null;
  tone: SectorTone;
  /** Against the driver's own best before this lap (negative = quicker). */
  delta: number | null;
}
export interface DriverTiming {
  push: boolean;
  elapsed: number;
  sectors: SectorReading[];
  /** Set once the lap is complete. */
  lapTime: number | null;
  lapTone: SectorTone | "deleted" | null;
  recent: { segment: number; time: number; deleted: boolean; personalBest: boolean }[];
}

/** What the timing screen shows for one driver at time `t`: the lap in progress (running
 *  clock, sector times and their colours) and the laps they have completed. */
export function driverTimingAt(q: QualiData, code: string, t: number): DriverTiming | null {
  const d = q.drivers[code];
  if (!d) return null;
  const fastest = Math.min(...Object.values(q.drivers).flatMap((x) => x.official.filter((v): v is number => v != null)));
  const isPush = (l: QualiLap) => !!l.sectors && l.time <= fastest * 1.05;
  const sectorEnds = (l: QualiLap) => {
    const out: number[] = [];
    let a = l.start;
    for (const s of l.sectors ?? []) { a += s; out.push(a); }
    return out;
  };

  const lap = d.laps.find((l) => t >= l.start && t <= l.end + 6);
  const recentLaps = d.laps.filter((l) => l.end <= t && isPush(l));
  const bestOwn = Math.min(...recentLaps.filter((l) => !l.deleted).map((l) => l.time));
  const recent = recentLaps.slice(-5).reverse().map((l) => ({
    segment: l.segment, time: l.time, deleted: l.deleted, personalBest: !l.deleted && l.time === bestOwn,
  }));
  if (!lap) return { push: false, elapsed: 0, sectors: [], lapTime: null, lapTone: null, recent };

  const push = isPush(lap);
  const best = [Infinity, Infinity, Infinity];
  const prior = [Infinity, Infinity, Infinity];
  let bestLap = Infinity;
  for (const [c, x] of Object.entries(q.drivers)) {
    for (const l of x.laps) {
      if (!isPush(l) || l.deleted) continue;
      if (l.end <= t && l.time < bestLap) bestLap = l.time;
      sectorEnds(l).forEach((end, i) => {
        if (end > t) return;
        const s = l.sectors![i];
        if (s < best[i]) best[i] = s;
        if (c === code && l !== lap && s < prior[i]) prior[i] = s;
      });
    }
  }
  const ownBestLap = Math.min(...d.laps.filter((l) => l !== lap && l.end <= t && isPush(l) && !l.deleted).map((l) => l.time));

  const sectors: SectorReading[] = [0, 1, 2].map((i) => {
    const s = lap.sectors?.[i];
    const end = lap.sectors ? sectorEnds(lap)[i] : Infinity;
    if (!push || s == null || end > t) return { time: null, tone: "pending", delta: null };
    const tone: SectorTone = s <= best[i] + 1e-9 ? "purple" : s <= Math.min(prior[i], s) + 1e-9 && s <= prior[i] ? "green" : "yellow";
    return { time: s, tone, delta: Number.isFinite(prior[i]) ? s - prior[i] : null };
  });

  const done = t >= lap.end;
  let lapTone: DriverTiming["lapTone"] = null;
  if (done && push) {
    lapTone = lap.deleted ? "deleted" : lap.time <= bestLap + 1e-9 ? "purple" : lap.time <= ownBestLap ? "green" : "yellow";
  }
  return {
    push,
    elapsed: Math.min(Math.max(0, t - lap.start), lap.time),
    sectors,
    lapTime: done ? lap.time : null,
    lapTone,
    recent,
  };
}

/** Track-overlay colour for each sector tone (null = nothing drawn). */
export const TONE_HEX: Record<SectorTone, string | null> = {
  purple: "#d946ef",
  green: "#10b981",
  yellow: "#facc15",
  pending: null,
};
