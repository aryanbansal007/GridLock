/** Standing note that data quirks originate upstream rather than in the app.
 *
 * Everything rendered from a session — the track outline, lap tables, telemetry
 * traces — is derived from whatever FastF1 exposes for that event, and the quality
 * of that feed genuinely varies between sessions: some return low-resolution
 * position data, some are missing a session entirely, some have gaps where a car's
 * signal dropped. Those show up as a rough-looking circuit or an absent view, and
 * without a word of explanation they read as bugs. Shown wherever raw session data
 * is displayed (Analysis, Simulator).
 *
 * `variant` only picks the surface it sits on: "panel" for the Simulator's dark
 * floating box, "page" for normal page background.
 */
export function DataSourceNote({
  variant = 'page',
  className = '',
}: {
  variant?: 'page' | 'panel';
  className?: string;
}) {
  const tone = variant === 'panel' ? 'text-neutral-500' : 'text-gray-600';

  return (
    <p className={`text-[10px] leading-relaxed font-mono ${tone} ${className}`}>
      Data via <span className={variant === 'panel' ? 'text-neutral-400' : 'text-gray-500'}>FastF1</span>,
      which reads the official F1 timing feed. Coverage varies by session — a circuit
      that looks rough, a missing view, or gaps in a car&apos;s trace come from the
      upstream data for that event, not from GridLock.
    </p>
  );
}
