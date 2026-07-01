// import { Router, Request, Response } from 'express';
// import { askRaceEngineer } from '../services/gemini.js';

// const router = Router();

// router.post('/ask', async (req: Request, res: Response): Promise<void> => {
//   const { prompt } = req.body;

//   if (!prompt) {
//     res.status(400).json({ error: 'Prompt is required.' });
//     return;
//   }

//   try {
//     const answer = await askRaceEngineer(prompt);
//     res.json({ answer });
//   } catch (error: any) {
//     res.status(500).json({ error: error.message });
//   }
// });

// export default router;

import { Router, Request, Response } from 'express';
import { askRaceEngineer } from '../services/gemini.js';
import { getRaceContextById } from '../services/raceData.js';

const router = Router();

router.post('/ask', async (req: Request, res: Response): Promise<void> => {
    try {
        // Now expecting raceId from the frontend instead of raw context
        const { prompt, raceId } = req.body;

        if (!prompt) {
            res.status(400).json({ error: 'Prompt is required' });
            return;
        }

        let raceContext = undefined;

        // Dynamically fetch context if a raceId was provided
        if (raceId) {
            const fetchedData = await getRaceContextById(raceId);
            if (fetchedData) {
                raceContext = fetchedData;
            } else {
                console.warn(`Race ID ${raceId} not found in database. Proceeding without context.`);
            }
        }

        // Pass the dynamically fetched context to Gemini
        const answer = await askRaceEngineer(prompt, raceContext);
        
        res.json({ answer });
    } catch (error) {
        console.error('Error in AI route:', error);
        res.status(500).json({ error: 'Internal server error while fetching telemetry.' });
    }
});

export default router;