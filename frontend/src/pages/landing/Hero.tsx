import { useNavigate } from 'react-router-dom';
import { GarageScene } from './GarageCar';
import { SNAP, COLOR_A, COLOR_B, fmtLap, seriesD } from './data';
import { TrackMap, Tag, HistoricalBadge } from './parts';
import { useInView, useReplay } from './hooks';

const C = SNAP.compare;

export function Hero() {
  const navigate = useNavigate();
  const { ref, inView } = useInView<HTMLElement>({ track: true, margin: '0px' });
  const replay = useReplay(inView, 3);

  return (
    <section ref={ref} className="relative isolate overflow-hidden border-b border-[#24262B]" aria-labelledby="hero-title">
      {/* Scene: full-bleed on desktop, a banner under the copy on small screens */}
      <div className="absolute inset-0 -z-10 hidden lg:block">
        <GarageScene className="h-full w-full" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#050505_0%,#050505ee_28%,#05050588_52%,transparent_75%)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#050505] to-transparent" />
      </div>

      <div className="relative mx-auto grid max-w-[1320px] grid-cols-1 gap-10 px-5 pt-14 pb-12 sm:px-8 lg:min-h-[min(88vh,820px)] lg:grid-cols-12 lg:items-center lg:pt-20 lg:pb-20">
        <div className="lg:col-span-5">
          <div className="gl-rise mb-6 flex items-center gap-3">
            <span className="h-px w-8 bg-[#E10600]" aria-hidden />
            <Tag tone="red">The race engineering workstation</Tag>
          </div>

          <h1 id="hero-title" className="gl-rise text-[clamp(2.6rem,6vw,4.75rem)] font-black leading-[0.95] tracking-[-0.045em] text-[#F5F5F5]" style={{ animationDelay: '60ms' }}>
            Every millisecond tells a story.
          </h1>
          <p className="gl-rise mt-5 text-[clamp(1.1rem,1.7vw,1.4rem)] font-bold tracking-[-0.01em] text-[#FF2D24]" style={{ animationDelay: '120ms' }}>
            Find it. Compare it. Own the data.
          </p>
          <p className="gl-rise mt-5 max-w-[34rem] text-[15px] leading-relaxed text-[#C5C9D1]" style={{ animationDelay: '180ms' }}>
            Explore real Formula 1 telemetry, replay entire races, compare driver performance,
            and uncover tyre strategy lap by lap.
          </p>

          <div className="gl-rise mt-8 flex flex-wrap items-center gap-3" style={{ animationDelay: '240ms' }}>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="group inline-flex items-center gap-3 bg-[#E10600] px-6 py-3.5 text-[12px] font-black uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#FF2D24] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF2D24]"
            >
              Enter the paddock
              <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
            </button>
            <a
              href="#platform"
              className="inline-flex items-center gap-2 border border-[#24262B] bg-[#0B0D10]/70 px-6 py-3.5 text-[12px] font-black uppercase tracking-[0.14em] text-[#F5F5F5] transition-colors hover:border-[#C5C9D1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF2D24]"
            >
              Explore the platform
            </a>
          </div>

          <p className="gl-rise mt-8 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#A7ACB6]" style={{ animationDelay: '300ms' }}>
            <span className="h-1 w-1 rounded-full bg-[#E10600]" aria-hidden />
            Built on FastF1 &amp; OpenF1 timing data
          </p>
        </div>

        {/* Small-screen scene */}
        <div className="relative -mx-5 aspect-[16/9] overflow-hidden border-y border-[#24262B] sm:-mx-8 lg:hidden">
          <GarageScene className="h-full w-full" viewBox="440 215 760 428" />
        </div>

        {/* Telemetry overlays — real data from the snapshot session, labelled as such */}
        {/* Desktop: a row in the open floor above the pit box, so the car stays clear. */}
        <div className="lg:absolute lg:right-8 lg:top-8 lg:w-[min(52%,680px)]">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="gl-rise border border-[#24262B] bg-[#050505]/80 backdrop-blur-sm" style={{ animationDelay: '380ms' }}>
              <div className="flex items-center justify-between border-b border-[#24262B] px-3 py-2">
                <Tag tone="text">Race replay</Tag>
                <span className="font-mono text-[10px] text-[#C5C9D1] tabular-nums">LAP {SNAP.replay.lap}/{SNAP.session.total_laps}</span>
              </div>
              <div className="flex items-center gap-2 px-2 pt-1">
                <button
                  type="button"
                  onClick={() => replay.setPlaying(!replay.playing)}
                  aria-label={replay.playing ? 'Pause replay' : 'Play replay'}
                  className="flex h-7 w-7 shrink-0 items-center justify-center border border-[#24262B] text-[#F5F5F5] hover:border-[#C5C9D1] focus-visible:outline-2 focus-visible:outline-[#FF2D24]"
                >
                  {replay.playing ? (
                    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden><rect x="1" y="1" width="3" height="8" fill="currentColor" /><rect x="6" y="1" width="3" height="8" fill="currentColor" /></svg>
                  ) : (
                    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden><path d="M2 1l7 4-7 4z" fill="currentColor" /></svg>
                  )}
                </button>
                <TrackMap frame={replay.frame} showLabels={false} className="h-[96px] w-full" />
              </div>
              <div className="px-3 pb-2.5"><HistoricalBadge /></div>
            </div>

            <div className="gl-rise border border-[#24262B] bg-[#050505]/80 backdrop-blur-sm" style={{ animationDelay: '460ms' }}>
              <div className="flex items-center justify-between border-b border-[#24262B] px-3 py-2">
                <Tag tone="text">{C.a.code} / {C.b.code} · speed</Tag>
                <span className="font-mono text-[10px] text-[#C5C9D1]">fastest laps</span>
              </div>
              <svg viewBox="0 0 300 70" className="block h-[62px] w-full px-2 pt-2" preserveAspectRatio="none" aria-label={`Speed traces of ${C.a.code} and ${C.b.code} over one lap`} role="img">
                <path d={seriesD(C.speedB, 300, 64, 60, 340)} fill="none" stroke={COLOR_B} strokeWidth="1.2" strokeDasharray="3 2" vectorEffect="non-scaling-stroke" />
                <path className="gl-draw" d={seriesD(C.speedA, 300, 64, 60, 340)} fill="none" stroke={COLOR_A} strokeWidth="1.6" vectorEffect="non-scaling-stroke" pathLength={1} />
              </svg>
              <dl className="grid grid-cols-3 gap-2 border-t border-[#24262B] px-3 py-2 font-mono text-[11px] tabular-nums">
                <div><dt className="text-[9px] uppercase tracking-[0.14em] text-[#C5C9D1]">{C.a.code}</dt><dd style={{ color: COLOR_A }}>{fmtLap(C.a.lap_time)}</dd></div>
                <div><dt className="text-[9px] uppercase tracking-[0.14em] text-[#C5C9D1]">{C.b.code}</dt><dd className="text-[#E8E8EA]">{fmtLap(C.b.lap_time)}</dd></div>
                <div><dt className="text-[9px] uppercase tracking-[0.14em] text-[#C5C9D1]">Δ</dt><dd className="text-[#FF2D24]">+{(C.b.lap_time - C.a.lap_time).toFixed(3)}</dd></div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
