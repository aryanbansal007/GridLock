export type NoticeKind = "penalty" | "investigation" | "cleared" | "track_limits" | "noted";

export interface Notice {
  t: number;
  lap: number | null;
  kind: NoticeKind;
  title: string;
  drivers: string[];
  detail: string;
}

/** How long a notice stays on screen, in seconds of REAL time (it is stretched by the replay
 *  speed, so a notice lasts as long at 10x as it does at 1x). */
export const NOTICE_DWELL_S = 7;
export const MAX_NOTICES_SHOWN = 3;

/** Notices that should be on screen at replay time `t`, newest first. */
export function activeNotices(notices: Notice[], t: number, speed: number): Notice[] {
  const window = NOTICE_DWELL_S * Math.max(speed, 1);
  const out: Notice[] = [];
  for (let i = notices.length - 1; i >= 0 && out.length < MAX_NOTICES_SHOWN; i--) {
    const n = notices[i];
    if (n.t <= t && t < n.t + window) out.push(n);
  }
  return out;
}
