// const mockDrivers = [
//   { pos: 1, name: "VER", team: "Red Bull", color: "border-blue-600", gap: "Interval" },
//   { pos: 2, name: "PER", team: "Red Bull", color: "border-blue-600", gap: "+1.345" },
//   { pos: 3, name: "LEC", team: "Ferrari", color: "border-red-600", gap: "+4.102" },
//   { pos: 4, name: "SAI", team: "Ferrari", color: "border-red-600", gap: "+5.891" },
//   { pos: 5, name: "NOR", team: "McLaren", color: "border-orange-500", gap: "+7.220" },
//   { pos: 6, name: "PIA", team: "McLaren", color: "border-orange-500", gap: "+10.054" },
//   { pos: 7, name: "HAM", team: "Mercedes", color: "border-teal-400", gap: "+11.456" },
//   { pos: 8, name: "RUS", team: "Mercedes", color: "border-teal-400", gap: "+14.890" },
//   { pos: 9, name: "ALO", team: "Aston Martin", color: "border-emerald-600", gap: "+16.231" },
//   { pos: 10, name: "STR", team: "Aston Martin", color: "border-emerald-600", gap: "+18.995" },
//   { pos: 11, name: "GAS", team: "Alpine", color: "border-pink-500", gap: "+20.123" },
//   { pos: 12, name: "OCO", team: "Alpine", color: "border-pink-500", gap: "+22.456" },
//   { pos: 13, name: "ALB", team: "Williams", color: "border-blue-400", gap: "+25.789" },
//   { pos: 14, name: "SAR", team: "Williams", color: "border-blue-400", gap: "+28.102" },
//   { pos: 15, name: "TSU", team: "AlphaTauri", color: "border-blue-800", gap: "+30.455" },
//   { pos: 16, name: "RIC", team: "AlphaTauri", color: "border-blue-800", gap: "+32.777" },
//   { pos: 17, name: "BOT", team: "Alfa Romeo", color: "border-red-800", gap: "+35.111" },
//   { pos: 18, name: "ZHO", team: "Alfa Romeo", color: "border-red-800", gap: "+38.999" },
//   { pos: 19, name: "MAG", team: "Haas", color: "border-gray-100", gap: "+41.222" },
//   { pos: 20, name: "HUL", team: "Haas", color: "border-gray-100", gap: "+45.678" },
// ];

// const Leaderboard = () => {
//   return (
//     // Note: I changed border-r to border-l since it will sit on the right side now
//     <div className="w-72 h-full bg-neutral-900/80 border-l border-neutral-800 flex flex-col">
//       {/* Header */}
//       <div className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between">
//         <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
//           Pos / Driver
//         </span>
//         <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
//           Gap
//         </span>
//       </div>

//       {/* Driver List */}
//       <div className="flex-1 overflow-y-auto custom-scrollbar pb-10">
//         {mockDrivers.map((driver) => (
//           <div
//             key={driver.name}
//             className={`flex items-center px-4 py-2 border-l-4 ${driver.color} border-b border-neutral-800/50 hover:bg-neutral-800 transition-colors`}
//           >
//             <span className="w-6 text-sm font-bold text-neutral-500">
//               {driver.pos}
//             </span>
//             <span className="font-bold text-white tracking-wide text-sm">
//               {driver.name}
//             </span>
//             <span className="ml-auto text-sm text-neutral-300 font-mono tabular-nums">
//               {driver.gap}
//             </span>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default Leaderboard;

// src/components/Leaderboard.tsx

// Define the shape of your driver data
// interface LeaderboardProps {
//   drivers: { id: string; color: string; team: string }[];
//   positions: number[]; // Progress values (0.0 to 1.0)
// }

// const Leaderboard = ({ drivers, positions }: LeaderboardProps) => {
  
//   // Combine drivers with their current progress and sort them
//   const sortedDrivers = drivers
//     .map((d, i) => ({ ...d, progress: positions[i] || 0 }))
//     .sort((a, b) => b.progress - a.progress); // High progress = 1st place

//   return (
//     <div className="w-72 h-full bg-neutral-950 border-l border-neutral-800 flex flex-col">
//       {/* Header */}
//       <div className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between">
//         <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
//           Leaderboard
//         </span>
//       </div>

//       {/* Driver List */}
//       <div className="flex-1 overflow-y-auto pb-10">
//         {sortedDrivers.map((driver, index) => (
//           <div
//             key={driver.id}
//             className="flex items-center px-4 py-2 border-l-4 border-l-blue-600 border-b border-neutral-800/50 hover:bg-neutral-800 transition-colors"
//           >
//             <span className="w-6 text-sm font-bold text-neutral-500">
//               {index + 1}
//             </span>
//             <span className="font-bold text-white tracking-wide text-sm">
//               {driver.id}
//             </span>
//             <span className="ml-auto text-sm text-neutral-300 font-mono tabular-nums">
//               {/* You can calculate gap here if needed */}
//               {(1 - driver.progress * 100).toFixed(2)}s
//             </span>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default Leaderboard;

// import { useState } from "react";

// interface LeaderboardProps {
//   drivers: { id: string; color: string; team: string }[];
//   positions: number[]; // Progress values (0.0 to 1.0)
//   totalLaps: number;   // <-- Add this new prop
//   currentLap: number;
// }

// const Leaderboard = ({ drivers, positions }: LeaderboardProps) => {
//   // Toggle state: 'leader' (gap to 1st) or 'interval' (gap to car ahead)
//   const [gapMode, setGapMode] = useState<"leader" | "interval">("interval");

//   // Combine drivers with their current progress and sort them
//   const sortedDrivers = drivers
//     .map((d, i) => ({ ...d, progress: positions[i] || 0 }))
//     .sort((a, b) => b.progress - a.progress); 

//   // To simulate F1 timing from our 0.0-1.0 progress data, 
//   // we assume a standard lap time (e.g., 90 seconds)
//   const LAP_TIME_SECONDS = 90; 
//   const leaderProgress = sortedDrivers[0]?.progress || 0;

//   const getGapDisplay = (driverProgress: number, index: number) => {
//     if (index === 0) return "Interval"; // 1st place 

//     let timeDiff = 0;
//     if (gapMode === "leader") {
//       timeDiff = (leaderProgress - driverProgress) * LAP_TIME_SECONDS;
//     } else {
//       const carAheadProgress = sortedDrivers[index - 1].progress;
//       timeDiff = (carAheadProgress - driverProgress) * LAP_TIME_SECONDS;
//     }

//     return `+${timeDiff.toFixed(3)}`; // Format to 3 decimal places like F1
//   };

//   return (
//     <div className="w-72 h-full bg-neutral-950 border-l border-neutral-800 flex flex-col">
      
//       {/* Header with Toggle */}
//       <div className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between">
//         <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
//           Leaderboard
//         </span>
        
//         {/* Toggle Button */}
//         <button 
//           onClick={() => setGapMode(prev => prev === "leader" ? "interval" : "leader")}
//           className="text-xs font-bold text-white bg-neutral-800 hover:bg-neutral-700 px-2 py-1 rounded transition-colors uppercase"
//         >
//           {gapMode}
//         </button>
//       </div>

//       {/* Driver List */}
//       <div className="flex-1 overflow-y-auto pb-10">
//         {sortedDrivers.map((driver, index) => (
//           <div
//             key={driver.id}
//             style={{ borderLeftColor: driver.color }} // Dynamic team color bar
//             className="flex items-center px-4 py-1.5 border-l-4 border-b border-neutral-800/50 hover:bg-neutral-800 transition-colors"
//           >
//             <span className="w-6 text-sm font-bold text-neutral-500">
//               {index + 1}
//             </span>
//             <span className="font-bold text-white tracking-wide text-sm">
//               {driver.id}
//             </span>
//             <span className="ml-auto text-sm text-neutral-300 font-mono tabular-nums">
//               {getGapDisplay(driver.progress, index)}
//             </span>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default Leaderboard;

// import { useState } from "react";

// interface LeaderboardProps {
//   drivers: { id: string; color: string; team: string }[];
//   positions: number[]; // Progress values (0.0 to 1.0)
//   totalLaps: number;   // Dynamic lap total from FastF1
//   currentLap: number;  // Calculated active lap
// }

// const Leaderboard = ({ drivers, positions, totalLaps, currentLap }: LeaderboardProps) => {
//   // Toggle state: 'leader' (gap to 1st) or 'interval' (gap to car ahead)
//   const [gapMode, setGapMode] = useState<"leader" | "interval">("interval");

//   // Combine drivers with their current progress and sort them
//   const sortedDrivers = drivers
//     .map((d, i) => ({ ...d, progress: positions[i] || 0 }))
//     .sort((a, b) => b.progress - a.progress); 

//   // To simulate F1 timing from our 0.0-1.0 progress data, 
//   // we assume a standard lap time (e.g., 90 seconds)
//   const LAP_TIME_SECONDS = 90; 
//   const leaderProgress = sortedDrivers[0]?.progress || 0;

//   const getGapDisplay = (driverProgress: number, index: number) => {
//     if (index === 0) return "Interval"; // 1st place 

//     let timeDiff = 0;
//     if (gapMode === "leader") {
//       timeDiff = (leaderProgress - driverProgress) * LAP_TIME_SECONDS;
//     } else {
//       const carAheadProgress = sortedDrivers[index - 1].progress;
//       timeDiff = (carAheadProgress - driverProgress) * LAP_TIME_SECONDS;
//     }

//     return `+${timeDiff.toFixed(3)}`; // Format to 3 decimal places like F1
//   };

//   return (
//     <div className="w-72 h-full bg-neutral-950 border-l border-neutral-800 flex flex-col">
      
//       {/* Dynamic F1 Broadcast Style Header */}
//       <div className="px-4 py-3 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between">
//         <div className="flex flex-col">
//           <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">
//             Live Telemetry
//           </span>
//           <span className="text-sm font-black text-white tabular-nums">
//             LAP {Math.min(currentLap, totalLaps)} / {totalLaps}
//           </span>
//         </div>
        
//         {/* Toggle Button */}
//         <button 
//           onClick={() => setGapMode(prev => prev === "leader" ? "interval" : "leader")}
//           className="text-xs font-bold text-neutral-400 hover:text-white bg-neutral-800 px-2 py-1 rounded transition-colors uppercase"
//         >
//           {gapMode}
//         </button>
//       </div>

//       {/* Driver List */}
//       <div className="flex-1 overflow-y-auto pb-10">
//         {sortedDrivers.map((driver, index) => (
//           <div
//             key={driver.id}
//             style={{ borderLeftColor: driver.color }} // Dynamic team color bar
//             className="flex items-center px-4 py-1.5 border-l-4 border-b border-neutral-800/50 hover:bg-neutral-800 transition-colors"
//           >
//             <span className="w-6 text-sm font-bold text-neutral-500">
//               {index + 1}
//             </span>
//             <span className="font-bold text-white tracking-wide text-sm">
//               {driver.id}
//             </span>
//             <span className="ml-auto text-sm text-neutral-300 font-mono tabular-nums">
//               {getGapDisplay(driver.progress, index)}
//             </span>
//           </div>
//         ))}
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

// interface CarPosition {
//   x: number;
//   y: number;
//   lap: number | null;
// }

// interface TrackPoint {
//   x: number;
//   y: number;
// }

// interface LeaderboardProps {
//   drivers: Driver[];
//   positions: Record<string, CarPosition>; // keyed by driver code, real x/y + lap
//   trackOutline: TrackPoint[]; // ordered start->finish, from data.json
//   totalLaps: number;
//   currentLap: number;
// }

// // Finds the closest point on the ordered track_outline to a given x/y,
// // and returns its position as a 0.0-1.0 fraction around the lap.
// // This REPLACES the old pre-baked progress float — we're reconstructing
// // "how far around the lap" a car is from its real coordinates.
// const nearestOutlineProgress = (x: number, y: number, outline: TrackPoint[]): number => {
//   let bestIndex = 0;
//   let bestDist = Infinity;
//   for (let i = 0; i < outline.length; i++) {
//     const dx = outline[i].x - x;
//     const dy = outline[i].y - y;
//     const dist = dx * dx + dy * dy;
//     if (dist < bestDist) {
//       bestDist = dist;
//       bestIndex = i;
//     }
//   }
//   return bestIndex / (outline.length - 1);
// };

// const Leaderboard = ({ drivers, positions, trackOutline, totalLaps, currentLap }: LeaderboardProps) => {
//   const [gapMode, setGapMode] = useState<"leader" | "interval">("interval");

//   // Assumed constant lap time for converting distance-gaps into time-gaps.
//   // This is the same approximation your original design used — it won't be
//   // perfectly accurate (real lap times vary), but it's a reasonable stand-in
//   // without full sector-time modeling.
//   const LAP_TIME_SECONDS = 90;

//   const sortedDrivers = useMemo(() => {
//     return drivers
//       .map((d) => {
//         const pos = positions[d.code];
//         if (!pos || pos.lap == null) return null; // car not on track this frame

//         const lapProgress = nearestOutlineProgress(pos.x, pos.y, trackOutline);
//         // Absolute progress = completed laps + fractional position in current lap,
//         // mirroring the AbsoluteProgress formula from your original design doc.
//         const absoluteProgress = (pos.lap - 1) + lapProgress;

//         return { ...d, absoluteProgress };
//       })
//       .filter((d): d is Driver & { absoluteProgress: number } => d !== null)
//       .sort((a, b) => b.absoluteProgress - a.absoluteProgress);
//   }, [drivers, positions, trackOutline]);

//   const leaderProgress = sortedDrivers[0]?.absoluteProgress || 0;

//   const getGapDisplay = (driverProgress: number, index: number) => {
//     if (index === 0) return "Interval"; // 1st place shows no gap

//     let progressDiff = 0;
//     if (gapMode === "leader") {
//       progressDiff = leaderProgress - driverProgress;
//     } else {
//       const carAheadProgress = sortedDrivers[index - 1].absoluteProgress;
//       progressDiff = carAheadProgress - driverProgress;
//     }
//     const timeDiff = progressDiff * LAP_TIME_SECONDS;
//     return `+${timeDiff.toFixed(3)}`;
//   };

//   return (
//     <div className="w-72 h-full bg-neutral-950 border-l border-neutral-800 flex flex-col">
//       {/* Dynamic F1 Broadcast Style Header */}
//       <div className="px-4 py-3 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between">
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

//       {/* Driver List */}
//       <div className="flex-1 overflow-y-auto pb-10">
//         {sortedDrivers.map((driver, index) => (
//           <div
//             key={driver.code}
//             style={{ borderLeftColor: driver.color }}
//             className="flex items-center px-4 py-1.5 border-l-4 border-b border-neutral-800/50 hover:bg-neutral-800 transition-colors"
//           >
//             <span className="w-6 text-sm font-bold text-neutral-500">{index + 1}</span>
//             <span className="font-bold text-white tracking-wide text-sm">{driver.code}</span>
//             <span className="ml-auto text-sm text-neutral-300 font-mono tabular-nums">
//               {getGapDisplay(driver.absoluteProgress, index)}
//             </span>
//           </div>
//         ))}
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

// interface CarPosition {
//   x: number;
//   y: number;
//   lap: number | null;
//   dist: number;      // NEW: Cumulative distance from Python
//   compound: string;  // NEW: Tyre compound from Python
// }

// // trackOutline is no longer needed for sorting
// interface LeaderboardProps {
//   drivers: Driver[];
//   positions: Record<string, CarPosition>; // keyed by driver code
//   totalLaps: number;
//   currentLap: number;
// }

// // Helper to handle standard F1 tyre colouring schemes
// const getTyreBadgeClass = (compound: string): string => {
//   switch (compound.toUpperCase()) {
//     case 'SOFT':
//       return 'bg-red-600/20 text-red-500 border border-red-500/30';
//     case 'MEDIUM':
//       return 'bg-yellow-600/20 text-yellow-500 border border-yellow-500/30';
//     case 'HARD':
//       return 'bg-white/10 text-neutral-300 border border-neutral-500/30';
//     case 'INTERMEDIATE':
//       return 'bg-green-600/20 text-green-500 border border-green-500/30';
//     case 'WET':
//       return 'bg-blue-600/20 text-blue-500 border border-blue-500/30';
//     default:
//       return 'bg-neutral-800 text-neutral-500 border border-neutral-700/50';
//   }
// };

// const Leaderboard = ({ drivers, positions, totalLaps, currentLap }: LeaderboardProps) => {
//   const [gapMode, setGapMode] = useState<"leader" | "interval">("interval");

//   // Approximate speed in units per second. 
//   // For maximum accuracy later, this can be dynamically calculated by comparing 
//   // dist delta across frames, but a static racing velocity works well for standardizing the visual gap.
//   const ESTIMATED_SPEED = 75; 

//   const sortedDrivers = useMemo(() => {
//     return drivers
//       .map((d) => {
//         const pos = positions[d.code];
//         // Ensure car is on track and has valid distance data this frame
//         if (!pos || pos.lap == null || isNaN(pos.dist)) return null; 

//         return { 
//           ...d, 
//           dist: pos.dist,
//           compound: pos.compound || 'UNKNOWN',
//           lap: pos.lap
//         };
//       })
//       .filter((d): d is Driver & { dist: number; compound: string; lap: number } => d !== null)
//       .sort((a, b) => b.dist - a.dist); // Strict linear ordering by Python odometer
//   }, [drivers, positions]);

//   const leaderDist = sortedDrivers[0]?.dist || 0;

//   const getGapDisplay = (driverDist: number, index: number) => {
//     if (index === 0) return "Interval"; // 1st place shows no gap

//     let distDiff = 0;
//     if (gapMode === "leader") {
//       distDiff = leaderDist - driverDist;
//     } else {
//       const carAheadDist = sortedDrivers[index - 1].dist;
//       distDiff = carAheadDist - driverDist;
//     }
    
//     // Time gap = distance delta / speed of the trailing car to cross that gap
//     const timeDiff = distDiff / ESTIMATED_SPEED;
//     return `+${timeDiff.toFixed(3)}`;
//   };

//   return (
//     <div className="w-72 h-full bg-neutral-950 border-l border-neutral-800 flex flex-col font-sans">
//       {/* Dynamic F1 Broadcast Style Header */}
//       <div className="px-4 py-3 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between">
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

//       {/* Driver List */}
//       <div className="flex-1 w-full overflow-y-hidden flex flex-col justify-between">
//         {sortedDrivers.map((driver, index) => {
//           const isPitting = driver.compound.toUpperCase() === 'UNKNOWN' || driver.compound === '';

//           return (
//             <div
//               key={driver.code}
//               style={{ borderLeftColor: driver.color }}
//               className="flex items-center w-full px-4 py-1 border-l-4 border-b border-neutral-800/50 hover:bg-neutral-800 transition-colors group"
//     >
//               {/* Position */}
//               <span className="w-6 text-sm font-bold text-neutral-500 group-hover:text-neutral-400 transition-colors">
//                 {index + 1}
//               </span>
              
//               {/* Driver Code */}
//               <span className="w-10 font-bold text-white tracking-wide text-sm">
//                 {driver.code}
//               </span>

//               {/* Tyre Compound / Pit Badge */}
//               <div className="w-10 flex items-center justify-center mr-2">
//                 {isPitting ? (
//                   <span className="text-[9px] bg-red-600/20 text-red-400 px-1.5 py-0.5 rounded font-bold animate-pulse border border-red-500/30">
//                     PIT
//                   </span>
//                 ) : (
//                   <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${getTyreBadgeClass(driver.compound)}`}>
//                     {driver.compound[0]}
//                   </span>
//                 )}
//               </div>

//               {/* Gap Display */}
//               <span className="ml-auto text-sm text-neutral-300 font-mono tabular-nums">
//                 {getGapDisplay(driver.dist, index)}
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

// interface CarPosition {
//   x: number;
//   y: number;
//   lap: number | null;
//   dist: number;      // Cumulative distance from Python
//   compound: string;  // Tyre compound from Python
// }

// interface LeaderboardProps {
//   drivers: Driver[];
//   positions: Record<string, CarPosition>; // keyed by driver code
//   totalLaps: number;
//   currentLap: number;
// }

// // Helper to handle standard F1 tyre colouring schemes
// const getTyreBadgeClass = (compound: string): string => {
//   switch (compound.toUpperCase()) {
//     case 'SOFT':
//       return 'bg-red-600/20 text-red-500 border border-red-500/30';
//     case 'MEDIUM':
//       return 'bg-yellow-600/20 text-yellow-500 border border-yellow-500/30';
//     case 'HARD':
//       return 'bg-white/10 text-neutral-300 border border-neutral-500/30';
//     case 'INTERMEDIATE':
//       return 'bg-green-600/20 text-green-500 border border-green-500/30';
//     case 'WET':
//       return 'bg-blue-600/20 text-blue-500 border border-blue-500/30';
//     default:
//       return 'bg-neutral-800 text-neutral-500 border border-neutral-700/50';
//   }
// };

// const Leaderboard = ({ drivers, positions, totalLaps, currentLap }: LeaderboardProps) => {
//   const [gapMode, setGapMode] = useState<"leader" | "interval">("interval");

//   const ESTIMATED_SPEED = 75; 

//   const sortedDrivers = useMemo(() => {
//     return drivers
//       .map((d) => {
//         const pos = positions[d.code];
//         if (!pos || pos.lap == null || isNaN(pos.dist)) return null; 

//         return { 
//           ...d, 
//           dist: pos.dist,
//           compound: pos.compound || 'UNKNOWN',
//           lap: pos.lap
//         };
//       })
//       .filter((d): d is Driver & { dist: number; compound: string; lap: number } => d !== null)
//       .sort((a, b) => b.dist - a.dist); // Strict linear ordering by Python odometer
//   }, [drivers, positions]);

//   const leaderDist = sortedDrivers[0]?.dist || 0;

//   const getGapDisplay = (driverDist: number, index: number) => {
//     if (index === 0) return "Interval"; 

//     let distDiff = 0;
//     if (gapMode === "leader") {
//       distDiff = leaderDist - driverDist;
//     } else {
//       const carAheadDist = sortedDrivers[index - 1].dist;
//       distDiff = carAheadDist - driverDist;
//     }
    
//     const timeDiff = distDiff / ESTIMATED_SPEED;
//     return `+${timeDiff.toFixed(3)}`;
//   };

//   return (
//     // FIX 1: Dropped fixed pixel widths (w-72) so it expands to fill 100% of the parent layout block
//     <div className="w-full h-full bg-neutral-950 flex flex-col font-sans select-none">
      
//       {/* Dynamic F1 Broadcast Style Header */}
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

//       {/* Driver List Wrapper */}
//       {/* FIX 2: Added overflow-hidden and flex-col to force full container height utilization */}
//       <div className="flex-1 w-full overflow-hidden flex flex-col justify-between">
//         {sortedDrivers.map((driver, index) => {
//           const isPitting = driver.compound.toUpperCase() === 'UNKNOWN' || driver.compound === '';

//           return (
//             <div
//               key={driver.code}
//               style={{ borderLeftColor: driver.color }}
//               // FIX 3: Added flex-1 and min-h-[24px] so rows expand/shrink to fit perfectly inside the viewport height without scrolling
//               className="flex-1 min-h-[24px] flex items-center w-full px-4 border-l-4 border-b border-neutral-800/30 hover:bg-neutral-800 transition-colors group"
//             >
//               {/* Position */}
//               <span className="w-6 text-xs font-bold text-neutral-500 group-hover:text-neutral-400 transition-colors">
//                 {index + 1}
//               </span>
              
//               {/* Driver Code */}
//               <span className="w-10 font-bold text-white tracking-wide text-xs">
//                 {driver.code}
//               </span>

//               {/* Tyre Compound / Pit Badge */}
//               <div className="w-10 flex items-center justify-center mr-2">
//                 {isPitting ? (
//                   <span className="text-[9px] bg-red-600/20 text-red-400 px-1.5 py-0.5 rounded font-bold animate-pulse border border-red-500/30">
//                     PIT
//                   </span>
//                 ) : (
//                   <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${getTyreBadgeClass(driver.compound)}`}>
//                     {driver.compound[0]}
//                   </span>
//                 )}
//               </div>

//               {/* Gap Display */}
//               <span className="ml-auto text-xs text-neutral-300 font-mono tabular-nums">
//                 {getGapDisplay(driver.dist, index)}
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

// interface CarPosition {
//   x: number;
//   y: number;
//   lap: number | null;
//   dist: number;      
//   compound: string;  
// }

// interface LeaderboardProps {
//   drivers: Driver[];
//   positions: Record<string, CarPosition>; 
//   totalLaps: number;
//   currentLap: number;
// }

// const getTyreBadgeClass = (compound: string): string => {
//   switch (compound.toUpperCase()) {
//     case 'SOFT':
//       return 'bg-red-600/20 text-red-500 border border-red-500/30';
//     case 'MEDIUM':
//       return 'bg-yellow-600/20 text-yellow-500 border border-yellow-500/30';
//     case 'HARD':
//       return 'bg-white/10 text-neutral-300 border border-neutral-500/30';
//     case 'INTERMEDIATE':
//       return 'bg-green-600/20 text-green-500 border border-green-500/30';
//     case 'WET':
//       return 'bg-blue-600/20 text-blue-500 border border-blue-500/30';
//     default:
//       return 'bg-neutral-800 text-neutral-500 border border-neutral-700/50';
//   }
// };

// const Leaderboard = ({ drivers, positions, totalLaps, currentLap }: LeaderboardProps) => {
//   const [gapMode, setGapMode] = useState<"leader" | "interval">("interval");
//   const ESTIMATED_SPEED = 75; 

//   const sortedDrivers = useMemo(() => {
//     return drivers
//       .map((d) => {
//         const pos = positions[d.code];
//         if (!pos || pos.lap == null || isNaN(pos.dist)) return null; 

//         return { 
//           ...d, 
//           dist: pos.dist,
//           compound: pos.compound || 'UNKNOWN',
//           lap: pos.lap
//         };
//       })
//       .filter((d): d is Driver & { dist: number; compound: string; lap: number } => d !== null)
//       .sort((a, b) => b.dist - a.dist); 
//   }, [drivers, positions]);

//   const leaderDist = sortedDrivers[0]?.dist || 0;

//   const getGapDisplay = (driverDist: number, index: number) => {
//     if (index === 0) return "Interval"; 

//     let distDiff = 0;
//     if (gapMode === "leader") {
//       distDiff = leaderDist - driverDist;
//     } else {
//       const carAheadDist = sortedDrivers[index - 1].dist;
//       distDiff = carAheadDist - driverDist;
//     }
    
//     const timeDiff = distDiff / ESTIMATED_SPEED;
//     return `+${timeDiff.toFixed(3)}`;
//   };

//   return (
//     <div className="w-full h-full bg-neutral-950 flex flex-col font-sans select-none">
      
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
//           const isPitting = driver.compound.toUpperCase() === 'UNKNOWN' || driver.compound === '';

//           return (
//             <div
//               key={driver.code}
//               style={{ borderLeftColor: driver.color }}
//               // FIX: Replaced min-h-[24px] with min-h-0. This allows it to scale down infinitely for 20, 22, or 24 drivers.
//               className="flex-1 min-h-0 flex items-center w-full px-4 border-l-4 border-b border-neutral-800/30 hover:bg-neutral-800 transition-colors group"
//             >
//               <span className="w-6 text-xs font-bold text-neutral-500 group-hover:text-neutral-400 transition-colors">
//                 {index + 1}
//               </span>
              
//               <span className="w-10 font-bold text-white tracking-wide text-xs">
//                 {driver.code}
//               </span>

//               <div className="w-10 flex items-center justify-center mr-2">
//                 {isPitting ? (
//                   <span className="text-[9px] bg-red-600/20 text-red-400 px-1.5 py-0.5 rounded font-bold animate-pulse border border-red-500/30">
//                     PIT
//                   </span>
//                 ) : (
//                   <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${getTyreBadgeClass(driver.compound)}`}>
//                     {driver.compound[0]}
//                   </span>
//                 )}
//               </div>

//               <span className="ml-auto text-xs text-neutral-300 font-mono tabular-nums">
//                 {getGapDisplay(driver.dist, index)}
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

// interface CarPosition {
//   x: number;
//   y: number;
//   lap: number | null;
//   dist: number;      
//   compound: string;  
// }

// interface LeaderboardProps {
//   drivers: Driver[];
//   positions: Record<string, CarPosition>; 
//   totalLaps: number;
//   currentLap: number;
// }

// const getTyreBadgeClass = (compound: string): string => {
//   switch (compound.toUpperCase()) {
//     case 'SOFT': return 'bg-red-600/20 text-red-500 border border-red-500/30';
//     case 'MEDIUM': return 'bg-yellow-600/20 text-yellow-500 border border-yellow-500/30';
//     case 'HARD': return 'bg-white/10 text-neutral-300 border border-neutral-500/30';
//     case 'INTERMEDIATE': return 'bg-green-600/20 text-green-500 border border-green-500/30';
//     case 'WET': return 'bg-blue-600/20 text-blue-500 border border-blue-500/30';
//     default: return 'bg-neutral-800 text-neutral-500 border border-neutral-700/50';
//   }
// };

// const Leaderboard = ({ drivers, positions, totalLaps, currentLap }: LeaderboardProps) => {
//   const [gapMode, setGapMode] = useState<"leader" | "interval">("interval");
  
//   // Tuned closer to an F1 average speed (approx 234 km/h) to make gaps more realistic
//   const ESTIMATED_SPEED = 65; 

//   const sortedDrivers = useMemo(() => {
//     return drivers
//       .map((d) => {
//         const pos = positions[d.code];
//         if (!pos || pos.lap == null || isNaN(pos.dist)) return null; 

//         return { 
//           ...d, 
//           dist: pos.dist,
//           compound: pos.compound || 'UNKNOWN',
//           lap: pos.lap
//         };
//       })
//       .filter((d): d is Driver & { dist: number; compound: string; lap: number } => d !== null)
//       .sort((a, b) => b.dist - a.dist); 
//   }, [drivers, positions]);

//   // CHANGED: Advanced gap logic mimicking true FIA broadcasts
//   const getGapDisplay = (driver: typeof sortedDrivers[0], index: number) => {
//     if (index === 0) return gapMode === "leader" ? "Leader" : "Interval"; 

//     const leader = sortedDrivers[0];
//     const carAhead = sortedDrivers[index - 1];

//     // Detect Retired Cars: If they are massive distances behind and laps down
//     const distFromLeader = leader.dist - driver.dist;
//     if (distFromLeader > 15000 && (leader.lap - driver.lap) > 2) {
//       return "OUT";
//     }

//     if (gapMode === "leader") {
//       // Leader Mode
//       const lapDiff = leader.lap - driver.lap;
//       if (lapDiff > 0) return `+${lapDiff} LAP${lapDiff > 1 ? 'S' : ''}`;
      
//       const timeDiff = distFromLeader / ESTIMATED_SPEED;
//       return `+${timeDiff.toFixed(3)}`;
//     } else {
//       // Interval Mode
//       const distDiff = carAhead.dist - driver.dist;
      
//       // If car is lapped relative to the car immediately ahead
//       if (distDiff > 5000) {
//          const lapDiff = carAhead.lap - driver.lap;
//          if (lapDiff > 0) return `+${lapDiff} LAP${lapDiff > 1 ? 'S' : ''}`;
//       }

//       const timeDiff = distDiff / ESTIMATED_SPEED;
//       return `+${timeDiff.toFixed(3)}`;
//     }
//   };

//   return (
//     <div className="w-full h-full bg-[#0a0a0a] flex flex-col font-sans select-none border-l border-neutral-800">
      
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
//           const isPitting = driver.compound.toUpperCase() === 'UNKNOWN' || driver.compound === '';
//           const gapText = getGapDisplay(driver, index);
//           const isOut = gapText === "OUT";

//           return (
//             <div
//               key={driver.code}
//               style={{ borderLeftColor: isOut ? '#333' : driver.color }}
//               className={`flex-1 min-h-0 flex items-center w-full px-4 border-l-4 border-b border-neutral-800/30 transition-colors group ${isOut ? 'opacity-40' : 'hover:bg-neutral-800'}`}
//             >
//               <span className="w-6 text-xs font-bold text-neutral-500 group-hover:text-neutral-400 transition-colors">
//                 {index + 1}
//               </span>
              
//               <span className="w-10 font-bold text-white tracking-wide text-xs">
//                 {driver.code}
//               </span>

//               <div className="w-10 flex items-center justify-center mr-2">
//                 {isOut ? (
//                    <span className="text-[9px] font-bold text-neutral-600">--</span>
//                 ) : isPitting ? (
//                   <span className="text-[9px] bg-red-600/20 text-red-400 px-1.5 py-0.5 rounded font-bold animate-pulse border border-red-500/30">
//                     PIT
//                   </span>
//                 ) : (
//                   <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${getTyreBadgeClass(driver.compound)}`}>
//                     {driver.compound[0]}
//                   </span>
//                 )}
//               </div>

//               <span className={`ml-auto text-xs font-mono tabular-nums ${isOut ? 'text-neutral-600 font-bold' : 'text-neutral-300'}`}>
//                 {gapText}
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
//   raceData: any;
//   frameIndex: number;
//   totalLaps: number;
//   currentLap: number;
// }

// const getTyreBadgeClass = (compound: string): string => {
//   switch (compound.toUpperCase()) {
//     case 'SOFT': return 'bg-red-600/20 text-red-500 border border-red-500/30';
//     case 'MEDIUM': return 'bg-yellow-600/20 text-yellow-500 border border-yellow-500/30';
//     case 'HARD': return 'bg-white/10 text-neutral-300 border border-neutral-500/30';
//     case 'INTERMEDIATE': return 'bg-green-600/20 text-green-500 border border-green-500/30';
//     case 'WET': return 'bg-blue-600/20 text-blue-500 border border-blue-500/30';
//     default: return 'bg-neutral-800 text-neutral-500 border border-neutral-700/50';
//   }
// };

// const Leaderboard = ({ drivers, raceData, frameIndex, totalLaps, currentLap }: LeaderboardProps) => {
//   const [gapMode, setGapMode] = useState<"leader" | "interval">("interval");

//   // Advanced driver state calculation
//   const sortedDrivers = useMemo(() => {
//     const currentFrame = raceData.frames[frameIndex];

//     return drivers
//       .map((d) => {
//         const pos = currentFrame.cars[d.code];
//         if (!pos || pos.lap == null || isNaN(pos.dist)) return null; 

//         // 1. Determine PIT Status
//         const isPitting = !pos.compound || pos.compound.toUpperCase() === 'UNKNOWN';

//         // 2. Determine OUT Status (Hasn't moved more than 2 meters in the last 30 frames / ~10 seconds)
//         let isOut = false;
//         if (currentLap > 1 && frameIndex > 30) {
//             const pastFrame = raceData.frames[frameIndex - 30];
//             const pastPos = pastFrame.cars[d.code];
//             if (pastPos && Math.abs(pos.dist - pastPos.dist) < 2 && !isPitting) {
//                 isOut = true;
//             }
//         }

//         // 3. Calculate Dynamic Instantaneous Speed (m/s) to fix the "elastic band" gap jumping
//         let speed = 65; // default fallback speed
//         if (frameIndex > 5) {
//              const prevFrame = raceData.frames[frameIndex - 5];
//              const dt = currentFrame.t - prevFrame.t;
//              const prevPos = prevFrame.cars[d.code];
//              if (dt > 0 && prevPos && !isNaN(prevPos.dist)) {
//                  speed = Math.max((pos.dist - prevPos.dist) / dt, 5); // Prevents dividing by zero
//              }
//         }

//         return { 
//           ...d, 
//           dist: pos.dist,
//           compound: pos.compound || 'UNKNOWN',
//           lap: pos.lap,
//           isPitting,
//           isOut,
//           speed
//         };
//       })
//       .filter((d): d is any => d !== null)
//       .sort((a, b) => b.dist - a.dist); 
//   }, [drivers, raceData, frameIndex, currentLap]);

//   const getGapDisplay = (driver: any, index: number) => {
//     // F1 Broadcast Flagging
//     if (driver.isOut) return <span className="text-red-600 font-black tracking-wider">OUT</span>;
//     if (index === 0) return gapMode === "leader" ? "Leader" : "Interval"; 

//     const leader = sortedDrivers[0];
//     const carAhead = sortedDrivers[index - 1];

//     if (gapMode === "leader") {
//       const lapDiff = leader.lap - driver.lap;
//       if (lapDiff > 0) return `+${lapDiff} LAP${lapDiff > 1 ? 'S' : ''}`;
      
//       const timeDiff = (leader.dist - driver.dist) / driver.speed;
//       if (driver.isPitting) return <span className="text-yellow-500 font-bold">IN PIT</span>;
//       return `+${timeDiff.toFixed(3)}`;
//     } else {
//       const distDiff = carAhead.dist - driver.dist;
      
//       // If trailing a massive distance to the car immediately ahead
//       if (distDiff > 6000) {
//          const lapDiff = carAhead.lap - driver.lap;
//          if (lapDiff > 0) return `+${lapDiff} LAP${lapDiff > 1 ? 'S' : ''}`;
//       }

//       const timeDiff = distDiff / driver.speed;
//       if (driver.isPitting) return <span className="text-yellow-500 font-bold">IN PIT</span>;
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
//                   <span className="text-[9px] bg-yellow-500/20 text-yellow-500 px-1.5 py-0.5 rounded font-bold border border-yellow-500/30">
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

// import { useState, useMemo } from "react";

// interface Driver {
//   code: string;
//   color: string;
// }

// interface LeaderboardProps {
//   drivers: Driver[];
//   raceData: any;
//   frameIndex: number;
//   totalLaps: number;
//   currentLap: number;
// }

// const getTyreBadgeClass = (compound: string): string => {
//   switch (compound.toUpperCase()) {
//     case 'SOFT': return 'bg-red-600/20 text-red-500 border border-red-500/30';
//     case 'MEDIUM': return 'bg-yellow-600/20 text-yellow-500 border border-yellow-500/30';
//     case 'HARD': return 'bg-white/10 text-neutral-300 border border-neutral-500/30';
//     case 'INTERMEDIATE': return 'bg-green-600/20 text-green-500 border border-green-500/30';
//     case 'WET': return 'bg-blue-600/20 text-blue-500 border border-blue-500/30';
//     default: return 'bg-neutral-800 text-neutral-500 border border-neutral-700/50';
//   }
// };

// const Leaderboard = ({ drivers, raceData, frameIndex, totalLaps, currentLap }: LeaderboardProps) => {
//   const [gapMode, setGapMode] = useState<"leader" | "interval">("interval");

//   const sortedDrivers = useMemo(() => {
//     const currentFrame = raceData.frames[frameIndex];

//     return drivers
//       .map((d) => {
//         const pos = currentFrame.cars[d.code];
//         if (!pos || pos.lap == null || isNaN(pos.dist)) return null; 

//         // 1. Determine OUT Status
//         let isOut = false;
//         if (currentLap > 1 && frameIndex > 30) {
//             const pastFrame = raceData.frames[frameIndex - 30];
//             const pastPos = pastFrame.cars[d.code];
//             if (pastPos && Math.abs(pos.dist - pastPos.dist) < 2) {
//                 isOut = true;
//             }
//         }

//         // 2. Calculate Dynamic Instantaneous Speed (m/s)
//         let speed = 65; 
//         if (frameIndex > 5) {
//              const prevFrame = raceData.frames[frameIndex - 5];
//              const dt = currentFrame.t - prevFrame.t;
//              const prevPos = prevFrame.cars[d.code];
//              if (dt > 0 && prevPos && !isNaN(prevPos.dist)) {
//                  speed = Math.max((pos.dist - prevPos.dist) / dt, 0); 
//              }
//         }

//         // 3. Determine PIT Status (Live Speed Heuristic)
//         let isPitting = !pos.compound || pos.compound.toUpperCase() === 'UNKNOWN';
        
//         // If FastF1 is hiding the pit stop by forward-filling the tyre data, 
//         // we detect it by catching them crawling at the 80km/h pit lane speed limit.
//         if (!isPitting && !isOut && frameIndex > 20 && currentLap > 1) {
//             let sustainedLowSpeed = true;
//             // Look back over the last 20 frames (~6 seconds)
//             for (let i = 0; i < 20; i++) {
//                 const fCurrent = raceData.frames[frameIndex - i];
//                 const fPrev = raceData.frames[Math.max(0, frameIndex - i - 3)];
                
//                 if (fCurrent && fPrev && fCurrent.cars[d.code] && fPrev.cars[d.code]) {
//                     const dt = fCurrent.t - fPrev.t;
//                     const ds = fCurrent.cars[d.code].dist - fPrev.cars[d.code].dist;
//                     const historicalSpeed = dt > 0 ? ds / dt : 0;
                    
//                     // 26 m/s is ~93 km/h. If they exceed this, they are on the actual track.
//                     if (historicalSpeed > 26) { 
//                         sustainedLowSpeed = false;
//                         break;
//                     }
//                 } else {
//                     sustainedLowSpeed = false;
//                     break;
//                 }
//             }
//             // If they stayed under the limit for 6 straight seconds, they are pitting!
//             if (sustainedLowSpeed) isPitting = true;
//         }

//         return { 
//           ...d, 
//           dist: pos.dist,
//           compound: pos.compound || 'UNKNOWN',
//           lap: pos.lap,
//           isPitting,
//           isOut,
//           speed
//         };
//       })
//       .filter((d): d is any => d !== null)
//       .sort((a, b) => b.dist - a.dist); 
//   }, [drivers, raceData, frameIndex, currentLap]);

//   const getGapDisplay = (driver: any, index: number) => {
//     if (driver.isOut) return <span className="text-red-600 font-black tracking-wider">OUT</span>;
//     if (index === 0) return gapMode === "leader" ? "Leader" : "Interval"; 

//     const leader = sortedDrivers[0];
//     const carAhead = sortedDrivers[index - 1];

//     if (gapMode === "leader") {
//       const lapDiff = leader.lap - driver.lap;
//       if (lapDiff > 0) return `+${lapDiff} LAP${lapDiff > 1 ? 'S' : ''}`;
      
//       const timeDiff = (leader.dist - driver.dist) / driver.speed;
//       return `+${timeDiff.toFixed(3)}`;
//     } else {
//       const distDiff = carAhead.dist - driver.dist;
      
//       if (distDiff > 6000) {
//          const lapDiff = carAhead.lap - driver.lap;
//          if (lapDiff > 0) return `+${lapDiff} LAP${lapDiff > 1 ? 'S' : ''}`;
//       }

//       const timeDiff = distDiff / driver.speed;
//       return `+${timeDiff.toFixed(3)}`;
//     }
//   };

//   return (
//     <div className="w-full h-full bg-[#0a0a0a] flex flex-col font-sans select-none border-l border-neutral-800">
      
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

//               {/* Dynamic PIT / Tyre Badge Rendering */}
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

import { useState, useMemo } from "react";

interface Driver {
  code: string;
  color: string;
}

interface LeaderboardProps {
  drivers: Driver[];
  raceData: any;
  frameIndex: number;
  totalLaps: number;
  currentLap: number;
}

const getTyreBadgeClass = (compound: string): string => {
  switch (compound.toUpperCase()) {
    case 'SOFT': return 'bg-red-600/20 text-red-500 border border-red-500/30';
    case 'MEDIUM': return 'bg-yellow-600/20 text-yellow-500 border border-yellow-500/30';
    case 'HARD': return 'bg-white/10 text-neutral-300 border border-neutral-500/30';
    case 'INTERMEDIATE': return 'bg-green-600/20 text-green-500 border border-green-500/30';
    case 'WET': return 'bg-blue-600/20 text-blue-500 border border-blue-500/30';
    default: return 'bg-neutral-800 text-neutral-500 border border-neutral-700/50';
  }
};

const Leaderboard = ({ drivers, raceData, frameIndex, totalLaps, currentLap }: LeaderboardProps) => {
  const [gapMode, setGapMode] = useState<"leader" | "interval">("interval");

  const sortedDrivers = useMemo(() => {
    const currentFrame = raceData.frames[frameIndex];

    return drivers
      .map((d) => {
        const pos = currentFrame.cars[d.code];
        if (!pos || pos.lap == null || isNaN(pos.dist)) return null; 

        // 1. Determine OUT Status (Hasn't moved more than 2 meters in 9 seconds)
        let isOut = false;
        if (currentLap > 1 && frameIndex > 30) {
            const pastFrame = raceData.frames[frameIndex - 30];
            const pastPos = pastFrame.cars[d.code];
            if (pastPos && Math.abs(pos.dist - pastPos.dist) < 2) {
                isOut = true;
            }
        }

        // 2. Calculate Dynamic Instantaneous Speed (m/s) for time gaps
        let speed = 65; 
        if (frameIndex > 5) {
             const prevFrame = raceData.frames[frameIndex - 5];
             const dt = currentFrame.t - prevFrame.t;
             const prevPos = prevFrame.cars[d.code];
             if (dt > 0 && prevPos && !isNaN(prevPos.dist)) {
                 speed = Math.max((pos.dist - prevPos.dist) / dt, 5); // Fallback to 5m/s minimum to prevent Infinity
             }
        }

        // 3. Robust PIT Status (Rolling Average Heuristic)
        let isPitting = !pos.compound || pos.compound.toUpperCase() === 'UNKNOWN';
        
        if (!isPitting && !isOut && frameIndex > 30 && currentLap > 1) {
            const pastFrame = raceData.frames[frameIndex - 30]; // Look back ~9 seconds
            const pastPos = pastFrame.cars[d.code];
            
            if (pastPos) {
                const dt = currentFrame.t - pastFrame.t;
                const ds = Math.abs(pos.dist - pastPos.dist); // Total distance covered in 9 seconds
                const avgSpeed = dt > 0 ? ds / dt : 0;
                
                // If average speed over 9s is under 26 m/s (93 km/h) but greater than 1 m/s (not stopped)
                // They are in the pit lane!
                if (avgSpeed > 1 && avgSpeed < 26) {
                    isPitting = true;
                }
            }
        }

        return { 
          ...d, 
          dist: pos.dist,
          compound: pos.compound || 'UNKNOWN',
          lap: pos.lap,
          isPitting,
          isOut,
          speed
        };
      })
      .filter((d): d is any => d !== null)
      .sort((a, b) => b.dist - a.dist); 
  }, [drivers, raceData, frameIndex, currentLap]);

  const getGapDisplay = (driver: any, index: number) => {
    if (driver.isOut) return <span className="text-red-600 font-black tracking-wider">OUT</span>;
    if (index === 0) return gapMode === "leader" ? "Leader" : "Interval"; 

    const leader = sortedDrivers[0];
    const carAhead = sortedDrivers[index - 1];

    if (gapMode === "leader") {
      const lapDiff = leader.lap - driver.lap;
      if (lapDiff > 0) return `+${lapDiff} LAP${lapDiff > 1 ? 'S' : ''}`;
      
      const timeDiff = (leader.dist - driver.dist) / driver.speed;
      return `+${timeDiff.toFixed(3)}`;
    } else {
      const distDiff = carAhead.dist - driver.dist;
      
      if (distDiff > 6000) {
         const lapDiff = carAhead.lap - driver.lap;
         if (lapDiff > 0) return `+${lapDiff} LAP${lapDiff > 1 ? 'S' : ''}`;
      }

      const timeDiff = distDiff / driver.speed;
      return `+${timeDiff.toFixed(3)}`;
    }
  };

  return (
    <div className="w-full h-full bg-[#0a0a0a] flex flex-col font-sans select-none border-l border-neutral-800">
      
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
          return (
            <div
              key={driver.code}
              style={{ borderLeftColor: driver.isOut ? '#333' : driver.color }}
              className={`flex-1 min-h-0 flex items-center w-full px-4 border-l-4 border-b border-neutral-800/30 transition-colors group ${driver.isOut ? 'opacity-40' : 'hover:bg-neutral-800'}`}
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