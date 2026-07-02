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

import { useState, useMemo } from "react";

interface Driver {
  code: string;
  color: string;
}

interface CarPosition {
  x: number;
  y: number;
  lap: number | null;
}

interface TrackPoint {
  x: number;
  y: number;
}

interface LeaderboardProps {
  drivers: Driver[];
  positions: Record<string, CarPosition>; // keyed by driver code, real x/y + lap
  trackOutline: TrackPoint[]; // ordered start->finish, from data.json
  totalLaps: number;
  currentLap: number;
}

// Finds the closest point on the ordered track_outline to a given x/y,
// and returns its position as a 0.0-1.0 fraction around the lap.
// This REPLACES the old pre-baked progress float — we're reconstructing
// "how far around the lap" a car is from its real coordinates.
const nearestOutlineProgress = (x: number, y: number, outline: TrackPoint[]): number => {
  let bestIndex = 0;
  let bestDist = Infinity;
  for (let i = 0; i < outline.length; i++) {
    const dx = outline[i].x - x;
    const dy = outline[i].y - y;
    const dist = dx * dx + dy * dy;
    if (dist < bestDist) {
      bestDist = dist;
      bestIndex = i;
    }
  }
  return bestIndex / (outline.length - 1);
};

const Leaderboard = ({ drivers, positions, trackOutline, totalLaps, currentLap }: LeaderboardProps) => {
  const [gapMode, setGapMode] = useState<"leader" | "interval">("interval");

  // Assumed constant lap time for converting distance-gaps into time-gaps.
  // This is the same approximation your original design used — it won't be
  // perfectly accurate (real lap times vary), but it's a reasonable stand-in
  // without full sector-time modeling.
  const LAP_TIME_SECONDS = 90;

  const sortedDrivers = useMemo(() => {
    return drivers
      .map((d) => {
        const pos = positions[d.code];
        if (!pos || pos.lap == null) return null; // car not on track this frame

        const lapProgress = nearestOutlineProgress(pos.x, pos.y, trackOutline);
        // Absolute progress = completed laps + fractional position in current lap,
        // mirroring the AbsoluteProgress formula from your original design doc.
        const absoluteProgress = (pos.lap - 1) + lapProgress;

        return { ...d, absoluteProgress };
      })
      .filter((d): d is Driver & { absoluteProgress: number } => d !== null)
      .sort((a, b) => b.absoluteProgress - a.absoluteProgress);
  }, [drivers, positions, trackOutline]);

  const leaderProgress = sortedDrivers[0]?.absoluteProgress || 0;

  const getGapDisplay = (driverProgress: number, index: number) => {
    if (index === 0) return "Interval"; // 1st place shows no gap

    let progressDiff = 0;
    if (gapMode === "leader") {
      progressDiff = leaderProgress - driverProgress;
    } else {
      const carAheadProgress = sortedDrivers[index - 1].absoluteProgress;
      progressDiff = carAheadProgress - driverProgress;
    }
    const timeDiff = progressDiff * LAP_TIME_SECONDS;
    return `+${timeDiff.toFixed(3)}`;
  };

  return (
    <div className="w-72 h-full bg-neutral-950 border-l border-neutral-800 flex flex-col">
      {/* Dynamic F1 Broadcast Style Header */}
      <div className="px-4 py-3 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between">
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

      {/* Driver List */}
      <div className="flex-1 overflow-y-auto pb-10">
        {sortedDrivers.map((driver, index) => (
          <div
            key={driver.code}
            style={{ borderLeftColor: driver.color }}
            className="flex items-center px-4 py-1.5 border-l-4 border-b border-neutral-800/50 hover:bg-neutral-800 transition-colors"
          >
            <span className="w-6 text-sm font-bold text-neutral-500">{index + 1}</span>
            <span className="font-bold text-white tracking-wide text-sm">{driver.code}</span>
            <span className="ml-auto text-sm text-neutral-300 font-mono tabular-nums">
              {getGapDisplay(driver.absoluteProgress, index)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Leaderboard;