import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import RaceTrack from "./components/RaceTrack";
import { trackRotation } from "../../lib/trackRotation";
import Leaderboard from "./components/Leaderboard";
import { DataSourceNote } from "../../components/DataSourceNote";
import {
  driversManifestUrl, driverDataUrl, trackUrl, conditionsUrl, unwrapManifest,
} from "../../lib/telemetry";

// ─── helpers ────────────────────────────────────────────────────────────────

// Playbar bands, one per race-status stretch. Safety car and VSC are both orange, told
// apart by fill (solid vs striped); yellow and red keep their flag colours.
const FLAG_BAND_ORDER = ["yellow", "red", "safety_car", "vsc"];
const FLAG_BAND_LABEL: Record<string, string> = {
  yellow: "Yellow",
  red: "Red flag",
  safety_car: "Safety car",
  vsc: "VSC",
};
const FLAG_BAND_STYLE: Record<string, React.CSSProperties> = {
  yellow: { background: "#facc15" },
  red: { background: "#ef4444" },
  safety_car: { background: "#fb923c" },
  vsc: {
    background:
      "repeating-linear-gradient(135deg, #fb923c 0 3px, rgba(251,146,60,0.25) 3px 6px)",
  },
};

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

const WEATHER_ROWS = (w: { air_temp: number; track_temp: number; humidity: number; wind_speed: number }): [string, string][] => [
  ["AIR", `${w.air_temp.toFixed(1)}°C`],
  ["HUM", `${w.humidity.toFixed(0)}%`],
  ["TRACK", `${w.track_temp.toFixed(1)}°C`],
  ["WIND", `${w.wind_speed.toFixed(1)} m/s`],
];

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
  // Builds the same { meta, track_outline, frames } shape the rest of this
  // component already expects, but sourced from the modular per-driver/track/
  // conditions endpoints (the same ones the Analysis page's Lap Simulator
  // already uses) instead of the old merged data.json blob — which was roughly
  // 2x the combined size of the per-driver files, since it duplicated shared
  // track/timing data redundantly across every driver.
  useEffect(() => {
    if (!raceId) {
      setError("No race ID provided");
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const [manifestRes, trackRes, conditionsRes] = await Promise.all([
          fetch(driversManifestUrl(year, gp, session)),
          fetch(trackUrl(year, gp, session)),
          fetch(conditionsUrl(year, gp, session)),
        ]);
        if (!manifestRes.ok) throw new Error(`HTTP ${manifestRes.status} loading driver manifest`);
        if (!trackRes.ok) throw new Error(`HTTP ${trackRes.status} loading track data`);
        if (!conditionsRes.ok) throw new Error(`HTTP ${conditionsRes.status} loading conditions data`);

        const manifest = unwrapManifest(await manifestRes.json()) as unknown as Record<string, { team_color: string }>;
        const track = await trackRes.json();
        const conditionsPayload = await conditionsRes.json();

        const codes = Object.keys(manifest);
        const driverFiles = await Promise.all(
          codes.map((abbr) =>
            fetch(driverDataUrl(year, gp, session, abbr)).then((r) => {
              if (!r.ok) throw new Error(`HTTP ${r.status} loading telemetry for ${abbr}`);
              return r.json();
            })
          )
        );

        const conditions: { t: number; flag: string; air_temp: number; track_temp: number; humidity: number; wind_speed: number }[] =
          conditionsPayload.conditions;
        const sampleIntervalMs: number = conditionsPayload.sample_interval_ms;
        const t0 = conditions[0]?.t ?? 0;
        const dtSec = sampleIntervalMs / 1000;
        const numFrames = conditions.length;

        // Each driver's own sample array can be trimmed at the edges relative to
        // the shared master timeline (e.g. a retiree simply has fewer samples) —
        // align by TIMESTAMP back onto the global frame index rather than
        // assuming raw array-index alignment across drivers.
        const carsByFrame: Record<string, unknown>[] = Array.from({ length: numFrames }, () => ({}));
        codes.forEach((abbr, i) => {
          const d = driverFiles[i];
          for (let k = 0; k < d.t.length; k++) {
            const idx = Math.round((d.t[k] - t0) / dtSec);
            if (idx < 0 || idx >= numFrames) continue;
            carsByFrame[idx][abbr] = {
              x: d.x[k],
              y: d.y[k],
              lap: d.lap[k],
              distance: d.cumulative_distance[k],
              compound: d.compound[k],
              tyre_life: d.tyre_life[k],
              in_pit: d.in_pit[k],
              speed: d.speed[k],
              gear: d.gear[k],
              throttle: d.throttle[k],
              brake: d.brake[k],
            };
          }
        });

        const frames = conditions.map((c, i) => ({
          t: c.t,
          flag: c.flag,
          weather: {
            air_temp: c.air_temp,
            track_temp: c.track_temp,
            humidity: c.humidity,
            wind_speed: c.wind_speed,
          },
          cars: carsByFrame[i],
        }));

        const team_colors: Record<string, string> = {};
        codes.forEach((abbr) => { team_colors[abbr] = manifest[abbr].team_color; });

        const data = {
          meta: {
            sample_interval_ms: sampleIntervalMs,
            bounds: track.bounds,
            avg_lap_length: track.avg_lap_length,
            team_colors,
            total_laps: track.total_laps,
            results: {},
          },
          track_outline: track.track_outline,
          frames,
        };

        if (cancelled) return;
        setRaceData(data);
        setFrameIndex(0);
        setLoading(false);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
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

  // Contiguous stretches of the race under a flag, for the bands on the playbar. VSC and
  // "VSC ending" are one band (same restriction on track), and each stretch runs from its
  // first frame to the frame before the status changes.
  const flagSegments = useMemo(() => {
    if (!raceData) return [];
    const kind = (f: string) => (f === "vsc_ending" ? "vsc" : f);
    const out: { kind: string; start: number; end: number }[] = [];
    raceData.frames.forEach((frame: { flag?: string }, i: number) => {
      const k = kind(frame.flag || "clear");
      if (k === "clear") return;
      const last = out[out.length - 1];
      if (last && last.kind === k && last.end === i - 1) last.end = i;
      else out.push({ kind: k, start: i, end: i });
    });
    return out;
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
          className="flex-shrink-0 grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-5 h-14 border-b border-neutral-800/60"
          style={{
            background: flagMeta.bg
              ? `linear-gradient(90deg, #111111 60%, ${flagMeta.bg})`
              : "#111111",
            transition: "background 0.6s ease",
          }}
        >
          <div className="@container flex items-center gap-5 min-w-0">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors text-sm font-bold tracking-wider group flex-shrink-0"
            >
              <span className="text-lg group-hover:-translate-x-0.5 transition-transform">
                ✕
              </span>
              Exit
            </button>

            {/* Track conditions as a small two-row readout in the bar, not a box over the
                map. Shown when the bar has room for it (a container query on this cell,
                so it follows the space actually left beside Exit and the title rather
                than the window width). */}
            <div className="hidden @[290px]:grid grid-cols-2 gap-x-5 gap-y-0.5 font-mono text-[10px] text-neutral-500 whitespace-nowrap leading-tight">
              {WEATHER_ROWS(weather).map(([label, value]) => (
                <span key={label} className="flex items-baseline gap-1.5">
                  <span className="text-[9px] font-sans font-bold tracking-widest">{label}</span>
                  <span className="text-neutral-200 font-bold tabular-nums">{value}</span>
                </span>
              ))}
            </div>
          </div>

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

          <div className="flex justify-end items-center gap-3">
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

            {/* Data-source note: out of the way until asked for. */}
            <div className="relative group">
              <button
                type="button"
                aria-label="About this data"
                className="w-5 h-5 rounded-full border border-neutral-700 text-neutral-500 text-[10px] font-black leading-none hover:text-white hover:border-neutral-500 focus:text-white focus:border-neutral-500 transition-colors"
              >
                i
              </button>
              <div className="absolute right-0 top-full mt-2 w-72 z-50 hidden group-hover:block group-focus-within:block bg-neutral-900 border border-neutral-800 rounded-xl p-3 shadow-2xl">
                <DataSourceNote variant="panel" />
                <p className="mt-2 text-[10px] leading-relaxed font-mono text-neutral-500">
                  The race order and gaps can be slightly off on the first lap.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── TRACK AREA ── */}
        <div className="flex-1 min-h-0 relative">
          {selectedDriver && currentFrame.cars[selectedDriver] && (
            <div className="absolute top-4 left-4 z-40 w-52 bg-neutral-900/90 border border-neutral-700 rounded-xl p-3.5 shadow-2xl backdrop-blur-md">
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
            rotation={trackRotation(gp)}
            flag={flag}
            transitionMs={currentTransitionMs}
            showNames={showNames}
            retiredDrivers={retiredDrivers}
          />
        </div>

        {/* ── PLAYBAR ── */}
        <div className="flex-shrink-0 px-6 pb-5 pt-3 bg-[#080808] border-t border-neutral-800/50">
          {flagSegments.length > 0 && (
            <div className="mb-1.5 flex flex-wrap items-center justify-end gap-x-4 gap-y-1 text-[9px] font-bold uppercase tracking-widest text-neutral-500">
              {FLAG_BAND_ORDER.filter((k) => flagSegments.some((seg) => seg.kind === k)).map((k) => (
                <span key={k} className="flex items-center gap-1.5">
                  <span className="h-1.5 w-3 rounded-[1px]" style={FLAG_BAND_STYLE[k]} />
                  {FLAG_BAND_LABEL[k]}
                </span>
              ))}
            </div>
          )}
          <div className="relative mb-3 group">
            <div className="absolute inset-0 flex items-center pointer-events-none">
              <div className="w-full h-0.5 bg-neutral-800 rounded-full" />
              {flagSegments.map((seg, i) => (
                <div
                  key={i}
                  className="absolute h-1.5 rounded-[1px] opacity-90"
                  style={{
                    left: `${(seg.start / Math.max(totalFrames - 1, 1)) * 100}%`,
                    width: `max(2px, ${((seg.end - seg.start + 1) / Math.max(totalFrames - 1, 1)) * 100}%)`,
                    ...FLAG_BAND_STYLE[seg.kind],
                  }}
                />
              ))}
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
