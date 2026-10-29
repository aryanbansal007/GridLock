import { NOTICE_DWELL_S, type Notice, type NoticeKind } from "../../../lib/raceControl";

const STYLE: Record<NoticeKind, { label: string; color: string; icon: string }> = {
  penalty: { label: "Penalty", color: "#ef4444", icon: "⛔" },
  investigation: { label: "Investigation", color: "#f59e0b", icon: "🔎" },
  cleared: { label: "Stewards", color: "#34d399", icon: "✓" },
  track_limits: { label: "Track limits", color: "#60a5fa", icon: "▭" },
  noted: { label: "Noted", color: "#fbbf24", icon: "!" },
};

/** An FIA race control message that drops in from the top of the map, stays a few seconds
 *  and fades away. It is one slim line that sits inside the map's top margin, so it never
 *  covers the circuit, and nothing is drawn while there is no message. The newest message is
 *  shown; any others still current take over as it leaves. */
const RaceControlNotices = ({ notices, colors }: { notices: Notice[]; colors: Record<string, string> }) => {
  const n = notices[0];
  if (!n) return null;
  const s = STYLE[n.kind];

  return (
    <div className="pointer-events-none absolute inset-x-0 top-1.5 z-30 flex justify-center px-4" role="status" aria-live="polite">
      <div
        key={`${n.t}-${n.drivers.join("")}-${n.title}`}
        className="flex h-[38px] max-w-full items-center gap-3 rounded-full border bg-neutral-950/85 py-1 pl-3 pr-4 shadow-[0_10px_30px_-8px_rgba(0,0,0,0.8)] backdrop-blur-md"
        style={{ borderColor: `${s.color}66`, animation: `gl-notice-life ${NOTICE_DWELL_S}s ease-in-out both` }}
      >
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] font-black"
          style={{ background: `${s.color}26`, color: s.color }}
          aria-hidden
        >
          {s.icon}
        </span>
        <span className="hidden shrink-0 text-[10px] font-black uppercase tracking-[0.16em] sm:inline" style={{ color: s.color }}>FIA · {s.label}</span>
        {n.lap != null && <span className="hidden shrink-0 font-mono text-[10px] text-neutral-500 md:inline">L{n.lap}</span>}
        <span className="flex shrink-0 items-center gap-1">
          {n.drivers.map((d) => (
            <span key={d} className="rounded px-1.5 py-0.5 text-[11px] font-black text-white" style={{ background: `${colors[d] || "#555"}cc` }}>{d}</span>
          ))}
        </span>
        <span className="shrink-0 text-[13px] font-bold text-white">{n.title}</span>
        {n.detail && <span className="hidden min-w-0 truncate text-[12px] text-neutral-400 md:inline">{n.detail}</span>}
        {notices.length > 1 && <span className="shrink-0 font-mono text-[10px] font-bold text-neutral-500">+{notices.length - 1}</span>}
      </div>
    </div>
  );
};

export default RaceControlNotices;
