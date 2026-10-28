import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { rotatePoint, rotatedBounds } from "../../../lib/trackRotation";

export interface Driver {
  code: string;
  color: string;
}

export interface CarPosition {
  x: number;
  y: number;
  lap: number | null;
  in_pit: boolean;
  distance?: number;  // total race distance from the generator (primary)
  dist?: number;      // alias used by some older data.json builds
}

export interface TrackPoint {
  x: number;
  y: number;
}

export interface Bounds {
  x_min: number;
  x_max: number;
  y_min: number;
  y_max: number;
}

export interface FinishLine {
  x: number;
  y: number;
}

export interface RaceTrackProps {
  drivers: Driver[];
  positions: Record<string, CarPosition>;
  trackOutline: TrackPoint[];
  bounds: Bounds;
  // Degrees counter-clockwise to turn the circuit to its standard orientation (see
  // lib/trackRotation.ts). 0 draws the raw coordinates.
  rotation?: number;
  // Pixels on the left kept clear of track (for overlays floating over the map), applied
  // only when the map is wide enough that the track still ends up large.
  reserveLeft?: number;
  flag?: string;
  showNames?: boolean;
  finishLine?: FinishLine | null;
  transitionMs?: number;
  // Set of driver codes who have retired — their circles are removed from the track entirely.
  // The backend keeps sending their last known coordinates, so we must filter them out explicitly.
  retiredDrivers?: Set<string>;
}

// ─── constants ───────────────────────────────────────────────────────────────

// The svg's viewBox is the map's measured pixel size, so one user unit is one CSS pixel:
// the track fills whatever shape the map area is (a wide circuit like Monza no longer
// sits in a small square), and sizes below are real on-screen pixels.
// Generous padding so cars at the edge are never clipped
const PADDING   = 48;

// Car sizes
const CAR_R_RACING = 7;
const CAR_R_PIT    = 4.5;

// Pit debounce: how many consecutive in_pit=true frames before we confirm pit state.
// Must match Leaderboard.tsx so both update at the same frame.
const PIT_CONFIRM_THRESHOLD = 3;

// If a car's dist jumped more than this many meters since the last render,
// it's moving at racing speed — clear the pit flag even if backend says
// in_pit=true. Must match Leaderboard.tsx's RACING_SPEED_DIST_THRESHOLD so
// the track dot and the leaderboard badge come back to normal on the same
// frame instead of the dot staying dimmed/small after the badge clears.
const RACING_SPEED_DIST_THRESHOLD = 45;

const FLAG_TRACK_COLOR: Record<string, string> = {
  clear:      "#5a5a5a",
  yellow:     "#ca8a04",
  red:        "#dc2626",
  safety_car: "#d97706",
  vsc:        "#d97706",
  vsc_ending: "#d97706",
};

// ─── projection ──────────────────────────────────────────────────────────────

interface View { w: number; h: number; insetLeft: number }

const makeProjector = (rawBounds: Bounds, rotation: number, outline: TrackPoint[], view: View) => {
  const bounds = rotatedBounds(outline, rotation, rawBounds);
  const dataW  = bounds.x_max - bounds.x_min || 1;
  const dataH  = bounds.y_max - bounds.y_min || 1;
  const availW = Math.max(view.w - view.insetLeft - PADDING * 2, 1);
  const availH = Math.max(view.h - PADDING * 2, 1);

  const scale   = Math.min(availW / dataW, availH / dataH);
  const offsetX = view.insetLeft + PADDING + (availW - dataW * scale) / 2;
  const offsetY = PADDING + (availH - dataH * scale) / 2;

  return (rawX: number, rawY: number) => {
    const { x, y } = rotatePoint(rawX, rawY, rotation);
    return {
      x: offsetX + (x - bounds.x_min) * scale,
      // FastF1 Y increases upward, SVG Y increases downward — flip it
      y: offsetY + (dataH - (y - bounds.y_min)) * scale,
    };
  };
};

// ─── finish line ─────────────────────────────────────────────────────────────

const FinishLineMark = ({
  finishLine,
  trackOutline,
  project,
}: {
  finishLine: FinishLine;
  trackOutline: TrackPoint[];
  project: (x: number, y: number) => { x: number; y: number };
}) => {
  const { x: fx, y: fy } = project(finishLine.x, finishLine.y);
  const projected = trackOutline.map((p) => project(p.x, p.y));

  let best1 = 0, best2 = 1, bestDist = Infinity;
  for (let i = 0; i < projected.length - 1; i++) {
    const mx = (projected[i].x + projected[i + 1].x) / 2;
    const my = (projected[i].y + projected[i + 1].y) / 2;
    const d  = Math.hypot(mx - fx, my - fy);
    if (d < bestDist) { bestDist = d; best1 = i; best2 = i + 1; }
  }

  const tx  = projected[best2].x - projected[best1].x;
  const ty  = projected[best2].y - projected[best1].y;
  const len = Math.hypot(tx, ty) || 1;
  const nx  = -ty / len;
  const ny  =  tx / len;
  const half = 17;

  const x1 = fx + nx * half, y1 = fy + ny * half;
  const x2 = fx - nx * half, y2 = fy - ny * half;

  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#000" strokeWidth="8" strokeLinecap="butt" opacity="0.4" />
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#fff" strokeWidth="6"  strokeLinecap="butt" />
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#111" strokeWidth="6"  strokeLinecap="butt" strokeDasharray="5,5" />
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#fff" strokeWidth="2"  strokeLinecap="butt" strokeDasharray="5,5" strokeDashoffset="5" opacity="0.9" />
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#fff" strokeWidth="16" strokeLinecap="round" opacity="0.08" />
    </g>
  );
};

// ─── main component ──────────────────────────────────────────────────────────

const RaceTrack = ({
  drivers,
  positions,
  trackOutline,
  bounds,
  rotation        = 0,
  reserveLeft     = 0,
  flag            = "clear",
  showNames       = false,
  finishLine      = null,
  transitionMs    = 300,
  retiredDrivers  = new Set<string>(),
}: RaceTrackProps) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 1000, h: 700 });
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setSize({ w: Math.round(width), h: Math.round(height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Keep the overlay column clear only when the map is wide enough that the track
  // still keeps most of the width; on a narrow map the overlay just floats on top.
  const insetLeft = size.w >= reserveLeft * 3 ? reserveLeft : 0;
  const project = useMemo(
    () => makeProjector(bounds, rotation, trackOutline, { w: size.w, h: size.h, insetLeft }),
    [bounds, rotation, trackOutline, size.w, size.h, insetLeft],
  );

  // ── debounced pit state (mirrors Leaderboard.tsx logic exactly) ──
  const pitCounterRef = useRef<Map<string, number>>(new Map());
  // Tracks each driver's dist from the previous render (for exit speed check)
  const prevDistRef = useRef<Map<string, number>>(new Map());

  const trackPathD = useMemo(() => {
    if (!trackOutline || trackOutline.length === 0) return "";
    const pts          = trackOutline.map((p) => project(p.x, p.y));
    const [first, ...rest] = pts;
    return (
      rest.reduce(
        (acc, p) => `${acc} L ${p.x.toFixed(3)} ${p.y.toFixed(3)}`,
        `M ${first.x.toFixed(3)} ${first.y.toFixed(3)}`
      ) + " Z"
    );
  }, [trackOutline, project]);

  const safeFlag   = (flag || "clear").toLowerCase().trim();
  const trackColor = FLAG_TRACK_COLOR[safeFlag] ?? FLAG_TRACK_COLOR.clear;
  const startLine  = finishLine || (trackOutline?.length > 0 ? trackOutline[0] : null);

  const smoothTransform = `cx ${transitionMs}ms linear, cy ${transitionMs}ms linear`;
  // Labels animate via a CSS `transform` on a wrapping <g>, not via x/y like the circles
  // above. cx/cy/r are SVG2 geometry *properties* so CSS can transition them, but a
  // <text> element's x/y stay plain XML attributes — `transition: x ...` matches
  // nothing, so labels snapped to each new position while the cars interpolated.
  // It has to be the CSS property: browsers (Safari notably) do not animate the SVG
  // `transform` *attribute*, which left the names trailing the dots.
  // Same duration and easing as smoothTransform, so the two stay in lockstep.
  const labelTransform  = `transform ${transitionMs}ms linear`;
  const sizeTransition  = `r 200ms ease-in-out`;

  // Build confirmed pit states for all drivers this render
  const confirmedPitMap = useMemo(() => {
    const map = new Map<string, boolean>();
    drivers.forEach((d) => {
      const pos  = positions[d.code];
      const dist = pos?.distance ?? pos?.dist ?? 0;

      // ── Speed-based exit override ──────────────────────────────────────
      // If the car moved more than RACING_SPEED_DIST_THRESHOLD meters since
      // the last render, it's back at racing speed → not in the pit
      // regardless of what the backend flag says. Without this, the dot
      // stays dimmed/small for as long as the backend's in_pit stays true,
      // which is why it wasn't returning to its original color/size.
      const prevDist      = prevDistRef.current.get(d.code) ?? dist;
      const distDelta     = dist - prevDist;
      prevDistRef.current.set(d.code, dist);
      const isMovingFast  = distDelta > RACING_SPEED_DIST_THRESHOLD;

      const rawInPit = (pos?.in_pit || false) && !isMovingFast;
      const prev     = pitCounterRef.current.get(d.code) ?? 0;
      const next     = rawInPit ? prev + 1 : 0;
      pitCounterRef.current.set(d.code, next);
      map.set(d.code, next >= PIT_CONFIRM_THRESHOLD);
    });
    return map;
  }, [drivers, positions]);

  return (
    <div ref={wrapRef} className="w-full h-full">
      <svg
        width={size.w}
        height={size.h}
        viewBox={`0 0 ${size.w} ${size.h}`}
        style={{ overflow: "visible", display: "block" }}
      >
        {/* ── track layers ── */}
        {/* Outer glow */}
        <path d={trackPathD} stroke={trackColor} strokeWidth="32" fill="none"
          strokeLinejoin="round" strokeLinecap="round" opacity="0.10" />
        {/* Road body — wider than before so car dots sit inside it */}
        <path d={trackPathD} stroke={trackColor} strokeWidth="18" fill="none"
          strokeLinejoin="round" strokeLinecap="round" opacity="0.85" />
        {/* Kerb highlight */}
        <path d={trackPathD} stroke="#ffffff" strokeWidth="2" fill="none"
          strokeLinejoin="round" strokeLinecap="round" opacity="0.08" />

        {startLine && (
          <FinishLineMark
            finishLine={startLine}
            trackOutline={trackOutline}
            project={project}
          />
        )}

        {/* ── cars ── */}
        {drivers.map((d) => {
          // Retired drivers: backend keeps sending last known coordinates,
          // so we must explicitly skip them here rather than relying on !pos.
          if (retiredDrivers.has(d.code)) return null;

          const pos = positions[d.code];
          if (!pos || isNaN(pos.x) || isNaN(pos.y)) return null;

          const { x, y }   = project(pos.x, pos.y);
          const isPitting   = confirmedPitMap.get(d.code) ?? false;
          const r           = isPitting ? CAR_R_PIT : CAR_R_RACING;

          return (
            <g key={d.code}>
              {/* ── shadow ring (always present, gives depth) ── */}
              <circle
                cx={x} cy={y} r={r + 4}
                fill="none" stroke="#000000" strokeWidth="4" opacity="0.35"
                style={{ transition: `${smoothTransform}, ${sizeTransition}` }}
              />

              {/* ── pit indicator ring (only visible when pitting) ── */}
              {isPitting && (
                <circle
                  cx={x} cy={y} r={r + 7}
                  fill="none"
                  stroke="#facc15"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                  opacity="0.7"
                  style={{ transition: smoothTransform }}
                />
              )}

              {/* ── car body ── */}
              <circle
                cx={x} cy={y} r={r}
                fill={isPitting ? "#4a4a4a" : d.color}
                stroke={isPitting ? "#888888" : "#ffffff"}
                strokeWidth={isPitting ? 1 : 1.5}
                opacity={isPitting ? 0.6 : 1}
                style={{ transition: `${smoothTransform}, ${sizeTransition}, opacity 200ms ease-in-out` }}
              />

              {/* ── driver label ── */}
              {showNames && (
                // Placed at (x + r + 5, y + 4), the same offset from the car the <text> had
                // as x/y. The viewBox is the map's pixel size (see PADDING), so these CSS
                // pixel values are exactly the user units project() returns.
                <g
                  style={{
                    transform: `translate(${x + r + 5}px, ${y + 4}px)`,
                    transition: labelTransform,
                    userSelect: "none",
                    pointerEvents: "none",
                  }}
                >
                  <text
                    fontSize="11" fontWeight="900"
                    fill={isPitting ? "#888" : "#ffffff"}
                    stroke="#000000" strokeWidth="3" paintOrder="stroke"
                  >
                    {d.code}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default RaceTrack;