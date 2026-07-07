import { useState, useMemo, useRef } from "react";

interface Driver {
  code: string;
  color: string;
}

interface LeaderboardProps {
  drivers: Driver[];
  positions: any;
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

const Leaderboard = ({ drivers, positions, totalLaps, currentLap, onDriverSelect, selectedDriver }: LeaderboardProps) => {
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