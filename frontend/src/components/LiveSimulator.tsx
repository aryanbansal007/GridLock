// import { useState, useEffect, useMemo } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import RaceTrack from "./RaceTrack";
// import Leaderboard from "./Leaderboard";

// const LiveSimulator = () => {
//   const { raceId } = useParams();
//   const navigate = useNavigate();
//   const [raceData, setRaceData] = useState<any>(null);
//   const [frameIndex, setFrameIndex] = useState(0);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [playbackSpeed, setPlaybackSpeed] = useState<number>(5);
//   const [isPlaying, setIsPlaying] = useState(true);

//   useEffect(() => {
//     if (!raceId) {
//       setError("No race ID provided");
//       setLoading(false);
//       return;
//     }

//     setLoading(true);
//     setError(null);

//     const parts = raceId.split('_');
//     const year = parts[0];
//     const session = parts[parts.length - 1];
//     const gp = parts.slice(1, -1).join('_');

//     fetch(`/api/races/data/${year}/${gp}/${session}`)
//       .then((res) => {
//         if (!res.ok) throw new Error(`HTTP ${res.status}`);
//         return res.json();
//       })
//       .then((data) => {
//         setRaceData(data);
//         setFrameIndex(0);
//         setLoading(false);
//       })
//       .catch((err) => {
//         setError(err.message);
//         setLoading(false);
//       });
//   }, [raceId]);

//   const drivers = useMemo(() => {
//     if (!raceData) return [];
//     return Object.entries(raceData.meta.team_colors).map(([code, color]) => ({
//       code,
//       color: color as string,
//     }));
//   }, [raceData]);

//   const totalLaps = useMemo(() => {
//     if (!raceData) return 0;
//     if (raceData.meta.total_laps) return raceData.meta.total_laps;
//     let max = 0;
//     for (const frame of raceData.frames) {
//       for (const abbr in frame.cars) {
//         const lap = frame.cars[abbr].lap;
//         if (lap && lap > max) max = lap;
//       }
//     }
//     return max;
//   }, [raceData]);

//   useEffect(() => {
//     if (!raceData || loading || error || !isPlaying) return;
//     const sampleMs = raceData.meta.sample_interval_ms || 300;
//     const intervalTime = sampleMs / playbackSpeed;

//     const timer = setInterval(() => {
//       setFrameIndex((prev) => (prev + 1) % raceData.frames.length);
//     }, intervalTime);

//     return () => clearInterval(timer);
//   }, [raceData, loading, error, playbackSpeed, isPlaying]);

//   useEffect(() => {
//     const handleKey = (e: KeyboardEvent) => {
//       if (!raceData) return;
//       switch (e.code) {
//         case "Space":
//           e.preventDefault();
//           setIsPlaying((p) => !p);
//           break;
//         case "ArrowLeft":
//           setFrameIndex((f) => Math.max(0, f - 50));
//           break;
//         case "ArrowRight":
//           setFrameIndex((f) => Math.min(raceData.frames.length - 1, f + 50));
//           break;
//         case "Digit1": setPlaybackSpeed(1); break;
//         case "Digit2": setPlaybackSpeed(2); break;
//         case "Digit3": setPlaybackSpeed(5); break;
//         case "Digit4": setPlaybackSpeed(10); break;
//         case "KeyR": setFrameIndex(0); break;
//       }
//     };
//     window.addEventListener("keydown", handleKey);
//     return () => window.removeEventListener("keydown", handleKey);
//   }, [raceData]);

//   if (loading) return <div className="flex h-screen items-center justify-center bg-[#0a0a0a] text-white font-bold animate-pulse">Loading Telemetry...</div>;
//   if (error || !raceData) return <div className="flex h-screen items-center justify-center bg-[#0a0a0a] text-red-500 font-bold">{error || "No data loaded"}</div>;

//   const currentFrame = raceData.frames[frameIndex];
//   const currentLap = Math.max(0, ...Object.values(currentFrame.cars).map((c: any) => c.lap || 0));
//   const totalFrames = raceData.frames.length;
//   const progressPct = (frameIndex / (totalFrames - 1)) * 100;

//   const sessionTimeStr = new Date((currentFrame.t - raceData.frames[0].t) * 1000).toISOString().substring(11, 19);

//   return (
//     <div className="fixed inset-0 w-screen h-screen bg-[#0a0a0a] flex font-sans select-none overflow-hidden">

//       {/* LEFT COLUMN: Track Area */}
//       {/* 🛠️ FIX: Increased padding-bottom (pb-28) to push the track upwards and avoid the playbar */}
//       <div className="flex-1 h-full relative flex flex-col items-center justify-center pb-28">

//         <button
//           onClick={() => navigate("/engineer")}
//           className="absolute top-6 left-6 z-[60] bg-neutral-900/90 hover:bg-neutral-800 text-white px-5 py-2.5 rounded-lg border border-neutral-700 font-bold text-sm tracking-wider transition-colors shadow-lg"
//         >
//           ← Dashboard
//         </button>

//         <div className="w-full h-full p-10 flex items-center justify-center">
//           <RaceTrack
//             drivers={drivers}
//             positions={currentFrame.cars}
//             trackOutline={raceData.track_outline}
//             bounds={raceData.meta.bounds}
//             flag={currentFrame.flag}
//           />
//         </div>

//         {/* Floating Playbar */}
//         <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[32rem] bg-neutral-900/95 backdrop-blur-xl border border-neutral-700/50 p-3.5 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] flex flex-col gap-2 z-50">
//           <input
//             type="range"
//             min={0}
//             max={totalFrames - 1}
//             value={frameIndex}
//             onChange={(e) => {
//               setIsPlaying(false);
//               setFrameIndex(Number(e.target.value));
//             }}
//             className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer hover:bg-neutral-700 transition-colors accent-red-600 outline-none"
//             style={{ background: `linear-gradient(to right, #dc2626 ${progressPct}%, #262626 ${progressPct}%)` }}
//           />

//           <div className="flex items-center justify-between px-1">
//             <div className="w-24 text-[13px] font-mono font-bold text-neutral-300 tabular-nums">
//               {sessionTimeStr}
//             </div>

//             <div className="flex items-center gap-5">
//               <button onClick={() => setFrameIndex(0)} className="text-neutral-400 hover:text-white transition-colors" title="Restart">
//                 <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z"/></svg>
//               </button>

//               <button
//                 onClick={() => setIsPlaying(!isPlaying)}
//                 className="w-12 h-9 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform"
//               >
//                 {isPlaying ? (
//                   <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zm8 0h4v16h-4z"/></svg>
//                 ) : (
//                   <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="ml-1"><path d="M8 5v14l11-7z"/></svg>
//                 )}
//               </button>

//               <button onClick={() => setFrameIndex(p => Math.min(p + (30 * playbackSpeed), totalFrames - 1))} className="text-neutral-400 hover:text-white transition-colors" title="Fast Forward">
//                 <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/></svg>
//               </button>
//             </div>

//             <div className="w-36 flex justify-end gap-1">
//               {[1, 2, 5, 10].map((speed) => (
//                 <button
//                   key={speed}
//                   onClick={() => setPlaybackSpeed(speed)}
//                   className={`text-[10px] font-black px-2.5 py-1 rounded-md transition-colors ${
//                     playbackSpeed === speed ? "bg-red-600 text-white" : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white"
//                   }`}
//                 >
//                   {speed}x
//                 </button>
//               ))}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* RIGHT COLUMN: Leaderboard */}
//       <div className="w-[340px] h-full flex-shrink-0 border-l border-neutral-800 bg-neutral-950 z-20 shadow-2xl overflow-hidden">
//         <Leaderboard
//           drivers={drivers}
//           positions={currentFrame.cars}
//           results={raceData.meta.results || {}}
//           totalLaps={totalLaps}
//           currentLap={currentLap}
//           currentTime={currentFrame.t}
//         />
//       </div>

//     </div>
//   );
// };

// export default LiveSimulator;

// import { useState, useEffect, useMemo } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import RaceTrack from "./RaceTrack";
// import Leaderboard from "./Leaderboard";

// // ─── helpers ────────────────────────────────────────────────────────────────

// const FLAG_META: Record<string, { label: string; color: string; bg: string; pulse: boolean }> = {
//   yellow:     { label: "YELLOW FLAG",           color: "#facc15", bg: "rgba(234,179,8,0.12)",   pulse: true  },
//   red:        { label: "RED FLAG",              color: "#ef4444", bg: "rgba(239,68,68,0.12)",   pulse: true  },
//   safety_car: { label: "SAFETY CAR DEPLOYED",   color: "#fb923c", bg: "rgba(251,146,60,0.12)",  pulse: false },
//   vsc:        { label: "VIRTUAL SAFETY CAR",    color: "#fb923c", bg: "rgba(251,146,60,0.12)",  pulse: false },
//   vsc_ending: { label: "VSC ENDING",            color: "#fb923c", bg: "rgba(251,146,60,0.08)",  pulse: false },
//   clear:      { label: "",                       color: "",        bg: "",                        pulse: false },
// };

// const FLAG_ICONS: Record<string, string> = {
//   yellow:     "⚠",
//   red:        "🔴",
//   safety_car: "🚨",
//   vsc:        "🚨",
//   vsc_ending: "🔶",
// };

// const SESSION_LABELS: Record<string, string> = {
//   r:  "RACE",
//   q:  "QUALIFYING",
//   s:  "SPRINT",
//   sq: "SPRINT SHOOTOUT",
// };

// function formatTime(seconds: number): string {
//   const h = Math.floor(seconds / 3600);
//   const m = Math.floor((seconds % 3600) / 60);
//   const s = Math.floor(seconds % 60);
//   if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
//   return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
// }

// function humaniseGp(gpSlug: string): string {
//   return gpSlug
//     .split("_")
//     .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
//     .join(" ");
// }

// // ─── component ──────────────────────────────────────────────────────────────

// const LiveSimulator = () => {
//   const { raceId } = useParams();
//   const navigate = useNavigate();

//   const [raceData,      setRaceData]      = useState<any>(null);
//   const [frameIndex,    setFrameIndex]    = useState(0);
//   const [loading,       setLoading]       = useState(true);
//   const [error,         setError]         = useState<string | null>(null);
//   const [playbackSpeed, setPlaybackSpeed] = useState<number>(5);
//   const [isPlaying,     setIsPlaying]     = useState(true);

//   // Parse raceId → year / gp / session
//   const { year, gp, session } = useMemo(() => {
//     if (!raceId) return { year: "", gp: "", session: "" };
//     const parts = raceId.split("_");
//     return {
//       year:    parts[0],
//       session: parts[parts.length - 1],
//       gp:      parts.slice(1, -1).join("_"),
//     };
//   }, [raceId]);

//   // ── fetch ─────────────────────────────────────────────────────────────────
//   useEffect(() => {
//     if (!raceId) { setError("No race ID provided"); setLoading(false); return; }
//     setLoading(true);
//     setError(null);

//     fetch(`/api/races/data/${year}/${gp}/${session}`)
//       .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
//       .then((data) => { setRaceData(data); setFrameIndex(0); setLoading(false); })
//       .catch((e)  => { setError(e.message); setLoading(false); });
//   }, [raceId, year, gp, session]);

//   // ── derived ───────────────────────────────────────────────────────────────
//   const drivers = useMemo(() => {
//     if (!raceData) return [];
//     return Object.entries(raceData.meta.team_colors).map(([code, color]) => ({
//       code,
//       color: color as string,
//     }));
//   }, [raceData]);

//   const totalLaps = useMemo(() => {
//     if (!raceData) return 0;
//     if (raceData.meta.total_laps) return raceData.meta.total_laps;
//     let max = 0;
//     for (const frame of raceData.frames)
//       for (const abbr in frame.cars) {
//         const lap = frame.cars[abbr].lap;
//         if (lap && lap > max) max = lap;
//       }
//     return max;
//   }, [raceData]);

//   // ── playback loop ─────────────────────────────────────────────────────────
//   useEffect(() => {
//     if (!raceData || loading || error || !isPlaying) return;
//     const ms = (raceData.meta.sample_interval_ms || 300) / playbackSpeed;
//     const t  = setInterval(() =>
//       setFrameIndex((p) => (p + 1 >= raceData.frames.length ? (setIsPlaying(false), p) : p + 1)),
//     ms);
//     return () => clearInterval(t);
//   }, [raceData, loading, error, playbackSpeed, isPlaying]);

//   // ── keyboard ──────────────────────────────────────────────────────────────
//   useEffect(() => {
//     const onKey = (e: KeyboardEvent) => {
//       if (!raceData) return;
//       const total = raceData.frames.length;
//       if (e.code === "Space")       { e.preventDefault(); setIsPlaying((p) => !p); }
//       else if (e.code === "ArrowLeft")  setFrameIndex((f) => Math.max(0, f - 50));
//       else if (e.code === "ArrowRight") setFrameIndex((f) => Math.min(total - 1, f + 50));
//       else if (e.code === "KeyR")   setFrameIndex(0);
//       else if (e.code === "Digit1") setPlaybackSpeed(1);
//       else if (e.code === "Digit2") setPlaybackSpeed(2);
//       else if (e.code === "Digit3") setPlaybackSpeed(5);
//       else if (e.code === "Digit4") setPlaybackSpeed(10);
//     };
//     window.addEventListener("keydown", onKey);
//     return () => window.removeEventListener("keydown", onKey);
//   }, [raceData]);

//   // ── loading / error screens ───────────────────────────────────────────────
//   if (loading) return (
//     <div className="fixed inset-0 bg-[#080808] flex flex-col items-center justify-center gap-4">
//       <div className="w-10 h-10 rounded-full border-2 border-neutral-700 border-t-red-500 animate-spin" />
//       <p className="text-neutral-400 text-sm font-bold tracking-widest uppercase">Loading Telemetry</p>
//     </div>
//   );

//   if (error || !raceData) return (
//     <div className="fixed inset-0 bg-[#080808] flex flex-col items-center justify-center gap-3">
//       <p className="text-red-500 font-bold text-lg">{error || "No data loaded"}</p>
//       <button onClick={() => navigate(-1)} className="text-neutral-400 text-sm hover:text-white transition-colors">
//         ← Go back
//       </button>
//     </div>
//   );

//   // ── frame data ────────────────────────────────────────────────────────────
//   const currentFrame  = raceData.frames[frameIndex];
//   const totalFrames   = raceData.frames.length;
//   const progressPct   = (frameIndex / (totalFrames - 1)) * 100;
//   const currentLap    = Math.max(0, ...Object.values(currentFrame.cars).map((c: any) => c.lap || 0));
//   const elapsedSec    = currentFrame.t - raceData.frames[0].t;
//   const flag          = currentFrame.flag as string || "clear";
//   const flagMeta      = FLAG_META[flag] || FLAG_META.clear;
//   const gpLabel       = humaniseGp(gp);
//   const sessionLabel  = SESSION_LABELS[session] || session.toUpperCase();

//   return (
//     <div className="fixed inset-0 w-screen h-screen bg-[#080808] flex overflow-hidden select-none font-sans">

//       {/* ══════════════════════════════════════════════════════════════
//           LEFT COLUMN  —  header + track + playbar
//          ══════════════════════════════════════════════════════════════ */}
//       <div className="flex-1 h-full flex flex-col overflow-hidden min-w-0">

//         {/* ── TOP BAR ── only over the track, leaderboard has its own header */}
//         <div
//           className="flex-shrink-0 flex items-center justify-between px-5 h-14 border-b border-neutral-800/60"
//           style={{
//             background: flagMeta.bg
//               ? `linear-gradient(90deg, #111111 60%, ${flagMeta.bg})`
//               : "#111111",
//             transition: "background 0.6s ease",
//           }}
//         >
//           {/* Left: back button */}
//           <button
//             onClick={() => navigate("/engineer")}
//             className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors text-sm font-bold tracking-wider group"
//           >
//             <span className="text-lg group-hover:-translate-x-0.5 transition-transform">←</span>
//             Dashboard
//           </button>

//           {/* Centre: GP name + year + session */}
//           <div className="flex flex-col items-center leading-tight">
//             <div className="flex items-center gap-2.5">
//               <span className="text-[10px] font-black text-red-500 tracking-[0.2em] uppercase">
//                 {sessionLabel}
//               </span>
//               <span className="w-px h-3 bg-neutral-700" />
//               <span className="text-[10px] font-bold text-neutral-500 tracking-widest">
//                 {year}
//               </span>
//             </div>
//             <h1 className="text-sm font-black text-white tracking-tight leading-none">
//               {gpLabel}
//             </h1>
//           </div>

//           {/* Right: flag status pill */}
//           <div className="w-40 flex justify-end">
//             {flag !== "clear" ? (
//               <div
//                 className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-black tracking-widest uppercase ${flagMeta.pulse ? "animate-pulse" : ""}`}
//                 style={{
//                   color:            flagMeta.color,
//                   borderColor:      flagMeta.color + "55",
//                   backgroundColor:  flagMeta.color + "18",
//                 }}
//               >
//                 <span>{FLAG_ICONS[flag]}</span>
//                 <span>{flagMeta.label}</span>
//               </div>
//             ) : (
//               /* green dot when all clear */
//               <div className="flex items-center gap-2 text-[11px] font-bold text-neutral-500 tracking-widest">
//                 <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
//                 ALL CLEAR
//               </div>
//             )}
//           </div>
//         </div>

//         {/* ── TRACK AREA ── */}
//         <div className="flex-1 min-h-0 relative">
//           <RaceTrack
//             drivers={drivers}
//             positions={currentFrame.cars}
//             trackOutline={raceData.track_outline}
//             bounds={raceData.meta.bounds}
//             flag={flag}
//           />
//         </div>

//         {/* ── PLAYBAR ── */}
//         <div className="flex-shrink-0 px-6 pb-5 pt-3 bg-[#080808] border-t border-neutral-800/50">

//           {/* progress scrubber */}
//           <div className="relative mb-3 group">
//             <div className="absolute inset-0 flex items-center pointer-events-none">
//               <div className="w-full h-0.5 bg-neutral-800 rounded-full" />
//               <div
//                 className="absolute h-0.5 bg-red-600 rounded-full transition-none"
//                 style={{ width: `${progressPct}%` }}
//               />
//             </div>
//             <input
//               type="range"
//               min={0}
//               max={totalFrames - 1}
//               value={frameIndex}
//               onChange={(e) => { setIsPlaying(false); setFrameIndex(Number(e.target.value)); }}
//               className="relative w-full h-4 opacity-0 cursor-pointer"
//             />
//             {/* thumb dot */}
//             <div
//               className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444] pointer-events-none transition-none"
//               style={{ left: `calc(${progressPct}% - 6px)` }}
//             />
//           </div>

//           {/* controls row */}
//           <div className="flex items-center justify-between">

//             {/* time */}
//             <span className="w-28 text-[13px] font-mono font-bold text-neutral-300 tabular-nums">
//               {formatTime(elapsedSec)}
//             </span>

//             {/* transport */}
//             <div className="flex items-center gap-6">
//               {/* rewind */}
//               <button
//                 onClick={() => setFrameIndex((f) => Math.max(0, f - 150))}
//                 className="text-neutral-500 hover:text-white transition-colors"
//                 title="Rewind (←)"
//               >
//                 <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
//                   <path d="M11 18V6l-8.5 6 8.5 6zm.5-6 8.5 6V6l-8.5 6z"/>
//                 </svg>
//               </button>

//               {/* play / pause */}
//               <button
//                 onClick={() => setIsPlaying((p) => !p)}
//                 className="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-lg"
//                 title="Play/Pause (Space)"
//               >
//                 {isPlaying ? (
//                   <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
//                     <path d="M6 4h4v16H6zm8 0h4v16h-4z"/>
//                   </svg>
//                 ) : (
//                   <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 2 }}>
//                     <path d="M8 5v14l11-7z"/>
//                   </svg>
//                 )}
//               </button>

//               {/* fast-forward */}
//               <button
//                 onClick={() => setFrameIndex((f) => Math.min(f + 150, totalFrames - 1))}
//                 className="text-neutral-500 hover:text-white transition-colors"
//                 title="Fast Forward (→)"
//               >
//                 <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
//                   <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/>
//                 </svg>
//               </button>
//             </div>

//             {/* speed buttons */}
//             <div className="w-28 flex justify-end gap-1">
//               {[1, 2, 5, 10].map((s) => (
//                 <button
//                   key={s}
//                   onClick={() => setPlaybackSpeed(s)}
//                   className={`text-[10px] font-black px-2 py-1 rounded transition-colors ${
//                     playbackSpeed === s
//                       ? "bg-red-600 text-white"
//                       : "bg-neutral-800/80 text-neutral-500 hover:text-white hover:bg-neutral-700"
//                   }`}
//                 >
//                   {s}×
//                 </button>
//               ))}
//             </div>
//           </div>

//           {/* keyboard hint — shown once, fades */}
//           <p className="mt-2 text-center text-[10px] text-neutral-700 tracking-widest">
//             SPACE · ← → · 1–4 · R
//           </p>
//         </div>
//       </div>

//       {/* ══════════════════════════════════════════════════════════════
//           RIGHT COLUMN  —  leaderboard (unchanged width / layout)
//          ══════════════════════════════════════════════════════════════ */}
//       <div className="w-[300px] flex-shrink-0 h-full border-l border-neutral-800 bg-neutral-950 overflow-hidden">
//         <Leaderboard
//           drivers={drivers}
//           positions={currentFrame.cars}
//           results={raceData.meta.results || {}}
//           totalLaps={totalLaps}
//           currentLap={currentLap}
//           currentTime={currentFrame.t}
//         />
//       </div>

//     </div>
//   );
// };

// export default LiveSimulator;

// import { useState, useEffect, useMemo } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import RaceTrack from "./RaceTrack";
// import Leaderboard from "./Leaderboard";

// // ─── helpers ────────────────────────────────────────────────────────────────

// const FLAG_META: Record<string, { label: string; color: string; bg: string; pulse: boolean }> = {
//   yellow:     { label: "YELLOW FLAG",           color: "#facc15", bg: "rgba(234,179,8,0.12)",   pulse: true  },
//   red:        { label: "RED FLAG",              color: "#ef4444", bg: "rgba(239,68,68,0.12)",   pulse: true  },
//   safety_car: { label: "SAFETY CAR DEPLOYED",   color: "#fb923c", bg: "rgba(251,146,60,0.12)",  pulse: false },
//   vsc:        { label: "VIRTUAL SAFETY CAR",    color: "#fb923c", bg: "rgba(251,146,60,0.12)",  pulse: false },
//   vsc_ending: { label: "VSC ENDING",            color: "#fb923c", bg: "rgba(251,146,60,0.08)",  pulse: false },
//   clear:      { label: "",                       color: "",        bg: "",                        pulse: false },
// };

// const FLAG_ICONS: Record<string, string> = {
//   yellow:     "⚠",
//   red:        "🔴",
//   safety_car: "🚨",
//   vsc:        "🚨",
//   vsc_ending: "🔶",
// };

// const SESSION_LABELS: Record<string, string> = {
//   r:  "RACE",
//   q:  "QUALIFYING",
//   s:  "SPRINT",
//   sq: "SPRINT SHOOTOUT",
// };

// function formatTime(seconds: number): string {
//   const h = Math.floor(seconds / 3600);
//   const m = Math.floor((seconds % 3600) / 60);
//   const s = Math.floor(seconds % 60);
//   if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
//   return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
// }

// function humaniseGp(gpSlug: string): string {
//   return gpSlug
//     .split("_")
//     .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
//     .join(" ");
// }

// // ─── component ──────────────────────────────────────────────────────────────

// const LiveSimulator = () => {
//   const { raceId } = useParams();
//   const navigate = useNavigate();

//   const [raceData,      setRaceData]      = useState<any>(null);
//   const [frameIndex,    setFrameIndex]    = useState(0);
//   const [loading,       setLoading]       = useState(true);
//   const [error,         setError]         = useState<string | null>(null);
//   const [playbackSpeed, setPlaybackSpeed] = useState<number>(5);
//   const [isPlaying,     setIsPlaying]     = useState(true);

//   // Parse raceId → year / gp / session
//   const { year, gp, session } = useMemo(() => {
//     if (!raceId) return { year: "", gp: "", session: "" };
//     const parts = raceId.split("_");
//     return {
//       year:    parts[0],
//       session: parts[parts.length - 1],
//       gp:      parts.slice(1, -1).join("_"),
//     };
//   }, [raceId]);

//   // ── fetch ─────────────────────────────────────────────────────────────────
//   useEffect(() => {
//     if (!raceId) { setError("No race ID provided"); setLoading(false); return; }
//     setLoading(true);
//     setError(null);

//     fetch(`/api/races/data/${year}/${gp}/${session}`)
//       .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
//       .then((data) => { setRaceData(data); setFrameIndex(0); setLoading(false); })
//       .catch((e)  => { setError(e.message); setLoading(false); });
//   }, [raceId, year, gp, session]);

//   // ── derived ───────────────────────────────────────────────────────────────
//   const drivers = useMemo(() => {
//     if (!raceData) return [];
//     return Object.entries(raceData.meta.team_colors).map(([code, color]) => ({
//       code,
//       color: color as string,
//     }));
//   }, [raceData]);

//   const totalLaps = useMemo(() => {
//     if (!raceData) return 0;
//     if (raceData.meta.total_laps) return raceData.meta.total_laps;
//     let max = 0;
//     for (const frame of raceData.frames)
//       for (const abbr in frame.cars) {
//         const lap = frame.cars[abbr].lap;
//         if (lap && lap > max) max = lap;
//       }
//     return max;
//   }, [raceData]);

//   // ── playback loop ─────────────────────────────────────────────────────────
//   useEffect(() => {
//     if (!raceData || loading || error || !isPlaying) return;
//     const ms = (raceData.meta.sample_interval_ms || 300) / playbackSpeed;
//     const t  = setInterval(() =>
//       setFrameIndex((p) => (p + 1 >= raceData.frames.length ? (setIsPlaying(false), p) : p + 1)),
//     ms);
//     return () => clearInterval(t);
//   }, [raceData, loading, error, playbackSpeed, isPlaying]);

//   // ── keyboard ──────────────────────────────────────────────────────────────
//   useEffect(() => {
//     const onKey = (e: KeyboardEvent) => {
//       if (!raceData) return;
//       const total = raceData.frames.length;
//       if (e.code === "Space")       { e.preventDefault(); setIsPlaying((p) => !p); }
//       else if (e.code === "ArrowLeft")  setFrameIndex((f) => Math.max(0, f - 50));
//       else if (e.code === "ArrowRight") setFrameIndex((f) => Math.min(total - 1, f + 50));
//       else if (e.code === "KeyR")   setFrameIndex(0);
//       else if (e.code === "Digit1") setPlaybackSpeed(1);
//       else if (e.code === "Digit2") setPlaybackSpeed(2);
//       else if (e.code === "Digit3") setPlaybackSpeed(5);
//       else if (e.code === "Digit4") setPlaybackSpeed(10);
//     };
//     window.addEventListener("keydown", onKey);
//     return () => window.removeEventListener("keydown", onKey);
//   }, [raceData]);

//   // ── loading / error screens ───────────────────────────────────────────────
//   if (loading) return (
//     <div className="fixed inset-0 bg-[#080808] flex flex-col items-center justify-center gap-4">
//       <div className="w-10 h-10 rounded-full border-2 border-neutral-700 border-t-red-500 animate-spin" />
//       <p className="text-neutral-400 text-sm font-bold tracking-widest uppercase">Loading Telemetry</p>
//     </div>
//   );

//   if (error || !raceData) return (
//     <div className="fixed inset-0 bg-[#080808] flex flex-col items-center justify-center gap-3">
//       <p className="text-red-500 font-bold text-lg">{error || "No data loaded"}</p>
//       <button onClick={() => navigate(-1)} className="text-neutral-400 text-sm hover:text-white transition-colors">
//         ← Go back
//       </button>
//     </div>
//   );

//   // ── frame data ────────────────────────────────────────────────────────────
//   const currentFrame  = raceData.frames[frameIndex];
//   const totalFrames   = raceData.frames.length;
//   const progressPct   = (frameIndex / (totalFrames - 1)) * 100;
//   const currentLap    = Math.max(0, ...Object.values(currentFrame.cars).map((c: any) => c.lap || 0));
//   const elapsedSec    = currentFrame.t - raceData.frames[0].t;
//   const flag          = currentFrame.flag as string || "clear";
//   const flagMeta      = FLAG_META[flag] || FLAG_META.clear;
//   const gpLabel       = humaniseGp(gp);
//   const sessionLabel  = SESSION_LABELS[session] || session.toUpperCase();

//   return (
//     <div className="fixed inset-0 w-screen h-screen bg-[#080808] flex overflow-hidden select-none font-sans">

//       {/* ══════════════════════════════════════════════════════════════
//           LEFT COLUMN  —  header + track + playbar
//          ══════════════════════════════════════════════════════════════ */}
//       <div className="flex-1 h-full flex flex-col overflow-hidden min-w-0">

//         {/* ── TOP BAR ── only over the track, leaderboard has its own header */}
//         <div
//           className="flex-shrink-0 flex items-center justify-between px-5 h-14 border-b border-neutral-800/60"
//           style={{
//             background: flagMeta.bg
//               ? `linear-gradient(90deg, #111111 60%, ${flagMeta.bg})`
//               : "#111111",
//             transition: "background 0.6s ease",
//           }}
//         >
//           {/* Left: back button */}
//           <button
//             onClick={() => navigate("/engineer")}
//             className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors text-sm font-bold tracking-wider group"
//           >
//             <span className="text-lg group-hover:-translate-x-0.5 transition-transform">←</span>
//             Dashboard
//           </button>

//           {/* Centre: GP name + year + session */}
//           <div className="flex flex-col items-center leading-tight">
//             <div className="flex items-center gap-2.5">
//               <span className="text-[10px] font-black text-red-500 tracking-[0.2em] uppercase">
//                 {sessionLabel}
//               </span>
//               <span className="w-px h-3 bg-neutral-700" />
//               <span className="text-[10px] font-bold text-neutral-500 tracking-widest">
//                 {year}
//               </span>
//             </div>
//             <h1 className="text-sm font-black text-white tracking-tight leading-none">
//               {gpLabel}
//             </h1>
//           </div>

//           {/* Right: flag status pill */}
//           <div className="w-40 flex justify-end">
//             {flag !== "clear" ? (
//               <div
//                 className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-black tracking-widest uppercase ${flagMeta.pulse ? "animate-pulse" : ""}`}
//                 style={{
//                   color:            flagMeta.color,
//                   borderColor:      flagMeta.color + "55",
//                   backgroundColor:  flagMeta.color + "18",
//                 }}
//               >
//                 <span>{FLAG_ICONS[flag]}</span>
//                 <span>{flagMeta.label}</span>
//               </div>
//             ) : (
//               /* green dot when all clear */
//               <div className="flex items-center gap-2 text-[11px] font-bold text-neutral-500 tracking-widest">
//                 <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
//                 ALL CLEAR
//               </div>
//             )}
//           </div>
//         </div>

//         {/* ── TRACK AREA ── */}
//         <div className="flex-1 min-h-0 relative">
//           <RaceTrack
//             drivers={drivers}
//             positions={currentFrame.cars}
//             trackOutline={raceData.track_outline}
//             bounds={raceData.meta.bounds}
//             flag={flag}
//           />
//         </div>

//         {/* ── PLAYBAR ── */}
//         <div className="flex-shrink-0 px-6 pb-5 pt-3 bg-[#080808] border-t border-neutral-800/50">

//           {/* progress scrubber */}
//           <div className="relative mb-3 group">
//             <div className="absolute inset-0 flex items-center pointer-events-none">
//               <div className="w-full h-0.5 bg-neutral-800 rounded-full" />
//               <div
//                 className="absolute h-0.5 bg-red-600 rounded-full transition-none"
//                 style={{ width: `${progressPct}%` }}
//               />
//             </div>
//             <input
//               type="range"
//               min={0}
//               max={totalFrames - 1}
//               value={frameIndex}
//               onChange={(e) => { setIsPlaying(false); setFrameIndex(Number(e.target.value)); }}
//               className="relative w-full h-4 opacity-0 cursor-pointer"
//             />
//             {/* thumb dot */}
//             <div
//               className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444] pointer-events-none transition-none"
//               style={{ left: `calc(${progressPct}% - 6px)` }}
//             />
//           </div>

//           {/* controls row */}
//           <div className="flex items-center justify-between">

//             {/* time */}
//             <span className="w-28 text-[13px] font-mono font-bold text-neutral-300 tabular-nums">
//               {formatTime(elapsedSec)}
//             </span>

//             {/* transport */}
//             <div className="flex items-center gap-6">
//               {/* rewind */}
//               <button
//                 onClick={() => setFrameIndex((f) => Math.max(0, f - 150))}
//                 className="text-neutral-500 hover:text-white transition-colors"
//                 title="Rewind (←)"
//               >
//                 <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
//                   <path d="M11 18V6l-8.5 6 8.5 6zm.5-6 8.5 6V6l-8.5 6z"/>
//                 </svg>
//               </button>

//               {/* play / pause */}
//               <button
//                 onClick={() => setIsPlaying((p) => !p)}
//                 className="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-lg"
//                 title="Play/Pause (Space)"
//               >
//                 {isPlaying ? (
//                   <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
//                     <path d="M6 4h4v16H6zm8 0h4v16h-4z"/>
//                   </svg>
//                 ) : (
//                   <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 2 }}>
//                     <path d="M8 5v14l11-7z"/>
//                   </svg>
//                 )}
//               </button>

//               {/* fast-forward */}
//               <button
//                 onClick={() => setFrameIndex((f) => Math.min(f + 150, totalFrames - 1))}
//                 className="text-neutral-500 hover:text-white transition-colors"
//                 title="Fast Forward (→)"
//               >
//                 <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
//                   <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/>
//                 </svg>
//               </button>
//             </div>

//             {/* speed buttons */}
//             <div className="w-28 flex justify-end gap-1">
//               {[1, 2, 5, 10].map((s) => (
//                 <button
//                   key={s}
//                   onClick={() => setPlaybackSpeed(s)}
//                   className={`text-[10px] font-black px-2 py-1 rounded transition-colors ${
//                     playbackSpeed === s
//                       ? "bg-red-600 text-white"
//                       : "bg-neutral-800/80 text-neutral-500 hover:text-white hover:bg-neutral-700"
//                   }`}
//                 >
//                   {s}×
//                 </button>
//               ))}
//             </div>
//           </div>

//           {/* keyboard hint — shown once, fades */}
//           <p className="mt-2 text-center text-[10px] text-neutral-700 tracking-widest">
//             SPACE · ← → · 1–4 · R
//           </p>
//         </div>
//       </div>

//       {/* ══════════════════════════════════════════════════════════════
//           RIGHT COLUMN  —  leaderboard (unchanged width / layout)
//          ══════════════════════════════════════════════════════════════ */}
//       <div className="w-[300px] flex-shrink-0 h-full border-l border-neutral-800 bg-neutral-950 overflow-hidden">
//         <Leaderboard
//           drivers={drivers}
//           positions={currentFrame.cars}
//           results={raceData.meta.results || {}}
//           totalLaps={totalLaps}
//           currentLap={currentLap}
//           currentTime={currentFrame.t}
//         />
//       </div>

//     </div>
//   );
// };

// export default LiveSimulator;

// import { useState, useEffect, useMemo } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import RaceTrack from "./RaceTrack";
// import Leaderboard from "./Leaderboard";

// // ─── helpers ────────────────────────────────────────────────────────────────

// const FLAG_META: Record<string, { label: string; color: string; bg: string; pulse: boolean }> = {
//   yellow:     { label: "YELLOW FLAG",           color: "#facc15", bg: "rgba(234,179,8,0.12)",   pulse: true  },
//   red:        { label: "RED FLAG",              color: "#ef4444", bg: "rgba(239,68,68,0.12)",   pulse: true  },
//   safety_car: { label: "SAFETY CAR DEPLOYED",   color: "#fb923c", bg: "rgba(251,146,60,0.12)",  pulse: false },
//   vsc:        { label: "VIRTUAL SAFETY CAR",    color: "#fb923c", bg: "rgba(251,146,60,0.12)",  pulse: false },
//   vsc_ending: { label: "VSC ENDING",            color: "#fb923c", bg: "rgba(251,146,60,0.08)",  pulse: false },
//   clear:      { label: "",                       color: "",        bg: "",                        pulse: false },
// };

// const FLAG_ICONS: Record<string, string> = {
//   yellow:     "⚠",
//   red:        "🔴",
//   safety_car: "🚨",
//   vsc:        "🚨",
//   vsc_ending: "🔶",
// };

// const SESSION_LABELS: Record<string, string> = {
//   r:  "RACE",
//   q:  "QUALIFYING",
//   s:  "SPRINT",
//   sq: "SPRINT SHOOTOUT",
// };

// function formatTime(seconds: number): string {
//   const h = Math.floor(seconds / 3600);
//   const m = Math.floor((seconds % 3600) / 60);
//   const s = Math.floor(seconds % 60);
//   if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
//   return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
// }

// function humaniseGp(gpSlug: string): string {
//   return gpSlug
//     .split("_")
//     .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
//     .join(" ");
// }

// // ─── component ──────────────────────────────────────────────────────────────

// const LiveSimulator = () => {
//   const { raceId } = useParams();
//   const navigate = useNavigate();

//   const [raceData,      setRaceData]      = useState<any>(null);
//   const [frameIndex,    setFrameIndex]    = useState(0);
//   const [loading,       setLoading]       = useState(true);
//   const [error,         setError]         = useState<string | null>(null);
//   const [playbackSpeed, setPlaybackSpeed] = useState<number>(5);
//   const [isPlaying,     setIsPlaying]     = useState(true);

//   // Parse raceId → year / gp / session
//   const { year, gp, session } = useMemo(() => {
//     if (!raceId) return { year: "", gp: "", session: "" };
//     const parts = raceId.split("_");
//     return {
//       year:    parts[0],
//       session: parts[parts.length - 1],
//       gp:      parts.slice(1, -1).join("_"),
//     };
//   }, [raceId]);

//   // ── fetch ─────────────────────────────────────────────────────────────────
//   useEffect(() => {
//     if (!raceId) { setError("No race ID provided"); setLoading(false); return; }
//     setLoading(true);
//     setError(null);

//     fetch(`/api/races/data/${year}/${gp}/${session}`)
//       .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
//       .then((data) => { setRaceData(data); setFrameIndex(0); setLoading(false); })
//       .catch((e)  => { setError(e.message); setLoading(false); });
//   }, [raceId, year, gp, session]);

//   // ── derived ───────────────────────────────────────────────────────────────
//   const drivers = useMemo(() => {
//     if (!raceData) return [];
//     return Object.entries(raceData.meta.team_colors).map(([code, color]) => ({
//       code,
//       color: color as string,
//     }));
//   }, [raceData]);

//   const totalLaps = useMemo(() => {
//     if (!raceData) return 0;
//     if (raceData.meta.total_laps) return raceData.meta.total_laps;
//     let max = 0;
//     for (const frame of raceData.frames)
//       for (const abbr in frame.cars) {
//         const lap = frame.cars[abbr].lap;
//         if (lap && lap > max) max = lap;
//       }
//     return max;
//   }, [raceData]);

//   // 🛠️ FIX: Calculate dynamic transition time for smooth CSS animations on the track
//   const baseIntervalMs = raceData?.meta?.sample_interval_ms || 300;
//   const currentTransitionMs = isPlaying ? (baseIntervalMs / playbackSpeed) : 0;

//   // ── playback loop ─────────────────────────────────────────────────────────
//   useEffect(() => {
//     if (!raceData || loading || error || !isPlaying) return;

//     const t  = setInterval(() =>
//       setFrameIndex((p) => (p + 1 >= raceData.frames.length ? (setIsPlaying(false), p) : p + 1)),
//       currentTransitionMs // 🛠️ Uses the dynamically calculated interval
//     );
//     return () => clearInterval(t);
//   }, [raceData, loading, error, isPlaying, currentTransitionMs]);

//   // ── keyboard ──────────────────────────────────────────────────────────────
//   useEffect(() => {
//     const onKey = (e: KeyboardEvent) => {
//       if (!raceData) return;
//       const total = raceData.frames.length;
//       if (e.code === "Space")       { e.preventDefault(); setIsPlaying((p) => !p); }
//       else if (e.code === "ArrowLeft")  setFrameIndex((f) => Math.max(0, f - 50));
//       else if (e.code === "ArrowRight") setFrameIndex((f) => Math.min(total - 1, f + 50));
//       else if (e.code === "KeyR")   setFrameIndex(0);
//       else if (e.code === "Digit1") setPlaybackSpeed(1);
//       else if (e.code === "Digit2") setPlaybackSpeed(2);
//       else if (e.code === "Digit3") setPlaybackSpeed(5);
//       else if (e.code === "Digit4") setPlaybackSpeed(10);
//     };
//     window.addEventListener("keydown", onKey);
//     return () => window.removeEventListener("keydown", onKey);
//   }, [raceData]);

//   // ── loading / error screens ───────────────────────────────────────────────
//   if (loading) return (
//     <div className="fixed inset-0 bg-[#080808] flex flex-col items-center justify-center gap-4">
//       <div className="w-10 h-10 rounded-full border-2 border-neutral-700 border-t-red-500 animate-spin" />
//       <p className="text-neutral-400 text-sm font-bold tracking-widest uppercase">Loading Telemetry</p>
//     </div>
//   );

//   if (error || !raceData) return (
//     <div className="fixed inset-0 bg-[#080808] flex flex-col items-center justify-center gap-3">
//       <p className="text-red-500 font-bold text-lg">{error || "No data loaded"}</p>
//       <button onClick={() => navigate(-1)} className="text-neutral-400 text-sm hover:text-white transition-colors">
//         ← Go back
//       </button>
//     </div>
//   );

//   // ── frame data ────────────────────────────────────────────────────────────
//   const currentFrame  = raceData.frames[frameIndex];
//   const totalFrames   = raceData.frames.length;
//   const progressPct   = (frameIndex / (totalFrames - 1)) * 100;
//   const currentLap    = Math.max(0, ...Object.values(currentFrame.cars).map((c: any) => c.lap || 0));
//   const elapsedSec    = currentFrame.t - raceData.frames[0].t;
//   const flag          = currentFrame.flag as string || "clear";
//   const flagMeta      = FLAG_META[flag] || FLAG_META.clear;
//   const gpLabel       = humaniseGp(gp);
//   const sessionLabel  = SESSION_LABELS[session] || session.toUpperCase();

//   return (
//     <div className="fixed inset-0 w-screen h-screen bg-[#080808] flex overflow-hidden select-none font-sans">

//       {/* ══════════════════════════════════════════════════════════════
//           LEFT COLUMN  —  header + track + playbar
//          ══════════════════════════════════════════════════════════════ */}
//       <div className="flex-1 h-full flex flex-col overflow-hidden min-w-0">

//         {/* ── TOP BAR ── only over the track, leaderboard has its own header */}
//         <div
//           className="flex-shrink-0 flex items-center justify-between px-5 h-14 border-b border-neutral-800/60"
//           style={{
//             background: flagMeta.bg
//               ? `linear-gradient(90deg, #111111 60%, ${flagMeta.bg})`
//               : "#111111",
//             transition: "background 0.6s ease",
//           }}
//         >
//           {/* Left: back button */}
//           <button
//             onClick={() => navigate("/engineer")}
//             className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors text-sm font-bold tracking-wider group"
//           >
//             <span className="text-lg group-hover:-translate-x-0.5 transition-transform">←</span>
//             Dashboard
//           </button>

//           {/* Centre: GP name + year + session */}
//           <div className="flex flex-col items-center leading-tight">
//             <div className="flex items-center gap-2.5">
//               <span className="text-[10px] font-black text-red-500 tracking-[0.2em] uppercase">
//                 {sessionLabel}
//               </span>
//               <span className="w-px h-3 bg-neutral-700" />
//               <span className="text-[10px] font-bold text-neutral-500 tracking-widest">
//                 {year}
//               </span>
//             </div>
//             <h1 className="text-sm font-black text-white tracking-tight leading-none">
//               {gpLabel}
//             </h1>
//           </div>

//           {/* Right: flag status pill */}
//           <div className="w-40 flex justify-end">
//             {flag !== "clear" ? (
//               <div
//                 className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-black tracking-widest uppercase ${flagMeta.pulse ? "animate-pulse" : ""}`}
//                 style={{
//                   color:            flagMeta.color,
//                   borderColor:      flagMeta.color + "55",
//                   backgroundColor:  flagMeta.color + "18",
//                 }}
//               >
//                 <span>{FLAG_ICONS[flag]}</span>
//                 <span>{flagMeta.label}</span>
//               </div>
//             ) : (
//               /* green dot when all clear */
//               <div className="flex items-center gap-2 text-[11px] font-bold text-neutral-500 tracking-widest">
//                 <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
//                 ALL CLEAR
//               </div>
//             )}
//           </div>
//         </div>

//         {/* ── TRACK AREA ── */}
//         <div className="flex-1 min-h-0 relative">
//           <RaceTrack
//             drivers={drivers}
//             positions={currentFrame.cars}
//             trackOutline={raceData.track_outline}
//             bounds={raceData.meta.bounds}
//             flag={flag}
//             transitionMs={currentTransitionMs} // 🛠️ FIX: Passed for smooth CSS transitions
//             showNames={true}                   // 🛠️ FIX: Enables driver names
//           />
//         </div>

//         {/* ── PLAYBAR ── */}
//         <div className="flex-shrink-0 px-6 pb-5 pt-3 bg-[#080808] border-t border-neutral-800/50">

//           {/* progress scrubber */}
//           <div className="relative mb-3 group">
//             <div className="absolute inset-0 flex items-center pointer-events-none">
//               <div className="w-full h-0.5 bg-neutral-800 rounded-full" />
//               <div
//                 className="absolute h-0.5 bg-red-600 rounded-full transition-none"
//                 style={{ width: `${progressPct}%` }}
//               />
//             </div>
//             <input
//               type="range"
//               min={0}
//               max={totalFrames - 1}
//               value={frameIndex}
//               onChange={(e) => { setIsPlaying(false); setFrameIndex(Number(e.target.value)); }}
//               className="relative w-full h-4 opacity-0 cursor-pointer"
//             />
//             {/* thumb dot */}
//             <div
//               className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444] pointer-events-none transition-none"
//               style={{ left: `calc(${progressPct}% - 6px)` }}
//             />
//           </div>

//           {/* controls row */}
//           <div className="flex items-center justify-between">

//             {/* time */}
//             <span className="w-28 text-[13px] font-mono font-bold text-neutral-300 tabular-nums">
//               {formatTime(elapsedSec)}
//             </span>

//             {/* transport */}
//             <div className="flex items-center gap-6">
//               {/* rewind */}
//               <button
//                 onClick={() => setFrameIndex((f) => Math.max(0, f - 150))}
//                 className="text-neutral-500 hover:text-white transition-colors"
//                 title="Rewind (←)"
//               >
//                 <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
//                   <path d="M11 18V6l-8.5 6 8.5 6zm.5-6 8.5 6V6l-8.5 6z"/>
//                 </svg>
//               </button>

//               {/* play / pause */}
//               <button
//                 onClick={() => setIsPlaying((p) => !p)}
//                 className="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-lg"
//                 title="Play/Pause (Space)"
//               >
//                 {isPlaying ? (
//                   <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
//                     <path d="M6 4h4v16H6zm8 0h4v16h-4z"/>
//                   </svg>
//                 ) : (
//                   <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 2 }}>
//                     <path d="M8 5v14l11-7z"/>
//                   </svg>
//                 )}
//               </button>

//               {/* fast-forward */}
//               <button
//                 onClick={() => setFrameIndex((f) => Math.min(f + 150, totalFrames - 1))}
//                 className="text-neutral-500 hover:text-white transition-colors"
//                 title="Fast Forward (→)"
//               >
//                 <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
//                   <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/>
//                 </svg>
//               </button>
//             </div>

//             {/* speed buttons */}
//             <div className="w-28 flex justify-end gap-1">
//               {[1, 2, 5, 10].map((s) => (
//                 <button
//                   key={s}
//                   onClick={() => setPlaybackSpeed(s)}
//                   className={`text-[10px] font-black px-2 py-1 rounded transition-colors ${
//                     playbackSpeed === s
//                       ? "bg-red-600 text-white"
//                       : "bg-neutral-800/80 text-neutral-500 hover:text-white hover:bg-neutral-700"
//                   }`}
//                 >
//                   {s}×
//                 </button>
//               ))}
//             </div>
//           </div>

//           {/* keyboard hint — shown once, fades */}
//           <p className="mt-2 text-center text-[10px] text-neutral-700 tracking-widest">
//             SPACE · ← → · 1–4 · R
//           </p>
//         </div>
//       </div>

//       {/* ══════════════════════════════════════════════════════════════
//           RIGHT COLUMN  —  leaderboard (unchanged width / layout)
//          ══════════════════════════════════════════════════════════════ */}
//       <div className="w-[300px] flex-shrink-0 h-full border-l border-neutral-800 bg-neutral-950 overflow-hidden">
//         <Leaderboard
//           drivers={drivers}
//           positions={currentFrame.cars}
//           results={raceData.meta.results || {}}
//           totalLaps={totalLaps}
//           currentLap={currentLap}
//           currentTime={currentFrame.t}
//         />
//       </div>

//     </div>
//   );
// };

// export default LiveSimulator;

// import { useState, useEffect, useMemo } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import RaceTrack from "./RaceTrack";
// import Leaderboard from "./Leaderboard";

// // ─── helpers ────────────────────────────────────────────────────────────────

// const FLAG_META: Record<string, { label: string; color: string; bg: string; pulse: boolean }> = {
//   yellow:     { label: "YELLOW FLAG",           color: "#facc15", bg: "rgba(234,179,8,0.12)",   pulse: true  },
//   red:        { label: "RED FLAG",              color: "#ef4444", bg: "rgba(239,68,68,0.12)",   pulse: true  },
//   safety_car: { label: "SAFETY CAR DEPLOYED",   color: "#fb923c", bg: "rgba(251,146,60,0.12)",  pulse: false },
//   vsc:        { label: "VIRTUAL SAFETY CAR",    color: "#fb923c", bg: "rgba(251,146,60,0.12)",  pulse: false },
//   vsc_ending: { label: "VSC ENDING",            color: "#fb923c", bg: "rgba(251,146,60,0.08)",  pulse: false },
//   clear:      { label: "",                       color: "",        bg: "",                        pulse: false },
// };

// const FLAG_ICONS: Record<string, string> = {
//   yellow:     "⚠",
//   red:        "🔴",
//   safety_car: "🚨",
//   vsc:        "🚨",
//   vsc_ending: "🔶",
// };

// const SESSION_LABELS: Record<string, string> = {
//   r:  "RACE",
//   q:  "QUALIFYING",
//   s:  "SPRINT",
//   sq: "SPRINT SHOOTOUT",
// };

// function formatTime(seconds: number): string {
//   const h = Math.floor(seconds / 3600);
//   const m = Math.floor((seconds % 3600) / 60);
//   const s = Math.floor(seconds % 60);
//   if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
//   return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
// }

// function humaniseGp(gpSlug: string): string {
//   return gpSlug
//     .split("_")
//     .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
//     .join(" ");
// }

// // ─── component ──────────────────────────────────────────────────────────────

// const LiveSimulator = () => {
//   const { raceId } = useParams();
//   const navigate = useNavigate();

//   const [raceData,      setRaceData]      = useState<any>(null);
//   const [frameIndex,    setFrameIndex]    = useState(0);
//   const [loading,       setLoading]       = useState(true);
//   const [error,         setError]         = useState<string | null>(null);
//   const [playbackSpeed, setPlaybackSpeed] = useState<number>(5);
//   const [isPlaying,     setIsPlaying]     = useState(true);

//   // 🛠️ NEW: State to toggle driver names
//   const [showNames,     setShowNames]     = useState<boolean>(false);

//   // Parse raceId → year / gp / session
//   const { year, gp, session } = useMemo(() => {
//     if (!raceId) return { year: "", gp: "", session: "" };
//     const parts = raceId.split("_");
//     return {
//       year:    parts[0],
//       session: parts[parts.length - 1],
//       gp:      parts.slice(1, -1).join("_"),
//     };
//   }, [raceId]);

//   // ── fetch ─────────────────────────────────────────────────────────────────
//   useEffect(() => {
//     if (!raceId) { setError("No race ID provided"); setLoading(false); return; }
//     setLoading(true);
//     setError(null);

//     fetch(`/api/races/data/${year}/${gp}/${session}`)
//       .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
//       .then((data) => { setRaceData(data); setFrameIndex(0); setLoading(false); })
//       .catch((e)  => { setError(e.message); setLoading(false); });
//   }, [raceId, year, gp, session]);

//   // ── derived ───────────────────────────────────────────────────────────────
//   const drivers = useMemo(() => {
//     if (!raceData) return [];
//     return Object.entries(raceData.meta.team_colors).map(([code, color]) => ({
//       code,
//       color: color as string,
//     }));
//   }, [raceData]);

//   const totalLaps = useMemo(() => {
//     if (!raceData) return 0;
//     if (raceData.meta.total_laps) return raceData.meta.total_laps;
//     let max = 0;
//     for (const frame of raceData.frames)
//       for (const abbr in frame.cars) {
//         const lap = frame.cars[abbr].lap;
//         if (lap && lap > max) max = lap;
//       }
//     return max;
//   }, [raceData]);

//   const baseIntervalMs = raceData?.meta?.sample_interval_ms || 300;
//   const currentTransitionMs = isPlaying ? (baseIntervalMs / playbackSpeed) : 0;

//   // ── playback loop ─────────────────────────────────────────────────────────
//   useEffect(() => {
//     if (!raceData || loading || error || !isPlaying) return;

//     const t  = setInterval(() =>
//       setFrameIndex((p) => (p + 1 >= raceData.frames.length ? (setIsPlaying(false), p) : p + 1)),
//       currentTransitionMs
//     );
//     return () => clearInterval(t);
//   }, [raceData, loading, error, isPlaying, currentTransitionMs]);

//   // ── keyboard ──────────────────────────────────────────────────────────────
//   useEffect(() => {
//     const onKey = (e: KeyboardEvent) => {
//       if (!raceData) return;
//       const total = raceData.frames.length;
//       if (e.code === "Space")       { e.preventDefault(); setIsPlaying((p) => !p); }
//       else if (e.code === "ArrowLeft")  setFrameIndex((f) => Math.max(0, f - 50));
//       else if (e.code === "ArrowRight") setFrameIndex((f) => Math.min(total - 1, f + 50));
//       else if (e.code === "KeyR")   setFrameIndex(0);
//       else if (e.code === "KeyL")   setShowNames((p) => !p); // 🛠️ NEW: Toggle labels with L key
//       else if (e.code === "Digit1") setPlaybackSpeed(1);
//       else if (e.code === "Digit2") setPlaybackSpeed(2);
//       else if (e.code === "Digit3") setPlaybackSpeed(5);
//       else if (e.code === "Digit4") setPlaybackSpeed(10);
//     };
//     window.addEventListener("keydown", onKey);
//     return () => window.removeEventListener("keydown", onKey);
//   }, [raceData]);

//   // ── loading / error screens ───────────────────────────────────────────────
//   if (loading) return (
//     <div className="fixed inset-0 bg-[#080808] flex flex-col items-center justify-center gap-4">
//       <div className="w-10 h-10 rounded-full border-2 border-neutral-700 border-t-red-500 animate-spin" />
//       <p className="text-neutral-400 text-sm font-bold tracking-widest uppercase">Loading Telemetry</p>
//     </div>
//   );

//   if (error || !raceData) return (
//     <div className="fixed inset-0 bg-[#080808] flex flex-col items-center justify-center gap-3">
//       <p className="text-red-500 font-bold text-lg">{error || "No data loaded"}</p>
//       <button onClick={() => navigate(-1)} className="text-neutral-400 text-sm hover:text-white transition-colors">
//         ← Go back
//       </button>
//     </div>
//   );

//   // ── frame data ────────────────────────────────────────────────────────────
//   const currentFrame  = raceData.frames[frameIndex];
//   const totalFrames   = raceData.frames.length;
//   const progressPct   = (frameIndex / (totalFrames - 1)) * 100;
//   const currentLap    = Math.max(0, ...Object.values(currentFrame.cars).map((c: any) => c.lap || 0));
//   const elapsedSec    = currentFrame.t - raceData.frames[0].t;
//   const flag          = currentFrame.flag as string || "clear";
//   const flagMeta      = FLAG_META[flag] || FLAG_META.clear;
//   const gpLabel       = humaniseGp(gp);
//   const sessionLabel  = SESSION_LABELS[session] || session.toUpperCase();

//   return (
//     <div className="fixed inset-0 w-screen h-screen bg-[#080808] flex overflow-hidden select-none font-sans">

//       {/* ══════════════════════════════════════════════════════════════
//           LEFT COLUMN  —  header + track + playbar
//          ══════════════════════════════════════════════════════════════ */}
//       <div className="flex-1 h-full flex flex-col overflow-hidden min-w-0">

//         {/* ── TOP BAR ── */}
//         <div
//           className="flex-shrink-0 flex items-center justify-between px-5 h-14 border-b border-neutral-800/60"
//           style={{
//             background: flagMeta.bg
//               ? `linear-gradient(90deg, #111111 60%, ${flagMeta.bg})`
//               : "#111111",
//             transition: "background 0.6s ease",
//           }}
//         >
//           <button
//             onClick={() => navigate("/engineer")}
//             className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors text-sm font-bold tracking-wider group"
//           >
//             <span className="text-lg group-hover:-translate-x-0.5 transition-transform">←</span>
//             Dashboard
//           </button>

//           <div className="flex flex-col items-center leading-tight">
//             <div className="flex items-center gap-2.5">
//               <span className="text-[10px] font-black text-red-500 tracking-[0.2em] uppercase">
//                 {sessionLabel}
//               </span>
//               <span className="w-px h-3 bg-neutral-700" />
//               <span className="text-[10px] font-bold text-neutral-500 tracking-widest">
//                 {year}
//               </span>
//             </div>
//             <h1 className="text-sm font-black text-white tracking-tight leading-none">
//               {gpLabel}
//             </h1>
//           </div>

//           <div className="w-40 flex justify-end">
//             {flag !== "clear" ? (
//               <div
//                 className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-black tracking-widest uppercase ${flagMeta.pulse ? "animate-pulse" : ""}`}
//                 style={{
//                   color:            flagMeta.color,
//                   borderColor:      flagMeta.color + "55",
//                   backgroundColor:  flagMeta.color + "18",
//                 }}
//               >
//                 <span>{FLAG_ICONS[flag]}</span>
//                 <span>{flagMeta.label}</span>
//               </div>
//             ) : (
//               <div className="flex items-center gap-2 text-[11px] font-bold text-neutral-500 tracking-widest">
//                 <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
//                 ALL CLEAR
//               </div>
//             )}
//           </div>
//         </div>

//         {/* ── TRACK AREA ── */}
//         <div className="flex-1 min-h-0 relative">
//           <RaceTrack
//             drivers={drivers}
//             positions={currentFrame.cars}
//             trackOutline={raceData.track_outline}
//             bounds={raceData.meta.bounds}
//             flag={flag}
//             transitionMs={currentTransitionMs}
//             showNames={showNames} // 🛠️ NEW: Passed dynamic state here
//           />
//         </div>

//         {/* ── PLAYBAR ── */}
//         <div className="flex-shrink-0 px-6 pb-5 pt-3 bg-[#080808] border-t border-neutral-800/50">

//           <div className="relative mb-3 group">
//             <div className="absolute inset-0 flex items-center pointer-events-none">
//               <div className="w-full h-0.5 bg-neutral-800 rounded-full" />
//               <div
//                 className="absolute h-0.5 bg-red-600 rounded-full transition-none"
//                 style={{ width: `${progressPct}%` }}
//               />
//             </div>
//             <input
//               type="range"
//               min={0}
//               max={totalFrames - 1}
//               value={frameIndex}
//               onChange={(e) => { setIsPlaying(false); setFrameIndex(Number(e.target.value)); }}
//               className="relative w-full h-4 opacity-0 cursor-pointer"
//             />
//             <div
//               className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444] pointer-events-none transition-none"
//               style={{ left: `calc(${progressPct}% - 6px)` }}
//             />
//           </div>

//           <div className="flex items-center justify-between">

//             <span className="w-28 text-[13px] font-mono font-bold text-neutral-300 tabular-nums">
//               {formatTime(elapsedSec)}
//             </span>

//             <div className="flex items-center gap-6">
//               <button onClick={() => setFrameIndex((f) => Math.max(0, f - 150))} className="text-neutral-500 hover:text-white transition-colors">
//                 <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M11 18V6l-8.5 6 8.5 6zm.5-6 8.5 6V6l-8.5 6z"/></svg>
//               </button>
//               <button
//                 onClick={() => setIsPlaying((p) => !p)}
//                 className="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-lg"
//               >
//                 {isPlaying ? (
//                   <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zm8 0h4v16h-4z"/></svg>
//                 ) : (
//                   <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 2 }}><path d="M8 5v14l11-7z"/></svg>
//                 )}
//               </button>
//               <button onClick={() => setFrameIndex((f) => Math.min(f + 150, totalFrames - 1))} className="text-neutral-500 hover:text-white transition-colors">
//                 <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/></svg>
//               </button>
//             </div>

//             <div className="w-28 flex justify-end gap-1">
//               {[1, 2, 5, 10].map((s) => (
//                 <button
//                   key={s}
//                   onClick={() => setPlaybackSpeed(s)}
//                   className={`text-[10px] font-black px-2 py-1 rounded transition-colors ${
//                     playbackSpeed === s ? "bg-red-600 text-white" : "bg-neutral-800/80 text-neutral-500 hover:text-white hover:bg-neutral-700"
//                   }`}
//                 >
//                   {s}×
//                 </button>
//               ))}
//             </div>
//           </div>

//           {/* 🛠️ NEW: Added L to the keyboard hints */}
//           <p className="mt-2 text-center text-[10px] text-neutral-700 tracking-widest">
//             SPACE · ← → · 1–4 · R · L (LABELS)
//           </p>
//         </div>
//       </div>

//       {/* ══════════════════════════════════════════════════════════════
//           RIGHT COLUMN  —  leaderboard
//          ══════════════════════════════════════════════════════════════ */}
//       <div className="w-[300px] flex-shrink-0 h-full border-l border-neutral-800 bg-neutral-950 overflow-hidden">
//         <Leaderboard
//           drivers={drivers}
//           positions={currentFrame.cars}
//           results={raceData.meta.results || {}}
//           totalLaps={totalLaps}
//           currentLap={currentLap}
//           currentTime={currentFrame.t}
//         />
//       </div>

//     </div>
//   );
// };

// export default LiveSimulator;

// import { useState, useEffect, useMemo } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import RaceTrack from "./RaceTrack";
// import Leaderboard from "./Leaderboard";

// const LiveSimulator = () => {
//   const { raceId } = useParams();
//   const navigate = useNavigate();
//   const [raceData, setRaceData] = useState<any>(null);
//   const [frameIndex, setFrameIndex] = useState(0);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [playbackSpeed, setPlaybackSpeed] = useState<number>(5);
//   const [isPlaying, setIsPlaying] = useState(true);

//   useEffect(() => {
//     if (!raceId) {
//       setError("No race ID provided");
//       setLoading(false);
//       return;
//     }

//     setLoading(true);
//     setError(null);

//     const parts = raceId.split('_');
//     const year = parts[0];
//     const session = parts[parts.length - 1];
//     const gp = parts.slice(1, -1).join('_');

//     fetch(`/api/races/data/${year}/${gp}/${session}`)
//       .then((res) => {
//         if (!res.ok) throw new Error(`HTTP ${res.status}`);
//         return res.json();
//       })
//       .then((data) => {
//         setRaceData(data);
//         setFrameIndex(0);
//         setLoading(false);
//       })
//       .catch((err) => {
//         setError(err.message);
//         setLoading(false);
//       });
//   }, [raceId]);

//   const drivers = useMemo(() => {
//     if (!raceData) return [];
//     return Object.entries(raceData.meta.team_colors).map(([code, color]) => ({
//       code,
//       color: color as string,
//     }));
//   }, [raceData]);

//   const totalLaps = useMemo(() => {
//     if (!raceData) return 0;
//     if (raceData.meta.total_laps) return raceData.meta.total_laps;
//     let max = 0;
//     for (const frame of raceData.frames) {
//       for (const abbr in frame.cars) {
//         const lap = frame.cars[abbr].lap;
//         if (lap && lap > max) max = lap;
//       }
//     }
//     return max;
//   }, [raceData]);

//   useEffect(() => {
//     if (!raceData || loading || error || !isPlaying) return;
//     const sampleMs = raceData.meta.sample_interval_ms || 300;
//     const intervalTime = sampleMs / playbackSpeed;

//     const timer = setInterval(() => {
//       setFrameIndex((prev) => (prev + 1) % raceData.frames.length);
//     }, intervalTime);

//     return () => clearInterval(timer);
//   }, [raceData, loading, error, playbackSpeed, isPlaying]);

//   useEffect(() => {
//     const handleKey = (e: KeyboardEvent) => {
//       if (!raceData) return;
//       switch (e.code) {
//         case "Space":
//           e.preventDefault();
//           setIsPlaying((p) => !p);
//           break;
//         case "ArrowLeft":
//           setFrameIndex((f) => Math.max(0, f - 50));
//           break;
//         case "ArrowRight":
//           setFrameIndex((f) => Math.min(raceData.frames.length - 1, f + 50));
//           break;
//         case "Digit1": setPlaybackSpeed(1); break;
//         case "Digit2": setPlaybackSpeed(2); break;
//         case "Digit3": setPlaybackSpeed(5); break;
//         case "Digit4": setPlaybackSpeed(10); break;
//         case "KeyR": setFrameIndex(0); break;
//       }
//     };
//     window.addEventListener("keydown", handleKey);
//     return () => window.removeEventListener("keydown", handleKey);
//   }, [raceData]);

//   if (loading) return <div className="flex h-screen items-center justify-center bg-[#0a0a0a] text-white font-bold animate-pulse">Loading Telemetry...</div>;
//   if (error || !raceData) return <div className="flex h-screen items-center justify-center bg-[#0a0a0a] text-red-500 font-bold">{error || "No data loaded"}</div>;

//   const currentFrame = raceData.frames[frameIndex];
//   const currentLap = Math.max(0, ...Object.values(currentFrame.cars).map((c: any) => c.lap || 0));
//   const totalFrames = raceData.frames.length;
//   const progressPct = (frameIndex / (totalFrames - 1)) * 100;

//   const sessionTimeStr = new Date((currentFrame.t - raceData.frames[0].t) * 1000).toISOString().substring(11, 19);

//   return (
//     <div className="fixed inset-0 w-screen h-screen bg-[#0a0a0a] flex font-sans select-none overflow-hidden">

//       {/* LEFT COLUMN: Track Area */}
//       {/* 🛠️ FIX: Increased padding-bottom (pb-28) to push the track upwards and avoid the playbar */}
//       <div className="flex-1 h-full relative flex flex-col items-center justify-center pb-28">

//         <button
//           onClick={() => navigate("/engineer")}
//           className="absolute top-6 left-6 z-[60] bg-neutral-900/90 hover:bg-neutral-800 text-white px-5 py-2.5 rounded-lg border border-neutral-700 font-bold text-sm tracking-wider transition-colors shadow-lg"
//         >
//           ← Dashboard
//         </button>

//         <div className="w-full h-full p-10 flex items-center justify-center">
//           <RaceTrack
//             drivers={drivers}
//             positions={currentFrame.cars}
//             trackOutline={raceData.track_outline}
//             bounds={raceData.meta.bounds}
//             flag={currentFrame.flag}
//           />
//         </div>

//         {/* Floating Playbar */}
//         <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[32rem] bg-neutral-900/95 backdrop-blur-xl border border-neutral-700/50 p-3.5 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] flex flex-col gap-2 z-50">
//           <input
//             type="range"
//             min={0}
//             max={totalFrames - 1}
//             value={frameIndex}
//             onChange={(e) => {
//               setIsPlaying(false);
//               setFrameIndex(Number(e.target.value));
//             }}
//             className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer hover:bg-neutral-700 transition-colors accent-red-600 outline-none"
//             style={{ background: `linear-gradient(to right, #dc2626 ${progressPct}%, #262626 ${progressPct}%)` }}
//           />

//           <div className="flex items-center justify-between px-1">
//             <div className="w-24 text-[13px] font-mono font-bold text-neutral-300 tabular-nums">
//               {sessionTimeStr}
//             </div>

//             <div className="flex items-center gap-5">
//               <button onClick={() => setFrameIndex(0)} className="text-neutral-400 hover:text-white transition-colors" title="Restart">
//                 <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z"/></svg>
//               </button>

//               <button
//                 onClick={() => setIsPlaying(!isPlaying)}
//                 className="w-12 h-9 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform"
//               >
//                 {isPlaying ? (
//                   <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zm8 0h4v16h-4z"/></svg>
//                 ) : (
//                   <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="ml-1"><path d="M8 5v14l11-7z"/></svg>
//                 )}
//               </button>

//               <button onClick={() => setFrameIndex(p => Math.min(p + (30 * playbackSpeed), totalFrames - 1))} className="text-neutral-400 hover:text-white transition-colors" title="Fast Forward">
//                 <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/></svg>
//               </button>
//             </div>

//             <div className="w-36 flex justify-end gap-1">
//               {[1, 2, 5, 10].map((speed) => (
//                 <button
//                   key={speed}
//                   onClick={() => setPlaybackSpeed(speed)}
//                   className={`text-[10px] font-black px-2.5 py-1 rounded-md transition-colors ${
//                     playbackSpeed === speed ? "bg-red-600 text-white" : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white"
//                   }`}
//                 >
//                   {speed}x
//                 </button>
//               ))}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* RIGHT COLUMN: Leaderboard */}
//       <div className="w-[340px] h-full flex-shrink-0 border-l border-neutral-800 bg-neutral-950 z-20 shadow-2xl overflow-hidden">
//         <Leaderboard
//           drivers={drivers}
//           positions={currentFrame.cars}
//           results={raceData.meta.results || {}}
//           totalLaps={totalLaps}
//           currentLap={currentLap}
//           currentTime={currentFrame.t}
//         />
//       </div>

//     </div>
//   );
// };

// export default LiveSimulator;

// import { useState, useEffect, useMemo } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import RaceTrack from "./RaceTrack";
// import Leaderboard from "./Leaderboard";

// // ─── helpers ────────────────────────────────────────────────────────────────

// const FLAG_META: Record<string, { label: string; color: string; bg: string; pulse: boolean }> = {
//   yellow:     { label: "YELLOW FLAG",           color: "#facc15", bg: "rgba(234,179,8,0.12)",   pulse: true  },
//   red:        { label: "RED FLAG",              color: "#ef4444", bg: "rgba(239,68,68,0.12)",   pulse: true  },
//   safety_car: { label: "SAFETY CAR DEPLOYED",   color: "#fb923c", bg: "rgba(251,146,60,0.12)",  pulse: false },
//   vsc:        { label: "VIRTUAL SAFETY CAR",    color: "#fb923c", bg: "rgba(251,146,60,0.12)",  pulse: false },
//   vsc_ending: { label: "VSC ENDING",            color: "#fb923c", bg: "rgba(251,146,60,0.08)",  pulse: false },
//   clear:      { label: "",                       color: "",        bg: "",                        pulse: false },
// };

// const FLAG_ICONS: Record<string, string> = {
//   yellow:     "⚠",
//   red:        "🔴",
//   safety_car: "🚨",
//   vsc:        "🚨",
//   vsc_ending: "🔶",
// };

// const SESSION_LABELS: Record<string, string> = {
//   r:  "RACE",
//   q:  "QUALIFYING",
//   s:  "SPRINT",
//   sq: "SPRINT SHOOTOUT",
// };

// function formatTime(seconds: number): string {
//   const h = Math.floor(seconds / 3600);
//   const m = Math.floor((seconds % 3600) / 60);
//   const s = Math.floor(seconds % 60);
//   if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
//   return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
// }

// function humaniseGp(gpSlug: string): string {
//   return gpSlug
//     .split("_")
//     .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
//     .join(" ");
// }

// // ─── component ──────────────────────────────────────────────────────────────

// const LiveSimulator = () => {
//   const { raceId } = useParams();
//   const navigate = useNavigate();

//   const [raceData,      setRaceData]      = useState<any>(null);
//   const [frameIndex,    setFrameIndex]    = useState(0);
//   const [loading,       setLoading]       = useState(true);
//   const [error,         setError]         = useState<string | null>(null);
//   const [playbackSpeed, setPlaybackSpeed] = useState<number>(5);
//   const [isPlaying,     setIsPlaying]     = useState(true);

//   // Parse raceId → year / gp / session
//   const { year, gp, session } = useMemo(() => {
//     if (!raceId) return { year: "", gp: "", session: "" };
//     const parts = raceId.split("_");
//     return {
//       year:    parts[0],
//       session: parts[parts.length - 1],
//       gp:      parts.slice(1, -1).join("_"),
//     };
//   }, [raceId]);

//   // ── fetch ─────────────────────────────────────────────────────────────────
//   useEffect(() => {
//     if (!raceId) { setError("No race ID provided"); setLoading(false); return; }
//     setLoading(true);
//     setError(null);

//     fetch(`/api/races/data/${year}/${gp}/${session}`)
//       .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
//       .then((data) => { setRaceData(data); setFrameIndex(0); setLoading(false); })
//       .catch((e)  => { setError(e.message); setLoading(false); });
//   }, [raceId, year, gp, session]);

//   // ── derived ───────────────────────────────────────────────────────────────
//   const drivers = useMemo(() => {
//     if (!raceData) return [];
//     return Object.entries(raceData.meta.team_colors).map(([code, color]) => ({
//       code,
//       color: color as string,
//     }));
//   }, [raceData]);

//   const totalLaps = useMemo(() => {
//     if (!raceData) return 0;
//     if (raceData.meta.total_laps) return raceData.meta.total_laps;
//     let max = 0;
//     for (const frame of raceData.frames)
//       for (const abbr in frame.cars) {
//         const lap = frame.cars[abbr].lap;
//         if (lap && lap > max) max = lap;
//       }
//     return max;
//   }, [raceData]);

//   // ── playback loop ─────────────────────────────────────────────────────────
//   useEffect(() => {
//     if (!raceData || loading || error || !isPlaying) return;
//     const ms = (raceData.meta.sample_interval_ms || 300) / playbackSpeed;
//     const t  = setInterval(() =>
//       setFrameIndex((p) => (p + 1 >= raceData.frames.length ? (setIsPlaying(false), p) : p + 1)),
//     ms);
//     return () => clearInterval(t);
//   }, [raceData, loading, error, playbackSpeed, isPlaying]);

//   // ── keyboard ──────────────────────────────────────────────────────────────
//   useEffect(() => {
//     const onKey = (e: KeyboardEvent) => {
//       if (!raceData) return;
//       const total = raceData.frames.length;
//       if (e.code === "Space")       { e.preventDefault(); setIsPlaying((p) => !p); }
//       else if (e.code === "ArrowLeft")  setFrameIndex((f) => Math.max(0, f - 50));
//       else if (e.code === "ArrowRight") setFrameIndex((f) => Math.min(total - 1, f + 50));
//       else if (e.code === "KeyR")   setFrameIndex(0);
//       else if (e.code === "Digit1") setPlaybackSpeed(1);
//       else if (e.code === "Digit2") setPlaybackSpeed(2);
//       else if (e.code === "Digit3") setPlaybackSpeed(5);
//       else if (e.code === "Digit4") setPlaybackSpeed(10);
//     };
//     window.addEventListener("keydown", onKey);
//     return () => window.removeEventListener("keydown", onKey);
//   }, [raceData]);

//   // ── loading / error screens ───────────────────────────────────────────────
//   if (loading) return (
//     <div className="fixed inset-0 bg-[#080808] flex flex-col items-center justify-center gap-4">
//       <div className="w-10 h-10 rounded-full border-2 border-neutral-700 border-t-red-500 animate-spin" />
//       <p className="text-neutral-400 text-sm font-bold tracking-widest uppercase">Loading Telemetry</p>
//     </div>
//   );

//   if (error || !raceData) return (
//     <div className="fixed inset-0 bg-[#080808] flex flex-col items-center justify-center gap-3">
//       <p className="text-red-500 font-bold text-lg">{error || "No data loaded"}</p>
//       <button onClick={() => navigate(-1)} className="text-neutral-400 text-sm hover:text-white transition-colors">
//         ← Go back
//       </button>
//     </div>
//   );

//   // ── frame data ────────────────────────────────────────────────────────────
//   const currentFrame  = raceData.frames[frameIndex];
//   const totalFrames   = raceData.frames.length;
//   const progressPct   = (frameIndex / (totalFrames - 1)) * 100;
//   const currentLap    = Math.max(0, ...Object.values(currentFrame.cars).map((c: any) => c.lap || 0));
//   const elapsedSec    = currentFrame.t - raceData.frames[0].t;
//   const flag          = currentFrame.flag as string || "clear";
//   const flagMeta      = FLAG_META[flag] || FLAG_META.clear;
//   const gpLabel       = humaniseGp(gp);
//   const sessionLabel  = SESSION_LABELS[session] || session.toUpperCase();

//   return (
//     <div className="fixed inset-0 w-screen h-screen bg-[#080808] flex overflow-hidden select-none font-sans">

//       {/* ══════════════════════════════════════════════════════════════
//           LEFT COLUMN  —  header + track + playbar
//          ══════════════════════════════════════════════════════════════ */}
//       <div className="flex-1 h-full flex flex-col overflow-hidden min-w-0">

//         {/* ── TOP BAR ── only over the track, leaderboard has its own header */}
//         <div
//           className="flex-shrink-0 flex items-center justify-between px-5 h-14 border-b border-neutral-800/60"
//           style={{
//             background: flagMeta.bg
//               ? `linear-gradient(90deg, #111111 60%, ${flagMeta.bg})`
//               : "#111111",
//             transition: "background 0.6s ease",
//           }}
//         >
//           {/* Left: back button */}
//           <button
//             onClick={() => navigate("/engineer")}
//             className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors text-sm font-bold tracking-wider group"
//           >
//             <span className="text-lg group-hover:-translate-x-0.5 transition-transform">←</span>
//             Dashboard
//           </button>

//           {/* Centre: GP name + year + session */}
//           <div className="flex flex-col items-center leading-tight">
//             <div className="flex items-center gap-2.5">
//               <span className="text-[10px] font-black text-red-500 tracking-[0.2em] uppercase">
//                 {sessionLabel}
//               </span>
//               <span className="w-px h-3 bg-neutral-700" />
//               <span className="text-[10px] font-bold text-neutral-500 tracking-widest">
//                 {year}
//               </span>
//             </div>
//             <h1 className="text-sm font-black text-white tracking-tight leading-none">
//               {gpLabel}
//             </h1>
//           </div>

//           {/* Right: flag status pill */}
//           <div className="w-40 flex justify-end">
//             {flag !== "clear" ? (
//               <div
//                 className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-black tracking-widest uppercase ${flagMeta.pulse ? "animate-pulse" : ""}`}
//                 style={{
//                   color:            flagMeta.color,
//                   borderColor:      flagMeta.color + "55",
//                   backgroundColor:  flagMeta.color + "18",
//                 }}
//               >
//                 <span>{FLAG_ICONS[flag]}</span>
//                 <span>{flagMeta.label}</span>
//               </div>
//             ) : (
//               /* green dot when all clear */
//               <div className="flex items-center gap-2 text-[11px] font-bold text-neutral-500 tracking-widest">
//                 <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
//                 ALL CLEAR
//               </div>
//             )}
//           </div>
//         </div>

//         {/* ── TRACK AREA ── */}
//         <div className="flex-1 min-h-0 relative">
//           <RaceTrack
//             drivers={drivers}
//             positions={currentFrame.cars}
//             trackOutline={raceData.track_outline}
//             bounds={raceData.meta.bounds}
//             flag={flag}
//           />
//         </div>

//         {/* ── PLAYBAR ── */}
//         <div className="flex-shrink-0 px-6 pb-5 pt-3 bg-[#080808] border-t border-neutral-800/50">

//           {/* progress scrubber */}
//           <div className="relative mb-3 group">
//             <div className="absolute inset-0 flex items-center pointer-events-none">
//               <div className="w-full h-0.5 bg-neutral-800 rounded-full" />
//               <div
//                 className="absolute h-0.5 bg-red-600 rounded-full transition-none"
//                 style={{ width: `${progressPct}%` }}
//               />
//             </div>
//             <input
//               type="range"
//               min={0}
//               max={totalFrames - 1}
//               value={frameIndex}
//               onChange={(e) => { setIsPlaying(false); setFrameIndex(Number(e.target.value)); }}
//               className="relative w-full h-4 opacity-0 cursor-pointer"
//             />
//             {/* thumb dot */}
//             <div
//               className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444] pointer-events-none transition-none"
//               style={{ left: `calc(${progressPct}% - 6px)` }}
//             />
//           </div>

//           {/* controls row */}
//           <div className="flex items-center justify-between">

//             {/* time */}
//             <span className="w-28 text-[13px] font-mono font-bold text-neutral-300 tabular-nums">
//               {formatTime(elapsedSec)}
//             </span>

//             {/* transport */}
//             <div className="flex items-center gap-6">
//               {/* rewind */}
//               <button
//                 onClick={() => setFrameIndex((f) => Math.max(0, f - 150))}
//                 className="text-neutral-500 hover:text-white transition-colors"
//                 title="Rewind (←)"
//               >
//                 <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
//                   <path d="M11 18V6l-8.5 6 8.5 6zm.5-6 8.5 6V6l-8.5 6z"/>
//                 </svg>
//               </button>

//               {/* play / pause */}
//               <button
//                 onClick={() => setIsPlaying((p) => !p)}
//                 className="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-lg"
//                 title="Play/Pause (Space)"
//               >
//                 {isPlaying ? (
//                   <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
//                     <path d="M6 4h4v16H6zm8 0h4v16h-4z"/>
//                   </svg>
//                 ) : (
//                   <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 2 }}>
//                     <path d="M8 5v14l11-7z"/>
//                   </svg>
//                 )}
//               </button>

//               {/* fast-forward */}
//               <button
//                 onClick={() => setFrameIndex((f) => Math.min(f + 150, totalFrames - 1))}
//                 className="text-neutral-500 hover:text-white transition-colors"
//                 title="Fast Forward (→)"
//               >
//                 <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
//                   <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/>
//                 </svg>
//               </button>
//             </div>

//             {/* speed buttons */}
//             <div className="w-28 flex justify-end gap-1">
//               {[1, 2, 5, 10].map((s) => (
//                 <button
//                   key={s}
//                   onClick={() => setPlaybackSpeed(s)}
//                   className={`text-[10px] font-black px-2 py-1 rounded transition-colors ${
//                     playbackSpeed === s
//                       ? "bg-red-600 text-white"
//                       : "bg-neutral-800/80 text-neutral-500 hover:text-white hover:bg-neutral-700"
//                   }`}
//                 >
//                   {s}×
//                 </button>
//               ))}
//             </div>
//           </div>

//           {/* keyboard hint — shown once, fades */}
//           <p className="mt-2 text-center text-[10px] text-neutral-700 tracking-widest">
//             SPACE · ← → · 1–4 · R
//           </p>
//         </div>
//       </div>

//       {/* ══════════════════════════════════════════════════════════════
//           RIGHT COLUMN  —  leaderboard (unchanged width / layout)
//          ══════════════════════════════════════════════════════════════ */}
//       <div className="w-[300px] flex-shrink-0 h-full border-l border-neutral-800 bg-neutral-950 overflow-hidden">
//         <Leaderboard
//           drivers={drivers}
//           positions={currentFrame.cars}
//           results={raceData.meta.results || {}}
//           totalLaps={totalLaps}
//           currentLap={currentLap}
//           currentTime={currentFrame.t}
//         />
//       </div>

//     </div>
//   );
// };

// export default LiveSimulator;

// import { useState, useEffect, useMemo } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import RaceTrack from "./RaceTrack";
// import Leaderboard from "./Leaderboard";

// // ─── helpers ────────────────────────────────────────────────────────────────

// const FLAG_META: Record<string, { label: string; color: string; bg: string; pulse: boolean }> = {
//   yellow:     { label: "YELLOW FLAG",           color: "#facc15", bg: "rgba(234,179,8,0.12)",   pulse: true  },
//   red:        { label: "RED FLAG",              color: "#ef4444", bg: "rgba(239,68,68,0.12)",   pulse: true  },
//   safety_car: { label: "SAFETY CAR DEPLOYED",   color: "#fb923c", bg: "rgba(251,146,60,0.12)",  pulse: false },
//   vsc:        { label: "VIRTUAL SAFETY CAR",    color: "#fb923c", bg: "rgba(251,146,60,0.12)",  pulse: false },
//   vsc_ending: { label: "VSC ENDING",            color: "#fb923c", bg: "rgba(251,146,60,0.08)",  pulse: false },
//   clear:      { label: "",                       color: "",        bg: "",                        pulse: false },
// };

// const FLAG_ICONS: Record<string, string> = {
//   yellow:     "⚠",
//   red:        "🔴",
//   safety_car: "🚨",
//   vsc:        "🚨",
//   vsc_ending: "🔶",
// };

// const SESSION_LABELS: Record<string, string> = {
//   r:  "RACE",
//   q:  "QUALIFYING",
//   s:  "SPRINT",
//   sq: "SPRINT SHOOTOUT",
// };

// function formatTime(seconds: number): string {
//   const h = Math.floor(seconds / 3600);
//   const m = Math.floor((seconds % 3600) / 60);
//   const s = Math.floor(seconds % 60);
//   if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
//   return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
// }

// function humaniseGp(gpSlug: string): string {
//   return gpSlug
//     .split("_")
//     .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
//     .join(" ");
// }

// // ─── component ──────────────────────────────────────────────────────────────

// const LiveSimulator = () => {
//   const { raceId } = useParams();
//   const navigate = useNavigate();

//   const [raceData,      setRaceData]      = useState<any>(null);
//   const [frameIndex,    setFrameIndex]    = useState(0);
//   const [loading,       setLoading]       = useState(true);
//   const [error,         setError]         = useState<string | null>(null);
//   const [playbackSpeed, setPlaybackSpeed] = useState<number>(5);
//   const [isPlaying,     setIsPlaying]     = useState(true);

//   // Parse raceId → year / gp / session
//   const { year, gp, session } = useMemo(() => {
//     if (!raceId) return { year: "", gp: "", session: "" };
//     const parts = raceId.split("_");
//     return {
//       year:    parts[0],
//       session: parts[parts.length - 1],
//       gp:      parts.slice(1, -1).join("_"),
//     };
//   }, [raceId]);

//   // ── fetch ─────────────────────────────────────────────────────────────────
//   useEffect(() => {
//     if (!raceId) { setError("No race ID provided"); setLoading(false); return; }
//     setLoading(true);
//     setError(null);

//     fetch(`/api/races/data/${year}/${gp}/${session}`)
//       .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
//       .then((data) => { setRaceData(data); setFrameIndex(0); setLoading(false); })
//       .catch((e)  => { setError(e.message); setLoading(false); });
//   }, [raceId, year, gp, session]);

//   // ── derived ───────────────────────────────────────────────────────────────
//   const drivers = useMemo(() => {
//     if (!raceData) return [];
//     return Object.entries(raceData.meta.team_colors).map(([code, color]) => ({
//       code,
//       color: color as string,
//     }));
//   }, [raceData]);

//   const totalLaps = useMemo(() => {
//     if (!raceData) return 0;
//     if (raceData.meta.total_laps) return raceData.meta.total_laps;
//     let max = 0;
//     for (const frame of raceData.frames)
//       for (const abbr in frame.cars) {
//         const lap = frame.cars[abbr].lap;
//         if (lap && lap > max) max = lap;
//       }
//     return max;
//   }, [raceData]);

//   // ── playback loop ─────────────────────────────────────────────────────────
//   useEffect(() => {
//     if (!raceData || loading || error || !isPlaying) return;
//     const ms = (raceData.meta.sample_interval_ms || 300) / playbackSpeed;
//     const t  = setInterval(() =>
//       setFrameIndex((p) => (p + 1 >= raceData.frames.length ? (setIsPlaying(false), p) : p + 1)),
//     ms);
//     return () => clearInterval(t);
//   }, [raceData, loading, error, playbackSpeed, isPlaying]);

//   // ── keyboard ──────────────────────────────────────────────────────────────
//   useEffect(() => {
//     const onKey = (e: KeyboardEvent) => {
//       if (!raceData) return;
//       const total = raceData.frames.length;
//       if (e.code === "Space")       { e.preventDefault(); setIsPlaying((p) => !p); }
//       else if (e.code === "ArrowLeft")  setFrameIndex((f) => Math.max(0, f - 50));
//       else if (e.code === "ArrowRight") setFrameIndex((f) => Math.min(total - 1, f + 50));
//       else if (e.code === "KeyR")   setFrameIndex(0);
//       else if (e.code === "Digit1") setPlaybackSpeed(1);
//       else if (e.code === "Digit2") setPlaybackSpeed(2);
//       else if (e.code === "Digit3") setPlaybackSpeed(5);
//       else if (e.code === "Digit4") setPlaybackSpeed(10);
//     };
//     window.addEventListener("keydown", onKey);
//     return () => window.removeEventListener("keydown", onKey);
//   }, [raceData]);

//   // ── loading / error screens ───────────────────────────────────────────────
//   if (loading) return (
//     <div className="fixed inset-0 bg-[#080808] flex flex-col items-center justify-center gap-4">
//       <div className="w-10 h-10 rounded-full border-2 border-neutral-700 border-t-red-500 animate-spin" />
//       <p className="text-neutral-400 text-sm font-bold tracking-widest uppercase">Loading Telemetry</p>
//     </div>
//   );

//   if (error || !raceData) return (
//     <div className="fixed inset-0 bg-[#080808] flex flex-col items-center justify-center gap-3">
//       <p className="text-red-500 font-bold text-lg">{error || "No data loaded"}</p>
//       <button onClick={() => navigate(-1)} className="text-neutral-400 text-sm hover:text-white transition-colors">
//         ← Go back
//       </button>
//     </div>
//   );

//   // ── frame data ────────────────────────────────────────────────────────────
//   const currentFrame  = raceData.frames[frameIndex];
//   const totalFrames   = raceData.frames.length;
//   const progressPct   = (frameIndex / (totalFrames - 1)) * 100;
//   const currentLap    = Math.max(0, ...Object.values(currentFrame.cars).map((c: any) => c.lap || 0));
//   const elapsedSec    = currentFrame.t - raceData.frames[0].t;
//   const flag          = currentFrame.flag as string || "clear";
//   const flagMeta      = FLAG_META[flag] || FLAG_META.clear;
//   const gpLabel       = humaniseGp(gp);
//   const sessionLabel  = SESSION_LABELS[session] || session.toUpperCase();

//   return (
//     <div className="fixed inset-0 w-screen h-screen bg-[#080808] flex overflow-hidden select-none font-sans">

//       {/* ══════════════════════════════════════════════════════════════
//           LEFT COLUMN  —  header + track + playbar
//          ══════════════════════════════════════════════════════════════ */}
//       <div className="flex-1 h-full flex flex-col overflow-hidden min-w-0">

//         {/* ── TOP BAR ── only over the track, leaderboard has its own header */}
//         <div
//           className="flex-shrink-0 flex items-center justify-between px-5 h-14 border-b border-neutral-800/60"
//           style={{
//             background: flagMeta.bg
//               ? `linear-gradient(90deg, #111111 60%, ${flagMeta.bg})`
//               : "#111111",
//             transition: "background 0.6s ease",
//           }}
//         >
//           {/* Left: back button */}
//           <button
//             onClick={() => navigate("/engineer")}
//             className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors text-sm font-bold tracking-wider group"
//           >
//             <span className="text-lg group-hover:-translate-x-0.5 transition-transform">←</span>
//             Dashboard
//           </button>

//           {/* Centre: GP name + year + session */}
//           <div className="flex flex-col items-center leading-tight">
//             <div className="flex items-center gap-2.5">
//               <span className="text-[10px] font-black text-red-500 tracking-[0.2em] uppercase">
//                 {sessionLabel}
//               </span>
//               <span className="w-px h-3 bg-neutral-700" />
//               <span className="text-[10px] font-bold text-neutral-500 tracking-widest">
//                 {year}
//               </span>
//             </div>
//             <h1 className="text-sm font-black text-white tracking-tight leading-none">
//               {gpLabel}
//             </h1>
//           </div>

//           {/* Right: flag status pill */}
//           <div className="w-40 flex justify-end">
//             {flag !== "clear" ? (
//               <div
//                 className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-black tracking-widest uppercase ${flagMeta.pulse ? "animate-pulse" : ""}`}
//                 style={{
//                   color:            flagMeta.color,
//                   borderColor:      flagMeta.color + "55",
//                   backgroundColor:  flagMeta.color + "18",
//                 }}
//               >
//                 <span>{FLAG_ICONS[flag]}</span>
//                 <span>{flagMeta.label}</span>
//               </div>
//             ) : (
//               /* green dot when all clear */
//               <div className="flex items-center gap-2 text-[11px] font-bold text-neutral-500 tracking-widest">
//                 <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
//                 ALL CLEAR
//               </div>
//             )}
//           </div>
//         </div>

//         {/* ── TRACK AREA ── */}
//         <div className="flex-1 min-h-0 relative">
//           <RaceTrack
//             drivers={drivers}
//             positions={currentFrame.cars}
//             trackOutline={raceData.track_outline}
//             bounds={raceData.meta.bounds}
//             flag={flag}
//           />
//         </div>

//         {/* ── PLAYBAR ── */}
//         <div className="flex-shrink-0 px-6 pb-5 pt-3 bg-[#080808] border-t border-neutral-800/50">

//           {/* progress scrubber */}
//           <div className="relative mb-3 group">
//             <div className="absolute inset-0 flex items-center pointer-events-none">
//               <div className="w-full h-0.5 bg-neutral-800 rounded-full" />
//               <div
//                 className="absolute h-0.5 bg-red-600 rounded-full transition-none"
//                 style={{ width: `${progressPct}%` }}
//               />
//             </div>
//             <input
//               type="range"
//               min={0}
//               max={totalFrames - 1}
//               value={frameIndex}
//               onChange={(e) => { setIsPlaying(false); setFrameIndex(Number(e.target.value)); }}
//               className="relative w-full h-4 opacity-0 cursor-pointer"
//             />
//             {/* thumb dot */}
//             <div
//               className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444] pointer-events-none transition-none"
//               style={{ left: `calc(${progressPct}% - 6px)` }}
//             />
//           </div>

//           {/* controls row */}
//           <div className="flex items-center justify-between">

//             {/* time */}
//             <span className="w-28 text-[13px] font-mono font-bold text-neutral-300 tabular-nums">
//               {formatTime(elapsedSec)}
//             </span>

//             {/* transport */}
//             <div className="flex items-center gap-6">
//               {/* rewind */}
//               <button
//                 onClick={() => setFrameIndex((f) => Math.max(0, f - 150))}
//                 className="text-neutral-500 hover:text-white transition-colors"
//                 title="Rewind (←)"
//               >
//                 <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
//                   <path d="M11 18V6l-8.5 6 8.5 6zm.5-6 8.5 6V6l-8.5 6z"/>
//                 </svg>
//               </button>

//               {/* play / pause */}
//               <button
//                 onClick={() => setIsPlaying((p) => !p)}
//                 className="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-lg"
//                 title="Play/Pause (Space)"
//               >
//                 {isPlaying ? (
//                   <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
//                     <path d="M6 4h4v16H6zm8 0h4v16h-4z"/>
//                   </svg>
//                 ) : (
//                   <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 2 }}>
//                     <path d="M8 5v14l11-7z"/>
//                   </svg>
//                 )}
//               </button>

//               {/* fast-forward */}
//               <button
//                 onClick={() => setFrameIndex((f) => Math.min(f + 150, totalFrames - 1))}
//                 className="text-neutral-500 hover:text-white transition-colors"
//                 title="Fast Forward (→)"
//               >
//                 <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
//                   <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/>
//                 </svg>
//               </button>
//             </div>

//             {/* speed buttons */}
//             <div className="w-28 flex justify-end gap-1">
//               {[1, 2, 5, 10].map((s) => (
//                 <button
//                   key={s}
//                   onClick={() => setPlaybackSpeed(s)}
//                   className={`text-[10px] font-black px-2 py-1 rounded transition-colors ${
//                     playbackSpeed === s
//                       ? "bg-red-600 text-white"
//                       : "bg-neutral-800/80 text-neutral-500 hover:text-white hover:bg-neutral-700"
//                   }`}
//                 >
//                   {s}×
//                 </button>
//               ))}
//             </div>
//           </div>

//           {/* keyboard hint — shown once, fades */}
//           <p className="mt-2 text-center text-[10px] text-neutral-700 tracking-widest">
//             SPACE · ← → · 1–4 · R
//           </p>
//         </div>
//       </div>

//       {/* ══════════════════════════════════════════════════════════════
//           RIGHT COLUMN  —  leaderboard (unchanged width / layout)
//          ══════════════════════════════════════════════════════════════ */}
//       <div className="w-[300px] flex-shrink-0 h-full border-l border-neutral-800 bg-neutral-950 overflow-hidden">
//         <Leaderboard
//           drivers={drivers}
//           positions={currentFrame.cars}
//           results={raceData.meta.results || {}}
//           totalLaps={totalLaps}
//           currentLap={currentLap}
//           currentTime={currentFrame.t}
//         />
//       </div>

//     </div>
//   );
// };

// export default LiveSimulator;

// import { useState, useEffect, useMemo } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import RaceTrack from "./RaceTrack";
// import Leaderboard from "./Leaderboard";

// // ─── helpers ────────────────────────────────────────────────────────────────

// const FLAG_META: Record<string, { label: string; color: string; bg: string; pulse: boolean }> = {
//   yellow:     { label: "YELLOW FLAG",           color: "#facc15", bg: "rgba(234,179,8,0.12)",   pulse: true  },
//   red:        { label: "RED FLAG",              color: "#ef4444", bg: "rgba(239,68,68,0.12)",   pulse: true  },
//   safety_car: { label: "SAFETY CAR DEPLOYED",   color: "#fb923c", bg: "rgba(251,146,60,0.12)",  pulse: false },
//   vsc:        { label: "VIRTUAL SAFETY CAR",    color: "#fb923c", bg: "rgba(251,146,60,0.12)",  pulse: false },
//   vsc_ending: { label: "VSC ENDING",            color: "#fb923c", bg: "rgba(251,146,60,0.08)",  pulse: false },
//   clear:      { label: "",                       color: "",        bg: "",                        pulse: false },
// };

// const FLAG_ICONS: Record<string, string> = {
//   yellow:     "⚠",
//   red:        "🔴",
//   safety_car: "🚨",
//   vsc:        "🚨",
//   vsc_ending: "🔶",
// };

// const SESSION_LABELS: Record<string, string> = {
//   r:  "RACE",
//   q:  "QUALIFYING",
//   s:  "SPRINT",
//   sq: "SPRINT SHOOTOUT",
// };

// function formatTime(seconds: number): string {
//   const h = Math.floor(seconds / 3600);
//   const m = Math.floor((seconds % 3600) / 60);
//   const s = Math.floor(seconds % 60);
//   if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
//   return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
// }

// function humaniseGp(gpSlug: string): string {
//   return gpSlug
//     .split("_")
//     .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
//     .join(" ");
// }

// // ─── component ──────────────────────────────────────────────────────────────

// const LiveSimulator = () => {
//   const { raceId } = useParams();
//   const navigate = useNavigate();

//   const [raceData,      setRaceData]      = useState<any>(null);
//   const [frameIndex,    setFrameIndex]    = useState(0);
//   const [loading,       setLoading]       = useState(true);
//   const [error,         setError]         = useState<string | null>(null);
//   const [playbackSpeed, setPlaybackSpeed] = useState<number>(5);
//   const [isPlaying,     setIsPlaying]     = useState(true);

//   // Parse raceId → year / gp / session
//   const { year, gp, session } = useMemo(() => {
//     if (!raceId) return { year: "", gp: "", session: "" };
//     const parts = raceId.split("_");
//     return {
//       year:    parts[0],
//       session: parts[parts.length - 1],
//       gp:      parts.slice(1, -1).join("_"),
//     };
//   }, [raceId]);

//   // ── fetch ─────────────────────────────────────────────────────────────────
//   useEffect(() => {
//     if (!raceId) { setError("No race ID provided"); setLoading(false); return; }
//     setLoading(true);
//     setError(null);

//     fetch(`/api/races/data/${year}/${gp}/${session}`)
//       .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
//       .then((data) => { setRaceData(data); setFrameIndex(0); setLoading(false); })
//       .catch((e)  => { setError(e.message); setLoading(false); });
//   }, [raceId, year, gp, session]);

//   // ── derived ───────────────────────────────────────────────────────────────
//   const drivers = useMemo(() => {
//     if (!raceData) return [];
//     return Object.entries(raceData.meta.team_colors).map(([code, color]) => ({
//       code,
//       color: color as string,
//     }));
//   }, [raceData]);

//   const totalLaps = useMemo(() => {
//     if (!raceData) return 0;
//     if (raceData.meta.total_laps) return raceData.meta.total_laps;
//     let max = 0;
//     for (const frame of raceData.frames)
//       for (const abbr in frame.cars) {
//         const lap = frame.cars[abbr].lap;
//         if (lap && lap > max) max = lap;
//       }
//     return max;
//   }, [raceData]);

//   // 🛠️ FIX: Calculate dynamic transition time for smooth CSS animations on the track
//   const baseIntervalMs = raceData?.meta?.sample_interval_ms || 300;
//   const currentTransitionMs = isPlaying ? (baseIntervalMs / playbackSpeed) : 0;

//   // ── playback loop ─────────────────────────────────────────────────────────
//   useEffect(() => {
//     if (!raceData || loading || error || !isPlaying) return;

//     const t  = setInterval(() =>
//       setFrameIndex((p) => (p + 1 >= raceData.frames.length ? (setIsPlaying(false), p) : p + 1)),
//       currentTransitionMs // 🛠️ Uses the dynamically calculated interval
//     );
//     return () => clearInterval(t);
//   }, [raceData, loading, error, isPlaying, currentTransitionMs]);

//   // ── keyboard ──────────────────────────────────────────────────────────────
//   useEffect(() => {
//     const onKey = (e: KeyboardEvent) => {
//       if (!raceData) return;
//       const total = raceData.frames.length;
//       if (e.code === "Space")       { e.preventDefault(); setIsPlaying((p) => !p); }
//       else if (e.code === "ArrowLeft")  setFrameIndex((f) => Math.max(0, f - 50));
//       else if (e.code === "ArrowRight") setFrameIndex((f) => Math.min(total - 1, f + 50));
//       else if (e.code === "KeyR")   setFrameIndex(0);
//       else if (e.code === "Digit1") setPlaybackSpeed(1);
//       else if (e.code === "Digit2") setPlaybackSpeed(2);
//       else if (e.code === "Digit3") setPlaybackSpeed(5);
//       else if (e.code === "Digit4") setPlaybackSpeed(10);
//     };
//     window.addEventListener("keydown", onKey);
//     return () => window.removeEventListener("keydown", onKey);
//   }, [raceData]);

//   // ── loading / error screens ───────────────────────────────────────────────
//   if (loading) return (
//     <div className="fixed inset-0 bg-[#080808] flex flex-col items-center justify-center gap-4">
//       <div className="w-10 h-10 rounded-full border-2 border-neutral-700 border-t-red-500 animate-spin" />
//       <p className="text-neutral-400 text-sm font-bold tracking-widest uppercase">Loading Telemetry</p>
//     </div>
//   );

//   if (error || !raceData) return (
//     <div className="fixed inset-0 bg-[#080808] flex flex-col items-center justify-center gap-3">
//       <p className="text-red-500 font-bold text-lg">{error || "No data loaded"}</p>
//       <button onClick={() => navigate(-1)} className="text-neutral-400 text-sm hover:text-white transition-colors">
//         ← Go back
//       </button>
//     </div>
//   );

//   // ── frame data ────────────────────────────────────────────────────────────
//   const currentFrame  = raceData.frames[frameIndex];
//   const totalFrames   = raceData.frames.length;
//   const progressPct   = (frameIndex / (totalFrames - 1)) * 100;
//   const currentLap    = Math.max(0, ...Object.values(currentFrame.cars).map((c: any) => c.lap || 0));
//   const elapsedSec    = currentFrame.t - raceData.frames[0].t;
//   const flag          = currentFrame.flag as string || "clear";
//   const flagMeta      = FLAG_META[flag] || FLAG_META.clear;
//   const gpLabel       = humaniseGp(gp);
//   const sessionLabel  = SESSION_LABELS[session] || session.toUpperCase();

//   return (
//     <div className="fixed inset-0 w-screen h-screen bg-[#080808] flex overflow-hidden select-none font-sans">

//       {/* ══════════════════════════════════════════════════════════════
//           LEFT COLUMN  —  header + track + playbar
//          ══════════════════════════════════════════════════════════════ */}
//       <div className="flex-1 h-full flex flex-col overflow-hidden min-w-0">

//         {/* ── TOP BAR ── only over the track, leaderboard has its own header */}
//         <div
//           className="flex-shrink-0 flex items-center justify-between px-5 h-14 border-b border-neutral-800/60"
//           style={{
//             background: flagMeta.bg
//               ? `linear-gradient(90deg, #111111 60%, ${flagMeta.bg})`
//               : "#111111",
//             transition: "background 0.6s ease",
//           }}
//         >
//           {/* Left: back button */}
//           <button
//             onClick={() => navigate("/engineer")}
//             className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors text-sm font-bold tracking-wider group"
//           >
//             <span className="text-lg group-hover:-translate-x-0.5 transition-transform">←</span>
//             Dashboard
//           </button>

//           {/* Centre: GP name + year + session */}
//           <div className="flex flex-col items-center leading-tight">
//             <div className="flex items-center gap-2.5">
//               <span className="text-[10px] font-black text-red-500 tracking-[0.2em] uppercase">
//                 {sessionLabel}
//               </span>
//               <span className="w-px h-3 bg-neutral-700" />
//               <span className="text-[10px] font-bold text-neutral-500 tracking-widest">
//                 {year}
//               </span>
//             </div>
//             <h1 className="text-sm font-black text-white tracking-tight leading-none">
//               {gpLabel}
//             </h1>
//           </div>

//           {/* Right: flag status pill */}
//           <div className="w-40 flex justify-end">
//             {flag !== "clear" ? (
//               <div
//                 className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-black tracking-widest uppercase ${flagMeta.pulse ? "animate-pulse" : ""}`}
//                 style={{
//                   color:            flagMeta.color,
//                   borderColor:      flagMeta.color + "55",
//                   backgroundColor:  flagMeta.color + "18",
//                 }}
//               >
//                 <span>{FLAG_ICONS[flag]}</span>
//                 <span>{flagMeta.label}</span>
//               </div>
//             ) : (
//               /* green dot when all clear */
//               <div className="flex items-center gap-2 text-[11px] font-bold text-neutral-500 tracking-widest">
//                 <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
//                 ALL CLEAR
//               </div>
//             )}
//           </div>
//         </div>

//         {/* ── TRACK AREA ── */}
//         <div className="flex-1 min-h-0 relative">
//           <RaceTrack
//             drivers={drivers}
//             positions={currentFrame.cars}
//             trackOutline={raceData.track_outline}
//             bounds={raceData.meta.bounds}
//             flag={flag}
//             transitionMs={currentTransitionMs} // 🛠️ FIX: Passed for smooth CSS transitions
//             showNames={true}                   // 🛠️ FIX: Enables driver names
//           />
//         </div>

//         {/* ── PLAYBAR ── */}
//         <div className="flex-shrink-0 px-6 pb-5 pt-3 bg-[#080808] border-t border-neutral-800/50">

//           {/* progress scrubber */}
//           <div className="relative mb-3 group">
//             <div className="absolute inset-0 flex items-center pointer-events-none">
//               <div className="w-full h-0.5 bg-neutral-800 rounded-full" />
//               <div
//                 className="absolute h-0.5 bg-red-600 rounded-full transition-none"
//                 style={{ width: `${progressPct}%` }}
//               />
//             </div>
//             <input
//               type="range"
//               min={0}
//               max={totalFrames - 1}
//               value={frameIndex}
//               onChange={(e) => { setIsPlaying(false); setFrameIndex(Number(e.target.value)); }}
//               className="relative w-full h-4 opacity-0 cursor-pointer"
//             />
//             {/* thumb dot */}
//             <div
//               className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444] pointer-events-none transition-none"
//               style={{ left: `calc(${progressPct}% - 6px)` }}
//             />
//           </div>

//           {/* controls row */}
//           <div className="flex items-center justify-between">

//             {/* time */}
//             <span className="w-28 text-[13px] font-mono font-bold text-neutral-300 tabular-nums">
//               {formatTime(elapsedSec)}
//             </span>

//             {/* transport */}
//             <div className="flex items-center gap-6">
//               {/* rewind */}
//               <button
//                 onClick={() => setFrameIndex((f) => Math.max(0, f - 150))}
//                 className="text-neutral-500 hover:text-white transition-colors"
//                 title="Rewind (←)"
//               >
//                 <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
//                   <path d="M11 18V6l-8.5 6 8.5 6zm.5-6 8.5 6V6l-8.5 6z"/>
//                 </svg>
//               </button>

//               {/* play / pause */}
//               <button
//                 onClick={() => setIsPlaying((p) => !p)}
//                 className="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-lg"
//                 title="Play/Pause (Space)"
//               >
//                 {isPlaying ? (
//                   <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
//                     <path d="M6 4h4v16H6zm8 0h4v16h-4z"/>
//                   </svg>
//                 ) : (
//                   <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 2 }}>
//                     <path d="M8 5v14l11-7z"/>
//                   </svg>
//                 )}
//               </button>

//               {/* fast-forward */}
//               <button
//                 onClick={() => setFrameIndex((f) => Math.min(f + 150, totalFrames - 1))}
//                 className="text-neutral-500 hover:text-white transition-colors"
//                 title="Fast Forward (→)"
//               >
//                 <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
//                   <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/>
//                 </svg>
//               </button>
//             </div>

//             {/* speed buttons */}
//             <div className="w-28 flex justify-end gap-1">
//               {[1, 2, 5, 10].map((s) => (
//                 <button
//                   key={s}
//                   onClick={() => setPlaybackSpeed(s)}
//                   className={`text-[10px] font-black px-2 py-1 rounded transition-colors ${
//                     playbackSpeed === s
//                       ? "bg-red-600 text-white"
//                       : "bg-neutral-800/80 text-neutral-500 hover:text-white hover:bg-neutral-700"
//                   }`}
//                 >
//                   {s}×
//                 </button>
//               ))}
//             </div>
//           </div>

//           {/* keyboard hint — shown once, fades */}
//           <p className="mt-2 text-center text-[10px] text-neutral-700 tracking-widest">
//             SPACE · ← → · 1–4 · R
//           </p>
//         </div>
//       </div>

//       {/* ══════════════════════════════════════════════════════════════
//           RIGHT COLUMN  —  leaderboard (unchanged width / layout)
//          ══════════════════════════════════════════════════════════════ */}
//       <div className="w-[300px] flex-shrink-0 h-full border-l border-neutral-800 bg-neutral-950 overflow-hidden">
//         <Leaderboard
//           drivers={drivers}
//           positions={currentFrame.cars}
//           results={raceData.meta.results || {}}
//           totalLaps={totalLaps}
//           currentLap={currentLap}
//           currentTime={currentFrame.t}
//         />
//       </div>

//     </div>
//   );
// };

// export default LiveSimulator;

// import { useState, useEffect, useMemo } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import RaceTrack from "./RaceTrack";
// import Leaderboard from "./Leaderboard";

// // ─── helpers ────────────────────────────────────────────────────────────────

// const FLAG_META: Record<string, { label: string; color: string; bg: string; pulse: boolean }> = {
//   yellow:     { label: "YELLOW FLAG",           color: "#facc15", bg: "rgba(234,179,8,0.12)",   pulse: true  },
//   red:        { label: "RED FLAG",              color: "#ef4444", bg: "rgba(239,68,68,0.12)",   pulse: true  },
//   safety_car: { label: "SAFETY CAR DEPLOYED",   color: "#fb923c", bg: "rgba(251,146,60,0.12)",  pulse: false },
//   vsc:        { label: "VIRTUAL SAFETY CAR",    color: "#fb923c", bg: "rgba(251,146,60,0.12)",  pulse: false },
//   vsc_ending: { label: "VSC ENDING",            color: "#fb923c", bg: "rgba(251,146,60,0.08)",  pulse: false },
//   clear:      { label: "",                       color: "",        bg: "",                        pulse: false },
// };

// const FLAG_ICONS: Record<string, string> = {
//   yellow:     "⚠",
//   red:        "🔴",
//   safety_car: "🚨",
//   vsc:        "🚨",
//   vsc_ending: "🔶",
// };

// const SESSION_LABELS: Record<string, string> = {
//   r:  "RACE",
//   q:  "QUALIFYING",
//   s:  "SPRINT",
//   sq: "SPRINT SHOOTOUT",
// };

// function formatTime(seconds: number): string {
//   const h = Math.floor(seconds / 3600);
//   const m = Math.floor((seconds % 3600) / 60);
//   const s = Math.floor(seconds % 60);
//   if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
//   return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
// }

// function humaniseGp(gpSlug: string): string {
//   return gpSlug
//     .split("_")
//     .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
//     .join(" ");
// }

// // ─── component ──────────────────────────────────────────────────────────────

// const LiveSimulator = () => {
//   const { raceId } = useParams();
//   const navigate = useNavigate();

//   const [raceData,      setRaceData]      = useState<any>(null);
//   const [frameIndex,    setFrameIndex]    = useState(0);
//   const [loading,       setLoading]       = useState(true);
//   const [error,         setError]         = useState<string | null>(null);
//   const [playbackSpeed, setPlaybackSpeed] = useState<number>(5);
//   const [isPlaying,     setIsPlaying]     = useState(true);

//   // 🛠️ NEW: State to toggle driver names
//   const [showNames,     setShowNames]     = useState<boolean>(false);

//   // Parse raceId → year / gp / session
//   const { year, gp, session } = useMemo(() => {
//     if (!raceId) return { year: "", gp: "", session: "" };
//     const parts = raceId.split("_");
//     return {
//       year:    parts[0],
//       session: parts[parts.length - 1],
//       gp:      parts.slice(1, -1).join("_"),
//     };
//   }, [raceId]);

//   // ── fetch ─────────────────────────────────────────────────────────────────
//   useEffect(() => {
//     if (!raceId) { setError("No race ID provided"); setLoading(false); return; }
//     setLoading(true);
//     setError(null);

//     fetch(`/api/races/data/${year}/${gp}/${session}`)
//       .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
//       .then((data) => { setRaceData(data); setFrameIndex(0); setLoading(false); })
//       .catch((e)  => { setError(e.message); setLoading(false); });
//   }, [raceId, year, gp, session]);

//   // ── derived ───────────────────────────────────────────────────────────────
//   const drivers = useMemo(() => {
//     if (!raceData) return [];
//     return Object.entries(raceData.meta.team_colors).map(([code, color]) => ({
//       code,
//       color: color as string,
//     }));
//   }, [raceData]);

//   const totalLaps = useMemo(() => {
//     if (!raceData) return 0;
//     if (raceData.meta.total_laps) return raceData.meta.total_laps;
//     let max = 0;
//     for (const frame of raceData.frames)
//       for (const abbr in frame.cars) {
//         const lap = frame.cars[abbr].lap;
//         if (lap && lap > max) max = lap;
//       }
//     return max;
//   }, [raceData]);

//   // Drivers whose position data is absent from the current frame — they have retired.
//   // The backend keeps sending their last known coordinates, so RaceTrack must be told
//   // explicitly to skip rendering them.
//   const retiredDrivers = useMemo(() => {
//     if (!raceData) return new Set<string>();
//     const frame = raceData.frames[frameIndex];
//     return new Set(drivers.filter((d) => !frame?.cars[d.code]).map((d) => d.code));
//   }, [drivers, raceData, frameIndex]);

//   const baseIntervalMs = raceData?.meta?.sample_interval_ms || 300;
//   const currentTransitionMs = isPlaying ? (baseIntervalMs / playbackSpeed) : 0;

//   // ── playback loop ─────────────────────────────────────────────────────────
//   useEffect(() => {
//     if (!raceData || loading || error || !isPlaying) return;

//     const t  = setInterval(() =>
//       setFrameIndex((p) => (p + 1 >= raceData.frames.length ? (setIsPlaying(false), p) : p + 1)),
//       currentTransitionMs
//     );
//     return () => clearInterval(t);
//   }, [raceData, loading, error, isPlaying, currentTransitionMs]);

//   // ── keyboard ──────────────────────────────────────────────────────────────
//   useEffect(() => {
//     const onKey = (e: KeyboardEvent) => {
//       if (!raceData) return;
//       const total = raceData.frames.length;
//       if (e.code === "Space")       { e.preventDefault(); setIsPlaying((p) => !p); }
//       else if (e.code === "ArrowLeft")  setFrameIndex((f) => Math.max(0, f - 50));
//       else if (e.code === "ArrowRight") setFrameIndex((f) => Math.min(total - 1, f + 50));
//       else if (e.code === "KeyR")   setFrameIndex(0);
//       else if (e.code === "KeyL")   setShowNames((p) => !p); // 🛠️ NEW: Toggle labels with L key
//       else if (e.code === "Digit1") setPlaybackSpeed(1);
//       else if (e.code === "Digit2") setPlaybackSpeed(2);
//       else if (e.code === "Digit3") setPlaybackSpeed(5);
//       else if (e.code === "Digit4") setPlaybackSpeed(10);
//     };
//     window.addEventListener("keydown", onKey);
//     return () => window.removeEventListener("keydown", onKey);
//   }, [raceData]);

//   // ── loading / error screens ───────────────────────────────────────────────
//   if (loading) return (
//     <div className="fixed inset-0 bg-[#080808] flex flex-col items-center justify-center gap-4">
//       <div className="w-10 h-10 rounded-full border-2 border-neutral-700 border-t-red-500 animate-spin" />
//       <p className="text-neutral-400 text-sm font-bold tracking-widest uppercase">Loading Telemetry</p>
//     </div>
//   );

//   if (error || !raceData) return (
//     <div className="fixed inset-0 bg-[#080808] flex flex-col items-center justify-center gap-3">
//       <p className="text-red-500 font-bold text-lg">{error || "No data loaded"}</p>
//       <button onClick={() => navigate(-1)} className="text-neutral-400 text-sm hover:text-white transition-colors">
//         ← Go back
//       </button>
//     </div>
//   );

//   // ── frame data ────────────────────────────────────────────────────────────
//   const currentFrame  = raceData.frames[frameIndex];
//   const totalFrames   = raceData.frames.length;
//   const progressPct   = (frameIndex / (totalFrames - 1)) * 100;
//   const currentLap    = Math.max(0, ...Object.values(currentFrame.cars).map((c: any) => c.lap || 0));
//   const elapsedSec    = currentFrame.t - raceData.frames[0].t;
//   const flag          = currentFrame.flag as string || "clear";
//   const flagMeta      = FLAG_META[flag] || FLAG_META.clear;
//   const gpLabel       = humaniseGp(gp);
//   const sessionLabel  = SESSION_LABELS[session] || session.toUpperCase();

//   return (
//     <div className="fixed inset-0 w-screen h-screen bg-[#080808] flex overflow-hidden select-none font-sans">

//       {/* ══════════════════════════════════════════════════════════════
//           LEFT COLUMN  —  header + track + playbar
//          ══════════════════════════════════════════════════════════════ */}
//       <div className="flex-1 h-full flex flex-col overflow-hidden min-w-0">

//         {/* ── TOP BAR ── */}
//         <div
//           className="flex-shrink-0 flex items-center justify-between px-5 h-14 border-b border-neutral-800/60"
//           style={{
//             background: flagMeta.bg
//               ? `linear-gradient(90deg, #111111 60%, ${flagMeta.bg})`
//               : "#111111",
//             transition: "background 0.6s ease",
//           }}
//         >
//           <button
//             onClick={() => navigate("/engineer")}
//             className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors text-sm font-bold tracking-wider group"
//           >
//             <span className="text-lg group-hover:-translate-x-0.5 transition-transform">←</span>
//             Dashboard
//           </button>

//           <div className="flex flex-col items-center leading-tight">
//             <div className="flex items-center gap-2.5">
//               <span className="text-[10px] font-black text-red-500 tracking-[0.2em] uppercase">
//                 {sessionLabel}
//               </span>
//               <span className="w-px h-3 bg-neutral-700" />
//               <span className="text-[10px] font-bold text-neutral-500 tracking-widest">
//                 {year}
//               </span>
//             </div>
//             <h1 className="text-sm font-black text-white tracking-tight leading-none">
//               {gpLabel}
//             </h1>
//           </div>

//           <div className="w-40 flex justify-end">
//             {flag !== "clear" ? (
//               <div
//                 className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-black tracking-widest uppercase ${flagMeta.pulse ? "animate-pulse" : ""}`}
//                 style={{
//                   color:            flagMeta.color,
//                   borderColor:      flagMeta.color + "55",
//                   backgroundColor:  flagMeta.color + "18",
//                 }}
//               >
//                 <span>{FLAG_ICONS[flag]}</span>
//                 <span>{flagMeta.label}</span>
//               </div>
//             ) : (
//               <div className="flex items-center gap-2 text-[11px] font-bold text-neutral-500 tracking-widest">
//                 <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
//                 ALL CLEAR
//               </div>
//             )}
//           </div>
//         </div>

//         {/* ── TRACK AREA ── */}
//         <div className="flex-1 min-h-0 relative">
//           <RaceTrack
//             drivers={drivers}
//             positions={currentFrame.cars}
//             trackOutline={raceData.track_outline}
//             bounds={raceData.meta.bounds}
//             flag={flag}
//             transitionMs={currentTransitionMs}
//             showNames={showNames} // 🛠️ NEW: Passed dynamic state here
//             retiredDrivers={retiredDrivers}
//           />
//         </div>

//         {/* ── PLAYBAR ── */}
//         <div className="flex-shrink-0 px-6 pb-5 pt-3 bg-[#080808] border-t border-neutral-800/50">

//           <div className="relative mb-3 group">
//             <div className="absolute inset-0 flex items-center pointer-events-none">
//               <div className="w-full h-0.5 bg-neutral-800 rounded-full" />
//               <div
//                 className="absolute h-0.5 bg-red-600 rounded-full transition-none"
//                 style={{ width: `${progressPct}%` }}
//               />
//             </div>
//             <input
//               type="range"
//               min={0}
//               max={totalFrames - 1}
//               value={frameIndex}
//               onChange={(e) => { setIsPlaying(false); setFrameIndex(Number(e.target.value)); }}
//               className="relative w-full h-4 opacity-0 cursor-pointer"
//             />
//             <div
//               className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444] pointer-events-none transition-none"
//               style={{ left: `calc(${progressPct}% - 6px)` }}
//             />
//           </div>

//           <div className="flex items-center justify-between">

//             <span className="w-28 text-[13px] font-mono font-bold text-neutral-300 tabular-nums">
//               {formatTime(elapsedSec)}
//             </span>

//             <div className="flex items-center gap-6">
//               <button onClick={() => setFrameIndex((f) => Math.max(0, f - 150))} className="text-neutral-500 hover:text-white transition-colors">
//                 <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M11 18V6l-8.5 6 8.5 6zm.5-6 8.5 6V6l-8.5 6z"/></svg>
//               </button>
//               <button
//                 onClick={() => setIsPlaying((p) => !p)}
//                 className="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-lg"
//               >
//                 {isPlaying ? (
//                   <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zm8 0h4v16h-4z"/></svg>
//                 ) : (
//                   <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 2 }}><path d="M8 5v14l11-7z"/></svg>
//                 )}
//               </button>
//               <button onClick={() => setFrameIndex((f) => Math.min(f + 150, totalFrames - 1))} className="text-neutral-500 hover:text-white transition-colors">
//                 <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/></svg>
//               </button>
//             </div>

//             <div className="w-28 flex justify-end gap-1">
//               {[1, 2, 5, 10].map((s) => (
//                 <button
//                   key={s}
//                   onClick={() => setPlaybackSpeed(s)}
//                   className={`text-[10px] font-black px-2 py-1 rounded transition-colors ${
//                     playbackSpeed === s ? "bg-red-600 text-white" : "bg-neutral-800/80 text-neutral-500 hover:text-white hover:bg-neutral-700"
//                   }`}
//                 >
//                   {s}×
//                 </button>
//               ))}
//             </div>
//           </div>

//           {/* 🛠️ NEW: Added L to the keyboard hints */}
//           <p className="mt-2 text-center text-[10px] text-neutral-700 tracking-widest">
//             SPACE · ← → · 1–4 · R · L (LABELS)
//           </p>
//         </div>
//       </div>

//       {/* ══════════════════════════════════════════════════════════════
//           RIGHT COLUMN  —  leaderboard
//          ══════════════════════════════════════════════════════════════ */}
//       <div className="w-[300px] flex-shrink-0 h-full border-l border-neutral-800 bg-neutral-950 overflow-hidden">
//         <Leaderboard
//           drivers={drivers}
//           positions={currentFrame.cars}
//           results={raceData.meta.results || {}}
//           totalLaps={totalLaps}
//           currentLap={currentLap}
//           currentTime={currentFrame.t}
//         />
//       </div>

//     </div>
//   );
// };

// export default LiveSimulator;

import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import RaceTrack from "./RaceTrack";
import Leaderboard from "./Leaderboard";

// ─── helpers ────────────────────────────────────────────────────────────────

const FLAG_META: Record<
  string,
  { label: string; color: string; bg: string; pulse: boolean }
> = {
  yellow: {
    label: "YELLOW FLAG",
    color: "#facc15",
    bg: "rgba(234,179,8,0.12)",
    pulse: true,
  },
  red: {
    label: "RED FLAG",
    color: "#ef4444",
    bg: "rgba(239,68,68,0.12)",
    pulse: true,
  },
  safety_car: {
    label: "SAFETY CAR DEPLOYED",
    color: "#fb923c",
    bg: "rgba(251,146,60,0.12)",
    pulse: false,
  },
  vsc: {
    label: "VIRTUAL SAFETY CAR",
    color: "#fb923c",
    bg: "rgba(251,146,60,0.12)",
    pulse: false,
  },
  vsc_ending: {
    label: "VSC ENDING",
    color: "#fb923c",
    bg: "rgba(251,146,60,0.08)",
    pulse: false,
  },
  clear: { label: "", color: "", bg: "", pulse: false },
};

const FLAG_ICONS: Record<string, string> = {
  yellow: "⚠",
  red: "🔴",
  safety_car: "🚨",
  vsc: "🚨",
  vsc_ending: "🔶",
};

const SESSION_LABELS: Record<string, string> = {
  r: "RACE",
  q: "QUALIFYING",
  s: "SPRINT",
  sq: "SPRINT SHOOTOUT",
};

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0)
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function humaniseGp(gpSlug: string): string {
  return gpSlug
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ─── component ──────────────────────────────────────────────────────────────

const LiveSimulator = () => {
  const { raceId } = useParams();
  const navigate = useNavigate();

  const [raceData, setRaceData] = useState<any>(null);
  const [frameIndex, setFrameIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(5);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showNames, setShowNames] = useState<boolean>(false);
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);

  // Parse raceId → year / gp / session
  const { year, gp, session } = useMemo(() => {
    if (!raceId) return { year: "", gp: "", session: "" };
    const parts = raceId.split("_");
    return {
      year: parts[0],
      session: parts[parts.length - 1],
      gp: parts.slice(1, -1).join("_"),
    };
  }, [raceId]);

  // ── fetch ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!raceId) {
      setError("No race ID provided");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    fetch(`/api/races/data/${year}/${gp}/${session}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setRaceData(data);
        setFrameIndex(0);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [raceId, year, gp, session]);

  // ── derived ───────────────────────────────────────────────────────────────
  const drivers = useMemo(() => {
    if (!raceData) return [];
    return Object.entries(raceData.meta.team_colors).map(([code, color]) => ({
      code,
      color: color as string,
    }));
  }, [raceData]);

  const totalLaps = useMemo(() => {
    if (!raceData) return 0;
    if (raceData.meta.total_laps) return raceData.meta.total_laps;
    let max = 0;
    for (const frame of raceData.frames)
      for (const abbr in frame.cars) {
        const lap = frame.cars[abbr].lap;
        if (lap && lap > max) max = lap;
      }
    return max;
  }, [raceData]);

  const retiredDrivers = useMemo(() => {
    if (!raceData) return new Set<string>();
    const frame = raceData.frames[frameIndex];
    return new Set(
      drivers.filter((d) => !frame?.cars[d.code]).map((d) => d.code)
    );
  }, [drivers, raceData, frameIndex]);

  const baseIntervalMs = raceData?.meta?.sample_interval_ms || 300;
  const currentTransitionMs = isPlaying ? baseIntervalMs / playbackSpeed : 0;

  // ── playback loop ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!raceData || loading || error || !isPlaying) return;

    const t = setInterval(
      () =>
        setFrameIndex((p) =>
          p + 1 >= raceData.frames.length ? (setIsPlaying(false), p) : p + 1
        ),
      currentTransitionMs
    );
    return () => clearInterval(t);
  }, [raceData, loading, error, isPlaying, currentTransitionMs]);

  // ── keyboard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!raceData) return;
      const total = raceData.frames.length;
      if (e.code === "Space") {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if (e.code === "ArrowLeft")
        setFrameIndex((f) => Math.max(0, f - 50));
      else if (e.code === "ArrowRight")
        setFrameIndex((f) => Math.min(total - 1, f + 50));
      else if (e.code === "KeyR") setFrameIndex(0);
      else if (e.code === "KeyL") setShowNames((p) => !p);
      else if (e.code === "Digit1") setPlaybackSpeed(1);
      else if (e.code === "Digit2") setPlaybackSpeed(2);
      else if (e.code === "Digit3") setPlaybackSpeed(5);
      else if (e.code === "Digit4") setPlaybackSpeed(10);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [raceData]);

  if (loading)
    return (
      <div className="fixed inset-0 bg-[#080808] flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-neutral-700 border-t-red-500 animate-spin" />
        <p className="text-neutral-400 text-sm font-bold tracking-widest uppercase">
          Loading Telemetry
        </p>
      </div>
    );

  if (error || !raceData)
    return (
      <div className="fixed inset-0 bg-[#080808] flex flex-col items-center justify-center gap-3">
        <p className="text-red-500 font-bold text-lg">
          {error || "No data loaded"}
        </p>
        <button
          onClick={() => navigate(-1)}
          className="text-neutral-400 text-sm hover:text-white transition-colors"
        >
          ← Go back
        </button>
      </div>
    );

  // ── frame data ────────────────────────────────────────────────────────────
  const currentFrame = raceData.frames[frameIndex];
  const totalFrames = raceData.frames.length;
  const progressPct = (frameIndex / (totalFrames - 1)) * 100;
  const currentLap = Math.max(
    0,
    ...Object.values(currentFrame.cars).map((c: any) => c.lap || 0)
  );
  const elapsedSec = currentFrame.t - raceData.frames[0].t;
  const flag = (currentFrame.flag as string) || "clear";
  const flagMeta = FLAG_META[flag] || FLAG_META.clear;
  const gpLabel = humaniseGp(gp);
  const sessionLabel = SESSION_LABELS[session] || session.toUpperCase();

  // 🛠️ WEATHER DISPLAY PARSING
  const weather = currentFrame?.weather || {
    air_temp: 0.0,
    track_temp: 0.0,
    humidity: 0.0,
    wind_speed: 0.0,
  };

  return (
    <div className="fixed inset-0 w-screen h-screen bg-[#080808] flex overflow-hidden select-none font-sans">
      {/* LEFT COLUMN — header + track + playbar */}
      <div className="flex-1 h-full flex flex-col overflow-hidden min-w-0">
        {/* ── TOP BAR ── */}
        <div
          className="flex-shrink-0 flex items-center justify-between px-5 h-14 border-b border-neutral-800/60"
          style={{
            background: flagMeta.bg
              ? `linear-gradient(90deg, #111111 60%, ${flagMeta.bg})`
              : "#111111",
            transition: "background 0.6s ease",
          }}
        >
          <button
            onClick={() => navigate("/engineer")}
            className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors text-sm font-bold tracking-wider group"
          >
            <span className="text-lg group-hover:-translate-x-0.5 transition-transform">
              ←
            </span>
            Dashboard
          </button>

          <div className="flex flex-col items-center leading-tight">
            <div className="flex items-center gap-2.5">
              <span className="text-[10px] font-black text-red-500 tracking-[0.2em] uppercase">
                {sessionLabel}
              </span>
              <span className="w-px h-3 bg-neutral-700" />
              <span className="text-[10px] font-bold text-neutral-500 tracking-widest">
                {year}
              </span>
            </div>
            <h1 className="text-sm font-black text-white tracking-tight leading-none">
              {gpLabel}
            </h1>
          </div>

          <div className="w-40 flex justify-end">
            {flag !== "clear" ? (
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-black tracking-widest uppercase ${
                  flagMeta.pulse ? "animate-pulse" : ""
                }`}
                style={{
                  color: flagMeta.color,
                  borderColor: flagMeta.color + "55",
                  backgroundColor: flagMeta.color + "18",
                }}
              >
                <span>{FLAG_ICONS[flag]}</span>
                <span>{flagMeta.label}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-[11px] font-bold text-neutral-500 tracking-widest">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
                ALL CLEAR
              </div>
            )}
          </div>
        </div>

        {/* ── TRACK AREA ── */}
        <div className="flex-1 min-h-0 relative">
          {/* 🛠️ NEW: FLOATING TRACK CONDITIONS DISPLAY BOX */}
          <div className="absolute top-6 left-6 z-40 w-44 bg-neutral-900/80 backdrop-blur-md border border-neutral-800/80 rounded-xl p-3.5 shadow-2xl flex flex-col gap-2.5">
            <div className="flex flex-col border-b border-neutral-800 pb-1.5">
              <span className="text-[9px] font-black text-red-500 tracking-wider uppercase">
                Telemetry Status
              </span>
              <span className="text-[11px] font-bold text-white uppercase tracking-wide">
                Track Conditions
              </span>
            </div>

            <div className="flex flex-col gap-1.5 font-mono">
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-500 font-sans font-medium text-[11px]">
                  AIR TEMP
                </span>
                <span className="text-white font-bold tabular-nums">
                  {weather.air_temp.toFixed(1)}°C
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-500 font-sans font-medium text-[11px]">
                  TRACK TEMP
                </span>
                <span className="text-white font-bold tabular-nums">
                  {weather.track_temp.toFixed(1)}°C
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-500 font-sans font-medium text-[11px]">
                  HUMIDITY
                </span>
                <span className="text-white font-bold tabular-nums">
                  {weather.humidity.toFixed(0)}%
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-500 font-sans font-medium text-[11px]">
                  WIND SPEED
                </span>
                <span className="text-white font-bold tabular-nums">
                  {weather.wind_speed.toFixed(1)} m/s
                </span>
              </div>
            </div>
          </div>

          {/* {selectedDriver && currentFrame.cars[selectedDriver] && (
            <div className="absolute bottom-32 left-6 z-40 bg-neutral-900/90 border border-neutral-700 rounded-xl p-4 w-64 shadow-2xl backdrop-blur-md">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xl font-black text-white">
                  {selectedDriver}
                </span>
                <button
                  onClick={() => setSelectedDriver(null)}
                  className="text-neutral-500 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-neutral-800 p-2 rounded text-center">
                  <div className="text-[9px] text-neutral-400">SPEED</div>
                  <div className="text-lg font-mono font-bold text-white">
                    {currentFrame.cars[selectedDriver].speed}{" "}
                    <span className="text-[10px]">KM/H</span>
                  </div>
                </div>
                <div className="bg-neutral-800 p-2 rounded text-center">
                  <div className="text-[9px] text-neutral-400">GEAR</div>
                  <div className="text-lg font-mono font-bold text-white">
                    {currentFrame.cars[selectedDriver].gear}
                  </div>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-[10px] text-neutral-400">
                  <span>THROTTLE</span>
                  <span>{currentFrame.cars[selectedDriver].throttle}%</span>
                </div>
                <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500"
                    style={{
                      width: `${currentFrame.cars[selectedDriver].throttle}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          )} */}

          {selectedDriver && currentFrame.cars[selectedDriver] && (
            <div className="absolute bottom-32 left-6 z-40 bg-neutral-900/90 border border-neutral-700 rounded-xl p-4 w-64 shadow-2xl backdrop-blur-md">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xl font-black text-white">{selectedDriver}</span>
                <button onClick={() => setSelectedDriver(null)} className="text-neutral-500 hover:text-white">✕</button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-neutral-800 p-2 rounded text-center">
                  <div className="text-[9px] text-neutral-400">SPEED</div>
                  <div className="text-lg font-mono font-bold text-white">{currentFrame.cars[selectedDriver].speed} <span className="text-[10px]">KM/H</span></div>
                </div>
                <div className="bg-neutral-800 p-2 rounded text-center">
                  <div className="text-[9px] text-neutral-400">GEAR</div>
                  <div className="text-lg font-mono font-bold text-white">{currentFrame.cars[selectedDriver].gear}</div>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-[10px] text-neutral-400"><span>THROTTLE</span><span>{currentFrame.cars[selectedDriver].throttle}%</span></div>
                <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${currentFrame.cars[selectedDriver].throttle}%` }} />
                </div>
              </div>
            </div>
          )}

          <RaceTrack
            drivers={drivers}
            positions={currentFrame.cars}
            trackOutline={raceData.track_outline}
            bounds={raceData.meta.bounds}
            flag={flag}
            transitionMs={currentTransitionMs}
            showNames={showNames}
            retiredDrivers={retiredDrivers}
          />
        </div>

        {/* ── PLAYBAR ── */}
        <div className="flex-shrink-0 px-6 pb-5 pt-3 bg-[#080808] border-t border-neutral-800/50">
          <div className="relative mb-3 group">
            <div className="absolute inset-0 flex items-center pointer-events-none">
              <div className="w-full h-0.5 bg-neutral-800 rounded-full" />
              <div
                className="absolute h-0.5 bg-red-600 rounded-full transition-none"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <input
              type="range"
              min={0}
              max={totalFrames - 1}
              value={frameIndex}
              onChange={(e) => {
                setIsPlaying(false);
                setFrameIndex(Number(e.target.value));
              }}
              className="relative w-full h-4 opacity-0 cursor-pointer"
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444] pointer-events-none transition-none"
              style={{ left: `calc(${progressPct}% - 6px)` }}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="w-28 text-[13px] font-mono font-bold text-neutral-300 tabular-nums">
              {formatTime(elapsedSec)}
            </span>

            <div className="flex items-center gap-6">
              <button
                onClick={() => setFrameIndex((f) => Math.max(0, f - 150))}
                className="text-neutral-500 hover:text-white transition-colors"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z" />
                </svg>
              </button>
              <button
                onClick={() => setIsPlaying((p) => !p)}
                className="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-lg"
              >
                {isPlaying ? (
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M6 4h4v16H6zm8 0h4v16h-4z" />
                  </svg>
                ) : (
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    style={{ marginLeft: 2 }}
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>
              <button
                onClick={() =>
                  setFrameIndex((f) => Math.min(f + 150, totalFrames - 1))
                }
                className="text-neutral-500 hover:text-white transition-colors"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z" />
                </svg>
              </button>
            </div>

            <div className="w-28 flex justify-end gap-1">
              {[1, 2, 5, 10].map((s) => (
                <button
                  key={s}
                  onClick={() => setPlaybackSpeed(s)}
                  className={`text-[10px] font-black px-2 py-1 rounded transition-colors ${
                    playbackSpeed === s
                      ? "bg-red-600 text-white"
                      : "bg-neutral-800/80 text-neutral-500 hover:text-white hover:bg-neutral-700"
                  }`}
                >
                  {s}×
                </button>
              ))}
            </div>
          </div>

          <p className="mt-2 text-center text-[10px] text-neutral-700 tracking-widest">
            SPACE · ← → · 1–4 · R · L (LABELS)
          </p>
        </div>
      </div>

      {/* RIGHT COLUMN — leaderboard */}
      <div className="w-[300px] flex-shrink-0 h-full border-l border-neutral-800 bg-neutral-950 overflow-hidden">
        <Leaderboard
          drivers={drivers}
          positions={currentFrame.cars}
          results={raceData.meta.results || {}}
          totalLaps={totalLaps}
          currentLap={currentLap}
          currentTime={currentFrame.t}
          onDriverSelect={setSelectedDriver}
          selectedDriver={selectedDriver}
        />
      </div>
    </div>
  );
};

export default LiveSimulator;
