import { useState } from 'react';
import { SNAP, COLOR_A, COLOR_B, fmtLap } from './data';
import { Panel, TrackMap, Tag, CompoundDot, HistoricalBadge, SectionHead } from './parts';
import { TelemetryStack, StintChart } from './charts';
import { useInView, useReplay, orderAt } from './hooks';

const SPEEDS = [1, 2, 4];

export function PlatformPreview() {
  const { ref, inView } = useInView<HTMLDivElement>({ track: true, margin: '0px' });
  const [speed, setSpeed] = useState(2);
  const replay = useReplay(inView, speed);
  const order = orderAt(replay.frame);
  const elapsed = replay.frame * SNAP.replay.step;
  const w = SNAP.weather;

  return (
    <section id="platform" className="scroll-mt-16 border-b border-[#24262B] bg-[#050505] py-20 md:py-28" aria-labelledby="platform-title">
      <div className="mx-auto max-w-[1320px] px-5 sm:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div id="platform-title">
            <SectionHead index="01" kicker="The platform" title={<>A pit wall in your browser.</>}>
              This is the actual workstation, running on a recorded session: lap {SNAP.replay.lap} of the {SNAP.session.year} {SNAP.session.name}, with real car positions, intervals, telemetry and tyre strategy.
            </SectionHead>
          </div>
          <HistoricalBadge className="self-start md:self-auto" />
        </div>

        <div ref={ref} className="mt-12 border border-[#24262B] bg-[#08090B] shadow-[0_40px_120px_-40px_rgba(225,6,0,0.25)]">
          {/* Session bar */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-[#24262B] px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 bg-[#E10600]" aria-hidden />
              <span className="text-[13px] font-black tracking-[-0.01em] text-[#F5F5F5]">{SNAP.session.name}</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#C5C9D1]">{SNAP.session.year} · Race · Monza</span>
            </div>
            <div className="font-mono text-[11px] tabular-nums text-[#F5F5F5]">LAP {SNAP.replay.lap}<span className="text-[#A7ACB6]">/{SNAP.session.total_laps}</span></div>
            <dl className="ml-auto hidden items-center gap-5 font-mono text-[10px] tabular-nums sm:flex">
              {[['AIR', `${w.air_temp.toFixed(1)}°C`], ['TRACK', `${w.track_temp.toFixed(1)}°C`], ['HUM', `${w.humidity.toFixed(0)}%`], ['WIND', `${w.wind_speed.toFixed(1)} m/s`]].map(([k, v]) => (
                <div key={k} className="flex gap-1.5"><dt className="text-[#A7ACB6]">{k}</dt><dd className="text-[#F5F5F5]">{v}</dd></div>
              ))}
            </dl>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Leaderboard */}
            <div className="order-2 border-t border-[#24262B] lg:order-1 lg:col-span-3 lg:border-t-0 lg:border-r">
              <div className="flex items-center justify-between border-b border-[#24262B] px-3 py-2">
                <Tag>Running order</Tag>
                <Tag>Interval</Tag>
              </div>
              <ol>
                {order.map((c, i) => (
                  <li key={c.code} className="flex items-center gap-2.5 border-b border-[#14161A] px-3 py-[7px] font-mono text-[12px] tabular-nums">
                    <span className="w-4 text-right text-[#A7ACB6]">{i + 1}</span>
                    <span className="h-3.5 w-[3px]" style={{ background: c.color }} aria-hidden />
                    <span className="w-9 font-bold text-[#F5F5F5]">{c.code}</span>
                    <CompoundDot compound={c.compound} size={15} />
                    <span className="ml-auto text-[#C5C9D1]">
                      {i === 0 ? 'Leader' : c.interval != null ? `+${c.interval.toFixed(1)}` : '—'}
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Track + transport */}
            <div className="order-1 flex flex-col lg:order-2 lg:col-span-5">
              <div className="relative flex-1 px-4 pt-4">
                <TrackMap frame={replay.frame} className="h-auto w-full" />
              </div>
              <div className="flex items-center gap-3 border-t border-[#24262B] px-4 py-3">
                <button
                  type="button"
                  onClick={() => replay.setPlaying(!replay.playing)}
                  aria-label={replay.playing ? 'Pause replay' : 'Play replay'}
                  className="flex h-9 w-9 shrink-0 items-center justify-center bg-[#F5F5F5] text-[#050505] transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF2D24]"
                >
                  {replay.playing
                    ? <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden><rect x="2" y="1" width="3" height="10" fill="currentColor" /><rect x="7" y="1" width="3" height="10" fill="currentColor" /></svg>
                    : <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden><path d="M3 1l8 5-8 5z" fill="currentColor" /></svg>}
                </button>
                <label className="flex flex-1 items-center gap-3">
                  <span className="sr-only">Replay position within lap {SNAP.replay.lap}</span>
                  <input
                    type="range" min={0} max={replay.frames - 1} step={0.1} value={replay.frame}
                    onChange={(e) => { replay.setPlaying(false); replay.seek(Number(e.target.value)); }}
                    className="gl-range h-1 flex-1"
                  />
                </label>
                <span className="w-14 text-right font-mono text-[11px] tabular-nums text-[#F5F5F5]">+{elapsed.toFixed(1)}s</span>
                <div className="hidden gap-1 sm:flex" role="group" aria-label="Playback speed">
                  {SPEEDS.map((s) => (
                    <button
                      key={s} type="button" onClick={() => setSpeed(s)} aria-pressed={speed === s}
                      className={`px-2 py-1 font-mono text-[10px] font-bold ${speed === s ? 'bg-[#E10600] text-white' : 'text-[#C5C9D1] hover:text-[#F5F5F5]'}`}
                    >
                      {s}×
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Telemetry */}
            <div className="order-3 border-t border-[#24262B] lg:col-span-4 lg:border-t-0 lg:border-l">
              <div className="flex items-center justify-between border-b border-[#24262B] px-3 py-2">
                <Tag>Fastest-lap telemetry</Tag>
                <span className="flex gap-3 font-mono text-[10px]">
                  <span style={{ color: COLOR_A }}>━ {SNAP.compare.a.code} {fmtLap(SNAP.compare.a.lap_time)}</span>
                  <span style={{ color: COLOR_B }}>┅ {SNAP.compare.b.code} {fmtLap(SNAP.compare.b.lap_time)}</span>
                </span>
              </div>
              <div className="p-3">
                <TelemetryStack compact rows={['speed', 'throttle', 'brake', 'delta']} width={420} />
                <p className="mt-2 font-mono text-[9.5px] text-[#A7ACB6]">Hover for values · laps {SNAP.compare.a.lap} and {SNAP.compare.b.lap} on a shared distance axis</p>
              </div>
            </div>

            {/* Strategy */}
            <div className="order-4 border-t border-[#24262B] lg:col-span-12">
              <Panel title="Tyre strategy · top ten" meta={<span className="flex gap-3"><span className="text-[#E10600]">■ red flag</span><span className="text-[#D97706]">■ VSC</span></span>} className="border-0">
                <div className="overflow-x-auto px-3 py-3">
                  <div className="hidden lg:block"><StintChart rows={6} width={1240} /></div>
                  <div className="min-w-[560px] lg:hidden"><StintChart rows={6} /></div>
                </div>
              </Panel>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
