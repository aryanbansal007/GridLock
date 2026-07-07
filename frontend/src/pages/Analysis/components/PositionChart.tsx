import { useEffect, useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { curveBumpX } from 'd3-shape';
import { lapsUrl, driverStyles, type SessionLaps, type DriverManifest } from '../../../lib/telemetry';

interface Props {
  year: string; gp: string; session: string;
  manifest: DriverManifest;
  highlighted?: string[]; // drivers selected elsewhere in the page — rendered with a heavier line
}

type LapsState = SessionLaps | 'loading' | 'missing' | 'error';

export default function PositionChart({ year, gp, session, highlighted = [] }: Props) {
  const [laps, setLaps] = useState<LapsState>('loading');
  // null = showing everyone (default). Once the user clicks a driver chip, we
  // switch to an explicit visible-set so individual drivers can be isolated.
  const [visible, setVisible] = useState<Set<string> | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLaps('loading');
    setVisible(null);
    fetch(lapsUrl(year, gp, session))
      .then(r => {
        if (r.status === 404) return 'missing' as const;
        if (!r.ok) return 'error' as const;
        return r.json();
      })
      .then((data) => { if (!cancelled) setLaps(data); })
      .catch(() => { if (!cancelled) setLaps('error'); });
    return () => { cancelled = true; };
  }, [year, gp, session]);

  const codes = useMemo(() => (typeof laps === 'object' ? Object.keys(laps) : []), [laps]);
  const styles = useMemo(() => {
    if (typeof laps !== 'object') return {} as ReturnType<typeof driverStyles>;
    return driverStyles(codes.map(c => ({ driver: c, team_color: laps[c].team_color })));
  }, [laps, codes]);

  const hasPositionData = typeof laps === 'object' && codes.some(c => laps[c].laps.some(l => l.position != null));

  const data = useMemo(() => {
    if (typeof laps !== 'object') return [];
    const maxLap = Math.max(0, ...codes.map(c => Math.max(0, ...laps[c].laps.map(l => l.lap ?? 0))));
    const rows: Record<string, number | null>[] = [];
    for (let lapNum = 1; lapNum <= maxLap; lapNum++) {
      const row: Record<string, number | null> = { lap: lapNum };
      for (const c of codes) {
        const entry = laps[c].laps.find(l => l.lap === lapNum);
        row[c] = entry?.position ?? null;
      }
      rows.push(row);
    }
    return rows;
  }, [laps, codes]);

  // Grid size varies by season (2026 runs 22 cars) — never hardcode the axis max,
  // or the bottom of the field silently gets clipped off the chart.
  const maxPos = useMemo(() => {
    if (typeof laps !== 'object') return 20;
    const m = Math.max(0, ...codes.map(c => Math.max(0, ...laps[c].laps.map(l => l.position ?? 0))));
    return Math.max(m, 1);
  }, [laps, codes]);
  const posTicks = useMemo(() => {
    const step = maxPos > 15 ? 5 : maxPos > 8 ? 2 : 1;
    const ticks: number[] = [];
    for (let p = 1; p <= maxPos; p += step) ticks.push(p);
    if (ticks[ticks.length - 1] !== maxPos) ticks.push(maxPos);
    return ticks;
  }, [maxPos]);

  const isShown = (code: string) => visible === null || visible.has(code);
  const toggle = (code: string) => {
    setVisible(prev => {
      const base = prev ?? new Set(codes); // first click: switch from "show all" to an explicit set
      const next = new Set(base);
      if (next.has(code)) next.delete(code); else next.add(code);
      return next;
    });
  };
  const showAll = () => setVisible(null);

  if (laps === 'loading') return <div className="rounded-2xl bg-[#0d0e12] border border-white/5 h-[480px] animate-pulse" />;
  if (laps === 'missing') return <Panel msg="No lap data for this session yet — use Generate analysis above." />;
  if (laps === 'error') return <Panel msg="Could not load lap data." />;
  if (!hasPositionData) return <Panel msg="Lap-by-lap position is only available for Race/Sprint sessions." />;

  return (
    <div className="rounded-2xl bg-[#0d0e12] border border-white/5 p-4">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-300">Lap-by-Lap Position</h3>
        <button onClick={showAll} className="text-[10px] font-mono text-gray-500 hover:text-white transition-colors">click a driver below to isolate · show all</button>
      </div>
      <ResponsiveContainer width="100%" height={420}>
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="lap" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} tickLine={false}
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            label={{ value: 'Lap', position: 'insideBottom', offset: -2, fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} />
          <YAxis reversed domain={[1, maxPos]} ticks={posTicks} allowDecimals={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
            tickLine={false} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickFormatter={(v) => `P${v}`} width={34} />
          <Tooltip content={<PositionTooltip styles={styles} />} />
          {codes.map(c => isShown(c) && (
            // curveBumpX (d3-shape) instead of a stepped line — it holds flat at each
            // position and eases through an S-curve only when the position actually
            // changes, matching the polished "bump chart" look used for F1 position
            // graphs, instead of sharp right-angle steps.
            <Line key={c} type={curveBumpX} dataKey={c} name={c} stroke={styles[c].color} strokeDasharray={styles[c].dash || undefined} dot={false}
              strokeWidth={highlighted.includes(c) ? 2.8 : 1.4} connectNulls isAnimationActive animationDuration={1500} />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-1.5 mt-3">
        {codes.map(c => (
          <button key={c} onClick={() => toggle(c)}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-mono font-bold transition-opacity"
            style={{ color: styles[c].color, opacity: isShown(c) ? 1 : 0.25, background: 'rgba(255,255,255,0.03)' }}>
            <span className="w-3 h-0.5 rounded-full" style={styles[c].dash ? { background: `repeating-linear-gradient(90deg, ${styles[c].color} 0 3px, transparent 3px 5px)` } : { background: styles[c].color }} />{c}
          </button>
        ))}
      </div>
    </div>
  );
}

// Recharts' default tooltip lists entries in <Line> declaration order (insertion
// order of the driver codes), not by current standing — sort by position
// (ascending, P1 first) so the hovered lap's list actually reads as a leaderboard.
function PositionTooltip({ active, payload, label, styles }: {
  active?: boolean; label?: number;
  payload?: { dataKey: string; value: number | null }[];
  styles: Record<string, { color: string; dash: string }>;
}) {
  if (!active || !payload?.length) return null;
  const rows = payload
    .filter(p => p.value != null)
    .sort((a, b) => (a.value as number) - (b.value as number));
  // A full 22-car grid doesn't fit one column without scrolling — and scrolling
  // isn't actually usable here since moving the mouse off the hovered point
  // makes the tooltip disappear. Split into two columns instead so the whole
  // field is visible at a glance with no scroll needed.
  const mid = Math.ceil(rows.length / 2);
  const cols = rows.length > 11 ? [rows.slice(0, mid), rows.slice(mid)] : [rows];
  return (
    <div style={{ background: 'rgba(10,10,12,0.95)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, fontSize: 11 }} className="px-3 py-2">
      <div className="text-[10px] text-gray-400 font-mono mb-1">Lap {label}</div>
      <div className="flex gap-4">
        {cols.map((col, ci) => (
          <div key={ci} className="flex flex-col gap-0.5">
            {col.map(r => (
              <div key={r.dataKey} className="flex items-center gap-2 text-[11px] font-mono">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: styles[r.dataKey]?.color }} />
                <span className="text-white font-bold w-9">{r.dataKey}</span>
                <span className="text-gray-300">P{r.value}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function Panel({ msg }: { msg: string }) {
  return (
    <div className="rounded-2xl bg-[#0d0e12] border border-white/5 py-16 flex items-center justify-center">
      <div className="text-gray-500 text-xs font-mono text-center px-6">{msg}</div>
    </div>
  );
}
