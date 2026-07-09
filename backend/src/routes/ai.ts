import { Router, Request, Response } from 'express';
import { askRaceEngineer } from '../services/gemini.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { Chat } from '../models/Chat.js';
import mongoose from 'mongoose';

const router = Router();

router.post('/ask', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const userIdString = req.user?.userId;
        if (!userIdString) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }

        const { prompt } = req.body;

        if (!prompt) {
            res.status(400).json({ error: 'Prompt is required' });
            return;
        }

        const answer = await askRaceEngineer(prompt);

        // Isolated try/catch for the DB save — a failure here shouldn't block the
        // user from getting their answer, just means this exchange won't persist.
        try {
            const userObjectId = new mongoose.Types.ObjectId(userIdString);
            const chatData = [
                { userId: userObjectId, text: prompt, role: 'user' },
                { userId: userObjectId, text: answer, role: 'ai' }
            ];

            const savedDocs = await Chat.insertMany(chatData);
            console.log(`✅ Successfully saved ${savedDocs.length} messages to MongoDB for user ${userIdString}`);
        } catch (dbError) {
            console.error('❌ DB SAVE FAILED:', dbError);
        }

        res.json({ answer });

    } catch (error) {
        console.error('❌ AI ROUTE ERROR:', error);
        // Surface the real reason (e.g. missing/invalid Gemini key, Gemini API
        // failure) instead of a generic message that hides what actually broke.
        res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to reach the Race Engineer.' });
    }
});

router.get('/history', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        // Safe check for the GET route too
        const userIdString = req.user?.userId;
        if (!userIdString) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }

        const history = await Chat.find({ userId: new mongoose.Types.ObjectId(userIdString) }).sort({ timestamp: 1 });
        res.json(history);
    } catch (error) {
        console.error('❌ Error fetching history:', error);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

export default router;