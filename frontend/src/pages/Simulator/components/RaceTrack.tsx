// import { useMemo } from "react";

// export interface Driver {
//   code: string;
//   color: string;
// }

// export interface CarPosition {
//   x: number;
//   y: number;
//   lap: number | null;
//   in_pit: boolean;
// }

// export interface TrackPoint {
//   x: number;
//   y: number;
// }

// export interface Bounds {
//   x_min: number;
//   x_max: number;
//   y_min: number;
//   y_max: number;
// }

// export interface RaceTrackProps {
//   drivers: Driver[];
//   positions: Record<string, CarPosition>;
//   trackOutline: TrackPoint[];
//   bounds: Bounds;
//   flag?: string; 
// }

// const VIEWBOX_WIDTH = 1000;
// const VIEWBOX_HEIGHT = 1000;
// const PADDING = 45; 

// const FLAG_COLORS: Record<string, string> = {
//   clear: "#525252", 
//   "1": "#525252",
//   yellow: "#e6c900",
//   "2": "#e6c900",
//   red: "#dc2626",
//   "5": "#dc2626",
//   safety_car: "#f59e0b",
//   "4": "#f59e0b",
//   vsc: "#f59e0b",
//   "6": "#f59e0b",
//   vsc_ending: "#f59e0b",
//   "7": "#f59e0b",
// };

// const FLAG_LABELS: Record<string, string> = {
//   yellow: "YELLOW FLAG",
//   "2": "YELLOW FLAG",
//   red: "RED FLAG",
//   "5": "RED FLAG",
//   safety_car: "SAFETY CAR DEPLOYED",
//   "4": "SAFETY CAR DEPLOYED",
//   vsc: "VIRTUAL SAFETY CAR",
//   "6": "VIRTUAL SAFETY CAR",
//   vsc_ending: "VSC ENDING",
//   "7": "VSC ENDING",
// };

// const makeProjector = (bounds: Bounds) => {
//   const dataWidth = bounds.x_max - bounds.x_min || 1;
//   const dataHeight = bounds.y_max - bounds.y_min || 1;
//   const availableWidth = VIEWBOX_WIDTH - PADDING * 2;
//   const availableHeight = VIEWBOX_HEIGHT - PADDING * 2;
//   const scale = Math.min(availableWidth / dataWidth, availableHeight / dataHeight);
//   const offsetX = PADDING + (availableWidth - dataWidth * scale) / 2;
//   const offsetY = PADDING + (availableHeight - dataHeight * scale) / 2;

//   return (x: number, y: number) => {
//     const svgX = offsetX + (x - bounds.x_min) * scale;
//     const svgY = offsetY + (dataHeight - (y - bounds.y_min)) * scale;
//     return { x: svgX, y: svgY };
//   };
// };

// const RaceTrack = ({ drivers, positions, trackOutline, bounds, flag }: RaceTrackProps) => {
//   const project = useMemo(() => makeProjector(bounds), [bounds]);

//   const trackPathD = useMemo(() => {
//     if (!trackOutline || trackOutline.length === 0) return "";
//     const points = trackOutline.map((p) => project(p.x, p.y));
//     const [first, ...rest] = points;
//     const path = rest.reduce(
//       (acc, p) => `${acc} L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`,
//       `M ${first.x.toFixed(2)} ${first.y.toFixed(2)}`
//     );
//     return `${path} Z`;
//   }, [trackOutline, project]);

//   const safeFlag = (flag || "clear").toString().toLowerCase().trim();
//   const trackColor = FLAG_COLORS[safeFlag] || FLAG_COLORS.clear;
//   const isFlagActive = safeFlag !== "clear" && safeFlag !== "1" && !!FLAG_LABELS[safeFlag];

//   return (
//     <div className="w-full h-full flex items-center justify-center relative">
      
//       {/* 🛠️ FIX: Sleek, F1 Broadcast Style Flag Banner */}
//       {isFlagActive && (
//         <div className="absolute top-8 left-1/2 -translate-x-1/2 z-[100] flex items-stretch bg-neutral-900/95 backdrop-blur-md border border-neutral-700/50 rounded-lg shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden">
//           <div className="w-2" style={{ backgroundColor: trackColor }} />
//           <div className="px-6 py-2.5 flex items-center gap-3">
//             <span 
//               className="w-3 h-3 rounded-full animate-pulse" 
//               style={{ backgroundColor: trackColor, boxShadow: `0 0 10px ${trackColor}` }} 
//             />
//             <span className="font-black text-sm tracking-widest text-white uppercase">
//               {FLAG_LABELS[safeFlag]}
//             </span>
//           </div>
//         </div>
//       )}

//       <svg viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`} className="w-full h-full drop-shadow-2xl">
//         <path d={trackPathD} stroke={trackColor} strokeWidth="24" fill="none" strokeLinejoin="round" opacity="0.3" />
//         <path d={trackPathD} stroke={trackColor} strokeWidth="12" fill="none" strokeLinejoin="round" />
//         <path d={trackPathD} stroke="#ffffff" strokeWidth="1.5" strokeDasharray="4,6" fill="none" strokeLinejoin="round" opacity="0.4" />

//         {drivers.map((d) => {
//           const pos = positions[d.code];
//           if (!pos || isNaN(pos.x)) return null;
          
//           const { x, y } = project(pos.x, pos.y);
//           return (
//             <g key={d.code} style={{ transition: "transform 0.1s linear" }}>
//               <circle
//                 cx={x} cy={y}
//                 r="8"
//                 fill={d.color}
//                 stroke="#fff"
//                 strokeWidth="1.5"
//                 style={{ transition: "cx 0.1s linear, cy 0.1s linear" }}
//               />
//               <text
//                 x={x + 12} y={y + 3}
//                 fontSize="11"
//                 fontWeight="900"
//                 fill="#fff"
//                 className="drop-shadow-md"
//                 style={{ transition: "x 0.1s linear, y 0.1s linear" }}
//               >
//                 {d.code}
//               </text>
//             </g>
//           );
//         })}
//       </svg>
//     </div>
//   );
// };

// export default RaceTrack;

// import { useMemo } from "react";

// export interface Driver {
//   code: string;
//   color: string;
// }

// export interface CarPosition {
//   x: number;
//   y: number;
//   lap: number | null;
//   in_pit: boolean;
// }

// export interface TrackPoint {
//   x: number;
//   y: number;
// }

// export interface Bounds {
//   x_min: number;
//   x_max: number;
//   y_min: number;
//   y_max: number;
// }

// export interface FinishLine {
//   x: number;
//   y: number;
// }

// export interface RaceTrackProps {
//   drivers: Driver[];
//   positions: Record<string, CarPosition>;
//   trackOutline: TrackPoint[];
//   bounds: Bounds;
//   flag?: string;
//   showNames?: boolean;
//   finishLine?: FinishLine | null;
// }

// // ─── constants ──────────────────────────────────────────────────────────────

// const VIEWBOX_W = 1000;
// const VIEWBOX_H = 1000;
// const PADDING   = 40;

// const FLAG_TRACK_COLOR: Record<string, string> = {
//   clear:      "#4a4a4a",
//   yellow:     "#ca8a04",
//   red:        "#dc2626",
//   safety_car: "#d97706",
//   vsc:        "#d97706",
//   vsc_ending: "#d97706",
// };

// // ─── projection ─────────────────────────────────────────────────────────────

// const makeProjector = (bounds: Bounds) => {
//   const dataW = bounds.x_max - bounds.x_min || 1;
//   const dataH = bounds.y_max - bounds.y_min || 1;
//   const availW = VIEWBOX_W - PADDING * 2;
//   const availH = VIEWBOX_H - PADDING * 2;

//   // Uniform scale — keeps circuit shape undistorted
//   const scale   = Math.min(availW / dataW, availH / dataH);
//   const offsetX = PADDING + (availW - dataW * scale) / 2;
//   const offsetY = PADDING + (availH - dataH * scale) / 2;

//   return (x: number, y: number) => ({
//     x: offsetX + (x - bounds.x_min) * scale,
//     // SVG y-axis is inverted vs telemetry y-axis
//     y: offsetY + (dataH - (y - bounds.y_min)) * scale,
//   });
// };

// // ─── finish line helper ──────────────────────────────────────────────────────

// /**
//  * Draws a short perpendicular stroke across the track at the finish line.
//  * We find the two track-outline points nearest the finish-line coordinate,
//  * compute the tangent direction between them, then draw a line 90° to it.
//  */
// const FinishLineMark = ({
//   finishLine,
//   trackOutline,
//   project,
// }: {
//   finishLine: FinishLine;
//   trackOutline: TrackPoint[];
//   project: (x: number, y: number) => { x: number; y: number };
// }) => {
//   const { x: fx, y: fy } = project(finishLine.x, finishLine.y);

//   // Find the two outline points nearest the projected finish point
//   let best1 = 0, best2 = 1, bestDist = Infinity;
//   const projected = trackOutline.map((p) => project(p.x, p.y));

//   for (let i = 0; i < projected.length - 1; i++) {
//     const mx = (projected[i].x + projected[i + 1].x) / 2;
//     const my = (projected[i].y + projected[i + 1].y) / 2;
//     const d  = Math.hypot(mx - fx, my - fy);
//     if (d < bestDist) {
//       bestDist = d;
//       best1    = i;
//       best2    = i + 1;
//     }
//   }

//   // Tangent vector along the track at that point
//   const tx = projected[best2].x - projected[best1].x;
//   const ty = projected[best2].y - projected[best1].y;
//   const len = Math.hypot(tx, ty) || 1;

//   // Perpendicular = rotate tangent 90°
//   const nx = -ty / len;
//   const ny =  tx / len;

//   const half = 18; // half-length of the finish line mark in SVG units
//   const x1   = fx + nx * half;
//   const y1   = fy + ny * half;
//   const x2   = fx - nx * half;
//   const y2   = fy - ny * half;

//   return (
//     <g>
//       {/* Chequered flag effect: alternating black/white segments */}
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#000000" strokeWidth="5" strokeLinecap="round"
//         strokeDasharray="4,4" />
//       {/* Outer glow */}
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#ffffff" strokeWidth="9" strokeLinecap="round" opacity="0.15" />
//     </g>
//   );
// };

// // ─── component ──────────────────────────────────────────────────────────────

// const RaceTrack = ({
//   drivers,
//   positions,
//   trackOutline,
//   bounds,
//   flag       = "clear",
//   showNames  = false,
//   finishLine = null,
// }: RaceTrackProps) => {
//   const project = useMemo(() => makeProjector(bounds), [bounds]);

//   // Build SVG path string once — only changes when track outline or bounds change
//   const trackPathD = useMemo(() => {
//     if (!trackOutline || trackOutline.length === 0) return "";
//     const pts     = trackOutline.map((p) => project(p.x, p.y));
//     const [first, ...rest] = pts;
//     return rest.reduce(
//       (acc, p) => `${acc} L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`,
//       `M ${first.x.toFixed(1)} ${first.y.toFixed(1)}`
//     ) + " Z";
//   }, [trackOutline, project]);

//   const safeFlag   = (flag || "clear").toLowerCase().trim();
//   const trackColor = FLAG_TRACK_COLOR[safeFlag] ?? FLAG_TRACK_COLOR.clear;

//   return (
//     <div className="w-full h-full">
//       <svg
//         viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
//         className="w-full h-full"
//         style={{ overflow: "visible" }}
//       >
//         {/* ── Track rendering — 3 layered strokes ── */}

//         {/* Layer 1: wide outer glow — gives the "circuit lit up" feel */}
//         <path
//           d={trackPathD}
//           stroke={trackColor}
//           strokeWidth="28"
//           fill="none"
//           strokeLinejoin="round"
//           strokeLinecap="round"
//           opacity="0.18"
//         />

//         {/* Layer 2: main tarmac surface */}
//         <path
//           d={trackPathD}
//           stroke={trackColor}
//           strokeWidth="14"
//           fill="none"
//           strokeLinejoin="round"
//           strokeLinecap="round"
//           opacity="0.9"
//         />

//         {/* Layer 3: inner edge highlight — the bright centre line
//             subtle white line that gives the track a 3D "lit from above" feel */}
//         <path
//           d={trackPathD}
//           stroke="#ffffff"
//           strokeWidth="2"
//           fill="none"
//           strokeLinejoin="round"
//           strokeLinecap="round"
//           opacity="0.12"
//         />

//         {/* ── Finish line ── */}
//         {finishLine && (
//           <FinishLineMark
//             finishLine={finishLine}
//             trackOutline={trackOutline}
//             project={project}
//           />
//         )}

//         {/* ── Cars ── */}
//         {drivers.map((d) => {
//           const pos = positions[d.code];
//           if (!pos || isNaN(pos.x) || isNaN(pos.y)) return null;

//           const { x, y } = project(pos.x, pos.y);
//           const r        = pos.in_pit ? 5 : 8;
//           const opacity  = pos.in_pit ? 0.55 : 1;

//           return (
//             <g
//               key={d.code}
//               opacity={opacity}
//               style={{ transition: "opacity 0.3s" }}
//             >
//               {/* Drop shadow ring — makes cars pop off dark track */}
//               <circle
//                 cx={x} cy={y} r={r + 3}
//                 fill="none"
//                 stroke="#000000"
//                 strokeWidth="3"
//                 opacity="0.5"
//                 style={{ transition: "cx 0.1s linear, cy 0.1s linear" }}
//               />

//               {/* Team color fill */}
//               <circle
//                 cx={x} cy={y} r={r}
//                 fill={d.color}
//                 stroke="#ffffff"
//                 strokeWidth="1.5"
//                 style={{ transition: "cx 0.1s linear, cy 0.1s linear" }}
//               />

//               {/* Driver name — only when toggled on via L key */}
//               {showNames && (
//                 <text
//                   x={x + r + 5}
//                   y={y + 4}
//                   fontSize="11"
//                   fontWeight="900"
//                   fill="#ffffff"
//                   stroke="#000000"
//                   strokeWidth="3"
//                   paintOrder="stroke"
//                   style={{
//                     transition:     "x 0.1s linear, y 0.1s linear",
//                     userSelect:     "none",
//                     pointerEvents:  "none",
//                   }}
//                 >
//                   {d.code}
//                 </text>
//               )}
//             </g>
//           );
//         })}
//       </svg>
//     </div>
//   );
// };

// export default RaceTrack;

// import { useMemo } from "react";

// export interface Driver {
//   code: string;
//   color: string;
// }

// export interface CarPosition {
//   x: number;
//   y: number;
//   lap: number | null;
//   in_pit: boolean;
// }

// export interface TrackPoint {
//   x: number;
//   y: number;
// }

// export interface Bounds {
//   x_min: number;
//   x_max: number;
//   y_min: number;
//   y_max: number;
// }

// export interface FinishLine {
//   x: number;
//   y: number;
// }

// export interface RaceTrackProps {
//   drivers: Driver[];
//   positions: Record<string, CarPosition>;
//   trackOutline: TrackPoint[];
//   bounds: Bounds;
//   flag?: string;
//   showNames?: boolean;
//   finishLine?: FinishLine | null;
// }

// // ─── constants ──────────────────────────────────────────────────────────────

// const VIEWBOX_W = 1000;
// const VIEWBOX_H = 1000;
// // Decreased padding from 40 to 25 to increase the overall size of the track slightly
// const PADDING   = 25;

// const FLAG_TRACK_COLOR: Record<string, string> = {
//   clear:      "#4a4a4a",
//   yellow:     "#ca8a04",
//   red:        "#dc2626",
//   safety_car: "#d97706",
//   vsc:        "#d97706",
//   vsc_ending: "#d97706",
// };

// // ─── projection ─────────────────────────────────────────────────────────────

// const makeProjector = (bounds: Bounds) => {
//   const dataW = bounds.x_max - bounds.x_min || 1;
//   const dataH = bounds.y_max - bounds.y_min || 1;
//   const availW = VIEWBOX_W - PADDING * 2;
//   const availH = VIEWBOX_H - PADDING * 2;

//   // Uniform scale — keeps circuit shape undistorted
//   const scale   = Math.min(availW / dataW, availH / dataH);
//   const offsetX = PADDING + (availW - dataW * scale) / 2;
//   const offsetY = PADDING + (availH - dataH * scale) / 2;

//   return (x: number, y: number) => ({
//     x: offsetX + (x - bounds.x_min) * scale,
//     // SVG y-axis is inverted vs telemetry y-axis
//     y: offsetY + (dataH - (y - bounds.y_min)) * scale,
//   });
// };

// // ─── finish line helper ──────────────────────────────────────────────────────

// /**
//  * Draws a short perpendicular stroke across the track at the finish line.
//  * We find the two track-outline points nearest the finish-line coordinate,
//  * compute the tangent direction between them, then draw a line 90° to it.
//  */
// const FinishLineMark = ({
//   finishLine,
//   trackOutline,
//   project,
// }: {
//   finishLine: FinishLine;
//   trackOutline: TrackPoint[];
//   project: (x: number, y: number) => { x: number; y: number };
// }) => {
//   const { x: fx, y: fy } = project(finishLine.x, finishLine.y);

//   // Find the two outline points nearest the projected finish point
//   let best1 = 0, best2 = 1, bestDist = Infinity;
//   const projected = trackOutline.map((p) => project(p.x, p.y));

//   for (let i = 0; i < projected.length - 1; i++) {
//     const mx = (projected[i].x + projected[i + 1].x) / 2;
//     const my = (projected[i].y + projected[i + 1].y) / 2;
//     const d  = Math.hypot(mx - fx, my - fy);
//     if (d < bestDist) {
//       bestDist = d;
//       best1    = i;
//       best2    = i + 1;
//     }
//   }

//   // Tangent vector along the track at that point
//   const tx = projected[best2].x - projected[best1].x;
//   const ty = projected[best2].y - projected[best1].y;
//   const len = Math.hypot(tx, ty) || 1;

//   // Perpendicular = rotate tangent 90°
//   const nx = -ty / len;
//   const ny =  tx / len;

//   const half = 18; // half-length of the finish line mark in SVG units
//   const x1   = fx + nx * half;
//   const y1   = fy + ny * half;
//   const x2   = fx - nx * half;
//   const y2   = fy - ny * half;

//   return (
//     <g>
//       {/* Chequered flag effect: alternating black/white segments */}
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#000000" strokeWidth="5" strokeLinecap="round"
//         strokeDasharray="4,4" />
//       {/* Outer glow */}
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#ffffff" strokeWidth="9" strokeLinecap="round" opacity="0.15" />
//     </g>
//   );
// };

// // ─── component ──────────────────────────────────────────────────────────────

// const RaceTrack = ({
//   drivers,
//   positions,
//   trackOutline,
//   bounds,
//   flag       = "clear",
//   showNames  = false,
//   finishLine = null,
// }: RaceTrackProps) => {
//   const project = useMemo(() => makeProjector(bounds), [bounds]);

//   // Build SVG path string once — only changes when track outline or bounds change
//   const trackPathD = useMemo(() => {
//     if (!trackOutline || trackOutline.length === 0) return "";
//     const pts     = trackOutline.map((p) => project(p.x, p.y));
//     const [first, ...rest] = pts;
//     return rest.reduce(
//       (acc, p) => `${acc} L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`,
//       `M ${first.x.toFixed(1)} ${first.y.toFixed(1)}`
//     ) + " Z";
//   }, [trackOutline, project]);

//   const safeFlag   = (flag || "clear").toLowerCase().trim();
//   const trackColor = FLAG_TRACK_COLOR[safeFlag] ?? FLAG_TRACK_COLOR.clear;

//   // Fallback to the first coordinate of the track outline if no explicit finish line is provided
//   const startLine = finishLine || (trackOutline?.length > 0 ? trackOutline[0] : null);

//   return (
//     <div className="w-full h-full">
//       <svg
//         viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
//         className="w-full h-full"
//         style={{ overflow: "visible" }}
//       >
//         {/* ── Track rendering — 3 layered strokes ── */}

//         {/* Layer 1: wide outer glow — gives the "circuit lit up" feel */}
//         <path
//           d={trackPathD}
//           stroke={trackColor}
//           strokeWidth="28"
//           fill="none"
//           strokeLinejoin="round"
//           strokeLinecap="round"
//           opacity="0.18"
//         />

//         {/* Layer 2: main tarmac surface */}
//         <path
//           d={trackPathD}
//           stroke={trackColor}
//           strokeWidth="14"
//           fill="none"
//           strokeLinejoin="round"
//           strokeLinecap="round"
//           opacity="0.9"
//         />

//         {/* Layer 3: inner edge highlight — the bright centre line
//             subtle white line that gives the track a 3D "lit from above" feel */}
//         <path
//           d={trackPathD}
//           stroke="#ffffff"
//           strokeWidth="2"
//           fill="none"
//           strokeLinejoin="round"
//           strokeLinecap="round"
//           opacity="0.12"
//         />

//         {/* ── Finish line ── */}
//         {startLine && (
//           <FinishLineMark
//             finishLine={startLine}
//             trackOutline={trackOutline}
//             project={project}
//           />
//         )}

//         {/* ── Cars ── */}
//         {drivers.map((d) => {
//           const pos = positions[d.code];
//           if (!pos || isNaN(pos.x) || isNaN(pos.y)) return null;

//           const { x, y } = project(pos.x, pos.y);
//           const r        = pos.in_pit ? 5 : 8;
//           const opacity  = pos.in_pit ? 0.55 : 1;

//           return (
//             <g
//               key={d.code}
//               opacity={opacity}
//               style={{ transition: "opacity 0.3s" }}
//             >
//               {/* Drop shadow ring — makes cars pop off dark track */}
//               <circle
//                 cx={x} cy={y} r={r + 3}
//                 fill="none"
//                 stroke="#000000"
//                 strokeWidth="3"
//                 opacity="0.5"
//                 style={{ transition: "cx 0.1s linear, cy 0.1s linear" }}
//               />

//               {/* Team color fill */}
//               <circle
//                 cx={x} cy={y} r={r}
//                 fill={d.color}
//                 stroke="#ffffff"
//                 strokeWidth="1.5"
//                 style={{ transition: "cx 0.1s linear, cy 0.1s linear" }}
//               />

//               {/* Driver name — only when toggled on via L key */}
//               {showNames && (
//                 <text
//                   x={x + r + 5}
//                   y={y + 4}
//                   fontSize="11"
//                   fontWeight="900"
//                   fill="#ffffff"
//                   stroke="#000000"
//                   strokeWidth="3"
//                   paintOrder="stroke"
//                   style={{
//                     transition:     "x 0.1s linear, y 0.1s linear",
//                     userSelect:     "none",
//                     pointerEvents:  "none",
//                   }}
//                 >
//                   {d.code}
//                 </text>
//               )}
//             </g>
//           );
//         })}
//       </svg>
//     </div>
//   );
// };

// export default RaceTrack;

// import { useMemo } from "react";

// export interface Driver {
//   code: string;
//   color: string;
// }

// export interface CarPosition {
//   x: number;
//   y: number;
//   lap: number | null;
//   in_pit: boolean;
// }

// export interface TrackPoint {
//   x: number;
//   y: number;
// }

// export interface Bounds {
//   x_min: number;
//   x_max: number;
//   y_min: number;
//   y_max: number;
// }

// export interface FinishLine {
//   x: number;
//   y: number;
// }

// export interface RaceTrackProps {
//   drivers: Driver[];
//   positions: Record<string, CarPosition>;
//   trackOutline: TrackPoint[];
//   bounds: Bounds;
//   flag?: string;
//   showNames?: boolean;
//   finishLine?: FinishLine | null;
// }

// // ─── constants ──────────────────────────────────────────────────────────────

// const VIEWBOX_W = 1000;
// const VIEWBOX_H = 1000;
// // Decreased padding from 40 to 25 to increase the overall size of the track slightly
// const PADDING   = 1;

// const FLAG_TRACK_COLOR: Record<string, string> = {
//   clear:      "#4a4a4a",
//   yellow:     "#ca8a04",
//   red:        "#dc2626",
//   safety_car: "#d97706",
//   vsc:        "#d97706",
//   vsc_ending: "#d97706",
// };

// // ─── projection ─────────────────────────────────────────────────────────────

// const makeProjector = (bounds: Bounds) => {
//   const dataW = bounds.x_max - bounds.x_min || 1;
//   const dataH = bounds.y_max - bounds.y_min || 1;
//   const availW = VIEWBOX_W - PADDING * 2;
//   const availH = VIEWBOX_H - PADDING * 2;

//   // Uniform scale — keeps circuit shape undistorted
//   const scale   = Math.min(availW / dataW, availH / dataH);
//   const offsetX = PADDING + (availW - dataW * scale) / 2;
//   const offsetY = PADDING + (availH - dataH * scale) / 2;

//   return (x: number, y: number) => ({
//     x: offsetX + (x - bounds.x_min) * scale,
//     // SVG y-axis is inverted vs telemetry y-axis
//     y: offsetY + (dataH - (y - bounds.y_min)) * scale,
//   });
// };

// // ─── finish line helper ──────────────────────────────────────────────────────

// /**
//  * Draws a short perpendicular stroke across the track at the finish line.
//  * We find the two track-outline points nearest the finish-line coordinate,
//  * compute the tangent direction between them, then draw a line 90° to it.
//  */
// const FinishLineMark = ({
//   finishLine,
//   trackOutline,
//   project,
// }: {
//   finishLine: FinishLine;
//   trackOutline: TrackPoint[];
//   project: (x: number, y: number) => { x: number; y: number };
// }) => {
//   const { x: fx, y: fy } = project(finishLine.x, finishLine.y);

//   // Find the two outline points nearest the projected finish point
//   let best1 = 0, best2 = 1, bestDist = Infinity;
//   const projected = trackOutline.map((p) => project(p.x, p.y));

//   for (let i = 0; i < projected.length - 1; i++) {
//     const mx = (projected[i].x + projected[i + 1].x) / 2;
//     const my = (projected[i].y + projected[i + 1].y) / 2;
//     const d  = Math.hypot(mx - fx, my - fy);
//     if (d < bestDist) {
//       bestDist = d;
//       best1    = i;
//       best2    = i + 1;
//     }
//   }

//   // Tangent vector along the track at that point
//   const tx = projected[best2].x - projected[best1].x;
//   const ty = projected[best2].y - projected[best1].y;
//   const len = Math.hypot(tx, ty) || 1;

//   // Perpendicular = rotate tangent 90°
//   const nx = -ty / len;
//   const ny =  tx / len;

//   const half = 18; // half-length of the finish line mark in SVG units
//   const x1   = fx + nx * half;
//   const y1   = fy + ny * half;
//   const x2   = fx - nx * half;
//   const y2   = fy - ny * half;

//   return (
//     <g>
//       {/* 1. Asphalt burn / shadow (gives the paint depth) */}
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#000000" strokeWidth="8" strokeLinecap="butt" opacity="0.5" />

//       {/* 2. Base white paint layer */}
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#ffffff" strokeWidth="6" strokeLinecap="butt" />

//       {/* 3. Crisp black squares (butt cap creates sharp checkerboard boxes) */}
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#111111" strokeWidth="6" strokeLinecap="butt"
//         strokeDasharray="4,4" />

//       {/* 4. Reflective paint highlight (only on the white squares) */}
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#ffffff" strokeWidth="2" strokeLinecap="butt"
//         strokeDasharray="4,4" strokeDashoffset="4" opacity="0.9" />

//       {/* 5. Soft ambient bloom/glow to match the rest of the track */}
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#ffffff" strokeWidth="14" strokeLinecap="round" opacity="0.12" />
//     </g>
//   );
// };

// // ─── component ──────────────────────────────────────────────────────────────

// const RaceTrack = ({
//   drivers,
//   positions,
//   trackOutline,
//   bounds,
//   flag       = "clear",
//   showNames  = false,
//   finishLine = null,
// }: RaceTrackProps) => {
//   const project = useMemo(() => makeProjector(bounds), [bounds]);

//   // Build SVG path string once — only changes when track outline or bounds change
//   const trackPathD = useMemo(() => {
//     if (!trackOutline || trackOutline.length === 0) return "";
//     const pts     = trackOutline.map((p) => project(p.x, p.y));
//     const [first, ...rest] = pts;
//     return rest.reduce(
//       (acc, p) => `${acc} L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`,
//       `M ${first.x.toFixed(1)} ${first.y.toFixed(1)}`
//     ) + " Z";
//   }, [trackOutline, project]);

//   const safeFlag   = (flag || "clear").toLowerCase().trim();
//   const trackColor = FLAG_TRACK_COLOR[safeFlag] ?? FLAG_TRACK_COLOR.clear;

//   // Fallback to the first coordinate of the track outline if no explicit finish line is provided
//   const startLine = finishLine || (trackOutline?.length > 0 ? trackOutline[0] : null);

//   return (
//     <div className="w-full h-full">
//       <svg
//         viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
//         className="w-full h-full"
//         style={{ overflow: "visible" }}
//       >
//         {/* ── Track rendering — 3 layered strokes ── */}

//         {/* Layer 1: wide outer glow — gives the "circuit lit up" feel */}
//         <path
//           d={trackPathD}
//           stroke={trackColor}
//           strokeWidth="28"
//           fill="none"
//           strokeLinejoin="round"
//           strokeLinecap="round"
//           opacity="0.18"
//         />

//         {/* Layer 2: main tarmac surface */}
//         <path
//           d={trackPathD}
//           stroke={trackColor}
//           strokeWidth="14"
//           fill="none"
//           strokeLinejoin="round"
//           strokeLinecap="round"
//           opacity="0.9"
//         />

//         {/* Layer 3: inner edge highlight — the bright centre line
//             subtle white line that gives the track a 3D "lit from above" feel */}
//         <path
//           d={trackPathD}
//           stroke="#ffffff"
//           strokeWidth="2"
//           fill="none"
//           strokeLinejoin="round"
//           strokeLinecap="round"
//           opacity="0.12"
//         />

//         {/* ── Finish line ── */}
//         {startLine && (
//           <FinishLineMark
//             finishLine={startLine}
//             trackOutline={trackOutline}
//             project={project}
//           />
//         )}

//         {/* ── Cars ── */}
//         {drivers.map((d) => {
//           const pos = positions[d.code];
//           if (!pos || isNaN(pos.x) || isNaN(pos.y)) return null;

//           const { x, y } = project(pos.x, pos.y);
//           const r        = pos.in_pit ? 5 : 8;
//           const opacity  = pos.in_pit ? 0.55 : 1;

//           return (
//             <g
//               key={d.code}
//               opacity={opacity}
//               style={{ transition: "opacity 0.3s" }}
//             >
//               {/* Drop shadow ring — makes cars pop off dark track */}
//               <circle
//                 cx={x} cy={y} r={r + 3}
//                 fill="none"
//                 stroke="#000000"
//                 strokeWidth="3"
//                 opacity="0.5"
//                 style={{ transition: "cx 0.1s linear, cy 0.1s linear" }}
//               />

//               {/* Team color fill */}
//               <circle
//                 cx={x} cy={y} r={r}
//                 fill={d.color}
//                 stroke="#ffffff"
//                 strokeWidth="1.5"
//                 style={{ transition: "cx 0.1s linear, cy 0.1s linear" }}
//               />

//               {/* Driver name — only when toggled on via L key */}
//               {showNames && (
//                 <text
//                   x={x + r + 5}
//                   y={y + 4}
//                   fontSize="11"
//                   fontWeight="900"
//                   fill="#ffffff"
//                   stroke="#000000"
//                   strokeWidth="3"
//                   paintOrder="stroke"
//                   style={{
//                     transition:     "x 0.1s linear, y 0.1s linear",
//                     userSelect:     "none",
//                     pointerEvents:  "none",
//                   }}
//                 >
//                   {d.code}
//                 </text>
//               )}
//             </g>
//           );
//         })}
//       </svg>
//     </div>
//   );
// };

// export default RaceTrack;\\
// import { useMemo } from "react";

// export interface Driver {
//   code: string;
//   color: string;
// }

// export interface CarPosition {
//   x: number;
//   y: number;
//   lap: number | null;
//   in_pit: boolean;
// }

// export interface TrackPoint {
//   x: number;
//   y: number;
// }

// export interface Bounds {
//   x_min: number;
//   x_max: number;
//   y_min: number;
//   y_max: number;
// }

// export interface FinishLine {
//   x: number;
//   y: number;
// }

// export interface RaceTrackProps {
//   drivers: Driver[];
//   positions: Record<string, CarPosition>;
//   trackOutline: TrackPoint[];
//   bounds: Bounds;
//   flag?: string;
//   showNames?: boolean;
//   finishLine?: FinishLine | null;
//   transitionMs?: number; // 🛠️ NEW: Dynamic sync for smooth gliding
// }

// // ─── constants ──────────────────────────────────────────────────────────────

// const VIEWBOX_W = 1000;
// const VIEWBOX_H = 1000;
// const PADDING   = 1;

// const FLAG_TRACK_COLOR: Record<string, string> = {
//   clear:      "#4a4a4a",
//   yellow:     "#ca8a04",
//   red:        "#dc2626",
//   safety_car: "#d97706",
//   vsc:        "#d97706",
//   vsc_ending: "#d97706",
// };

// // ─── projection ─────────────────────────────────────────────────────────────

// const makeProjector = (bounds: Bounds) => {
//   const dataW = bounds.x_max - bounds.x_min || 1;
//   const dataH = bounds.y_max - bounds.y_min || 1;
//   const availW = VIEWBOX_W - PADDING * 2;
//   const availH = VIEWBOX_H - PADDING * 2;

//   const scale   = Math.min(availW / dataW, availH / dataH);
//   const offsetX = PADDING + (availW - dataW * scale) / 2;
//   const offsetY = PADDING + (availH - dataH * scale) / 2;

//   return (x: number, y: number) => ({
//     x: offsetX + (x - bounds.x_min) * scale,
//     y: offsetY + (dataH - (y - bounds.y_min)) * scale,
//   });
// };

// // ─── finish line helper ──────────────────────────────────────────────────────

// const FinishLineMark = ({
//   finishLine,
//   trackOutline,
//   project,
// }: {
//   finishLine: FinishLine;
//   trackOutline: TrackPoint[];
//   project: (x: number, y: number) => { x: number; y: number };
// }) => {
//   const { x: fx, y: fy } = project(finishLine.x, finishLine.y);

//   let best1 = 0, best2 = 1, bestDist = Infinity;
//   const projected = trackOutline.map((p) => project(p.x, p.y));

//   for (let i = 0; i < projected.length - 1; i++) {
//     const mx = (projected[i].x + projected[i + 1].x) / 2;
//     const my = (projected[i].y + projected[i + 1].y) / 2;
//     const d  = Math.hypot(mx - fx, my - fy);
//     if (d < bestDist) {
//       bestDist = d;
//       best1    = i;
//       best2    = i + 1;
//     }
//   }

//   const tx = projected[best2].x - projected[best1].x;
//   const ty = projected[best2].y - projected[best1].y;
//   const len = Math.hypot(tx, ty) || 1;

//   const nx = -ty / len;
//   const ny =  tx / len;

//   const half = 18; 
//   const x1   = fx + nx * half;
//   const y1   = fy + ny * half;
//   const x2   = fx - nx * half;
//   const y2   = fy - ny * half;

//   return (
//     <g>
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#000000" strokeWidth="8" strokeLinecap="butt" opacity="0.5" />
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#ffffff" strokeWidth="6" strokeLinecap="butt" />
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#111111" strokeWidth="6" strokeLinecap="butt"
//         strokeDasharray="4,4" />
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#ffffff" strokeWidth="2" strokeLinecap="butt"
//         strokeDasharray="4,4" strokeDashoffset="4" opacity="0.9" />
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#ffffff" strokeWidth="14" strokeLinecap="round" opacity="0.12" />
//     </g>
//   );
// };

// // ─── component ──────────────────────────────────────────────────────────────

// const RaceTrack = ({
//   drivers,
//   positions,
//   trackOutline,
//   bounds,
//   flag       = "clear",
//   showNames  = false,
//   finishLine = null,
//   transitionMs = 300, 
// }: RaceTrackProps) => {
//   const project = useMemo(() => makeProjector(bounds), [bounds]);

//   const trackPathD = useMemo(() => {
//     if (!trackOutline || trackOutline.length === 0) return "";
//     const pts     = trackOutline.map((p) => project(p.x, p.y));
//     const [first, ...rest] = pts;
//     return rest.reduce(
//       // 🛠️ FIX: Removed .toFixed(1) to stop the track line from rounding/shifting under the cars
//       (acc, p) => `${acc} L ${p.x.toFixed(3)} ${p.y.toFixed(3)}`,
//       `M ${first.x.toFixed(3)} ${first.y.toFixed(3)}`
//     ) + " Z";
//   }, [trackOutline, project]);

//   const safeFlag   = (flag || "clear").toLowerCase().trim();
//   const trackColor = FLAG_TRACK_COLOR[safeFlag] ?? FLAG_TRACK_COLOR.clear;
//   const startLine = finishLine || (trackOutline?.length > 0 ? trackOutline[0] : null);

//   // 🛠️ FIX: Perfect timing sync for CSS transitions
//   const smoothTransform = `cx ${transitionMs}ms linear, cy ${transitionMs}ms linear`;
//   const textTransform = `x ${transitionMs}ms linear, y ${transitionMs}ms linear`;

//   return (
//     <div className="w-full h-full">
//       <svg
//         viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
//         className="w-full h-full"
//         style={{ overflow: "visible" }}
//       >
//         <path d={trackPathD} stroke={trackColor} strokeWidth="28" fill="none" strokeLinejoin="round" strokeLinecap="round" opacity="0.18" />
//         <path d={trackPathD} stroke={trackColor} strokeWidth="14" fill="none" strokeLinejoin="round" strokeLinecap="round" opacity="0.9" />
//         <path d={trackPathD} stroke="#ffffff" strokeWidth="2" fill="none" strokeLinejoin="round" strokeLinecap="round" opacity="0.12" />

//         {startLine && (
//           <FinishLineMark finishLine={startLine} trackOutline={trackOutline} project={project} />
//         )}

//         {drivers.map((d) => {
//           const pos = positions[d.code];
//           if (!pos || isNaN(pos.x) || isNaN(pos.y)) return null;

//           const { x, y } = project(pos.x, pos.y);
//           // 🛠️ FIX: Locked all cars to size 8, regardless of pitting
//           const r = 8;
//           const opacity = pos.in_pit ? 0.55 : 1;

//           return (
//             <g key={d.code} opacity={opacity} style={{ transition: "opacity 0.2s" }}>
//               <circle
//                 cx={x} cy={y} r={r + 3}
//                 fill="none" stroke="#000000" strokeWidth="3" opacity="0.5"
//                 style={{ transition: smoothTransform }}
//               />
//               <circle
//                 cx={x} cy={y} r={r}
//                 fill={d.color} stroke="#ffffff" strokeWidth="1.5"
//                 style={{ transition: smoothTransform }}
//               />
//               {showNames && (
//                 <text
//                   x={x + r + 5} y={y + 4}
//                   fontSize="11" fontWeight="900" fill="#ffffff" stroke="#000000" strokeWidth="3" paintOrder="stroke"
//                   style={{ transition: textTransform, userSelect: "none", pointerEvents: "none" }}
//                 >
//                   {d.code}
//                 </text>
//               )}
//             </g>
//           );
//         })}
//       </svg>
//     </div>
//   );
// };

// export default RaceTrack;

// import { useMemo, useRef } from "react";

// export interface Driver {
//   code: string;
//   color: string;
// }

// export interface CarPosition {
//   x: number;
//   y: number;
//   lap: number | null;
//   in_pit: boolean;
// }

// export interface TrackPoint {
//   x: number;
//   y: number;
// }

// export interface Bounds {
//   x_min: number;
//   x_max: number;
//   y_min: number;
//   y_max: number;
// }

// export interface FinishLine {
//   x: number;
//   y: number;
// }

// export interface RaceTrackProps {
//   drivers: Driver[];
//   positions: Record<string, CarPosition>;
//   trackOutline: TrackPoint[];
//   bounds: Bounds;
//   flag?: string;
//   showNames?: boolean;
//   finishLine?: FinishLine | null;
//   transitionMs?: number;
// }

// // ─── constants ───────────────────────────────────────────────────────────────

// const VIEWBOX_W = 1000;
// const VIEWBOX_H = 1000;
// // Generous padding so cars at the edge are never clipped
// const PADDING   = 40;

// // Car sizes
// const CAR_R_RACING = 8;
// const CAR_R_PIT    = 5;

// // Pit debounce: how many consecutive in_pit=true frames before we confirm pit state.
// // Must match Leaderboard.tsx so both update at the same frame.
// const PIT_CONFIRM_THRESHOLD = 3;

// const FLAG_TRACK_COLOR: Record<string, string> = {
//   clear:      "#5a5a5a",
//   yellow:     "#ca8a04",
//   red:        "#dc2626",
//   safety_car: "#d97706",
//   vsc:        "#d97706",
//   vsc_ending: "#d97706",
// };

// // ─── projection ──────────────────────────────────────────────────────────────

// const makeProjector = (bounds: Bounds) => {
//   const dataW  = bounds.x_max - bounds.x_min || 1;
//   const dataH  = bounds.y_max - bounds.y_min || 1;
//   const availW = VIEWBOX_W - PADDING * 2;
//   const availH = VIEWBOX_H - PADDING * 2;

//   const scale   = Math.min(availW / dataW, availH / dataH);
//   const offsetX = PADDING + (availW - dataW * scale) / 2;
//   const offsetY = PADDING + (availH - dataH * scale) / 2;

//   return (x: number, y: number) => ({
//     x: offsetX + (x - bounds.x_min) * scale,
//     // FastF1 Y increases upward, SVG Y increases downward — flip it
//     y: offsetY + (dataH - (y - bounds.y_min)) * scale,
//   });
// };

// // ─── finish line ─────────────────────────────────────────────────────────────

// const FinishLineMark = ({
//   finishLine,
//   trackOutline,
//   project,
// }: {
//   finishLine: FinishLine;
//   trackOutline: TrackPoint[];
//   project: (x: number, y: number) => { x: number; y: number };
// }) => {
//   const { x: fx, y: fy } = project(finishLine.x, finishLine.y);
//   const projected = trackOutline.map((p) => project(p.x, p.y));

//   let best1 = 0, best2 = 1, bestDist = Infinity;
//   for (let i = 0; i < projected.length - 1; i++) {
//     const mx = (projected[i].x + projected[i + 1].x) / 2;
//     const my = (projected[i].y + projected[i + 1].y) / 2;
//     const d  = Math.hypot(mx - fx, my - fy);
//     if (d < bestDist) { bestDist = d; best1 = i; best2 = i + 1; }
//   }

//   const tx  = projected[best2].x - projected[best1].x;
//   const ty  = projected[best2].y - projected[best1].y;
//   const len = Math.hypot(tx, ty) || 1;
//   const nx  = -ty / len;
//   const ny  =  tx / len;
//   const half = 20;

//   const x1 = fx + nx * half, y1 = fy + ny * half;
//   const x2 = fx - nx * half, y2 = fy - ny * half;

//   return (
//     <g>
//       <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#000" strokeWidth="10" strokeLinecap="butt" opacity="0.4" />
//       <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#fff" strokeWidth="7"  strokeLinecap="butt" />
//       <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#111" strokeWidth="7"  strokeLinecap="butt" strokeDasharray="5,5" />
//       <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#fff" strokeWidth="2"  strokeLinecap="butt" strokeDasharray="5,5" strokeDashoffset="5" opacity="0.9" />
//       <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#fff" strokeWidth="16" strokeLinecap="round" opacity="0.08" />
//     </g>
//   );
// };

// // ─── main component ──────────────────────────────────────────────────────────

// const RaceTrack = ({
//   drivers,
//   positions,
//   trackOutline,
//   bounds,
//   flag         = "clear",
//   showNames    = false,
//   finishLine   = null,
//   transitionMs = 300,
// }: RaceTrackProps) => {
//   const project = useMemo(() => makeProjector(bounds), [bounds]);

//   // ── debounced pit state (mirrors Leaderboard.tsx logic exactly) ──
//   const pitCounterRef = useRef<Map<string, number>>(new Map());

//   const trackPathD = useMemo(() => {
//     if (!trackOutline || trackOutline.length === 0) return "";
//     const pts          = trackOutline.map((p) => project(p.x, p.y));
//     const [first, ...rest] = pts;
//     return (
//       rest.reduce(
//         (acc, p) => `${acc} L ${p.x.toFixed(3)} ${p.y.toFixed(3)}`,
//         `M ${first.x.toFixed(3)} ${first.y.toFixed(3)}`
//       ) + " Z"
//     );
//   }, [trackOutline, project]);

//   const safeFlag   = (flag || "clear").toLowerCase().trim();
//   const trackColor = FLAG_TRACK_COLOR[safeFlag] ?? FLAG_TRACK_COLOR.clear;
//   const startLine  = finishLine || (trackOutline?.length > 0 ? trackOutline[0] : null);

//   const smoothTransform = `cx ${transitionMs}ms linear, cy ${transitionMs}ms linear`;
//   const textTransform   = `x ${transitionMs}ms linear, y ${transitionMs}ms linear`;
//   const sizeTransition  = `r 200ms ease-in-out`;

//   // Build confirmed pit states for all drivers this render
//   const confirmedPitMap = useMemo(() => {
//     const map = new Map<string, boolean>();
//     drivers.forEach((d) => {
//       const pos      = positions[d.code];
//       const rawInPit = pos?.in_pit || false;
//       const prev     = pitCounterRef.current.get(d.code) ?? 0;
//       const next     = rawInPit ? prev + 1 : 0;
//       pitCounterRef.current.set(d.code, next);
//       map.set(d.code, next >= PIT_CONFIRM_THRESHOLD);
//     });
//     return map;
//   }, [drivers, positions]);

//   return (
//     <div className="w-full h-full">
//       <svg
//         viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
//         className="w-full h-full"
//         style={{ overflow: "visible" }}
//       >
//         {/* ── track layers ── */}
//         {/* Outer glow */}
//         <path d={trackPathD} stroke={trackColor} strokeWidth="38" fill="none"
//           strokeLinejoin="round" strokeLinecap="round" opacity="0.10" />
//         {/* Road body — wider than before so car dots sit inside it */}
//         <path d={trackPathD} stroke={trackColor} strokeWidth="22" fill="none"
//           strokeLinejoin="round" strokeLinecap="round" opacity="0.85" />
//         {/* Kerb highlight */}
//         <path d={trackPathD} stroke="#ffffff" strokeWidth="2" fill="none"
//           strokeLinejoin="round" strokeLinecap="round" opacity="0.08" />

//         {startLine && (
//           <FinishLineMark
//             finishLine={startLine}
//             trackOutline={trackOutline}
//             project={project}
//           />
//         )}

//         {/* ── cars ── */}
//         {drivers.map((d) => {
//           const pos = positions[d.code];
//           if (!pos || isNaN(pos.x) || isNaN(pos.y)) return null;

//           const { x, y }   = project(pos.x, pos.y);
//           const isPitting   = confirmedPitMap.get(d.code) ?? false;
//           const r           = isPitting ? CAR_R_PIT : CAR_R_RACING;

//           return (
//             <g key={d.code}>
//               {/* ── shadow ring (always present, gives depth) ── */}
//               <circle
//                 cx={x} cy={y} r={r + 4}
//                 fill="none" stroke="#000000" strokeWidth="4" opacity="0.35"
//                 style={{ transition: `${smoothTransform}, ${sizeTransition}` }}
//               />

//               {/* ── pit indicator ring (only visible when pitting) ── */}
//               {isPitting && (
//                 <circle
//                   cx={x} cy={y} r={r + 7}
//                   fill="none"
//                   stroke="#facc15"
//                   strokeWidth="1.5"
//                   strokeDasharray="3 3"
//                   opacity="0.7"
//                   style={{ transition: smoothTransform }}
//                 />
//               )}

//               {/* ── car body ── */}
//               <circle
//                 cx={x} cy={y} r={r}
//                 fill={isPitting ? "#4a4a4a" : d.color}
//                 stroke={isPitting ? "#888888" : "#ffffff"}
//                 strokeWidth={isPitting ? 1 : 1.5}
//                 opacity={isPitting ? 0.6 : 1}
//                 style={{ transition: `${smoothTransform}, ${sizeTransition}, opacity 200ms ease-in-out` }}
//               />

//               {/* ── driver label ── */}
//               {showNames && (
//                 <text
//                   x={x + r + 5} y={y + 4}
//                   fontSize="11" fontWeight="900"
//                   fill={isPitting ? "#888" : "#ffffff"}
//                   stroke="#000000" strokeWidth="3" paintOrder="stroke"
//                   style={{
//                     transition: textTransform,
//                     userSelect: "none",
//                     pointerEvents: "none",
//                   }}
//                 >
//                   {d.code}
//                 </text>
//               )}
//             </g>
//           );
//         })}
//       </svg>
//     </div>
//   );
// };

// export default RaceTrack;

// import { useMemo } from "react";

// export interface Driver {
//   code: string;
//   color: string;
// }

// export interface CarPosition {
//   x: number;
//   y: number;
//   lap: number | null;
//   in_pit: boolean;
// }

// export interface TrackPoint {
//   x: number;
//   y: number;
// }

// export interface Bounds {
//   x_min: number;
//   x_max: number;
//   y_min: number;
//   y_max: number;
// }

// export interface RaceTrackProps {
//   drivers: Driver[];
//   positions: Record<string, CarPosition>;
//   trackOutline: TrackPoint[];
//   bounds: Bounds;
//   flag?: string; 
// }

// const VIEWBOX_WIDTH = 1000;
// const VIEWBOX_HEIGHT = 1000;
// const PADDING = 45; 

// const FLAG_COLORS: Record<string, string> = {
//   clear: "#525252", 
//   "1": "#525252",
//   yellow: "#e6c900",
//   "2": "#e6c900",
//   red: "#dc2626",
//   "5": "#dc2626",
//   safety_car: "#f59e0b",
//   "4": "#f59e0b",
//   vsc: "#f59e0b",
//   "6": "#f59e0b",
//   vsc_ending: "#f59e0b",
//   "7": "#f59e0b",
// };

// const FLAG_LABELS: Record<string, string> = {
//   yellow: "YELLOW FLAG",
//   "2": "YELLOW FLAG",
//   red: "RED FLAG",
//   "5": "RED FLAG",
//   safety_car: "SAFETY CAR DEPLOYED",
//   "4": "SAFETY CAR DEPLOYED",
//   vsc: "VIRTUAL SAFETY CAR",
//   "6": "VIRTUAL SAFETY CAR",
//   vsc_ending: "VSC ENDING",
//   "7": "VSC ENDING",
// };

// const makeProjector = (bounds: Bounds) => {
//   const dataWidth = bounds.x_max - bounds.x_min || 1;
//   const dataHeight = bounds.y_max - bounds.y_min || 1;
//   const availableWidth = VIEWBOX_WIDTH - PADDING * 2;
//   const availableHeight = VIEWBOX_HEIGHT - PADDING * 2;
//   const scale = Math.min(availableWidth / dataWidth, availableHeight / dataHeight);
//   const offsetX = PADDING + (availableWidth - dataWidth * scale) / 2;
//   const offsetY = PADDING + (availableHeight - dataHeight * scale) / 2;

//   return (x: number, y: number) => {
//     const svgX = offsetX + (x - bounds.x_min) * scale;
//     const svgY = offsetY + (dataHeight - (y - bounds.y_min)) * scale;
//     return { x: svgX, y: svgY };
//   };
// };

// const RaceTrack = ({ drivers, positions, trackOutline, bounds, flag }: RaceTrackProps) => {
//   const project = useMemo(() => makeProjector(bounds), [bounds]);

//   const trackPathD = useMemo(() => {
//     if (!trackOutline || trackOutline.length === 0) return "";
//     const points = trackOutline.map((p) => project(p.x, p.y));
//     const [first, ...rest] = points;
//     const path = rest.reduce(
//       (acc, p) => `${acc} L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`,
//       `M ${first.x.toFixed(2)} ${first.y.toFixed(2)}`
//     );
//     return `${path} Z`;
//   }, [trackOutline, project]);

//   const safeFlag = (flag || "clear").toString().toLowerCase().trim();
//   const trackColor = FLAG_COLORS[safeFlag] || FLAG_COLORS.clear;
//   const isFlagActive = safeFlag !== "clear" && safeFlag !== "1" && !!FLAG_LABELS[safeFlag];

//   return (
//     <div className="w-full h-full flex items-center justify-center relative">
      
//       {/* 🛠️ FIX: Sleek, F1 Broadcast Style Flag Banner */}
//       {isFlagActive && (
//         <div className="absolute top-8 left-1/2 -translate-x-1/2 z-[100] flex items-stretch bg-neutral-900/95 backdrop-blur-md border border-neutral-700/50 rounded-lg shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden">
//           <div className="w-2" style={{ backgroundColor: trackColor }} />
//           <div className="px-6 py-2.5 flex items-center gap-3">
//             <span 
//               className="w-3 h-3 rounded-full animate-pulse" 
//               style={{ backgroundColor: trackColor, boxShadow: `0 0 10px ${trackColor}` }} 
//             />
//             <span className="font-black text-sm tracking-widest text-white uppercase">
//               {FLAG_LABELS[safeFlag]}
//             </span>
//           </div>
//         </div>
//       )}

//       <svg viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`} className="w-full h-full drop-shadow-2xl">
//         <path d={trackPathD} stroke={trackColor} strokeWidth="24" fill="none" strokeLinejoin="round" opacity="0.3" />
//         <path d={trackPathD} stroke={trackColor} strokeWidth="12" fill="none" strokeLinejoin="round" />
//         <path d={trackPathD} stroke="#ffffff" strokeWidth="1.5" strokeDasharray="4,6" fill="none" strokeLinejoin="round" opacity="0.4" />

//         {drivers.map((d) => {
//           const pos = positions[d.code];
//           if (!pos || isNaN(pos.x)) return null;
          
//           const { x, y } = project(pos.x, pos.y);
//           return (
//             <g key={d.code} style={{ transition: "transform 0.1s linear" }}>
//               <circle
//                 cx={x} cy={y}
//                 r="8"
//                 fill={d.color}
//                 stroke="#fff"
//                 strokeWidth="1.5"
//                 style={{ transition: "cx 0.1s linear, cy 0.1s linear" }}
//               />
//               <text
//                 x={x + 12} y={y + 3}
//                 fontSize="11"
//                 fontWeight="900"
//                 fill="#fff"
//                 className="drop-shadow-md"
//                 style={{ transition: "x 0.1s linear, y 0.1s linear" }}
//               >
//                 {d.code}
//               </text>
//             </g>
//           );
//         })}
//       </svg>
//     </div>
//   );
// };

// export default RaceTrack;

// import { useMemo } from "react";

// export interface Driver {
//   code: string;
//   color: string;
// }

// export interface CarPosition {
//   x: number;
//   y: number;
//   lap: number | null;
//   in_pit: boolean;
// }

// export interface TrackPoint {
//   x: number;
//   y: number;
// }

// export interface Bounds {
//   x_min: number;
//   x_max: number;
//   y_min: number;
//   y_max: number;
// }

// export interface FinishLine {
//   x: number;
//   y: number;
// }

// export interface RaceTrackProps {
//   drivers: Driver[];
//   positions: Record<string, CarPosition>;
//   trackOutline: TrackPoint[];
//   bounds: Bounds;
//   flag?: string;
//   showNames?: boolean;
//   finishLine?: FinishLine | null;
// }

// // ─── constants ──────────────────────────────────────────────────────────────

// const VIEWBOX_W = 1000;
// const VIEWBOX_H = 1000;
// const PADDING   = 40;

// const FLAG_TRACK_COLOR: Record<string, string> = {
//   clear:      "#4a4a4a",
//   yellow:     "#ca8a04",
//   red:        "#dc2626",
//   safety_car: "#d97706",
//   vsc:        "#d97706",
//   vsc_ending: "#d97706",
// };

// // ─── projection ─────────────────────────────────────────────────────────────

// const makeProjector = (bounds: Bounds) => {
//   const dataW = bounds.x_max - bounds.x_min || 1;
//   const dataH = bounds.y_max - bounds.y_min || 1;
//   const availW = VIEWBOX_W - PADDING * 2;
//   const availH = VIEWBOX_H - PADDING * 2;

//   // Uniform scale — keeps circuit shape undistorted
//   const scale   = Math.min(availW / dataW, availH / dataH);
//   const offsetX = PADDING + (availW - dataW * scale) / 2;
//   const offsetY = PADDING + (availH - dataH * scale) / 2;

//   return (x: number, y: number) => ({
//     x: offsetX + (x - bounds.x_min) * scale,
//     // SVG y-axis is inverted vs telemetry y-axis
//     y: offsetY + (dataH - (y - bounds.y_min)) * scale,
//   });
// };

// // ─── finish line helper ──────────────────────────────────────────────────────

// /**
//  * Draws a short perpendicular stroke across the track at the finish line.
//  * We find the two track-outline points nearest the finish-line coordinate,
//  * compute the tangent direction between them, then draw a line 90° to it.
//  */
// const FinishLineMark = ({
//   finishLine,
//   trackOutline,
//   project,
// }: {
//   finishLine: FinishLine;
//   trackOutline: TrackPoint[];
//   project: (x: number, y: number) => { x: number; y: number };
// }) => {
//   const { x: fx, y: fy } = project(finishLine.x, finishLine.y);

//   // Find the two outline points nearest the projected finish point
//   let best1 = 0, best2 = 1, bestDist = Infinity;
//   const projected = trackOutline.map((p) => project(p.x, p.y));

//   for (let i = 0; i < projected.length - 1; i++) {
//     const mx = (projected[i].x + projected[i + 1].x) / 2;
//     const my = (projected[i].y + projected[i + 1].y) / 2;
//     const d  = Math.hypot(mx - fx, my - fy);
//     if (d < bestDist) {
//       bestDist = d;
//       best1    = i;
//       best2    = i + 1;
//     }
//   }

//   // Tangent vector along the track at that point
//   const tx = projected[best2].x - projected[best1].x;
//   const ty = projected[best2].y - projected[best1].y;
//   const len = Math.hypot(tx, ty) || 1;

//   // Perpendicular = rotate tangent 90°
//   const nx = -ty / len;
//   const ny =  tx / len;

//   const half = 18; // half-length of the finish line mark in SVG units
//   const x1   = fx + nx * half;
//   const y1   = fy + ny * half;
//   const x2   = fx - nx * half;
//   const y2   = fy - ny * half;

//   return (
//     <g>
//       {/* Chequered flag effect: alternating black/white segments */}
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#000000" strokeWidth="5" strokeLinecap="round"
//         strokeDasharray="4,4" />
//       {/* Outer glow */}
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#ffffff" strokeWidth="9" strokeLinecap="round" opacity="0.15" />
//     </g>
//   );
// };

// // ─── component ──────────────────────────────────────────────────────────────

// const RaceTrack = ({
//   drivers,
//   positions,
//   trackOutline,
//   bounds,
//   flag       = "clear",
//   showNames  = false,
//   finishLine = null,
// }: RaceTrackProps) => {
//   const project = useMemo(() => makeProjector(bounds), [bounds]);

//   // Build SVG path string once — only changes when track outline or bounds change
//   const trackPathD = useMemo(() => {
//     if (!trackOutline || trackOutline.length === 0) return "";
//     const pts     = trackOutline.map((p) => project(p.x, p.y));
//     const [first, ...rest] = pts;
//     return rest.reduce(
//       (acc, p) => `${acc} L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`,
//       `M ${first.x.toFixed(1)} ${first.y.toFixed(1)}`
//     ) + " Z";
//   }, [trackOutline, project]);

//   const safeFlag   = (flag || "clear").toLowerCase().trim();
//   const trackColor = FLAG_TRACK_COLOR[safeFlag] ?? FLAG_TRACK_COLOR.clear;

//   return (
//     <div className="w-full h-full">
//       <svg
//         viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
//         className="w-full h-full"
//         style={{ overflow: "visible" }}
//       >
//         {/* ── Track rendering — 3 layered strokes ── */}

//         {/* Layer 1: wide outer glow — gives the "circuit lit up" feel */}
//         <path
//           d={trackPathD}
//           stroke={trackColor}
//           strokeWidth="28"
//           fill="none"
//           strokeLinejoin="round"
//           strokeLinecap="round"
//           opacity="0.18"
//         />

//         {/* Layer 2: main tarmac surface */}
//         <path
//           d={trackPathD}
//           stroke={trackColor}
//           strokeWidth="14"
//           fill="none"
//           strokeLinejoin="round"
//           strokeLinecap="round"
//           opacity="0.9"
//         />

//         {/* Layer 3: inner edge highlight — the bright centre line
//             subtle white line that gives the track a 3D "lit from above" feel */}
//         <path
//           d={trackPathD}
//           stroke="#ffffff"
//           strokeWidth="2"
//           fill="none"
//           strokeLinejoin="round"
//           strokeLinecap="round"
//           opacity="0.12"
//         />

//         {/* ── Finish line ── */}
//         {finishLine && (
//           <FinishLineMark
//             finishLine={finishLine}
//             trackOutline={trackOutline}
//             project={project}
//           />
//         )}

//         {/* ── Cars ── */}
//         {drivers.map((d) => {
//           const pos = positions[d.code];
//           if (!pos || isNaN(pos.x) || isNaN(pos.y)) return null;

//           const { x, y } = project(pos.x, pos.y);
//           const r        = pos.in_pit ? 5 : 8;
//           const opacity  = pos.in_pit ? 0.55 : 1;

//           return (
//             <g
//               key={d.code}
//               opacity={opacity}
//               style={{ transition: "opacity 0.3s" }}
//             >
//               {/* Drop shadow ring — makes cars pop off dark track */}
//               <circle
//                 cx={x} cy={y} r={r + 3}
//                 fill="none"
//                 stroke="#000000"
//                 strokeWidth="3"
//                 opacity="0.5"
//                 style={{ transition: "cx 0.1s linear, cy 0.1s linear" }}
//               />

//               {/* Team color fill */}
//               <circle
//                 cx={x} cy={y} r={r}
//                 fill={d.color}
//                 stroke="#ffffff"
//                 strokeWidth="1.5"
//                 style={{ transition: "cx 0.1s linear, cy 0.1s linear" }}
//               />

//               {/* Driver name — only when toggled on via L key */}
//               {showNames && (
//                 <text
//                   x={x + r + 5}
//                   y={y + 4}
//                   fontSize="11"
//                   fontWeight="900"
//                   fill="#ffffff"
//                   stroke="#000000"
//                   strokeWidth="3"
//                   paintOrder="stroke"
//                   style={{
//                     transition:     "x 0.1s linear, y 0.1s linear",
//                     userSelect:     "none",
//                     pointerEvents:  "none",
//                   }}
//                 >
//                   {d.code}
//                 </text>
//               )}
//             </g>
//           );
//         })}
//       </svg>
//     </div>
//   );
// };

// export default RaceTrack;

// import { useMemo } from "react";

// export interface Driver {
//   code: string;
//   color: string;
// }

// export interface CarPosition {
//   x: number;
//   y: number;
//   lap: number | null;
//   in_pit: boolean;
// }

// export interface TrackPoint {
//   x: number;
//   y: number;
// }

// export interface Bounds {
//   x_min: number;
//   x_max: number;
//   y_min: number;
//   y_max: number;
// }

// export interface FinishLine {
//   x: number;
//   y: number;
// }

// export interface RaceTrackProps {
//   drivers: Driver[];
//   positions: Record<string, CarPosition>;
//   trackOutline: TrackPoint[];
//   bounds: Bounds;
//   flag?: string;
//   showNames?: boolean;
//   finishLine?: FinishLine | null;
// }

// // ─── constants ──────────────────────────────────────────────────────────────

// const VIEWBOX_W = 1000;
// const VIEWBOX_H = 1000;
// // Decreased padding from 40 to 25 to increase the overall size of the track slightly
// const PADDING   = 25;

// const FLAG_TRACK_COLOR: Record<string, string> = {
//   clear:      "#4a4a4a",
//   yellow:     "#ca8a04",
//   red:        "#dc2626",
//   safety_car: "#d97706",
//   vsc:        "#d97706",
//   vsc_ending: "#d97706",
// };

// // ─── projection ─────────────────────────────────────────────────────────────

// const makeProjector = (bounds: Bounds) => {
//   const dataW = bounds.x_max - bounds.x_min || 1;
//   const dataH = bounds.y_max - bounds.y_min || 1;
//   const availW = VIEWBOX_W - PADDING * 2;
//   const availH = VIEWBOX_H - PADDING * 2;

//   // Uniform scale — keeps circuit shape undistorted
//   const scale   = Math.min(availW / dataW, availH / dataH);
//   const offsetX = PADDING + (availW - dataW * scale) / 2;
//   const offsetY = PADDING + (availH - dataH * scale) / 2;

//   return (x: number, y: number) => ({
//     x: offsetX + (x - bounds.x_min) * scale,
//     // SVG y-axis is inverted vs telemetry y-axis
//     y: offsetY + (dataH - (y - bounds.y_min)) * scale,
//   });
// };

// // ─── finish line helper ──────────────────────────────────────────────────────

// /**
//  * Draws a short perpendicular stroke across the track at the finish line.
//  * We find the two track-outline points nearest the finish-line coordinate,
//  * compute the tangent direction between them, then draw a line 90° to it.
//  */
// const FinishLineMark = ({
//   finishLine,
//   trackOutline,
//   project,
// }: {
//   finishLine: FinishLine;
//   trackOutline: TrackPoint[];
//   project: (x: number, y: number) => { x: number; y: number };
// }) => {
//   const { x: fx, y: fy } = project(finishLine.x, finishLine.y);

//   // Find the two outline points nearest the projected finish point
//   let best1 = 0, best2 = 1, bestDist = Infinity;
//   const projected = trackOutline.map((p) => project(p.x, p.y));

//   for (let i = 0; i < projected.length - 1; i++) {
//     const mx = (projected[i].x + projected[i + 1].x) / 2;
//     const my = (projected[i].y + projected[i + 1].y) / 2;
//     const d  = Math.hypot(mx - fx, my - fy);
//     if (d < bestDist) {
//       bestDist = d;
//       best1    = i;
//       best2    = i + 1;
//     }
//   }

//   // Tangent vector along the track at that point
//   const tx = projected[best2].x - projected[best1].x;
//   const ty = projected[best2].y - projected[best1].y;
//   const len = Math.hypot(tx, ty) || 1;

//   // Perpendicular = rotate tangent 90°
//   const nx = -ty / len;
//   const ny =  tx / len;

//   const half = 18; // half-length of the finish line mark in SVG units
//   const x1   = fx + nx * half;
//   const y1   = fy + ny * half;
//   const x2   = fx - nx * half;
//   const y2   = fy - ny * half;

//   return (
//     <g>
//       {/* Chequered flag effect: alternating black/white segments */}
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#000000" strokeWidth="5" strokeLinecap="round"
//         strokeDasharray="4,4" />
//       {/* Outer glow */}
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#ffffff" strokeWidth="9" strokeLinecap="round" opacity="0.15" />
//     </g>
//   );
// };

// // ─── component ──────────────────────────────────────────────────────────────

// const RaceTrack = ({
//   drivers,
//   positions,
//   trackOutline,
//   bounds,
//   flag       = "clear",
//   showNames  = false,
//   finishLine = null,
// }: RaceTrackProps) => {
//   const project = useMemo(() => makeProjector(bounds), [bounds]);

//   // Build SVG path string once — only changes when track outline or bounds change
//   const trackPathD = useMemo(() => {
//     if (!trackOutline || trackOutline.length === 0) return "";
//     const pts     = trackOutline.map((p) => project(p.x, p.y));
//     const [first, ...rest] = pts;
//     return rest.reduce(
//       (acc, p) => `${acc} L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`,
//       `M ${first.x.toFixed(1)} ${first.y.toFixed(1)}`
//     ) + " Z";
//   }, [trackOutline, project]);

//   const safeFlag   = (flag || "clear").toLowerCase().trim();
//   const trackColor = FLAG_TRACK_COLOR[safeFlag] ?? FLAG_TRACK_COLOR.clear;

//   // Fallback to the first coordinate of the track outline if no explicit finish line is provided
//   const startLine = finishLine || (trackOutline?.length > 0 ? trackOutline[0] : null);

//   return (
//     <div className="w-full h-full">
//       <svg
//         viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
//         className="w-full h-full"
//         style={{ overflow: "visible" }}
//       >
//         {/* ── Track rendering — 3 layered strokes ── */}

//         {/* Layer 1: wide outer glow — gives the "circuit lit up" feel */}
//         <path
//           d={trackPathD}
//           stroke={trackColor}
//           strokeWidth="28"
//           fill="none"
//           strokeLinejoin="round"
//           strokeLinecap="round"
//           opacity="0.18"
//         />

//         {/* Layer 2: main tarmac surface */}
//         <path
//           d={trackPathD}
//           stroke={trackColor}
//           strokeWidth="14"
//           fill="none"
//           strokeLinejoin="round"
//           strokeLinecap="round"
//           opacity="0.9"
//         />

//         {/* Layer 3: inner edge highlight — the bright centre line
//             subtle white line that gives the track a 3D "lit from above" feel */}
//         <path
//           d={trackPathD}
//           stroke="#ffffff"
//           strokeWidth="2"
//           fill="none"
//           strokeLinejoin="round"
//           strokeLinecap="round"
//           opacity="0.12"
//         />

//         {/* ── Finish line ── */}
//         {startLine && (
//           <FinishLineMark
//             finishLine={startLine}
//             trackOutline={trackOutline}
//             project={project}
//           />
//         )}

//         {/* ── Cars ── */}
//         {drivers.map((d) => {
//           const pos = positions[d.code];
//           if (!pos || isNaN(pos.x) || isNaN(pos.y)) return null;

//           const { x, y } = project(pos.x, pos.y);
//           const r        = pos.in_pit ? 5 : 8;
//           const opacity  = pos.in_pit ? 0.55 : 1;

//           return (
//             <g
//               key={d.code}
//               opacity={opacity}
//               style={{ transition: "opacity 0.3s" }}
//             >
//               {/* Drop shadow ring — makes cars pop off dark track */}
//               <circle
//                 cx={x} cy={y} r={r + 3}
//                 fill="none"
//                 stroke="#000000"
//                 strokeWidth="3"
//                 opacity="0.5"
//                 style={{ transition: "cx 0.1s linear, cy 0.1s linear" }}
//               />

//               {/* Team color fill */}
//               <circle
//                 cx={x} cy={y} r={r}
//                 fill={d.color}
//                 stroke="#ffffff"
//                 strokeWidth="1.5"
//                 style={{ transition: "cx 0.1s linear, cy 0.1s linear" }}
//               />

//               {/* Driver name — only when toggled on via L key */}
//               {showNames && (
//                 <text
//                   x={x + r + 5}
//                   y={y + 4}
//                   fontSize="11"
//                   fontWeight="900"
//                   fill="#ffffff"
//                   stroke="#000000"
//                   strokeWidth="3"
//                   paintOrder="stroke"
//                   style={{
//                     transition:     "x 0.1s linear, y 0.1s linear",
//                     userSelect:     "none",
//                     pointerEvents:  "none",
//                   }}
//                 >
//                   {d.code}
//                 </text>
//               )}
//             </g>
//           );
//         })}
//       </svg>
//     </div>
//   );
// };

// export default RaceTrack;

// import { useMemo } from "react";

// export interface Driver {
//   code: string;
//   color: string;
// }

// export interface CarPosition {
//   x: number;
//   y: number;
//   lap: number | null;
//   in_pit: boolean;
// }

// export interface TrackPoint {
//   x: number;
//   y: number;
// }

// export interface Bounds {
//   x_min: number;
//   x_max: number;
//   y_min: number;
//   y_max: number;
// }

// export interface FinishLine {
//   x: number;
//   y: number;
// }

// export interface RaceTrackProps {
//   drivers: Driver[];
//   positions: Record<string, CarPosition>;
//   trackOutline: TrackPoint[];
//   bounds: Bounds;
//   flag?: string;
//   showNames?: boolean;
//   finishLine?: FinishLine | null;
// }

// // ─── constants ──────────────────────────────────────────────────────────────

// const VIEWBOX_W = 1000;
// const VIEWBOX_H = 1000;
// // Decreased padding from 40 to 25 to increase the overall size of the track slightly
// const PADDING   = 1;

// const FLAG_TRACK_COLOR: Record<string, string> = {
//   clear:      "#4a4a4a",
//   yellow:     "#ca8a04",
//   red:        "#dc2626",
//   safety_car: "#d97706",
//   vsc:        "#d97706",
//   vsc_ending: "#d97706",
// };

// // ─── projection ─────────────────────────────────────────────────────────────

// const makeProjector = (bounds: Bounds) => {
//   const dataW = bounds.x_max - bounds.x_min || 1;
//   const dataH = bounds.y_max - bounds.y_min || 1;
//   const availW = VIEWBOX_W - PADDING * 2;
//   const availH = VIEWBOX_H - PADDING * 2;

//   // Uniform scale — keeps circuit shape undistorted
//   const scale   = Math.min(availW / dataW, availH / dataH);
//   const offsetX = PADDING + (availW - dataW * scale) / 2;
//   const offsetY = PADDING + (availH - dataH * scale) / 2;

//   return (x: number, y: number) => ({
//     x: offsetX + (x - bounds.x_min) * scale,
//     // SVG y-axis is inverted vs telemetry y-axis
//     y: offsetY + (dataH - (y - bounds.y_min)) * scale,
//   });
// };

// // ─── finish line helper ──────────────────────────────────────────────────────

// /**
//  * Draws a short perpendicular stroke across the track at the finish line.
//  * We find the two track-outline points nearest the finish-line coordinate,
//  * compute the tangent direction between them, then draw a line 90° to it.
//  */
// const FinishLineMark = ({
//   finishLine,
//   trackOutline,
//   project,
// }: {
//   finishLine: FinishLine;
//   trackOutline: TrackPoint[];
//   project: (x: number, y: number) => { x: number; y: number };
// }) => {
//   const { x: fx, y: fy } = project(finishLine.x, finishLine.y);

//   // Find the two outline points nearest the projected finish point
//   let best1 = 0, best2 = 1, bestDist = Infinity;
//   const projected = trackOutline.map((p) => project(p.x, p.y));

//   for (let i = 0; i < projected.length - 1; i++) {
//     const mx = (projected[i].x + projected[i + 1].x) / 2;
//     const my = (projected[i].y + projected[i + 1].y) / 2;
//     const d  = Math.hypot(mx - fx, my - fy);
//     if (d < bestDist) {
//       bestDist = d;
//       best1    = i;
//       best2    = i + 1;
//     }
//   }

//   // Tangent vector along the track at that point
//   const tx = projected[best2].x - projected[best1].x;
//   const ty = projected[best2].y - projected[best1].y;
//   const len = Math.hypot(tx, ty) || 1;

//   // Perpendicular = rotate tangent 90°
//   const nx = -ty / len;
//   const ny =  tx / len;

//   const half = 18; // half-length of the finish line mark in SVG units
//   const x1   = fx + nx * half;
//   const y1   = fy + ny * half;
//   const x2   = fx - nx * half;
//   const y2   = fy - ny * half;

//   return (
//     <g>
//       {/* 1. Asphalt burn / shadow (gives the paint depth) */}
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#000000" strokeWidth="8" strokeLinecap="butt" opacity="0.5" />

//       {/* 2. Base white paint layer */}
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#ffffff" strokeWidth="6" strokeLinecap="butt" />

//       {/* 3. Crisp black squares (butt cap creates sharp checkerboard boxes) */}
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#111111" strokeWidth="6" strokeLinecap="butt"
//         strokeDasharray="4,4" />

//       {/* 4. Reflective paint highlight (only on the white squares) */}
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#ffffff" strokeWidth="2" strokeLinecap="butt"
//         strokeDasharray="4,4" strokeDashoffset="4" opacity="0.9" />

//       {/* 5. Soft ambient bloom/glow to match the rest of the track */}
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#ffffff" strokeWidth="14" strokeLinecap="round" opacity="0.12" />
//     </g>
//   );
// };

// // ─── component ──────────────────────────────────────────────────────────────

// const RaceTrack = ({
//   drivers,
//   positions,
//   trackOutline,
//   bounds,
//   flag       = "clear",
//   showNames  = false,
//   finishLine = null,
// }: RaceTrackProps) => {
//   const project = useMemo(() => makeProjector(bounds), [bounds]);

//   // Build SVG path string once — only changes when track outline or bounds change
//   const trackPathD = useMemo(() => {
//     if (!trackOutline || trackOutline.length === 0) return "";
//     const pts     = trackOutline.map((p) => project(p.x, p.y));
//     const [first, ...rest] = pts;
//     return rest.reduce(
//       (acc, p) => `${acc} L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`,
//       `M ${first.x.toFixed(1)} ${first.y.toFixed(1)}`
//     ) + " Z";
//   }, [trackOutline, project]);

//   const safeFlag   = (flag || "clear").toLowerCase().trim();
//   const trackColor = FLAG_TRACK_COLOR[safeFlag] ?? FLAG_TRACK_COLOR.clear;

//   // Fallback to the first coordinate of the track outline if no explicit finish line is provided
//   const startLine = finishLine || (trackOutline?.length > 0 ? trackOutline[0] : null);

//   return (
//     <div className="w-full h-full">
//       <svg
//         viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
//         className="w-full h-full"
//         style={{ overflow: "visible" }}
//       >
//         {/* ── Track rendering — 3 layered strokes ── */}

//         {/* Layer 1: wide outer glow — gives the "circuit lit up" feel */}
//         <path
//           d={trackPathD}
//           stroke={trackColor}
//           strokeWidth="28"
//           fill="none"
//           strokeLinejoin="round"
//           strokeLinecap="round"
//           opacity="0.18"
//         />

//         {/* Layer 2: main tarmac surface */}
//         <path
//           d={trackPathD}
//           stroke={trackColor}
//           strokeWidth="14"
//           fill="none"
//           strokeLinejoin="round"
//           strokeLinecap="round"
//           opacity="0.9"
//         />

//         {/* Layer 3: inner edge highlight — the bright centre line
//             subtle white line that gives the track a 3D "lit from above" feel */}
//         <path
//           d={trackPathD}
//           stroke="#ffffff"
//           strokeWidth="2"
//           fill="none"
//           strokeLinejoin="round"
//           strokeLinecap="round"
//           opacity="0.12"
//         />

//         {/* ── Finish line ── */}
//         {startLine && (
//           <FinishLineMark
//             finishLine={startLine}
//             trackOutline={trackOutline}
//             project={project}
//           />
//         )}

//         {/* ── Cars ── */}
//         {drivers.map((d) => {
//           const pos = positions[d.code];
//           if (!pos || isNaN(pos.x) || isNaN(pos.y)) return null;

//           const { x, y } = project(pos.x, pos.y);
//           const r        = pos.in_pit ? 5 : 8;
//           const opacity  = pos.in_pit ? 0.55 : 1;

//           return (
//             <g
//               key={d.code}
//               opacity={opacity}
//               style={{ transition: "opacity 0.3s" }}
//             >
//               {/* Drop shadow ring — makes cars pop off dark track */}
//               <circle
//                 cx={x} cy={y} r={r + 3}
//                 fill="none"
//                 stroke="#000000"
//                 strokeWidth="3"
//                 opacity="0.5"
//                 style={{ transition: "cx 0.1s linear, cy 0.1s linear" }}
//               />

//               {/* Team color fill */}
//               <circle
//                 cx={x} cy={y} r={r}
//                 fill={d.color}
//                 stroke="#ffffff"
//                 strokeWidth="1.5"
//                 style={{ transition: "cx 0.1s linear, cy 0.1s linear" }}
//               />

//               {/* Driver name — only when toggled on via L key */}
//               {showNames && (
//                 <text
//                   x={x + r + 5}
//                   y={y + 4}
//                   fontSize="11"
//                   fontWeight="900"
//                   fill="#ffffff"
//                   stroke="#000000"
//                   strokeWidth="3"
//                   paintOrder="stroke"
//                   style={{
//                     transition:     "x 0.1s linear, y 0.1s linear",
//                     userSelect:     "none",
//                     pointerEvents:  "none",
//                   }}
//                 >
//                   {d.code}
//                 </text>
//               )}
//             </g>
//           );
//         })}
//       </svg>
//     </div>
//   );
// };

// export default RaceTrack;\\
// import { useMemo } from "react";

// export interface Driver {
//   code: string;
//   color: string;
// }

// export interface CarPosition {
//   x: number;
//   y: number;
//   lap: number | null;
//   in_pit: boolean;
// }

// export interface TrackPoint {
//   x: number;
//   y: number;
// }

// export interface Bounds {
//   x_min: number;
//   x_max: number;
//   y_min: number;
//   y_max: number;
// }

// export interface FinishLine {
//   x: number;
//   y: number;
// }

// export interface RaceTrackProps {
//   drivers: Driver[];
//   positions: Record<string, CarPosition>;
//   trackOutline: TrackPoint[];
//   bounds: Bounds;
//   flag?: string;
//   showNames?: boolean;
//   finishLine?: FinishLine | null;
//   transitionMs?: number; // 🛠️ NEW: Dynamic sync for smooth gliding
// }

// // ─── constants ──────────────────────────────────────────────────────────────

// const VIEWBOX_W = 1000;
// const VIEWBOX_H = 1000;
// const PADDING   = 1;

// const FLAG_TRACK_COLOR: Record<string, string> = {
//   clear:      "#4a4a4a",
//   yellow:     "#ca8a04",
//   red:        "#dc2626",
//   safety_car: "#d97706",
//   vsc:        "#d97706",
//   vsc_ending: "#d97706",
// };

// // ─── projection ─────────────────────────────────────────────────────────────

// const makeProjector = (bounds: Bounds) => {
//   const dataW = bounds.x_max - bounds.x_min || 1;
//   const dataH = bounds.y_max - bounds.y_min || 1;
//   const availW = VIEWBOX_W - PADDING * 2;
//   const availH = VIEWBOX_H - PADDING * 2;

//   const scale   = Math.min(availW / dataW, availH / dataH);
//   const offsetX = PADDING + (availW - dataW * scale) / 2;
//   const offsetY = PADDING + (availH - dataH * scale) / 2;

//   return (x: number, y: number) => ({
//     x: offsetX + (x - bounds.x_min) * scale,
//     y: offsetY + (dataH - (y - bounds.y_min)) * scale,
//   });
// };

// // ─── finish line helper ──────────────────────────────────────────────────────

// const FinishLineMark = ({
//   finishLine,
//   trackOutline,
//   project,
// }: {
//   finishLine: FinishLine;
//   trackOutline: TrackPoint[];
//   project: (x: number, y: number) => { x: number; y: number };
// }) => {
//   const { x: fx, y: fy } = project(finishLine.x, finishLine.y);

//   let best1 = 0, best2 = 1, bestDist = Infinity;
//   const projected = trackOutline.map((p) => project(p.x, p.y));

//   for (let i = 0; i < projected.length - 1; i++) {
//     const mx = (projected[i].x + projected[i + 1].x) / 2;
//     const my = (projected[i].y + projected[i + 1].y) / 2;
//     const d  = Math.hypot(mx - fx, my - fy);
//     if (d < bestDist) {
//       bestDist = d;
//       best1    = i;
//       best2    = i + 1;
//     }
//   }

//   const tx = projected[best2].x - projected[best1].x;
//   const ty = projected[best2].y - projected[best1].y;
//   const len = Math.hypot(tx, ty) || 1;

//   const nx = -ty / len;
//   const ny =  tx / len;

//   const half = 18; 
//   const x1   = fx + nx * half;
//   const y1   = fy + ny * half;
//   const x2   = fx - nx * half;
//   const y2   = fy - ny * half;

//   return (
//     <g>
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#000000" strokeWidth="8" strokeLinecap="butt" opacity="0.5" />
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#ffffff" strokeWidth="6" strokeLinecap="butt" />
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#111111" strokeWidth="6" strokeLinecap="butt"
//         strokeDasharray="4,4" />
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#ffffff" strokeWidth="2" strokeLinecap="butt"
//         strokeDasharray="4,4" strokeDashoffset="4" opacity="0.9" />
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#ffffff" strokeWidth="14" strokeLinecap="round" opacity="0.12" />
//     </g>
//   );
// };

// // ─── component ──────────────────────────────────────────────────────────────

// const RaceTrack = ({
//   drivers,
//   positions,
//   trackOutline,
//   bounds,
//   flag       = "clear",
//   showNames  = false,
//   finishLine = null,
//   transitionMs = 300, 
// }: RaceTrackProps) => {
//   const project = useMemo(() => makeProjector(bounds), [bounds]);

//   const trackPathD = useMemo(() => {
//     if (!trackOutline || trackOutline.length === 0) return "";
//     const pts     = trackOutline.map((p) => project(p.x, p.y));
//     const [first, ...rest] = pts;
//     return rest.reduce(
//       // 🛠️ FIX: Removed .toFixed(1) to stop the track line from rounding/shifting under the cars
//       (acc, p) => `${acc} L ${p.x.toFixed(3)} ${p.y.toFixed(3)}`,
//       `M ${first.x.toFixed(3)} ${first.y.toFixed(3)}`
//     ) + " Z";
//   }, [trackOutline, project]);

//   const safeFlag   = (flag || "clear").toLowerCase().trim();
//   const trackColor = FLAG_TRACK_COLOR[safeFlag] ?? FLAG_TRACK_COLOR.clear;
//   const startLine = finishLine || (trackOutline?.length > 0 ? trackOutline[0] : null);

//   // 🛠️ FIX: Perfect timing sync for CSS transitions
//   const smoothTransform = `cx ${transitionMs}ms linear, cy ${transitionMs}ms linear`;
//   const textTransform = `x ${transitionMs}ms linear, y ${transitionMs}ms linear`;

//   return (
//     <div className="w-full h-full">
//       <svg
//         viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
//         className="w-full h-full"
//         style={{ overflow: "visible" }}
//       >
//         <path d={trackPathD} stroke={trackColor} strokeWidth="28" fill="none" strokeLinejoin="round" strokeLinecap="round" opacity="0.18" />
//         <path d={trackPathD} stroke={trackColor} strokeWidth="14" fill="none" strokeLinejoin="round" strokeLinecap="round" opacity="0.9" />
//         <path d={trackPathD} stroke="#ffffff" strokeWidth="2" fill="none" strokeLinejoin="round" strokeLinecap="round" opacity="0.12" />

//         {startLine && (
//           <FinishLineMark finishLine={startLine} trackOutline={trackOutline} project={project} />
//         )}

//         {drivers.map((d) => {
//           const pos = positions[d.code];
//           if (!pos || isNaN(pos.x) || isNaN(pos.y)) return null;

//           const { x, y } = project(pos.x, pos.y);
//           // 🛠️ FIX: Locked all cars to size 8, regardless of pitting
//           const r = 8;
//           const opacity = pos.in_pit ? 0.55 : 1;

//           return (
//             <g key={d.code} opacity={opacity} style={{ transition: "opacity 0.2s" }}>
//               <circle
//                 cx={x} cy={y} r={r + 3}
//                 fill="none" stroke="#000000" strokeWidth="3" opacity="0.5"
//                 style={{ transition: smoothTransform }}
//               />
//               <circle
//                 cx={x} cy={y} r={r}
//                 fill={d.color} stroke="#ffffff" strokeWidth="1.5"
//                 style={{ transition: smoothTransform }}
//               />
//               {showNames && (
//                 <text
//                   x={x + r + 5} y={y + 4}
//                   fontSize="11" fontWeight="900" fill="#ffffff" stroke="#000000" strokeWidth="3" paintOrder="stroke"
//                   style={{ transition: textTransform, userSelect: "none", pointerEvents: "none" }}
//                 >
//                   {d.code}
//                 </text>
//               )}
//             </g>
//           );
//         })}
//       </svg>
//     </div>
//   );
// };

// export default RaceTrack;

// import { useMemo, useRef } from "react";

// export interface Driver {
//   code: string;
//   color: string;
// }

// export interface CarPosition {
//   x: number;
//   y: number;
//   lap: number | null;
//   in_pit: boolean;
// }

// export interface TrackPoint {
//   x: number;
//   y: number;
// }

// export interface Bounds {
//   x_min: number;
//   x_max: number;
//   y_min: number;
//   y_max: number;
// }

// export interface FinishLine {
//   x: number;
//   y: number;
// }

// export interface RaceTrackProps {
//   drivers: Driver[];
//   positions: Record<string, CarPosition>;
//   trackOutline: TrackPoint[];
//   bounds: Bounds;
//   flag?: string;
//   showNames?: boolean;
//   finishLine?: FinishLine | null;
//   transitionMs?: number;
//   // Set of driver codes who have retired — their circles are removed from the track entirely.
//   // The backend keeps sending their last known coordinates, so we must filter them out explicitly.
//   retiredDrivers?: Set<string>;
// }

// // ─── constants ───────────────────────────────────────────────────────────────

// const VIEWBOX_W = 1000;
// const VIEWBOX_H = 1000;
// // Generous padding so cars at the edge are never clipped
// const PADDING   = 40;

// // Car sizes
// const CAR_R_RACING = 8;
// const CAR_R_PIT    = 5;

// // Pit debounce: how many consecutive in_pit=true frames before we confirm pit state.
// // Must match Leaderboard.tsx so both update at the same frame.
// const PIT_CONFIRM_THRESHOLD = 3;

// const FLAG_TRACK_COLOR: Record<string, string> = {
//   clear:      "#5a5a5a",
//   yellow:     "#ca8a04",
//   red:        "#dc2626",
//   safety_car: "#d97706",
//   vsc:        "#d97706",
//   vsc_ending: "#d97706",
// };

// // ─── projection ──────────────────────────────────────────────────────────────

// const makeProjector = (bounds: Bounds) => {
//   const dataW  = bounds.x_max - bounds.x_min || 1;
//   const dataH  = bounds.y_max - bounds.y_min || 1;
//   const availW = VIEWBOX_W - PADDING * 2;
//   const availH = VIEWBOX_H - PADDING * 2;

//   const scale   = Math.min(availW / dataW, availH / dataH);
//   const offsetX = PADDING + (availW - dataW * scale) / 2;
//   const offsetY = PADDING + (availH - dataH * scale) / 2;

//   return (x: number, y: number) => ({
//     x: offsetX + (x - bounds.x_min) * scale,
//     // FastF1 Y increases upward, SVG Y increases downward — flip it
//     y: offsetY + (dataH - (y - bounds.y_min)) * scale,
//   });
// };

// // ─── finish line ─────────────────────────────────────────────────────────────

// const FinishLineMark = ({
//   finishLine,
//   trackOutline,
//   project,
// }: {
//   finishLine: FinishLine;
//   trackOutline: TrackPoint[];
//   project: (x: number, y: number) => { x: number; y: number };
// }) => {
//   const { x: fx, y: fy } = project(finishLine.x, finishLine.y);
//   const projected = trackOutline.map((p) => project(p.x, p.y));

//   let best1 = 0, best2 = 1, bestDist = Infinity;
//   for (let i = 0; i < projected.length - 1; i++) {
//     const mx = (projected[i].x + projected[i + 1].x) / 2;
//     const my = (projected[i].y + projected[i + 1].y) / 2;
//     const d  = Math.hypot(mx - fx, my - fy);
//     if (d < bestDist) { bestDist = d; best1 = i; best2 = i + 1; }
//   }

//   const tx  = projected[best2].x - projected[best1].x;
//   const ty  = projected[best2].y - projected[best1].y;
//   const len = Math.hypot(tx, ty) || 1;
//   const nx  = -ty / len;
//   const ny  =  tx / len;
//   const half = 20;

//   const x1 = fx + nx * half, y1 = fy + ny * half;
//   const x2 = fx - nx * half, y2 = fy - ny * half;

//   return (
//     <g>
//       <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#000" strokeWidth="10" strokeLinecap="butt" opacity="0.4" />
//       <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#fff" strokeWidth="7"  strokeLinecap="butt" />
//       <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#111" strokeWidth="7"  strokeLinecap="butt" strokeDasharray="5,5" />
//       <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#fff" strokeWidth="2"  strokeLinecap="butt" strokeDasharray="5,5" strokeDashoffset="5" opacity="0.9" />
//       <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#fff" strokeWidth="16" strokeLinecap="round" opacity="0.08" />
//     </g>
//   );
// };

// // ─── main component ──────────────────────────────────────────────────────────

// const RaceTrack = ({
//   drivers,
//   positions,
//   trackOutline,
//   bounds,
//   flag            = "clear",
//   showNames       = false,
//   finishLine      = null,
//   transitionMs    = 300,
//   retiredDrivers  = new Set<string>(),
// }: RaceTrackProps) => {
//   const project = useMemo(() => makeProjector(bounds), [bounds]);

//   // ── debounced pit state (mirrors Leaderboard.tsx logic exactly) ──
//   const pitCounterRef = useRef<Map<string, number>>(new Map());

//   const trackPathD = useMemo(() => {
//     if (!trackOutline || trackOutline.length === 0) return "";
//     const pts          = trackOutline.map((p) => project(p.x, p.y));
//     const [first, ...rest] = pts;
//     return (
//       rest.reduce(
//         (acc, p) => `${acc} L ${p.x.toFixed(3)} ${p.y.toFixed(3)}`,
//         `M ${first.x.toFixed(3)} ${first.y.toFixed(3)}`
//       ) + " Z"
//     );
//   }, [trackOutline, project]);

//   const safeFlag   = (flag || "clear").toLowerCase().trim();
//   const trackColor = FLAG_TRACK_COLOR[safeFlag] ?? FLAG_TRACK_COLOR.clear;
//   const startLine  = finishLine || (trackOutline?.length > 0 ? trackOutline[0] : null);

//   const smoothTransform = `cx ${transitionMs}ms linear, cy ${transitionMs}ms linear`;
//   const textTransform   = `x ${transitionMs}ms linear, y ${transitionMs}ms linear`;
//   const sizeTransition  = `r 200ms ease-in-out`;

//   // Build confirmed pit states for all drivers this render
//   const confirmedPitMap = useMemo(() => {
//     const map = new Map<string, boolean>();
//     drivers.forEach((d) => {
//       const pos      = positions[d.code];
//       const rawInPit = pos?.in_pit || false;
//       const prev     = pitCounterRef.current.get(d.code) ?? 0;
//       const next     = rawInPit ? prev + 1 : 0;
//       pitCounterRef.current.set(d.code, next);
//       map.set(d.code, next >= PIT_CONFIRM_THRESHOLD);
//     });
//     return map;
//   }, [drivers, positions]);

//   return (
//     <div className="w-full h-full">
//       <svg
//         viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
//         className="w-full h-full"
//         style={{ overflow: "visible" }}
//       >
//         {/* ── track layers ── */}
//         {/* Outer glow */}
//         <path d={trackPathD} stroke={trackColor} strokeWidth="38" fill="none"
//           strokeLinejoin="round" strokeLinecap="round" opacity="0.10" />
//         {/* Road body — wider than before so car dots sit inside it */}
//         <path d={trackPathD} stroke={trackColor} strokeWidth="22" fill="none"
//           strokeLinejoin="round" strokeLinecap="round" opacity="0.85" />
//         {/* Kerb highlight */}
//         <path d={trackPathD} stroke="#ffffff" strokeWidth="2" fill="none"
//           strokeLinejoin="round" strokeLinecap="round" opacity="0.08" />

//         {startLine && (
//           <FinishLineMark
//             finishLine={startLine}
//             trackOutline={trackOutline}
//             project={project}
//           />
//         )}

//         {/* ── cars ── */}
//         {drivers.map((d) => {
//           // Retired drivers: backend keeps sending last known coordinates,
//           // so we must explicitly skip them here rather than relying on !pos.
//           if (retiredDrivers.has(d.code)) return null;

//           const pos = positions[d.code];
//           if (!pos || isNaN(pos.x) || isNaN(pos.y)) return null;

//           const { x, y }   = project(pos.x, pos.y);
//           const isPitting   = confirmedPitMap.get(d.code) ?? false;
//           const r           = isPitting ? CAR_R_PIT : CAR_R_RACING;

//           return (
//             <g key={d.code}>
//               {/* ── shadow ring (always present, gives depth) ── */}
//               <circle
//                 cx={x} cy={y} r={r + 4}
//                 fill="none" stroke="#000000" strokeWidth="4" opacity="0.35"
//                 style={{ transition: `${smoothTransform}, ${sizeTransition}` }}
//               />

//               {/* ── pit indicator ring (only visible when pitting) ── */}
//               {isPitting && (
//                 <circle
//                   cx={x} cy={y} r={r + 7}
//                   fill="none"
//                   stroke="#facc15"
//                   strokeWidth="1.5"
//                   strokeDasharray="3 3"
//                   opacity="0.7"
//                   style={{ transition: smoothTransform }}
//                 />
//               )}

//               {/* ── car body ── */}
//               <circle
//                 cx={x} cy={y} r={r}
//                 fill={isPitting ? "#4a4a4a" : d.color}
//                 stroke={isPitting ? "#888888" : "#ffffff"}
//                 strokeWidth={isPitting ? 1 : 1.5}
//                 opacity={isPitting ? 0.6 : 1}
//                 style={{ transition: `${smoothTransform}, ${sizeTransition}, opacity 200ms ease-in-out` }}
//               />

//               {/* ── driver label ── */}
//               {showNames && (
//                 <text
//                   x={x + r + 5} y={y + 4}
//                   fontSize="11" fontWeight="900"
//                   fill={isPitting ? "#888" : "#ffffff"}
//                   stroke="#000000" strokeWidth="3" paintOrder="stroke"
//                   style={{
//                     transition: textTransform,
//                     userSelect: "none",
//                     pointerEvents: "none",
//                   }}
//                 >
//                   {d.code}
//                 </text>
//               )}
//             </g>
//           );
//         })}
//       </svg>
//     </div>
//   );
// };

// export default RaceTrack;

// import { useMemo } from "react";

// export interface Driver {
//   code: string;
//   color: string;
// }

// export interface CarPosition {
//   x: number;
//   y: number;
//   lap: number | null;
//   in_pit: boolean;
// }

// export interface TrackPoint {
//   x: number;
//   y: number;
// }

// export interface Bounds {
//   x_min: number;
//   x_max: number;
//   y_min: number;
//   y_max: number;
// }

// export interface RaceTrackProps {
//   drivers: Driver[];
//   positions: Record<string, CarPosition>;
//   trackOutline: TrackPoint[];
//   bounds: Bounds;
//   flag?: string; 
// }

// const VIEWBOX_WIDTH = 1000;
// const VIEWBOX_HEIGHT = 1000;
// const PADDING = 45; 

// const FLAG_COLORS: Record<string, string> = {
//   clear: "#525252", 
//   "1": "#525252",
//   yellow: "#e6c900",
//   "2": "#e6c900",
//   red: "#dc2626",
//   "5": "#dc2626",
//   safety_car: "#f59e0b",
//   "4": "#f59e0b",
//   vsc: "#f59e0b",
//   "6": "#f59e0b",
//   vsc_ending: "#f59e0b",
//   "7": "#f59e0b",
// };

// const FLAG_LABELS: Record<string, string> = {
//   yellow: "YELLOW FLAG",
//   "2": "YELLOW FLAG",
//   red: "RED FLAG",
//   "5": "RED FLAG",
//   safety_car: "SAFETY CAR DEPLOYED",
//   "4": "SAFETY CAR DEPLOYED",
//   vsc: "VIRTUAL SAFETY CAR",
//   "6": "VIRTUAL SAFETY CAR",
//   vsc_ending: "VSC ENDING",
//   "7": "VSC ENDING",
// };

// const makeProjector = (bounds: Bounds) => {
//   const dataWidth = bounds.x_max - bounds.x_min || 1;
//   const dataHeight = bounds.y_max - bounds.y_min || 1;
//   const availableWidth = VIEWBOX_WIDTH - PADDING * 2;
//   const availableHeight = VIEWBOX_HEIGHT - PADDING * 2;
//   const scale = Math.min(availableWidth / dataWidth, availableHeight / dataHeight);
//   const offsetX = PADDING + (availableWidth - dataWidth * scale) / 2;
//   const offsetY = PADDING + (availableHeight - dataHeight * scale) / 2;

//   return (x: number, y: number) => {
//     const svgX = offsetX + (x - bounds.x_min) * scale;
//     const svgY = offsetY + (dataHeight - (y - bounds.y_min)) * scale;
//     return { x: svgX, y: svgY };
//   };
// };

// const RaceTrack = ({ drivers, positions, trackOutline, bounds, flag }: RaceTrackProps) => {
//   const project = useMemo(() => makeProjector(bounds), [bounds]);

//   const trackPathD = useMemo(() => {
//     if (!trackOutline || trackOutline.length === 0) return "";
//     const points = trackOutline.map((p) => project(p.x, p.y));
//     const [first, ...rest] = points;
//     const path = rest.reduce(
//       (acc, p) => `${acc} L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`,
//       `M ${first.x.toFixed(2)} ${first.y.toFixed(2)}`
//     );
//     return `${path} Z`;
//   }, [trackOutline, project]);

//   const safeFlag = (flag || "clear").toString().toLowerCase().trim();
//   const trackColor = FLAG_COLORS[safeFlag] || FLAG_COLORS.clear;
//   const isFlagActive = safeFlag !== "clear" && safeFlag !== "1" && !!FLAG_LABELS[safeFlag];

//   return (
//     <div className="w-full h-full flex items-center justify-center relative">
      
//       {/* 🛠️ FIX: Sleek, F1 Broadcast Style Flag Banner */}
//       {isFlagActive && (
//         <div className="absolute top-8 left-1/2 -translate-x-1/2 z-[100] flex items-stretch bg-neutral-900/95 backdrop-blur-md border border-neutral-700/50 rounded-lg shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden">
//           <div className="w-2" style={{ backgroundColor: trackColor }} />
//           <div className="px-6 py-2.5 flex items-center gap-3">
//             <span 
//               className="w-3 h-3 rounded-full animate-pulse" 
//               style={{ backgroundColor: trackColor, boxShadow: `0 0 10px ${trackColor}` }} 
//             />
//             <span className="font-black text-sm tracking-widest text-white uppercase">
//               {FLAG_LABELS[safeFlag]}
//             </span>
//           </div>
//         </div>
//       )}

//       <svg viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`} className="w-full h-full drop-shadow-2xl">
//         <path d={trackPathD} stroke={trackColor} strokeWidth="24" fill="none" strokeLinejoin="round" opacity="0.3" />
//         <path d={trackPathD} stroke={trackColor} strokeWidth="12" fill="none" strokeLinejoin="round" />
//         <path d={trackPathD} stroke="#ffffff" strokeWidth="1.5" strokeDasharray="4,6" fill="none" strokeLinejoin="round" opacity="0.4" />

//         {drivers.map((d) => {
//           const pos = positions[d.code];
//           if (!pos || isNaN(pos.x)) return null;
          
//           const { x, y } = project(pos.x, pos.y);
//           return (
//             <g key={d.code} style={{ transition: "transform 0.1s linear" }}>
//               <circle
//                 cx={x} cy={y}
//                 r="8"
//                 fill={d.color}
//                 stroke="#fff"
//                 strokeWidth="1.5"
//                 style={{ transition: "cx 0.1s linear, cy 0.1s linear" }}
//               />
//               <text
//                 x={x + 12} y={y + 3}
//                 fontSize="11"
//                 fontWeight="900"
//                 fill="#fff"
//                 className="drop-shadow-md"
//                 style={{ transition: "x 0.1s linear, y 0.1s linear" }}
//               >
//                 {d.code}
//               </text>
//             </g>
//           );
//         })}
//       </svg>
//     </div>
//   );
// };

// export default RaceTrack;

// import { useMemo } from "react";

// export interface Driver {
//   code: string;
//   color: string;
// }

// export interface CarPosition {
//   x: number;
//   y: number;
//   lap: number | null;
//   in_pit: boolean;
// }

// export interface TrackPoint {
//   x: number;
//   y: number;
// }

// export interface Bounds {
//   x_min: number;
//   x_max: number;
//   y_min: number;
//   y_max: number;
// }

// export interface FinishLine {
//   x: number;
//   y: number;
// }

// export interface RaceTrackProps {
//   drivers: Driver[];
//   positions: Record<string, CarPosition>;
//   trackOutline: TrackPoint[];
//   bounds: Bounds;
//   flag?: string;
//   showNames?: boolean;
//   finishLine?: FinishLine | null;
// }

// // ─── constants ──────────────────────────────────────────────────────────────

// const VIEWBOX_W = 1000;
// const VIEWBOX_H = 1000;
// const PADDING   = 40;

// const FLAG_TRACK_COLOR: Record<string, string> = {
//   clear:      "#4a4a4a",
//   yellow:     "#ca8a04",
//   red:        "#dc2626",
//   safety_car: "#d97706",
//   vsc:        "#d97706",
//   vsc_ending: "#d97706",
// };

// // ─── projection ─────────────────────────────────────────────────────────────

// const makeProjector = (bounds: Bounds) => {
//   const dataW = bounds.x_max - bounds.x_min || 1;
//   const dataH = bounds.y_max - bounds.y_min || 1;
//   const availW = VIEWBOX_W - PADDING * 2;
//   const availH = VIEWBOX_H - PADDING * 2;

//   // Uniform scale — keeps circuit shape undistorted
//   const scale   = Math.min(availW / dataW, availH / dataH);
//   const offsetX = PADDING + (availW - dataW * scale) / 2;
//   const offsetY = PADDING + (availH - dataH * scale) / 2;

//   return (x: number, y: number) => ({
//     x: offsetX + (x - bounds.x_min) * scale,
//     // SVG y-axis is inverted vs telemetry y-axis
//     y: offsetY + (dataH - (y - bounds.y_min)) * scale,
//   });
// };

// // ─── finish line helper ──────────────────────────────────────────────────────

// /**
//  * Draws a short perpendicular stroke across the track at the finish line.
//  * We find the two track-outline points nearest the finish-line coordinate,
//  * compute the tangent direction between them, then draw a line 90° to it.
//  */
// const FinishLineMark = ({
//   finishLine,
//   trackOutline,
//   project,
// }: {
//   finishLine: FinishLine;
//   trackOutline: TrackPoint[];
//   project: (x: number, y: number) => { x: number; y: number };
// }) => {
//   const { x: fx, y: fy } = project(finishLine.x, finishLine.y);

//   // Find the two outline points nearest the projected finish point
//   let best1 = 0, best2 = 1, bestDist = Infinity;
//   const projected = trackOutline.map((p) => project(p.x, p.y));

//   for (let i = 0; i < projected.length - 1; i++) {
//     const mx = (projected[i].x + projected[i + 1].x) / 2;
//     const my = (projected[i].y + projected[i + 1].y) / 2;
//     const d  = Math.hypot(mx - fx, my - fy);
//     if (d < bestDist) {
//       bestDist = d;
//       best1    = i;
//       best2    = i + 1;
//     }
//   }

//   // Tangent vector along the track at that point
//   const tx = projected[best2].x - projected[best1].x;
//   const ty = projected[best2].y - projected[best1].y;
//   const len = Math.hypot(tx, ty) || 1;

//   // Perpendicular = rotate tangent 90°
//   const nx = -ty / len;
//   const ny =  tx / len;

//   const half = 18; // half-length of the finish line mark in SVG units
//   const x1   = fx + nx * half;
//   const y1   = fy + ny * half;
//   const x2   = fx - nx * half;
//   const y2   = fy - ny * half;

//   return (
//     <g>
//       {/* Chequered flag effect: alternating black/white segments */}
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#000000" strokeWidth="5" strokeLinecap="round"
//         strokeDasharray="4,4" />
//       {/* Outer glow */}
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#ffffff" strokeWidth="9" strokeLinecap="round" opacity="0.15" />
//     </g>
//   );
// };

// // ─── component ──────────────────────────────────────────────────────────────

// const RaceTrack = ({
//   drivers,
//   positions,
//   trackOutline,
//   bounds,
//   flag       = "clear",
//   showNames  = false,
//   finishLine = null,
// }: RaceTrackProps) => {
//   const project = useMemo(() => makeProjector(bounds), [bounds]);

//   // Build SVG path string once — only changes when track outline or bounds change
//   const trackPathD = useMemo(() => {
//     if (!trackOutline || trackOutline.length === 0) return "";
//     const pts     = trackOutline.map((p) => project(p.x, p.y));
//     const [first, ...rest] = pts;
//     return rest.reduce(
//       (acc, p) => `${acc} L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`,
//       `M ${first.x.toFixed(1)} ${first.y.toFixed(1)}`
//     ) + " Z";
//   }, [trackOutline, project]);

//   const safeFlag   = (flag || "clear").toLowerCase().trim();
//   const trackColor = FLAG_TRACK_COLOR[safeFlag] ?? FLAG_TRACK_COLOR.clear;

//   return (
//     <div className="w-full h-full">
//       <svg
//         viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
//         className="w-full h-full"
//         style={{ overflow: "visible" }}
//       >
//         {/* ── Track rendering — 3 layered strokes ── */}

//         {/* Layer 1: wide outer glow — gives the "circuit lit up" feel */}
//         <path
//           d={trackPathD}
//           stroke={trackColor}
//           strokeWidth="28"
//           fill="none"
//           strokeLinejoin="round"
//           strokeLinecap="round"
//           opacity="0.18"
//         />

//         {/* Layer 2: main tarmac surface */}
//         <path
//           d={trackPathD}
//           stroke={trackColor}
//           strokeWidth="14"
//           fill="none"
//           strokeLinejoin="round"
//           strokeLinecap="round"
//           opacity="0.9"
//         />

//         {/* Layer 3: inner edge highlight — the bright centre line
//             subtle white line that gives the track a 3D "lit from above" feel */}
//         <path
//           d={trackPathD}
//           stroke="#ffffff"
//           strokeWidth="2"
//           fill="none"
//           strokeLinejoin="round"
//           strokeLinecap="round"
//           opacity="0.12"
//         />

//         {/* ── Finish line ── */}
//         {finishLine && (
//           <FinishLineMark
//             finishLine={finishLine}
//             trackOutline={trackOutline}
//             project={project}
//           />
//         )}

//         {/* ── Cars ── */}
//         {drivers.map((d) => {
//           const pos = positions[d.code];
//           if (!pos || isNaN(pos.x) || isNaN(pos.y)) return null;

//           const { x, y } = project(pos.x, pos.y);
//           const r        = pos.in_pit ? 5 : 8;
//           const opacity  = pos.in_pit ? 0.55 : 1;

//           return (
//             <g
//               key={d.code}
//               opacity={opacity}
//               style={{ transition: "opacity 0.3s" }}
//             >
//               {/* Drop shadow ring — makes cars pop off dark track */}
//               <circle
//                 cx={x} cy={y} r={r + 3}
//                 fill="none"
//                 stroke="#000000"
//                 strokeWidth="3"
//                 opacity="0.5"
//                 style={{ transition: "cx 0.1s linear, cy 0.1s linear" }}
//               />

//               {/* Team color fill */}
//               <circle
//                 cx={x} cy={y} r={r}
//                 fill={d.color}
//                 stroke="#ffffff"
//                 strokeWidth="1.5"
//                 style={{ transition: "cx 0.1s linear, cy 0.1s linear" }}
//               />

//               {/* Driver name — only when toggled on via L key */}
//               {showNames && (
//                 <text
//                   x={x + r + 5}
//                   y={y + 4}
//                   fontSize="11"
//                   fontWeight="900"
//                   fill="#ffffff"
//                   stroke="#000000"
//                   strokeWidth="3"
//                   paintOrder="stroke"
//                   style={{
//                     transition:     "x 0.1s linear, y 0.1s linear",
//                     userSelect:     "none",
//                     pointerEvents:  "none",
//                   }}
//                 >
//                   {d.code}
//                 </text>
//               )}
//             </g>
//           );
//         })}
//       </svg>
//     </div>
//   );
// };

// export default RaceTrack;

// import { useMemo } from "react";

// export interface Driver {
//   code: string;
//   color: string;
// }

// export interface CarPosition {
//   x: number;
//   y: number;
//   lap: number | null;
//   in_pit: boolean;
// }

// export interface TrackPoint {
//   x: number;
//   y: number;
// }

// export interface Bounds {
//   x_min: number;
//   x_max: number;
//   y_min: number;
//   y_max: number;
// }

// export interface FinishLine {
//   x: number;
//   y: number;
// }

// export interface RaceTrackProps {
//   drivers: Driver[];
//   positions: Record<string, CarPosition>;
//   trackOutline: TrackPoint[];
//   bounds: Bounds;
//   flag?: string;
//   showNames?: boolean;
//   finishLine?: FinishLine | null;
// }

// // ─── constants ──────────────────────────────────────────────────────────────

// const VIEWBOX_W = 1000;
// const VIEWBOX_H = 1000;
// // Decreased padding from 40 to 25 to increase the overall size of the track slightly
// const PADDING   = 25;

// const FLAG_TRACK_COLOR: Record<string, string> = {
//   clear:      "#4a4a4a",
//   yellow:     "#ca8a04",
//   red:        "#dc2626",
//   safety_car: "#d97706",
//   vsc:        "#d97706",
//   vsc_ending: "#d97706",
// };

// // ─── projection ─────────────────────────────────────────────────────────────

// const makeProjector = (bounds: Bounds) => {
//   const dataW = bounds.x_max - bounds.x_min || 1;
//   const dataH = bounds.y_max - bounds.y_min || 1;
//   const availW = VIEWBOX_W - PADDING * 2;
//   const availH = VIEWBOX_H - PADDING * 2;

//   // Uniform scale — keeps circuit shape undistorted
//   const scale   = Math.min(availW / dataW, availH / dataH);
//   const offsetX = PADDING + (availW - dataW * scale) / 2;
//   const offsetY = PADDING + (availH - dataH * scale) / 2;

//   return (x: number, y: number) => ({
//     x: offsetX + (x - bounds.x_min) * scale,
//     // SVG y-axis is inverted vs telemetry y-axis
//     y: offsetY + (dataH - (y - bounds.y_min)) * scale,
//   });
// };

// // ─── finish line helper ──────────────────────────────────────────────────────

// /**
//  * Draws a short perpendicular stroke across the track at the finish line.
//  * We find the two track-outline points nearest the finish-line coordinate,
//  * compute the tangent direction between them, then draw a line 90° to it.
//  */
// const FinishLineMark = ({
//   finishLine,
//   trackOutline,
//   project,
// }: {
//   finishLine: FinishLine;
//   trackOutline: TrackPoint[];
//   project: (x: number, y: number) => { x: number; y: number };
// }) => {
//   const { x: fx, y: fy } = project(finishLine.x, finishLine.y);

//   // Find the two outline points nearest the projected finish point
//   let best1 = 0, best2 = 1, bestDist = Infinity;
//   const projected = trackOutline.map((p) => project(p.x, p.y));

//   for (let i = 0; i < projected.length - 1; i++) {
//     const mx = (projected[i].x + projected[i + 1].x) / 2;
//     const my = (projected[i].y + projected[i + 1].y) / 2;
//     const d  = Math.hypot(mx - fx, my - fy);
//     if (d < bestDist) {
//       bestDist = d;
//       best1    = i;
//       best2    = i + 1;
//     }
//   }

//   // Tangent vector along the track at that point
//   const tx = projected[best2].x - projected[best1].x;
//   const ty = projected[best2].y - projected[best1].y;
//   const len = Math.hypot(tx, ty) || 1;

//   // Perpendicular = rotate tangent 90°
//   const nx = -ty / len;
//   const ny =  tx / len;

//   const half = 18; // half-length of the finish line mark in SVG units
//   const x1   = fx + nx * half;
//   const y1   = fy + ny * half;
//   const x2   = fx - nx * half;
//   const y2   = fy - ny * half;

//   return (
//     <g>
//       {/* Chequered flag effect: alternating black/white segments */}
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#000000" strokeWidth="5" strokeLinecap="round"
//         strokeDasharray="4,4" />
//       {/* Outer glow */}
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#ffffff" strokeWidth="9" strokeLinecap="round" opacity="0.15" />
//     </g>
//   );
// };

// // ─── component ──────────────────────────────────────────────────────────────

// const RaceTrack = ({
//   drivers,
//   positions,
//   trackOutline,
//   bounds,
//   flag       = "clear",
//   showNames  = false,
//   finishLine = null,
// }: RaceTrackProps) => {
//   const project = useMemo(() => makeProjector(bounds), [bounds]);

//   // Build SVG path string once — only changes when track outline or bounds change
//   const trackPathD = useMemo(() => {
//     if (!trackOutline || trackOutline.length === 0) return "";
//     const pts     = trackOutline.map((p) => project(p.x, p.y));
//     const [first, ...rest] = pts;
//     return rest.reduce(
//       (acc, p) => `${acc} L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`,
//       `M ${first.x.toFixed(1)} ${first.y.toFixed(1)}`
//     ) + " Z";
//   }, [trackOutline, project]);

//   const safeFlag   = (flag || "clear").toLowerCase().trim();
//   const trackColor = FLAG_TRACK_COLOR[safeFlag] ?? FLAG_TRACK_COLOR.clear;

//   // Fallback to the first coordinate of the track outline if no explicit finish line is provided
//   const startLine = finishLine || (trackOutline?.length > 0 ? trackOutline[0] : null);

//   return (
//     <div className="w-full h-full">
//       <svg
//         viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
//         className="w-full h-full"
//         style={{ overflow: "visible" }}
//       >
//         {/* ── Track rendering — 3 layered strokes ── */}

//         {/* Layer 1: wide outer glow — gives the "circuit lit up" feel */}
//         <path
//           d={trackPathD}
//           stroke={trackColor}
//           strokeWidth="28"
//           fill="none"
//           strokeLinejoin="round"
//           strokeLinecap="round"
//           opacity="0.18"
//         />

//         {/* Layer 2: main tarmac surface */}
//         <path
//           d={trackPathD}
//           stroke={trackColor}
//           strokeWidth="14"
//           fill="none"
//           strokeLinejoin="round"
//           strokeLinecap="round"
//           opacity="0.9"
//         />

//         {/* Layer 3: inner edge highlight — the bright centre line
//             subtle white line that gives the track a 3D "lit from above" feel */}
//         <path
//           d={trackPathD}
//           stroke="#ffffff"
//           strokeWidth="2"
//           fill="none"
//           strokeLinejoin="round"
//           strokeLinecap="round"
//           opacity="0.12"
//         />

//         {/* ── Finish line ── */}
//         {startLine && (
//           <FinishLineMark
//             finishLine={startLine}
//             trackOutline={trackOutline}
//             project={project}
//           />
//         )}

//         {/* ── Cars ── */}
//         {drivers.map((d) => {
//           const pos = positions[d.code];
//           if (!pos || isNaN(pos.x) || isNaN(pos.y)) return null;

//           const { x, y } = project(pos.x, pos.y);
//           const r        = pos.in_pit ? 5 : 8;
//           const opacity  = pos.in_pit ? 0.55 : 1;

//           return (
//             <g
//               key={d.code}
//               opacity={opacity}
//               style={{ transition: "opacity 0.3s" }}
//             >
//               {/* Drop shadow ring — makes cars pop off dark track */}
//               <circle
//                 cx={x} cy={y} r={r + 3}
//                 fill="none"
//                 stroke="#000000"
//                 strokeWidth="3"
//                 opacity="0.5"
//                 style={{ transition: "cx 0.1s linear, cy 0.1s linear" }}
//               />

//               {/* Team color fill */}
//               <circle
//                 cx={x} cy={y} r={r}
//                 fill={d.color}
//                 stroke="#ffffff"
//                 strokeWidth="1.5"
//                 style={{ transition: "cx 0.1s linear, cy 0.1s linear" }}
//               />

//               {/* Driver name — only when toggled on via L key */}
//               {showNames && (
//                 <text
//                   x={x + r + 5}
//                   y={y + 4}
//                   fontSize="11"
//                   fontWeight="900"
//                   fill="#ffffff"
//                   stroke="#000000"
//                   strokeWidth="3"
//                   paintOrder="stroke"
//                   style={{
//                     transition:     "x 0.1s linear, y 0.1s linear",
//                     userSelect:     "none",
//                     pointerEvents:  "none",
//                   }}
//                 >
//                   {d.code}
//                 </text>
//               )}
//             </g>
//           );
//         })}
//       </svg>
//     </div>
//   );
// };

// export default RaceTrack;

// import { useMemo } from "react";

// export interface Driver {
//   code: string;
//   color: string;
// }

// export interface CarPosition {
//   x: number;
//   y: number;
//   lap: number | null;
//   in_pit: boolean;
// }

// export interface TrackPoint {
//   x: number;
//   y: number;
// }

// export interface Bounds {
//   x_min: number;
//   x_max: number;
//   y_min: number;
//   y_max: number;
// }

// export interface FinishLine {
//   x: number;
//   y: number;
// }

// export interface RaceTrackProps {
//   drivers: Driver[];
//   positions: Record<string, CarPosition>;
//   trackOutline: TrackPoint[];
//   bounds: Bounds;
//   flag?: string;
//   showNames?: boolean;
//   finishLine?: FinishLine | null;
// }

// // ─── constants ──────────────────────────────────────────────────────────────

// const VIEWBOX_W = 1000;
// const VIEWBOX_H = 1000;
// // Decreased padding from 40 to 25 to increase the overall size of the track slightly
// const PADDING   = 1;

// const FLAG_TRACK_COLOR: Record<string, string> = {
//   clear:      "#4a4a4a",
//   yellow:     "#ca8a04",
//   red:        "#dc2626",
//   safety_car: "#d97706",
//   vsc:        "#d97706",
//   vsc_ending: "#d97706",
// };

// // ─── projection ─────────────────────────────────────────────────────────────

// const makeProjector = (bounds: Bounds) => {
//   const dataW = bounds.x_max - bounds.x_min || 1;
//   const dataH = bounds.y_max - bounds.y_min || 1;
//   const availW = VIEWBOX_W - PADDING * 2;
//   const availH = VIEWBOX_H - PADDING * 2;

//   // Uniform scale — keeps circuit shape undistorted
//   const scale   = Math.min(availW / dataW, availH / dataH);
//   const offsetX = PADDING + (availW - dataW * scale) / 2;
//   const offsetY = PADDING + (availH - dataH * scale) / 2;

//   return (x: number, y: number) => ({
//     x: offsetX + (x - bounds.x_min) * scale,
//     // SVG y-axis is inverted vs telemetry y-axis
//     y: offsetY + (dataH - (y - bounds.y_min)) * scale,
//   });
// };

// // ─── finish line helper ──────────────────────────────────────────────────────

// /**
//  * Draws a short perpendicular stroke across the track at the finish line.
//  * We find the two track-outline points nearest the finish-line coordinate,
//  * compute the tangent direction between them, then draw a line 90° to it.
//  */
// const FinishLineMark = ({
//   finishLine,
//   trackOutline,
//   project,
// }: {
//   finishLine: FinishLine;
//   trackOutline: TrackPoint[];
//   project: (x: number, y: number) => { x: number; y: number };
// }) => {
//   const { x: fx, y: fy } = project(finishLine.x, finishLine.y);

//   // Find the two outline points nearest the projected finish point
//   let best1 = 0, best2 = 1, bestDist = Infinity;
//   const projected = trackOutline.map((p) => project(p.x, p.y));

//   for (let i = 0; i < projected.length - 1; i++) {
//     const mx = (projected[i].x + projected[i + 1].x) / 2;
//     const my = (projected[i].y + projected[i + 1].y) / 2;
//     const d  = Math.hypot(mx - fx, my - fy);
//     if (d < bestDist) {
//       bestDist = d;
//       best1    = i;
//       best2    = i + 1;
//     }
//   }

//   // Tangent vector along the track at that point
//   const tx = projected[best2].x - projected[best1].x;
//   const ty = projected[best2].y - projected[best1].y;
//   const len = Math.hypot(tx, ty) || 1;

//   // Perpendicular = rotate tangent 90°
//   const nx = -ty / len;
//   const ny =  tx / len;

//   const half = 18; // half-length of the finish line mark in SVG units
//   const x1   = fx + nx * half;
//   const y1   = fy + ny * half;
//   const x2   = fx - nx * half;
//   const y2   = fy - ny * half;

//   return (
//     <g>
//       {/* 1. Asphalt burn / shadow (gives the paint depth) */}
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#000000" strokeWidth="8" strokeLinecap="butt" opacity="0.5" />

//       {/* 2. Base white paint layer */}
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#ffffff" strokeWidth="6" strokeLinecap="butt" />

//       {/* 3. Crisp black squares (butt cap creates sharp checkerboard boxes) */}
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#111111" strokeWidth="6" strokeLinecap="butt"
//         strokeDasharray="4,4" />

//       {/* 4. Reflective paint highlight (only on the white squares) */}
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#ffffff" strokeWidth="2" strokeLinecap="butt"
//         strokeDasharray="4,4" strokeDashoffset="4" opacity="0.9" />

//       {/* 5. Soft ambient bloom/glow to match the rest of the track */}
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#ffffff" strokeWidth="14" strokeLinecap="round" opacity="0.12" />
//     </g>
//   );
// };

// // ─── component ──────────────────────────────────────────────────────────────

// const RaceTrack = ({
//   drivers,
//   positions,
//   trackOutline,
//   bounds,
//   flag       = "clear",
//   showNames  = false,
//   finishLine = null,
// }: RaceTrackProps) => {
//   const project = useMemo(() => makeProjector(bounds), [bounds]);

//   // Build SVG path string once — only changes when track outline or bounds change
//   const trackPathD = useMemo(() => {
//     if (!trackOutline || trackOutline.length === 0) return "";
//     const pts     = trackOutline.map((p) => project(p.x, p.y));
//     const [first, ...rest] = pts;
//     return rest.reduce(
//       (acc, p) => `${acc} L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`,
//       `M ${first.x.toFixed(1)} ${first.y.toFixed(1)}`
//     ) + " Z";
//   }, [trackOutline, project]);

//   const safeFlag   = (flag || "clear").toLowerCase().trim();
//   const trackColor = FLAG_TRACK_COLOR[safeFlag] ?? FLAG_TRACK_COLOR.clear;

//   // Fallback to the first coordinate of the track outline if no explicit finish line is provided
//   const startLine = finishLine || (trackOutline?.length > 0 ? trackOutline[0] : null);

//   return (
//     <div className="w-full h-full">
//       <svg
//         viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
//         className="w-full h-full"
//         style={{ overflow: "visible" }}
//       >
//         {/* ── Track rendering — 3 layered strokes ── */}

//         {/* Layer 1: wide outer glow — gives the "circuit lit up" feel */}
//         <path
//           d={trackPathD}
//           stroke={trackColor}
//           strokeWidth="28"
//           fill="none"
//           strokeLinejoin="round"
//           strokeLinecap="round"
//           opacity="0.18"
//         />

//         {/* Layer 2: main tarmac surface */}
//         <path
//           d={trackPathD}
//           stroke={trackColor}
//           strokeWidth="14"
//           fill="none"
//           strokeLinejoin="round"
//           strokeLinecap="round"
//           opacity="0.9"
//         />

//         {/* Layer 3: inner edge highlight — the bright centre line
//             subtle white line that gives the track a 3D "lit from above" feel */}
//         <path
//           d={trackPathD}
//           stroke="#ffffff"
//           strokeWidth="2"
//           fill="none"
//           strokeLinejoin="round"
//           strokeLinecap="round"
//           opacity="0.12"
//         />

//         {/* ── Finish line ── */}
//         {startLine && (
//           <FinishLineMark
//             finishLine={startLine}
//             trackOutline={trackOutline}
//             project={project}
//           />
//         )}

//         {/* ── Cars ── */}
//         {drivers.map((d) => {
//           const pos = positions[d.code];
//           if (!pos || isNaN(pos.x) || isNaN(pos.y)) return null;

//           const { x, y } = project(pos.x, pos.y);
//           const r        = pos.in_pit ? 5 : 8;
//           const opacity  = pos.in_pit ? 0.55 : 1;

//           return (
//             <g
//               key={d.code}
//               opacity={opacity}
//               style={{ transition: "opacity 0.3s" }}
//             >
//               {/* Drop shadow ring — makes cars pop off dark track */}
//               <circle
//                 cx={x} cy={y} r={r + 3}
//                 fill="none"
//                 stroke="#000000"
//                 strokeWidth="3"
//                 opacity="0.5"
//                 style={{ transition: "cx 0.1s linear, cy 0.1s linear" }}
//               />

//               {/* Team color fill */}
//               <circle
//                 cx={x} cy={y} r={r}
//                 fill={d.color}
//                 stroke="#ffffff"
//                 strokeWidth="1.5"
//                 style={{ transition: "cx 0.1s linear, cy 0.1s linear" }}
//               />

//               {/* Driver name — only when toggled on via L key */}
//               {showNames && (
//                 <text
//                   x={x + r + 5}
//                   y={y + 4}
//                   fontSize="11"
//                   fontWeight="900"
//                   fill="#ffffff"
//                   stroke="#000000"
//                   strokeWidth="3"
//                   paintOrder="stroke"
//                   style={{
//                     transition:     "x 0.1s linear, y 0.1s linear",
//                     userSelect:     "none",
//                     pointerEvents:  "none",
//                   }}
//                 >
//                   {d.code}
//                 </text>
//               )}
//             </g>
//           );
//         })}
//       </svg>
//     </div>
//   );
// };

// export default RaceTrack;\\
// import { useMemo } from "react";

// export interface Driver {
//   code: string;
//   color: string;
// }

// export interface CarPosition {
//   x: number;
//   y: number;
//   lap: number | null;
//   in_pit: boolean;
// }

// export interface TrackPoint {
//   x: number;
//   y: number;
// }

// export interface Bounds {
//   x_min: number;
//   x_max: number;
//   y_min: number;
//   y_max: number;
// }

// export interface FinishLine {
//   x: number;
//   y: number;
// }

// export interface RaceTrackProps {
//   drivers: Driver[];
//   positions: Record<string, CarPosition>;
//   trackOutline: TrackPoint[];
//   bounds: Bounds;
//   flag?: string;
//   showNames?: boolean;
//   finishLine?: FinishLine | null;
//   transitionMs?: number; // 🛠️ NEW: Dynamic sync for smooth gliding
// }

// // ─── constants ──────────────────────────────────────────────────────────────

// const VIEWBOX_W = 1000;
// const VIEWBOX_H = 1000;
// const PADDING   = 1;

// const FLAG_TRACK_COLOR: Record<string, string> = {
//   clear:      "#4a4a4a",
//   yellow:     "#ca8a04",
//   red:        "#dc2626",
//   safety_car: "#d97706",
//   vsc:        "#d97706",
//   vsc_ending: "#d97706",
// };

// // ─── projection ─────────────────────────────────────────────────────────────

// const makeProjector = (bounds: Bounds) => {
//   const dataW = bounds.x_max - bounds.x_min || 1;
//   const dataH = bounds.y_max - bounds.y_min || 1;
//   const availW = VIEWBOX_W - PADDING * 2;
//   const availH = VIEWBOX_H - PADDING * 2;

//   const scale   = Math.min(availW / dataW, availH / dataH);
//   const offsetX = PADDING + (availW - dataW * scale) / 2;
//   const offsetY = PADDING + (availH - dataH * scale) / 2;

//   return (x: number, y: number) => ({
//     x: offsetX + (x - bounds.x_min) * scale,
//     y: offsetY + (dataH - (y - bounds.y_min)) * scale,
//   });
// };

// // ─── finish line helper ──────────────────────────────────────────────────────

// const FinishLineMark = ({
//   finishLine,
//   trackOutline,
//   project,
// }: {
//   finishLine: FinishLine;
//   trackOutline: TrackPoint[];
//   project: (x: number, y: number) => { x: number; y: number };
// }) => {
//   const { x: fx, y: fy } = project(finishLine.x, finishLine.y);

//   let best1 = 0, best2 = 1, bestDist = Infinity;
//   const projected = trackOutline.map((p) => project(p.x, p.y));

//   for (let i = 0; i < projected.length - 1; i++) {
//     const mx = (projected[i].x + projected[i + 1].x) / 2;
//     const my = (projected[i].y + projected[i + 1].y) / 2;
//     const d  = Math.hypot(mx - fx, my - fy);
//     if (d < bestDist) {
//       bestDist = d;
//       best1    = i;
//       best2    = i + 1;
//     }
//   }

//   const tx = projected[best2].x - projected[best1].x;
//   const ty = projected[best2].y - projected[best1].y;
//   const len = Math.hypot(tx, ty) || 1;

//   const nx = -ty / len;
//   const ny =  tx / len;

//   const half = 18; 
//   const x1   = fx + nx * half;
//   const y1   = fy + ny * half;
//   const x2   = fx - nx * half;
//   const y2   = fy - ny * half;

//   return (
//     <g>
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#000000" strokeWidth="8" strokeLinecap="butt" opacity="0.5" />
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#ffffff" strokeWidth="6" strokeLinecap="butt" />
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#111111" strokeWidth="6" strokeLinecap="butt"
//         strokeDasharray="4,4" />
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#ffffff" strokeWidth="2" strokeLinecap="butt"
//         strokeDasharray="4,4" strokeDashoffset="4" opacity="0.9" />
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#ffffff" strokeWidth="14" strokeLinecap="round" opacity="0.12" />
//     </g>
//   );
// };

// // ─── component ──────────────────────────────────────────────────────────────

// const RaceTrack = ({
//   drivers,
//   positions,
//   trackOutline,
//   bounds,
//   flag       = "clear",
//   showNames  = false,
//   finishLine = null,
//   transitionMs = 300, 
// }: RaceTrackProps) => {
//   const project = useMemo(() => makeProjector(bounds), [bounds]);

//   const trackPathD = useMemo(() => {
//     if (!trackOutline || trackOutline.length === 0) return "";
//     const pts     = trackOutline.map((p) => project(p.x, p.y));
//     const [first, ...rest] = pts;
//     return rest.reduce(
//       // 🛠️ FIX: Removed .toFixed(1) to stop the track line from rounding/shifting under the cars
//       (acc, p) => `${acc} L ${p.x.toFixed(3)} ${p.y.toFixed(3)}`,
//       `M ${first.x.toFixed(3)} ${first.y.toFixed(3)}`
//     ) + " Z";
//   }, [trackOutline, project]);

//   const safeFlag   = (flag || "clear").toLowerCase().trim();
//   const trackColor = FLAG_TRACK_COLOR[safeFlag] ?? FLAG_TRACK_COLOR.clear;
//   const startLine = finishLine || (trackOutline?.length > 0 ? trackOutline[0] : null);

//   // 🛠️ FIX: Perfect timing sync for CSS transitions
//   const smoothTransform = `cx ${transitionMs}ms linear, cy ${transitionMs}ms linear`;
//   const textTransform = `x ${transitionMs}ms linear, y ${transitionMs}ms linear`;

//   return (
//     <div className="w-full h-full">
//       <svg
//         viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
//         className="w-full h-full"
//         style={{ overflow: "visible" }}
//       >
//         <path d={trackPathD} stroke={trackColor} strokeWidth="28" fill="none" strokeLinejoin="round" strokeLinecap="round" opacity="0.18" />
//         <path d={trackPathD} stroke={trackColor} strokeWidth="14" fill="none" strokeLinejoin="round" strokeLinecap="round" opacity="0.9" />
//         <path d={trackPathD} stroke="#ffffff" strokeWidth="2" fill="none" strokeLinejoin="round" strokeLinecap="round" opacity="0.12" />

//         {startLine && (
//           <FinishLineMark finishLine={startLine} trackOutline={trackOutline} project={project} />
//         )}

//         {drivers.map((d) => {
//           const pos = positions[d.code];
//           if (!pos || isNaN(pos.x) || isNaN(pos.y)) return null;

//           const { x, y } = project(pos.x, pos.y);
//           // 🛠️ FIX: Locked all cars to size 8, regardless of pitting
//           const r = 8;
//           const opacity = pos.in_pit ? 0.55 : 1;

//           return (
//             <g key={d.code} opacity={opacity} style={{ transition: "opacity 0.2s" }}>
//               <circle
//                 cx={x} cy={y} r={r + 3}
//                 fill="none" stroke="#000000" strokeWidth="3" opacity="0.5"
//                 style={{ transition: smoothTransform }}
//               />
//               <circle
//                 cx={x} cy={y} r={r}
//                 fill={d.color} stroke="#ffffff" strokeWidth="1.5"
//                 style={{ transition: smoothTransform }}
//               />
//               {showNames && (
//                 <text
//                   x={x + r + 5} y={y + 4}
//                   fontSize="11" fontWeight="900" fill="#ffffff" stroke="#000000" strokeWidth="3" paintOrder="stroke"
//                   style={{ transition: textTransform, userSelect: "none", pointerEvents: "none" }}
//                 >
//                   {d.code}
//                 </text>
//               )}
//             </g>
//           );
//         })}
//       </svg>
//     </div>
//   );
// };

// export default RaceTrack;

// import { useMemo, useRef } from "react";

// export interface Driver {
//   code: string;
//   color: string;
// }

// export interface CarPosition {
//   x: number;
//   y: number;
//   lap: number | null;
//   in_pit: boolean;
// }

// export interface TrackPoint {
//   x: number;
//   y: number;
// }

// export interface Bounds {
//   x_min: number;
//   x_max: number;
//   y_min: number;
//   y_max: number;
// }

// export interface FinishLine {
//   x: number;
//   y: number;
// }

// export interface RaceTrackProps {
//   drivers: Driver[];
//   positions: Record<string, CarPosition>;
//   trackOutline: TrackPoint[];
//   bounds: Bounds;
//   flag?: string;
//   showNames?: boolean;
//   finishLine?: FinishLine | null;
//   transitionMs?: number;
// }

// // ─── constants ───────────────────────────────────────────────────────────────

// const VIEWBOX_W = 1000;
// const VIEWBOX_H = 1000;
// // Generous padding so cars at the edge are never clipped
// const PADDING   = 40;

// // Car sizes
// const CAR_R_RACING = 8;
// const CAR_R_PIT    = 5;

// // Pit debounce: how many consecutive in_pit=true frames before we confirm pit state.
// // Must match Leaderboard.tsx so both update at the same frame.
// const PIT_CONFIRM_THRESHOLD = 3;

// const FLAG_TRACK_COLOR: Record<string, string> = {
//   clear:      "#5a5a5a",
//   yellow:     "#ca8a04",
//   red:        "#dc2626",
//   safety_car: "#d97706",
//   vsc:        "#d97706",
//   vsc_ending: "#d97706",
// };

// // ─── projection ──────────────────────────────────────────────────────────────

// const makeProjector = (bounds: Bounds) => {
//   const dataW  = bounds.x_max - bounds.x_min || 1;
//   const dataH  = bounds.y_max - bounds.y_min || 1;
//   const availW = VIEWBOX_W - PADDING * 2;
//   const availH = VIEWBOX_H - PADDING * 2;

//   const scale   = Math.min(availW / dataW, availH / dataH);
//   const offsetX = PADDING + (availW - dataW * scale) / 2;
//   const offsetY = PADDING + (availH - dataH * scale) / 2;

//   return (x: number, y: number) => ({
//     x: offsetX + (x - bounds.x_min) * scale,
//     // FastF1 Y increases upward, SVG Y increases downward — flip it
//     y: offsetY + (dataH - (y - bounds.y_min)) * scale,
//   });
// };

// // ─── finish line ─────────────────────────────────────────────────────────────

// const FinishLineMark = ({
//   finishLine,
//   trackOutline,
//   project,
// }: {
//   finishLine: FinishLine;
//   trackOutline: TrackPoint[];
//   project: (x: number, y: number) => { x: number; y: number };
// }) => {
//   const { x: fx, y: fy } = project(finishLine.x, finishLine.y);
//   const projected = trackOutline.map((p) => project(p.x, p.y));

//   let best1 = 0, best2 = 1, bestDist = Infinity;
//   for (let i = 0; i < projected.length - 1; i++) {
//     const mx = (projected[i].x + projected[i + 1].x) / 2;
//     const my = (projected[i].y + projected[i + 1].y) / 2;
//     const d  = Math.hypot(mx - fx, my - fy);
//     if (d < bestDist) { bestDist = d; best1 = i; best2 = i + 1; }
//   }

//   const tx  = projected[best2].x - projected[best1].x;
//   const ty  = projected[best2].y - projected[best1].y;
//   const len = Math.hypot(tx, ty) || 1;
//   const nx  = -ty / len;
//   const ny  =  tx / len;
//   const half = 20;

//   const x1 = fx + nx * half, y1 = fy + ny * half;
//   const x2 = fx - nx * half, y2 = fy - ny * half;

//   return (
//     <g>
//       <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#000" strokeWidth="10" strokeLinecap="butt" opacity="0.4" />
//       <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#fff" strokeWidth="7"  strokeLinecap="butt" />
//       <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#111" strokeWidth="7"  strokeLinecap="butt" strokeDasharray="5,5" />
//       <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#fff" strokeWidth="2"  strokeLinecap="butt" strokeDasharray="5,5" strokeDashoffset="5" opacity="0.9" />
//       <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#fff" strokeWidth="16" strokeLinecap="round" opacity="0.08" />
//     </g>
//   );
// };

// // ─── main component ──────────────────────────────────────────────────────────

// const RaceTrack = ({
//   drivers,
//   positions,
//   trackOutline,
//   bounds,
//   flag         = "clear",
//   showNames    = false,
//   finishLine   = null,
//   transitionMs = 300,
// }: RaceTrackProps) => {
//   const project = useMemo(() => makeProjector(bounds), [bounds]);

//   // ── debounced pit state (mirrors Leaderboard.tsx logic exactly) ──
//   const pitCounterRef = useRef<Map<string, number>>(new Map());

//   const trackPathD = useMemo(() => {
//     if (!trackOutline || trackOutline.length === 0) return "";
//     const pts          = trackOutline.map((p) => project(p.x, p.y));
//     const [first, ...rest] = pts;
//     return (
//       rest.reduce(
//         (acc, p) => `${acc} L ${p.x.toFixed(3)} ${p.y.toFixed(3)}`,
//         `M ${first.x.toFixed(3)} ${first.y.toFixed(3)}`
//       ) + " Z"
//     );
//   }, [trackOutline, project]);

//   const safeFlag   = (flag || "clear").toLowerCase().trim();
//   const trackColor = FLAG_TRACK_COLOR[safeFlag] ?? FLAG_TRACK_COLOR.clear;
//   const startLine  = finishLine || (trackOutline?.length > 0 ? trackOutline[0] : null);

//   const smoothTransform = `cx ${transitionMs}ms linear, cy ${transitionMs}ms linear`;
//   const textTransform   = `x ${transitionMs}ms linear, y ${transitionMs}ms linear`;
//   const sizeTransition  = `r 200ms ease-in-out`;

//   // Build confirmed pit states for all drivers this render
//   const confirmedPitMap = useMemo(() => {
//     const map = new Map<string, boolean>();
//     drivers.forEach((d) => {
//       const pos      = positions[d.code];
//       const rawInPit = pos?.in_pit || false;
//       const prev     = pitCounterRef.current.get(d.code) ?? 0;
//       const next     = rawInPit ? prev + 1 : 0;
//       pitCounterRef.current.set(d.code, next);
//       map.set(d.code, next >= PIT_CONFIRM_THRESHOLD);
//     });
//     return map;
//   }, [drivers, positions]);

//   return (
//     <div className="w-full h-full">
//       <svg
//         viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
//         className="w-full h-full"
//         style={{ overflow: "visible" }}
//       >
//         {/* ── track layers ── */}
//         {/* Outer glow */}
//         <path d={trackPathD} stroke={trackColor} strokeWidth="38" fill="none"
//           strokeLinejoin="round" strokeLinecap="round" opacity="0.10" />
//         {/* Road body — wider than before so car dots sit inside it */}
//         <path d={trackPathD} stroke={trackColor} strokeWidth="22" fill="none"
//           strokeLinejoin="round" strokeLinecap="round" opacity="0.85" />
//         {/* Kerb highlight */}
//         <path d={trackPathD} stroke="#ffffff" strokeWidth="2" fill="none"
//           strokeLinejoin="round" strokeLinecap="round" opacity="0.08" />

//         {startLine && (
//           <FinishLineMark
//             finishLine={startLine}
//             trackOutline={trackOutline}
//             project={project}
//           />
//         )}

//         {/* ── cars ── */}
//         {drivers.map((d) => {
//           const pos = positions[d.code];
//           if (!pos || isNaN(pos.x) || isNaN(pos.y)) return null;

//           const { x, y }   = project(pos.x, pos.y);
//           const isPitting   = confirmedPitMap.get(d.code) ?? false;
//           const r           = isPitting ? CAR_R_PIT : CAR_R_RACING;

//           return (
//             <g key={d.code}>
//               {/* ── shadow ring (always present, gives depth) ── */}
//               <circle
//                 cx={x} cy={y} r={r + 4}
//                 fill="none" stroke="#000000" strokeWidth="4" opacity="0.35"
//                 style={{ transition: `${smoothTransform}, ${sizeTransition}` }}
//               />

//               {/* ── pit indicator ring (only visible when pitting) ── */}
//               {isPitting && (
//                 <circle
//                   cx={x} cy={y} r={r + 7}
//                   fill="none"
//                   stroke="#facc15"
//                   strokeWidth="1.5"
//                   strokeDasharray="3 3"
//                   opacity="0.7"
//                   style={{ transition: smoothTransform }}
//                 />
//               )}

//               {/* ── car body ── */}
//               <circle
//                 cx={x} cy={y} r={r}
//                 fill={isPitting ? "#4a4a4a" : d.color}
//                 stroke={isPitting ? "#888888" : "#ffffff"}
//                 strokeWidth={isPitting ? 1 : 1.5}
//                 opacity={isPitting ? 0.6 : 1}
//                 style={{ transition: `${smoothTransform}, ${sizeTransition}, opacity 200ms ease-in-out` }}
//               />

//               {/* ── driver label ── */}
//               {showNames && (
//                 <text
//                   x={x + r + 5} y={y + 4}
//                   fontSize="11" fontWeight="900"
//                   fill={isPitting ? "#888" : "#ffffff"}
//                   stroke="#000000" strokeWidth="3" paintOrder="stroke"
//                   style={{
//                     transition: textTransform,
//                     userSelect: "none",
//                     pointerEvents: "none",
//                   }}
//                 >
//                   {d.code}
//                 </text>
//               )}
//             </g>
//           );
//         })}
//       </svg>
//     </div>
//   );
// };

// export default RaceTrack;

// import { useMemo } from "react";

// export interface Driver {
//   code: string;
//   color: string;
// }

// export interface CarPosition {
//   x: number;
//   y: number;
//   lap: number | null;
//   in_pit: boolean;
// }

// export interface TrackPoint {
//   x: number;
//   y: number;
// }

// export interface Bounds {
//   x_min: number;
//   x_max: number;
//   y_min: number;
//   y_max: number;
// }

// export interface RaceTrackProps {
//   drivers: Driver[];
//   positions: Record<string, CarPosition>;
//   trackOutline: TrackPoint[];
//   bounds: Bounds;
//   flag?: string; 
// }

// const VIEWBOX_WIDTH = 1000;
// const VIEWBOX_HEIGHT = 1000;
// const PADDING = 45; 

// const FLAG_COLORS: Record<string, string> = {
//   clear: "#525252", 
//   "1": "#525252",
//   yellow: "#e6c900",
//   "2": "#e6c900",
//   red: "#dc2626",
//   "5": "#dc2626",
//   safety_car: "#f59e0b",
//   "4": "#f59e0b",
//   vsc: "#f59e0b",
//   "6": "#f59e0b",
//   vsc_ending: "#f59e0b",
//   "7": "#f59e0b",
// };

// const FLAG_LABELS: Record<string, string> = {
//   yellow: "YELLOW FLAG",
//   "2": "YELLOW FLAG",
//   red: "RED FLAG",
//   "5": "RED FLAG",
//   safety_car: "SAFETY CAR DEPLOYED",
//   "4": "SAFETY CAR DEPLOYED",
//   vsc: "VIRTUAL SAFETY CAR",
//   "6": "VIRTUAL SAFETY CAR",
//   vsc_ending: "VSC ENDING",
//   "7": "VSC ENDING",
// };

// const makeProjector = (bounds: Bounds) => {
//   const dataWidth = bounds.x_max - bounds.x_min || 1;
//   const dataHeight = bounds.y_max - bounds.y_min || 1;
//   const availableWidth = VIEWBOX_WIDTH - PADDING * 2;
//   const availableHeight = VIEWBOX_HEIGHT - PADDING * 2;
//   const scale = Math.min(availableWidth / dataWidth, availableHeight / dataHeight);
//   const offsetX = PADDING + (availableWidth - dataWidth * scale) / 2;
//   const offsetY = PADDING + (availableHeight - dataHeight * scale) / 2;

//   return (x: number, y: number) => {
//     const svgX = offsetX + (x - bounds.x_min) * scale;
//     const svgY = offsetY + (dataHeight - (y - bounds.y_min)) * scale;
//     return { x: svgX, y: svgY };
//   };
// };

// const RaceTrack = ({ drivers, positions, trackOutline, bounds, flag }: RaceTrackProps) => {
//   const project = useMemo(() => makeProjector(bounds), [bounds]);

//   const trackPathD = useMemo(() => {
//     if (!trackOutline || trackOutline.length === 0) return "";
//     const points = trackOutline.map((p) => project(p.x, p.y));
//     const [first, ...rest] = points;
//     const path = rest.reduce(
//       (acc, p) => `${acc} L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`,
//       `M ${first.x.toFixed(2)} ${first.y.toFixed(2)}`
//     );
//     return `${path} Z`;
//   }, [trackOutline, project]);

//   const safeFlag = (flag || "clear").toString().toLowerCase().trim();
//   const trackColor = FLAG_COLORS[safeFlag] || FLAG_COLORS.clear;
//   const isFlagActive = safeFlag !== "clear" && safeFlag !== "1" && !!FLAG_LABELS[safeFlag];

//   return (
//     <div className="w-full h-full flex items-center justify-center relative">
      
//       {/* 🛠️ FIX: Sleek, F1 Broadcast Style Flag Banner */}
//       {isFlagActive && (
//         <div className="absolute top-8 left-1/2 -translate-x-1/2 z-[100] flex items-stretch bg-neutral-900/95 backdrop-blur-md border border-neutral-700/50 rounded-lg shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden">
//           <div className="w-2" style={{ backgroundColor: trackColor }} />
//           <div className="px-6 py-2.5 flex items-center gap-3">
//             <span 
//               className="w-3 h-3 rounded-full animate-pulse" 
//               style={{ backgroundColor: trackColor, boxShadow: `0 0 10px ${trackColor}` }} 
//             />
//             <span className="font-black text-sm tracking-widest text-white uppercase">
//               {FLAG_LABELS[safeFlag]}
//             </span>
//           </div>
//         </div>
//       )}

//       <svg viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`} className="w-full h-full drop-shadow-2xl">
//         <path d={trackPathD} stroke={trackColor} strokeWidth="24" fill="none" strokeLinejoin="round" opacity="0.3" />
//         <path d={trackPathD} stroke={trackColor} strokeWidth="12" fill="none" strokeLinejoin="round" />
//         <path d={trackPathD} stroke="#ffffff" strokeWidth="1.5" strokeDasharray="4,6" fill="none" strokeLinejoin="round" opacity="0.4" />

//         {drivers.map((d) => {
//           const pos = positions[d.code];
//           if (!pos || isNaN(pos.x)) return null;
          
//           const { x, y } = project(pos.x, pos.y);
//           return (
//             <g key={d.code} style={{ transition: "transform 0.1s linear" }}>
//               <circle
//                 cx={x} cy={y}
//                 r="8"
//                 fill={d.color}
//                 stroke="#fff"
//                 strokeWidth="1.5"
//                 style={{ transition: "cx 0.1s linear, cy 0.1s linear" }}
//               />
//               <text
//                 x={x + 12} y={y + 3}
//                 fontSize="11"
//                 fontWeight="900"
//                 fill="#fff"
//                 className="drop-shadow-md"
//                 style={{ transition: "x 0.1s linear, y 0.1s linear" }}
//               >
//                 {d.code}
//               </text>
//             </g>
//           );
//         })}
//       </svg>
//     </div>
//   );
// };

// export default RaceTrack;

// import { useMemo } from "react";

// export interface Driver {
//   code: string;
//   color: string;
// }

// export interface CarPosition {
//   x: number;
//   y: number;
//   lap: number | null;
//   in_pit: boolean;
// }

// export interface TrackPoint {
//   x: number;
//   y: number;
// }

// export interface Bounds {
//   x_min: number;
//   x_max: number;
//   y_min: number;
//   y_max: number;
// }

// export interface FinishLine {
//   x: number;
//   y: number;
// }

// export interface RaceTrackProps {
//   drivers: Driver[];
//   positions: Record<string, CarPosition>;
//   trackOutline: TrackPoint[];
//   bounds: Bounds;
//   flag?: string;
//   showNames?: boolean;
//   finishLine?: FinishLine | null;
// }

// // ─── constants ──────────────────────────────────────────────────────────────

// const VIEWBOX_W = 1000;
// const VIEWBOX_H = 1000;
// const PADDING   = 40;

// const FLAG_TRACK_COLOR: Record<string, string> = {
//   clear:      "#4a4a4a",
//   yellow:     "#ca8a04",
//   red:        "#dc2626",
//   safety_car: "#d97706",
//   vsc:        "#d97706",
//   vsc_ending: "#d97706",
// };

// // ─── projection ─────────────────────────────────────────────────────────────

// const makeProjector = (bounds: Bounds) => {
//   const dataW = bounds.x_max - bounds.x_min || 1;
//   const dataH = bounds.y_max - bounds.y_min || 1;
//   const availW = VIEWBOX_W - PADDING * 2;
//   const availH = VIEWBOX_H - PADDING * 2;

//   // Uniform scale — keeps circuit shape undistorted
//   const scale   = Math.min(availW / dataW, availH / dataH);
//   const offsetX = PADDING + (availW - dataW * scale) / 2;
//   const offsetY = PADDING + (availH - dataH * scale) / 2;

//   return (x: number, y: number) => ({
//     x: offsetX + (x - bounds.x_min) * scale,
//     // SVG y-axis is inverted vs telemetry y-axis
//     y: offsetY + (dataH - (y - bounds.y_min)) * scale,
//   });
// };

// // ─── finish line helper ──────────────────────────────────────────────────────

// /**
//  * Draws a short perpendicular stroke across the track at the finish line.
//  * We find the two track-outline points nearest the finish-line coordinate,
//  * compute the tangent direction between them, then draw a line 90° to it.
//  */
// const FinishLineMark = ({
//   finishLine,
//   trackOutline,
//   project,
// }: {
//   finishLine: FinishLine;
//   trackOutline: TrackPoint[];
//   project: (x: number, y: number) => { x: number; y: number };
// }) => {
//   const { x: fx, y: fy } = project(finishLine.x, finishLine.y);

//   // Find the two outline points nearest the projected finish point
//   let best1 = 0, best2 = 1, bestDist = Infinity;
//   const projected = trackOutline.map((p) => project(p.x, p.y));

//   for (let i = 0; i < projected.length - 1; i++) {
//     const mx = (projected[i].x + projected[i + 1].x) / 2;
//     const my = (projected[i].y + projected[i + 1].y) / 2;
//     const d  = Math.hypot(mx - fx, my - fy);
//     if (d < bestDist) {
//       bestDist = d;
//       best1    = i;
//       best2    = i + 1;
//     }
//   }

//   // Tangent vector along the track at that point
//   const tx = projected[best2].x - projected[best1].x;
//   const ty = projected[best2].y - projected[best1].y;
//   const len = Math.hypot(tx, ty) || 1;

//   // Perpendicular = rotate tangent 90°
//   const nx = -ty / len;
//   const ny =  tx / len;

//   const half = 18; // half-length of the finish line mark in SVG units
//   const x1   = fx + nx * half;
//   const y1   = fy + ny * half;
//   const x2   = fx - nx * half;
//   const y2   = fy - ny * half;

//   return (
//     <g>
//       {/* Chequered flag effect: alternating black/white segments */}
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#000000" strokeWidth="5" strokeLinecap="round"
//         strokeDasharray="4,4" />
//       {/* Outer glow */}
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#ffffff" strokeWidth="9" strokeLinecap="round" opacity="0.15" />
//     </g>
//   );
// };

// // ─── component ──────────────────────────────────────────────────────────────

// const RaceTrack = ({
//   drivers,
//   positions,
//   trackOutline,
//   bounds,
//   flag       = "clear",
//   showNames  = false,
//   finishLine = null,
// }: RaceTrackProps) => {
//   const project = useMemo(() => makeProjector(bounds), [bounds]);

//   // Build SVG path string once — only changes when track outline or bounds change
//   const trackPathD = useMemo(() => {
//     if (!trackOutline || trackOutline.length === 0) return "";
//     const pts     = trackOutline.map((p) => project(p.x, p.y));
//     const [first, ...rest] = pts;
//     return rest.reduce(
//       (acc, p) => `${acc} L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`,
//       `M ${first.x.toFixed(1)} ${first.y.toFixed(1)}`
//     ) + " Z";
//   }, [trackOutline, project]);

//   const safeFlag   = (flag || "clear").toLowerCase().trim();
//   const trackColor = FLAG_TRACK_COLOR[safeFlag] ?? FLAG_TRACK_COLOR.clear;

//   return (
//     <div className="w-full h-full">
//       <svg
//         viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
//         className="w-full h-full"
//         style={{ overflow: "visible" }}
//       >
//         {/* ── Track rendering — 3 layered strokes ── */}

//         {/* Layer 1: wide outer glow — gives the "circuit lit up" feel */}
//         <path
//           d={trackPathD}
//           stroke={trackColor}
//           strokeWidth="28"
//           fill="none"
//           strokeLinejoin="round"
//           strokeLinecap="round"
//           opacity="0.18"
//         />

//         {/* Layer 2: main tarmac surface */}
//         <path
//           d={trackPathD}
//           stroke={trackColor}
//           strokeWidth="14"
//           fill="none"
//           strokeLinejoin="round"
//           strokeLinecap="round"
//           opacity="0.9"
//         />

//         {/* Layer 3: inner edge highlight — the bright centre line
//             subtle white line that gives the track a 3D "lit from above" feel */}
//         <path
//           d={trackPathD}
//           stroke="#ffffff"
//           strokeWidth="2"
//           fill="none"
//           strokeLinejoin="round"
//           strokeLinecap="round"
//           opacity="0.12"
//         />

//         {/* ── Finish line ── */}
//         {finishLine && (
//           <FinishLineMark
//             finishLine={finishLine}
//             trackOutline={trackOutline}
//             project={project}
//           />
//         )}

//         {/* ── Cars ── */}
//         {drivers.map((d) => {
//           const pos = positions[d.code];
//           if (!pos || isNaN(pos.x) || isNaN(pos.y)) return null;

//           const { x, y } = project(pos.x, pos.y);
//           const r        = pos.in_pit ? 5 : 8;
//           const opacity  = pos.in_pit ? 0.55 : 1;

//           return (
//             <g
//               key={d.code}
//               opacity={opacity}
//               style={{ transition: "opacity 0.3s" }}
//             >
//               {/* Drop shadow ring — makes cars pop off dark track */}
//               <circle
//                 cx={x} cy={y} r={r + 3}
//                 fill="none"
//                 stroke="#000000"
//                 strokeWidth="3"
//                 opacity="0.5"
//                 style={{ transition: "cx 0.1s linear, cy 0.1s linear" }}
//               />

//               {/* Team color fill */}
//               <circle
//                 cx={x} cy={y} r={r}
//                 fill={d.color}
//                 stroke="#ffffff"
//                 strokeWidth="1.5"
//                 style={{ transition: "cx 0.1s linear, cy 0.1s linear" }}
//               />

//               {/* Driver name — only when toggled on via L key */}
//               {showNames && (
//                 <text
//                   x={x + r + 5}
//                   y={y + 4}
//                   fontSize="11"
//                   fontWeight="900"
//                   fill="#ffffff"
//                   stroke="#000000"
//                   strokeWidth="3"
//                   paintOrder="stroke"
//                   style={{
//                     transition:     "x 0.1s linear, y 0.1s linear",
//                     userSelect:     "none",
//                     pointerEvents:  "none",
//                   }}
//                 >
//                   {d.code}
//                 </text>
//               )}
//             </g>
//           );
//         })}
//       </svg>
//     </div>
//   );
// };

// export default RaceTrack;

// import { useMemo } from "react";

// export interface Driver {
//   code: string;
//   color: string;
// }

// export interface CarPosition {
//   x: number;
//   y: number;
//   lap: number | null;
//   in_pit: boolean;
// }

// export interface TrackPoint {
//   x: number;
//   y: number;
// }

// export interface Bounds {
//   x_min: number;
//   x_max: number;
//   y_min: number;
//   y_max: number;
// }

// export interface FinishLine {
//   x: number;
//   y: number;
// }

// export interface RaceTrackProps {
//   drivers: Driver[];
//   positions: Record<string, CarPosition>;
//   trackOutline: TrackPoint[];
//   bounds: Bounds;
//   flag?: string;
//   showNames?: boolean;
//   finishLine?: FinishLine | null;
// }

// // ─── constants ──────────────────────────────────────────────────────────────

// const VIEWBOX_W = 1000;
// const VIEWBOX_H = 1000;
// // Decreased padding from 40 to 25 to increase the overall size of the track slightly
// const PADDING   = 25;

// const FLAG_TRACK_COLOR: Record<string, string> = {
//   clear:      "#4a4a4a",
//   yellow:     "#ca8a04",
//   red:        "#dc2626",
//   safety_car: "#d97706",
//   vsc:        "#d97706",
//   vsc_ending: "#d97706",
// };

// // ─── projection ─────────────────────────────────────────────────────────────

// const makeProjector = (bounds: Bounds) => {
//   const dataW = bounds.x_max - bounds.x_min || 1;
//   const dataH = bounds.y_max - bounds.y_min || 1;
//   const availW = VIEWBOX_W - PADDING * 2;
//   const availH = VIEWBOX_H - PADDING * 2;

//   // Uniform scale — keeps circuit shape undistorted
//   const scale   = Math.min(availW / dataW, availH / dataH);
//   const offsetX = PADDING + (availW - dataW * scale) / 2;
//   const offsetY = PADDING + (availH - dataH * scale) / 2;

//   return (x: number, y: number) => ({
//     x: offsetX + (x - bounds.x_min) * scale,
//     // SVG y-axis is inverted vs telemetry y-axis
//     y: offsetY + (dataH - (y - bounds.y_min)) * scale,
//   });
// };

// // ─── finish line helper ──────────────────────────────────────────────────────

// /**
//  * Draws a short perpendicular stroke across the track at the finish line.
//  * We find the two track-outline points nearest the finish-line coordinate,
//  * compute the tangent direction between them, then draw a line 90° to it.
//  */
// const FinishLineMark = ({
//   finishLine,
//   trackOutline,
//   project,
// }: {
//   finishLine: FinishLine;
//   trackOutline: TrackPoint[];
//   project: (x: number, y: number) => { x: number; y: number };
// }) => {
//   const { x: fx, y: fy } = project(finishLine.x, finishLine.y);

//   // Find the two outline points nearest the projected finish point
//   let best1 = 0, best2 = 1, bestDist = Infinity;
//   const projected = trackOutline.map((p) => project(p.x, p.y));

//   for (let i = 0; i < projected.length - 1; i++) {
//     const mx = (projected[i].x + projected[i + 1].x) / 2;
//     const my = (projected[i].y + projected[i + 1].y) / 2;
//     const d  = Math.hypot(mx - fx, my - fy);
//     if (d < bestDist) {
//       bestDist = d;
//       best1    = i;
//       best2    = i + 1;
//     }
//   }

//   // Tangent vector along the track at that point
//   const tx = projected[best2].x - projected[best1].x;
//   const ty = projected[best2].y - projected[best1].y;
//   const len = Math.hypot(tx, ty) || 1;

//   // Perpendicular = rotate tangent 90°
//   const nx = -ty / len;
//   const ny =  tx / len;

//   const half = 18; // half-length of the finish line mark in SVG units
//   const x1   = fx + nx * half;
//   const y1   = fy + ny * half;
//   const x2   = fx - nx * half;
//   const y2   = fy - ny * half;

//   return (
//     <g>
//       {/* Chequered flag effect: alternating black/white segments */}
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#000000" strokeWidth="5" strokeLinecap="round"
//         strokeDasharray="4,4" />
//       {/* Outer glow */}
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#ffffff" strokeWidth="9" strokeLinecap="round" opacity="0.15" />
//     </g>
//   );
// };

// // ─── component ──────────────────────────────────────────────────────────────

// const RaceTrack = ({
//   drivers,
//   positions,
//   trackOutline,
//   bounds,
//   flag       = "clear",
//   showNames  = false,
//   finishLine = null,
// }: RaceTrackProps) => {
//   const project = useMemo(() => makeProjector(bounds), [bounds]);

//   // Build SVG path string once — only changes when track outline or bounds change
//   const trackPathD = useMemo(() => {
//     if (!trackOutline || trackOutline.length === 0) return "";
//     const pts     = trackOutline.map((p) => project(p.x, p.y));
//     const [first, ...rest] = pts;
//     return rest.reduce(
//       (acc, p) => `${acc} L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`,
//       `M ${first.x.toFixed(1)} ${first.y.toFixed(1)}`
//     ) + " Z";
//   }, [trackOutline, project]);

//   const safeFlag   = (flag || "clear").toLowerCase().trim();
//   const trackColor = FLAG_TRACK_COLOR[safeFlag] ?? FLAG_TRACK_COLOR.clear;

//   // Fallback to the first coordinate of the track outline if no explicit finish line is provided
//   const startLine = finishLine || (trackOutline?.length > 0 ? trackOutline[0] : null);

//   return (
//     <div className="w-full h-full">
//       <svg
//         viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
//         className="w-full h-full"
//         style={{ overflow: "visible" }}
//       >
//         {/* ── Track rendering — 3 layered strokes ── */}

//         {/* Layer 1: wide outer glow — gives the "circuit lit up" feel */}
//         <path
//           d={trackPathD}
//           stroke={trackColor}
//           strokeWidth="28"
//           fill="none"
//           strokeLinejoin="round"
//           strokeLinecap="round"
//           opacity="0.18"
//         />

//         {/* Layer 2: main tarmac surface */}
//         <path
//           d={trackPathD}
//           stroke={trackColor}
//           strokeWidth="14"
//           fill="none"
//           strokeLinejoin="round"
//           strokeLinecap="round"
//           opacity="0.9"
//         />

//         {/* Layer 3: inner edge highlight — the bright centre line
//             subtle white line that gives the track a 3D "lit from above" feel */}
//         <path
//           d={trackPathD}
//           stroke="#ffffff"
//           strokeWidth="2"
//           fill="none"
//           strokeLinejoin="round"
//           strokeLinecap="round"
//           opacity="0.12"
//         />

//         {/* ── Finish line ── */}
//         {startLine && (
//           <FinishLineMark
//             finishLine={startLine}
//             trackOutline={trackOutline}
//             project={project}
//           />
//         )}

//         {/* ── Cars ── */}
//         {drivers.map((d) => {
//           const pos = positions[d.code];
//           if (!pos || isNaN(pos.x) || isNaN(pos.y)) return null;

//           const { x, y } = project(pos.x, pos.y);
//           const r        = pos.in_pit ? 5 : 8;
//           const opacity  = pos.in_pit ? 0.55 : 1;

//           return (
//             <g
//               key={d.code}
//               opacity={opacity}
//               style={{ transition: "opacity 0.3s" }}
//             >
//               {/* Drop shadow ring — makes cars pop off dark track */}
//               <circle
//                 cx={x} cy={y} r={r + 3}
//                 fill="none"
//                 stroke="#000000"
//                 strokeWidth="3"
//                 opacity="0.5"
//                 style={{ transition: "cx 0.1s linear, cy 0.1s linear" }}
//               />

//               {/* Team color fill */}
//               <circle
//                 cx={x} cy={y} r={r}
//                 fill={d.color}
//                 stroke="#ffffff"
//                 strokeWidth="1.5"
//                 style={{ transition: "cx 0.1s linear, cy 0.1s linear" }}
//               />

//               {/* Driver name — only when toggled on via L key */}
//               {showNames && (
//                 <text
//                   x={x + r + 5}
//                   y={y + 4}
//                   fontSize="11"
//                   fontWeight="900"
//                   fill="#ffffff"
//                   stroke="#000000"
//                   strokeWidth="3"
//                   paintOrder="stroke"
//                   style={{
//                     transition:     "x 0.1s linear, y 0.1s linear",
//                     userSelect:     "none",
//                     pointerEvents:  "none",
//                   }}
//                 >
//                   {d.code}
//                 </text>
//               )}
//             </g>
//           );
//         })}
//       </svg>
//     </div>
//   );
// };

// export default RaceTrack;

// import { useMemo } from "react";

// export interface Driver {
//   code: string;
//   color: string;
// }

// export interface CarPosition {
//   x: number;
//   y: number;
//   lap: number | null;
//   in_pit: boolean;
// }

// export interface TrackPoint {
//   x: number;
//   y: number;
// }

// export interface Bounds {
//   x_min: number;
//   x_max: number;
//   y_min: number;
//   y_max: number;
// }

// export interface FinishLine {
//   x: number;
//   y: number;
// }

// export interface RaceTrackProps {
//   drivers: Driver[];
//   positions: Record<string, CarPosition>;
//   trackOutline: TrackPoint[];
//   bounds: Bounds;
//   flag?: string;
//   showNames?: boolean;
//   finishLine?: FinishLine | null;
// }

// // ─── constants ──────────────────────────────────────────────────────────────

// const VIEWBOX_W = 1000;
// const VIEWBOX_H = 1000;
// // Decreased padding from 40 to 25 to increase the overall size of the track slightly
// const PADDING   = 1;

// const FLAG_TRACK_COLOR: Record<string, string> = {
//   clear:      "#4a4a4a",
//   yellow:     "#ca8a04",
//   red:        "#dc2626",
//   safety_car: "#d97706",
//   vsc:        "#d97706",
//   vsc_ending: "#d97706",
// };

// // ─── projection ─────────────────────────────────────────────────────────────

// const makeProjector = (bounds: Bounds) => {
//   const dataW = bounds.x_max - bounds.x_min || 1;
//   const dataH = bounds.y_max - bounds.y_min || 1;
//   const availW = VIEWBOX_W - PADDING * 2;
//   const availH = VIEWBOX_H - PADDING * 2;

//   // Uniform scale — keeps circuit shape undistorted
//   const scale   = Math.min(availW / dataW, availH / dataH);
//   const offsetX = PADDING + (availW - dataW * scale) / 2;
//   const offsetY = PADDING + (availH - dataH * scale) / 2;

//   return (x: number, y: number) => ({
//     x: offsetX + (x - bounds.x_min) * scale,
//     // SVG y-axis is inverted vs telemetry y-axis
//     y: offsetY + (dataH - (y - bounds.y_min)) * scale,
//   });
// };

// // ─── finish line helper ──────────────────────────────────────────────────────

// /**
//  * Draws a short perpendicular stroke across the track at the finish line.
//  * We find the two track-outline points nearest the finish-line coordinate,
//  * compute the tangent direction between them, then draw a line 90° to it.
//  */
// const FinishLineMark = ({
//   finishLine,
//   trackOutline,
//   project,
// }: {
//   finishLine: FinishLine;
//   trackOutline: TrackPoint[];
//   project: (x: number, y: number) => { x: number; y: number };
// }) => {
//   const { x: fx, y: fy } = project(finishLine.x, finishLine.y);

//   // Find the two outline points nearest the projected finish point
//   let best1 = 0, best2 = 1, bestDist = Infinity;
//   const projected = trackOutline.map((p) => project(p.x, p.y));

//   for (let i = 0; i < projected.length - 1; i++) {
//     const mx = (projected[i].x + projected[i + 1].x) / 2;
//     const my = (projected[i].y + projected[i + 1].y) / 2;
//     const d  = Math.hypot(mx - fx, my - fy);
//     if (d < bestDist) {
//       bestDist = d;
//       best1    = i;
//       best2    = i + 1;
//     }
//   }

//   // Tangent vector along the track at that point
//   const tx = projected[best2].x - projected[best1].x;
//   const ty = projected[best2].y - projected[best1].y;
//   const len = Math.hypot(tx, ty) || 1;

//   // Perpendicular = rotate tangent 90°
//   const nx = -ty / len;
//   const ny =  tx / len;

//   const half = 18; // half-length of the finish line mark in SVG units
//   const x1   = fx + nx * half;
//   const y1   = fy + ny * half;
//   const x2   = fx - nx * half;
//   const y2   = fy - ny * half;

//   return (
//     <g>
//       {/* 1. Asphalt burn / shadow (gives the paint depth) */}
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#000000" strokeWidth="8" strokeLinecap="butt" opacity="0.5" />

//       {/* 2. Base white paint layer */}
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#ffffff" strokeWidth="6" strokeLinecap="butt" />

//       {/* 3. Crisp black squares (butt cap creates sharp checkerboard boxes) */}
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#111111" strokeWidth="6" strokeLinecap="butt"
//         strokeDasharray="4,4" />

//       {/* 4. Reflective paint highlight (only on the white squares) */}
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#ffffff" strokeWidth="2" strokeLinecap="butt"
//         strokeDasharray="4,4" strokeDashoffset="4" opacity="0.9" />

//       {/* 5. Soft ambient bloom/glow to match the rest of the track */}
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#ffffff" strokeWidth="14" strokeLinecap="round" opacity="0.12" />
//     </g>
//   );
// };

// // ─── component ──────────────────────────────────────────────────────────────

// const RaceTrack = ({
//   drivers,
//   positions,
//   trackOutline,
//   bounds,
//   flag       = "clear",
//   showNames  = false,
//   finishLine = null,
// }: RaceTrackProps) => {
//   const project = useMemo(() => makeProjector(bounds), [bounds]);

//   // Build SVG path string once — only changes when track outline or bounds change
//   const trackPathD = useMemo(() => {
//     if (!trackOutline || trackOutline.length === 0) return "";
//     const pts     = trackOutline.map((p) => project(p.x, p.y));
//     const [first, ...rest] = pts;
//     return rest.reduce(
//       (acc, p) => `${acc} L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`,
//       `M ${first.x.toFixed(1)} ${first.y.toFixed(1)}`
//     ) + " Z";
//   }, [trackOutline, project]);

//   const safeFlag   = (flag || "clear").toLowerCase().trim();
//   const trackColor = FLAG_TRACK_COLOR[safeFlag] ?? FLAG_TRACK_COLOR.clear;

//   // Fallback to the first coordinate of the track outline if no explicit finish line is provided
//   const startLine = finishLine || (trackOutline?.length > 0 ? trackOutline[0] : null);

//   return (
//     <div className="w-full h-full">
//       <svg
//         viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
//         className="w-full h-full"
//         style={{ overflow: "visible" }}
//       >
//         {/* ── Track rendering — 3 layered strokes ── */}

//         {/* Layer 1: wide outer glow — gives the "circuit lit up" feel */}
//         <path
//           d={trackPathD}
//           stroke={trackColor}
//           strokeWidth="28"
//           fill="none"
//           strokeLinejoin="round"
//           strokeLinecap="round"
//           opacity="0.18"
//         />

//         {/* Layer 2: main tarmac surface */}
//         <path
//           d={trackPathD}
//           stroke={trackColor}
//           strokeWidth="14"
//           fill="none"
//           strokeLinejoin="round"
//           strokeLinecap="round"
//           opacity="0.9"
//         />

//         {/* Layer 3: inner edge highlight — the bright centre line
//             subtle white line that gives the track a 3D "lit from above" feel */}
//         <path
//           d={trackPathD}
//           stroke="#ffffff"
//           strokeWidth="2"
//           fill="none"
//           strokeLinejoin="round"
//           strokeLinecap="round"
//           opacity="0.12"
//         />

//         {/* ── Finish line ── */}
//         {startLine && (
//           <FinishLineMark
//             finishLine={startLine}
//             trackOutline={trackOutline}
//             project={project}
//           />
//         )}

//         {/* ── Cars ── */}
//         {drivers.map((d) => {
//           const pos = positions[d.code];
//           if (!pos || isNaN(pos.x) || isNaN(pos.y)) return null;

//           const { x, y } = project(pos.x, pos.y);
//           const r        = pos.in_pit ? 5 : 8;
//           const opacity  = pos.in_pit ? 0.55 : 1;

//           return (
//             <g
//               key={d.code}
//               opacity={opacity}
//               style={{ transition: "opacity 0.3s" }}
//             >
//               {/* Drop shadow ring — makes cars pop off dark track */}
//               <circle
//                 cx={x} cy={y} r={r + 3}
//                 fill="none"
//                 stroke="#000000"
//                 strokeWidth="3"
//                 opacity="0.5"
//                 style={{ transition: "cx 0.1s linear, cy 0.1s linear" }}
//               />

//               {/* Team color fill */}
//               <circle
//                 cx={x} cy={y} r={r}
//                 fill={d.color}
//                 stroke="#ffffff"
//                 strokeWidth="1.5"
//                 style={{ transition: "cx 0.1s linear, cy 0.1s linear" }}
//               />

//               {/* Driver name — only when toggled on via L key */}
//               {showNames && (
//                 <text
//                   x={x + r + 5}
//                   y={y + 4}
//                   fontSize="11"
//                   fontWeight="900"
//                   fill="#ffffff"
//                   stroke="#000000"
//                   strokeWidth="3"
//                   paintOrder="stroke"
//                   style={{
//                     transition:     "x 0.1s linear, y 0.1s linear",
//                     userSelect:     "none",
//                     pointerEvents:  "none",
//                   }}
//                 >
//                   {d.code}
//                 </text>
//               )}
//             </g>
//           );
//         })}
//       </svg>
//     </div>
//   );
// };

// export default RaceTrack;\\
// import { useMemo } from "react";

// export interface Driver {
//   code: string;
//   color: string;
// }

// export interface CarPosition {
//   x: number;
//   y: number;
//   lap: number | null;
//   in_pit: boolean;
// }

// export interface TrackPoint {
//   x: number;
//   y: number;
// }

// export interface Bounds {
//   x_min: number;
//   x_max: number;
//   y_min: number;
//   y_max: number;
// }

// export interface FinishLine {
//   x: number;
//   y: number;
// }

// export interface RaceTrackProps {
//   drivers: Driver[];
//   positions: Record<string, CarPosition>;
//   trackOutline: TrackPoint[];
//   bounds: Bounds;
//   flag?: string;
//   showNames?: boolean;
//   finishLine?: FinishLine | null;
//   transitionMs?: number; // 🛠️ NEW: Dynamic sync for smooth gliding
// }

// // ─── constants ──────────────────────────────────────────────────────────────

// const VIEWBOX_W = 1000;
// const VIEWBOX_H = 1000;
// const PADDING   = 1;

// const FLAG_TRACK_COLOR: Record<string, string> = {
//   clear:      "#4a4a4a",
//   yellow:     "#ca8a04",
//   red:        "#dc2626",
//   safety_car: "#d97706",
//   vsc:        "#d97706",
//   vsc_ending: "#d97706",
// };

// // ─── projection ─────────────────────────────────────────────────────────────

// const makeProjector = (bounds: Bounds) => {
//   const dataW = bounds.x_max - bounds.x_min || 1;
//   const dataH = bounds.y_max - bounds.y_min || 1;
//   const availW = VIEWBOX_W - PADDING * 2;
//   const availH = VIEWBOX_H - PADDING * 2;

//   const scale   = Math.min(availW / dataW, availH / dataH);
//   const offsetX = PADDING + (availW - dataW * scale) / 2;
//   const offsetY = PADDING + (availH - dataH * scale) / 2;

//   return (x: number, y: number) => ({
//     x: offsetX + (x - bounds.x_min) * scale,
//     y: offsetY + (dataH - (y - bounds.y_min)) * scale,
//   });
// };

// // ─── finish line helper ──────────────────────────────────────────────────────

// const FinishLineMark = ({
//   finishLine,
//   trackOutline,
//   project,
// }: {
//   finishLine: FinishLine;
//   trackOutline: TrackPoint[];
//   project: (x: number, y: number) => { x: number; y: number };
// }) => {
//   const { x: fx, y: fy } = project(finishLine.x, finishLine.y);

//   let best1 = 0, best2 = 1, bestDist = Infinity;
//   const projected = trackOutline.map((p) => project(p.x, p.y));

//   for (let i = 0; i < projected.length - 1; i++) {
//     const mx = (projected[i].x + projected[i + 1].x) / 2;
//     const my = (projected[i].y + projected[i + 1].y) / 2;
//     const d  = Math.hypot(mx - fx, my - fy);
//     if (d < bestDist) {
//       bestDist = d;
//       best1    = i;
//       best2    = i + 1;
//     }
//   }

//   const tx = projected[best2].x - projected[best1].x;
//   const ty = projected[best2].y - projected[best1].y;
//   const len = Math.hypot(tx, ty) || 1;

//   const nx = -ty / len;
//   const ny =  tx / len;

//   const half = 18; 
//   const x1   = fx + nx * half;
//   const y1   = fy + ny * half;
//   const x2   = fx - nx * half;
//   const y2   = fy - ny * half;

//   return (
//     <g>
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#000000" strokeWidth="8" strokeLinecap="butt" opacity="0.5" />
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#ffffff" strokeWidth="6" strokeLinecap="butt" />
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#111111" strokeWidth="6" strokeLinecap="butt"
//         strokeDasharray="4,4" />
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#ffffff" strokeWidth="2" strokeLinecap="butt"
//         strokeDasharray="4,4" strokeDashoffset="4" opacity="0.9" />
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#ffffff" strokeWidth="14" strokeLinecap="round" opacity="0.12" />
//     </g>
//   );
// };

// // ─── component ──────────────────────────────────────────────────────────────

// const RaceTrack = ({
//   drivers,
//   positions,
//   trackOutline,
//   bounds,
//   flag       = "clear",
//   showNames  = false,
//   finishLine = null,
//   transitionMs = 300, 
// }: RaceTrackProps) => {
//   const project = useMemo(() => makeProjector(bounds), [bounds]);

//   const trackPathD = useMemo(() => {
//     if (!trackOutline || trackOutline.length === 0) return "";
//     const pts     = trackOutline.map((p) => project(p.x, p.y));
//     const [first, ...rest] = pts;
//     return rest.reduce(
//       // 🛠️ FIX: Removed .toFixed(1) to stop the track line from rounding/shifting under the cars
//       (acc, p) => `${acc} L ${p.x.toFixed(3)} ${p.y.toFixed(3)}`,
//       `M ${first.x.toFixed(3)} ${first.y.toFixed(3)}`
//     ) + " Z";
//   }, [trackOutline, project]);

//   const safeFlag   = (flag || "clear").toLowerCase().trim();
//   const trackColor = FLAG_TRACK_COLOR[safeFlag] ?? FLAG_TRACK_COLOR.clear;
//   const startLine = finishLine || (trackOutline?.length > 0 ? trackOutline[0] : null);

//   // 🛠️ FIX: Perfect timing sync for CSS transitions
//   const smoothTransform = `cx ${transitionMs}ms linear, cy ${transitionMs}ms linear`;
//   const textTransform = `x ${transitionMs}ms linear, y ${transitionMs}ms linear`;

//   return (
//     <div className="w-full h-full">
//       <svg
//         viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
//         className="w-full h-full"
//         style={{ overflow: "visible" }}
//       >
//         <path d={trackPathD} stroke={trackColor} strokeWidth="28" fill="none" strokeLinejoin="round" strokeLinecap="round" opacity="0.18" />
//         <path d={trackPathD} stroke={trackColor} strokeWidth="14" fill="none" strokeLinejoin="round" strokeLinecap="round" opacity="0.9" />
//         <path d={trackPathD} stroke="#ffffff" strokeWidth="2" fill="none" strokeLinejoin="round" strokeLinecap="round" opacity="0.12" />

//         {startLine && (
//           <FinishLineMark finishLine={startLine} trackOutline={trackOutline} project={project} />
//         )}

//         {drivers.map((d) => {
//           const pos = positions[d.code];
//           if (!pos || isNaN(pos.x) || isNaN(pos.y)) return null;

//           const { x, y } = project(pos.x, pos.y);
//           // 🛠️ FIX: Locked all cars to size 8, regardless of pitting
//           const r = 8;
//           const opacity = pos.in_pit ? 0.55 : 1;

//           return (
//             <g key={d.code} opacity={opacity} style={{ transition: "opacity 0.2s" }}>
//               <circle
//                 cx={x} cy={y} r={r + 3}
//                 fill="none" stroke="#000000" strokeWidth="3" opacity="0.5"
//                 style={{ transition: smoothTransform }}
//               />
//               <circle
//                 cx={x} cy={y} r={r}
//                 fill={d.color} stroke="#ffffff" strokeWidth="1.5"
//                 style={{ transition: smoothTransform }}
//               />
//               {showNames && (
//                 <text
//                   x={x + r + 5} y={y + 4}
//                   fontSize="11" fontWeight="900" fill="#ffffff" stroke="#000000" strokeWidth="3" paintOrder="stroke"
//                   style={{ transition: textTransform, userSelect: "none", pointerEvents: "none" }}
//                 >
//                   {d.code}
//                 </text>
//               )}
//             </g>
//           );
//         })}
//       </svg>
//     </div>
//   );
// };

// export default RaceTrack;

// import { useMemo, useRef } from "react";

// export interface Driver {
//   code: string;
//   color: string;
// }

// export interface CarPosition {
//   x: number;
//   y: number;
//   lap: number | null;
//   in_pit: boolean;
// }

// export interface TrackPoint {
//   x: number;
//   y: number;
// }

// export interface Bounds {
//   x_min: number;
//   x_max: number;
//   y_min: number;
//   y_max: number;
// }

// export interface FinishLine {
//   x: number;
//   y: number;
// }

// export interface RaceTrackProps {
//   drivers: Driver[];
//   positions: Record<string, CarPosition>;
//   trackOutline: TrackPoint[];
//   bounds: Bounds;
//   flag?: string;
//   showNames?: boolean;
//   finishLine?: FinishLine | null;
//   transitionMs?: number;
//   // Set of driver codes who have retired — their circles are removed from the track entirely.
//   // The backend keeps sending their last known coordinates, so we must filter them out explicitly.
//   retiredDrivers?: Set<string>;
// }

// // ─── constants ───────────────────────────────────────────────────────────────

// const VIEWBOX_W = 1000;
// const VIEWBOX_H = 1000;
// // Generous padding so cars at the edge are never clipped
// const PADDING   = 40;

// // Car sizes
// const CAR_R_RACING = 8;
// const CAR_R_PIT    = 5;

// // Pit debounce: how many consecutive in_pit=true frames before we confirm pit state.
// // Must match Leaderboard.tsx so both update at the same frame.
// const PIT_CONFIRM_THRESHOLD = 3;

// // If a car's dist jumped more than this many meters since the last render,
// // it's moving at racing speed — clear the pit flag even if backend says
// // in_pit=true. Must match Leaderboard.tsx's RACING_SPEED_DIST_THRESHOLD so
// // the track dot and the leaderboard badge come back to normal on the same
// // frame instead of the dot staying dimmed/small after the badge clears.
// const RACING_SPEED_DIST_THRESHOLD = 45;

// const FLAG_TRACK_COLOR: Record<string, string> = {
//   clear:      "#5a5a5a",
//   yellow:     "#ca8a04",
//   red:        "#dc2626",
//   safety_car: "#d97706",
//   vsc:        "#d97706",
//   vsc_ending: "#d97706",
// };

// // ─── projection ──────────────────────────────────────────────────────────────

// const makeProjector = (bounds: Bounds) => {
//   const dataW  = bounds.x_max - bounds.x_min || 1;
//   const dataH  = bounds.y_max - bounds.y_min || 1;
//   const availW = VIEWBOX_W - PADDING * 2;
//   const availH = VIEWBOX_H - PADDING * 2;

//   const scale   = Math.min(availW / dataW, availH / dataH);
//   const offsetX = PADDING + (availW - dataW * scale) / 2;
//   const offsetY = PADDING + (availH - dataH * scale) / 2;

//   return (x: number, y: number) => ({
//     x: offsetX + (x - bounds.x_min) * scale,
//     // FastF1 Y increases upward, SVG Y increases downward — flip it
//     y: offsetY + (dataH - (y - bounds.y_min)) * scale,
//   });
// };

// // ─── finish line ─────────────────────────────────────────────────────────────

// const FinishLineMark = ({
//   finishLine,
//   trackOutline,
//   project,
// }: {
//   finishLine: FinishLine;
//   trackOutline: TrackPoint[];
//   project: (x: number, y: number) => { x: number; y: number };
// }) => {
//   const { x: fx, y: fy } = project(finishLine.x, finishLine.y);
//   const projected = trackOutline.map((p) => project(p.x, p.y));

//   let best1 = 0, best2 = 1, bestDist = Infinity;
//   for (let i = 0; i < projected.length - 1; i++) {
//     const mx = (projected[i].x + projected[i + 1].x) / 2;
//     const my = (projected[i].y + projected[i + 1].y) / 2;
//     const d  = Math.hypot(mx - fx, my - fy);
//     if (d < bestDist) { bestDist = d; best1 = i; best2 = i + 1; }
//   }

//   const tx  = projected[best2].x - projected[best1].x;
//   const ty  = projected[best2].y - projected[best1].y;
//   const len = Math.hypot(tx, ty) || 1;
//   const nx  = -ty / len;
//   const ny  =  tx / len;
//   const half = 20;

//   const x1 = fx + nx * half, y1 = fy + ny * half;
//   const x2 = fx - nx * half, y2 = fy - ny * half;

//   return (
//     <g>
//       <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#000" strokeWidth="10" strokeLinecap="butt" opacity="0.4" />
//       <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#fff" strokeWidth="7"  strokeLinecap="butt" />
//       <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#111" strokeWidth="7"  strokeLinecap="butt" strokeDasharray="5,5" />
//       <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#fff" strokeWidth="2"  strokeLinecap="butt" strokeDasharray="5,5" strokeDashoffset="5" opacity="0.9" />
//       <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#fff" strokeWidth="16" strokeLinecap="round" opacity="0.08" />
//     </g>
//   );
// };

// // ─── main component ──────────────────────────────────────────────────────────

// const RaceTrack = ({
//   drivers,
//   positions,
//   trackOutline,
//   bounds,
//   flag            = "clear",
//   showNames       = false,
//   finishLine      = null,
//   transitionMs    = 300,
//   retiredDrivers  = new Set<string>(),
// }: RaceTrackProps) => {
//   const project = useMemo(() => makeProjector(bounds), [bounds]);

//   // ── debounced pit state (mirrors Leaderboard.tsx logic exactly) ──
//   const pitCounterRef = useRef<Map<string, number>>(new Map());
//   // Tracks each driver's dist from the previous render (for exit speed check)
//   const prevDistRef = useRef<Map<string, number>>(new Map());

//   const trackPathD = useMemo(() => {
//     if (!trackOutline || trackOutline.length === 0) return "";
//     const pts          = trackOutline.map((p) => project(p.x, p.y));
//     const [first, ...rest] = pts;
//     return (
//       rest.reduce(
//         (acc, p) => `${acc} L ${p.x.toFixed(3)} ${p.y.toFixed(3)}`,
//         `M ${first.x.toFixed(3)} ${first.y.toFixed(3)}`
//       ) + " Z"
//     );
//   }, [trackOutline, project]);

//   const safeFlag   = (flag || "clear").toLowerCase().trim();
//   const trackColor = FLAG_TRACK_COLOR[safeFlag] ?? FLAG_TRACK_COLOR.clear;
//   const startLine  = finishLine || (trackOutline?.length > 0 ? trackOutline[0] : null);

//   const smoothTransform = `cx ${transitionMs}ms linear, cy ${transitionMs}ms linear`;
//   const textTransform   = `x ${transitionMs}ms linear, y ${transitionMs}ms linear`;
//   const sizeTransition  = `r 200ms ease-in-out`;

//   // Build confirmed pit states for all drivers this render
//   const confirmedPitMap = useMemo(() => {
//     const map = new Map<string, boolean>();
//     drivers.forEach((d) => {
//       const pos  = positions[d.code];
//       const dist = pos?.distance ?? pos?.dist ?? 0;

//       // ── Speed-based exit override ──────────────────────────────────────
//       // If the car moved more than RACING_SPEED_DIST_THRESHOLD meters since
//       // the last render, it's back at racing speed → not in the pit
//       // regardless of what the backend flag says. Without this, the dot
//       // stays dimmed/small for as long as the backend's in_pit stays true,
//       // which is why it wasn't returning to its original color/size.
//       const prevDist      = prevDistRef.current.get(d.code) ?? dist;
//       const distDelta     = dist - prevDist;
//       prevDistRef.current.set(d.code, dist);
//       const isMovingFast  = distDelta > RACING_SPEED_DIST_THRESHOLD;

//       const rawInPit = (pos?.in_pit || false) && !isMovingFast;
//       const prev     = pitCounterRef.current.get(d.code) ?? 0;
//       const next     = rawInPit ? prev + 1 : 0;
//       pitCounterRef.current.set(d.code, next);
//       map.set(d.code, next >= PIT_CONFIRM_THRESHOLD);
//     });
//     return map;
//   }, [drivers, positions]);

//   return (
//     <div className="w-full h-full">
//       <svg
//         viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
//         className="w-full h-full"
//         style={{ overflow: "visible" }}
//       >
//         {/* ── track layers ── */}
//         {/* Outer glow */}
//         <path d={trackPathD} stroke={trackColor} strokeWidth="38" fill="none"
//           strokeLinejoin="round" strokeLinecap="round" opacity="0.10" />
//         {/* Road body — wider than before so car dots sit inside it */}
//         <path d={trackPathD} stroke={trackColor} strokeWidth="22" fill="none"
//           strokeLinejoin="round" strokeLinecap="round" opacity="0.85" />
//         {/* Kerb highlight */}
//         <path d={trackPathD} stroke="#ffffff" strokeWidth="2" fill="none"
//           strokeLinejoin="round" strokeLinecap="round" opacity="0.08" />

//         {startLine && (
//           <FinishLineMark
//             finishLine={startLine}
//             trackOutline={trackOutline}
//             project={project}
//           />
//         )}

//         {/* ── cars ── */}
//         {drivers.map((d) => {
//           // Retired drivers: backend keeps sending last known coordinates,
//           // so we must explicitly skip them here rather than relying on !pos.
//           if (retiredDrivers.has(d.code)) return null;

//           const pos = positions[d.code];
//           if (!pos || isNaN(pos.x) || isNaN(pos.y)) return null;

//           const { x, y }   = project(pos.x, pos.y);
//           const isPitting   = confirmedPitMap.get(d.code) ?? false;
//           const r           = isPitting ? CAR_R_PIT : CAR_R_RACING;

//           return (
//             <g key={d.code}>
//               {/* ── shadow ring (always present, gives depth) ── */}
//               <circle
//                 cx={x} cy={y} r={r + 4}
//                 fill="none" stroke="#000000" strokeWidth="4" opacity="0.35"
//                 style={{ transition: `${smoothTransform}, ${sizeTransition}` }}
//               />

//               {/* ── pit indicator ring (only visible when pitting) ── */}
//               {isPitting && (
//                 <circle
//                   cx={x} cy={y} r={r + 7}
//                   fill="none"
//                   stroke="#facc15"
//                   strokeWidth="1.5"
//                   strokeDasharray="3 3"
//                   opacity="0.7"
//                   style={{ transition: smoothTransform }}
//                 />
//               )}

//               {/* ── car body ── */}
//               <circle
//                 cx={x} cy={y} r={r}
//                 fill={isPitting ? "#4a4a4a" : d.color}
//                 stroke={isPitting ? "#888888" : "#ffffff"}
//                 strokeWidth={isPitting ? 1 : 1.5}
//                 opacity={isPitting ? 0.6 : 1}
//                 style={{ transition: `${smoothTransform}, ${sizeTransition}, opacity 200ms ease-in-out` }}
//               />

//               {/* ── driver label ── */}
//               {showNames && (
//                 <text
//                   x={x + r + 5} y={y + 4}
//                   fontSize="11" fontWeight="900"
//                   fill={isPitting ? "#888" : "#ffffff"}
//                   stroke="#000000" strokeWidth="3" paintOrder="stroke"
//                   style={{
//                     transition: textTransform,
//                     userSelect: "none",
//                     pointerEvents: "none",
//                   }}
//                 >
//                   {d.code}
//                 </text>
//               )}
//             </g>
//           );
//         })}
//       </svg>
//     </div>
//   );
// };

// export default RaceTrack;

// import { useMemo } from "react";

// export interface Driver {
//   code: string;
//   color: string;
// }

// export interface CarPosition {
//   x: number;
//   y: number;
//   lap: number | null;
//   in_pit: boolean;
// }

// export interface TrackPoint {
//   x: number;
//   y: number;
// }

// export interface Bounds {
//   x_min: number;
//   x_max: number;
//   y_min: number;
//   y_max: number;
// }

// export interface RaceTrackProps {
//   drivers: Driver[];
//   positions: Record<string, CarPosition>;
//   trackOutline: TrackPoint[];
//   bounds: Bounds;
//   flag?: string; 
// }

// const VIEWBOX_WIDTH = 1000;
// const VIEWBOX_HEIGHT = 1000;
// const PADDING = 45; 

// const FLAG_COLORS: Record<string, string> = {
//   clear: "#525252", 
//   "1": "#525252",
//   yellow: "#e6c900",
//   "2": "#e6c900",
//   red: "#dc2626",
//   "5": "#dc2626",
//   safety_car: "#f59e0b",
//   "4": "#f59e0b",
//   vsc: "#f59e0b",
//   "6": "#f59e0b",
//   vsc_ending: "#f59e0b",
//   "7": "#f59e0b",
// };

// const FLAG_LABELS: Record<string, string> = {
//   yellow: "YELLOW FLAG",
//   "2": "YELLOW FLAG",
//   red: "RED FLAG",
//   "5": "RED FLAG",
//   safety_car: "SAFETY CAR DEPLOYED",
//   "4": "SAFETY CAR DEPLOYED",
//   vsc: "VIRTUAL SAFETY CAR",
//   "6": "VIRTUAL SAFETY CAR",
//   vsc_ending: "VSC ENDING",
//   "7": "VSC ENDING",
// };

// const makeProjector = (bounds: Bounds) => {
//   const dataWidth = bounds.x_max - bounds.x_min || 1;
//   const dataHeight = bounds.y_max - bounds.y_min || 1;
//   const availableWidth = VIEWBOX_WIDTH - PADDING * 2;
//   const availableHeight = VIEWBOX_HEIGHT - PADDING * 2;
//   const scale = Math.min(availableWidth / dataWidth, availableHeight / dataHeight);
//   const offsetX = PADDING + (availableWidth - dataWidth * scale) / 2;
//   const offsetY = PADDING + (availableHeight - dataHeight * scale) / 2;

//   return (x: number, y: number) => {
//     const svgX = offsetX + (x - bounds.x_min) * scale;
//     const svgY = offsetY + (dataHeight - (y - bounds.y_min)) * scale;
//     return { x: svgX, y: svgY };
//   };
// };

// const RaceTrack = ({ drivers, positions, trackOutline, bounds, flag }: RaceTrackProps) => {
//   const project = useMemo(() => makeProjector(bounds), [bounds]);

//   const trackPathD = useMemo(() => {
//     if (!trackOutline || trackOutline.length === 0) return "";
//     const points = trackOutline.map((p) => project(p.x, p.y));
//     const [first, ...rest] = points;
//     const path = rest.reduce(
//       (acc, p) => `${acc} L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`,
//       `M ${first.x.toFixed(2)} ${first.y.toFixed(2)}`
//     );
//     return `${path} Z`;
//   }, [trackOutline, project]);

//   const safeFlag = (flag || "clear").toString().toLowerCase().trim();
//   const trackColor = FLAG_COLORS[safeFlag] || FLAG_COLORS.clear;
//   const isFlagActive = safeFlag !== "clear" && safeFlag !== "1" && !!FLAG_LABELS[safeFlag];

//   return (
//     <div className="w-full h-full flex items-center justify-center relative">
      
//       {/* 🛠️ FIX: Sleek, F1 Broadcast Style Flag Banner */}
//       {isFlagActive && (
//         <div className="absolute top-8 left-1/2 -translate-x-1/2 z-[100] flex items-stretch bg-neutral-900/95 backdrop-blur-md border border-neutral-700/50 rounded-lg shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden">
//           <div className="w-2" style={{ backgroundColor: trackColor }} />
//           <div className="px-6 py-2.5 flex items-center gap-3">
//             <span 
//               className="w-3 h-3 rounded-full animate-pulse" 
//               style={{ backgroundColor: trackColor, boxShadow: `0 0 10px ${trackColor}` }} 
//             />
//             <span className="font-black text-sm tracking-widest text-white uppercase">
//               {FLAG_LABELS[safeFlag]}
//             </span>
//           </div>
//         </div>
//       )}

//       <svg viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`} className="w-full h-full drop-shadow-2xl">
//         <path d={trackPathD} stroke={trackColor} strokeWidth="24" fill="none" strokeLinejoin="round" opacity="0.3" />
//         <path d={trackPathD} stroke={trackColor} strokeWidth="12" fill="none" strokeLinejoin="round" />
//         <path d={trackPathD} stroke="#ffffff" strokeWidth="1.5" strokeDasharray="4,6" fill="none" strokeLinejoin="round" opacity="0.4" />

//         {drivers.map((d) => {
//           const pos = positions[d.code];
//           if (!pos || isNaN(pos.x)) return null;
          
//           const { x, y } = project(pos.x, pos.y);
//           return (
//             <g key={d.code} style={{ transition: "transform 0.1s linear" }}>
//               <circle
//                 cx={x} cy={y}
//                 r="8"
//                 fill={d.color}
//                 stroke="#fff"
//                 strokeWidth="1.5"
//                 style={{ transition: "cx 0.1s linear, cy 0.1s linear" }}
//               />
//               <text
//                 x={x + 12} y={y + 3}
//                 fontSize="11"
//                 fontWeight="900"
//                 fill="#fff"
//                 className="drop-shadow-md"
//                 style={{ transition: "x 0.1s linear, y 0.1s linear" }}
//               >
//                 {d.code}
//               </text>
//             </g>
//           );
//         })}
//       </svg>
//     </div>
//   );
// };

// export default RaceTrack;

// import { useMemo } from "react";

// export interface Driver {
//   code: string;
//   color: string;
// }

// export interface CarPosition {
//   x: number;
//   y: number;
//   lap: number | null;
//   in_pit: boolean;
// }

// export interface TrackPoint {
//   x: number;
//   y: number;
// }

// export interface Bounds {
//   x_min: number;
//   x_max: number;
//   y_min: number;
//   y_max: number;
// }

// export interface FinishLine {
//   x: number;
//   y: number;
// }

// export interface RaceTrackProps {
//   drivers: Driver[];
//   positions: Record<string, CarPosition>;
//   trackOutline: TrackPoint[];
//   bounds: Bounds;
//   flag?: string;
//   showNames?: boolean;
//   finishLine?: FinishLine | null;
// }

// // ─── constants ──────────────────────────────────────────────────────────────

// const VIEWBOX_W = 1000;
// const VIEWBOX_H = 1000;
// const PADDING   = 40;

// const FLAG_TRACK_COLOR: Record<string, string> = {
//   clear:      "#4a4a4a",
//   yellow:     "#ca8a04",
//   red:        "#dc2626",
//   safety_car: "#d97706",
//   vsc:        "#d97706",
//   vsc_ending: "#d97706",
// };

// // ─── projection ─────────────────────────────────────────────────────────────

// const makeProjector = (bounds: Bounds) => {
//   const dataW = bounds.x_max - bounds.x_min || 1;
//   const dataH = bounds.y_max - bounds.y_min || 1;
//   const availW = VIEWBOX_W - PADDING * 2;
//   const availH = VIEWBOX_H - PADDING * 2;

//   // Uniform scale — keeps circuit shape undistorted
//   const scale   = Math.min(availW / dataW, availH / dataH);
//   const offsetX = PADDING + (availW - dataW * scale) / 2;
//   const offsetY = PADDING + (availH - dataH * scale) / 2;

//   return (x: number, y: number) => ({
//     x: offsetX + (x - bounds.x_min) * scale,
//     // SVG y-axis is inverted vs telemetry y-axis
//     y: offsetY + (dataH - (y - bounds.y_min)) * scale,
//   });
// };

// // ─── finish line helper ──────────────────────────────────────────────────────

// /**
//  * Draws a short perpendicular stroke across the track at the finish line.
//  * We find the two track-outline points nearest the finish-line coordinate,
//  * compute the tangent direction between them, then draw a line 90° to it.
//  */
// const FinishLineMark = ({
//   finishLine,
//   trackOutline,
//   project,
// }: {
//   finishLine: FinishLine;
//   trackOutline: TrackPoint[];
//   project: (x: number, y: number) => { x: number; y: number };
// }) => {
//   const { x: fx, y: fy } = project(finishLine.x, finishLine.y);

//   // Find the two outline points nearest the projected finish point
//   let best1 = 0, best2 = 1, bestDist = Infinity;
//   const projected = trackOutline.map((p) => project(p.x, p.y));

//   for (let i = 0; i < projected.length - 1; i++) {
//     const mx = (projected[i].x + projected[i + 1].x) / 2;
//     const my = (projected[i].y + projected[i + 1].y) / 2;
//     const d  = Math.hypot(mx - fx, my - fy);
//     if (d < bestDist) {
//       bestDist = d;
//       best1    = i;
//       best2    = i + 1;
//     }
//   }

//   // Tangent vector along the track at that point
//   const tx = projected[best2].x - projected[best1].x;
//   const ty = projected[best2].y - projected[best1].y;
//   const len = Math.hypot(tx, ty) || 1;

//   // Perpendicular = rotate tangent 90°
//   const nx = -ty / len;
//   const ny =  tx / len;

//   const half = 18; // half-length of the finish line mark in SVG units
//   const x1   = fx + nx * half;
//   const y1   = fy + ny * half;
//   const x2   = fx - nx * half;
//   const y2   = fy - ny * half;

//   return (
//     <g>
//       {/* Chequered flag effect: alternating black/white segments */}
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#000000" strokeWidth="5" strokeLinecap="round"
//         strokeDasharray="4,4" />
//       {/* Outer glow */}
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#ffffff" strokeWidth="9" strokeLinecap="round" opacity="0.15" />
//     </g>
//   );
// };

// // ─── component ──────────────────────────────────────────────────────────────

// const RaceTrack = ({
//   drivers,
//   positions,
//   trackOutline,
//   bounds,
//   flag       = "clear",
//   showNames  = false,
//   finishLine = null,
// }: RaceTrackProps) => {
//   const project = useMemo(() => makeProjector(bounds), [bounds]);

//   // Build SVG path string once — only changes when track outline or bounds change
//   const trackPathD = useMemo(() => {
//     if (!trackOutline || trackOutline.length === 0) return "";
//     const pts     = trackOutline.map((p) => project(p.x, p.y));
//     const [first, ...rest] = pts;
//     return rest.reduce(
//       (acc, p) => `${acc} L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`,
//       `M ${first.x.toFixed(1)} ${first.y.toFixed(1)}`
//     ) + " Z";
//   }, [trackOutline, project]);

//   const safeFlag   = (flag || "clear").toLowerCase().trim();
//   const trackColor = FLAG_TRACK_COLOR[safeFlag] ?? FLAG_TRACK_COLOR.clear;

//   return (
//     <div className="w-full h-full">
//       <svg
//         viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
//         className="w-full h-full"
//         style={{ overflow: "visible" }}
//       >
//         {/* ── Track rendering — 3 layered strokes ── */}

//         {/* Layer 1: wide outer glow — gives the "circuit lit up" feel */}
//         <path
//           d={trackPathD}
//           stroke={trackColor}
//           strokeWidth="28"
//           fill="none"
//           strokeLinejoin="round"
//           strokeLinecap="round"
//           opacity="0.18"
//         />

//         {/* Layer 2: main tarmac surface */}
//         <path
//           d={trackPathD}
//           stroke={trackColor}
//           strokeWidth="14"
//           fill="none"
//           strokeLinejoin="round"
//           strokeLinecap="round"
//           opacity="0.9"
//         />

//         {/* Layer 3: inner edge highlight — the bright centre line
//             subtle white line that gives the track a 3D "lit from above" feel */}
//         <path
//           d={trackPathD}
//           stroke="#ffffff"
//           strokeWidth="2"
//           fill="none"
//           strokeLinejoin="round"
//           strokeLinecap="round"
//           opacity="0.12"
//         />

//         {/* ── Finish line ── */}
//         {finishLine && (
//           <FinishLineMark
//             finishLine={finishLine}
//             trackOutline={trackOutline}
//             project={project}
//           />
//         )}

//         {/* ── Cars ── */}
//         {drivers.map((d) => {
//           const pos = positions[d.code];
//           if (!pos || isNaN(pos.x) || isNaN(pos.y)) return null;

//           const { x, y } = project(pos.x, pos.y);
//           const r        = pos.in_pit ? 5 : 8;
//           const opacity  = pos.in_pit ? 0.55 : 1;

//           return (
//             <g
//               key={d.code}
//               opacity={opacity}
//               style={{ transition: "opacity 0.3s" }}
//             >
//               {/* Drop shadow ring — makes cars pop off dark track */}
//               <circle
//                 cx={x} cy={y} r={r + 3}
//                 fill="none"
//                 stroke="#000000"
//                 strokeWidth="3"
//                 opacity="0.5"
//                 style={{ transition: "cx 0.1s linear, cy 0.1s linear" }}
//               />

//               {/* Team color fill */}
//               <circle
//                 cx={x} cy={y} r={r}
//                 fill={d.color}
//                 stroke="#ffffff"
//                 strokeWidth="1.5"
//                 style={{ transition: "cx 0.1s linear, cy 0.1s linear" }}
//               />

//               {/* Driver name — only when toggled on via L key */}
//               {showNames && (
//                 <text
//                   x={x + r + 5}
//                   y={y + 4}
//                   fontSize="11"
//                   fontWeight="900"
//                   fill="#ffffff"
//                   stroke="#000000"
//                   strokeWidth="3"
//                   paintOrder="stroke"
//                   style={{
//                     transition:     "x 0.1s linear, y 0.1s linear",
//                     userSelect:     "none",
//                     pointerEvents:  "none",
//                   }}
//                 >
//                   {d.code}
//                 </text>
//               )}
//             </g>
//           );
//         })}
//       </svg>
//     </div>
//   );
// };

// export default RaceTrack;

// import { useMemo } from "react";

// export interface Driver {
//   code: string;
//   color: string;
// }

// export interface CarPosition {
//   x: number;
//   y: number;
//   lap: number | null;
//   in_pit: boolean;
// }

// export interface TrackPoint {
//   x: number;
//   y: number;
// }

// export interface Bounds {
//   x_min: number;
//   x_max: number;
//   y_min: number;
//   y_max: number;
// }

// export interface FinishLine {
//   x: number;
//   y: number;
// }

// export interface RaceTrackProps {
//   drivers: Driver[];
//   positions: Record<string, CarPosition>;
//   trackOutline: TrackPoint[];
//   bounds: Bounds;
//   flag?: string;
//   showNames?: boolean;
//   finishLine?: FinishLine | null;
// }

// // ─── constants ──────────────────────────────────────────────────────────────

// const VIEWBOX_W = 1000;
// const VIEWBOX_H = 1000;
// // Decreased padding from 40 to 25 to increase the overall size of the track slightly
// const PADDING   = 25;

// const FLAG_TRACK_COLOR: Record<string, string> = {
//   clear:      "#4a4a4a",
//   yellow:     "#ca8a04",
//   red:        "#dc2626",
//   safety_car: "#d97706",
//   vsc:        "#d97706",
//   vsc_ending: "#d97706",
// };

// // ─── projection ─────────────────────────────────────────────────────────────

// const makeProjector = (bounds: Bounds) => {
//   const dataW = bounds.x_max - bounds.x_min || 1;
//   const dataH = bounds.y_max - bounds.y_min || 1;
//   const availW = VIEWBOX_W - PADDING * 2;
//   const availH = VIEWBOX_H - PADDING * 2;

//   // Uniform scale — keeps circuit shape undistorted
//   const scale   = Math.min(availW / dataW, availH / dataH);
//   const offsetX = PADDING + (availW - dataW * scale) / 2;
//   const offsetY = PADDING + (availH - dataH * scale) / 2;

//   return (x: number, y: number) => ({
//     x: offsetX + (x - bounds.x_min) * scale,
//     // SVG y-axis is inverted vs telemetry y-axis
//     y: offsetY + (dataH - (y - bounds.y_min)) * scale,
//   });
// };

// // ─── finish line helper ──────────────────────────────────────────────────────

// /**
//  * Draws a short perpendicular stroke across the track at the finish line.
//  * We find the two track-outline points nearest the finish-line coordinate,
//  * compute the tangent direction between them, then draw a line 90° to it.
//  */
// const FinishLineMark = ({
//   finishLine,
//   trackOutline,
//   project,
// }: {
//   finishLine: FinishLine;
//   trackOutline: TrackPoint[];
//   project: (x: number, y: number) => { x: number; y: number };
// }) => {
//   const { x: fx, y: fy } = project(finishLine.x, finishLine.y);

//   // Find the two outline points nearest the projected finish point
//   let best1 = 0, best2 = 1, bestDist = Infinity;
//   const projected = trackOutline.map((p) => project(p.x, p.y));

//   for (let i = 0; i < projected.length - 1; i++) {
//     const mx = (projected[i].x + projected[i + 1].x) / 2;
//     const my = (projected[i].y + projected[i + 1].y) / 2;
//     const d  = Math.hypot(mx - fx, my - fy);
//     if (d < bestDist) {
//       bestDist = d;
//       best1    = i;
//       best2    = i + 1;
//     }
//   }

//   // Tangent vector along the track at that point
//   const tx = projected[best2].x - projected[best1].x;
//   const ty = projected[best2].y - projected[best1].y;
//   const len = Math.hypot(tx, ty) || 1;

//   // Perpendicular = rotate tangent 90°
//   const nx = -ty / len;
//   const ny =  tx / len;

//   const half = 18; // half-length of the finish line mark in SVG units
//   const x1   = fx + nx * half;
//   const y1   = fy + ny * half;
//   const x2   = fx - nx * half;
//   const y2   = fy - ny * half;

//   return (
//     <g>
//       {/* Chequered flag effect: alternating black/white segments */}
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#000000" strokeWidth="5" strokeLinecap="round"
//         strokeDasharray="4,4" />
//       {/* Outer glow */}
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#ffffff" strokeWidth="9" strokeLinecap="round" opacity="0.15" />
//     </g>
//   );
// };

// // ─── component ──────────────────────────────────────────────────────────────

// const RaceTrack = ({
//   drivers,
//   positions,
//   trackOutline,
//   bounds,
//   flag       = "clear",
//   showNames  = false,
//   finishLine = null,
// }: RaceTrackProps) => {
//   const project = useMemo(() => makeProjector(bounds), [bounds]);

//   // Build SVG path string once — only changes when track outline or bounds change
//   const trackPathD = useMemo(() => {
//     if (!trackOutline || trackOutline.length === 0) return "";
//     const pts     = trackOutline.map((p) => project(p.x, p.y));
//     const [first, ...rest] = pts;
//     return rest.reduce(
//       (acc, p) => `${acc} L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`,
//       `M ${first.x.toFixed(1)} ${first.y.toFixed(1)}`
//     ) + " Z";
//   }, [trackOutline, project]);

//   const safeFlag   = (flag || "clear").toLowerCase().trim();
//   const trackColor = FLAG_TRACK_COLOR[safeFlag] ?? FLAG_TRACK_COLOR.clear;

//   // Fallback to the first coordinate of the track outline if no explicit finish line is provided
//   const startLine = finishLine || (trackOutline?.length > 0 ? trackOutline[0] : null);

//   return (
//     <div className="w-full h-full">
//       <svg
//         viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
//         className="w-full h-full"
//         style={{ overflow: "visible" }}
//       >
//         {/* ── Track rendering — 3 layered strokes ── */}

//         {/* Layer 1: wide outer glow — gives the "circuit lit up" feel */}
//         <path
//           d={trackPathD}
//           stroke={trackColor}
//           strokeWidth="28"
//           fill="none"
//           strokeLinejoin="round"
//           strokeLinecap="round"
//           opacity="0.18"
//         />

//         {/* Layer 2: main tarmac surface */}
//         <path
//           d={trackPathD}
//           stroke={trackColor}
//           strokeWidth="14"
//           fill="none"
//           strokeLinejoin="round"
//           strokeLinecap="round"
//           opacity="0.9"
//         />

//         {/* Layer 3: inner edge highlight — the bright centre line
//             subtle white line that gives the track a 3D "lit from above" feel */}
//         <path
//           d={trackPathD}
//           stroke="#ffffff"
//           strokeWidth="2"
//           fill="none"
//           strokeLinejoin="round"
//           strokeLinecap="round"
//           opacity="0.12"
//         />

//         {/* ── Finish line ── */}
//         {startLine && (
//           <FinishLineMark
//             finishLine={startLine}
//             trackOutline={trackOutline}
//             project={project}
//           />
//         )}

//         {/* ── Cars ── */}
//         {drivers.map((d) => {
//           const pos = positions[d.code];
//           if (!pos || isNaN(pos.x) || isNaN(pos.y)) return null;

//           const { x, y } = project(pos.x, pos.y);
//           const r        = pos.in_pit ? 5 : 8;
//           const opacity  = pos.in_pit ? 0.55 : 1;

//           return (
//             <g
//               key={d.code}
//               opacity={opacity}
//               style={{ transition: "opacity 0.3s" }}
//             >
//               {/* Drop shadow ring — makes cars pop off dark track */}
//               <circle
//                 cx={x} cy={y} r={r + 3}
//                 fill="none"
//                 stroke="#000000"
//                 strokeWidth="3"
//                 opacity="0.5"
//                 style={{ transition: "cx 0.1s linear, cy 0.1s linear" }}
//               />

//               {/* Team color fill */}
//               <circle
//                 cx={x} cy={y} r={r}
//                 fill={d.color}
//                 stroke="#ffffff"
//                 strokeWidth="1.5"
//                 style={{ transition: "cx 0.1s linear, cy 0.1s linear" }}
//               />

//               {/* Driver name — only when toggled on via L key */}
//               {showNames && (
//                 <text
//                   x={x + r + 5}
//                   y={y + 4}
//                   fontSize="11"
//                   fontWeight="900"
//                   fill="#ffffff"
//                   stroke="#000000"
//                   strokeWidth="3"
//                   paintOrder="stroke"
//                   style={{
//                     transition:     "x 0.1s linear, y 0.1s linear",
//                     userSelect:     "none",
//                     pointerEvents:  "none",
//                   }}
//                 >
//                   {d.code}
//                 </text>
//               )}
//             </g>
//           );
//         })}
//       </svg>
//     </div>
//   );
// };

// export default RaceTrack;

// import { useMemo } from "react";

// export interface Driver {
//   code: string;
//   color: string;
// }

// export interface CarPosition {
//   x: number;
//   y: number;
//   lap: number | null;
//   in_pit: boolean;
// }

// export interface TrackPoint {
//   x: number;
//   y: number;
// }

// export interface Bounds {
//   x_min: number;
//   x_max: number;
//   y_min: number;
//   y_max: number;
// }

// export interface FinishLine {
//   x: number;
//   y: number;
// }

// export interface RaceTrackProps {
//   drivers: Driver[];
//   positions: Record<string, CarPosition>;
//   trackOutline: TrackPoint[];
//   bounds: Bounds;
//   flag?: string;
//   showNames?: boolean;
//   finishLine?: FinishLine | null;
// }

// // ─── constants ──────────────────────────────────────────────────────────────

// const VIEWBOX_W = 1000;
// const VIEWBOX_H = 1000;
// // Decreased padding from 40 to 25 to increase the overall size of the track slightly
// const PADDING   = 1;

// const FLAG_TRACK_COLOR: Record<string, string> = {
//   clear:      "#4a4a4a",
//   yellow:     "#ca8a04",
//   red:        "#dc2626",
//   safety_car: "#d97706",
//   vsc:        "#d97706",
//   vsc_ending: "#d97706",
// };

// // ─── projection ─────────────────────────────────────────────────────────────

// const makeProjector = (bounds: Bounds) => {
//   const dataW = bounds.x_max - bounds.x_min || 1;
//   const dataH = bounds.y_max - bounds.y_min || 1;
//   const availW = VIEWBOX_W - PADDING * 2;
//   const availH = VIEWBOX_H - PADDING * 2;

//   // Uniform scale — keeps circuit shape undistorted
//   const scale   = Math.min(availW / dataW, availH / dataH);
//   const offsetX = PADDING + (availW - dataW * scale) / 2;
//   const offsetY = PADDING + (availH - dataH * scale) / 2;

//   return (x: number, y: number) => ({
//     x: offsetX + (x - bounds.x_min) * scale,
//     // SVG y-axis is inverted vs telemetry y-axis
//     y: offsetY + (dataH - (y - bounds.y_min)) * scale,
//   });
// };

// // ─── finish line helper ──────────────────────────────────────────────────────

// /**
//  * Draws a short perpendicular stroke across the track at the finish line.
//  * We find the two track-outline points nearest the finish-line coordinate,
//  * compute the tangent direction between them, then draw a line 90° to it.
//  */
// const FinishLineMark = ({
//   finishLine,
//   trackOutline,
//   project,
// }: {
//   finishLine: FinishLine;
//   trackOutline: TrackPoint[];
//   project: (x: number, y: number) => { x: number; y: number };
// }) => {
//   const { x: fx, y: fy } = project(finishLine.x, finishLine.y);

//   // Find the two outline points nearest the projected finish point
//   let best1 = 0, best2 = 1, bestDist = Infinity;
//   const projected = trackOutline.map((p) => project(p.x, p.y));

//   for (let i = 0; i < projected.length - 1; i++) {
//     const mx = (projected[i].x + projected[i + 1].x) / 2;
//     const my = (projected[i].y + projected[i + 1].y) / 2;
//     const d  = Math.hypot(mx - fx, my - fy);
//     if (d < bestDist) {
//       bestDist = d;
//       best1    = i;
//       best2    = i + 1;
//     }
//   }

//   // Tangent vector along the track at that point
//   const tx = projected[best2].x - projected[best1].x;
//   const ty = projected[best2].y - projected[best1].y;
//   const len = Math.hypot(tx, ty) || 1;

//   // Perpendicular = rotate tangent 90°
//   const nx = -ty / len;
//   const ny =  tx / len;

//   const half = 18; // half-length of the finish line mark in SVG units
//   const x1   = fx + nx * half;
//   const y1   = fy + ny * half;
//   const x2   = fx - nx * half;
//   const y2   = fy - ny * half;

//   return (
//     <g>
//       {/* 1. Asphalt burn / shadow (gives the paint depth) */}
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#000000" strokeWidth="8" strokeLinecap="butt" opacity="0.5" />

//       {/* 2. Base white paint layer */}
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#ffffff" strokeWidth="6" strokeLinecap="butt" />

//       {/* 3. Crisp black squares (butt cap creates sharp checkerboard boxes) */}
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#111111" strokeWidth="6" strokeLinecap="butt"
//         strokeDasharray="4,4" />

//       {/* 4. Reflective paint highlight (only on the white squares) */}
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#ffffff" strokeWidth="2" strokeLinecap="butt"
//         strokeDasharray="4,4" strokeDashoffset="4" opacity="0.9" />

//       {/* 5. Soft ambient bloom/glow to match the rest of the track */}
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#ffffff" strokeWidth="14" strokeLinecap="round" opacity="0.12" />
//     </g>
//   );
// };

// // ─── component ──────────────────────────────────────────────────────────────

// const RaceTrack = ({
//   drivers,
//   positions,
//   trackOutline,
//   bounds,
//   flag       = "clear",
//   showNames  = false,
//   finishLine = null,
// }: RaceTrackProps) => {
//   const project = useMemo(() => makeProjector(bounds), [bounds]);

//   // Build SVG path string once — only changes when track outline or bounds change
//   const trackPathD = useMemo(() => {
//     if (!trackOutline || trackOutline.length === 0) return "";
//     const pts     = trackOutline.map((p) => project(p.x, p.y));
//     const [first, ...rest] = pts;
//     return rest.reduce(
//       (acc, p) => `${acc} L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`,
//       `M ${first.x.toFixed(1)} ${first.y.toFixed(1)}`
//     ) + " Z";
//   }, [trackOutline, project]);

//   const safeFlag   = (flag || "clear").toLowerCase().trim();
//   const trackColor = FLAG_TRACK_COLOR[safeFlag] ?? FLAG_TRACK_COLOR.clear;

//   // Fallback to the first coordinate of the track outline if no explicit finish line is provided
//   const startLine = finishLine || (trackOutline?.length > 0 ? trackOutline[0] : null);

//   return (
//     <div className="w-full h-full">
//       <svg
//         viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
//         className="w-full h-full"
//         style={{ overflow: "visible" }}
//       >
//         {/* ── Track rendering — 3 layered strokes ── */}

//         {/* Layer 1: wide outer glow — gives the "circuit lit up" feel */}
//         <path
//           d={trackPathD}
//           stroke={trackColor}
//           strokeWidth="28"
//           fill="none"
//           strokeLinejoin="round"
//           strokeLinecap="round"
//           opacity="0.18"
//         />

//         {/* Layer 2: main tarmac surface */}
//         <path
//           d={trackPathD}
//           stroke={trackColor}
//           strokeWidth="14"
//           fill="none"
//           strokeLinejoin="round"
//           strokeLinecap="round"
//           opacity="0.9"
//         />

//         {/* Layer 3: inner edge highlight — the bright centre line
//             subtle white line that gives the track a 3D "lit from above" feel */}
//         <path
//           d={trackPathD}
//           stroke="#ffffff"
//           strokeWidth="2"
//           fill="none"
//           strokeLinejoin="round"
//           strokeLinecap="round"
//           opacity="0.12"
//         />

//         {/* ── Finish line ── */}
//         {startLine && (
//           <FinishLineMark
//             finishLine={startLine}
//             trackOutline={trackOutline}
//             project={project}
//           />
//         )}

//         {/* ── Cars ── */}
//         {drivers.map((d) => {
//           const pos = positions[d.code];
//           if (!pos || isNaN(pos.x) || isNaN(pos.y)) return null;

//           const { x, y } = project(pos.x, pos.y);
//           const r        = pos.in_pit ? 5 : 8;
//           const opacity  = pos.in_pit ? 0.55 : 1;

//           return (
//             <g
//               key={d.code}
//               opacity={opacity}
//               style={{ transition: "opacity 0.3s" }}
//             >
//               {/* Drop shadow ring — makes cars pop off dark track */}
//               <circle
//                 cx={x} cy={y} r={r + 3}
//                 fill="none"
//                 stroke="#000000"
//                 strokeWidth="3"
//                 opacity="0.5"
//                 style={{ transition: "cx 0.1s linear, cy 0.1s linear" }}
//               />

//               {/* Team color fill */}
//               <circle
//                 cx={x} cy={y} r={r}
//                 fill={d.color}
//                 stroke="#ffffff"
//                 strokeWidth="1.5"
//                 style={{ transition: "cx 0.1s linear, cy 0.1s linear" }}
//               />

//               {/* Driver name — only when toggled on via L key */}
//               {showNames && (
//                 <text
//                   x={x + r + 5}
//                   y={y + 4}
//                   fontSize="11"
//                   fontWeight="900"
//                   fill="#ffffff"
//                   stroke="#000000"
//                   strokeWidth="3"
//                   paintOrder="stroke"
//                   style={{
//                     transition:     "x 0.1s linear, y 0.1s linear",
//                     userSelect:     "none",
//                     pointerEvents:  "none",
//                   }}
//                 >
//                   {d.code}
//                 </text>
//               )}
//             </g>
//           );
//         })}
//       </svg>
//     </div>
//   );
// };

// export default RaceTrack;\\
// import { useMemo } from "react";

// export interface Driver {
//   code: string;
//   color: string;
// }

// export interface CarPosition {
//   x: number;
//   y: number;
//   lap: number | null;
//   in_pit: boolean;
// }

// export interface TrackPoint {
//   x: number;
//   y: number;
// }

// export interface Bounds {
//   x_min: number;
//   x_max: number;
//   y_min: number;
//   y_max: number;
// }

// export interface FinishLine {
//   x: number;
//   y: number;
// }

// export interface RaceTrackProps {
//   drivers: Driver[];
//   positions: Record<string, CarPosition>;
//   trackOutline: TrackPoint[];
//   bounds: Bounds;
//   flag?: string;
//   showNames?: boolean;
//   finishLine?: FinishLine | null;
//   transitionMs?: number; // 🛠️ NEW: Dynamic sync for smooth gliding
// }

// // ─── constants ──────────────────────────────────────────────────────────────

// const VIEWBOX_W = 1000;
// const VIEWBOX_H = 1000;
// const PADDING   = 1;

// const FLAG_TRACK_COLOR: Record<string, string> = {
//   clear:      "#4a4a4a",
//   yellow:     "#ca8a04",
//   red:        "#dc2626",
//   safety_car: "#d97706",
//   vsc:        "#d97706",
//   vsc_ending: "#d97706",
// };

// // ─── projection ─────────────────────────────────────────────────────────────

// const makeProjector = (bounds: Bounds) => {
//   const dataW = bounds.x_max - bounds.x_min || 1;
//   const dataH = bounds.y_max - bounds.y_min || 1;
//   const availW = VIEWBOX_W - PADDING * 2;
//   const availH = VIEWBOX_H - PADDING * 2;

//   const scale   = Math.min(availW / dataW, availH / dataH);
//   const offsetX = PADDING + (availW - dataW * scale) / 2;
//   const offsetY = PADDING + (availH - dataH * scale) / 2;

//   return (x: number, y: number) => ({
//     x: offsetX + (x - bounds.x_min) * scale,
//     y: offsetY + (dataH - (y - bounds.y_min)) * scale,
//   });
// };

// // ─── finish line helper ──────────────────────────────────────────────────────

// const FinishLineMark = ({
//   finishLine,
//   trackOutline,
//   project,
// }: {
//   finishLine: FinishLine;
//   trackOutline: TrackPoint[];
//   project: (x: number, y: number) => { x: number; y: number };
// }) => {
//   const { x: fx, y: fy } = project(finishLine.x, finishLine.y);

//   let best1 = 0, best2 = 1, bestDist = Infinity;
//   const projected = trackOutline.map((p) => project(p.x, p.y));

//   for (let i = 0; i < projected.length - 1; i++) {
//     const mx = (projected[i].x + projected[i + 1].x) / 2;
//     const my = (projected[i].y + projected[i + 1].y) / 2;
//     const d  = Math.hypot(mx - fx, my - fy);
//     if (d < bestDist) {
//       bestDist = d;
//       best1    = i;
//       best2    = i + 1;
//     }
//   }

//   const tx = projected[best2].x - projected[best1].x;
//   const ty = projected[best2].y - projected[best1].y;
//   const len = Math.hypot(tx, ty) || 1;

//   const nx = -ty / len;
//   const ny =  tx / len;

//   const half = 18; 
//   const x1   = fx + nx * half;
//   const y1   = fy + ny * half;
//   const x2   = fx - nx * half;
//   const y2   = fy - ny * half;

//   return (
//     <g>
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#000000" strokeWidth="8" strokeLinecap="butt" opacity="0.5" />
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#ffffff" strokeWidth="6" strokeLinecap="butt" />
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#111111" strokeWidth="6" strokeLinecap="butt"
//         strokeDasharray="4,4" />
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#ffffff" strokeWidth="2" strokeLinecap="butt"
//         strokeDasharray="4,4" strokeDashoffset="4" opacity="0.9" />
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#ffffff" strokeWidth="14" strokeLinecap="round" opacity="0.12" />
//     </g>
//   );
// };

// // ─── component ──────────────────────────────────────────────────────────────

// const RaceTrack = ({
//   drivers,
//   positions,
//   trackOutline,
//   bounds,
//   flag       = "clear",
//   showNames  = false,
//   finishLine = null,
//   transitionMs = 300, 
// }: RaceTrackProps) => {
//   const project = useMemo(() => makeProjector(bounds), [bounds]);

//   const trackPathD = useMemo(() => {
//     if (!trackOutline || trackOutline.length === 0) return "";
//     const pts     = trackOutline.map((p) => project(p.x, p.y));
//     const [first, ...rest] = pts;
//     return rest.reduce(
//       // 🛠️ FIX: Removed .toFixed(1) to stop the track line from rounding/shifting under the cars
//       (acc, p) => `${acc} L ${p.x.toFixed(3)} ${p.y.toFixed(3)}`,
//       `M ${first.x.toFixed(3)} ${first.y.toFixed(3)}`
//     ) + " Z";
//   }, [trackOutline, project]);

//   const safeFlag   = (flag || "clear").toLowerCase().trim();
//   const trackColor = FLAG_TRACK_COLOR[safeFlag] ?? FLAG_TRACK_COLOR.clear;
//   const startLine = finishLine || (trackOutline?.length > 0 ? trackOutline[0] : null);

//   // 🛠️ FIX: Perfect timing sync for CSS transitions
//   const smoothTransform = `cx ${transitionMs}ms linear, cy ${transitionMs}ms linear`;
//   const textTransform = `x ${transitionMs}ms linear, y ${transitionMs}ms linear`;

//   return (
//     <div className="w-full h-full">
//       <svg
//         viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
//         className="w-full h-full"
//         style={{ overflow: "visible" }}
//       >
//         <path d={trackPathD} stroke={trackColor} strokeWidth="28" fill="none" strokeLinejoin="round" strokeLinecap="round" opacity="0.18" />
//         <path d={trackPathD} stroke={trackColor} strokeWidth="14" fill="none" strokeLinejoin="round" strokeLinecap="round" opacity="0.9" />
//         <path d={trackPathD} stroke="#ffffff" strokeWidth="2" fill="none" strokeLinejoin="round" strokeLinecap="round" opacity="0.12" />

//         {startLine && (
//           <FinishLineMark finishLine={startLine} trackOutline={trackOutline} project={project} />
//         )}

//         {drivers.map((d) => {
//           const pos = positions[d.code];
//           if (!pos || isNaN(pos.x) || isNaN(pos.y)) return null;

//           const { x, y } = project(pos.x, pos.y);
//           // 🛠️ FIX: Locked all cars to size 8, regardless of pitting
//           const r = 8;
//           const opacity = pos.in_pit ? 0.55 : 1;

//           return (
//             <g key={d.code} opacity={opacity} style={{ transition: "opacity 0.2s" }}>
//               <circle
//                 cx={x} cy={y} r={r + 3}
//                 fill="none" stroke="#000000" strokeWidth="3" opacity="0.5"
//                 style={{ transition: smoothTransform }}
//               />
//               <circle
//                 cx={x} cy={y} r={r}
//                 fill={d.color} stroke="#ffffff" strokeWidth="1.5"
//                 style={{ transition: smoothTransform }}
//               />
//               {showNames && (
//                 <text
//                   x={x + r + 5} y={y + 4}
//                   fontSize="11" fontWeight="900" fill="#ffffff" stroke="#000000" strokeWidth="3" paintOrder="stroke"
//                   style={{ transition: textTransform, userSelect: "none", pointerEvents: "none" }}
//                 >
//                   {d.code}
//                 </text>
//               )}
//             </g>
//           );
//         })}
//       </svg>
//     </div>
//   );
// };

// export default RaceTrack;

// import { useMemo, useRef } from "react";

// export interface Driver {
//   code: string;
//   color: string;
// }

// export interface CarPosition {
//   x: number;
//   y: number;
//   lap: number | null;
//   in_pit: boolean;
// }

// export interface TrackPoint {
//   x: number;
//   y: number;
// }

// export interface Bounds {
//   x_min: number;
//   x_max: number;
//   y_min: number;
//   y_max: number;
// }

// export interface FinishLine {
//   x: number;
//   y: number;
// }

// export interface RaceTrackProps {
//   drivers: Driver[];
//   positions: Record<string, CarPosition>;
//   trackOutline: TrackPoint[];
//   bounds: Bounds;
//   flag?: string;
//   showNames?: boolean;
//   finishLine?: FinishLine | null;
//   transitionMs?: number;
// }

// // ─── constants ───────────────────────────────────────────────────────────────

// const VIEWBOX_W = 1000;
// const VIEWBOX_H = 1000;
// // Generous padding so cars at the edge are never clipped
// const PADDING   = 40;

// // Car sizes
// const CAR_R_RACING = 8;
// const CAR_R_PIT    = 5;

// // Pit debounce: how many consecutive in_pit=true frames before we confirm pit state.
// // Must match Leaderboard.tsx so both update at the same frame.
// const PIT_CONFIRM_THRESHOLD = 3;

// const FLAG_TRACK_COLOR: Record<string, string> = {
//   clear:      "#5a5a5a",
//   yellow:     "#ca8a04",
//   red:        "#dc2626",
//   safety_car: "#d97706",
//   vsc:        "#d97706",
//   vsc_ending: "#d97706",
// };

// // ─── projection ──────────────────────────────────────────────────────────────

// const makeProjector = (bounds: Bounds) => {
//   const dataW  = bounds.x_max - bounds.x_min || 1;
//   const dataH  = bounds.y_max - bounds.y_min || 1;
//   const availW = VIEWBOX_W - PADDING * 2;
//   const availH = VIEWBOX_H - PADDING * 2;

//   const scale   = Math.min(availW / dataW, availH / dataH);
//   const offsetX = PADDING + (availW - dataW * scale) / 2;
//   const offsetY = PADDING + (availH - dataH * scale) / 2;

//   return (x: number, y: number) => ({
//     x: offsetX + (x - bounds.x_min) * scale,
//     // FastF1 Y increases upward, SVG Y increases downward — flip it
//     y: offsetY + (dataH - (y - bounds.y_min)) * scale,
//   });
// };

// // ─── finish line ─────────────────────────────────────────────────────────────

// const FinishLineMark = ({
//   finishLine,
//   trackOutline,
//   project,
// }: {
//   finishLine: FinishLine;
//   trackOutline: TrackPoint[];
//   project: (x: number, y: number) => { x: number; y: number };
// }) => {
//   const { x: fx, y: fy } = project(finishLine.x, finishLine.y);
//   const projected = trackOutline.map((p) => project(p.x, p.y));

//   let best1 = 0, best2 = 1, bestDist = Infinity;
//   for (let i = 0; i < projected.length - 1; i++) {
//     const mx = (projected[i].x + projected[i + 1].x) / 2;
//     const my = (projected[i].y + projected[i + 1].y) / 2;
//     const d  = Math.hypot(mx - fx, my - fy);
//     if (d < bestDist) { bestDist = d; best1 = i; best2 = i + 1; }
//   }

//   const tx  = projected[best2].x - projected[best1].x;
//   const ty  = projected[best2].y - projected[best1].y;
//   const len = Math.hypot(tx, ty) || 1;
//   const nx  = -ty / len;
//   const ny  =  tx / len;
//   const half = 20;

//   const x1 = fx + nx * half, y1 = fy + ny * half;
//   const x2 = fx - nx * half, y2 = fy - ny * half;

//   return (
//     <g>
//       <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#000" strokeWidth="10" strokeLinecap="butt" opacity="0.4" />
//       <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#fff" strokeWidth="7"  strokeLinecap="butt" />
//       <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#111" strokeWidth="7"  strokeLinecap="butt" strokeDasharray="5,5" />
//       <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#fff" strokeWidth="2"  strokeLinecap="butt" strokeDasharray="5,5" strokeDashoffset="5" opacity="0.9" />
//       <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#fff" strokeWidth="16" strokeLinecap="round" opacity="0.08" />
//     </g>
//   );
// };

// // ─── main component ──────────────────────────────────────────────────────────

// const RaceTrack = ({
//   drivers,
//   positions,
//   trackOutline,
//   bounds,
//   flag         = "clear",
//   showNames    = false,
//   finishLine   = null,
//   transitionMs = 300,
// }: RaceTrackProps) => {
//   const project = useMemo(() => makeProjector(bounds), [bounds]);

//   // ── debounced pit state (mirrors Leaderboard.tsx logic exactly) ──
//   const pitCounterRef = useRef<Map<string, number>>(new Map());

//   const trackPathD = useMemo(() => {
//     if (!trackOutline || trackOutline.length === 0) return "";
//     const pts          = trackOutline.map((p) => project(p.x, p.y));
//     const [first, ...rest] = pts;
//     return (
//       rest.reduce(
//         (acc, p) => `${acc} L ${p.x.toFixed(3)} ${p.y.toFixed(3)}`,
//         `M ${first.x.toFixed(3)} ${first.y.toFixed(3)}`
//       ) + " Z"
//     );
//   }, [trackOutline, project]);

//   const safeFlag   = (flag || "clear").toLowerCase().trim();
//   const trackColor = FLAG_TRACK_COLOR[safeFlag] ?? FLAG_TRACK_COLOR.clear;
//   const startLine  = finishLine || (trackOutline?.length > 0 ? trackOutline[0] : null);

//   const smoothTransform = `cx ${transitionMs}ms linear, cy ${transitionMs}ms linear`;
//   const textTransform   = `x ${transitionMs}ms linear, y ${transitionMs}ms linear`;
//   const sizeTransition  = `r 200ms ease-in-out`;

//   // Build confirmed pit states for all drivers this render
//   const confirmedPitMap = useMemo(() => {
//     const map = new Map<string, boolean>();
//     drivers.forEach((d) => {
//       const pos      = positions[d.code];
//       const rawInPit = pos?.in_pit || false;
//       const prev     = pitCounterRef.current.get(d.code) ?? 0;
//       const next     = rawInPit ? prev + 1 : 0;
//       pitCounterRef.current.set(d.code, next);
//       map.set(d.code, next >= PIT_CONFIRM_THRESHOLD);
//     });
//     return map;
//   }, [drivers, positions]);

//   return (
//     <div className="w-full h-full">
//       <svg
//         viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
//         className="w-full h-full"
//         style={{ overflow: "visible" }}
//       >
//         {/* ── track layers ── */}
//         {/* Outer glow */}
//         <path d={trackPathD} stroke={trackColor} strokeWidth="38" fill="none"
//           strokeLinejoin="round" strokeLinecap="round" opacity="0.10" />
//         {/* Road body — wider than before so car dots sit inside it */}
//         <path d={trackPathD} stroke={trackColor} strokeWidth="22" fill="none"
//           strokeLinejoin="round" strokeLinecap="round" opacity="0.85" />
//         {/* Kerb highlight */}
//         <path d={trackPathD} stroke="#ffffff" strokeWidth="2" fill="none"
//           strokeLinejoin="round" strokeLinecap="round" opacity="0.08" />

//         {startLine && (
//           <FinishLineMark
//             finishLine={startLine}
//             trackOutline={trackOutline}
//             project={project}
//           />
//         )}

//         {/* ── cars ── */}
//         {drivers.map((d) => {
//           const pos = positions[d.code];
//           if (!pos || isNaN(pos.x) || isNaN(pos.y)) return null;

//           const { x, y }   = project(pos.x, pos.y);
//           const isPitting   = confirmedPitMap.get(d.code) ?? false;
//           const r           = isPitting ? CAR_R_PIT : CAR_R_RACING;

//           return (
//             <g key={d.code}>
//               {/* ── shadow ring (always present, gives depth) ── */}
//               <circle
//                 cx={x} cy={y} r={r + 4}
//                 fill="none" stroke="#000000" strokeWidth="4" opacity="0.35"
//                 style={{ transition: `${smoothTransform}, ${sizeTransition}` }}
//               />

//               {/* ── pit indicator ring (only visible when pitting) ── */}
//               {isPitting && (
//                 <circle
//                   cx={x} cy={y} r={r + 7}
//                   fill="none"
//                   stroke="#facc15"
//                   strokeWidth="1.5"
//                   strokeDasharray="3 3"
//                   opacity="0.7"
//                   style={{ transition: smoothTransform }}
//                 />
//               )}

//               {/* ── car body ── */}
//               <circle
//                 cx={x} cy={y} r={r}
//                 fill={isPitting ? "#4a4a4a" : d.color}
//                 stroke={isPitting ? "#888888" : "#ffffff"}
//                 strokeWidth={isPitting ? 1 : 1.5}
//                 opacity={isPitting ? 0.6 : 1}
//                 style={{ transition: `${smoothTransform}, ${sizeTransition}, opacity 200ms ease-in-out` }}
//               />

//               {/* ── driver label ── */}
//               {showNames && (
//                 <text
//                   x={x + r + 5} y={y + 4}
//                   fontSize="11" fontWeight="900"
//                   fill={isPitting ? "#888" : "#ffffff"}
//                   stroke="#000000" strokeWidth="3" paintOrder="stroke"
//                   style={{
//                     transition: textTransform,
//                     userSelect: "none",
//                     pointerEvents: "none",
//                   }}
//                 >
//                   {d.code}
//                 </text>
//               )}
//             </g>
//           );
//         })}
//       </svg>
//     </div>
//   );
// };

// export default RaceTrack;

// import { useMemo } from "react";

// export interface Driver {
//   code: string;
//   color: string;
// }

// export interface CarPosition {
//   x: number;
//   y: number;
//   lap: number | null;
//   in_pit: boolean;
// }

// export interface TrackPoint {
//   x: number;
//   y: number;
// }

// export interface Bounds {
//   x_min: number;
//   x_max: number;
//   y_min: number;
//   y_max: number;
// }

// export interface RaceTrackProps {
//   drivers: Driver[];
//   positions: Record<string, CarPosition>;
//   trackOutline: TrackPoint[];
//   bounds: Bounds;
//   flag?: string; 
// }

// const VIEWBOX_WIDTH = 1000;
// const VIEWBOX_HEIGHT = 1000;
// const PADDING = 45; 

// const FLAG_COLORS: Record<string, string> = {
//   clear: "#525252", 
//   "1": "#525252",
//   yellow: "#e6c900",
//   "2": "#e6c900",
//   red: "#dc2626",
//   "5": "#dc2626",
//   safety_car: "#f59e0b",
//   "4": "#f59e0b",
//   vsc: "#f59e0b",
//   "6": "#f59e0b",
//   vsc_ending: "#f59e0b",
//   "7": "#f59e0b",
// };

// const FLAG_LABELS: Record<string, string> = {
//   yellow: "YELLOW FLAG",
//   "2": "YELLOW FLAG",
//   red: "RED FLAG",
//   "5": "RED FLAG",
//   safety_car: "SAFETY CAR DEPLOYED",
//   "4": "SAFETY CAR DEPLOYED",
//   vsc: "VIRTUAL SAFETY CAR",
//   "6": "VIRTUAL SAFETY CAR",
//   vsc_ending: "VSC ENDING",
//   "7": "VSC ENDING",
// };

// const makeProjector = (bounds: Bounds) => {
//   const dataWidth = bounds.x_max - bounds.x_min || 1;
//   const dataHeight = bounds.y_max - bounds.y_min || 1;
//   const availableWidth = VIEWBOX_WIDTH - PADDING * 2;
//   const availableHeight = VIEWBOX_HEIGHT - PADDING * 2;
//   const scale = Math.min(availableWidth / dataWidth, availableHeight / dataHeight);
//   const offsetX = PADDING + (availableWidth - dataWidth * scale) / 2;
//   const offsetY = PADDING + (availableHeight - dataHeight * scale) / 2;

//   return (x: number, y: number) => {
//     const svgX = offsetX + (x - bounds.x_min) * scale;
//     const svgY = offsetY + (dataHeight - (y - bounds.y_min)) * scale;
//     return { x: svgX, y: svgY };
//   };
// };

// const RaceTrack = ({ drivers, positions, trackOutline, bounds, flag }: RaceTrackProps) => {
//   const project = useMemo(() => makeProjector(bounds), [bounds]);

//   const trackPathD = useMemo(() => {
//     if (!trackOutline || trackOutline.length === 0) return "";
//     const points = trackOutline.map((p) => project(p.x, p.y));
//     const [first, ...rest] = points;
//     const path = rest.reduce(
//       (acc, p) => `${acc} L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`,
//       `M ${first.x.toFixed(2)} ${first.y.toFixed(2)}`
//     );
//     return `${path} Z`;
//   }, [trackOutline, project]);

//   const safeFlag = (flag || "clear").toString().toLowerCase().trim();
//   const trackColor = FLAG_COLORS[safeFlag] || FLAG_COLORS.clear;
//   const isFlagActive = safeFlag !== "clear" && safeFlag !== "1" && !!FLAG_LABELS[safeFlag];

//   return (
//     <div className="w-full h-full flex items-center justify-center relative">
      
//       {/* 🛠️ FIX: Sleek, F1 Broadcast Style Flag Banner */}
//       {isFlagActive && (
//         <div className="absolute top-8 left-1/2 -translate-x-1/2 z-[100] flex items-stretch bg-neutral-900/95 backdrop-blur-md border border-neutral-700/50 rounded-lg shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden">
//           <div className="w-2" style={{ backgroundColor: trackColor }} />
//           <div className="px-6 py-2.5 flex items-center gap-3">
//             <span 
//               className="w-3 h-3 rounded-full animate-pulse" 
//               style={{ backgroundColor: trackColor, boxShadow: `0 0 10px ${trackColor}` }} 
//             />
//             <span className="font-black text-sm tracking-widest text-white uppercase">
//               {FLAG_LABELS[safeFlag]}
//             </span>
//           </div>
//         </div>
//       )}

//       <svg viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`} className="w-full h-full drop-shadow-2xl">
//         <path d={trackPathD} stroke={trackColor} strokeWidth="24" fill="none" strokeLinejoin="round" opacity="0.3" />
//         <path d={trackPathD} stroke={trackColor} strokeWidth="12" fill="none" strokeLinejoin="round" />
//         <path d={trackPathD} stroke="#ffffff" strokeWidth="1.5" strokeDasharray="4,6" fill="none" strokeLinejoin="round" opacity="0.4" />

//         {drivers.map((d) => {
//           const pos = positions[d.code];
//           if (!pos || isNaN(pos.x)) return null;
          
//           const { x, y } = project(pos.x, pos.y);
//           return (
//             <g key={d.code} style={{ transition: "transform 0.1s linear" }}>
//               <circle
//                 cx={x} cy={y}
//                 r="8"
//                 fill={d.color}
//                 stroke="#fff"
//                 strokeWidth="1.5"
//                 style={{ transition: "cx 0.1s linear, cy 0.1s linear" }}
//               />
//               <text
//                 x={x + 12} y={y + 3}
//                 fontSize="11"
//                 fontWeight="900"
//                 fill="#fff"
//                 className="drop-shadow-md"
//                 style={{ transition: "x 0.1s linear, y 0.1s linear" }}
//               >
//                 {d.code}
//               </text>
//             </g>
//           );
//         })}
//       </svg>
//     </div>
//   );
// };

// export default RaceTrack;

// import { useMemo } from "react";

// export interface Driver {
//   code: string;
//   color: string;
// }

// export interface CarPosition {
//   x: number;
//   y: number;
//   lap: number | null;
//   in_pit: boolean;
// }

// export interface TrackPoint {
//   x: number;
//   y: number;
// }

// export interface Bounds {
//   x_min: number;
//   x_max: number;
//   y_min: number;
//   y_max: number;
// }

// export interface FinishLine {
//   x: number;
//   y: number;
// }

// export interface RaceTrackProps {
//   drivers: Driver[];
//   positions: Record<string, CarPosition>;
//   trackOutline: TrackPoint[];
//   bounds: Bounds;
//   flag?: string;
//   showNames?: boolean;
//   finishLine?: FinishLine | null;
// }

// // ─── constants ──────────────────────────────────────────────────────────────

// const VIEWBOX_W = 1000;
// const VIEWBOX_H = 1000;
// const PADDING   = 40;

// const FLAG_TRACK_COLOR: Record<string, string> = {
//   clear:      "#4a4a4a",
//   yellow:     "#ca8a04",
//   red:        "#dc2626",
//   safety_car: "#d97706",
//   vsc:        "#d97706",
//   vsc_ending: "#d97706",
// };

// // ─── projection ─────────────────────────────────────────────────────────────

// const makeProjector = (bounds: Bounds) => {
//   const dataW = bounds.x_max - bounds.x_min || 1;
//   const dataH = bounds.y_max - bounds.y_min || 1;
//   const availW = VIEWBOX_W - PADDING * 2;
//   const availH = VIEWBOX_H - PADDING * 2;

//   // Uniform scale — keeps circuit shape undistorted
//   const scale   = Math.min(availW / dataW, availH / dataH);
//   const offsetX = PADDING + (availW - dataW * scale) / 2;
//   const offsetY = PADDING + (availH - dataH * scale) / 2;

//   return (x: number, y: number) => ({
//     x: offsetX + (x - bounds.x_min) * scale,
//     // SVG y-axis is inverted vs telemetry y-axis
//     y: offsetY + (dataH - (y - bounds.y_min)) * scale,
//   });
// };

// // ─── finish line helper ──────────────────────────────────────────────────────

// /**
//  * Draws a short perpendicular stroke across the track at the finish line.
//  * We find the two track-outline points nearest the finish-line coordinate,
//  * compute the tangent direction between them, then draw a line 90° to it.
//  */
// const FinishLineMark = ({
//   finishLine,
//   trackOutline,
//   project,
// }: {
//   finishLine: FinishLine;
//   trackOutline: TrackPoint[];
//   project: (x: number, y: number) => { x: number; y: number };
// }) => {
//   const { x: fx, y: fy } = project(finishLine.x, finishLine.y);

//   // Find the two outline points nearest the projected finish point
//   let best1 = 0, best2 = 1, bestDist = Infinity;
//   const projected = trackOutline.map((p) => project(p.x, p.y));

//   for (let i = 0; i < projected.length - 1; i++) {
//     const mx = (projected[i].x + projected[i + 1].x) / 2;
//     const my = (projected[i].y + projected[i + 1].y) / 2;
//     const d  = Math.hypot(mx - fx, my - fy);
//     if (d < bestDist) {
//       bestDist = d;
//       best1    = i;
//       best2    = i + 1;
//     }
//   }

//   // Tangent vector along the track at that point
//   const tx = projected[best2].x - projected[best1].x;
//   const ty = projected[best2].y - projected[best1].y;
//   const len = Math.hypot(tx, ty) || 1;

//   // Perpendicular = rotate tangent 90°
//   const nx = -ty / len;
//   const ny =  tx / len;

//   const half = 18; // half-length of the finish line mark in SVG units
//   const x1   = fx + nx * half;
//   const y1   = fy + ny * half;
//   const x2   = fx - nx * half;
//   const y2   = fy - ny * half;

//   return (
//     <g>
//       {/* Chequered flag effect: alternating black/white segments */}
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#000000" strokeWidth="5" strokeLinecap="round"
//         strokeDasharray="4,4" />
//       {/* Outer glow */}
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#ffffff" strokeWidth="9" strokeLinecap="round" opacity="0.15" />
//     </g>
//   );
// };

// // ─── component ──────────────────────────────────────────────────────────────

// const RaceTrack = ({
//   drivers,
//   positions,
//   trackOutline,
//   bounds,
//   flag       = "clear",
//   showNames  = false,
//   finishLine = null,
// }: RaceTrackProps) => {
//   const project = useMemo(() => makeProjector(bounds), [bounds]);

//   // Build SVG path string once — only changes when track outline or bounds change
//   const trackPathD = useMemo(() => {
//     if (!trackOutline || trackOutline.length === 0) return "";
//     const pts     = trackOutline.map((p) => project(p.x, p.y));
//     const [first, ...rest] = pts;
//     return rest.reduce(
//       (acc, p) => `${acc} L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`,
//       `M ${first.x.toFixed(1)} ${first.y.toFixed(1)}`
//     ) + " Z";
//   }, [trackOutline, project]);

//   const safeFlag   = (flag || "clear").toLowerCase().trim();
//   const trackColor = FLAG_TRACK_COLOR[safeFlag] ?? FLAG_TRACK_COLOR.clear;

//   return (
//     <div className="w-full h-full">
//       <svg
//         viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
//         className="w-full h-full"
//         style={{ overflow: "visible" }}
//       >
//         {/* ── Track rendering — 3 layered strokes ── */}

//         {/* Layer 1: wide outer glow — gives the "circuit lit up" feel */}
//         <path
//           d={trackPathD}
//           stroke={trackColor}
//           strokeWidth="28"
//           fill="none"
//           strokeLinejoin="round"
//           strokeLinecap="round"
//           opacity="0.18"
//         />

//         {/* Layer 2: main tarmac surface */}
//         <path
//           d={trackPathD}
//           stroke={trackColor}
//           strokeWidth="14"
//           fill="none"
//           strokeLinejoin="round"
//           strokeLinecap="round"
//           opacity="0.9"
//         />

//         {/* Layer 3: inner edge highlight — the bright centre line
//             subtle white line that gives the track a 3D "lit from above" feel */}
//         <path
//           d={trackPathD}
//           stroke="#ffffff"
//           strokeWidth="2"
//           fill="none"
//           strokeLinejoin="round"
//           strokeLinecap="round"
//           opacity="0.12"
//         />

//         {/* ── Finish line ── */}
//         {finishLine && (
//           <FinishLineMark
//             finishLine={finishLine}
//             trackOutline={trackOutline}
//             project={project}
//           />
//         )}

//         {/* ── Cars ── */}
//         {drivers.map((d) => {
//           const pos = positions[d.code];
//           if (!pos || isNaN(pos.x) || isNaN(pos.y)) return null;

//           const { x, y } = project(pos.x, pos.y);
//           const r        = pos.in_pit ? 5 : 8;
//           const opacity  = pos.in_pit ? 0.55 : 1;

//           return (
//             <g
//               key={d.code}
//               opacity={opacity}
//               style={{ transition: "opacity 0.3s" }}
//             >
//               {/* Drop shadow ring — makes cars pop off dark track */}
//               <circle
//                 cx={x} cy={y} r={r + 3}
//                 fill="none"
//                 stroke="#000000"
//                 strokeWidth="3"
//                 opacity="0.5"
//                 style={{ transition: "cx 0.1s linear, cy 0.1s linear" }}
//               />

//               {/* Team color fill */}
//               <circle
//                 cx={x} cy={y} r={r}
//                 fill={d.color}
//                 stroke="#ffffff"
//                 strokeWidth="1.5"
//                 style={{ transition: "cx 0.1s linear, cy 0.1s linear" }}
//               />

//               {/* Driver name — only when toggled on via L key */}
//               {showNames && (
//                 <text
//                   x={x + r + 5}
//                   y={y + 4}
//                   fontSize="11"
//                   fontWeight="900"
//                   fill="#ffffff"
//                   stroke="#000000"
//                   strokeWidth="3"
//                   paintOrder="stroke"
//                   style={{
//                     transition:     "x 0.1s linear, y 0.1s linear",
//                     userSelect:     "none",
//                     pointerEvents:  "none",
//                   }}
//                 >
//                   {d.code}
//                 </text>
//               )}
//             </g>
//           );
//         })}
//       </svg>
//     </div>
//   );
// };

// export default RaceTrack;

// import { useMemo } from "react";

// export interface Driver {
//   code: string;
//   color: string;
// }

// export interface CarPosition {
//   x: number;
//   y: number;
//   lap: number | null;
//   in_pit: boolean;
// }

// export interface TrackPoint {
//   x: number;
//   y: number;
// }

// export interface Bounds {
//   x_min: number;
//   x_max: number;
//   y_min: number;
//   y_max: number;
// }

// export interface FinishLine {
//   x: number;
//   y: number;
// }

// export interface RaceTrackProps {
//   drivers: Driver[];
//   positions: Record<string, CarPosition>;
//   trackOutline: TrackPoint[];
//   bounds: Bounds;
//   flag?: string;
//   showNames?: boolean;
//   finishLine?: FinishLine | null;
// }

// // ─── constants ──────────────────────────────────────────────────────────────

// const VIEWBOX_W = 1000;
// const VIEWBOX_H = 1000;
// // Decreased padding from 40 to 25 to increase the overall size of the track slightly
// const PADDING   = 25;

// const FLAG_TRACK_COLOR: Record<string, string> = {
//   clear:      "#4a4a4a",
//   yellow:     "#ca8a04",
//   red:        "#dc2626",
//   safety_car: "#d97706",
//   vsc:        "#d97706",
//   vsc_ending: "#d97706",
// };

// // ─── projection ─────────────────────────────────────────────────────────────

// const makeProjector = (bounds: Bounds) => {
//   const dataW = bounds.x_max - bounds.x_min || 1;
//   const dataH = bounds.y_max - bounds.y_min || 1;
//   const availW = VIEWBOX_W - PADDING * 2;
//   const availH = VIEWBOX_H - PADDING * 2;

//   // Uniform scale — keeps circuit shape undistorted
//   const scale   = Math.min(availW / dataW, availH / dataH);
//   const offsetX = PADDING + (availW - dataW * scale) / 2;
//   const offsetY = PADDING + (availH - dataH * scale) / 2;

//   return (x: number, y: number) => ({
//     x: offsetX + (x - bounds.x_min) * scale,
//     // SVG y-axis is inverted vs telemetry y-axis
//     y: offsetY + (dataH - (y - bounds.y_min)) * scale,
//   });
// };

// // ─── finish line helper ──────────────────────────────────────────────────────

// /**
//  * Draws a short perpendicular stroke across the track at the finish line.
//  * We find the two track-outline points nearest the finish-line coordinate,
//  * compute the tangent direction between them, then draw a line 90° to it.
//  */
// const FinishLineMark = ({
//   finishLine,
//   trackOutline,
//   project,
// }: {
//   finishLine: FinishLine;
//   trackOutline: TrackPoint[];
//   project: (x: number, y: number) => { x: number; y: number };
// }) => {
//   const { x: fx, y: fy } = project(finishLine.x, finishLine.y);

//   // Find the two outline points nearest the projected finish point
//   let best1 = 0, best2 = 1, bestDist = Infinity;
//   const projected = trackOutline.map((p) => project(p.x, p.y));

//   for (let i = 0; i < projected.length - 1; i++) {
//     const mx = (projected[i].x + projected[i + 1].x) / 2;
//     const my = (projected[i].y + projected[i + 1].y) / 2;
//     const d  = Math.hypot(mx - fx, my - fy);
//     if (d < bestDist) {
//       bestDist = d;
//       best1    = i;
//       best2    = i + 1;
//     }
//   }

//   // Tangent vector along the track at that point
//   const tx = projected[best2].x - projected[best1].x;
//   const ty = projected[best2].y - projected[best1].y;
//   const len = Math.hypot(tx, ty) || 1;

//   // Perpendicular = rotate tangent 90°
//   const nx = -ty / len;
//   const ny =  tx / len;

//   const half = 18; // half-length of the finish line mark in SVG units
//   const x1   = fx + nx * half;
//   const y1   = fy + ny * half;
//   const x2   = fx - nx * half;
//   const y2   = fy - ny * half;

//   return (
//     <g>
//       {/* Chequered flag effect: alternating black/white segments */}
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#000000" strokeWidth="5" strokeLinecap="round"
//         strokeDasharray="4,4" />
//       {/* Outer glow */}
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#ffffff" strokeWidth="9" strokeLinecap="round" opacity="0.15" />
//     </g>
//   );
// };

// // ─── component ──────────────────────────────────────────────────────────────

// const RaceTrack = ({
//   drivers,
//   positions,
//   trackOutline,
//   bounds,
//   flag       = "clear",
//   showNames  = false,
//   finishLine = null,
// }: RaceTrackProps) => {
//   const project = useMemo(() => makeProjector(bounds), [bounds]);

//   // Build SVG path string once — only changes when track outline or bounds change
//   const trackPathD = useMemo(() => {
//     if (!trackOutline || trackOutline.length === 0) return "";
//     const pts     = trackOutline.map((p) => project(p.x, p.y));
//     const [first, ...rest] = pts;
//     return rest.reduce(
//       (acc, p) => `${acc} L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`,
//       `M ${first.x.toFixed(1)} ${first.y.toFixed(1)}`
//     ) + " Z";
//   }, [trackOutline, project]);

//   const safeFlag   = (flag || "clear").toLowerCase().trim();
//   const trackColor = FLAG_TRACK_COLOR[safeFlag] ?? FLAG_TRACK_COLOR.clear;

//   // Fallback to the first coordinate of the track outline if no explicit finish line is provided
//   const startLine = finishLine || (trackOutline?.length > 0 ? trackOutline[0] : null);

//   return (
//     <div className="w-full h-full">
//       <svg
//         viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
//         className="w-full h-full"
//         style={{ overflow: "visible" }}
//       >
//         {/* ── Track rendering — 3 layered strokes ── */}

//         {/* Layer 1: wide outer glow — gives the "circuit lit up" feel */}
//         <path
//           d={trackPathD}
//           stroke={trackColor}
//           strokeWidth="28"
//           fill="none"
//           strokeLinejoin="round"
//           strokeLinecap="round"
//           opacity="0.18"
//         />

//         {/* Layer 2: main tarmac surface */}
//         <path
//           d={trackPathD}
//           stroke={trackColor}
//           strokeWidth="14"
//           fill="none"
//           strokeLinejoin="round"
//           strokeLinecap="round"
//           opacity="0.9"
//         />

//         {/* Layer 3: inner edge highlight — the bright centre line
//             subtle white line that gives the track a 3D "lit from above" feel */}
//         <path
//           d={trackPathD}
//           stroke="#ffffff"
//           strokeWidth="2"
//           fill="none"
//           strokeLinejoin="round"
//           strokeLinecap="round"
//           opacity="0.12"
//         />

//         {/* ── Finish line ── */}
//         {startLine && (
//           <FinishLineMark
//             finishLine={startLine}
//             trackOutline={trackOutline}
//             project={project}
//           />
//         )}

//         {/* ── Cars ── */}
//         {drivers.map((d) => {
//           const pos = positions[d.code];
//           if (!pos || isNaN(pos.x) || isNaN(pos.y)) return null;

//           const { x, y } = project(pos.x, pos.y);
//           const r        = pos.in_pit ? 5 : 8;
//           const opacity  = pos.in_pit ? 0.55 : 1;

//           return (
//             <g
//               key={d.code}
//               opacity={opacity}
//               style={{ transition: "opacity 0.3s" }}
//             >
//               {/* Drop shadow ring — makes cars pop off dark track */}
//               <circle
//                 cx={x} cy={y} r={r + 3}
//                 fill="none"
//                 stroke="#000000"
//                 strokeWidth="3"
//                 opacity="0.5"
//                 style={{ transition: "cx 0.1s linear, cy 0.1s linear" }}
//               />

//               {/* Team color fill */}
//               <circle
//                 cx={x} cy={y} r={r}
//                 fill={d.color}
//                 stroke="#ffffff"
//                 strokeWidth="1.5"
//                 style={{ transition: "cx 0.1s linear, cy 0.1s linear" }}
//               />

//               {/* Driver name — only when toggled on via L key */}
//               {showNames && (
//                 <text
//                   x={x + r + 5}
//                   y={y + 4}
//                   fontSize="11"
//                   fontWeight="900"
//                   fill="#ffffff"
//                   stroke="#000000"
//                   strokeWidth="3"
//                   paintOrder="stroke"
//                   style={{
//                     transition:     "x 0.1s linear, y 0.1s linear",
//                     userSelect:     "none",
//                     pointerEvents:  "none",
//                   }}
//                 >
//                   {d.code}
//                 </text>
//               )}
//             </g>
//           );
//         })}
//       </svg>
//     </div>
//   );
// };

// export default RaceTrack;

// import { useMemo } from "react";

// export interface Driver {
//   code: string;
//   color: string;
// }

// export interface CarPosition {
//   x: number;
//   y: number;
//   lap: number | null;
//   in_pit: boolean;
// }

// export interface TrackPoint {
//   x: number;
//   y: number;
// }

// export interface Bounds {
//   x_min: number;
//   x_max: number;
//   y_min: number;
//   y_max: number;
// }

// export interface FinishLine {
//   x: number;
//   y: number;
// }

// export interface RaceTrackProps {
//   drivers: Driver[];
//   positions: Record<string, CarPosition>;
//   trackOutline: TrackPoint[];
//   bounds: Bounds;
//   flag?: string;
//   showNames?: boolean;
//   finishLine?: FinishLine | null;
// }

// // ─── constants ──────────────────────────────────────────────────────────────

// const VIEWBOX_W = 1000;
// const VIEWBOX_H = 1000;
// // Decreased padding from 40 to 25 to increase the overall size of the track slightly
// const PADDING   = 1;

// const FLAG_TRACK_COLOR: Record<string, string> = {
//   clear:      "#4a4a4a",
//   yellow:     "#ca8a04",
//   red:        "#dc2626",
//   safety_car: "#d97706",
//   vsc:        "#d97706",
//   vsc_ending: "#d97706",
// };

// // ─── projection ─────────────────────────────────────────────────────────────

// const makeProjector = (bounds: Bounds) => {
//   const dataW = bounds.x_max - bounds.x_min || 1;
//   const dataH = bounds.y_max - bounds.y_min || 1;
//   const availW = VIEWBOX_W - PADDING * 2;
//   const availH = VIEWBOX_H - PADDING * 2;

//   // Uniform scale — keeps circuit shape undistorted
//   const scale   = Math.min(availW / dataW, availH / dataH);
//   const offsetX = PADDING + (availW - dataW * scale) / 2;
//   const offsetY = PADDING + (availH - dataH * scale) / 2;

//   return (x: number, y: number) => ({
//     x: offsetX + (x - bounds.x_min) * scale,
//     // SVG y-axis is inverted vs telemetry y-axis
//     y: offsetY + (dataH - (y - bounds.y_min)) * scale,
//   });
// };

// // ─── finish line helper ──────────────────────────────────────────────────────

// /**
//  * Draws a short perpendicular stroke across the track at the finish line.
//  * We find the two track-outline points nearest the finish-line coordinate,
//  * compute the tangent direction between them, then draw a line 90° to it.
//  */
// const FinishLineMark = ({
//   finishLine,
//   trackOutline,
//   project,
// }: {
//   finishLine: FinishLine;
//   trackOutline: TrackPoint[];
//   project: (x: number, y: number) => { x: number; y: number };
// }) => {
//   const { x: fx, y: fy } = project(finishLine.x, finishLine.y);

//   // Find the two outline points nearest the projected finish point
//   let best1 = 0, best2 = 1, bestDist = Infinity;
//   const projected = trackOutline.map((p) => project(p.x, p.y));

//   for (let i = 0; i < projected.length - 1; i++) {
//     const mx = (projected[i].x + projected[i + 1].x) / 2;
//     const my = (projected[i].y + projected[i + 1].y) / 2;
//     const d  = Math.hypot(mx - fx, my - fy);
//     if (d < bestDist) {
//       bestDist = d;
//       best1    = i;
//       best2    = i + 1;
//     }
//   }

//   // Tangent vector along the track at that point
//   const tx = projected[best2].x - projected[best1].x;
//   const ty = projected[best2].y - projected[best1].y;
//   const len = Math.hypot(tx, ty) || 1;

//   // Perpendicular = rotate tangent 90°
//   const nx = -ty / len;
//   const ny =  tx / len;

//   const half = 18; // half-length of the finish line mark in SVG units
//   const x1   = fx + nx * half;
//   const y1   = fy + ny * half;
//   const x2   = fx - nx * half;
//   const y2   = fy - ny * half;

//   return (
//     <g>
//       {/* 1. Asphalt burn / shadow (gives the paint depth) */}
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#000000" strokeWidth="8" strokeLinecap="butt" opacity="0.5" />

//       {/* 2. Base white paint layer */}
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#ffffff" strokeWidth="6" strokeLinecap="butt" />

//       {/* 3. Crisp black squares (butt cap creates sharp checkerboard boxes) */}
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#111111" strokeWidth="6" strokeLinecap="butt"
//         strokeDasharray="4,4" />

//       {/* 4. Reflective paint highlight (only on the white squares) */}
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#ffffff" strokeWidth="2" strokeLinecap="butt"
//         strokeDasharray="4,4" strokeDashoffset="4" opacity="0.9" />

//       {/* 5. Soft ambient bloom/glow to match the rest of the track */}
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#ffffff" strokeWidth="14" strokeLinecap="round" opacity="0.12" />
//     </g>
//   );
// };

// // ─── component ──────────────────────────────────────────────────────────────

// const RaceTrack = ({
//   drivers,
//   positions,
//   trackOutline,
//   bounds,
//   flag       = "clear",
//   showNames  = false,
//   finishLine = null,
// }: RaceTrackProps) => {
//   const project = useMemo(() => makeProjector(bounds), [bounds]);

//   // Build SVG path string once — only changes when track outline or bounds change
//   const trackPathD = useMemo(() => {
//     if (!trackOutline || trackOutline.length === 0) return "";
//     const pts     = trackOutline.map((p) => project(p.x, p.y));
//     const [first, ...rest] = pts;
//     return rest.reduce(
//       (acc, p) => `${acc} L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`,
//       `M ${first.x.toFixed(1)} ${first.y.toFixed(1)}`
//     ) + " Z";
//   }, [trackOutline, project]);

//   const safeFlag   = (flag || "clear").toLowerCase().trim();
//   const trackColor = FLAG_TRACK_COLOR[safeFlag] ?? FLAG_TRACK_COLOR.clear;

//   // Fallback to the first coordinate of the track outline if no explicit finish line is provided
//   const startLine = finishLine || (trackOutline?.length > 0 ? trackOutline[0] : null);

//   return (
//     <div className="w-full h-full">
//       <svg
//         viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
//         className="w-full h-full"
//         style={{ overflow: "visible" }}
//       >
//         {/* ── Track rendering — 3 layered strokes ── */}

//         {/* Layer 1: wide outer glow — gives the "circuit lit up" feel */}
//         <path
//           d={trackPathD}
//           stroke={trackColor}
//           strokeWidth="28"
//           fill="none"
//           strokeLinejoin="round"
//           strokeLinecap="round"
//           opacity="0.18"
//         />

//         {/* Layer 2: main tarmac surface */}
//         <path
//           d={trackPathD}
//           stroke={trackColor}
//           strokeWidth="14"
//           fill="none"
//           strokeLinejoin="round"
//           strokeLinecap="round"
//           opacity="0.9"
//         />

//         {/* Layer 3: inner edge highlight — the bright centre line
//             subtle white line that gives the track a 3D "lit from above" feel */}
//         <path
//           d={trackPathD}
//           stroke="#ffffff"
//           strokeWidth="2"
//           fill="none"
//           strokeLinejoin="round"
//           strokeLinecap="round"
//           opacity="0.12"
//         />

//         {/* ── Finish line ── */}
//         {startLine && (
//           <FinishLineMark
//             finishLine={startLine}
//             trackOutline={trackOutline}
//             project={project}
//           />
//         )}

//         {/* ── Cars ── */}
//         {drivers.map((d) => {
//           const pos = positions[d.code];
//           if (!pos || isNaN(pos.x) || isNaN(pos.y)) return null;

//           const { x, y } = project(pos.x, pos.y);
//           const r        = pos.in_pit ? 5 : 8;
//           const opacity  = pos.in_pit ? 0.55 : 1;

//           return (
//             <g
//               key={d.code}
//               opacity={opacity}
//               style={{ transition: "opacity 0.3s" }}
//             >
//               {/* Drop shadow ring — makes cars pop off dark track */}
//               <circle
//                 cx={x} cy={y} r={r + 3}
//                 fill="none"
//                 stroke="#000000"
//                 strokeWidth="3"
//                 opacity="0.5"
//                 style={{ transition: "cx 0.1s linear, cy 0.1s linear" }}
//               />

//               {/* Team color fill */}
//               <circle
//                 cx={x} cy={y} r={r}
//                 fill={d.color}
//                 stroke="#ffffff"
//                 strokeWidth="1.5"
//                 style={{ transition: "cx 0.1s linear, cy 0.1s linear" }}
//               />

//               {/* Driver name — only when toggled on via L key */}
//               {showNames && (
//                 <text
//                   x={x + r + 5}
//                   y={y + 4}
//                   fontSize="11"
//                   fontWeight="900"
//                   fill="#ffffff"
//                   stroke="#000000"
//                   strokeWidth="3"
//                   paintOrder="stroke"
//                   style={{
//                     transition:     "x 0.1s linear, y 0.1s linear",
//                     userSelect:     "none",
//                     pointerEvents:  "none",
//                   }}
//                 >
//                   {d.code}
//                 </text>
//               )}
//             </g>
//           );
//         })}
//       </svg>
//     </div>
//   );
// };

// export default RaceTrack;\\
// import { useMemo } from "react";

// export interface Driver {
//   code: string;
//   color: string;
// }

// export interface CarPosition {
//   x: number;
//   y: number;
//   lap: number | null;
//   in_pit: boolean;
// }

// export interface TrackPoint {
//   x: number;
//   y: number;
// }

// export interface Bounds {
//   x_min: number;
//   x_max: number;
//   y_min: number;
//   y_max: number;
// }

// export interface FinishLine {
//   x: number;
//   y: number;
// }

// export interface RaceTrackProps {
//   drivers: Driver[];
//   positions: Record<string, CarPosition>;
//   trackOutline: TrackPoint[];
//   bounds: Bounds;
//   flag?: string;
//   showNames?: boolean;
//   finishLine?: FinishLine | null;
//   transitionMs?: number; // 🛠️ NEW: Dynamic sync for smooth gliding
// }

// // ─── constants ──────────────────────────────────────────────────────────────

// const VIEWBOX_W = 1000;
// const VIEWBOX_H = 1000;
// const PADDING   = 1;

// const FLAG_TRACK_COLOR: Record<string, string> = {
//   clear:      "#4a4a4a",
//   yellow:     "#ca8a04",
//   red:        "#dc2626",
//   safety_car: "#d97706",
//   vsc:        "#d97706",
//   vsc_ending: "#d97706",
// };

// // ─── projection ─────────────────────────────────────────────────────────────

// const makeProjector = (bounds: Bounds) => {
//   const dataW = bounds.x_max - bounds.x_min || 1;
//   const dataH = bounds.y_max - bounds.y_min || 1;
//   const availW = VIEWBOX_W - PADDING * 2;
//   const availH = VIEWBOX_H - PADDING * 2;

//   const scale   = Math.min(availW / dataW, availH / dataH);
//   const offsetX = PADDING + (availW - dataW * scale) / 2;
//   const offsetY = PADDING + (availH - dataH * scale) / 2;

//   return (x: number, y: number) => ({
//     x: offsetX + (x - bounds.x_min) * scale,
//     y: offsetY + (dataH - (y - bounds.y_min)) * scale,
//   });
// };

// // ─── finish line helper ──────────────────────────────────────────────────────

// const FinishLineMark = ({
//   finishLine,
//   trackOutline,
//   project,
// }: {
//   finishLine: FinishLine;
//   trackOutline: TrackPoint[];
//   project: (x: number, y: number) => { x: number; y: number };
// }) => {
//   const { x: fx, y: fy } = project(finishLine.x, finishLine.y);

//   let best1 = 0, best2 = 1, bestDist = Infinity;
//   const projected = trackOutline.map((p) => project(p.x, p.y));

//   for (let i = 0; i < projected.length - 1; i++) {
//     const mx = (projected[i].x + projected[i + 1].x) / 2;
//     const my = (projected[i].y + projected[i + 1].y) / 2;
//     const d  = Math.hypot(mx - fx, my - fy);
//     if (d < bestDist) {
//       bestDist = d;
//       best1    = i;
//       best2    = i + 1;
//     }
//   }

//   const tx = projected[best2].x - projected[best1].x;
//   const ty = projected[best2].y - projected[best1].y;
//   const len = Math.hypot(tx, ty) || 1;

//   const nx = -ty / len;
//   const ny =  tx / len;

//   const half = 18; 
//   const x1   = fx + nx * half;
//   const y1   = fy + ny * half;
//   const x2   = fx - nx * half;
//   const y2   = fy - ny * half;

//   return (
//     <g>
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#000000" strokeWidth="8" strokeLinecap="butt" opacity="0.5" />
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#ffffff" strokeWidth="6" strokeLinecap="butt" />
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#111111" strokeWidth="6" strokeLinecap="butt"
//         strokeDasharray="4,4" />
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#ffffff" strokeWidth="2" strokeLinecap="butt"
//         strokeDasharray="4,4" strokeDashoffset="4" opacity="0.9" />
//       <line x1={x1} y1={y1} x2={x2} y2={y2}
//         stroke="#ffffff" strokeWidth="14" strokeLinecap="round" opacity="0.12" />
//     </g>
//   );
// };

// // ─── component ──────────────────────────────────────────────────────────────

// const RaceTrack = ({
//   drivers,
//   positions,
//   trackOutline,
//   bounds,
//   flag       = "clear",
//   showNames  = false,
//   finishLine = null,
//   transitionMs = 300, 
// }: RaceTrackProps) => {
//   const project = useMemo(() => makeProjector(bounds), [bounds]);

//   const trackPathD = useMemo(() => {
//     if (!trackOutline || trackOutline.length === 0) return "";
//     const pts     = trackOutline.map((p) => project(p.x, p.y));
//     const [first, ...rest] = pts;
//     return rest.reduce(
//       // 🛠️ FIX: Removed .toFixed(1) to stop the track line from rounding/shifting under the cars
//       (acc, p) => `${acc} L ${p.x.toFixed(3)} ${p.y.toFixed(3)}`,
//       `M ${first.x.toFixed(3)} ${first.y.toFixed(3)}`
//     ) + " Z";
//   }, [trackOutline, project]);

//   const safeFlag   = (flag || "clear").toLowerCase().trim();
//   const trackColor = FLAG_TRACK_COLOR[safeFlag] ?? FLAG_TRACK_COLOR.clear;
//   const startLine = finishLine || (trackOutline?.length > 0 ? trackOutline[0] : null);

//   // 🛠️ FIX: Perfect timing sync for CSS transitions
//   const smoothTransform = `cx ${transitionMs}ms linear, cy ${transitionMs}ms linear`;
//   const textTransform = `x ${transitionMs}ms linear, y ${transitionMs}ms linear`;

//   return (
//     <div className="w-full h-full">
//       <svg
//         viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
//         className="w-full h-full"
//         style={{ overflow: "visible" }}
//       >
//         <path d={trackPathD} stroke={trackColor} strokeWidth="28" fill="none" strokeLinejoin="round" strokeLinecap="round" opacity="0.18" />
//         <path d={trackPathD} stroke={trackColor} strokeWidth="14" fill="none" strokeLinejoin="round" strokeLinecap="round" opacity="0.9" />
//         <path d={trackPathD} stroke="#ffffff" strokeWidth="2" fill="none" strokeLinejoin="round" strokeLinecap="round" opacity="0.12" />

//         {startLine && (
//           <FinishLineMark finishLine={startLine} trackOutline={trackOutline} project={project} />
//         )}

//         {drivers.map((d) => {
//           const pos = positions[d.code];
//           if (!pos || isNaN(pos.x) || isNaN(pos.y)) return null;

//           const { x, y } = project(pos.x, pos.y);
//           // 🛠️ FIX: Locked all cars to size 8, regardless of pitting
//           const r = 8;
//           const opacity = pos.in_pit ? 0.55 : 1;

//           return (
//             <g key={d.code} opacity={opacity} style={{ transition: "opacity 0.2s" }}>
//               <circle
//                 cx={x} cy={y} r={r + 3}
//                 fill="none" stroke="#000000" strokeWidth="3" opacity="0.5"
//                 style={{ transition: smoothTransform }}
//               />
//               <circle
//                 cx={x} cy={y} r={r}
//                 fill={d.color} stroke="#ffffff" strokeWidth="1.5"
//                 style={{ transition: smoothTransform }}
//               />
//               {showNames && (
//                 <text
//                   x={x + r + 5} y={y + 4}
//                   fontSize="11" fontWeight="900" fill="#ffffff" stroke="#000000" strokeWidth="3" paintOrder="stroke"
//                   style={{ transition: textTransform, userSelect: "none", pointerEvents: "none" }}
//                 >
//                   {d.code}
//                 </text>
//               )}
//             </g>
//           );
//         })}
//       </svg>
//     </div>
//   );
// };

// export default RaceTrack;

import { useMemo, useRef } from "react";

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
  flag?: string;
  showNames?: boolean;
  finishLine?: FinishLine | null;
  transitionMs?: number;
  // Set of driver codes who have retired — their circles are removed from the track entirely.
  // The backend keeps sending their last known coordinates, so we must filter them out explicitly.
  retiredDrivers?: Set<string>;
}

// ─── constants ───────────────────────────────────────────────────────────────

const VIEWBOX_W = 1000;
const VIEWBOX_H = 1000;
// Generous padding so cars at the edge are never clipped
const PADDING   = 40;

// Car sizes
const CAR_R_RACING = 8;
const CAR_R_PIT    = 5;

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

const makeProjector = (bounds: Bounds) => {
  const dataW  = bounds.x_max - bounds.x_min || 1;
  const dataH  = bounds.y_max - bounds.y_min || 1;
  const availW = VIEWBOX_W - PADDING * 2;
  const availH = VIEWBOX_H - PADDING * 2;

  const scale   = Math.min(availW / dataW, availH / dataH);
  const offsetX = PADDING + (availW - dataW * scale) / 2;
  const offsetY = PADDING + (availH - dataH * scale) / 2;

  return (x: number, y: number) => ({
    x: offsetX + (x - bounds.x_min) * scale,
    // FastF1 Y increases upward, SVG Y increases downward — flip it
    y: offsetY + (dataH - (y - bounds.y_min)) * scale,
  });
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
  const half = 20;

  const x1 = fx + nx * half, y1 = fy + ny * half;
  const x2 = fx - nx * half, y2 = fy - ny * half;

  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#000" strokeWidth="10" strokeLinecap="butt" opacity="0.4" />
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#fff" strokeWidth="7"  strokeLinecap="butt" />
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#111" strokeWidth="7"  strokeLinecap="butt" strokeDasharray="5,5" />
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
  flag            = "clear",
  showNames       = false,
  finishLine      = null,
  transitionMs    = 300,
  retiredDrivers  = new Set<string>(),
}: RaceTrackProps) => {
  const project = useMemo(() => makeProjector(bounds), [bounds]);

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
  const textTransform   = `x ${transitionMs}ms linear, y ${transitionMs}ms linear`;
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
    <div className="w-full h-full">
      <svg
        viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
        className="w-full h-full"
        style={{ overflow: "visible" }}
      >
        {/* ── track layers ── */}
        {/* Outer glow */}
        <path d={trackPathD} stroke={trackColor} strokeWidth="38" fill="none"
          strokeLinejoin="round" strokeLinecap="round" opacity="0.10" />
        {/* Road body — wider than before so car dots sit inside it */}
        <path d={trackPathD} stroke={trackColor} strokeWidth="22" fill="none"
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
                <text
                  x={x + r + 5} y={y + 4}
                  fontSize="11" fontWeight="900"
                  fill={isPitting ? "#888" : "#ffffff"}
                  stroke="#000000" strokeWidth="3" paintOrder="stroke"
                  style={{
                    transition: textTransform,
                    userSelect: "none",
                    pointerEvents: "none",
                  }}
                >
                  {d.code}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default RaceTrack;