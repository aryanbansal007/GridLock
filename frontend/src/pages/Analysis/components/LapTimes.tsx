import { useEffect, useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { lapsUrl, driverStyles, fmtLapTime, type SessionLaps, type DriverManifest } from '../../../lib/telemetry';

interface Props {
  year: string; gp: string; session: string;
  drivers: string[]; manifest: DriverManifest;
  colorOverrides?: Record<string, string>;
}

type LapsState = SessionLaps | 'loading' | 'missing' | 'error';

export default function LapTimes({ year, gp, session, drivers: codes, colorOverrides }: Props) {
  const [laps, setLaps] = useState<LapsState>('loading');

  useEffect(() => {
    let cancelled = false;
    setLaps('loading');
    fetch(lapsUrl(year, gp, session))
      .then(r => (r.status === 404 ? 'missing' : r.ok ? r.json() : 'error'))
      .then(d => { if (!cancelled) setLaps(d); })
      .catch(() => { if (!cancelled) setLaps('error'); });
    return () => { cancelled = true; };
  }, [year, gp, session]);

  const present = useMemo(() => (typeof laps === 'object' ? codes.filter(c => laps[c]) : []), [laps, codes]);
  const styles = useMemo(() => {
    if (typeof laps !== 'object') return {} as ReturnType<typeof driverStyles>;
    return driverStyles(present.map(c => ({ driver: c, team_color: laps[c].team_color })), colorOverrides);
  }, [laps, present, colorOverrides]);

  // Lap-time-vs-lap rows (accurate laps only — drops pit in/out & SC laps that
  // would spike the chart). connectNulls bridges the dropped laps.
  const data = useMemo(() => {
    if (typeof laps !== 'object') return [];
    const maxLap = Math.max(0, ...present.map(c => Math.max(0, ...laps[c].laps.map(l => l.lap ?? 0))));
    const rows: Record<string, number | null>[] = [];
    for (let n = 1; n <= maxLap; n++) {
      const row: Record<string, number | null> = { lap: n };
      for (const c of present) {
        const e = laps[c].laps.find(l => l.lap === n);
        row[c] = e && e.is_accurate && e.lap_time_s != null ? e.lap_time_s : null;
      }
      rows.push(row);
    }
    return rows;
  }, [laps, present]);

  const isQuali = session === 'Q' || session === 'SQ';
  const hasQuali = typeof laps === 'object' && present.some(c => laps[c].quali);
  const hasLapData = data.some(row => present.some(c => row[c] != null));

  if (laps === 'loading') return <div className="rounded-2xl bg-[#0d0e12] border border-white/5 h-[480px] animate-pulse" />;
  if (laps === 'missing') return <Panel msg="No lap data for this session yet — use Generate analysis above." />;
  if (laps === 'error') return <Panel msg="Could not load lap data." />;
  if (present.length === 0) return <Panel msg="Selected drivers have no lap data in this session." />;

  return (
    <div className="flex flex-col gap-4">
      {/* Q1/Q2/Q3 for qualifying */}
      {isQuali && hasQuali && (
        <div className="rounded-2xl bg-[#0d0e12] border border-white/5 p-5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-300 mb-4">Qualifying Segments</h3>
          <div className="grid gap-2" style={{ gridTemplateColumns: '1fr repeat(3, 90px)' }}>
            <div />
            <Head>Q1</Head><Head>Q2</Head><Head>Q3</Head>
            {present.map(c => {
              const q = laps[c].quali;
              return (
                <div key={c} className="contents">
                  <div className="flex items-center gap-2 py-1">
                    <span className="w-1 h-5 rounded-full" style={{ background: styles[c].color }} />
                    <span className="text-sm font-bold text-white">{c}</span>
                  </div>
                  <QCell>{q?.q1}</QCell><QCell>{q?.q2}</QCell><QCell hi>{q?.q3}</QCell>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="rounded-2xl bg-[#0d0e12] border border-white/5 p-4">
        <div className="flex items-baseline justify-between mb-2">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-300">Lap Times</h3>
          <span className="text-[10px] font-mono text-gray-600">lap time vs lap · outlier laps removed</span>
        </div>
        {hasLapData ? (
          <ResponsiveContainer width="100%" height={380}>
            <LineChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 4 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="lap" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} tickLine={false}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} label={{ value: 'Lap', position: 'insideBottom', offset: -2, fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} />
              <YAxis domain={['dataMin - 0.5', 'dataMax + 0.5']} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                tickLine={false} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickFormatter={fmtLapTime} width={56} />
              <Tooltip contentStyle={{ background: 'rgba(10,10,12,0.95)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, fontSize: 11 }}
                labelFormatter={(v) => `Lap ${v}`} formatter={(val, name) => [fmtLapTime(typeof val === 'number' ? val : null), String(name)]} />
              {present.map(c => (
                <Line key={c} type="monotone" dataKey={c} name={c} stroke={styles[c].color} strokeDasharray={styles[c].dash || undefined}
                  dot={false} strokeWidth={1.8} connectNulls isAnimationActive animationDuration={1500} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="py-14 text-center text-gray-500 text-xs font-mono">No accurate timed laps to plot for these drivers.</div>
        )}
        <div className="flex gap-4 justify-center flex-wrap pt-2 text-[11px] font-mono">
          {present.map(c => <span key={c} style={{ color: styles[c].color }}>● {c}</span>)}
        </div>
      </div>
    </div>
  );
}

function Head({ children }: { children: React.ReactNode }) {
  return <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 text-right self-center">{children}</div>;
}
function QCell({ children, hi }: { children?: string | null; hi?: boolean }) {
  return <div className={`text-right font-mono py-1 ${hi ? 'text-white font-bold' : 'text-gray-300'}`}>{children ?? '—'}</div>;
}
function Panel({ msg }: { msg: string }) {
  return (
    <div className="rounded-2xl bg-[#0d0e12] border border-white/5 py-16 flex items-center justify-center">
      <div className="text-gray-500 text-xs font-mono text-center px-6">{msg}</div>
    </div>
  );
}
