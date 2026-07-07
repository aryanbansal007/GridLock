import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { checkDriverCache, checkTrackCache, checkLapsCache, checkConditionsCache, checkLapsHaveSegments, getDriverManifest, runPythonGenerator, getAvailableRaces } from '../services/raceService.js';
import { CACHE_DIR, SCRIPT_DIR, PYTHON_BIN } from '../config/paths.js';

export const generateRace = async (req: Request, res: Response) => {
    try {
        const year = String(req.body.year);
        const gp = String(req.body.gp);
        const session = String(req.body.session);
        const raceId = `${year}_${gp.toLowerCase().replace(/ /g, "_")}_${session.toLowerCase()}`;

        // A true cache hit requires the FULL analysis set: per-driver files
        // (drivers/index.json) + session laps.json + track.json + conditions.json.
        // Older caches were generated before some of these existed, so any missing
        // piece must still regenerate — otherwise the Analysis page's
        // generate-if-missing flow could never backfill them for an already-cached race.
        // Quali sessions must additionally carry Q1/Q2/Q3 segment tags to count as
        // complete — older caches predate segment tagging and would break the
        // Q1/Q2/Q3 analysis views, so they must regenerate.
        const isQuali = session === 'Q' || session === 'SQ';
        const hasManifest = getDriverManifest(year, gp, session) !== null;
        const complete = hasManifest
            && checkLapsCache(year, gp, session) !== null
            && checkTrackCache(year, gp, session) !== null
            && checkConditionsCache(year, gp, session) !== null
            && (!isQuali || checkLapsHaveSegments(year, gp, session));
        if (complete) {
            console.log(`⚡ Cache Hit: ${raceId}`);
            return res.json({ success: true, raceId, cached: true });
        }

        console.log(`⏳ Cache Miss${hasManifest ? ' (analysis files incomplete)' : ''}: Generating ${raceId}...`);
        await runPythonGenerator(year, gp, session);

        res.json({ success: true, raceId, cached: false });
    } catch (error: any) {
        // Log the full Python traceback server-side, but never forward it to the
        // client as-is — it's noisy and looks like a crash rather than a message.
        console.error(error);
        res.status(500).json({ error: friendlyGeneratorError(error?.message) });
    }
};

// A Python traceback ends with the actual exception line (e.g. "RuntimeError: ...").
// Surface just that, with the exception class name stripped, so the frontend can
// show a short human-readable reason instead of a wall of stack trace text.
function friendlyGeneratorError(rawMessage?: string): string {
    const fallback = "Failed to generate race telemetry. This session may not have complete data available on FastF1.";
    if (!rawMessage) return fallback;
    const lastLine = rawMessage.trim().split('\n').filter(Boolean).pop() ?? '';
    const cleaned = lastLine.replace(/^\w+(\.\w+)*(Error|Exception):\s*/, '').trim();
    if (!cleaned || cleaned.length > 200) return fallback;
    return cleaned;
}

export const listRaces = (req: Request, res: Response) => {
    const races = getAvailableRaces();
    res.json({ success: true, count: races.length, races });
};

// GET /api/races/data/:year/:gp/:session/drivers
// Returns the per-driver manifest (name/color/status/sample-count per driver) so a
// frontend driver-picker can list who's available without fetching any telemetry file.
export const listSessionDrivers = (req: Request, res: Response) => {
    const year = String(req.params.year);
    const gp = String(req.params.gp);
    const session = String(req.params.session);

    const manifest = getDriverManifest(year, gp, session);
    if (!manifest) {
        return res.status(404).json({ error: "No per-driver telemetry found for this session." });
    }
    res.json({ success: true, drivers: manifest });
};

// GET /api/races/data/:year/:gp/:session/drivers/:abbr
// Streams one driver's compact telemetry file.
export const getDriverData = (req: Request, res: Response) => {
    const year = String(req.params.year);
    const gp = String(req.params.gp);
    const session = String(req.params.session);
    const abbr = String(req.params.abbr);

    const driverPath = checkDriverCache(year, gp, session, abbr);
    if (!driverPath) {
        return res.status(404).json({ error: `No telemetry found for driver ${abbr} in this session.` });
    }

    res.setHeader('Content-Type', 'application/json');
    const stream = fs.createReadStream(driverPath);
    stream.on('error', () => res.status(500).json({ error: "Failed to read driver telemetry." }));
    stream.pipe(res);
};

// GET /api/races/data/:year/:gp/:session/track
// Streams the small session-level track file (outline + bounds) used by the
// Analysis lap-simulation to render the circuit without per-driver telemetry.
export const getTrackData = (req: Request, res: Response) => {
    const year = String(req.params.year);
    const gp = String(req.params.gp);
    const session = String(req.params.session);

    const trackPath = checkTrackCache(year, gp, session);
    if (!trackPath) {
        return res.status(404).json({ error: "No track file found for this session." });
    }

    res.setHeader('Content-Type', 'application/json');
    const stream = fs.createReadStream(trackPath);
    stream.on('error', () => res.status(500).json({ error: "Failed to read track data." }));
    stream.pipe(res);
};

// GET /api/races/data/:year/:gp/:session/conditions
// Streams the session-wide flag/weather timeline (no per-driver telemetry) —
// powers the Live Simulator's track-conditions display and flag banner.
export const getConditionsData = (req: Request, res: Response) => {
    const year = String(req.params.year);
    const gp = String(req.params.gp);
    const session = String(req.params.session);

    const conditionsPath = checkConditionsCache(year, gp, session);
    if (!conditionsPath) {
        return res.status(404).json({ error: "No conditions file found for this session." });
    }

    res.setHeader('Content-Type', 'application/json');
    const stream = fs.createReadStream(conditionsPath);
    stream.on('error', () => res.status(500).json({ error: "Failed to read conditions data." }));
    stream.pipe(res);
};

// GET /api/races/data/:year/:gp/:session/laps
// Streams the session-wide lap tables for ALL drivers (no telemetry arrays) —
// powers the Position Chart without downloading every driver's full telemetry file.
export const getLapsData = (req: Request, res: Response) => {
    const year = String(req.params.year);
    const gp = String(req.params.gp);
    const session = String(req.params.session);

    const lapsPath = checkLapsCache(year, gp, session);
    if (!lapsPath) {
        return res.status(404).json({ error: "No lap data found for this session." });
    }

    res.setHeader('Content-Type', 'application/json');
    const stream = fs.createReadStream(lapsPath);
    stream.on('error', () => res.status(500).json({ error: "Failed to read lap data." }));
    stream.pipe(res);
};

// Event schedules don't change intra-season — this was previously the only
// Python-invoking route with zero caching, re-exec'ing on literally every call.
// Cached the same check-file-then-exec way sessionResults.ts already does.
const SCHEDULE_SCRIPT_PATH = path.join(SCRIPT_DIR, 'get_schedule.py');
function scheduleCachePath(year: string) {
    return path.join(CACHE_DIR, 'schedule', `${year}.json`);
}

export const getSchedule = (req: Request, res: Response) => {
    const year = String(req.params.year);

    const target = scheduleCachePath(year);
    if (fs.existsSync(target)) {
        return res.sendFile(target, { headers: { 'Cache-Control': 'public, max-age=300' } });
    }

    const command = `"${PYTHON_BIN}" "${SCHEDULE_SCRIPT_PATH}" --year ${year}`;

    exec(command, { cwd: SCRIPT_DIR, timeout: 60_000 }, (error, stdout, stderr) => {
        if (error) {
            console.error(`Schedule Fetch Error: ${stderr}`);
            return res.status(500).json({ success: false, error: "Failed to fetch schedule" });
        }
        try {
            const json = JSON.parse(stdout);
            fs.mkdirSync(path.dirname(target), { recursive: true });
            fs.writeFileSync(target, JSON.stringify(json));
            res.setHeader('Cache-Control', 'public, max-age=300');
            res.json(json);
        } catch {
            res.status(500).json({ success: false, error: "Invalid Python output" });
        }
    });
};