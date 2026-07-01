import { Router, Request, Response } from 'express';
import { askRaceEngineer } from '../services/gemini.js';
import { getRaceContextById } from '../services/raceData.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { Chat } from '../models/Chat.js'; // Import your Chat model
import { PaddockMessage } from '../models/PaddockMessage.js';

const router = Router();

router.get('/paddock-history', authenticateToken, async (req, res) => {
  try {
    // Fetch last 50 messages, oldest first
    const history = await PaddockMessage.find().sort({ timestamp: 1 }).limit(50);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch paddock history' });
  }
});

router.get('/history', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const history = await Chat.find({ userId }).sort({ timestamp: 1 });
        res.json(history);
    } catch (error) {
        console.error('Error fetching history:', error);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

export default router;
