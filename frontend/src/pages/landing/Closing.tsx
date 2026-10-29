import { useNavigate } from 'react-router-dom';
import { SectionHead, Tag } from './parts';
import { useInView } from './hooks';

// Only what the pipeline really does (data_scripts/*_race_generator.py, the R2 publish
// workflow). No private feeds, no partnerships.
const STAGES = [
  {
    n: '01', title: 'Capture', body: 'FastF1 and OpenF1 retrieve the available public Formula 1 timing data for a session.',
    spec: ['Car data · ~3.7 Hz', 'Position x / y', 'Laps, stints, pit stops', 'Race control, weather'],
  },
  {
    n: '02', title: 'Process', body: 'The pipeline aligns every driver onto one shared timeline and track-distance axis.',
    spec: ['300 ms master timeline', 'Distance from integrated speed', '4,000-point track outline', 'Flags & weather per frame'],
  },
  {
    n: '03', title: 'Investigate', body: 'GridLock presents it as comparisons, race replay, visualizations and analysis tools.',
    spec: ['Telemetry comparison', 'Full race replay', 'Strategy & dominance', 'Race Engineer (soon)'],
  },
];

export function Pipeline() {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <section className="border-b border-[#24262B] py-20 md:py-28" aria-labelledby="pipeline-title">
      <div className="mx-auto max-w-[1320px] px-5 sm:px-8">
        <div id="pipeline-title">
          <SectionHead index="08" kicker="The data pipeline" title="From timing data to race intelligence." />
        </div>
        <div ref={ref} className="relative mt-12 grid gap-px border border-[#24262B] bg-[#24262B] md:grid-cols-3">
          {STAGES.map((s, i) => (
            <div key={s.n} className={`gl-reveal relative bg-[#0B0D10] p-6 sm:p-8 ${inView ? 'is-in' : ''}`} style={{ transitionDelay: `${i * 120}ms` }}>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[34px] font-bold leading-none tracking-[-0.04em] text-[#24262B]">{s.n}</span>
                {i < STAGES.length - 1 && (
                  <svg className="hidden md:block" width="48" height="12" viewBox="0 0 48 12" aria-hidden>
                    <line x1="0" y1="6" x2="40" y2="6" stroke="#E10600" strokeWidth="1.5" strokeDasharray="3 3" className="gl-flow" />
                    <path d="M40 1l7 5-7 5" fill="none" stroke="#E10600" strokeWidth="1.5" />
                  </svg>
                )}
              </div>
              <h3 className="mt-6 text-[20px] font-black tracking-[-0.02em] text-[#F5F5F5]">{s.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-[#C5C9D1]">{s.body}</p>
              <ul className="mt-6 space-y-1.5 border-t border-[#24262B] pt-4">
                {s.spec.map((t) => (
                  <li key={t} className="flex items-center gap-2 font-mono text-[11px] text-[#C9CCD1]">
                    <span className="h-1 w-1 bg-[#E10600]" aria-hidden />{t}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-4 max-w-2xl text-[12px] leading-relaxed text-[#A7ACB6]">
          Sources are public timing data via the open-source FastF1 and OpenF1 projects. GridLock has no access to team-internal telemetry and is not affiliated with Formula 1.
        </p>
      </div>
    </section>
  );
}

const STEPS = [
  { n: '1', title: 'Select a race session', body: 'Pick any generated race from the season calendar.' },
  { n: '2', title: 'Explore and compare', body: 'Overlay drivers, laps and channels on one distance axis.' },
  { n: '3', title: 'Replay and investigate', body: 'Run the race back, scrub to any moment and compare the drivers.' },
];

export function HowItWorks() {
  return (
    <section className="border-b border-[#24262B] bg-[#08090B] py-16 md:py-20" aria-labelledby="how-title">
      <div className="mx-auto max-w-[1320px] px-5 sm:px-8">
        <h2 id="how-title" className="sr-only">How it works</h2>
        <ol className="grid gap-8 md:grid-cols-3 md:gap-0">
          {STEPS.map((s, i) => (
            <li key={s.n} className={`md:px-8 ${i ? 'md:border-l md:border-[#24262B]' : 'md:pl-0'}`}>
              <Tag tone="red">Step {s.n}</Tag>
              <h3 className="mt-3 text-[18px] font-black tracking-[-0.02em] text-[#F5F5F5]">{s.title}</h3>
              <p className="mt-2 text-[14px] text-[#C5C9D1]">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function FinalCta() {
  const navigate = useNavigate();
  return (
    <section className="relative isolate overflow-hidden py-24 md:py-32" aria-labelledby="cta-title">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_80%_at_50%_120%,rgba(225,6,0,0.22),transparent_70%)]" />
      <div className="absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-[#E10600]/50 to-transparent" />
      <div className="mx-auto max-w-[900px] px-5 text-center sm:px-8">
        <Tag tone="red">Lights out</Tag>
        <h2 id="cta-title" className="mt-5 text-[clamp(2.2rem,5vw,3.75rem)] font-black leading-[1] tracking-[-0.04em] text-[#F5F5F5]">
          Your pit wall is waiting.
        </h2>
        <p className="mx-auto mt-5 max-w-md text-[15px] text-[#C5C9D1]">Explore Formula 1 through the data behind every lap.</p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="bg-[#E10600] px-8 py-4 text-[12px] font-black uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#FF2D24] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF2D24]"
          >
            Launch GridLock
          </button>
          <button type="button" onClick={() => navigate('/auth')} className="px-5 py-4 text-[12px] font-bold uppercase tracking-[0.14em] text-[#C5C9D1] hover:text-[#F5F5F5] focus-visible:outline-2 focus-visible:outline-[#FF2D24]">
            Log in
          </button>
        </div>
      </div>
    </section>
  );
}
