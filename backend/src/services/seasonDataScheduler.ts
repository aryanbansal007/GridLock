import { exec } from 'child_process';
import path from 'path';
import cron from 'node-cron';
import { CACHE_DIR as OUTPUT_DIR, FASTF1_CACHE_DIR, SCRIPT_DIR, PYTHON_BIN } from '../config/paths.js';

const SCRIPT_PATH = path.join(SCRIPT_DIR, 'generate_season_data.py');

// The app's active season — same constant used on the frontend (SEASON_YEAR in
// lib/f1.ts / TopNav.tsx). Only this year's calendar/standings actually change
// week to week, so it's the only one worth re-generating on a schedule.
const CURRENT_SEASON = process.env.CURRENT_SEASON || '2026';

function refreshSeasonData(): void {
  const command = `"${PYTHON_BIN}" "${SCRIPT_PATH}" --year ${CURRENT_SEASON} --output-dir "${OUTPUT_DIR}" --cache-dir "${FASTF1_CACHE_DIR}"`;
  console.log(`[season-scheduler] Refreshing ${CURRENT_SEASON} season data...`);

  exec(command, { cwd: SCRIPT_DIR, maxBuffer: 1024 * 1024 * 20, timeout: 10 * 60_000 }, (error, stdout, stderr) => {
    if (error) {
      console.error(`[season-scheduler] Refresh failed: ${stderr || error.message}`);
      return;
    }
    console.log(`[season-scheduler] Refreshed ${CURRENT_SEASON} season data.`);
  });
}

// Runs once immediately (so a fresh deploy doesn't wait up to an hour for current data),
// then every hour on the hour — cheap for a standings-only regeneration (no telemetry),
// and frequent enough that results settle in well within the "check back in a few hours"
// window shown on the frontend after a race finishes.
export function startSeasonDataScheduler(): void {
  refreshSeasonData();
  cron.schedule('0 * * * *', refreshSeasonData);
  console.log('[season-scheduler] Scheduled hourly season data refresh.');
}
