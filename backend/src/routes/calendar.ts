import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { CACHE_DIR } from '../config/paths.js';

const router = Router();

// GET /api/season/:year/calendar
router.get('/:year/calendar', (req: Request, res: Response) => {
  const year = req.params.year as string;
  const filePath = path.join(CACHE_DIR, 'season', year, 'calendar.json');

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error(`[GridLock Error] Calendar cache missing for year ${year}`);
      return res.status(404).json({ error: `Calendar data for ${year} not found.` });
    }

    try {
      const jsonData = JSON.parse(data);
      // Calendar only changes on the hourly scheduler's cadence — safe to cache briefly.
      res.setHeader('Cache-Control', 'public, max-age=300');
      res.json(jsonData);
    } catch (parseError) {
      console.error(`[GridLock Error] Error parsing calendar JSON for ${year}:`, parseError);
      res.status(500).json({ error: 'Corrupt calendar cache file.' });
    }
  });
});

export default router;
