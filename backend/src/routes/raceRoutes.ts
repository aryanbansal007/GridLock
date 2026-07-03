import { Router } from 'express';
import { generateRace, getRaceData, listRaces, getSchedule } from '../controllers/raceController.js';

const router = Router();

// Endpoint to trigger Python generation
router.post('/generate', generateRace);

// Endpoint to list all cached races
router.get('/list', listRaces);

// Endpoint to serve the actual JSON data to the frontend simulator
router.get('/data/:year/:gp/:session', getRaceData);

router.get('/schedule/:year', getSchedule);

export default router;