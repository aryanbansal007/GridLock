import { Router, Request, Response } from 'express';
import { askRaceEngineerStream } from '../services/gemini.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { Chat } from '../models/Chat.js';
import mongoose from 'mongoose';

const router = Router();

// Streams the answer as plain text chunks as Gemini generates them (real
// streaming, not a fake typewriter effect) — the client reads the response
// body progressively instead of waiting for the whole answer before showing
// anything. Auth/validation failures still return a normal JSON error since
// they happen before any streaming starts; a failure mid-generation can't
// switch to a JSON response (headers are already sent), so it's appended to
// the stream as a visible error line instead.
router.post('/ask', authenticateToken, async (req: Request, res: Response): Promise<void> => {
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

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');

    let answer = '';
    try {
        answer = await askRaceEngineerStream(prompt, (chunk) => res.write(chunk));
    } catch (error) {
        console.error('❌ AI ROUTE ERROR:', error);
        const message = error instanceof Error ? error.message : 'Failed to reach the Race Engineer.';
        res.write(`\n\n⚠️ ${message}`);
        answer = answer || `⚠️ ${message}`;
    }

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

    res.end();
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