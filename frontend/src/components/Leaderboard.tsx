// import { useState, useMemo, useRef } from "react";

// interface Driver {
//   code: string;
//   color: string;
// }

// interface CarPosition {
//   x: number;
//   y: number;
//   lap: number | null;
//   distance?: number;
//   dist?: number; 
//   compound?: string;
//   tyre_life?: number;
//   in_pit?: boolean;
// }

// interface DriverResult {
//   status: string;
//   final_position: number | null;
// }

// interface LeaderboardProps {
//   drivers: Driver[];
//   positions: Record<string, CarPosition>;
//   results?: Record<string, DriverResult>;
//   totalLaps: number;
//   currentLap: number;
//   currentTime: number;
// }

// const TYRE_COLORS: Record<string, string> = {
//   SOFT: "#DA291C",
//   MEDIUM: "#FFD12E",
//   HARD: "#F0F0F0",
//   INTERMEDIATE: "#43B02A",
//   WET: "#0067AD",
//   UNKNOWN: "#525252",
// };

// const Leaderboard = ({
//   drivers,
//   positions,
//   results = {},
//   totalLaps,
//   currentLap,
//   currentTime,
// }: LeaderboardProps) => {
//   const [gapMode, setGapMode] = useState<"leader" | "interval">("interval");
  
//   const prevLeaderRef = useRef<{ time: number; leaderDistance: number } | null>(null);
//   // 🛠️ FIX: Track every driver's historical distance to calculate their exact live speed
//   const prevDriverRef = useRef<Record<string, { time: number; distance: number }>>({});

//   const sortedDrivers = useMemo(() => {
//     return drivers
//       .map((d, index) => {
//         const pos = positions[d.code];
//         const isOut = !pos;
        
//         let distance = isOut ? -100000 - index : (pos.distance ?? pos.dist ?? 0);
//         if (isNaN(distance)) distance = 0;
        
//         const compound = (pos?.compound || "UNKNOWN").toUpperCase();

//         // 🛠️ FIX: Calculate individual driver speed (meters per second)
//         let speed = 60; 
//         const prev = prevDriverRef.current[d.code];
//         if (prev && currentTime > prev.time) {
//           const dt = currentTime - prev.time;
//           const dd = distance - prev.distance;
//           if (dt > 0) speed = Math.max(0, dd / dt);
//         }
//         prevDriverRef.current[d.code] = { time: currentTime, distance };

//         // 🛠️ FIX: Realism Check. Only show PIT if the backend says they are pitting AND 
//         // they are moving at pit-lane speeds (between 1 m/s and 25 m/s) on a lap > 1.
//         const isPitting = pos?.in_pit && speed > 1 && speed < 26 && currentLap > 1;

//         return { ...d, distance, compound, pos, isOut, isPitting };
//       })
//       .sort((a, b) => b.distance - a.distance);
//   }, [drivers, positions, currentTime, currentLap]);

//   const leaderDistance = sortedDrivers[0]?.distance ?? 0;

//   const leaderSpeed = useMemo(() => {
//     const prev = prevLeaderRef.current;
//     let speed = 60; 
    
//     if (prev && currentTime > prev.time) {
//       const dt = currentTime - prev.time;
//       const dd = leaderDistance - prev.leaderDistance;
//       if (dt > 0 && dd > 0) speed = dd / dt;
//     }
    
//     prevLeaderRef.current = { time: currentTime, leaderDistance };
//     return Math.max(speed, 5); 
//   }, [currentTime, leaderDistance]);

//   const getGapDisplay = (index: number) => {
//     const driver = sortedDrivers[index];
//     if (driver.isOut) return "OUT";
//     if (index === 0) return gapMode === "leader" ? "Leader" : "Interval";
    
//     const distDiff = gapMode === "leader"
//         ? leaderDistance - driver.distance
//         : sortedDrivers[index - 1].distance - driver.distance;
    
//     if (isNaN(distDiff) || distDiff < 0) return "+0.000";
    
//     if (distDiff > 4000) {
//       const leaderLap = sortedDrivers[0].pos?.lap || 0;
//       const driverLap = driver.pos?.lap || 0;
//       const lapDiff = leaderLap - driverLap;
//       if (lapDiff > 0) return `+${lapDiff} LAP${lapDiff > 1 ? 'S' : ''}`;
//     }

//     const timeDiff = distDiff / leaderSpeed;
//     if (timeDiff === 0 && currentLap <= 1) return "+0.000";
    
//     return `+${timeDiff.toFixed(3)}`;
//   };

//   return (
//     <div className="w-full h-full flex flex-col font-sans select-none bg-neutral-950">
      
//       <div className="px-5 py-4 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between shrink-0">
//         <div className="flex flex-col">
//           <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">
//             Live Telemetry
//           </span>
//           <span className="text-sm font-black text-white tabular-nums">
//             LAP {Math.min(currentLap, totalLaps)} / {totalLaps}
//           </span>
//         </div>
//         <button
//           onClick={() => setGapMode((prev) => (prev === "leader" ? "interval" : "leader"))}
//           className="text-xs font-bold text-neutral-400 hover:text-white bg-neutral-800 px-3 py-1.5 rounded transition-colors uppercase tracking-wider"
//         >
//           {gapMode}
//         </button>
//       </div>

//       <div className="flex-1 flex flex-col w-full overflow-hidden">
//         {sortedDrivers.map((driver, index) => {
//           const tyreColor = TYRE_COLORS[driver.compound] || TYRE_COLORS.UNKNOWN;
//           const tyreLabel = driver.compound !== "UNKNOWN" ? driver.compound[0] : "";
//           const tyreTextColor = (driver.compound === "HARD" || driver.compound === "MEDIUM" || driver.compound === "UNKNOWN") ? "#000" : "#fff";

//           return (
//             <div
//               key={driver.code}
//               style={{ borderLeftColor: driver.color }}
//               className={`flex-1 min-h-0 flex items-center px-4 border-l-4 border-b border-neutral-800/50 hover:bg-neutral-800/80 transition-colors ${
//                 driver.isOut ? "opacity-30 grayscale" : ""
//               }`}
//             >
//               <span className="w-6 text-sm font-bold text-neutral-500">{index + 1}</span>
//               <span className="font-bold text-white tracking-wide text-sm w-12">
//                 {driver.code}
//               </span>

//               <div
//                 className="w-[18px] h-[18px] rounded-full border border-black/50 mr-3 flex-shrink-0 shadow-sm flex items-center justify-center text-[10px] font-black"
//                 style={{ backgroundColor: tyreColor, color: tyreTextColor }}
//                 title={driver.compound}
//               >
//                 {tyreLabel}
//               </div>

//               <div className="flex gap-1 w-10">
//                 {/* 🛠️ FIX: Using our new highly accurate isPitting variable */}
//                 {driver.isPitting && !driver.isOut && (
//                   <span className="text-[10px] font-black text-yellow-400 bg-yellow-900/40 px-1.5 py-0.5 rounded border border-yellow-500/20">
//                     PIT
//                   </span>
//                 )}
//                 {driver.isOut && (
//                   <span className="text-[10px] font-black text-red-500 bg-red-900/40 px-1.5 py-0.5 rounded border border-red-500/20">
//                     OUT
//                   </span>
//                 )}
//               </div>

//               <span className={`ml-auto text-sm font-mono tabular-nums font-medium ${driver.isOut ? 'text-red-500 font-bold' : 'text-neutral-200'}`}>
//                 {getGapDisplay(index)}
//               </span>
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// };

// export default Leaderboard;

// import { useState, useMemo } from "react";

// interface Driver {
//   code: string;
//   color: string;
// }

// interface LeaderboardProps {
//   drivers: Driver[];
//   positions: any; 
//   results: any;
//   totalLaps: number;
//   currentLap: number;
//   currentTime: number;
// }

// const getTyreBadgeClass = (compound: string): string => {
//   switch (compound?.toUpperCase()) {
//     case 'SOFT': return 'bg-red-600/20 text-red-500 border border-red-500/30';
//     case 'MEDIUM': return 'bg-yellow-600/20 text-yellow-500 border border-yellow-500/30';
//     case 'HARD': return 'bg-white/10 text-neutral-300 border border-neutral-500/30';
//     case 'INTERMEDIATE': return 'bg-green-600/20 text-green-500 border border-green-500/30';
//     case 'WET': return 'bg-blue-600/20 text-blue-500 border border-blue-500/30';
//     default: return 'bg-neutral-800 text-neutral-500 border border-neutral-700/50';
//   }
// };

// const Leaderboard = ({ drivers, positions, results, totalLaps, currentLap }: LeaderboardProps) => {
//   const [gapMode, setGapMode] = useState<"leader" | "interval">("interval");
//   const ESTIMATED_SPEED = 65; 

//   const sortedDrivers = useMemo(() => {
//     return drivers
//       .map((d) => {
//         const pos = positions[d.code];
        
//         // 🛠️ FIX: Instant OUT status. If they aren't in the position array, they are out.
//         const isOut = !pos;

//         // Ensure we always have a distance for sorting, even if out (push to bottom)
//         const dist = pos?.dist ?? (pos?.distance ?? (isOut ? -100000 : 0));

//         return { 
//           ...d, 
//           dist,
//           compound: pos?.compound || 'UNKNOWN',
//           lap: pos?.lap || 0,
//           // 🛠️ FIX: Instant PIT status using direct backend data
//           isPitting: pos?.in_pit || false,
//           isOut
//         };
//       })
//       .sort((a, b) => b.dist - a.dist); 
//   }, [drivers, positions]);

//   const getGapDisplay = (driver: typeof sortedDrivers[0], index: number) => {
//     if (driver.isOut) return <span className="text-red-600 font-black tracking-wider">OUT</span>;
//     if (index === 0) return gapMode === "leader" ? "Leader" : "Interval"; 

//     const leader = sortedDrivers[0];
//     const carAhead = sortedDrivers[index - 1];

//     if (gapMode === "leader") {
//       const lapDiff = leader.lap - driver.lap;
//       if (lapDiff > 0) return `+${lapDiff} LAP${lapDiff > 1 ? 'S' : ''}`;
      
//       const timeDiff = (leader.dist - driver.dist) / ESTIMATED_SPEED;
//       return `+${timeDiff.toFixed(3)}`;
//     } else {
//       const distDiff = carAhead.dist - driver.dist;
      
//       if (distDiff > 6000) {
//          const lapDiff = carAhead.lap - driver.lap;
//          if (lapDiff > 0) return `+${lapDiff} LAP${lapDiff > 1 ? 'S' : ''}`;
//       }

//       const timeDiff = distDiff / ESTIMATED_SPEED;
//       return `+${timeDiff.toFixed(3)}`;
//     }
//   };

//   return (
//     <div className="w-full h-full bg-[#0a0a0a] flex flex-col font-sans select-none">
      
//       <div className="w-full px-4 py-3 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between shrink-0">
//         <div className="flex flex-col">
//           <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">
//             Live Telemetry
//           </span>
//           <span className="text-sm font-black text-white tabular-nums">
//             LAP {Math.min(currentLap, totalLaps)} / {totalLaps}
//           </span>
//         </div>
//         <button
//           onClick={() => setGapMode((prev) => (prev === "leader" ? "interval" : "leader"))}
//           className="text-xs font-bold text-neutral-400 hover:text-white bg-neutral-800 px-2 py-1 rounded transition-colors uppercase"
//         >
//           {gapMode}
//         </button>
//       </div>

//       <div className="flex-1 w-full overflow-hidden flex flex-col justify-between">
//         {sortedDrivers.map((driver, index) => {
//           return (
//             <div
//               key={driver.code}
//               style={{ borderLeftColor: driver.isOut ? '#333' : driver.color }}
//               className={`flex-1 min-h-0 flex items-center w-full px-4 border-l-4 border-b border-neutral-800/30 transition-colors group ${driver.isOut ? 'opacity-40' : 'hover:bg-neutral-800'}`}
//             >
//               <span className="w-6 text-xs font-bold text-neutral-500 group-hover:text-neutral-400 transition-colors">
//                 {index + 1}
//               </span>
              
//               <span className="w-10 font-bold text-white tracking-wide text-xs">
//                 {driver.code}
//               </span>

//               <div className="w-10 flex items-center justify-center mr-2">
//                 {driver.isOut ? (
//                    <span className="text-[9px] font-bold text-neutral-600">--</span>
//                 ) : driver.isPitting ? (
//                   <span className="text-[9px] bg-yellow-500/20 text-yellow-500 px-1.5 py-0.5 rounded font-bold border border-yellow-500/30 animate-pulse">
//                     PIT
//                   </span>
//                 ) : (
//                   <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${getTyreBadgeClass(driver.compound)}`}>
//                     {driver.compound[0]}
//                   </span>
//                 )}
//               </div>

//               <span className={`ml-auto text-xs font-mono tabular-nums ${driver.isOut ? 'text-neutral-600' : 'text-neutral-300'}`}>
//                 {getGapDisplay(driver, index)}
//               </span>
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// };

// export default Leaderboard;


// import { useState, useMemo, useRef } from "react";

// interface Driver {
//   code: string;
//   color: string;
// }

// interface LeaderboardProps {
//   drivers: Driver[];
//   positions: any;
//   results: any;
//   totalLaps: number;
//   currentLap: number;
//   currentTime: number;
// }

// const getTyreBadgeClass = (compound: string): string => {
//   switch (compound?.toUpperCase()) {
//     case 'SOFT':         return 'bg-red-600/20 text-red-500 border border-red-500/30';
//     case 'MEDIUM':       return 'bg-yellow-600/20 text-yellow-500 border border-yellow-500/30';
//     case 'HARD':         return 'bg-white/10 text-neutral-300 border border-neutral-500/30';
//     case 'INTERMEDIATE': return 'bg-green-600/20 text-green-500 border border-green-500/30';
//     case 'WET':          return 'bg-blue-600/20 text-blue-500 border border-blue-500/30';
//     default:             return 'bg-neutral-800 text-neutral-500 border border-neutral-700/50';
//   }
// };

// // How many consecutive updates in_pit must be true before we show PIT badge.
// // Filters out single-frame flickers from the backend.
// const PIT_CONFIRM_THRESHOLD = 3;

// const Leaderboard = ({ drivers, positions, results, totalLaps, currentLap }: LeaderboardProps) => {
//   const [gapMode, setGapMode] = useState<"leader" | "interval">("interval");
//   const ESTIMATED_SPEED = 65;

//   // Tracks how many consecutive updates each driver has had in_pit === true.
//   // Resets to 0 the moment in_pit is false.
//   const pitCounterRef = useRef<Map<string, number>>(new Map());

//   const sortedDrivers = useMemo(() => {
//     return drivers
//       .map((d) => {
//         const pos = positions[d.code];
//         const isOut = !pos;
//         const dist = pos?.dist ?? (pos?.distance ?? (isOut ? -100000 : 0));

//         // --- Debounced PIT logic ---
//         const rawInPit = pos?.in_pit || false;
//         const prev = pitCounterRef.current.get(d.code) ?? 0;
//         const next = rawInPit ? prev + 1 : 0;
//         pitCounterRef.current.set(d.code, next);
//         // Only flag as pitting once the signal has been stable for enough updates
//         const isPitting = next >= PIT_CONFIRM_THRESHOLD;

//         return {
//           ...d,
//           dist,
//           compound: pos?.compound || 'UNKNOWN',
//           lap: pos?.lap || 0,
//           isPitting,
//           isOut,
//         };
//       })
//       .sort((a, b) => b.dist - a.dist);
//   }, [drivers, positions]);

//   const getGapDisplay = (driver: typeof sortedDrivers[0], index: number) => {
//     if (driver.isOut) return <span className="text-red-600 font-black tracking-wider">OUT</span>;
//     if (index === 0) return gapMode === "leader" ? "Leader" : "Interval";

//     const leader    = sortedDrivers[0];
//     const carAhead  = sortedDrivers[index - 1];

//     if (gapMode === "leader") {
//       const lapDiff = leader.lap - driver.lap;
//       if (lapDiff > 0) return `+${lapDiff} LAP${lapDiff > 1 ? 'S' : ''}`;
//       const timeDiff = (leader.dist - driver.dist) / ESTIMATED_SPEED;
//       return `+${timeDiff.toFixed(1)}`;
//     } else {
//       const distDiff = carAhead.dist - driver.dist;
//       if (distDiff > 6000) {
//         const lapDiff = carAhead.lap - driver.lap;
//         if (lapDiff > 0) return `+${lapDiff} LAP${lapDiff > 1 ? 'S' : ''}`;
//       }
//       const timeDiff = distDiff / ESTIMATED_SPEED;
//       return `+${timeDiff.toFixed(1)}`;
//     }
//   };

//   return (
//     <div className="w-full h-full bg-[#0a0a0a] flex flex-col font-sans select-none">

//       <div className="w-full px-4 py-3 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between shrink-0">
//         <div className="flex flex-col">
//           <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">
//             Live Telemetry
//           </span>
//           <span className="text-sm font-black text-white tabular-nums">
//             LAP {Math.min(currentLap, totalLaps)} / {totalLaps}
//           </span>
//         </div>
//         <button
//           onClick={() => setGapMode((prev) => (prev === "leader" ? "interval" : "leader"))}
//           className="text-xs font-bold text-neutral-400 hover:text-white bg-neutral-800 px-2 py-1 rounded transition-colors uppercase"
//         >
//           {gapMode}
//         </button>
//       </div>

//       <div className="flex-1 w-full overflow-hidden flex flex-col justify-between">
//         {sortedDrivers.map((driver, index) => (
//           <div
//             key={driver.code}
//             style={{ borderLeftColor: driver.isOut ? '#333' : driver.color }}
//             className={`flex-1 min-h-0 flex items-center w-full px-4 border-l-4 border-b border-neutral-800/30 transition-colors group ${driver.isOut ? 'opacity-40' : 'hover:bg-neutral-800'}`}
//           >
//             <span className="w-6 text-xs font-bold text-neutral-500 group-hover:text-neutral-400 transition-colors">
//               {index + 1}
//             </span>

//             <span className="w-10 font-bold text-white tracking-wide text-xs">
//               {driver.code}
//             </span>

//             <div className="w-10 flex items-center justify-center mr-2">
//               {driver.isOut ? (
//                 <span className="text-[9px] font-bold text-neutral-600">--</span>
//               ) : driver.isPitting ? (
//                 <span className="text-[9px] bg-yellow-500/20 text-yellow-500 px-1.5 py-0.5 rounded font-bold border border-yellow-500/30 animate-pulse">
//                   PIT
//                 </span>
//               ) : (
//                 <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${getTyreBadgeClass(driver.compound)}`}>
//                   {driver.compound[0]}
//                 </span>
//               )}
//             </div>

//             <span className={`ml-auto text-xs font-mono tabular-nums ${driver.isOut ? 'text-neutral-600' : 'text-neutral-300'}`}>
//               {getGapDisplay(driver, index)}
//             </span>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default Leaderboard;

// import { useState, useMemo, useRef } from "react";

// interface Driver {
//   code: string;
//   color: string;
// }

// interface CarPosition {
//   x: number;
//   y: number;
//   lap: number | null;
//   distance?: number;
//   dist?: number; 
//   compound?: string;
//   tyre_life?: number;
//   in_pit?: boolean;
// }

// interface DriverResult {
//   status: string;
//   final_position: number | null;
// }

// interface LeaderboardProps {
//   drivers: Driver[];
//   positions: Record<string, CarPosition>;
//   results?: Record<string, DriverResult>;
//   totalLaps: number;
//   currentLap: number;
//   currentTime: number;
// }

// const TYRE_COLORS: Record<string, string> = {
//   SOFT: "#DA291C",
//   MEDIUM: "#FFD12E",
//   HARD: "#F0F0F0",
//   INTERMEDIATE: "#43B02A",
//   WET: "#0067AD",
//   UNKNOWN: "#525252",
// };

// const Leaderboard = ({
//   drivers,
//   positions,
//   results = {},
//   totalLaps,
//   currentLap,
//   currentTime,
// }: LeaderboardProps) => {
//   const [gapMode, setGapMode] = useState<"leader" | "interval">("interval");
  
//   const prevLeaderRef = useRef<{ time: number; leaderDistance: number } | null>(null);
//   // 🛠️ FIX: Track every driver's historical distance to calculate their exact live speed
//   const prevDriverRef = useRef<Record<string, { time: number; distance: number }>>({});

//   const sortedDrivers = useMemo(() => {
//     return drivers
//       .map((d, index) => {
//         const pos = positions[d.code];
//         const isOut = !pos;
        
//         let distance = isOut ? -100000 - index : (pos.distance ?? pos.dist ?? 0);
//         if (isNaN(distance)) distance = 0;
        
//         const compound = (pos?.compound || "UNKNOWN").toUpperCase();

//         // 🛠️ FIX: Calculate individual driver speed (meters per second)
//         let speed = 60; 
//         const prev = prevDriverRef.current[d.code];
//         if (prev && currentTime > prev.time) {
//           const dt = currentTime - prev.time;
//           const dd = distance - prev.distance;
//           if (dt > 0) speed = Math.max(0, dd / dt);
//         }
//         prevDriverRef.current[d.code] = { time: currentTime, distance };

//         // 🛠️ FIX: Realism Check. Only show PIT if the backend says they are pitting AND 
//         // they are moving at pit-lane speeds (between 1 m/s and 25 m/s) on a lap > 1.
//         const isPitting = pos?.in_pit && speed > 1 && speed < 26 && currentLap > 1;

//         return { ...d, distance, compound, pos, isOut, isPitting };
//       })
//       .sort((a, b) => b.distance - a.distance);
//   }, [drivers, positions, currentTime, currentLap]);

//   const leaderDistance = sortedDrivers[0]?.distance ?? 0;

//   const leaderSpeed = useMemo(() => {
//     const prev = prevLeaderRef.current;
//     let speed = 60; 
    
//     if (prev && currentTime > prev.time) {
//       const dt = currentTime - prev.time;
//       const dd = leaderDistance - prev.leaderDistance;
//       if (dt > 0 && dd > 0) speed = dd / dt;
//     }
    
//     prevLeaderRef.current = { time: currentTime, leaderDistance };
//     return Math.max(speed, 5); 
//   }, [currentTime, leaderDistance]);

//   const getGapDisplay = (index: number) => {
//     const driver = sortedDrivers[index];
//     if (driver.isOut) return "OUT";
//     if (index === 0) return gapMode === "leader" ? "Leader" : "Interval";
    
//     const distDiff = gapMode === "leader"
//         ? leaderDistance - driver.distance
//         : sortedDrivers[index - 1].distance - driver.distance;
    
//     if (isNaN(distDiff) || distDiff < 0) return "+0.000";
    
//     if (distDiff > 4000) {
//       const leaderLap = sortedDrivers[0].pos?.lap || 0;
//       const driverLap = driver.pos?.lap || 0;
//       const lapDiff = leaderLap - driverLap;
//       if (lapDiff > 0) return `+${lapDiff} LAP${lapDiff > 1 ? 'S' : ''}`;
//     }

//     const timeDiff = distDiff / leaderSpeed;
//     if (timeDiff === 0 && currentLap <= 1) return "+0.000";
    
//     return `+${timeDiff.toFixed(3)}`;
//   };

//   return (
//     <div className="w-full h-full flex flex-col font-sans select-none bg-neutral-950">
      
//       <div className="px-5 py-4 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between shrink-0">
//         <div className="flex flex-col">
//           <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">
//             Live Telemetry
//           </span>
//           <span className="text-sm font-black text-white tabular-nums">
//             LAP {Math.min(currentLap, totalLaps)} / {totalLaps}
//           </span>
//         </div>
//         <button
//           onClick={() => setGapMode((prev) => (prev === "leader" ? "interval" : "leader"))}
//           className="text-xs font-bold text-neutral-400 hover:text-white bg-neutral-800 px-3 py-1.5 rounded transition-colors uppercase tracking-wider"
//         >
//           {gapMode}
//         </button>
//       </div>

//       <div className="flex-1 flex flex-col w-full overflow-hidden">
//         {sortedDrivers.map((driver, index) => {
//           const tyreColor = TYRE_COLORS[driver.compound] || TYRE_COLORS.UNKNOWN;
//           const tyreLabel = driver.compound !== "UNKNOWN" ? driver.compound[0] : "";
//           const tyreTextColor = (driver.compound === "HARD" || driver.compound === "MEDIUM" || driver.compound === "UNKNOWN") ? "#000" : "#fff";

//           return (
//             <div
//               key={driver.code}
//               style={{ borderLeftColor: driver.color }}
//               className={`flex-1 min-h-0 flex items-center px-4 border-l-4 border-b border-neutral-800/50 hover:bg-neutral-800/80 transition-colors ${
//                 driver.isOut ? "opacity-30 grayscale" : ""
//               }`}
//             >
//               <span className="w-6 text-sm font-bold text-neutral-500">{index + 1}</span>
//               <span className="font-bold text-white tracking-wide text-sm w-12">
//                 {driver.code}
//               </span>

//               <div
//                 className="w-[18px] h-[18px] rounded-full border border-black/50 mr-3 flex-shrink-0 shadow-sm flex items-center justify-center text-[10px] font-black"
//                 style={{ backgroundColor: tyreColor, color: tyreTextColor }}
//                 title={driver.compound}
//               >
//                 {tyreLabel}
//               </div>

//               <div className="flex gap-1 w-10">
//                 {/* 🛠️ FIX: Using our new highly accurate isPitting variable */}
//                 {driver.isPitting && !driver.isOut && (
//                   <span className="text-[10px] font-black text-yellow-400 bg-yellow-900/40 px-1.5 py-0.5 rounded border border-yellow-500/20">
//                     PIT
//                   </span>
//                 )}
//                 {driver.isOut && (
//                   <span className="text-[10px] font-black text-red-500 bg-red-900/40 px-1.5 py-0.5 rounded border border-red-500/20">
//                     OUT
//                   </span>
//                 )}
//               </div>

//               <span className={`ml-auto text-sm font-mono tabular-nums font-medium ${driver.isOut ? 'text-red-500 font-bold' : 'text-neutral-200'}`}>
//                 {getGapDisplay(index)}
//               </span>
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// };

// export default Leaderboard;

// import { useState, useMemo } from "react";

// interface Driver {
//   code: string;
//   color: string;
// }

// interface LeaderboardProps {
//   drivers: Driver[];
//   positions: any; 
//   results: any;
//   totalLaps: number;
//   currentLap: number;
//   currentTime: number;
// }

// const getTyreBadgeClass = (compound: string): string => {
//   switch (compound?.toUpperCase()) {
//     case 'SOFT': return 'bg-red-600/20 text-red-500 border border-red-500/30';
//     case 'MEDIUM': return 'bg-yellow-600/20 text-yellow-500 border border-yellow-500/30';
//     case 'HARD': return 'bg-white/10 text-neutral-300 border border-neutral-500/30';
//     case 'INTERMEDIATE': return 'bg-green-600/20 text-green-500 border border-green-500/30';
//     case 'WET': return 'bg-blue-600/20 text-blue-500 border border-blue-500/30';
//     default: return 'bg-neutral-800 text-neutral-500 border border-neutral-700/50';
//   }
// };

// const Leaderboard = ({ drivers, positions, results, totalLaps, currentLap }: LeaderboardProps) => {
//   const [gapMode, setGapMode] = useState<"leader" | "interval">("interval");
//   const ESTIMATED_SPEED = 65; 

//   const sortedDrivers = useMemo(() => {
//     return drivers
//       .map((d) => {
//         const pos = positions[d.code];
        
//         // 🛠️ FIX: Instant OUT status. If they aren't in the position array, they are out.
//         const isOut = !pos;

//         // Ensure we always have a distance for sorting, even if out (push to bottom)
//         const dist = pos?.dist ?? (pos?.distance ?? (isOut ? -100000 : 0));

//         return { 
//           ...d, 
//           dist,
//           compound: pos?.compound || 'UNKNOWN',
//           lap: pos?.lap || 0,
//           // 🛠️ FIX: Instant PIT status using direct backend data
//           isPitting: pos?.in_pit || false,
//           isOut
//         };
//       })
//       .sort((a, b) => b.dist - a.dist); 
//   }, [drivers, positions]);

//   const getGapDisplay = (driver: typeof sortedDrivers[0], index: number) => {
//     if (driver.isOut) return <span className="text-red-600 font-black tracking-wider">OUT</span>;
//     if (index === 0) return gapMode === "leader" ? "Leader" : "Interval"; 

//     const leader = sortedDrivers[0];
//     const carAhead = sortedDrivers[index - 1];

//     if (gapMode === "leader") {
//       const lapDiff = leader.lap - driver.lap;
//       if (lapDiff > 0) return `+${lapDiff} LAP${lapDiff > 1 ? 'S' : ''}`;
      
//       const timeDiff = (leader.dist - driver.dist) / ESTIMATED_SPEED;
//       return `+${timeDiff.toFixed(3)}`;
//     } else {
//       const distDiff = carAhead.dist - driver.dist;
      
//       if (distDiff > 6000) {
//          const lapDiff = carAhead.lap - driver.lap;
//          if (lapDiff > 0) return `+${lapDiff} LAP${lapDiff > 1 ? 'S' : ''}`;
//       }

//       const timeDiff = distDiff / ESTIMATED_SPEED;
//       return `+${timeDiff.toFixed(3)}`;
//     }
//   };

//   return (
//     <div className="w-full h-full bg-[#0a0a0a] flex flex-col font-sans select-none">
      
//       <div className="w-full px-4 py-3 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between shrink-0">
//         <div className="flex flex-col">
//           <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">
//             Live Telemetry
//           </span>
//           <span className="text-sm font-black text-white tabular-nums">
//             LAP {Math.min(currentLap, totalLaps)} / {totalLaps}
//           </span>
//         </div>
//         <button
//           onClick={() => setGapMode((prev) => (prev === "leader" ? "interval" : "leader"))}
//           className="text-xs font-bold text-neutral-400 hover:text-white bg-neutral-800 px-2 py-1 rounded transition-colors uppercase"
//         >
//           {gapMode}
//         </button>
//       </div>

//       <div className="flex-1 w-full overflow-hidden flex flex-col justify-between">
//         {sortedDrivers.map((driver, index) => {
//           return (
//             <div
//               key={driver.code}
//               style={{ borderLeftColor: driver.isOut ? '#333' : driver.color }}
//               className={`flex-1 min-h-0 flex items-center w-full px-4 border-l-4 border-b border-neutral-800/30 transition-colors group ${driver.isOut ? 'opacity-40' : 'hover:bg-neutral-800'}`}
//             >
//               <span className="w-6 text-xs font-bold text-neutral-500 group-hover:text-neutral-400 transition-colors">
//                 {index + 1}
//               </span>
              
//               <span className="w-10 font-bold text-white tracking-wide text-xs">
//                 {driver.code}
//               </span>

//               <div className="w-10 flex items-center justify-center mr-2">
//                 {driver.isOut ? (
//                    <span className="text-[9px] font-bold text-neutral-600">--</span>
//                 ) : driver.isPitting ? (
//                   <span className="text-[9px] bg-yellow-500/20 text-yellow-500 px-1.5 py-0.5 rounded font-bold border border-yellow-500/30 animate-pulse">
//                     PIT
//                   </span>
//                 ) : (
//                   <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${getTyreBadgeClass(driver.compound)}`}>
//                     {driver.compound[0]}
//                   </span>
//                 )}
//               </div>

//               <span className={`ml-auto text-xs font-mono tabular-nums ${driver.isOut ? 'text-neutral-600' : 'text-neutral-300'}`}>
//                 {getGapDisplay(driver, index)}
//               </span>
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// };

// export default Leaderboard;


import { useState, useMemo, useRef } from "react";

interface Driver {
  code: string;
  color: string;
}

interface LeaderboardProps {
  drivers: Driver[];
  positions: any;
  results: any;
  totalLaps: number;
  currentLap: number;
  currentTime: number;
  onDriverSelect: (code: string) => void; // 🛠️ Explicitly added
  selectedDriver: string | null;         // 🛠️ Track active selection
}

const getTyreBadgeClass = (compound: string): string => {
  switch (compound?.toUpperCase()) {
    case 'SOFT':         return 'bg-red-600/20 text-red-500 border border-red-500/30';
    case 'MEDIUM':       return 'bg-yellow-600/20 text-yellow-500 border border-yellow-500/30';
    case 'HARD':         return 'bg-white/10 text-neutral-300 border border-neutral-500/30';
    case 'INTERMEDIATE': return 'bg-green-600/20 text-green-500 border border-green-500/30';
    case 'WET':          return 'bg-blue-600/20 text-blue-500 border border-blue-500/30';
    default:             return 'bg-neutral-800 text-neutral-500 border border-neutral-700/50';
  }
};

// How many consecutive updates in_pit must be true before we show PIT badge.
// Filters out single-frame flickers from the backend.
const PIT_CONFIRM_THRESHOLD = 3;

// If a car's dist jumped more than this many meters since the last render,
// it's moving at racing speed — clear the pit flag even if backend says in_pit=true.
// At 5x replay speed, a car at ~65 m/s travels ~100m per 300ms frame.
// Pit lane cars do ~22 m/s, so ~7m per frame. 45m is a safe threshold between the two.
const RACING_SPEED_DIST_THRESHOLD = 45;

const Leaderboard = ({ drivers, positions, results, totalLaps, currentLap, onDriverSelect, selectedDriver }: LeaderboardProps) => {
  const [gapMode, setGapMode] = useState<"leader" | "interval">("interval");
  const ESTIMATED_SPEED = 65;

  // Tracks consecutive in_pit=true frame count per driver (for entry debounce)
  const pitCounterRef = useRef<Map<string, number>>(new Map());
  // Tracks each driver's dist from the previous render (for exit speed check)
  const prevDistRef   = useRef<Map<string, number>>(new Map());

  const sortedDrivers = useMemo(() => {
    return drivers
      .map((d) => {
        const pos   = positions[d.code];
        const isOut = !pos;
        const dist  = pos?.dist ?? (pos?.distance ?? (isOut ? -100000 : 0));

        

        // ── Speed-based exit override ──────────────────────────────────────
        // If the car moved more than RACING_SPEED_DIST_THRESHOLD meters since
        // the last render, it's back at racing speed → not in the pit regardless
        // of what the backend flag says. This fixes stale in_pit after pit exit.
        const prevDist    = prevDistRef.current.get(d.code) ?? dist;
        const distDelta   = dist - prevDist;
        prevDistRef.current.set(d.code, dist);
        const isMovingFast = distDelta > RACING_SPEED_DIST_THRESHOLD;

        // ── Entry debounce ─────────────────────────────────────────────────
        // Require 3 consecutive in_pit=true frames before showing PIT badge.
        // If the car is moving fast, treat in_pit as false immediately.
        const rawInPit = (pos?.in_pit || false) && !isMovingFast;
        const prev     = pitCounterRef.current.get(d.code) ?? 0;
        const next     = rawInPit ? prev + 1 : 0;
        pitCounterRef.current.set(d.code, next);
        const isPitting = next >= PIT_CONFIRM_THRESHOLD;

        return {
          ...d,
          dist,
          compound: pos?.compound || 'UNKNOWN',
          lap: pos?.lap || 0,
          isPitting,
          isOut,
        };
      })
      .sort((a, b) => b.dist - a.dist);
  }, [drivers, positions]);

  const getGapDisplay = (driver: typeof sortedDrivers[0], index: number) => {
    if (driver.isOut) return <span className="text-red-600 font-black tracking-wider">OUT</span>;
    if (index === 0) return gapMode === "leader" ? "Leader" : "Interval";

    const leader    = sortedDrivers[0];
    const carAhead  = sortedDrivers[index - 1];

    if (gapMode === "leader") {
      const lapDiff = leader.lap - driver.lap;
      if (lapDiff > 0) return `+${lapDiff} LAP${lapDiff > 1 ? 'S' : ''}`;
      const timeDiff = (leader.dist - driver.dist) / ESTIMATED_SPEED;
      return `+${timeDiff.toFixed(1)}`;
    } else {
      const distDiff = carAhead.dist - driver.dist;
      if (distDiff > 6000) {
        const lapDiff = carAhead.lap - driver.lap;
        if (lapDiff > 0) return `+${lapDiff} LAP${lapDiff > 1 ? 'S' : ''}`;
      }
      const timeDiff = distDiff / ESTIMATED_SPEED;
      return `+${timeDiff.toFixed(1)}`;
    }
  };

  // return (
  //   <div className="w-full h-full bg-[#0a0a0a] flex flex-col font-sans select-none">

  //     <div className="w-full px-4 py-3 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between shrink-0">
  //       <div className="flex flex-col">
  //         <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">
  //           Live Telemetry
  //         </span>
  //         <span className="text-sm font-black text-white tabular-nums">
  //           LAP {Math.min(currentLap, totalLaps)} / {totalLaps}
  //         </span>
  //       </div>
  //       <button
  //         onClick={() => setGapMode((prev) => (prev === "leader" ? "interval" : "leader"))}
  //         className="text-xs font-bold text-neutral-400 hover:text-white bg-neutral-800 px-2 py-1 rounded transition-colors uppercase"
  //       >
  //         {gapMode}
  //       </button>
  //     </div>

  //     <div className="flex-1 w-full overflow-hidden flex flex-col justify-between">
  //       {sortedDrivers.map((driver, index) => (
  //         <div
  //           key={driver.code}
  //           style={{ borderLeftColor: driver.isOut ? '#333' : driver.color }}
  //           className={`flex-1 min-h-0 flex items-center w-full px-4 border-l-4 border-b border-neutral-800/30 transition-colors group ${driver.isOut ? 'opacity-40' : 'hover:bg-neutral-800'}`}
  //         >
  //           <span className="w-6 text-xs font-bold text-neutral-500 group-hover:text-neutral-400 transition-colors">
  //             {index + 1}
  //           </span>

  //           <span className="w-10 font-bold text-white tracking-wide text-xs">
  //             {driver.code}
  //           </span>

  //           <div className="w-10 flex items-center justify-center mr-2">
  //             {driver.isOut ? (
  //               <span className="text-[9px] font-bold text-neutral-600">--</span>
  //             ) : driver.isPitting ? (
  //               <span className="text-[9px] bg-yellow-500/20 text-yellow-500 px-1.5 py-0.5 rounded font-bold border border-yellow-500/30 animate-pulse">
  //                 PIT
  //               </span>
  //             ) : (
  //               <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${getTyreBadgeClass(driver.compound)}`}>
  //                 {driver.compound[0]}
  //               </span>
  //             )}
  //           </div>

  //           <span className={`ml-auto text-xs font-mono tabular-nums ${driver.isOut ? 'text-neutral-600' : 'text-neutral-300'}`}>
  //             {getGapDisplay(driver, index)}
  //           </span>
  //         </div>
  //       ))}
  //     </div>
  //   </div>
  // );

  return (
    <div className="w-full h-full bg-[#0a0a0a] flex flex-col font-sans select-none">

      <div className="w-full px-4 py-3 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between shrink-0">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">
            Live Telemetry
          </span>
          <span className="text-sm font-black text-white tabular-nums">
            LAP {Math.min(currentLap, totalLaps)} / {totalLaps}
          </span>
        </div>
        <button
          onClick={() => setGapMode((prev) => (prev === "leader" ? "interval" : "leader"))}
          className="text-xs font-bold text-neutral-400 hover:text-white bg-neutral-800 px-2 py-1 rounded transition-colors uppercase"
        >
          {gapMode}
        </button>
      </div>

      <div className="flex-1 w-full overflow-hidden flex flex-col justify-between">
        {sortedDrivers.map((driver, index) => {
          // 🛠️ CHECK: Is this driver the one currently selected?
          const isSelected = (selectedDriver === driver.code);
          
          return (
            <div
              key={driver.code}
              // 🛠️ CLICK HANDLER: Trigger driver selection
              onClick={() => onDriverSelect(driver.code)}
              style={{ borderLeftColor: driver.isOut ? '#333' : driver.color }}
              className={`flex-1 min-h-0 flex items-center w-full px-4 border-l-4 border-b border-neutral-800/30 transition-colors cursor-pointer group 
                ${driver.isOut ? 'opacity-40' : 'hover:bg-neutral-800'}
                ${isSelected ? 'bg-neutral-800/50 ring-1 ring-white/10' : ''}`}
            >
              <span className="w-6 text-xs font-bold text-neutral-500 group-hover:text-neutral-400 transition-colors">
                {index + 1}
              </span>

              <span className="w-10 font-bold text-white tracking-wide text-xs">
                {driver.code}
              </span>

              <div className="w-10 flex items-center justify-center mr-2">
                {driver.isOut ? (
                  <span className="text-[9px] font-bold text-neutral-600">--</span>
                ) : driver.isPitting ? (
                  <span className="text-[9px] bg-yellow-500/20 text-yellow-500 px-1.5 py-0.5 rounded font-bold border border-yellow-500/30 animate-pulse">
                    PIT
                  </span>
                ) : (
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${getTyreBadgeClass(driver.compound)}`}>
                    {driver.compound[0]}
                  </span>
                )}
              </div>

              <span className={`ml-auto text-xs font-mono tabular-nums ${driver.isOut ? 'text-neutral-600' : 'text-neutral-300'}`}>
                {getGapDisplay(driver, index)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Leaderboard;

// import { useState, useMemo, useRef } from "react";

// interface Driver {
//   code: string;
//   color: string;
// }

// interface LeaderboardProps {
//   drivers: Driver[];
//   positions: any;
//   results: any;
//   totalLaps: number;
//   currentLap: number;
//   currentTime: number;
//   onDriverSelect: (code: string) => void; // 🛠️ Explicitly added
//   selectedDriver: string | null;         // 🛠️ Track active selection
// }

// const getTyreBadgeClass = (compound: string): string => {
//   switch (compound?.toUpperCase()) {
//     case 'SOFT':         return 'bg-red-600/20 text-red-500 border border-red-500/30';
//     case 'MEDIUM':       return 'bg-yellow-600/20 text-yellow-500 border border-yellow-500/30';
//     case 'HARD':         return 'bg-white/10 text-neutral-300 border border-neutral-500/30';
//     case 'INTERMEDIATE': return 'bg-green-600/20 text-green-500 border border-green-500/30';
//     case 'WET':          return 'bg-blue-600/20 text-blue-500 border border-blue-500/30';
//     default:             return 'bg-neutral-800 text-neutral-500 border border-neutral-700/50';
//   }
// };

// const PIT_CONFIRM_THRESHOLD = 3;
// const RACING_SPEED_DIST_THRESHOLD = 45;

// const Leaderboard = ({ drivers, positions, totalLaps, currentLap, onDriverSelect, selectedDriver }: LeaderboardProps) => {
//   const [gapMode, setGapMode] = useState<"leader" | "interval">("interval");
//   const ESTIMATED_SPEED = 65;

//   const pitCounterRef = useRef<Map<string, number>>(new Map());
//   const prevDistRef   = useRef<Map<string, number>>(new Map());

//   const sortedDrivers = useMemo(() => {
//     return drivers
//       .map((d) => {
//         const pos   = positions[d.code];
//         const isOut = !pos;
//         const dist  = pos?.dist ?? (pos?.distance ?? (isOut ? -100000 : 0));

//         const prevDist    = prevDistRef.current.get(d.code) ?? dist;
//         const distDelta   = dist - prevDist;
//         prevDistRef.current.set(d.code, dist);
//         const isMovingFast = distDelta > RACING_SPEED_DIST_THRESHOLD;

//         const rawInPit = (pos?.in_pit || false) && !isMovingFast;
//         const prev     = pitCounterRef.current.get(d.code) ?? 0;
//         const next     = rawInPit ? prev + 1 : 0;
//         pitCounterRef.current.set(d.code, next);
//         const isPitting = next >= PIT_CONFIRM_THRESHOLD;

//         return { ...d, dist, compound: pos?.compound || 'UNKNOWN', lap: pos?.lap || 0, isPitting, isOut };
//       })
//       .sort((a, b) => b.dist - a.dist);
//   }, [drivers, positions]);

//   return (
//     <div className="w-full h-full bg-[#0a0a0a] flex flex-col font-sans select-none">
//       <div className="w-full px-4 py-3 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between shrink-0">
//         <span className="text-sm font-black text-white">LAP {Math.min(currentLap, totalLaps)} / {totalLaps}</span>
//       </div>

//       <div className="flex-1 w-full overflow-hidden flex flex-col">
//         {sortedDrivers.map((driver, index) => {
//           // 🛠️ Highlight row if selected
//           const isSelected = selectedDriver === driver.code;
          
//           return (
//             <div
//               key={driver.code}
//               onClick={() => onDriverSelect(driver.code)} // 🛠️ Trigger selection
//               style={{ borderLeftColor: driver.isOut ? '#333' : driver.color }}
//               className={`flex-1 min-h-0 flex items-center w-full px-4 border-l-4 border-b border-neutral-800/30 transition-all cursor-pointer 
//                 ${isSelected ? 'bg-neutral-800 ring-1 ring-white/20' : 'hover:bg-neutral-800'} 
//                 ${driver.isOut ? 'opacity-40' : ''}`}
//             >
//               <span className="w-6 text-xs font-bold text-neutral-500">{index + 1}</span>
//               <span className="w-10 font-bold text-white text-xs">{driver.code}</span>
//               <div className="w-10 flex items-center justify-center mr-2">
//                 {driver.isPitting ? <span className="text-[9px] bg-yellow-500/20 text-yellow-500 px-1.5 py-0.5 rounded font-bold border border-yellow-500/30">PIT</span> : 
//                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${getTyreBadgeClass(driver.compound)}`}>{driver.compound[0]}</span>}
//               </div>
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// };

// export default Leaderboard;