import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { registerUser } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
const router = Router();

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;

// Registration
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    const newUser = new User({ 
      username, 
      email, 
      password: hashedPassword 
    });
    
    await newUser.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ error: "Registration failed" });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // 1. Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // 2. Compare the hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // 3. Generate the JWT (The "Key")
    const token = jwt.sign(
      { userId: user._id,
        username: user.username
       }, 
      process.env.JWT_SECRET as string, 
      { expiresIn: '24h' }
    );

    // 4. Send the token back to the frontend
    res.json({ token, username: user.username });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
});

// Change display name — re-signs the JWT with the new username so the frontend
// can swap its stored token in place without forcing a full re-login.
router.patch('/username', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    const username = String(req.body.username ?? '').trim();
    if (!USERNAME_PATTERN.test(username)) {
      return res.status(400).json({ error: '3-20 characters: letters, numbers, and underscores only.' });
    }

    const taken = await User.findOne({ username, _id: { $ne: userId } });
    if (taken) {
      return res.status(409).json({ error: 'That username is already taken.' });
    }

    const user = await User.findByIdAndUpdate(userId, { username }, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET as string,
      { expiresIn: '24h' },
    );

    res.json({ username: user.username, token });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update username' });
  }
});

export default router;