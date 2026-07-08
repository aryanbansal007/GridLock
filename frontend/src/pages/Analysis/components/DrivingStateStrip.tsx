import { useMemo, useState } from 'react';
import {
  buildDrivingStateStrip,
  type DriverTelemetry, type DriverStyle, type DrivingState, type DrivingStateSegment, type LapSelection, type TrackCorner,
} from '../../../lib/telemetry';

interface Props {
  list: DriverTelemetry[];
  sel: LapSelection;
  corners: TrackCorner[];
  avgLapLength: number;
  styles: Record<string, DriverStyle>;
  // Skips the outer card + "Driving State" header — used when a parent
  // (LazyChart) already provides its own card chrome and title.
  bare?: boolean;
}

const STATE_META: Record<DrivingState, { label: string; color: string }> = {
  full_throttle: { label: 'Full Throttle', color: '#22c55e' },
  clipping: { label: 'Clipping', color: '#eab308' },
  lift_coast: { label: 'Lift & Coast', color: '#a855f7' },
  brake: { label: 'Brake', color: '#ef4444' },
  cornering: { label: 'Cornering', color: '#38bdf8' },
};
const STATE_ORDER: DrivingState[] = ['full_throttle', 'clipping', 'lift_coast', 'brake', 'cornering'];

// A "nice" round-number tick step (1/2.5/5/10 x a power of ten) for a given lap
// length, aiming for roughly 8-10 ticks — matches how a normal chart axis picks
// tick spacing, rather than the raw/uneven numbers a resampled dataset would
// otherwise produce.
function distanceTicks(avgLapLength: number): number[] {
  if (avgLapLength <= 0) return [];
  const rawStep = avgLapLength / 9;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const normalized = rawStep / magnitude;
  const niceStep = (normalized < 1.5 ? 1 : normalized < 3.5 ? 2.5 : normalized < 7.5 ? 5 : 10) * magnitude;
  const ticks: number[] = [];
  for (let d = 0; d <= avgLapLength; d += niceStep) ticks.push(Math.round(d));
  return ticks;
}

interface HoverInfo { code: string; state: DrivingState; distance: number; x: number; y: number }

export default function DrivingStateStrip({ list, sel, corners, avgLapLength, styles, bare }: Props) {
  const rows = useMemo(
    () => list
      .map(d => ({ code: d.driver, segments: buildDrivingStateStrip(d, sel, corners, avgLapLength) }))
      .filter(row => row.segments.length > 0),
    [list, sel, corners, avgLapLength],
  );
  const ticks = useMemo(() => distanceTicks(avgLapLength), [avgLapLength]);
  const [hover, setHover] = useState<HoverInfo | null>(null);

  if (rows.length === 0 || avgLapLength <= 0) return null;

  const segmentAt = (segments: DrivingStateSegment[], distance: number) =>
    segments.find(s => distance >= s.startDist && distance < s.endDist) ?? segments[segments.length - 1];

  const handleMove = (code: string, segments: DrivingStateSegment[]) => (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const frac = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const distance = frac * avgLapLength;
    const seg = segmentAt(segments, distance);
    if (!seg) return;
    setHover({ code, state: seg.state, distance, x: e.clientX, y: rect.top });
  };

  return (
    <div className={bare ? 'relative' : 'relative rounded-2xl bg-[#0d0e12] border border-white/5 p-4'}>
      {!bare && (
        <div className="flex items-baseline justify-between mb-1">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-300">Driving State</h3>
          <span className="text-[10px] font-mono text-gray-600">by distance</span>
        </div>
      )}

      {/* corner number ticks — shared distance scale (avg_lap_length) so a corner
          number lines up vertically across every driver row below */}
      <div className="relative h-4 mb-1 ml-12">
        {corners.map(c => (
          <div
            key={c.number}
            className="absolute top-0 -translate-x-1/2 text-[9px] font-mono font-bold text-lime-400"
            style={{ left: `${Math.min(100, (c.distance / avgLapLength) * 100)}%` }}
          >
            {c.number}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {rows.map(row => (
          <div key={row.code} className="flex items-center gap-2">
            <span className="w-10 shrink-0 text-[11px] font-black" style={{ color: styles[row.code]?.color ?? '#fff' }}>
              {row.code}
            </span>
            <div
              className="relative h-5 flex-1 cursor-crosshair overflow-hidden rounded bg-white/[0.03]"
              onMouseMove={handleMove(row.code, row.segments)}
              onMouseLeave={() => setHover(h => (h?.code === row.code ? null : h))}
            >
              {row.segments.map((seg, i) => (
                <div
                  key={i}
                  className="absolute top-0 h-full"
                  style={{
                    left: `${(seg.startDist / avgLapLength) * 100}%`,
                    width: `${Math.max(0.15, ((seg.endDist - seg.startDist) / avgLapLength) * 100)}%`,
                    background: STATE_META[seg.state].color,
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* distance axis */}
      <div className="relative h-4 mt-1 ml-12">
        {ticks.map(t => (
          <div
            key={t}
            className="absolute top-0 -translate-x-1/2 text-[9px] font-mono text-gray-600"
            style={{ left: `${Math.min(100, (t / avgLapLength) * 100)}%` }}
          >
            {t}m
          </div>
        ))}
      </div>

      <div className="ml-12 mt-3 flex flex-wrap items-center gap-4">
        {STATE_ORDER.map(s => (
          <div key={s} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: STATE_META[s].color }} />
            <span className="text-[10px] font-mono text-gray-400">{STATE_META[s].label}</span>
          </div>
        ))}
      </div>

      {hover && (
        <div
          className="fixed z-50 pointer-events-none rounded-lg border border-white/10 bg-[#0d0e12]/95 px-3 py-2 text-[11px] font-mono shadow-2xl"
          style={{ left: hover.x + 12, top: hover.y - 8 }}
        >
          <div className="font-bold text-white">{hover.code}</div>
          <div style={{ color: STATE_META[hover.state].color }}>{STATE_META[hover.state].label}</div>
          <div className="text-gray-500">{Math.round(hover.distance)}m</div>
        </div>
      )}
    </div>
  );
}
