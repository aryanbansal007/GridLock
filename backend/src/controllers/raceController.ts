// import { Request, Response } from 'express';
// import { checkCache, runPythonGenerator, getAvailableRaces } from '../services/raceService.js';
// import fs from 'fs';

// export const generateRace = async (req: Request, res: Response) => {
//     try {
//         const { year, gp, session } = req.body;
//         const raceId = `${year}_${gp.toLowerCase().replace(/ /g, "_")}_${session.toLowerCase()}`;
        
//         const cachedPath = checkCache(year, gp, session);
//         if (cachedPath) {
//             console.log(`⚡ Cache Hit: ${raceId} found in backend cache.`);
//             return res.json({ success: true, raceId, cached: true });
//         }

//         console.log(`⏳ Cache Miss: Generating telemetry for ${raceId}...`);
//         await runPythonGenerator(year, gp, session);
        
//         res.json({ success: true, raceId, cached: false });
//     } catch (error) {
//         res.status(500).json({ error: "Failed to generate race data. Check backend logs." });
//     }
// };

// export const getRaceData = (req: Request, res: Response) => {
//     const { year, gp, session } = req.params;
//     const cachedPath = checkCache(year, gp, session);
    
//     if (cachedPath) {
//         const data = fs.readFileSync(cachedPath, 'utf-8');
//         res.setHeader('Content-Type', 'application/json');
//         res.send(data);
//     } else {
//         res.status(404).json({ error: "Race data not found in cache. Generate it first." });
//     }
// };

// export const listRaces = (req: Request, res: Response) => {
//     const races = getAvailableRaces();
//     res.json({ success: true, count: races.length, races });
// };

// import { Request, Response } from 'express';
// import { checkCache, runPythonGenerator, getAvailableRaces } from '../services/raceService.js';
// import fs from 'fs';

// export const generateRace = async (req: Request, res: Response) => {
//     try {
//         // Safely parse to string to satisfy TypeScript's strict typing
//         const year = String(req.body.year);
//         const gp = String(req.body.gp);
//         const session = String(req.body.session);
        
//         const raceId = `${year}_${gp.toLowerCase().replace(/ /g, "_")}_${session.toLowerCase()}`;
        
//         const cachedPath = checkCache(year, gp, session);
//         if (cachedPath) {
//             console.log(`⚡ Cache Hit: ${raceId} found in backend cache.`);
//             return res.json({ success: true, raceId, cached: true });
//         }

//         console.log(`⏳ Cache Miss: Generating telemetry for ${raceId}...`);
//         await runPythonGenerator(year, gp, session);
        
//         res.json({ success: true, raceId, cached: false });
//     } catch (error) {
//         res.status(500).json({ error: "Failed to generate race data. Check backend logs." });
//     }
// };

// export const getRaceData = (req: Request, res: Response) => {
//     // req.params can also trigger the string | string[] warning
//     const year = String(req.params.year);
//     const gp = String(req.params.gp);
//     const session = String(req.params.session);
    
//     const cachedPath = checkCache(year, gp, session);
    
//     if (cachedPath) {
//         const data = fs.readFileSync(cachedPath, 'utf-8');
//         res.setHeader('Content-Type', 'application/json');
//         res.send(data);
//     } else {
//         res.status(404).json({ error: "Race data not found in cache. Generate it first." });
//     }
// };

// export const listRaces = (req: Request, res: Response) => {
//     const races = getAvailableRaces();
//     res.json({ success: true, count: races.length, races });
// };

import { Request, Response } from 'express';
import { checkCache, runPythonGenerator, getAvailableRaces } from '../services/raceService.js';
import fs from 'fs';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generateRace = async (req: Request, res: Response) => {
    try {
        // Safely parse to string to satisfy TypeScript's strict typing
        const year = String(req.body.year);
        const gp = String(req.body.gp);
        const session = String(req.body.session);
        
        const raceId = `${year}_${gp.toLowerCase().replace(/ /g, "_")}_${session.toLowerCase()}`;
        
        const cachedPath = checkCache(year, gp, session);
        if (cachedPath) {
            console.log(`⚡ Cache Hit: ${raceId} found in backend cache.`);
            return res.json({ success: true, raceId, cached: true });
        }

        console.log(`⏳ Cache Miss: Generating telemetry for ${raceId}...`);
        await runPythonGenerator(year, gp, session);
        
        res.json({ success: true, raceId, cached: false });
    } catch (error) {
        res.status(500).json({ error: "Failed to generate race data. Check backend logs." });
    }
};

export const getRaceData = (req: Request, res: Response) => {
    // req.params can also trigger the string | string[] warning
    const year = String(req.params.year);
    const gp = String(req.params.gp);
    const session = String(req.params.session);
    
    const cachedPath = checkCache(year, gp, session);
    
    if (cachedPath) {
        const data = fs.readFileSync(cachedPath, 'utf-8');
        res.setHeader('Content-Type', 'application/json');
        res.send(data);
    } else {
        res.status(404).json({ error: "Race data not found in cache. Generate it first." });
    }
};

export const listRaces = (req: Request, res: Response) => {
    const races = getAvailableRaces();
    res.json({ success: true, count: races.length, races });
};

// --- NEW FUNCTION: Fetch Dynamic Schedule ---
export const getSchedule = (req: Request, res: Response) => {
    const year = String(req.params.year);
    
    // Adjust these paths to match your actual backend structure
    const SCRIPT_DIR = path.join(__dirname, '../../../data_scripts');
    const PYTHON_BIN = process.env.PYTHON_BIN || "/Users/heisenberg/Desktop/GridLock/data_scripts/venv/bin/python";
    const SCRIPT_PATH = path.join(SCRIPT_DIR, 'get_schedule.py');

    const command = `"${PYTHON_BIN}" "${SCRIPT_PATH}" --year ${year}`;

    exec(command, { cwd: SCRIPT_DIR }, (error, stdout, stderr) => {
        if (error) {
            console.error(`Schedule Fetch Error: ${stderr}`);
            return res.status(500).json({ success: false, error: "Failed to fetch schedule" });
        }
        try {
            const data = JSON.parse(stdout);
            res.json(data);
        } catch (parseError) {
            res.status(500).json({ success: false, error: "Invalid Python output" });
        }
    });
};