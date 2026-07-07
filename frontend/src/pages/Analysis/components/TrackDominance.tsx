import { useEffect, useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  buildComparisonGrid, buildSectorDominance, driverColors, fmtLapTime, trackUrl,
  type DriverManifest, type DriverTelemetry, type TrackData, type Bounds, type LapSelection, type DominanceSector,
} from '../../../lib/telemetry';
import { useDriverSet } from '../useDriverSet';
import { LapSelector, useLapOptions } from './LapSelector';

interface Props {
  year: string; gp: string; session: string;
  segment?: number | null;
  drivers: string[]; manifest: DriverManifest;
  colorOverrides?: Record<string, string>;
}

const VBOX = 400;
const PADDING = 26;
const NUM_SECTORS = 24;

// Same projection RaceTrack.tsx uses (scale to fit + flip Y). Driver x/y and track
// bounds share the same FastF1 coordinate space, so this is unit-consistent.
function makeProjector(bounds: Bounds) {
  const dataW = bounds.x_max - bounds.x_min || 1;
  const dataH = bounds.y_max - bounds.y_min || 1;
  const availW = VBOX - PADDING * 2;
  const availH = VBOX - PADDING * 2;
  const scale = Math.min(availW / dataW, availH / dataH);
  const offsetX = PADDING + (availW - dataW * scale) / 2;
  const offsetY = PADDING + (availH - dataH * scale) / 2;
  return (x: number, y: number) => ({
    x: offsetX + (x - bounds.x_min) * scale,
    y: offsetY + (dataH - (y - bounds.y_min)) * scale,
  });
}

function pathD(points: { x: number; y: number }[]): string {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
}

// Anchored to the dominance path's own first sector (its first two points),
// NOT track.track_outline — track_outline comes from a separate reference lap
// used only to build track.json, and can sit tens of units away from the path
// actually drawn from the selected drivers' telemetry. Using the same points
// the sectors are rendered from guarantees the marker always sits exactly on
// the visible line, however the drivers' own coordinates are laid out.
//
// Rendered as discrete alternating black/white rectangles (a real checker split),
// not a thin dashed stroke — at this component's small scale, dasharray segments
// are too fine to read and blur into a solid smudge instead of a crisp marker.
function FinishLineMark({ sectors, project }: { sectors: DominanceSector[]; project: (x: number, y: number) => { x: number; y: number } }) {
  const first = sectors[0]?.points;
  if (!first || first.length < 2) return null;
  const p0 = project(first[0].x, first[0].y);
  const p1 = project(first[1].x, first[1].y);
  const tx = p1.x - p0.x, ty = p1.y - p0.y;
  const len = Math.hypot(tx, ty) || 1;
  const nx = -ty / len, ny = tx / len;

  const half = 9;
  const segments = 6;
  const segLen = (half * 2) / segments;
  const labelOffset = half + 9;

  return (
    <g>
      {/* dark backing bar, slightly wider, for contrast against any track color underneath */}
      <line x1={p0.x - nx * half} y1={p0.y - ny * half} x2={p0.x + nx * half} y2={p0.y + ny * half}
        stroke="#000" strokeWidth={6} strokeLinecap="butt" opacity={0.55} />
      {Array.from({ length: segments }, (_, i) => {
        const t0 = -half + i * segLen;
        const t1 = t0 + segLen;
        return (
          <line key={i}
            x1={p0.x + nx * t0} y1={p0.y + ny * t0}
            x2={p0.x + nx * t1} y2={p0.y + ny * t1}
            stroke={i % 2 === 0 ? '#f2f2f2' : '#161616'} strokeWidth={4} strokeLinecap="butt" />
        );
      })}
      <g transform={`translate(${p0.x + nx * labelOffset}, ${p0.y + ny * labelOffset})`}>
        <rect x={-11} y={-6.5} width={22} height={13} rx={3} fill="rgba(10,10,12,0.88)" stroke="rgba(255,255,255,0.18)" strokeWidth={0.6} />
        <text x={0} y={0.5} fontSize={7.5} fontWeight={800} fill="#fff" textAnchor="middle" dominantBaseline="middle" letterSpacing={0.3}>S/F</text>
      </g>
    </g>
  );
}

export default function TrackDominance({ year, gp, session, segment, drivers: codes, colorOverrides }: Props) {
  const pairCodes = useMemo(() => codes.slice(0, 2), [codes]);
  const { drivers, loading, error } = useDriverSet(year, gp, session, pairCodes);
  const pair = useMemo(() => pairCodes.map(c => drivers[c]).filter((d): d is DriverTelemetry => !!d), [pairCodes, drivers]);

  const [track, setTrack] = useState<TrackData | null>(null);
  const [trackErr, setTrackErr] = useState(false);
  const [lapOverride, setLapOverride] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  useEffect(() => { setLapOverride(null); setHovered(null); }, [segment, session, pairCodes]);

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
  const lapOptions = useLapOptions(pair, segment ?? null);

  const colors = useMemo(() => driverColors(pair.map(d => ({ driver: d.driver, team_color: d.team_color })), colorOverrides), [pair, colorOverrides]);
  const grid = useMemo(() => (pair.length === 2 ? buildComparisonGrid(pair[0], pair[1], sel) : []), [pair, sel]);
  const dominance = useMemo(() => (pair.length === 2 ? buildSectorDominance(pair[0], pair[1], sel, NUM_SECTORS) : null), [pair, sel]);

  if (codes.length < 2) return <Panel msg="Select 2 drivers to see track dominance." />;
  if (loading) return <div className="rounded-2xl bg-[#0d0e12] border border-white/5 h-[420px] animate-pulse" />;
  if (error || pair.length < 2) return <Panel msg={error ?? 'No data available'} />;
  if (!dominance || dominance.sectors.length === 0 || grid.length === 0) return <Panel msg={segment ? `One of these drivers has no Q${segment} lap.` : 'Could not resolve a lap for these drivers.'} />;
  if (trackErr || !track) return <Panel msg="Track outline unavailable — regenerate this session's analysis data." />;

  const colorA = colors[pair[0].driver];
  const colorB = colors[pair[1].driver];
  const project = makeProjector(track.bounds);

  const hoveredSector = hovered != null ? dominance.sectors.find(s => s.index === hovered) ?? null : null;

  const timeA = (l: number | null) => pair[0].laps.find(x => x.lap === l)?.lap_time_s ?? null;
  const timeB = (l: number | null) => pair[1].laps.find(x => x.lap === l)?.lap_time_s ?? null;

  return (
    <div className="rounded-2xl bg-[#0d0e12] border border-white/5 p-4">
      <div className="flex flex-wrap items-center gap-6 px-1 pb-4">
        <DriverBadge code={pair[0].driver} name={pair[0].full_name} color={colorA} time={fmtLapTime(timeA(dominance.lapA) ?? pair[0].fastest_lap?.lap_time_s)} />
        <span className="text-gray-600 font-black text-xs">VS</span>
        <DriverBadge code={pair[1].driver} name={pair[1].full_name} color={colorB} time={fmtLapTime(timeB(dominance.lapB) ?? pair[1].fastest_lap?.lap_time_s)} />
        <div className="ml-auto">
          <LapSelector value={lapOverride} onChange={setLapOverride} options={lapOptions} segment={segment ?? null} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {/* dominance map */}
        <div className="flex flex-col items-center">
          <div className="aspect-square w-full max-w-[360px]">
            <svg viewBox={`0 0 ${VBOX} ${VBOX}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
              {/* dark outline pass underneath for the bordered look. Butt caps (not
                  round) so adjacent sectors meet flush at their shared boundary point
                  instead of each sector's own end-cap bulging past it and overlapping
                  the neighbour's cap. */}
              {dominance.sectors.map(s => {
                const pts = s.points.map(p => project(p.x, p.y));
                return <path key={'bg' + s.index} d={pathD(pts)} stroke="#0a0a0c" strokeWidth={13} fill="none" strokeLinecap="butt" strokeLinejoin="round" />;
              })}
              {dominance.sectors.map(s => {
                const pts = s.points.map(p => project(p.x, p.y));
                const color = s.winner === 'a' ? colorA : colorB;
                const isHovered = hovered === s.index;
                return (
                  <g key={s.index}>
                    <path d={pathD(pts)} stroke={color} strokeWidth={isHovered ? 11 : 9} fill="none" strokeLinecap="butt" strokeLinejoin="round"
                      style={{ transition: 'stroke-width 120ms ease' }} />
                    {/* invisible wide hit-area so hovering the thin line is easy */}
                    <path d={pathD(pts)} stroke="transparent" strokeWidth={24} fill="none" strokeLinecap="round" strokeLinejoin="round"
                      onMouseEnter={() => setHovered(s.index)} onMouseLeave={() => setHovered(h => (h === s.index ? null : h))}
                      style={{ cursor: 'pointer' }} />
                  </g>
                );
              })}
              <FinishLineMark sectors={dominance.sectors} project={project} />
            </svg>
          </div>

          {/* fixed info panel — shows the hovered sector's per-driver time + gap, 3dp */}
          <div className="w-full max-w-[360px] mt-3 rounded-xl bg-[#0a0a0c] border border-white/8 px-4 py-3 min-h-[76px] flex flex-col justify-center">
            {hoveredSector ? (
              <SectorTooltip sector={hoveredSector} codeA={pair[0].driver} codeB={pair[1].driver} colorA={colorA} colorB={colorB} />
            ) : (
              <div className="text-[11px] text-gray-500 font-mono text-center">Hover a section of the track for the sector time gap</div>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-baseline justify-between mb-2 px-1">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-300">Speed Trace</h3>
            <span className="text-[10px] font-mono text-gray-600">km/h vs distance</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={grid} margin={{ top: 6, right: 12, left: -8, bottom: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="distance" tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }} tickLine={false} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} unit="m" />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }} tickLine={false} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} width={38} />
              <Tooltip contentStyle={{ background: 'rgba(10,10,12,0.95)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, fontSize: 12 }} labelFormatter={(v) => `${v} m`} />
              <Line type="monotone" dataKey="a_speed" name={pair[0].driver} stroke={colorA} dot={false} strokeWidth={1.8} isAnimationActive animationDuration={1500} />
              <Line type="monotone" dataKey="b_speed" name={pair[1].driver} stroke={colorB} dot={false} strokeWidth={1.8} isAnimationActive animationDuration={1500} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex gap-5 justify-center pt-3 text-[11px] font-mono">
        <span style={{ color: colorA }}>● {pair[0].driver} faster</span>
        <span style={{ color: colorB }}>● {pair[1].driver} faster</span>
      </div>
    </div>
  );
}

function SectorTooltip({ sector, codeA, codeB, colorA, colorB }: {
  sector: DominanceSector; codeA: string; codeB: string; colorA: string; colorB: string;
}) {
  const aFirst = sector.winner !== 'b';
  const first = aFirst ? { code: codeA, color: colorA, time: sector.timeA } : { code: codeB, color: colorB, time: sector.timeB };
  const second = aFirst ? { code: codeB, color: colorB, time: sector.timeB } : { code: codeA, color: colorA, time: sector.timeA };
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Sector {sector.index}</div>
      <div className="flex items-center justify-between text-xs font-mono">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: first.color }} />{first.code}</span>
        <span className="font-bold text-white">{first.time.toFixed(3)}s</span>
      </div>
      <div className="flex items-center justify-between text-xs font-mono mt-0.5">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: second.color }} />{second.code}</span>
        <span className="text-gray-300">{second.time.toFixed(3)}s <span className="text-gray-500">+{sector.gap.toFixed(3)}s</span></span>
      </div>
    </div>
  );
}

function DriverBadge({ code, name, color, time }: { code: string; name: string; color: string; time: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-1.5 h-8 rounded-full" style={{ background: color }} />
      <div>
        <div className="text-sm font-black text-white">{code} <span className="text-gray-500 font-medium text-xs">· {name}</span></div>
        <div className="font-mono text-sm font-bold" style={{ color }}>{time}</div>
      </div>
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
