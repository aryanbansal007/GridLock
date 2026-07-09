import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { CACHE_DIR, FASTF1_CACHE_DIR, SCRIPT_DIR, PYTHON_BIN } from '../config/paths.js';
import { pushCacheToRemote, pushFastF1CacheToRemote } from './dataRepoSync.js';

const SCRIPT_PATH = path.join(SCRIPT_DIR, 'full_race_generator.py');
export { CACHE_DIR };

// Per-driver telemetry files live in a `drivers/` subfolder, written by
// full_race_generator.py's write_driver_files().
export const checkDriverCache = (year: string, gp: string, session: string, abbr: string): string | null => {
    const safeGpName = gp.toLowerCase().replace(/ /g, "_");
    const safeSession = session.toUpperCase();
    const safeAbbr = abbr.toUpperCase();
    const targetFilePath = path.join(CACHE_DIR, year, safeGpName, safeSession, 'drivers', `${safeAbbr}.json`);
    return fs.existsSync(targetFilePath) ? targetFilePath : null;
};

// Small session-level track file (outline + bounds) written by write_track_file() —
// lets the Analysis lap-simulation render the track without per-driver telemetry.
export const checkTrackCache = (year: string, gp: string, session: string): string | null => {
    const safeGpName = gp.toLowerCase().replace(/ /g, "_");
    const safeSession = session.toUpperCase();
    const targetFilePath = path.join(CACHE_DIR, year, safeGpName, safeSession, 'track.json');
    return fs.existsSync(targetFilePath) ? targetFilePath : null;
};

// Session-wide flag/weather timeline (no per-driver telemetry), written by
// write_conditions_file() — lets the Live Simulator show track conditions/flag
// state without loading per-driver telemetry.
export const checkConditionsCache = (year: string, gp: string, session: string): string | null => {
    const safeGpName = gp.toLowerCase().replace(/ /g, "_");
    const safeSession = session.toUpperCase();
    const targetFilePath = path.join(CACHE_DIR, year, safeGpName, safeSession, 'conditions.json');
    return fs.existsSync(targetFilePath) ? targetFilePath : null;
};

// Session-wide lap tables for ALL drivers (lap/position/lap_time/compound/stint —
// no telemetry arrays), written by write_laps_file(). Powers the Position Chart
// without needing to download every driver's full per-driver telemetry file.
export const checkLapsCache = (year: string, gp: string, session: string): string | null => {
    const safeGpName = gp.toLowerCase().replace(/ /g, "_");
    const safeSession = session.toUpperCase();
    const targetFilePath = path.join(CACHE_DIR, year, safeGpName, safeSession, 'laps.json');
    return fs.existsSync(targetFilePath) ? targetFilePath : null;
};

// True if the session's laps.json carries Q1/Q2/Q3 segment tags. Used to detect
// quali sessions cached BEFORE segment tagging existed, so they get regenerated.
export const checkLapsHaveSegments = (year: string, gp: string, session: string): boolean => {
    const safeGpName = gp.toLowerCase().replace(/ /g, "_");
    const safeSession = session.toUpperCase();
    const lapsPath = path.join(CACHE_DIR, year, safeGpName, safeSession, 'laps.json');
    if (!fs.existsSync(lapsPath)) return false;
    try {
        const laps = JSON.parse(fs.readFileSync(lapsPath, 'utf-8')) as Record<string, { laps?: { segment?: number | null }[] }>;
        return Object.values(laps).some(d => (d.laps ?? []).some(l => l.segment != null));
    } catch {
        return false;
    }
};

export const getDriverManifest = (year: string, gp: string, session: string): Record<string, unknown> | null => {
    const safeGpName = gp.toLowerCase().replace(/ /g, "_");
    const safeSession = session.toUpperCase();
    const manifestPath = path.join(CACHE_DIR, year, safeGpName, safeSession, 'drivers', 'index.json');
    if (!fs.existsSync(manifestPath)) return null;
    try {
        return JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    } catch {
        return null;
    }
};

// Concurrent requests for the SAME race/session (e.g. two users opening the Simulator
// for the same race at once) share this one in-flight promise instead of each spawning
// their own multi-minute Python process and racing to write the same output files.
// Cleared once settled so a genuinely later request (re-generating stale cache) still
// triggers a fresh run rather than replaying a long-finished promise.
const inFlightGenerations = new Map<string, Promise<string>>();

export const runPythonGenerator = (year: string, gp: string, session: string): Promise<string> => {
    const key = `${year}_${gp.toLowerCase()}_${session.toLowerCase()}`;
    const existing = inFlightGenerations.get(key);
    if (existing) {
        console.log(`⏳ Reusing in-flight generation for ${key}`);
        return existing;
    }

    const promise = new Promise<string>((resolve, reject) => {
        // Pass --output-dir explicitly so Python writes to the exact same path
        // the check*Cache helpers below read from. Without this, the script
        // uses its own default which may differ depending on cwd.
        const command = [
            `"${PYTHON_BIN}"`,
            `"${SCRIPT_PATH}"`,
            `--year ${year}`,
            `--gp "${gp}"`,
            `--session ${session}`,
            `--output-dir "${CACHE_DIR}"`,
            `--cache-dir "${FASTF1_CACHE_DIR}"`,
        ].join(' ');

        console.log(`⏳ Executing: ${command}`);

        // Full telemetry generation is minutes-long — this gives real races margin
        // without letting a hung/stalled FastF1 fetch run indefinitely (there was
        // previously no timeout at all here). 25 minutes (not the original 10) because
        // on a cold container (FastF1's own raw-data cache wiped by a restart), just
        // fetching a full race's raw timing data from FastF1's servers over the
        // network — before any of our own processing even starts — was measured
        // taking most of 10 minutes on Render's free tier; the old timeout was
        // killing a legitimately-still-running fetch, not a hung one.
        // PYTHONUNBUFFERED forces Python's stdout/stderr to be unbuffered rather than
        // block-buffered (its default when not attached to a terminal, i.e. exactly
        // this exec() pipe). Without it, print() progress lines sit in Python's own
        // internal buffer and never reach us at all if the process is later killed
        // (e.g. by the timeout below) instead of exiting cleanly — we'd only ever see
        // whatever FastF1's own logging module happened to flush, with no way to tell
        // how much further our own script had actually gotten.
        const child = exec(command, {
            cwd: SCRIPT_DIR,
            maxBuffer: 1024 * 1024 * 50,
            timeout: 25 * 60_000,
            env: { ...process.env, PYTHONUNBUFFERED: '1' },
        }, (error, stdout, stderr) => {
            if (error) {
                // signal/code distinguish "Python raised an exception" (code set, no signal)
                // from "the process was killed from outside" (signal set, e.g. SIGKILL from an
                // OOM-killer) — stderr alone can't tell them apart since a killed process just
                // stops mid-log with no traceback, exactly like a clean run's progress output.
                console.error(`Error generating telemetry: ${error.message} (signal: ${error.signal ?? 'none'}, code: ${error.code ?? 'none'})`);
                console.error(`stderr: ${stderr}`);
                return reject(new Error(stderr || error.message));
            }
            console.log(`Python Output: ${stdout}`);
            pushCacheToRemote(`Add telemetry: ${year} ${gp} ${session}`);
            pushFastF1CacheToRemote(`Raw data for telemetry: ${year} ${gp} ${session}`);
            resolve(stdout);
        });

        // Stream progress live as it happens, tagged with the race key — the exec()
        // callback above only fires once at the very end, so without this there's no
        // way to see how far a long-running generation has actually gotten while it's
        // still in flight (which is exactly the visibility gap that made an earlier
        // 25-minute run look like it never got past "Finished loading data").
        child.stdout?.on('data', (chunk) => console.log(`[gen:${key}] ${String(chunk).trimEnd()}`));
        child.stderr?.on('data', (chunk) => console.log(`[gen:${key}] ${String(chunk).trimEnd()}`));
    });

    inFlightGenerations.set(key, promise);
    // .finally() returns its own derived promise chain, separate from the one below that's
    // actually returned to (and properly try/caught by) the caller. When `promise` rejects,
    // that rejection also propagates through THIS chain — and since nothing was observing it,
    // Node treated it as an unhandled rejection and crashed the entire process (confirmed live:
    // a failed generation on Render took down the whole backend, not just that one request).
    // The trailing .catch(() => {}) just marks this specific chain as handled; the real error
    // still surfaces normally to whoever awaited the returned `promise`.
    promise.finally(() => inFlightGenerations.delete(key)).catch(() => {});

    return promise;
};

export const getAvailableRaces = () => {
    const races: { year: string; gp: string; session: string }[] = [];
    if (!fs.existsSync(CACHE_DIR)) return races;

    for (const year of fs.readdirSync(CACHE_DIR)) {
        const yearPath = path.join(CACHE_DIR, year);
        if (!fs.statSync(yearPath).isDirectory()) continue;

        for (const gp of fs.readdirSync(yearPath)) {
            const gpPath = path.join(yearPath, gp);
            if (!fs.statSync(gpPath).isDirectory()) continue;

            for (const session of fs.readdirSync(gpPath)) {
                // drivers/index.json is written last-but-one by full_race_generator.py
                // (before conditions.json) and is the same completeness signal
                // generateRace's cache-hit check already relies on.
                const manifestPath = path.join(gpPath, session, 'drivers', 'index.json');
                if (fs.existsSync(manifestPath)) {
                    races.push({ year, gp, session });
                }
            };
        }
    }
    return races;
};
