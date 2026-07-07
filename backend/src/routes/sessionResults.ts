import { Router, Request, Response } from 'express';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { CACHE_DIR as BASE_CACHE_DIR, FASTF1_CACHE_DIR, SCRIPT_DIR, PYTHON_BIN } from '../config/paths.js';

const SCRIPT_PATH = path.join(SCRIPT_DIR, 'session_results.py');
const CACHE_DIR = path.join(BASE_CACHE_DIR, 'session_results');

const VALID_SESSIONS = new Set(['FP1', 'FP2', 'FP3', 'SQ', 'S', 'Q', 'R']);
const RACE_LIKE = new Set(['R', 'S']);

function cachePath(year: string, round: string, session: string) {
  return path.join(CACHE_DIR, year, round, `${session}.json`);
}

// A cache file written before `fastest_lap` was added to session_results.py lacks
// the key entirely and would otherwise be served forever as a stale hit — same
// "old cache predates a schema addition" problem raceService.ts's
// checkLapsHaveSegments solves for quali segment tags, same fix shape here.
function isCacheCurrent(target: string, session: string): boolean {
  if (!fs.existsSync(target)) return false;
  if (!RACE_LIKE.has(session)) return true;
  try {
    const json = JSON.parse(fs.readFileSync(target, 'utf-8'));
    return 'fastest_lap' in json;
  } catch {
    return false;
  }
}

// GET /api/session-results/:year/:round/:session
// Lightweight results (grid, finish position, points / quali times / best lap) for one
// session of one race weekend — generated on demand via session_results.py and cached,
// same pattern as the existing race-telemetry generator but far smaller/faster since it
// skips per-frame telemetry entirely.
const router = Router();

router.get('/:year/:round/:session', (req: Request, res: Response) => {
  const year = String(req.params.year);
  const round = String(req.params.round);
  const session = String(req.params.session).toUpperCase();

  if (!VALID_SESSIONS.has(session)) {
    return res.status(400).json({ error: `Invalid session "${session}". Expected one of: ${[...VALID_SESSIONS].join(', ')}` });
  }

  const target = cachePath(year, round, session);
  if (isCacheCurrent(target, session)) {
    // Session results only change if the underlying race is re-generated (rare) — safe
    // for a CDN/browser to cache briefly instead of hitting this route on every request.
    return res.sendFile(target, { headers: { 'Cache-Control': 'public, max-age=300' } });
  }

  const command = [
    `"${PYTHON_BIN}"`,
    `"${SCRIPT_PATH}"`,
    `--year ${year}`,
    `--round ${round}`,
    `--session ${session}`,
    `--cache-dir "${FASTF1_CACHE_DIR}"`,
  ].join(' ');

  exec(command, { cwd: SCRIPT_DIR, maxBuffer: 1024 * 1024 * 10, timeout: 60_000 }, (error, stdout, stderr) => {
    if (error) {
      console.error(`[session-results] ${year} R${round} ${session} failed: ${stderr || error.message}`);
      return res.status(502).json({ error: 'Could not load session results — the source data may not exist for this session yet.' });
    }
    try {
      const json = JSON.parse(stdout);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, JSON.stringify(json));
      res.setHeader('Cache-Control', 'public, max-age=300');
      res.json(json);
    } catch {
      res.status(502).json({ error: 'Invalid response from session data generator.' });
    }
  });
});

export default router;
