import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { Chat } from '../models/Chat.js'; // Import your Chat model

const router = Router();

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
