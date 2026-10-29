import { useMemo } from "react";
import { qualiStateAt, sectorChipsAt, formatClock, formatLap, type QualiData, type SectorTone } from "../../../lib/quali";

interface Props {
  quali: QualiData;
  colors: Record<string, string>;
  currentTime: number;
  onDriverSelect: (code: string) => void;
  selected: string[];
}

const TONE: Record<SectorTone, string> = {
  purple: "bg-fuchsia-500",
  green: "bg-emerald-500",
  yellow: "bg-yellow-400",
  pending: "bg-neutral-700 animate-pulse",
};

const QualiBoard = ({ quali, colors, currentTime, onDriverSelect, selected }: Props) => {
  const state = useMemo(() => qualiStateAt(quali, currentTime), [quali, currentTime]);
  const chips = useMemo(() => sectorChipsAt(quali, currentTime), [quali, currentTime]);
  const seg = quali.segments[state.segIdx];
  const next = quali.segments[state.segIdx + 1];

  const status =
    state.phase === "running" ? `${formatClock(state.countdown ?? 0)} left`
    : state.phase === "break" ? `${next.name} in ${formatClock(state.countdown ?? 0)}`
    : state.phase === "done" ? "Final" : "Starting";

  return (
    <div className="w-full h-full bg-[#0a0a0a] flex flex-col font-sans select-none">
      <div className="w-full px-4 py-3 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between shrink-0">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">
            {state.phase === "break" ? `${seg.name} ended` : "Qualifying"}
          </span>
          <span className="text-sm font-black text-white tabular-nums">{seg.name}</span>
        </div>
        <span
          className={`text-xs font-mono font-bold tabular-nums px-2 py-1 rounded ${
            state.phase === "break" ? "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30" : "bg-neutral-800 text-neutral-300"
          }`}
        >
          {status}
        </span>
      </div>

      <div className="flex-1 w-full overflow-hidden flex flex-col justify-between">
        {state.rows.map((row, i) => {
          const dim = row.state === "gone";
          const cutLine = state.advancing > 0 && i === state.advancing;
          return (
            <div key={row.code} className="flex-1 min-h-0 flex flex-col">
              {cutLine && (
                <div className="flex items-center gap-2 px-4 h-3 shrink-0 bg-red-950/40 border-y border-red-600/40">
                  <span className="text-[8px] font-black tracking-[0.2em] uppercase text-red-400">
                    {state.phase === "break" || state.phase === "done" ? "Eliminated" : "Drop zone"}
                  </span>
                </div>
              )}
              <div
                onClick={() => onDriverSelect(row.code)}
                style={{ borderLeftColor: dim ? "#333" : colors[row.code] || "#808080" }}
                className={`flex-1 min-h-0 flex items-center w-full px-4 border-l-4 border-b border-neutral-800/30 transition-colors cursor-pointer group
                  ${dim ? "opacity-40" : "hover:bg-neutral-800"}
                  ${row.state === "danger" ? "bg-red-950/20" : ""}
                  ${selected.includes(row.code) ? "bg-neutral-800/50 ring-1 ring-white/10" : ""}`}
              >
                <span className="w-6 text-xs font-bold text-neutral-500">{row.rank}</span>
                <span className="w-10 font-bold text-white tracking-wide text-xs">{row.code}</span>
                <span className="w-14 flex gap-0.5" aria-label="Sector times on the current lap">
                  {chips[row.code]?.map((tone, k) => (
                    <span key={k} className={`h-1.5 w-3 rounded-[1px] ${TONE[tone]}`} />
                  ))}
                </span>
                <span className="w-12 text-[9px] font-bold">
                  {row.state === "gone" ? (
                    <span className="text-neutral-500">OUT Q{row.outIn}</span>
                  ) : row.state === "out" ? (
                    <span className="text-red-400">OUT</span>
                  ) : null}
                </span>
                <span className="ml-auto flex flex-col items-end leading-tight">
                  <span className={`text-xs font-mono tabular-nums ${row.time != null ? "text-neutral-200" : "text-neutral-600"}`}>
                    {row.time != null ? formatLap(row.time) : dim ? "" : "—"}
                  </span>
                  {row.gap != null && (
                    <span className="text-[9px] font-mono tabular-nums text-neutral-500">+{row.gap.toFixed(3)}</span>
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default QualiBoard;
