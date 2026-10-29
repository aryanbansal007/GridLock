import { useMemo } from "react";
import { driverTimingAt, formatLap, type QualiData, type SectorTone } from "../../../lib/quali";

const TONE_BG: Record<SectorTone | "deleted", string> = {
  purple: "bg-fuchsia-500/90 text-white",
  green: "bg-emerald-500/90 text-white",
  yellow: "bg-yellow-400 text-black",
  pending: "bg-neutral-800 text-neutral-500",
  deleted: "bg-red-600 text-white",
};
const TONE_TEXT: Record<SectorTone | "deleted", string> = {
  purple: "text-fuchsia-400",
  green: "text-emerald-400",
  yellow: "text-yellow-300",
  pending: "text-neutral-200",
  deleted: "text-red-400",
};

const signed = (v: number) => `${v < 0 ? "−" : "+"}${Math.abs(v).toFixed(3)}`;

const BOX = "h-[84px] min-w-0 rounded-md border px-3 py-2";

const Box = ({ quali, code, color, currentTime, onClose }: {
  quali: QualiData; code: string; color: string; currentTime: number; onClose: () => void;
}) => {
  const timing = useMemo(() => driverTimingAt(quali, code, currentTime), [quali, code, currentTime]);
  const tone = timing?.lapTone ?? "pending";
  const running = !!timing && timing.sectors.length > 0;
  const push = running && timing.push;
  // Between runs a car sits in its garage: no lap is being timed, so show the last one.
  const last = timing?.recent[0] ?? null;

  return (
    <div className={`${BOX} border-neutral-800 bg-neutral-900/60`} style={{ borderLeft: `3px solid ${color}` }}>
      <div className="flex items-center gap-2 whitespace-nowrap">
        <span className="text-sm font-black text-white">{code}</span>
        <span className={`text-[9px] font-bold uppercase tracking-widest ${push ? "text-red-400" : "text-neutral-500"}`}>
          {push ? "Push lap" : running ? "Slow lap" : "In the garage"}
        </span>
        {push ? (
          <span className={`ml-auto font-mono text-lg font-black tabular-nums leading-none ${TONE_TEXT[tone]}`}>
            {formatLap(timing.lapTime ?? timing.elapsed)}
          </span>
        ) : (
          <span className="ml-auto font-mono text-[12px] tabular-nums text-neutral-400">
            {last ? <>Last <span className={last.deleted ? "text-red-400 line-through" : "text-neutral-200"}>{formatLap(last.time)}</span></> : "No time yet"}
          </span>
        )}
        <button onClick={onClose} aria-label={`Remove ${code}`} className="text-neutral-600 hover:text-white">✕</button>
      </div>

      <div className="mt-1.5 grid grid-cols-3 gap-1">
        {[0, 1, 2].map((i) => {
          const sec = push ? timing.sectors[i] : null;
          return (
            <div key={i} className={`rounded px-1.5 py-0.5 text-center ${sec ? TONE_BG[sec.tone] : "bg-neutral-800/60 text-neutral-600"}`}>
              <div className="flex items-baseline justify-center gap-1 whitespace-nowrap">
                <span className="text-[8px] font-bold opacity-70">S{i + 1}</span>
                <span className="font-mono text-[11px] font-bold tabular-nums">{sec?.time != null ? sec.time.toFixed(3) : "—"}</span>
              </div>
              <div className="h-2.5 font-mono text-[8px] tabular-nums opacity-80">{sec?.delta != null ? signed(sec.delta) : ""}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/** Lap timing for up to three pinned drivers: three boxes in one row under the map. The strip
 *  keeps the same height whether or not anyone is pinned, so the track never changes size. */
const DriverTimingBar = ({ quali, codes, colors, currentTime, onClose }: {
  quali: QualiData; codes: string[]; colors: Record<string, string>; currentTime: number; onClose: (code: string) => void;
}) => (
  <div className="flex-shrink-0 grid grid-cols-3 gap-2 border-t border-neutral-800/60 bg-[#0d0d0d] p-2">
    {[0, 1, 2].map((slot) => {
      const code = codes[slot];
      return code ? (
        <Box key={code} quali={quali} code={code} color={colors[code] || "#808080"} currentTime={currentTime} onClose={() => onClose(code)} />
      ) : (
        <div key={`empty${slot}`} className={`${BOX} flex items-center justify-center border-dashed border-neutral-800 text-[10px] font-bold uppercase tracking-widest text-neutral-700`}>
          {codes.length === 0 && slot === 0 ? "Click a driver to follow their lap" : "Add a driver"}
        </div>
      );
    })}
  </div>
);

export default DriverTimingBar;
