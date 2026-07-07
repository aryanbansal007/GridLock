import { useMemo } from 'react';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import {
  buildComparisonGrid, buildMultiSeriesGrid, driverStyles, fmtLapTime, resolveLapRange, selectedLapInfo,
  type DriverManifest, type DriverTelemetry, type LapSelection,
} from '../../../lib/telemetry';
import { useDriverSet } from '../useDriverSet';

interface Props {
  year: string; gp: string; session: string;
  segment?: number | null;
  drivers: string[]; manifest: DriverManifest;
  colorOverrides?: Record<string, string>;
}

const AXIS = { stroke: 'rgba(255,255,255,0.25)', fontSize: 10 };
const GRID = 'rgba(255,255,255,0.06)';
const TOOLTIP_STYLE = { background: 'rgba(10,10,12,0.95)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, fontSize: 12 };

export default function TelemetryComparison({ year, gp, session, segment, drivers: codes, colorOverrides }: Props) {
  const { drivers, loading, error } = useDriverSet(year, gp, session, codes);
  const sel = useMemo<LapSelection>(() => (segment ? { segment } : 'fastest'), [segment]);
  // Only drivers who actually have a lap in the chosen context (e.g. a driver
  // knocked out in Q1 has no Q3 lap) — filter them out so the charts stay clean.
  const list = useMemo(
    () => codes.map(c => drivers[c]).filter((d): d is DriverTelemetry => !!d && resolveLapRange(d, sel) !== null),
    [codes, drivers, sel],
  );

  const styles = useMemo(() => driverStyles(list.map(d => ({ driver: d.driver, team_color: d.team_color })), colorOverrides), [list, colorOverrides]);
  const multiData = useMemo(() => buildMultiSeriesGrid(list, sel), [list, sel]);
  const isPair = list.length === 2;
  const deltaData = useMemo(() => (isPair ? buildComparisonGrid(list[0], list[1], sel) : []), [isPair, list, sel]);

  if (loading) return <div className="rounded-2xl bg-[#0d0e12] border border-white/5 h-[520px] animate-pulse" />;
  if (error || list.length === 0) return <Panel><Empty msg={error ?? (segment ? `No driver has a Q${segment} lap in this selection.` : 'No telemetry available')} /></Panel>;
  if (multiData.length === 0) return <Panel><Empty msg="Could not resolve a lap for the selected driver(s) in this session." /></Panel>;

  return (
    <div className="flex flex-col gap-4">
      {/* Fastest-lap header */}
      <div className="flex flex-wrap items-center gap-6 rounded-2xl bg-[#0d0e12] border border-white/5 px-5 py-4">
        {list.map(d => {
          // The actual lap being visualized — NOT d.fastest_lap, which is always the
          // session-wide fastest and would show the same number/time regardless of
          // which Q1/Q2/Q3 segment (or explicit lap) is currently selected.
          const info = selectedLapInfo(d, sel);
          return (
            <LapPill key={d.driver} code={d.driver} name={d.full_name} color={styles[d.driver].color} dash={styles[d.driver].dash}
              time={fmtLapTime(info?.timeS ?? d.fastest_lap?.lap_time_s)} lap={info?.lapNumber ?? d.fastest_lap?.lap_number} />
          );
        })}
        <div className="ml-auto text-[10px] text-gray-500 font-mono">{segment ? `Q${segment} lap` : 'Fastest lap'} · aligned by track distance</div>
      </div>

      <ChartCard title="Speed" unit="km/h">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={multiData} margin={{ top: 6, right: 12, left: -8, bottom: 0 }}>
            <CartesianGrid stroke={GRID} />
            <XAxis dataKey="distance" tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} unit="m" />
            <YAxis tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} width={38} />
            <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: '#aaa' }} labelFormatter={(v) => `${v} m`} />
            {list.map(d => (
              <Line key={d.driver} type="monotone" dataKey={`${d.driver}_speed`} name={d.driver} stroke={styles[d.driver].color} strokeDasharray={styles[d.driver].dash || undefined} dot={false} strokeWidth={1.8} isAnimationActive animationDuration={1500} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {isPair && (
        <ChartCard title="Speed Delta" unit={`km/h · ${list[0].driver} − ${list[1].driver}`}>
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={deltaData} margin={{ top: 6, right: 12, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="deltaFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={styles[list[0].driver].color} stopOpacity={0.5} />
                  <stop offset="50%" stopColor={styles[list[0].driver].color} stopOpacity={0.05} />
                  <stop offset="50%" stopColor={styles[list[1].driver].color} stopOpacity={0.05} />
                  <stop offset="100%" stopColor={styles[list[1].driver].color} stopOpacity={0.5} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={GRID} />
              <XAxis dataKey="distance" tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} unit="m" />
              <YAxis tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} width={38} />
              <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: '#aaa' }} labelFormatter={(v) => `${v} m`} />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.3)" />
              <Area type="monotone" dataKey="speed_delta" name={`${list[0].driver} − ${list[1].driver}`} stroke="rgba(255,255,255,0.35)" fill="url(#deltaFill)" strokeWidth={1} isAnimationActive animationDuration={1500} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex justify-between px-2 pt-1 text-[10px] font-mono text-gray-500">
            <span style={{ color: styles[list[0].driver].color }}>▲ {list[0].driver} faster</span>
            <span style={{ color: styles[list[1].driver].color }}>▼ {list[1].driver} faster</span>
          </div>
        </ChartCard>
      )}
      {!isPair && (
        <div className="rounded-xl bg-white/[0.02] border border-white/5 px-4 py-2.5 text-[11px] text-gray-500 font-mono">
          Speed delta is only shown when exactly 2 drivers are selected.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Throttle" unit="%">
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={multiData} margin={{ top: 6, right: 12, left: -8, bottom: 0 }}>
              <CartesianGrid stroke={GRID} />
              <XAxis dataKey="distance" tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} unit="m" />
              <YAxis tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} width={30} domain={[0, 100]} />
              <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: '#aaa' }} labelFormatter={(v) => `${v} m`} />
              {list.map(d => (
                <Line key={d.driver} type="monotone" dataKey={`${d.driver}_throttle`} name={d.driver} stroke={styles[d.driver].color} strokeDasharray={styles[d.driver].dash || undefined} dot={false} strokeWidth={1.6} isAnimationActive animationDuration={1500} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Brake" unit="%">
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={multiData} margin={{ top: 6, right: 12, left: -8, bottom: 0 }}>
              <CartesianGrid stroke={GRID} />
              <XAxis dataKey="distance" tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} unit="m" />
              <YAxis tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} width={30} domain={[0, 100]} />
              <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: '#aaa' }} labelFormatter={(v) => `${v} m`} />
              {list.map(d => (
                <Line key={d.driver} type="stepAfter" dataKey={`${d.driver}_brake`} name={d.driver} stroke={styles[d.driver].color} strokeDasharray={styles[d.driver].dash || undefined} dot={false} strokeWidth={1.6} isAnimationActive animationDuration={1500} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function LapPill({ code, name, color, dash, time, lap }: { code: string; name: string; color: string; dash?: string; time: string; lap?: number | null }) {
  return (
    <div className="flex items-center gap-3">
      {/* solid bar for solid lines; dashed bar when this driver's chart line is dashed (same-team differentiation) */}
      <span className="w-1.5 h-9 rounded-full" style={dash ? { background: `repeating-linear-gradient(${color} 0 4px, transparent 4px 7px)` } : { background: color }} />
      <div>
        <div className="text-sm font-black text-white leading-tight">{code} <span className="text-gray-500 font-medium">· {name}</span></div>
        <div className="font-mono text-lg font-bold" style={{ color }}>{time}{lap != null && <span className="text-[10px] text-gray-500 ml-2">Lap {lap}</span>}</div>
      </div>
    </div>
  );
}

function ChartCard({ title, unit, children }: { title: string; unit?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-[#0d0e12] border border-white/5 p-4">
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-300">{title}</h3>
        {unit && <span className="text-[10px] font-mono text-gray-600">{unit}</span>}
      </div>
      {children}
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl bg-[#0d0e12] border border-white/5 py-16 flex items-center justify-center">{children}</div>;
}
function Empty({ msg }: { msg: string }) {
  return <div className="text-gray-500 text-xs font-mono text-center px-6">{msg}</div>;
}
