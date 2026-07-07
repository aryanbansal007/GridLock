import { Router } from 'express';
import { generateRace, listRaces, getSchedule, listSessionDrivers, getDriverData, getTrackData, getLapsData, getConditionsData } from '../controllers/raceController.js';

const router = Router();

// Endpoint to trigger Python generation
router.post('/generate', generateRace);

// Endpoint to list all cached races
router.get('/list', listRaces);

// Per-driver telemetry endpoints
router.get('/data/:year/:gp/:session/drivers', listSessionDrivers);
router.get('/data/:year/:gp/:session/drivers/:abbr', getDriverData);
router.get('/data/:year/:gp/:session/track', getTrackData);
router.get('/data/:year/:gp/:session/laps', getLapsData);
router.get('/data/:year/:gp/:session/conditions', getConditionsData);

router.get('/schedule/:year', getSchedule);

export default router;