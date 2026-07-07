import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { CACHE_DIR } from '../config/paths.js';

const router = Router();

// GET /api/season/:year/standings
// We define just the path suffix here, the '/api/season' prefix will be applied in your server.ts
router.get('/:year/standings', (req: Request, res: Response) => {
  const year = req.params.year as string;

  const filePath = path.join(CACHE_DIR, 'season', year, 'standings.json');

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error(`[GridLock Backend] Standings cache missing for year ${year}`);
      return res.status(404).json({
        error: `Telemetry data for the ${year} season has not been generated yet.`
      });
    }

    try {
      const jsonData = JSON.parse(data);
      // Standings only change on the hourly scheduler's cadence — safe for any CDN/browser
      // in front to cache for a few minutes instead of hitting this route on every request.
      res.setHeader('Cache-Control', 'public, max-age=300');
      res.json(jsonData);
    } catch (parseError) {
      console.error(`[GridLock Backend] Error parsing JSON for ${year}:`, parseError);
      res.status(500).json({ error: 'Corrupt telemetry cache file.' });
    }
  });
});

export default router;
