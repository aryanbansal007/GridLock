import { Router } from 'express';
import { generateRace, listRaces, getSchedule, listSessionDrivers, getDriverData, getTrackData, getLapsData, getConditionsData, getQualiData, getRaceControlData, getRaceControlLog, getDocumentsIndex } from '../controllers/raceController.js';

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
router.get('/data/:year/:gp/:session/quali', getQualiData);
router.get('/data/:year/:gp/:session/race_control', getRaceControlData);
router.get('/data/:year/:gp/:session/race_control_log', getRaceControlLog);
router.get('/data/:year/:gp/documents', getDocumentsIndex);

router.get('/schedule/:year', getSchedule);

export default router;