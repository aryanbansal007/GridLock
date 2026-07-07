import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { CACHE_DIR, FASTF1_CACHE_DIR, SCRIPT_DIR, PYTHON_BIN } from '../config/paths.js';

const SCRIPT_PATH = path.join(SCRIPT_DIR, 'full_race_generator.py');
export { CACHE_DIR };

// Per-driver telemetry files live in a `drivers/` subfolder, written by
// full_race_generator.py's write_driver_files().
export const checkDriverCache = (year: string, gp: string, session: string, abbr: string): string | null => {
    const safeGpName = gp.toLowerCase().replace(/ /g, "_");
    const safeSession = session.toLowerCase();
    const safeAbbr = abbr.toUpperCase();
    const targetFilePath = path.join(CACHE_DIR, year, safeGpName, safeSession, 'drivers', `${safeAbbr}.json`);
    return fs.existsSync(targetFilePath) ? targetFilePath : null;
};

// Small session-level track file (outline + bounds) written by write_track_file() —
// lets the Analysis lap-simulation render the track without per-driver telemetry.
export const checkTrackCache = (year: string, gp: string, session: string): string | null => {
    const safeGpName = gp.toLowerCase().replace(/ /g, "_");
    const safeSession = session.toLowerCase();
    const targetFilePath = path.join(CACHE_DIR, year, safeGpName, safeSession, 'track.json');
    return fs.existsSync(targetFilePath) ? targetFilePath : null;
};

// Session-wide flag/weather timeline (no per-driver telemetry), written by
// write_conditions_file() — lets the Live Simulator show track conditions/flag
// state without loading per-driver telemetry.
export const checkConditionsCache = (year: string, gp: string, session: string): string | null => {
    const safeGpName = gp.toLowerCase().replace(/ /g, "_");
    const safeSession = session.toLowerCase();
    const targetFilePath = path.join(CACHE_DIR, year, safeGpName, safeSession, 'conditions.json');
    return fs.existsSync(targetFilePath) ? targetFilePath : null;
};

// Session-wide lap tables for ALL drivers (lap/position/lap_time/compound/stint —
// no telemetry arrays), written by write_laps_file(). Powers the Position Chart
// without needing to download every driver's full per-driver telemetry file.
export const checkLapsCache = (year: string, gp: string, session: string): string | null => {
    const safeGpName = gp.toLowerCase().replace(/ /g, "_");
    const safeSession = session.toLowerCase();
    const targetFilePath = path.join(CACHE_DIR, year, safeGpName, safeSession, 'laps.json');
    return fs.existsSync(targetFilePath) ? targetFilePath : null;
};

// True if the session's laps.json carries Q1/Q2/Q3 segment tags. Used to detect
// quali sessions cached BEFORE segment tagging existed, so they get regenerated.
export const checkLapsHaveSegments = (year: string, gp: string, session: string): boolean => {
    const safeGpName = gp.toLowerCase().replace(/ /g, "_");
    const safeSession = session.toLowerCase();
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
    const safeSession = session.toLowerCase();
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

        // Full telemetry generation is minutes-long — 10 minutes gives real races
        // margin without letting a hung/stalled FastF1 fetch run indefinitely
        // (there was previously no timeout at all here).
        exec(command, { cwd: SCRIPT_DIR, maxBuffer: 1024 * 1024 * 50, timeout: 10 * 60_000 }, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error generating telemetry: ${error.message}`);
                console.error(`stderr: ${stderr}`);
                return reject(new Error(stderr || error.message));
            }
            console.log(`Python Output: ${stdout}`);
            resolve(stdout);
        });
    });

    inFlightGenerations.set(key, promise);
    promise.finally(() => inFlightGenerations.delete(key));

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
