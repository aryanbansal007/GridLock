import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { SNAP, COLOR_A, COLOR_B, STATE_META, STATUS_META, fmtLap, pathD, stateShares, type DrivingState } from './data';
import { SectionHead, Tag, TrackMap, HistoricalBadge, CompoundDot } from './parts';
import { TelemetryStack, StintChart, StateStrip, StatePath } from './charts';
import { useInView } from './hooks';
import { SEASON_YEAR, seasonUrl, type CalendarResponse, type StandingsResponse } from '../../lib/f1';

const C = SNAP.compare;

/** Fade/rise a block in once it scrolls into view. */
function Reveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div ref={ref} className={`gl-reveal ${inView ? 'is-in' : ''} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

// ── A · Telemetry comparison ────────────────────────────────────────────────
export function TelemetryFeature() {
  return (
    <section id="telemetry" className="scroll-mt-16 border-b border-[#24262B] py-20 md:py-28" aria-labelledby="telemetry-title">
      <div className="mx-auto max-w-[1320px] px-5 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-5" id="telemetry-title">
            <SectionHead index="02" kicker="Telemetry comparison" title="Two drivers. One track. Every detail.">
              Compare driver performance across a shared distance axis and investigate where lap time is gained or lost.
            </SectionHead>
          </div>
          <div className="lg:col-span-7">
            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              {[C.a, C.b].map((d, i) => (
                <div key={d.code} className="flex items-center gap-3 border border-[#24262B] bg-[#0B0D10] px-3 py-2">
                  <svg width="22" height="6" aria-hidden><line x1="0" y1="3" x2="22" y2="3" stroke={i ? COLOR_B : COLOR_A} strokeWidth="2" strokeDasharray={i ? '4 3' : undefined} /></svg>
                  <span className="text-[13px] font-bold text-[#F5F5F5]">{d.name}</span>
                  <span className="font-mono text-[11px] tabular-nums text-[#969BA5]">L{d.lap} · {fmtLap(d.lap_time)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Reveal className="mt-10 border border-[#24262B] bg-[#0B0D10] p-4 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <Tag tone="text">Speed · throttle · brake · gear · delta — by track distance</Tag>
            <HistoricalBadge />
          </div>
          <div className="-mx-1 overflow-x-auto px-1">
            <div className="min-w-[680px]"><TelemetryStack /></div>
          </div>
          <div className="mt-4 grid gap-3 border-t border-[#24262B] pt-4 sm:grid-cols-4">
            {SNAP.compare.brakeZones.map((z, i) => (
              <div key={z.d} className="font-mono text-[11px] tabular-nums">
                <span className="text-[#FF2D24]">B{i + 1}</span>
                <span className="ml-2 text-[#969BA5]">{(z.d / 1000).toFixed(2)} km</span>
                <span className="ml-2 text-[#F5F5F5]">min {z.v} km/h</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[12px] text-[#6B7079]">Braking zones B1–B{SNAP.compare.brakeZones.length} are found from the data itself, where {C.a.code}'s brake is applied and speed bottoms out.</p>
        </Reveal>
      </div>
    </section>
  );
}

// ── B · Race simulator ──────────────────────────────────────────────────────
export function SimulatorFeature() {
  const navigate = useNavigate();
  const status = SNAP.lapStatus;
  const pits = SNAP.strategy.slice(0, 5).map((r) => ({ code: r.code, color: r.color, laps: r.stints.slice(1).map((s) => s.from) }));
  const total = SNAP.session.total_laps;
  const events = useMemo(() => {
    const out: { from: number; to: number; s: string }[] = [];
    status.forEach((s, i) => {
      if (s === 'clear' || s === 'yellow') return;
      const last = out[out.length - 1];
      if (last && last.s === s && last.to === i) last.to = i + 1;
      else out.push({ from: i + 1, to: i + 1, s });
    });
    return out;
  }, [status]);

  return (
    <section id="simulator" className="scroll-mt-16 border-b border-[#24262B] bg-[#08090B] py-20 md:py-28" aria-labelledby="sim-title">
      <div className="mx-auto grid max-w-[1320px] gap-12 px-5 sm:px-8 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-5" id="sim-title">
          <SectionHead index="03" kicker="Full race simulator" title="Replay the race. Understand every move.">
            Reconstruct race progression using available session telemetry, car positions, lap timing, and pit-stop information.
          </SectionHead>
          <ul className="mt-8 space-y-3 text-[14px] text-[#C9CCD1]">
            {['Every car on the circuit at its recorded position', 'Leaderboard with intervals and tyre compounds', 'Flags, safety cars and pit stops on a scrubbable timeline'].map((t) => (
              <li key={t} className="flex gap-3"><span className="mt-2 h-px w-4 shrink-0 bg-[#E10600]" aria-hidden />{t}</li>
            ))}
          </ul>
          <button type="button" onClick={() => navigate('/simulator-setup')} className="mt-8 border border-[#24262B] px-5 py-3 text-[11px] font-black uppercase tracking-[0.14em] text-[#F5F5F5] transition-colors hover:border-[#969BA5] focus-visible:outline-2 focus-visible:outline-[#FF2D24]">
            Open the simulator →
          </button>
        </div>

        <Reveal className="lg:col-span-7">
          <div className="border border-[#24262B] bg-[#050505]">
            <div className="flex items-center justify-between border-b border-[#24262B] px-4 py-2.5">
              <Tag tone="text">Race timeline · {total} laps</Tag>
              <HistoricalBadge />
            </div>
            <div className="px-4 pt-5 pb-4">
              {/* Lap ruler with track-status bands */}
              <div className="relative h-9" role="img" aria-label={`Track status across ${total} laps: ${events.map((e) => `${STATUS_META[e.s].label} laps ${e.from}${e.to > e.from ? `–${e.to}` : ''}`).join(', ')}`}>
                <div className="absolute inset-x-0 top-3 h-3 bg-[#14161A]" />
                {events.map((e) => (
                  <div key={`${e.s}${e.from}`} className="absolute top-3 h-3" style={{ left: `${((e.from - 1) / total) * 100}%`, width: `${((e.to - e.from + 1) / total) * 100}%`, background: STATUS_META[e.s].color }} />
                ))}
                {events.map((e) => (
                  <span key={`l${e.s}${e.from}`} className="absolute top-[-6px] whitespace-nowrap font-mono text-[9px] font-bold uppercase tracking-[0.12em]" style={{ left: `${((e.from - 1) / total) * 100}%`, color: STATUS_META[e.s].color }}>
                    {STATUS_META[e.s].label} L{e.from}{e.to > e.from ? `–${e.to}` : ''}
                  </span>
                ))}
                <div className="absolute inset-x-0 top-7 flex justify-between font-mono text-[9px] text-[#6B7079]">
                  {[1, 10, 20, 30, 40, 50].map((l) => <span key={l}>L{l}</span>)}
                </div>
              </div>

              {/* Pit stops for the top five */}
              <div className="mt-6 space-y-2.5">
                {pits.map((p, i) => (
                  <div key={p.code} className="flex items-center gap-3">
                    <span className="w-12 font-mono text-[11px] font-bold text-[#F5F5F5]"><span className="text-[#6B7079]">P{i + 1} </span>{p.code}</span>
                    <div className="relative h-[3px] flex-1 bg-[#1A1C20]">
                      <div className="absolute inset-y-0 left-0 right-0" style={{ background: `linear-gradient(90deg, ${p.color}55, ${p.color})` }} />
                      {p.laps.map((l) => (
                        <span key={l} className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 border-2 border-[#050505] bg-[#F5F5F5]" style={{ left: `${((l - 1) / total) * 100}%` }} title={`Pit, lap ${l}`} />
                      ))}
                    </div>
                  </div>
                ))}
                <p className="pt-1 font-mono text-[10px] text-[#6B7079]">◆ tyre change · the lap {SNAP.lapStatus.indexOf('red') + 1} stops were taken under the red flag</p>
              </div>
            </div>
            <div className="grid grid-cols-2 border-t border-[#24262B] sm:grid-cols-4">
              {SNAP.strategy.slice(0, 4).map((r) => (
                <div key={r.code} className="border-r border-[#24262B] px-4 py-3 last:border-r-0">
                  <div className="font-mono text-[10px] text-[#6B7079]">P{r.pos} · from P{r.grid ?? '–'}</div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-[15px] font-black text-[#F5F5F5]">{r.code}</span>
                    <span className="flex gap-1">{r.stints.map((s, k) => <CompoundDot key={k} compound={s.c} size={14} />)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ── C · Race engineer AI ────────────────────────────────────────────────────
export function EngineerFeature() {
  return (
    <section id="features" className="scroll-mt-16 border-b border-[#24262B] py-20 md:py-28" aria-labelledby="ai-title">
      <div className="mx-auto grid max-w-[1320px] gap-12 px-5 sm:px-8 lg:grid-cols-12 lg:items-center">
        <Reveal className="order-2 lg:order-1 lg:col-span-6">
          <div className="border border-[#24262B] bg-[#0B0D10]">
            <div className="flex items-center justify-between border-b border-[#24262B] px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#2EB84B]" aria-hidden />
                <Tag tone="text">Race engineer · private channel</Tag>
              </div>
              <Tag>Illustrative</Tag>
            </div>
            <div className="space-y-5 p-5">
              <div className="ml-auto max-w-[85%]">
                <div className="mb-1 text-right font-mono text-[9px] uppercase tracking-[0.16em] text-[#6B7079]">Analyst</div>
                <p className="border border-[#24262B] bg-[#111318] px-4 py-3 text-[14px] text-[#F5F5F5]">
                  Where did Driver A lose time compared with Driver B?
                </p>
              </div>
              <div className="max-w-[90%]">
                <div className="mb-1 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-[#FF2D24]">
                  <span className="h-px w-3 bg-[#E10600]" aria-hidden />Race engineer
                </div>
                <div className="border-l-2 border-[#E10600] bg-[#08090B] px-4 py-3 text-[14px] leading-relaxed text-[#C9CCD1]">
                  Review the telemetry traces to identify the braking zones, acceleration phases, and corners responsible for the lap-time difference.
                </div>
              </div>
              <div className="flex items-center gap-2 border border-[#24262B] px-3 py-2.5 text-[13px] text-[#6B7079]">
                <span className="flex-1">Ask about strategy, rules, history…</span>
                <span className="font-mono text-[10px]">↵</span>
              </div>
            </div>
          </div>
          <p className="mt-3 font-mono text-[10px] text-[#6B7079]">Example conversation for illustration — not a recorded analysis.</p>
        </Reveal>
        <div className="order-1 lg:order-2 lg:col-span-5 lg:col-start-8" id="ai-title">
          <SectionHead index="04" kicker="Race Engineer AI" title="Ask the questions the timing screens cannot answer.">
            Investigate race strategy, driver comparisons, regulations, and historical performance with an AI assistant grounded in available data.
          </SectionHead>
        </div>
      </div>
    </section>
  );
}

// ── D · Driving state ───────────────────────────────────────────────────────
export function DrivingStateFeature() {
  const shares = stateShares();
  const order: DrivingState[] = ['full', 'partial', 'coast', 'brake'];
  return (
    <section className="border-b border-[#24262B] bg-[#08090B] py-20 md:py-28" aria-labelledby="state-title">
      <div className="mx-auto max-w-[1320px] px-5 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5" id="state-title">
            <SectionHead index="05" kicker="Driving state analysis" title="Understand how the lap was driven.">
              Examine throttle application, braking points, cornering phases, and lift-and-coast behavior across track distance.
            </SectionHead>
          </div>
          <dl className="grid grid-cols-2 gap-px self-end border border-[#24262B] bg-[#24262B] sm:grid-cols-4 lg:col-span-7">
            {order.map((k) => (
              <div key={k} className="bg-[#0B0D10] px-4 py-4">
                <dt className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#969BA5]">
                  <span className="h-2 w-2" style={{ background: STATE_META[k].color }} aria-hidden />{STATE_META[k].label}
                </dt>
                <dd className="mt-2 font-mono text-[26px] font-bold tabular-nums tracking-[-0.03em] text-[#F5F5F5]">
                  {(shares[k] * 100).toFixed(0)}<span className="text-[14px] text-[#6B7079]">%</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <Reveal className="mt-10 border border-[#24262B] bg-[#050505] p-4 sm:p-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <Tag tone="text">{C.a.name} · lap {C.a.lap} · {fmtLap(C.a.lap_time)}</Tag>
            <HistoricalBadge />
          </div>
          <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7">
              <TrackMap className="h-auto w-full" trackColor="#111318" highlight={<StatePath />} />
            </div>
            <div className="lg:col-span-5">
              <Tag>Along the lap</Tag>
              <StateStrip className="mt-3 h-7" />
              <div className="mt-1 flex justify-between font-mono text-[9px] text-[#6B7079]">
                {[0, 1, 2, 3, 4, 5].map((k) => <span key={k}>{k} km</span>)}
              </div>
              <ul className="mt-6 space-y-2">
                {SNAP.compare.brakeZones.map((z, i) => (
                  <li key={z.d} className="flex items-center gap-3 border-b border-[#14161A] pb-2 font-mono text-[11px] tabular-nums">
                    <span className="w-6 text-[#FF2D24]">B{i + 1}</span>
                    <span className="text-[#969BA5]">{(z.d / 1000).toFixed(2)} km</span>
                    <span className="ml-auto text-[#F5F5F5]">brakes to {z.v} km/h</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ── E · Season standings & calendar (live from the season data) ─────────────
export function SeasonFeature() {
  const [standings, setStandings] = useState<StandingsResponse | null | 'error'>(null);
  const [calendar, setCalendar] = useState<CalendarResponse | null | 'error'>(null);
  const { ref, inView } = useInView<HTMLElement>({ margin: '200px' });

  useEffect(() => {
    if (!inView) return;
    let cancelled = false;
    fetch(seasonUrl(SEASON_YEAR, 'standings')).then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => { if (!cancelled) setStandings(d); }).catch(() => { if (!cancelled) setStandings('error'); });
    fetch(seasonUrl(SEASON_YEAR, 'calendar')).then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => { if (!cancelled) setCalendar(d); }).catch(() => { if (!cancelled) setCalendar('error'); });
    return () => { cancelled = true; };
  }, [inView]);

  const drivers = standings && standings !== 'error' ? standings.drivers.slice(0, 6) : [];
  const teams = standings && standings !== 'error' ? standings.constructors.slice(0, 5) : [];
  const maxPts = drivers[0]?.points || 1;
  const races = calendar && calendar !== 'error' ? calendar.races.filter((r) => r.status !== 'cancelled') : [];
  const done = races.filter((r) => r.status === 'completed').length;
  const next = races.find((r) => r.status === 'upcoming' || r.status === 'ongoing');

  return (
    <section ref={ref} className="border-b border-[#24262B] py-20 md:py-28" aria-labelledby="season-title">
      <div className="mx-auto max-w-[1320px] px-5 sm:px-8">
        <div id="season-title">
          <SectionHead index="06" kicker="Season standings & calendar" title="The season, at a glance.">
            Explore driver and constructor standings, race results, and the season calendar using the data available in GridLock.
          </SectionHead>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-12">
          <Reveal className="min-w-0 border border-[#24262B] bg-[#0B0D10] lg:col-span-7">
            <div className="flex items-center justify-between border-b border-[#24262B] px-4 py-2.5">
              <Tag tone="text">Drivers' championship · {SEASON_YEAR}</Tag>
              <Tag>{standings && standings !== 'error' ? `after round ${standings.meta?.rounds_counted ?? '–'}` : ''}</Tag>
            </div>
            {standings === 'error' ? (
              <p className="px-4 py-10 text-[13px] text-[#6B7079]">Standings are unavailable right now.</p>
            ) : !standings ? (
              <div className="space-y-2 p-4">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-7 animate-pulse bg-[#111318]" />)}</div>
            ) : (
              <ol className="p-2">
                {drivers.map((d, i) => (
                  <li key={d.abbreviation} className="grid grid-cols-[28px_52px_1fr_auto] items-center gap-3 px-2 py-2">
                    <span className="font-mono text-[12px] text-[#6B7079] tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                    <span className="font-mono text-[13px] font-bold text-[#F5F5F5]">{d.abbreviation}</span>
                    <div className="h-[6px] bg-[#14161A]">
                      <div className="h-full" style={{ width: `${(d.points / maxPts) * 100}%`, background: `#${d.team_color}` }} />
                    </div>
                    <span className="w-16 text-right font-mono text-[13px] tabular-nums text-[#F5F5F5]">{d.points} <span className="text-[10px] text-[#6B7079]">pts</span></span>
                  </li>
                ))}
              </ol>
            )}
          </Reveal>

          <div className="grid min-w-0 grid-cols-1 gap-4 lg:col-span-5">
            <Reveal className="border border-[#24262B] bg-[#0B0D10]" delay={80}>
              <div className="border-b border-[#24262B] px-4 py-2.5"><Tag tone="text">Constructors</Tag></div>
              {standings === 'error' ? (
                <p className="px-4 py-6 text-[13px] text-[#6B7079]">Unavailable right now.</p>
              ) : (
                <ol className="divide-y divide-[#14161A]">
                  {(teams.length ? teams : Array.from({ length: 5 }).map(() => null)).map((t, i) => (
                    <li key={t?.name ?? i} className="flex items-center gap-3 px-4 py-2">
                      <span className="h-3 w-[3px]" style={{ background: t ? `#${t.color}` : '#24262B' }} aria-hidden />
                      <span className="text-[13px] font-semibold text-[#F5F5F5]">{t?.name ?? '—'}</span>
                      <span className="ml-auto font-mono text-[12px] tabular-nums text-[#969BA5]">{t ? `${t.points} pts` : ''}</span>
                    </li>
                  ))}
                </ol>
              )}
            </Reveal>
            <Reveal className="border border-[#24262B] bg-[#0B0D10] p-4" delay={160}>
              <div className="flex items-center justify-between"><Tag tone="text">Calendar</Tag><Tag>{races.length ? `${done}/${races.length} rounds` : ''}</Tag></div>
              <div className="mt-3 flex gap-[3px]" aria-hidden>
                {races.map((r) => <span key={`${r.race_id}${r.round}`} className={`h-6 flex-1 ${r.status === 'completed' ? 'bg-[#E10600]' : r === next ? 'border border-[#FF2D24] bg-[#FF2D24]/20' : 'bg-[#2A2D33]'}`} />)}
              </div>
              {calendar === 'error' ? <p className="mt-3 text-[13px] text-[#C9CCD1]">Calendar unavailable right now.</p>
                : next ? (
                  <div className="mt-3">
                    <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#FF2D24]">Next · Round {next.round}</p>
                    <p className="mt-1 text-[15px] font-bold text-[#F5F5F5]">{next.name}</p>
                    <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#C9CCD1]">{next.circuit}</p>
                  </div>
                ) : <p className="mt-3 text-[13px] text-[#C9CCD1]">{races.length ? 'Season complete.' : 'Loading calendar…'}</p>}
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── F · Tyre strategy & track dominance ─────────────────────────────────────
export function StrategyFeature() {
  const path = SNAP.compare.path;
  const pts = (from: number, to: number) => {
    const out: [number, number][] = [];
    for (let i = from; i <= to; i++) out.push([path[i * 2], path[i * 2 + 1]]);
    return out;
  };
  const winsA = SNAP.compare.dominance.filter((d) => d.faster === C.a.code).length;

  return (
    <section className="border-b border-[#24262B] bg-[#08090B] py-20 md:py-28" aria-labelledby="strategy-title">
      <div className="mx-auto max-w-[1320px] px-5 sm:px-8">
        <div id="strategy-title">
          <SectionHead index="07" kicker="Tyre strategy & track dominance" title="Every stint changes the equation.">
            Explore tyre compounds, stint lengths, pit timing, and sector-by-sector performance.
          </SectionHead>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-12">
          <Reveal className="min-w-0 border border-[#24262B] bg-[#050505] lg:col-span-7">
            <div className="flex items-center justify-between border-b border-[#24262B] px-4 py-2.5">
              <Tag tone="text">Stints · top ten finishers</Tag>
              <span className="flex gap-3 font-mono text-[10px]">
                {(['SOFT', 'MEDIUM', 'HARD'] as const).map((c) => <span key={c} className="flex items-center gap-1.5 text-[#969BA5]"><CompoundDot compound={c} size={12} />{c.toLowerCase()}</span>)}
              </span>
            </div>
            <div className="overflow-x-auto p-4"><div className="min-w-[520px]"><StintChart /></div></div>
          </Reveal>
          <Reveal className="min-w-0 border border-[#24262B] bg-[#050505] lg:col-span-5" delay={80}>
            <div className="flex items-center justify-between border-b border-[#24262B] px-4 py-2.5">
              <Tag tone="text">Track dominance · 24 mini-sectors</Tag>
            </div>
            <div className="p-4">
              <TrackMap
                className="h-auto w-full"
                trackColor="#15171B"
                highlight={SNAP.compare.dominance.map((d) => (
                  <path key={d.from} d={pathD(pts(d.from, d.to))} fill="none" stroke={d.faster === C.a.code ? COLOR_A : COLOR_B} strokeWidth={12} strokeLinecap="butt" strokeDasharray={d.faster === C.a.code ? undefined : '10 6'} />
                ))}
              />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] tabular-nums">
                <span style={{ color: COLOR_A }}>━ {C.a.code} faster in {winsA}</span>
                <span style={{ color: COLOR_B }}>┅ {C.b.code} faster in {SNAP.compare.dominance.length - winsA}</span>
                <HistoricalBadge />
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
